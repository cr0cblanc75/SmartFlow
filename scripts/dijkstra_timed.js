/**
 * Dijkstra avec horaires reels
 * ----------------------------
 * Combine graph.json (structure + poids) et timetable.json (horaires de depart)
 * Poids reel d'une arete = temps d'attente du prochain vehicule + poids graph.json
 *
 * Usage direct :
 *   node dijkstra_timed.js "Chatelet" "Nation" --time 08:30
 *   node dijkstra_timed.js "Chatelet" "Nation" --time 08:30 --wheelchair
 *
 * Usage en module :
 *   const { findPathTimed } = require('./dijkstra_timed');
 *   const result = findPathTimed(graph, timetable, "Chatelet", "Nation", { departureTime: "08:30" });
 */

// ─── MinHeap ──────────────────────────────────────────────────────────────────
class MinHeap {
  constructor() { this.heap = []; }

  push(item) {
    this.heap.push(item);
    this._bubbleUp(this.heap.length - 1);
  }

  pop() {
    const top  = this.heap[0];
    const last = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this._sinkDown(0);
    }
    return top;
  }

  get size() { return this.heap.length; }

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
      const l = 2 * i + 1, r = 2 * i + 2;
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

// ─── Recherche arrets par nom ──────────────────────────────────────────────────
function findStopsByName(nodes, name) {
  const query = normalize(name);
  const exact = nodes.filter(n => normalize(n.name) === query);
  if (exact.length > 0) return exact;
  const startsWith = nodes.filter(n => normalize(n.name).startsWith(query));
  if (startsWith.length > 0) return startsWith;
  return nodes.filter(n => normalize(n.name).includes(query));
}

// ─── HH:MM -> secondes ────────────────────────────────────────────────────────
function timeToSeconds(t) {
  if (!t) return 0;
  const parts = t.trim().split(":");
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  const s = parseInt(parts[2], 10) || 0;
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
  let lo = 0, hi = departures.length - 1;
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

// ─── Reconstruction des etapes ────────────────────────────────────────────────
function buildSteps(pathNodes, nodeMap) {
  if (pathNodes.length < 2) return [];

  const steps = [];
  let current = null;

  for (let i = 0; i < pathNodes.length - 1; i++) {
    const hop  = pathNodes[i].hopToNext;
    const from = nodeMap[pathNodes[i].id];
    const to   = nodeMap[pathNodes[i + 1].id];

    if (!hop) continue;

    if (!current || current.route_id !== hop.route_id || current.mode !== hop.mode) {
      if (current) steps.push(current);
      current = {
        type:             hop.mode === "transfer" ? "correspondance" : "trajet",
        mode:             hop.mode,
        route_id:         hop.route_id  || null,
        route_short_name: hop.route_short_name || null,
        color:            hop.color     || null,
        text_color:       hop.text_color || null,
        from:             { id: from.id, name: from.name },
        to:               { id: to.id,   name: to.name },
        stops:            [{ id: from.id, name: from.name, time: formatTime(pathNodes[i].currentSec) }],
        departure_time:   hop.boardingSec != null ? formatTime(hop.boardingSec) : null,
        wait_sec:         hop.waitSec  || 0,
        travel_sec:       hop.travelSec || 0,
        duration:         0,
        nb_stops:         0,
      };
    }

    current.to        = { id: to.id, name: to.name };
    current.duration += (hop.waitSec || 0) + (hop.travelSec || 0);
    current.nb_stops += 1;
    current.stops.push({ id: to.id, name: to.name, time: formatTime(pathNodes[i + 1].currentSec) });
  }

  if (current) steps.push(current);

  return steps.map(s => ({
    ...s,
    duration_formatted: formatDuration(s.duration),
    wait_formatted:     s.wait_sec > 0 ? formatDuration(s.wait_sec) : null,
  }));
}

// ─── Dijkstra timed multi-source ──────────────────────────────────────────────
function dijkstraTimed(adj, nodeMap, timetable, fromIds, toIds, startSec, wheelchair) {
  const dist    = {};
  const prev    = {};
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

    if (toIds.has(id)) { bestToId = id; break; }

    for (const edge of (adj[id] || [])) {
      if (wheelchair && edge.wheelchair === false) continue;
      if (wheelchair && nodeMap[edge.to]?.wheelchair === false) continue;

      let waitSec   = 0;
      let boardSec  = currentSec;

      // Pour les trajets en vehicule, on cherche le prochain depart
      if (edge.mode !== "transfer") {
        const stopTimes = timetable[id];
        const routeDeps = stopTimes ? stopTimes[edge.route_id] : null;
        const nextDep   = nextDeparture(routeDeps, currentSec);

        // Pas de prochain depart -> on skip cette arete
        if (nextDep === null) continue;

        waitSec  = nextDep - currentSec;
        boardSec = nextDep;
      }

      const travelSec     = edge.weight;
      const arrivalAtNext = boardSec + travelSec;
      const newCost       = arrivalAtNext;

      if (newCost < dist[edge.to]) {
        dist[edge.to] = newCost;
        prev[edge.to] = {
          nodeId: id,
          hop: {
            mode:             edge.mode,
            route_id:         edge.route_id,
            route_short_name: edge.route_short_name,
            color:            edge.color,
            text_color:       edge.text_color,
            boardingSec:      boardSec,
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

  const steps             = buildSteps(pathNodes, nodeMap);
  const totalDuration     = dist[bestToId] - startSec;
  const nbCorrespondances = steps.filter(s => s.type === "correspondance").length;

  return {
    from:                     nodeMap[current],
    to:                       nodeMap[bestToId],
    departure_time:           formatTime(startSec),
    arrival_time:             formatTime(dist[bestToId]),
    total_duration:           totalDuration,
    total_duration_formatted: formatDuration(totalDuration),
    nb_stops:                 pathNodes.length - 1,
    nb_correspondances:       nbCorrespondances,
    wheelchair_accessible:    wheelchair,
    steps,
    raw_path:                 pathNodes.map(n => n.id),
  };
}

// ─── findPathTimed ────────────────────────────────────────────────────────────
function findPathTimed(graph, timetable, fromName, toName, options = {}) {
  const { departureTime = "08:00", wheelchair = false } = options;

  const nodeMap = {};
  for (const node of graph.nodes) nodeMap[node.id] = node;

  let fromCandidates = findStopsByName(graph.nodes, fromName);
  let toCandidates   = findStopsByName(graph.nodes, toName);

  if (fromCandidates.length === 0) throw new Error(`Aucun arret trouve pour : "${fromName}"`);
  if (toCandidates.length === 0)   throw new Error(`Aucun arret trouve pour : "${toName}"`);

  if (wheelchair) {
    fromCandidates = fromCandidates.filter(s => s.wheelchair !== false);
    toCandidates   = toCandidates.filter(s => s.wheelchair !== false);
  }

  const fromIds  = fromCandidates.map(s => s.id);
  const toIds    = new Set(toCandidates.map(s => s.id));
  const startSec = timeToSeconds(departureTime);

  console.log(`Depart  : ${fromCandidates.length} arret(s) pour "${fromName}"`);
  console.log(`Arrivee : ${toCandidates.length} arret(s) pour "${toName}"`);
  console.log(`Heure   : ${departureTime}\n`);

  const adj = buildAdjacency(graph);
  return dijkstraTimed(adj, nodeMap, timetable, fromIds, toIds, startSec, wheelchair);
}

// ─── Exports ──────────────────────────────────────────────────────────────────
// ─── Recherche binaire : dernier depart <= beforeSec ──────────────────────────
function lastDeparture(departures, beforeSec) {
  if (!departures || departures.length === 0) return null;
  let lo = 0, hi = departures.length - 1;
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
  const dist    = {};
  const prev    = {};
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

    if (fromIds.has(id)) { bestFromId = id; break; }

    for (const edge of (adjReverse[id] || [])) {
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
      }

      if (boardSec > dist[edge.to]) {
        dist[edge.to] = boardSec;
        prev[edge.to] = {
          nodeId: id,
          hop: {
            mode:             edge.mode,
            route_id:         edge.route_id,
            route_short_name: edge.route_short_name,
            color:            edge.color,
            text_color:       edge.text_color,
            boardingSec:      boardSec,
            waitSec:          0,
            travelSec:        edge.weight,
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
    id:         n.id,
    currentSec: n.currentSec,
    hopToNext:  i < rawPath.length - 1 ? rawPath[i].hop : null,
  }));

  // Calcul des temps d'attente
  for (let i = 0; i < pathNodes.length - 1; i++) {
    const hop = pathNodes[i].hopToNext;
    if (hop && hop.mode !== "transfer") {
      hop.waitSec = Math.max(0, hop.boardingSec - pathNodes[i].currentSec);
    }
  }

  const steps             = buildSteps(pathNodes, nodeMap);
  const totalDuration     = arrivalSec - dist[bestFromId];
  const nbCorrespondances = steps.filter(s => s.type === "correspondance").length;

  return {
    from:                     nodeMap[pathNodes[0].id],
    to:                       nodeMap[pathNodes[pathNodes.length - 1].id],
    departure_time:           formatTime(dist[bestFromId]),
    arrival_time:             formatTime(arrivalSec),
    total_duration:           totalDuration,
    total_duration_formatted: formatDuration(totalDuration),
    nb_stops:                 pathNodes.length - 1,
    nb_correspondances:       nbCorrespondances,
    wheelchair_accessible:    wheelchair,
    steps,
    raw_path:                 pathNodes.map(n => n.id),
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
  let toCandidates   = findStopsByName(graph.nodes, toName);

  if (fromCandidates.length === 0) throw new Error(`Aucun arret trouve pour : "${fromName}"`);
  if (toCandidates.length === 0)   throw new Error(`Aucun arret trouve pour : "${toName}"`);

  if (wheelchair) {
    fromCandidates = fromCandidates.filter(s => s.wheelchair !== false);
    toCandidates   = toCandidates.filter(s => s.wheelchair !== false);
  }

  const fromIds    = new Set(fromCandidates.map(s => s.id));
  const toIds      = toCandidates.map(s => s.id);
  const arrivalSec = timeToSeconds(arrivalTime);

  console.log(`Depart  : ${fromCandidates.length} arret(s) pour "${fromName}"`);
  console.log(`Arrivee : ${toCandidates.length} arret(s) pour "${toName}"`);
  console.log(`Arriver avant : ${arrivalTime}\n`);

  const adj = buildAdjacency(graph);
  return dijkstraTimedReverse(adj, nodeMap, timetable, fromIds, toIds, arrivalSec, wheelchair);
}

module.exports = { findPathTimed, findPathTimedArrival };

// ─── CLI ──────────────────────────────────────────────────────────────────────
if (require.main === module) {
  const minimist = require("minimist");
  const args     = minimist(process.argv.slice(2));
  const [fromName, toName] = args._;
  const wheelchair    = !!args.wheelchair;
  const departureTime = args.time    || null;
  const arrivalTime   = args.arrive  || null;

  if (!departureTime && !arrivalTime) {
    console.log('Usage : node dijkstra_timed.js "Depart" "Arrivee" --time HH:MM [--wheelchair]');
    console.log('        node dijkstra_timed.js "Depart" "Arrivee" --arrive HH:MM [--wheelchair]');
    console.log('Ex    : node dijkstra_timed.js "Chatelet" "Nation" --time 08:30');
    console.log('Ex    : node dijkstra_timed.js "Chatelet" "Nation" --arrive 09:00');
    process.exit(0);
  }

  console.log("Chargement du graphe...");
  const graph = require("./graph.json");

  console.log("Chargement des horaires...");
  const timetable = require("./timetable.json");

  console.log(`${graph.nodes.length} sommets | ${Object.keys(timetable).length} arrets avec horaires\n`);
  console.log(`Recherche : "${fromName}" -> "${toName}" a ${departureTime}\n`);

  const start = Date.now();
  let result;
  try {
    if (arrivalTime) {
      console.log(`Recherche : "${fromName}" -> "${toName}" arriver avant ${arrivalTime}\n`);
      result = findPathTimedArrival(graph, timetable, fromName, toName, { arrivalTime, wheelchair });
    } else {
      console.log(`Recherche : "${fromName}" -> "${toName}" a ${departureTime}\n`);
      result = findPathTimed(graph, timetable, fromName, toName, { departureTime, wheelchair });
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