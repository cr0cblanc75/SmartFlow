/**
 * Dijkstra avec horaires réels
 * ============================
 *
 * Calcule l'itinéraire le plus rapide dans un réseau de transport à partir :
 *   - d'un graphe orienté (graph.json)
 *   - d'un fichier d'horaires (timetable.json)
 *
 * Le coût réel d'une arête est calculé dynamiquement :
 *
 *      temps d'attente du prochain véhicule
 *    + temps de trajet (edge.weight)
 *
 * Les correspondances ("transfer") sont parcourues immédiatement sans attente.
 *
 * ---------------------------------------------------------------------------
 * Dépendances
 * ---------------------------------------------------------------------------
 *
 * Ce module nécessite :
 *
 *   - graph.json
 *       Structure du réseau :
 *         - nodes
 *         - edges
 *         - informations des lignes
 *
 *   - timetable.json
 *       Horaires GTFS déjà convertis en secondes.
 *       Format :
 *         timetable[stopId][routeId] = [departure1, departure2, ...]
 *
 *   - minimist
 *       Utilisé uniquement par le mode CLI.
 *
 * Installation :
 *
 *      npm install minimist
 *
 * ---------------------------------------------------------------------------
 * Recherche d'arrêts
 * ---------------------------------------------------------------------------
 *
 * findStopsByName() recherche un arrêt par nom avec plusieurs niveaux
 * de précision :
 *
 *   1. correspondance exacte
 *   2. commence par
 *   3. contient
 *   4. recherche approximative (distance de Levenshtein)
 *
 * Les niveaux ne sont jamais mélangés afin d'éviter qu'une recherche
 * approximative remplace un résultat exact.
 *
 * Une fois l'arrêt choisi (ID connu), il est recommandé d'utiliser les
 * fonctions "...ByIds" afin d'éviter toute ambiguïté.
 *
 * ---------------------------------------------------------------------------
 * Fonctions principales
 * ---------------------------------------------------------------------------
 *
 * ► Recherche à partir d'une heure de départ
 *
 *      findPathTimed(...)
 *
 * ► Recherche à partir d'une heure d'arrivée
 *
 *      findPathTimedArrival(...)
 *
 * ► Même recherche avec IDs déjà résolus
 *
 *      findPathTimedByIds(...)
 *      findPathTimedArrivalByIds(...)
 *
 * ► Recherche d'arrêts
 *
 *      findStopsByName(...)
 *
 * ► Outils réseau
 *
 *      buildAdjacency(...)
 *      buildUndirectedAdjacency(...)
 *      getConnectedComponents(...)
 *      isConnected(...)
 *      buildNetworkTree(...)
 *
 * ---------------------------------------------------------------------------
 * Exemples (module)
 * ---------------------------------------------------------------------------
 *
 * const {
 *   findPathTimed,
 *   findPathTimedArrival,
 *   findPathTimedByIds,
 *   findPathTimedArrivalByIds,
 *   findStopsByName
 * } = require("./dijkstra_timed");
 *
 * // Départ à 08:30
 * const result = findPathTimed(
 *   graph,
 *   timetable,
 *   "Châtelet",
 *   "Nation",
 *   {
 *     departureTime: "08:30"
 *   }
 * );
 *
 * // Arriver avant 09:00
 * const result = findPathTimedArrival(
 *   graph,
 *   timetable,
 *   "Châtelet",
 *   "Nation",
 *   {
 *     arrivalTime: "09:00"
 *   }
 * );
 *
 * // Version PMR
 * const result = findPathTimed(
 *   graph,
 *   timetable,
 *   "Châtelet",
 *   "Nation",
 *   {
 *     departureTime: "08:30",
 *     wheelchair: true
 *   }
 * );
 *
 * // Recherche d'arrêt
 * const stops = findStopsByName(graph.nodes, "Chatelet");
 *
 * // Une fois les IDs connus
 * const result = findPathTimedByIds(
 *   graph,
 *   timetable,
 *   stops[0].id,
 *   destinationId,
 *   {
 *     departureTime: "08:30"
 *   }
 * );
 *
 * ---------------------------------------------------------------------------
 * Utilisation CLI
 * ---------------------------------------------------------------------------
 *
 * Départ à une heure donnée :
 *
 *   node dijkstra_timed.js "Chatelet" "Nation" --time 08:30
 *
 * Arriver avant une heure :
 *
 *   node dijkstra_timed.js "Chatelet" "Nation" --arrive 09:00
 *
 * Version PMR :
 *
 *   node dijkstra_timed.js "Chatelet" "Nation" --time 08:30 --wheelchair
 *
 * Routage sans ambiguïté (IDs déjà connus) :
 *
 *   node dijkstra_timed.js --fromId STOP_A --toId STOP_B --time 08:30
 *
 *   node dijkstra_timed.js --fromId STOP_A --toId STOP_B --arrive 09:00
 */

// ─── MinHeap ──────────────────────────────────────────────────────────────────

class MinHeap {
    constructor() {
        this.heap = [];
    }

    push(item) {
        this.heap.push(item);
        this._bubbleUp(this.heap.length - 1);
    }

    pop() {
        const top = this.heap[0];
        const last = this.heap.pop();
        if (this.heap.length > 0) {
            this.heap[0] = last;
            this._sinkDown(0);
        }
        return top;
    }

    get size() {
        return this.heap.length;
    }

    _bubbleUp(i) {
        while (i > 0) {
            const parent = Math.floor((i - 1) / 2);
            if (this.heap[parent].cost <= this.heap[i].cost) break;
            [this.heap[parent], this.heap[i]] = [this.heap[i], this.heap[parent]];
            i = parent;
        }
    }

    _sinkDown(i) {
        const n = this.heap.length;
        while (true) {
            let smallest = i;
            const l = 2 * i + 1,
                r = 2 * i + 2;
            if (l < n && this.heap[l].cost < this.heap[smallest].cost) smallest = l;
            if (r < n && this.heap[r].cost < this.heap[smallest].cost) smallest = r;
            if (smallest === i) break;
            [this.heap[smallest], this.heap[i]] = [this.heap[i], this.heap[smallest]];
            i = smallest;
        }
    }
}

// ─── Normalisation ────────────────────────────────────────────────────────────
function normalize(str) {
    return str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}

// ─── Distance de Levenshtein (tolerance aux fautes de frappe) ─────────────────
function levenshteinDistance(a, b) {
    if (a === b) return 0;
    const m = a.length,
        n = b.length;
    if (m === 0) return n;
    if (n === 0) return m;

    let prev = new Array(n + 1);
    let curr = new Array(n + 1);
    for (let j = 0; j <= n; j++) prev[j] = j;

    for (let i = 1; i <= m; i++) {
        curr[0] = i;
        for (let j = 1; j <= n; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            curr[j] = Math.min(
                prev[j] + 1, // suppression
                curr[j - 1] + 1, // insertion
                prev[j - 1] + cost, // substitution
            );
        }
        [prev, curr] = [curr, prev];
    }

    return prev[n];
}

// Tolerance par defaut : proportionnelle a la longueur du nom recherche,
// plafonnee pour ne jamais matcher n'importe quoi sur un nom court.
function defaultFuzzyTolerance(query) {
    return Math.max(1, Math.min(3, Math.floor(query.length * 0.3)));
}

// ─── Recherche arrets par nom ──────────────────────────────────────────────────
// Priorite : exact > commence par > contient > proche (fautes de frappe)
// Chaque palier n'est utilise que si le precedent n'a rien donne, pour ne
// jamais melanger un arret exact avec un arret trouve par approximation.
function findStopsByName(nodes, name, options = {}) {
    const query = normalize(name);

    const exact = nodes.filter((n) => normalize(n.name) === query);
    if (exact.length > 0) return exact;

    const startsWith = nodes.filter((n) => normalize(n.name).startsWith(query));
    if (startsWith.length > 0) return startsWith;

    const contains = nodes.filter((n) => normalize(n.name).includes(query));
    if (contains.length > 0) return contains;

    return findStopsByFuzzyName(nodes, query, options.maxDistance);
}

// Dernier recours : tolere une marge d'erreur (fautes de frappe, lettres
// manquantes/en trop). Ne garde que les arrets les plus proches de la
// requete pour eviter de confondre deux stations differentes.
function findStopsByFuzzyName(nodes, normalizedQuery, maxDistance) {
    const tolerance = maxDistance ?? defaultFuzzyTolerance(normalizedQuery);
    let bestDistance = Infinity;
    const matches = [];

    for (const node of nodes) {
        const distance = levenshteinDistance(normalizedQuery, normalize(node.name));
        if (distance > tolerance) continue;
        if (distance < bestDistance) bestDistance = distance;
        matches.push({ node, distance });
    }

    return matches.filter((m) => m.distance === bestDistance).map((m) => m.node);
}

// ─── HH:MM -> secondes ────────────────────────────────────────────────────────
// Convention horaire GTFS : les courses de nuit continuent au-dela de minuit
// sur la meme journee de service (24:00, 25:30, ...) plutot que de repartir
// a 00:00. Une heure saisie sous ce seuil (ex: "00:05") designe donc toujours
// la continuation de la soiree en cours, jamais le tout debut d'une nouvelle
// journee : on la decale de +24h pour rester coherente avec timetable.json.
const NIGHT_ROLLOVER_HOUR = 4;

function timeToSeconds(t) {
    if (!t) return 0;
    const parts = t.trim().split(":");
    let h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    const s = parseInt(parts[2], 10) || 0;
    if (h < NIGHT_ROLLOVER_HOUR) h += 24;
    return h * 3600 + m * 60 + s;
}

// ─── Formatage ────────────────────────────────────────────────────────────────
function formatDuration(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}min`;
    if (m > 0) return `${m}min ${s}s`;
    return `${s}s`;
}

function formatTime(seconds) {
    const h = Math.floor(seconds / 3600) % 24;
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ─── Recherche binaire : prochain depart >= afterSec ──────────────────────────
function nextDeparture(departures, afterSec) {
    if (!departures || departures.length === 0) return null;
    let lo = 0,
        hi = departures.length - 1;
    while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (departures[mid] < afterSec) lo = mid + 1;
        else hi = mid;
    }
    return departures[lo] >= afterSec ? departures[lo] : null;
}

// ─── Construction liste d'adjacence ───────────────────────────────────────────
function buildAdjacency(graph) {
    const adj = {};
    for (const node of graph.nodes) adj[node.id] = [];
    for (const edge of graph.edges) {
        if (!edge) continue;
        if (!adj[edge.from]) adj[edge.from] = [];
        adj[edge.from].push(edge);
    }

    return adj;
}
// ─── Recherche de chemin (heure de depart ou d'arrivee) ────────────────────────
function findPathFinal(graph, timetable, fromName, toName, options = {}) {
    const { departureTime = null, arrivalTime = null, wheelchair = false } = options;

    if (departureTime) {
        return findPathTimed(graph, timetable, fromName, toName, { departureTime, wheelchair });
    }

    if (arrivalTime) {
        return findPathTimedArrival(graph, timetable, fromName, toName, { arrivalTime, wheelchair });
    }

    throw new Error("Veuillez renseigner au moins une heure de depart ou d'arrivee.");
}

// ─── Analyse du reseau (independant des horaires) ─────────────────────────────
function buildUndirectedAdjacency(graph) {
    const adj = {};
    for (const node of graph.nodes) adj[node.id] = new Set();
    for (const edge of graph.edges) {
        if (!adj[edge.from]) adj[edge.from] = new Set();
        if (!adj[edge.to]) adj[edge.to] = new Set();
        adj[edge.from].add(edge.to);
        adj[edge.to].add(edge.from);
    }
    return adj;
}

function getConnectedComponents(graph) {
    const adj = buildUndirectedAdjacency(graph);
    const visited = new Set();
    const components = [];

    for (const node of graph.nodes) {
        const id = node.id;
        if (visited.has(id)) continue;

        const component = [];
        const queue = [id];
        visited.add(id);

        while (queue.length > 0) {
            const current = queue.shift();
            component.push(current);
            for (const neighbor of adj[current]) {
                if (!visited.has(neighbor)) {
                    visited.add(neighbor);
                    queue.push(neighbor);
                }
            }
        }

        components.push(component);
    }

    return components;
}

function isConnected(graph) {
    return getConnectedComponents(graph).length === 1;
}

function buildNetworkTree(graph, rootId) {
    const adj = buildUndirectedAdjacency(graph);
    const visited = new Set([rootId]);
    const queue = [rootId];
    const tree = {};

    while (queue.length > 0) {
        const current = queue.shift();
        tree[current] = [];

        for (const neighbor of adj[current] || []) {
            if (!visited.has(neighbor)) {
                visited.add(neighbor);
                queue.push(neighbor);
                tree[current].push(neighbor);
            }
        }
    }

    return tree;
}

// ─── Reconstruction des etapes ────────────────────────────────────────────────
function buildSteps(pathNodes, nodeMap) {
    if (pathNodes.length < 2) return [];

    const steps = [];
    let current = null;

    for (let i = 0; i < pathNodes.length - 1; i++) {
        const hop = pathNodes[i].hopToNext;
        const from = nodeMap[pathNodes[i].id];
        const to = nodeMap[pathNodes[i + 1].id];

        if (!hop) continue;

        if (!current || current.route_id !== hop.route_id || current.mode !== hop.mode) {
            if (current) steps.push(current);
            current = {
                type: hop.mode === "transfer" ? "correspondance" : "trajet",
                mode: hop.mode,
                route_id: hop.route_id || null,
                route_short_name: hop.route_short_name || null,
                color: hop.color || null,
                text_color: hop.text_color || null,
                from: { id: from.id, name: from.name },
                to: { id: to.id, name: to.name },
                stops: [{ id: from.id, name: from.name, time: formatTime(pathNodes[i].currentSec) }],
                departure_time: hop.boardingSec != null ? formatTime(hop.boardingSec) : null,
                wait_sec: hop.waitSec || 0,
                travel_sec: hop.travelSec || 0,
                duration: 0,
                nb_stops: 0,
            };
        }

        current.to = { id: to.id, name: to.name };
        current.duration += (hop.waitSec || 0) + (hop.travelSec || 0);
        current.nb_stops += 1;
        current.stops.push({ id: to.id, name: to.name, time: formatTime(pathNodes[i + 1].currentSec) });
    }

    if (current) steps.push(current);

    return steps.map((s) => ({
        ...s,
        duration_formatted: formatDuration(s.duration),
        wait_formatted: s.wait_sec > 0 ? formatDuration(s.wait_sec) : null,
    }));
}

// ─── Dijkstra timed multi-source ──────────────────────────────────────────────
function dijkstraTimed(adj, nodeMap, timetable, fromIds, toIds, startSec, wheelchair) {
    const dist = {};
    const prev = {};
    const visited = new Set();

    for (const id of Object.keys(nodeMap)) dist[id] = Infinity;

    const heap = new MinHeap();

    for (const id of fromIds) {
        if (wheelchair && nodeMap[id]?.wheelchair === false) continue;
        dist[id] = startSec;
        heap.push({ cost: startSec, id, currentSec: startSec });
    }

    let bestToId = null;

    while (heap.size > 0) {
        const { cost, id, currentSec } = heap.pop();

        if (visited.has(id)) continue;
        visited.add(id);

        if (toIds.has(id)) {
            bestToId = id;
            break;
        }

        for (const edge of adj[id] || []) {
            if (wheelchair && edge.wheelchair === false) continue;
            if (wheelchair && nodeMap[edge.to]?.wheelchair === false) continue;

            let waitSec = 0;
            let boardSec = currentSec;

            // Pour les trajets en vehicule, on cherche le prochain depart
            if (edge.mode !== "transfer") {
                const stopTimes = timetable[id];
                const routeDeps = stopTimes ? stopTimes[edge.route_id] : null;
                const nextDep = nextDeparture(routeDeps, currentSec);

                // Pas de prochain depart -> on skip cette arete
                if (nextDep === null) continue;

                waitSec = nextDep - currentSec;
                boardSec = nextDep;
            }

            const travelSec = edge.weight;
            const arrivalAtNext = boardSec + travelSec;
            const newCost = arrivalAtNext;

            if (newCost < dist[edge.to]) {
                dist[edge.to] = newCost;
                prev[edge.to] = {
                    nodeId: id,
                    hop: {
                        mode: edge.mode,
                        route_id: edge.route_id,
                        route_short_name: edge.route_short_name,
                        color: edge.color,
                        text_color: edge.text_color,
                        boardingSec: boardSec,
                        waitSec,
                        travelSec,
                    },
                    currentSec: arrivalAtNext,
                };
                heap.push({ cost: newCost, id: edge.to, currentSec: arrivalAtNext });
            }
        }
    }

    if (!bestToId) return null;

    // Reconstruction
    const pathNodes = [];
    let current = bestToId;
    while (prev[current]) {
        const { nodeId, hop, currentSec } = prev[current];
        pathNodes.unshift({ id: current, hopToNext: null, hopFromPrev: hop, currentSec });
        current = nodeId;
    }
    pathNodes.unshift({ id: current, hopToNext: null, hopFromPrev: null, currentSec: startSec });
    for (let i = 0; i < pathNodes.length - 1; i++) {
        pathNodes[i].hopToNext = pathNodes[i + 1].hopFromPrev;
    }

    const steps = buildSteps(pathNodes, nodeMap);
    const totalDuration = dist[bestToId] - startSec;
    const nbCorrespondances = steps.filter((s) => s.type === "correspondance").length;

    return {
        from: nodeMap[current],
        to: nodeMap[bestToId],
        departure_time: formatTime(startSec),
        arrival_time: formatTime(dist[bestToId]),
        total_duration: totalDuration,
        total_duration_formatted: formatDuration(totalDuration),
        nb_stops: pathNodes.length - 1,
        nb_correspondances: nbCorrespondances,
        wheelchair_accessible: wheelchair,
        steps,
        raw_path: pathNodes.map((n) => n.id),
    };
}

// ─── findPathTimed ────────────────────────────────────────────────────────────
export function findPathTimed(graph = graph, timetable = timetable, fromName, toName, options = {}) {
    const { departureTime = "08:00", wheelchair = false } = options;

    const nodeMap = {};
    for (const node of graph.nodes) nodeMap[node.id] = node;

    let fromCandidates = findStopsByName(graph.nodes, fromName);
    let toCandidates = findStopsByName(graph.nodes, toName);

    if (fromCandidates.length === 0) throw new Error(`Aucun arret trouve pour : "${fromName}"`);
    if (toCandidates.length === 0) throw new Error(`Aucun arret trouve pour : "${toName}"`);

    if (wheelchair) {
        fromCandidates = fromCandidates.filter((s) => s.wheelchair !== false);
        toCandidates = toCandidates.filter((s) => s.wheelchair !== false);
    }

    const fromIds = fromCandidates.map((s) => s.id);
    const toIds = new Set(toCandidates.map((s) => s.id));
    const startSec = timeToSeconds(departureTime);

    console.log(`Depart  : ${fromCandidates.length} arret(s) pour "${fromName}"`);
    console.log(`Arrivee : ${toCandidates.length} arret(s) pour "${toName}"`);
    console.log(`Heure   : ${departureTime}\n`);

    const adj = buildAdjacency(graph);
    return dijkstraTimed(adj, nodeMap, timetable, fromIds, toIds, startSec, wheelchair);
}

// ─── findPathTimedByIds ────────────────────────────────────────────────────────
// A utiliser une fois qu'un arret precis a ete choisi (ex: apres disambiguation
// via findStopsByName) : on route uniquement sur les IDs fournis, sans repasser
// par la recherche par nom, pour ne jamais confondre deux arrets differents.
// fromId/toId acceptent un seul ID ou un tableau d'IDs (ex: plusieurs quais
// d'une meme station deja identifiee).
function findPathTimedByIds(graph, timetable, fromId, toId, options = {}) {
    const { departureTime = "08:00", wheelchair = false } = options;

    const nodeMap = {};
    for (const node of graph.nodes) nodeMap[node.id] = node;

    const fromIds = Array.isArray(fromId) ? fromId : [fromId];
    const toIds = Array.isArray(toId) ? toId : [toId];

    for (const id of fromIds) {
        if (!nodeMap[id]) throw new Error(`Aucun arret trouve pour l'ID de depart : "${id}"`);
    }
    for (const id of toIds) {
        if (!nodeMap[id]) throw new Error(`Aucun arret trouve pour l'ID d'arrivee : "${id}"`);
    }

    const startSec = timeToSeconds(departureTime);
    const adj = buildAdjacency(graph);
    return dijkstraTimed(adj, nodeMap, timetable, fromIds, new Set(toIds), startSec, wheelchair);
}

// ─── Exports ──────────────────────────────────────────────────────────────────
// ─── Recherche binaire : dernier depart <= beforeSec ──────────────────────────
function lastDeparture(departures, beforeSec) {
    if (!departures || departures.length === 0) return null;
    let lo = 0,
        hi = departures.length - 1;
    while (lo < hi) {
        const mid = (lo + hi + 1) >> 1;
        if (departures[mid] > beforeSec) hi = mid - 1;
        else lo = mid;
    }
    return departures[lo] <= beforeSec ? departures[lo] : null;
}

// ─── Dijkstra inverse (heure d'arrivee souhaitee) ─────────────────────────────
function dijkstraTimedReverse(adj, nodeMap, timetable, fromIds, toIds, arrivalSec, wheelchair) {
    // Construction du graphe inverse : to -> from
    const adjReverse = {};
    for (const id of Object.keys(nodeMap)) adjReverse[id] = [];
    for (const id of Object.keys(adj)) {
        for (const edge of adj[id]) {
            if (!adjReverse[edge.to]) adjReverse[edge.to] = [];
            adjReverse[edge.to].push({ ...edge, from: edge.to, to: id });
        }
    }

    // dist[id] = heure de depart maximale connue pour arriver a temps
    const dist = {};
    const prev = {};
    const visited = new Set();

    for (const id of Object.keys(nodeMap)) dist[id] = -Infinity;

    const heap = new MinHeap(); // on utilise -heure pour simuler un MaxHeap

    for (const id of toIds) {
        if (wheelchair && nodeMap[id]?.wheelchair === false) continue;
        dist[id] = arrivalSec;
        heap.push({ cost: -arrivalSec, id, currentSec: arrivalSec });
    }

    let bestFromId = null;

    while (heap.size > 0) {
        const { cost, id, currentSec } = heap.pop();

        if (visited.has(id)) continue;
        visited.add(id);

        if (fromIds.has(id)) {
            bestFromId = id;
            break;
        }

        for (const edge of adjReverse[id] || []) {
            if (wheelchair && edge.wheelchair === false) continue;
            if (wheelchair && nodeMap[edge.to]?.wheelchair === false) continue;

            let boardSec;

            if (edge.mode !== "transfer") {
                // On cherche le dernier depart depuis edge.to qui permet d'arriver a temps
                const stopTimes = timetable[edge.to];
                const routeDeps = stopTimes ? stopTimes[edge.route_id] : null;
                // Le train doit partir au plus tard a currentSec - travelSec
                const latestDep = lastDeparture(routeDeps, currentSec - edge.weight);
                if (latestDep === null) continue;
                boardSec = latestDep;
            } else {
                // Transfer : on remonte simplement du temps de correspondance
                boardSec = currentSec - edge.weight;
                // Avant minuit (temps negatif), aucune donnee horaire ne couvre ce
                // depart dans ce modele mono-journee : on ecarte l'arete plutot que
                // de propager un temps de depart negatif/corrompu.
                if (boardSec < 0) continue;
            }

            if (boardSec > dist[edge.to]) {
                dist[edge.to] = boardSec;
                prev[edge.to] = {
                    nodeId: id,
                    hop: {
                        mode: edge.mode,
                        route_id: edge.route_id,
                        route_short_name: edge.route_short_name,
                        color: edge.color,
                        text_color: edge.text_color,
                        boardingSec: boardSec,
                        waitSec: 0,
                        travelSec: edge.weight,
                    },
                    currentSec: boardSec,
                };
                heap.push({ cost: -boardSec, id: edge.to, currentSec: boardSec });
            }
        }
    }

    if (!bestFromId) return null;

    // Dans le Dijkstra inversé, prev[A] = { nodeId: B } signifie qu'on va de A vers B
    // On reconstruit la chaine depuis bestFromId jusqu'a un noeud destination
    // en suivant prev dans l'ordre normal (depart -> arrivee)
    const rawPath = []; // [ { id, currentSec, hop } ]
    let cur = bestFromId;
    while (prev[cur]) {
        const { nodeId, hop, currentSec } = prev[cur];
        rawPath.push({ id: cur, currentSec: dist[cur], hop });
        cur = nodeId;
    }
    rawPath.push({ id: cur, currentSec: arrivalSec, hop: null });

    // rawPath est dans le bon sens : depart en premier, arrivee en dernier
    const pathNodes = rawPath.map((n, i) => ({
        id: n.id,
        currentSec: n.currentSec,
        hopToNext: i < rawPath.length - 1 ? rawPath[i].hop : null,
    }));

    // Calcul des temps d'attente
    for (let i = 0; i < pathNodes.length - 1; i++) {
        const hop = pathNodes[i].hopToNext;
        if (hop && hop.mode !== "transfer") {
            hop.waitSec = Math.max(0, hop.boardingSec - pathNodes[i].currentSec);
        }
    }

    const steps = buildSteps(pathNodes, nodeMap);
    const totalDuration = arrivalSec - dist[bestFromId];
    const nbCorrespondances = steps.filter((s) => s.type === "correspondance").length;

    return {
        from: nodeMap[pathNodes[0].id],
        to: nodeMap[pathNodes[pathNodes.length - 1].id],
        departure_time: formatTime(dist[bestFromId]),
        arrival_time: formatTime(arrivalSec),
        total_duration: totalDuration,
        total_duration_formatted: formatDuration(totalDuration),
        nb_stops: pathNodes.length - 1,
        nb_correspondances: nbCorrespondances,
        wheelchair_accessible: wheelchair,
        steps,
        raw_path: pathNodes.map((n) => n.id),
    };
}

// ─── findPathTimedArrival ─────────────────────────────────────────────────────
/**
 * Trouve le trajet qui permet d'arriver a destination avant arrivalTime
 * en partant le plus tard possible.
 *
 * @param {Object} graph
 * @param {Object} timetable
 * @param {string} fromName
 * @param {string} toName
 * @param {Object} options
 *   @param {string}  options.arrivalTime  - heure d'arrivee souhaitee (HH:MM)
 *   @param {boolean} options.wheelchair
 */
function findPathTimedArrival(graph, timetable, fromName, toName, options = {}) {
    const { arrivalTime = "09:00", wheelchair = false } = options;

    const nodeMap = {};
    for (const node of graph.nodes) nodeMap[node.id] = node;

    let fromCandidates = findStopsByName(graph.nodes, fromName);
    let toCandidates = findStopsByName(graph.nodes, toName);

    if (fromCandidates.length === 0) throw new Error(`Aucun arret trouve pour : "${fromName}"`);
    if (toCandidates.length === 0) throw new Error(`Aucun arret trouve pour : "${toName}"`);

    if (wheelchair) {
        fromCandidates = fromCandidates.filter((s) => s.wheelchair !== false);
        toCandidates = toCandidates.filter((s) => s.wheelchair !== false);
    }

    const fromIds = new Set(fromCandidates.map((s) => s.id));
    const toIds = toCandidates.map((s) => s.id);
    const arrivalSec = timeToSeconds(arrivalTime);

    console.log(`Depart  : ${fromCandidates.length} arret(s) pour "${fromName}"`);
    console.log(`Arrivee : ${toCandidates.length} arret(s) pour "${toName}"`);
    console.log(`Arriver avant : ${arrivalTime}\n`);

    const adj = buildAdjacency(graph);
    return dijkstraTimedReverse(adj, nodeMap, timetable, fromIds, toIds, arrivalSec, wheelchair);
}

// ─── findPathTimedArrivalByIds ─────────────────────────────────────────────────
// Equivalent de findPathTimedArrival mais sur des IDs deja resolus, pour router
// sans ambiguite une fois l'arret precis choisi.
function findPathTimedArrivalByIds(graph, timetable, fromId, toId, options = {}) {
    const { arrivalTime = "09:00", wheelchair = false } = options;

    const nodeMap = {};
    for (const node of graph.nodes) nodeMap[node.id] = node;

    const fromIds = Array.isArray(fromId) ? fromId : [fromId];
    const toIds = Array.isArray(toId) ? toId : [toId];

    for (const id of fromIds) {
        if (!nodeMap[id]) throw new Error(`Aucun arret trouve pour l'ID de depart : "${id}"`);
    }
    for (const id of toIds) {
        if (!nodeMap[id]) throw new Error(`Aucun arret trouve pour l'ID d'arrivee : "${id}"`);
    }

    const arrivalSec = timeToSeconds(arrivalTime);
    const adj = buildAdjacency(graph);
    return dijkstraTimedReverse(adj, nodeMap, timetable, new Set(fromIds), toIds, arrivalSec, wheelchair);
}

// ─── CLI ──────────────────────────────────────────────────────────────────────

/**
 * @param {Object} params
 * @param {any} params.graph
 * @param {any} params.timetable
 * @param {string} params.fromName
 * @param {string} params.toName
 * @param {string|null} [params.fromId]
 * @param {string|null} [params.toId]
 * @param {string|null} [params.departureTime]
 * @param {string|null} [params.arrivalTime]
 * @param {boolean} [params.wheelchair]
 */
export function mainClc({ graph, timetable, fromName, toName, fromId = null, toId = null, departureTime = null, arrivalTime = null, wheelchair = false, debug = true }) {
    if (!departureTime && !arrivalTime) {
        throw new Error("Vous devez fournir une heure de départ (departureTime) ou d'arrivée (arrivalTime)");
    }

    const start = performance.now();
    let result;

    if (fromId && toId) {
        if (arrivalTime) {
            result = findPathTimedArrivalByIds(graph, timetable, fromId, toId, {
                arrivalTime,
                wheelchair,
            });
        } else {
            result = findPathTimedByIds(graph, timetable, fromId, toId, {
                departureTime,
                wheelchair,
            });
        }
    } else if (arrivalTime) {
        result = findPathTimed(graph, timetable, fromName, toName, {
            arrivalTime,
            wheelchair,
        });
    } else {
        result = findPathTimed(graph, timetable, fromName, toName, {
            departureTime,
            wheelchair,
        });
    }

    const elapsed = Math.round(performance.now() - start);

    if (!result) return null;

    const formatted = {
        elapsed,
        from: result.from.name,
        to: result.to.name,
        departureTime: result.departure_time,
        arrivalTime: result.arrival_time,
        totalDuration: result.total_duration_formatted,
        nbCorrespondances: result.nb_correspondances,
        nbStops: result.nb_stops,
        steps: result.steps.map((step) => {
            if (step.type === "correspondance") {
                return {
                    type: "correspondance",
                    from: step.from.name,
                    to: step.to.name,
                    duration: step.duration_formatted,
                };
            }

            return {
                type: "transport",
                line: step.route_short_name || null,
                mode: step.mode,
                from: step.from.name,
                to: step.to.name,
                departure: step.departure_time,
                wait: step.wait_formatted,
                waitSec: step.wait_sec,
                travel: formatDuration(step.travel_sec),
                travelSec: step.travel_sec,
                nbStops: step.nb_stops,
            };
        }),
    };

    // ─────────────────────────────────────────────
    // PRINT MODE (optionnel)
    // ─────────────────────────────────────────────
    if (debug) {
        console.log(`------------------------------------------------------ Chemin trouve en ${elapsed}ms\n`);

        console.log(`${result.from.name} -> ${result.to.name}`);
        console.log(`Depart          : ${result.departure_time}`);
        console.log(`Arrivee estimee : ${result.arrival_time}`);
        console.log(`Duree totale    : ${result.total_duration_formatted}`);
        console.log(`Correspondances : ${result.nb_correspondances}`);
        console.log(`Nombre d'arrets : ${result.nb_stops}`);
        console.log("\nDetail du trajet :\n");

        let displayIndex = 1;

        result.steps.forEach((step) => {
            if (step.type === "correspondance") {
                console.log(`  [${displayIndex++}] Correspondance - ${step.from.name} -> ${step.to.name} (${step.duration_formatted})`);
            } else {
                const ligne = step.route_short_name ? `Direction <${step.route_short_name}>` : step.mode;

                if (step.wait_sec > 0) {
                    console.log(`  [${displayIndex++}] Attente a ${step.from.name} - ${step.wait_formatted}`);
                }

                console.log(`  [${displayIndex++}] ${ligne} (${step.mode}) - ${step.from.name} -> ${step.to.name} - ${step.nb_stops} arret(s) - Depart ${step.departure_time} - Trajet ${formatDuration(step.travel_sec)}`);
            }
        });
    }

    return formatted;
}
