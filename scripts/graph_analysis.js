/**
 * Analyse du graphe de transport IDFM
 * ------------------------------------
 * 1. Connexite  : verifie si le reseau est connexe et liste les composantes
 * 2. ACPM       : Arbre Couvrant de Poids Minimum (algorithme de Kruskal)
 *
 * Usage :
 *   node graph_analysis.js --connexite
 *   node graph_analysis.js --acpm
 *   node graph_analysis.js --connexite --acpm
 */

const fs       = require("fs");
const path     = require("path");
const minimist = require("minimist");

const args      = minimist(process.argv.slice(2));
const GRAPH_FILE = path.resolve(args.graph || "./graph.json");

// ─── Union-Find (pour Kruskal) ────────────────────────────────────────────────
class UnionFind {
  constructor(ids) {
    this.parent = {};
    this.rank   = {};
    for (const id of ids) {
      this.parent[id] = id;
      this.rank[id]   = 0;
    }
  }

  find(x) {
    if (this.parent[x] !== x) {
      this.parent[x] = this.find(this.parent[x]); // compression de chemin
    }
    return this.parent[x];
  }

  union(x, y) {
    const rx = this.find(x);
    const ry = this.find(y);
    if (rx === ry) return false; // deja dans le meme ensemble -> cycle
    if (this.rank[rx] < this.rank[ry]) this.parent[rx] = ry;
    else if (this.rank[rx] > this.rank[ry]) this.parent[ry] = rx;
    else { this.parent[ry] = rx; this.rank[rx]++; }
    return true;
  }

  // Retourne toutes les composantes { root -> [ids] }
  components() {
    const comps = {};
    for (const id of Object.keys(this.parent)) {
      const root = this.find(id);
      if (!comps[root]) comps[root] = [];
      comps[root].push(id);
    }
    return comps;
  }
}

// ─── TEST DE CONNEXITE (BFS) ──────────────────────────────────────────────────
/**
 * Parcourt le graphe en BFS depuis un noeud source.
 * Retourne l'ensemble des noeuds atteignables.
 */
function bfs(adjUndirected, startId) {
  const visited = new Set();
  const queue   = [startId];
  visited.add(startId);

  while (queue.length > 0) {
    const current = queue.shift();
    for (const neighborId of (adjUndirected[current] || [])) {
      if (!visited.has(neighborId)) {
        visited.add(neighborId);
        queue.push(neighborId);
      }
    }
  }
  return visited;
}

function testConnexite(graph) {
  console.log("=== TEST DE CONNEXITE ===\n");

  const nodeIds = graph.nodes.map(n => n.id);
  const nodeMap = {};
  for (const node of graph.nodes) nodeMap[node.id] = node;

  // Graphe non oriente : on ajoute les aretes dans les deux sens
  const adjUndirected = {};
  for (const id of nodeIds) adjUndirected[id] = [];

  for (const edge of graph.edges) {
    if (!adjUndirected[edge.from]) adjUndirected[edge.from] = [];
    if (!adjUndirected[edge.to])   adjUndirected[edge.to]   = [];
    adjUndirected[edge.from].push(edge.to);
    adjUndirected[edge.to].push(edge.from);
  }

  // BFS depuis le premier noeud
  const startId  = nodeIds[0];
  const visited  = bfs(adjUndirected, startId);
  const isolated = nodeIds.filter(id => !visited.has(id));

  if (isolated.length === 0) {
    console.log("Le reseau est CONNEXE.");
    console.log(`Tous les ${nodeIds.length} arrets sont atteignables depuis "${nodeMap[startId].name}".`);
  } else {
    console.log("Le reseau est NON CONNEXE.");
    console.log(`${visited.size} arrets atteignables depuis "${nodeMap[startId].name}"`);
    console.log(`${isolated.length} arrets isoles (non atteignables)\n`);

    // Identification des composantes connexes via Union-Find
    const uf = new UnionFind(nodeIds);
    for (const edge of graph.edges) uf.union(edge.from, edge.to);
    const comps = uf.components();
    const sorted = Object.values(comps).sort((a, b) => b.length - a.length);

    console.log(`Nombre de composantes connexes : ${sorted.length}\n`);
    sorted.forEach((comp, i) => {
      const names = comp.slice(0, 3).map(id => nodeMap[id]?.name || id).join(", ");
      const plus  = comp.length > 3 ? ` ... (+${comp.length - 3} autres)` : "";
      console.log(`  Composante ${i + 1} : ${comp.length} arret(s) — ex: ${names}${plus}`);
    });
  }

  return { connexe: isolated.length === 0, visited, isolated };
}

// ─── ACPM — KRUSKAL ───────────────────────────────────────────────────────────
/**
 * Algorithme de Kruskal :
 * 1. Trier toutes les aretes par poids croissant
 * 2. Ajouter chaque arete si elle ne cree pas de cycle (Union-Find)
 * 3. Stopper quand on a n-1 aretes (n = nombre de noeuds)
 */
function kruskal(graph) {
  console.log("\n=== ARBRE COUVRANT DE POIDS MINIMUM (Kruskal) ===\n");

  const nodeIds = graph.nodes.map(n => n.id);
  const nodeMap = {};
  for (const node of graph.nodes) nodeMap[node.id] = node;

  // On exclut les transfers de l'ACPM (pas de poids physique reel)
  const edges = graph.edges
    .filter(e => e.mode !== "transfer")
    .sort((a, b) => a.weight - b.weight);

  const uf   = new UnionFind(nodeIds);
  const acpm = [];
  let totalWeight = 0;

  for (const edge of edges) {
    if (uf.union(edge.from, edge.to)) {
      acpm.push(edge);
      totalWeight += edge.weight;
      if (acpm.length === nodeIds.length - 1) break;
    }
  }

  // Verification : est-ce qu'on a reussi a couvrir tout le graphe ?
  const comps = uf.components();
  const nbComposantes = Object.keys(comps).length;

  console.log(`Aretes dans l'ACPM     : ${acpm.length}`);
  console.log(`Poids total            : ${totalWeight}s (${Math.round(totalWeight / 60)} min)`);
  console.log(`Composantes couvertes  : ${nbComposantes}`);

  if (nbComposantes > 1) {
    console.log(`\nAttention : le graphe n'est pas connexe.`);
    console.log(`L'ACPM couvre ${nbComposantes} sous-arbres independants.`);
  } else {
    console.log(`\nL'ACPM couvre l'integralite du reseau en un seul arbre.`);
  }

  // Affichage des 10 aretes les plus legeres
  console.log("\nLes 10 aretes les plus courtes de l'ACPM :");
  acpm.slice(0, 10).forEach((e, i) => {
    const from = nodeMap[e.from]?.name || e.from;
    const to   = nodeMap[e.to]?.name   || e.to;
    const ligne = e.route_short_name ? `[${e.route_short_name}]` : `[${e.mode}]`;
    console.log(`  ${i + 1}. ${ligne} ${from} -> ${to} (${e.weight}s)`);
  });

  // Affichage des 10 aretes les plus lourdes
  console.log("\nLes 10 aretes les plus longues de l'ACPM :");
  [...acpm].sort((a, b) => b.weight - a.weight).slice(0, 10).forEach((e, i) => {
    const from = nodeMap[e.from]?.name || e.from;
    const to   = nodeMap[e.to]?.name   || e.to;
    const ligne = e.route_short_name ? `[${e.route_short_name}]` : `[${e.mode}]`;
    console.log(`  ${i + 1}. ${ligne} ${from} -> ${to} (${Math.round(e.weight / 60)}min)`);
  });

  return { acpm, totalWeight, nbComposantes };
}

// ─── Export JSON de l'ACPM ────────────────────────────────────────────────────
function exportACPM(acpmEdges, graph, outputPath) {
  const nodeMap  = {};
  for (const node of graph.nodes) nodeMap[node.id] = node;

  const usedIds  = new Set(acpmEdges.flatMap(e => [e.from, e.to]));
  const nodes    = graph.nodes.filter(n => usedIds.has(n.id));

  const result = {
    meta: {
      generated_at: new Date().toISOString(),
      type:         "ACPM - Arbre Couvrant de Poids Minimum",
      algorithm:    "Kruskal",
      total_nodes:  nodes.length,
      total_edges:  acpmEdges.length,
    },
    nodes,
    edges: acpmEdges,
  };

  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), "utf8");
  console.log(`\nACPM exporte -> ${outputPath}`);
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
function main() {
  const doConnexite = args.connexite || args.c || false;
  const doACPM      = args.acpm      || args.a || false;
  const exportPath  = args.export    || null;

  if (!doConnexite && !doACPM) {
    console.log("Usage :");
    console.log("  node graph_analysis.js --connexite");
    console.log("  node graph_analysis.js --acpm");
    console.log("  node graph_analysis.js --connexite --acpm");
    console.log("  node graph_analysis.js --acpm --export ./acpm.json");
    process.exit(0);
  }

  console.log("Chargement du graphe...");
  const graph = require(GRAPH_FILE);
  console.log(`${graph.nodes.length} sommets | ${graph.edges.length} aretes\n`);

  if (doConnexite) testConnexite(graph);
  if (doACPM) {
    const { acpm } = kruskal(graph);
    if (exportPath) exportACPM(acpm, graph, path.resolve(exportPath));
  }
}

main();
