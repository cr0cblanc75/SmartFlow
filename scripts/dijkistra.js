/**
 * Dijkstra multi-source pour graphe de transport IDFM
 * -----------------------------------------------------
 * Depart  : tous les arrets correspondant au nom sont injectes avec cout 0
 *           -> l'algo choisit naturellement le bon quai
 * Arrivee : on s'arrete des qu'on atteint n'importe quel arret candidat
 *           -> pas de transfer artificiel
 *
 * Usage direct :
 *   node dijkstra.js "Chatelet" "Nation"
 *   node dijkstra.js "Chatelet" "Nation" --wheelchair
 *
 * Usage en module :
 *   const { findPathByName } = require('./dijkstra');
 *   const result = findPathByName(graph, "Chatelet", "Nation", { wheelchair: false });
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

// ─── Recherche des arrets par nom ─────────────────────────────────────────────
// Priorite : exact > commence par > contient
function findStopsByName(nodes, name) {
  const query = normalize(name);

  const exact = nodes.filter(n => normalize(n.name) === query);
  if (exact.length > 0) return exact;

  const startsWith = nodes.filter(n => normalize(n.name).startsWith(query));
  if (startsWith.length > 0) return startsWith;

  return nodes.filter(n => normalize(n.name).includes(query));
}

// ─── Construction de la liste d'adjacence ─────────────────────────────────────
function buildAdjacency(graph) {
  const adj = {};
  for (const node of graph.nodes) adj[node.id] = [];
  for (const edge of graph.edges) {
    if (!adj[edge.from]) adj[edge.from] = [];
    adj[edge.from].push(edge);
  }
  return adj;
}

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

function findPathByIds(graph, fromId, toId, options = {}) {
  const { wheelchair = false } = options;
  const nodeMap = {};
  for (const node of graph.nodes) nodeMap[node.id] = node;

  if (!nodeMap[fromId]) throw new Error(`Aucun arret trouve pour l'ID de depart : "${fromId}"`);
  if (!nodeMap[toId]) throw new Error(`Aucun arret trouve pour l'ID d'arrivee : "${toId}"`);

  const adj = buildAdjacency(graph);
  return dijkstraMultiSource(adj, nodeMap, [fromId], new Set([toId]), wheelchair);
}

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}min`;
  if (m > 0) return `${m}min ${s}s`;
  return `${s}s`;
}

// ─── Reconstruction des etapes ────────────────────────────────────────────────
function buildSteps(pathNodes, nodeMap) {
  if (pathNodes.length < 2) return [];

  const steps = [];
  let current = null;

  for (let i = 0; i < pathNodes.length - 1; i++) {
    const edge = pathNodes[i].edgeToNext;
    const from = nodeMap[pathNodes[i].id];
    const to   = nodeMap[pathNodes[i + 1].id];

    if (
      !current ||
      current.route_id !== edge.route_id ||
      current.mode     !== edge.mode
    ) {
      if (current) steps.push(current);
      current = {
        type:             edge.mode === "transfer" ? "correspondance" : "trajet",
        mode:             edge.mode,
        route_id:         edge.route_id,
        route_short_name: edge.route_short_name,
        color:            edge.color      || null,
        text_color:       edge.text_color || null,
        from:             { id: from.id, name: from.name },
        to:               { id: to.id,   name: to.name },
        stops:            [{ id: from.id, name: from.name }],
        duration:         0,
        nb_stops:         0,
      };
    }

    current.to        = { id: to.id, name: to.name };
    current.duration += edge.weight;
    current.nb_stops += 1;
    current.stops.push({ id: to.id, name: to.name });
  }

  if (current) steps.push(current);

  return steps.map(s => ({ ...s, duration_formatted: formatDuration(s.duration) }));
}

// ─── Dijkstra multi-source ────────────────────────────────────────────────────
/**
 * @param {Object}   adj         - liste d'adjacence
 * @param {Object}   nodeMap     - index id -> node
 * @param {string[]} fromIds     - tous les IDs de depart (cout 0 chacun)
 * @param {Set}      toIds       - ensemble des IDs d'arrivee
 * @param {boolean}  wheelchair
 * @returns {Object|null}
 */
function dijkstraMultiSource(adj, nodeMap, fromIds, toIds, wheelchair) {
  const dist    = {};
  const prev    = {};
  const visited = new Set();

  for (const id of Object.keys(nodeMap)) dist[id] = Infinity;

  const heap = new MinHeap();

  // Injection de tous les points de depart avec cout 0
  for (const id of fromIds) {
    if (wheelchair && nodeMap[id]?.wheelchair === false) continue;
    dist[id] = 0;
    heap.push({ cost: 0, id });
  }

  let bestToId = null;

  while (heap.size > 0) {
    const { cost, id } = heap.pop();
    if (visited.has(id)) continue;
    visited.add(id);

    // On s'arrete des qu'on atteint un arret d'arrivee
    if (toIds.has(id)) {
      bestToId = id;
      break;
    }

    for (const edge of (adj[id] || [])) {
      if (wheelchair && edge.wheelchair === false) continue;
      if (wheelchair && nodeMap[edge.to]?.wheelchair === false) continue;

      const newCost = cost + edge.weight;
      if (newCost < dist[edge.to]) {
        dist[edge.to] = newCost;
        prev[edge.to] = { nodeId: id, edge };
        heap.push({ cost: newCost, id: edge.to });
      }
    }
  }

  if (!bestToId) return null;

  // Reconstruction du chemin depuis bestToId jusqu'a un noeud source
  const pathNodes = [];
  let current = bestToId;

  while (prev[current]) {
    const { nodeId, edge } = prev[current];
    pathNodes.unshift({ id: current, edgeToNext: null, edgeFromPrev: edge });
    current = nodeId;
  }
  // current est maintenant le noeud source choisi par l'algo
  pathNodes.unshift({ id: current, edgeToNext: null, edgeFromPrev: null });

  for (let i = 0; i < pathNodes.length - 1; i++) {
    pathNodes[i].edgeToNext = pathNodes[i + 1].edgeFromPrev;
  }

  const steps             = buildSteps(pathNodes, nodeMap);
  const totalDuration     = dist[bestToId];
  const nbCorrespondances = steps.filter(s => s.type === "correspondance").length;

  return {
    from:                     nodeMap[current],
    to:                       nodeMap[bestToId],
    total_duration:           totalDuration,
    total_duration_formatted: formatDuration(totalDuration),
    nb_stops:                 pathNodes.length - 1,
    nb_correspondances:       nbCorrespondances,
    wheelchair_accessible:    wheelchair,
    steps,
    raw_path:                 pathNodes.map(n => n.id),
  };
}

// ─── findPathByName ───────────────────────────────────────────────────────────
function findPathByName(graph, fromName, toName, options = {}) {
  const { wheelchair = false } = options;

  const nodeMap = {};
  for (const node of graph.nodes) nodeMap[node.id] = node;

  let fromCandidates = findStopsByName(graph.nodes, fromName);
  let toCandidates   = findStopsByName(graph.nodes, toName);

  if (fromCandidates.length === 0) throw new Error(`Aucun arret trouve pour : "${fromName}"`);
  if (toCandidates.length === 0)   throw new Error(`Aucun arret trouve pour : "${toName}"`);

  if (wheelchair) {
    fromCandidates = fromCandidates.filter(s => s.wheelchair !== false);
    toCandidates   = toCandidates.filter(s => s.wheelchair !== false);
    if (fromCandidates.length === 0) throw new Error(`Aucun arret PMR accessible pour : "${fromName}"`);
    if (toCandidates.length === 0)   throw new Error(`Aucun arret PMR accessible pour : "${toName}"`);
  }

  const fromIds = fromCandidates.map(s => s.id);
  const toIds   = new Set(toCandidates.map(s => s.id));

  console.log(`Depart  : ${fromIds.length} arret(s) correspondant a "${fromName}"`);
  console.log(`Arrivee : ${toCandidates.length} arret(s) correspondant a "${toName}"\n`);

  const adj = buildAdjacency(graph);

  return dijkstraMultiSource(adj, nodeMap, fromIds, toIds, wheelchair);
}

// ─── Exports ──────────────────────────────────────────────────────────────────
module.exports = {
  findPathByName,
  findPathByIds,
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
  const args     = minimist(process.argv.slice(2));
  const [fromName, toName] = args._;
  const wheelchair = !!args.wheelchair;

  if (!fromName || !toName) {
    console.log('Usage : node dijkstra.js "Nom depart" "Nom arrivee" [--wheelchair]');
    console.log('Ex    : node dijkstra.js "Chatelet" "Nation"');
    process.exit(0);
  }

  console.log("Chargement du graphe...");
  const graph = require("./graph.json");
  console.log(`${graph.nodes.length} sommets, ${graph.edges.length} aretes\n`);

  console.log(`Recherche : "${fromName}" -> "${toName}" ${wheelchair ? "(PMR)" : ""}\n`);

  const start = Date.now();
  let result;
  try {
    result = findPathByName(graph, fromName, toName, { wheelchair });
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
  console.log(`Duree totale    : ${result.total_duration_formatted}`);
  console.log(`Correspondances : ${result.nb_correspondances}`);
  console.log(`Nombre d'arrets : ${result.nb_stops}`);
  console.log("\nDetail du trajet :\n");

  result.steps.forEach((step, i) => {
    if (step.type === "correspondance") {
      console.log(`  [${i + 1}] Correspondance - ${step.from.name} -> ${step.to.name} (${step.duration_formatted})`);
    } else {
      const ligne = step.route_short_name ? `Ligne ${step.route_short_name}` : step.mode;
      console.log(`  [${i + 1}] ${ligne} (${step.mode}) - ${step.from.name} -> ${step.to.name} - ${step.nb_stops} arret(s) - ${step.duration_formatted}`);
    }
  });
}