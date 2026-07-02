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

const { calculerEmpreinteTroncon, calculerDistanceParTemps, FE_REFERENCE_SALE_G_PAR_KM } = require("./eco_calculator");

const SMARTFLOW_DEFAULT_ALPHA = 0.5;
const SMARTFLOW_DEFAULT_BETA = 0.5;
const TEMPS_MAX_COURONNE_MIN = 90; // minutes
// Part de temps toujours prise en compte, meme a alpha = 0. Sans ce plancher, un
// beta = 1 pur rend les troncons ferres quasi gratuits (cout ~ 0) et Dijkstra n'a
// plus aucun signal pour preferer un trajet direct a un trajet qui boucle sur le
// reseau : c'est ce qui produisait les itineraires de 50 km / 2h10 absurdes.
const MIN_TEMPS_WEIGHT = 0.05;
const MAX_TRANSFER_SEC = 30 * 60; // 30 minutes
// Toutes les etiquettes de mode representant un troncon pietonnier / une
// correspondance dans le graphe. "transfer" reste la valeur canonique utilisee
// en interne (buildSteps, etc.) ; les autres sont des synonymes toleres cote
// donnees. AVANT ce fix, seul "transfer" etait reconnu partout dans le fichier :
// une arete etiquetee "walk"/"correspondance"/"foot" echappait au plafond de
// MAX_TRANSFER_SEC et etait facturee comme un trajet en bus par erreur.
const WALK_MODES = new Set(["transfer", "walk", "correspondance", "foot"]);

function isWalkMode(mode) {
    return WALK_MODES.has(mode);
}

function computeSmartflowEdgeCost(edge, nodeA, nodeB, waitSec, travelSec, alpha = SMARTFLOW_DEFAULT_ALPHA, beta = SMARTFLOW_DEFAULT_BETA) {
    if (isWalkMode(edge.mode) && travelSec > MAX_TRANSFER_SEC) {
        return Infinity;
    }

    const totalSec = waitSec + travelSec;
    const tempsMinutes = totalSec / 60;
    const tempsCost = tempsMinutes / TEMPS_MAX_COURONNE_MIN;

    // co2Cost est un RATIO de propretee du mode (emission du mode / emission
    // d'un bus de reference), pas des grammes bruts divises par un plafond
    // arbitraire. Avantages :
    //  - il est independant de la distance de l'arete (train sur 1 km ou
    //    50 km : meme ratio ~0.03), donc pas d'effet de seuil lie a la taille
    //    des troncons du graphe ;
    //  - il reste dans la meme plage de grandeur que tempsCost (~0 a ~1 par
    //    arete), donc alpha et beta ont un effet vraiment progressif sur tout
    //    l'intervalle [0, 1] au lieu de saturer des beta = 0.3-0.5 ;
    //  - la distance influe quand meme sur le cout total via tempsCost
    //    (un troncon plus long prend aussi plus de temps).
    let co2Cost = 0;
    if (nodeA && nodeB && !isWalkMode(edge.mode)) {
        const eco = calculerEmpreinteTroncon(nodeA, nodeB, edge.mode);
        const feTotal = eco.details.feExploitation + eco.details.feFabrication;
        co2Cost = feTotal / FE_REFERENCE_SALE_G_PAR_KM;
    }

    const effectiveAlpha = Math.max(alpha, MIN_TEMPS_WEIGHT);
    const cost = (effectiveAlpha * tempsCost) + (beta * co2Cost);

    return Math.max(0, cost);
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
    const totalMinutes = Math.max(0, Math.round(seconds / 60));
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    if (h > 0) return `${h}h ${m}min`;
    return `${m}min`;
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
                type: isWalkMode(hop.mode) ? "correspondance" : "trajet",
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

function calculateEcoMetricsForSteps(steps, nodeMap) {
    let totalCo2 = 0;
    let totalDistance = 0;

    for (const step of steps) {
        const fromNode = nodeMap[step.from.id];
        const toNode = nodeMap[step.to.id];

        if (isWalkMode(step.mode)) {
            const distanceKm = calculerDistanceParTemps(step.travel_sec || 0);
            step.distance_km = Number(distanceKm.toFixed(3));
            step.co2_grams = 0;
            step.co2_details = { mode: "transfer", reason: "piéton / correspondance" };
            totalDistance += step.distance_km;
        } else {
            const eco = calculerEmpreinteTroncon(fromNode, toNode, step.mode);
            step.distance_km = Number(eco.distanceKm.toFixed(3));
            step.co2_grams = Number(eco.co2Grams.toFixed(2));
            step.co2_details = eco.details;
            totalDistance += step.distance_km;
            totalCo2 += step.co2_grams;
        }

        if (!Number.isFinite(step.distance_km)) step.distance_km = 0;
        if (!Number.isFinite(step.co2_grams)) step.co2_grams = 0;
    }

    return {
        total_co2_grams: Number(totalCo2.toFixed(2)),
        total_distance_km: Number(totalDistance.toFixed(3)),
    };
}

// ─── Dijkstra timed multi-source ──────────────────────────────────────────────
function dijkstraTimed(adj, nodeMap, timetable, fromIds, toIds, startSec, wheelchair, alpha = SMARTFLOW_DEFAULT_ALPHA, beta = SMARTFLOW_DEFAULT_BETA) {
    const dist = {};
    const prev = {};
    const visited = new Set();

    for (const id of Object.keys(nodeMap)) dist[id] = Infinity;

    const heap = new MinHeap();

    for (const id of fromIds) {
        if (wheelchair && nodeMap[id]?.wheelchair === false) continue;
        dist[id] = startSec;
        heap.push({ cost: startSec, id, currentSec: startSec, walkStreakSec: 0 });
    }

    let bestToId = null;

    while (heap.size > 0) {
        const { cost, id, currentSec, walkStreakSec } = heap.pop();

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
            const edgeIsWalk = isWalkMode(edge.mode);

            // Pour les trajets en vehicule, on cherche le prochain depart
            if (!edgeIsWalk) {
                const stopTimes = timetable[id];
                const routeDeps = stopTimes ? stopTimes[edge.route_id] : null;
                const nextDep = nextDeparture(routeDeps, currentSec);

                // Pas de prochain depart -> on skip cette arete
                if (nextDep === null) continue;

                waitSec = nextDep - currentSec;
                boardSec = nextDep;
            }

            // Une "correspondance" peut etre representee par plusieurs aretes
            // "transfer" consecutives dans le graphe. Le plafond de 30 min doit
            // s'appliquer a la marche cumulee depuis la derniere montee en
            // vehicule, pas a chaque arete individuellement : sinon une chaine
            // de petites aretes marchables (chacune < 30 min) peut representer
            // plusieurs heures de marche sans jamais etre rejetee.
            const newWalkStreak = edgeIsWalk ? walkStreakSec + edge.weight : 0;
            if (edgeIsWalk && newWalkStreak > MAX_TRANSFER_SEC) continue;

            const travelSec = edge.weight;
            const arrivalAtNext = boardSec + travelSec;
            const costEdge = computeSmartflowEdgeCost(edge, nodeMap[id], nodeMap[edge.to], waitSec, travelSec, alpha, beta);
            const newCost = cost + costEdge;

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
                heap.push({ cost: newCost, id: edge.to, currentSec: arrivalAtNext, walkStreakSec: newWalkStreak });
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
    const arrivalSec = pathNodes[pathNodes.length - 1].currentSec;
    const totalDuration = arrivalSec - startSec;
    const nbCorrespondances = steps.filter((s) => s.type === "correspondance").length;
    const ecoMetrics = calculateEcoMetricsForSteps(steps, nodeMap);

    return {
        from: nodeMap[current],
        to: nodeMap[bestToId],
        departure_time: formatTime(startSec),
        arrival_time: formatTime(arrivalSec),
        total_duration: totalDuration,
        total_duration_formatted: formatDuration(totalDuration),
        total_distance_km: ecoMetrics.total_distance_km,
        total_co2_grams: ecoMetrics.total_co2_grams,
        nb_stops: pathNodes.length - 1,
        nb_correspondances: nbCorrespondances,
        wheelchair_accessible: wheelchair,
        steps,
        raw_path: pathNodes.map((n) => n.id),
    };
}

// ─── findPathTimed ────────────────────────────────────────────────────────────
function findPathTimed(graph, timetable, fromName, toName, options = {}) {
    const { departureTime = "08:00", wheelchair = false, alpha = SMARTFLOW_DEFAULT_ALPHA, beta = SMARTFLOW_DEFAULT_BETA } = options;

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
    return dijkstraTimed(adj, nodeMap, timetable, fromIds, toIds, startSec, wheelchair, alpha, beta);
}

// ─── findPathTimedByIds ────────────────────────────────────────────────────────
// A utiliser une fois qu'un arret precis a ete choisi (ex: apres disambiguation
// via findStopsByName) : on route uniquement sur les IDs fournis, sans repasser
// par la recherche par nom, pour ne jamais confondre deux arrets differents.
// fromId/toId acceptent un seul ID ou un tableau d'IDs (ex: plusieurs quais
// d'une meme station deja identifiee).
function findPathTimedByIds(graph, timetable, fromId, toId, options = {}) {
    const { departureTime = "08:00", wheelchair = false, alpha = SMARTFLOW_DEFAULT_ALPHA, beta = SMARTFLOW_DEFAULT_BETA } = options;

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
    return dijkstraTimed(adj, nodeMap, timetable, fromIds, new Set(toIds), startSec, wheelchair, alpha, beta);
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
function dijkstraTimedReverse(adj, nodeMap, timetable, fromIds, toIds, arrivalSec, wheelchair, alpha = SMARTFLOW_DEFAULT_ALPHA, beta = SMARTFLOW_DEFAULT_BETA) {
    // Construction du graphe inverse : to -> from
    const adjReverse = {};
    for (const id of Object.keys(nodeMap)) adjReverse[id] = [];
    for (const id of Object.keys(adj)) {
        for (const edge of adj[id]) {
            if (!adjReverse[edge.to]) adjReverse[edge.to] = [];
            adjReverse[edge.to].push({ ...edge, from: edge.to, to: id });
        }
    }

    // dist[id] = cout minimal cumule (alpha*temps + beta*CO2) connu pour rallier
    // ce noeud jusqu'a l'arrivee, en respectant l'heure d'arrivee souhaitee.
    // AVANT ce fix, dist[id] stockait l'heure de depart maximale et le heap
    // ordonnait uniquement par heure : alpha/beta n'etaient jamais consultes,
    // donc une recherche par heure d'arrivee ignorait totalement le CO2.
    const dist = {};
    // boardTimeAt[id] = heure de depart (en secondes) associee au meilleur cout
    // connu pour ce noeud. Separee de dist[] maintenant que dist[] porte un cout
    // et non plus une heure (necessaire pour la reconstruction et l'affichage).
    const boardTimeAt = {};
    const prev = {};
    const visited = new Set();

    for (const id of Object.keys(nodeMap)) dist[id] = Infinity;

    const heap = new MinHeap();

    for (const id of toIds) {
        if (wheelchair && nodeMap[id]?.wheelchair === false) continue;
        dist[id] = 0;
        boardTimeAt[id] = arrivalSec;
        heap.push({ cost: 0, id, currentSec: arrivalSec, walkStreakSec: 0 });
    }

    let bestFromId = null;

    while (heap.size > 0) {
        const { cost, id, currentSec, walkStreakSec } = heap.pop();

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
            const edgeIsWalk = isWalkMode(edge.mode);

            if (!edgeIsWalk) {
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

            // Meme logique que dans dijkstraTimed : plafonner la marche cumulee,
            // pas arete par arete (voir commentaire equivalent plus haut).
            const newWalkStreak = edgeIsWalk ? walkStreakSec + edge.weight : 0;
            if (edgeIsWalk && newWalkStreak > MAX_TRANSFER_SEC) continue;

            const travelSec = edge.weight;
            // nodeMap[edge.to] / nodeMap[id] : edge a deja ete retourne (from/to
            // inverses) lors de la construction d'adjReverse, donc "edge.to" ici
            // designe bien le point de depart reel du troncon et "id" son arrivee.
            const edgeCost = computeSmartflowEdgeCost(edge, nodeMap[edge.to], nodeMap[id], 0, travelSec, alpha, beta);
            const newCost = cost + edgeCost;

            if (newCost < dist[edge.to]) {
                dist[edge.to] = newCost;
                boardTimeAt[edge.to] = boardSec;
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
                        travelSec,
                    },
                    currentSec: boardSec,
                };
                heap.push({ cost: newCost, id: edge.to, currentSec: boardSec, walkStreakSec: newWalkStreak });
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
        rawPath.push({ id: cur, currentSec: boardTimeAt[cur], hop });
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
        if (hop && !isWalkMode(hop.mode)) {
            hop.waitSec = Math.max(0, hop.boardingSec - pathNodes[i].currentSec);
        }
    }

    const steps = buildSteps(pathNodes, nodeMap);
    const totalDuration = arrivalSec - boardTimeAt[bestFromId];
    const nbCorrespondances = steps.filter((s) => s.type === "correspondance").length;
    const ecoMetrics = calculateEcoMetricsForSteps(steps, nodeMap);

    return {
        from: nodeMap[pathNodes[0].id],
        to: nodeMap[pathNodes[pathNodes.length - 1].id],
        departure_time: formatTime(boardTimeAt[bestFromId]),
        arrival_time: formatTime(arrivalSec),
        total_duration: totalDuration,
        total_duration_formatted: formatDuration(totalDuration),
        total_distance_km: ecoMetrics.total_distance_km,
        total_co2_grams: ecoMetrics.total_co2_grams,
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
    const { arrivalTime = "09:00", wheelchair = false, alpha = SMARTFLOW_DEFAULT_ALPHA, beta = SMARTFLOW_DEFAULT_BETA } = options;

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
    return dijkstraTimedReverse(adj, nodeMap, timetable, fromIds, toIds, arrivalSec, wheelchair, alpha, beta);
}

// ─── findPathTimedArrivalByIds ─────────────────────────────────────────────────
// Equivalent de findPathTimedArrival mais sur des IDs deja resolus, pour router
// sans ambiguite une fois l'arret precis choisi.
function findPathTimedArrivalByIds(graph, timetable, fromId, toId, options = {}) {
    const { arrivalTime = "09:00", wheelchair = false, alpha = SMARTFLOW_DEFAULT_ALPHA, beta = SMARTFLOW_DEFAULT_BETA } = options;

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
    return dijkstraTimedReverse(adj, nodeMap, timetable, new Set(fromIds), toIds, arrivalSec, wheelchair, alpha, beta);
}

module.exports = {
    findPathTimed,
    findPathTimedArrival,
    findPathTimedByIds,
    findPathTimedArrivalByIds,
    findStopsByName,
    buildAdjacency,
    buildUndirectedAdjacency,
    getConnectedComponents,
    isConnected,
    buildNetworkTree,
};

// ─── CLI ──────────────────────────────────────────────────────────────────────
if (require.main === module) {
    const minimist = require("minimist");
    const args = minimist(process.argv.slice(2));
    const [fromName, toName] = args._;
    const wheelchair = !!args.wheelchair;
    const departureTime = args.time || null;
    const arrivalTime = args.arrive || null;
    const alpha = typeof args.alpha !== "undefined" ? Number(args.alpha) : SMARTFLOW_DEFAULT_ALPHA;
    const beta = typeof args.beta !== "undefined" ? Number(args.beta) : SMARTFLOW_DEFAULT_BETA;
    const fromId = args.fromId || null;
    const toId = args.toId || null;

    if (!departureTime && !arrivalTime) {
        console.log('Usage : node dijkstra_timed.js "Depart" "Arrivee" --time HH:MM [--wheelchair] [--alpha 0.5] [--beta 0.5]');
        console.log('        node dijkstra_timed.js "Depart" "Arrivee" --arrive HH:MM [--wheelchair] [--alpha 0.5] [--beta 0.5]');
        console.log("        node dijkstra_timed.js --fromId <id> --toId <id> --time HH:MM [--alpha 0.5] [--beta 0.5]   (route sans ambiguite)");
        console.log('Ex    : node dijkstra_timed.js "Chatelet" "Nation" --time 08:30 --alpha 0.5 --beta 0.5');
        console.log('Ex    : node dijkstra_timed.js "Chatelet" "Nation" --arrive 09:00 --alpha 0.2 --beta 0.8');
        process.exit(0);
    }

    console.log("Chargement du graphe...");
    const graph = require("./graph.json");

    console.log("Chargement des horaires...");
    const timetable = require("./timetable.json");

    console.log(`${graph.nodes.length} sommets | ${Object.keys(timetable).length} arrets avec horaires\n`);

    const start = Date.now();
    let result;
    try {
        if (fromId && toId) {
            // Arrets deja identifies (ex: apres disambiguation via findStopsByName) :
            // on route directement sur les IDs, sans repasser par la recherche par nom.
            if (arrivalTime) {
                console.log(`Recherche : "${fromId}" -> "${toId}" arriver avant ${arrivalTime}\n`);
                result = findPathTimedArrivalByIds(graph, timetable, fromId, toId, { arrivalTime, wheelchair, alpha, beta });
            } else {
                console.log(`Recherche : "${fromId}" -> "${toId}" a ${departureTime}\n`);
                result = findPathTimedByIds(graph, timetable, fromId, toId, { departureTime, wheelchair, alpha, beta });
            }
        } else if (arrivalTime) {
            console.log(`Recherche : "${fromName}" -> "${toName}" arriver avant ${arrivalTime}\n`);
            result = findPathTimedArrival(graph, timetable, fromName, toName, { arrivalTime, wheelchair, alpha, beta });
        } else {
            console.log(`Recherche : "${fromName}" -> "${toName}" a ${departureTime}\n`);
            result = findPathTimed(graph, timetable, fromName, toName, { departureTime, wheelchair, alpha, beta });
        }
    } catch (err) {
        console.error("Erreur :", err.message);
        process.exit(1);
    }

    const elapsed = Date.now() - start;

    if (!result) {
        console.log("Aucun chemin trouve.");
        process.exit(0);
    }

    console.log(`Chemin trouve en ${elapsed}ms\n`);
    console.log(`${result.from.name} -> ${result.to.name}`);
    console.log(`Depart          : ${result.departure_time}`);
    console.log(`Arrivee estimee : ${result.arrival_time}`);
    console.log(`Duree totale    : ${result.total_duration_formatted}`);
    console.log(`Distance totale : ${result.total_distance_km.toFixed(3)} km`);
    console.log(`Empreinte CO2   : ${result.total_co2_grams.toFixed(2)} g`);
    console.log(`Correspondances : ${result.nb_correspondances}`);
    console.log(`Nombre d'arrets : ${result.nb_stops}`);
    console.log("\nDetail du trajet :\n");

    let displayIndex = 1;
    result.steps.forEach((step) => {
        if (step.type === "correspondance") {
            console.log(`  [${displayIndex++}] Correspondance - ${step.from.name} -> ${step.to.name} (${step.duration_formatted})`);
        } else {
            const ligne = step.route_short_name ? `Ligne ${step.route_short_name}` : step.mode;
            if (step.wait_sec > 0) {
                console.log(`  [${displayIndex++}] Attente a ${step.from.name} - ${step.wait_formatted}`);
            }
            console.log(`  [${displayIndex++}] ${ligne} (${step.mode}) - ${step.from.name} -> ${step.to.name} - ${step.nb_stops} arret(s) - Depart ${step.departure_time} - Trajet ${formatDuration(step.travel_sec)}`);
        }
    });
}