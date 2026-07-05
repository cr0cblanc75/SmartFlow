/**
 * Nettoyage des arêtes-raccourci du métro
 * ---------------------------------------
 * Le GTFS IDFM contient quelques trajets métro atypiques (services partiels,
 * premières/dernières courses...) dont les stop_times sautent une station.
 * gtfs_to_graph.js crée une arête entre arrêts CONSÉCUTIFS d'un même trip, donc
 * ces trajets produisent des arêtes "directes" A->B qui court-circuitent la
 * station intermédiaire réelle. En métro tous les trains s'arrêtent partout :
 * ces raccourcis sont donc erronés et faussent Dijkstra (moins d'arrêts, temps
 * sous-estimé). Ex. : Nation -> Gare de Lyon en 120s en sautant Reuilly-Diderot.
 *
 * Critère de suppression (métro uniquement)
 * -----------------------------------------
 * On retire l'arête A->B s'il existe, SUR LA MÊME LIGNE, un chemin A->...->B
 * d'au moins 2 sauts dont CHAQUE arête est strictement plus courte (en temps)
 * que A->B :
 *
 *     A -> s1 -> s2 -> ... -> B   avec  poids(chaque saut) < poids(A->B)
 *
 * Autrement dit : A->B est un raccourci s'il existe une desserte complète, faite
 * de vrais inter-stations, plus fine que lui. La contrainte "chaque saut plus
 * court que A->B" garantit qu'on ne longe que des stations situées entre A et B
 * dans le même sens (un vrai inter-station est toujours plus court que le saut
 * qui en enjambe plusieurs). Ça couvre les sauts de 1 comme de plusieurs
 * stations (ex. Château de Vincennes -> Nation, qui en saute 3), et ça ne peut
 * jamais retirer une arête atomique : deux stations adjacentes n'ont aucun
 * chemin alternatif dont toutes les arêtes seraient plus courtes qu'elles-mêmes.
 *
 * Usage (depuis scripts/) :
 *   node build_graph/clean_metro_shortcuts.js --dry   (simulation, n'écrit rien)
 *   node build_graph/clean_metro_shortcuts.js         (écrit graph.json)
 *
 * Ne touche qu'au métro. Bus et train (RER semi-directs, variantes de parcours)
 * sont laissés intacts : leurs sauts sont majoritairement légitimes.
 */

const fs = require("fs");
const path = require("path");

const GRAPH_PATH = path.resolve(__dirname, "..", "graph.json");
const DRY = process.argv.includes("--dry");

console.log("Chargement du graphe...");
const graph = JSON.parse(fs.readFileSync(GRAPH_PATH, "utf8"));
const byId = {};
for (const n of graph.nodes) byId[n.id] = n;
const nm = (id) => byId[id]?.name ?? id;

// ── Adjacence métro par ligne : routeAdj[route_id][from] = Map(to -> poids) ────
const routeAdj = {};
for (const e of graph.edges) {
  if (e.mode !== "metro") continue;
  (routeAdj[e.route_id] ??= {});
  (routeAdj[e.route_id][e.from] ??= new Map());
  // en cas de doublon, on garde le plus court (le plus représentatif)
  const cur = routeAdj[e.route_id][e.from].get(e.to);
  if (cur === undefined || e.weight < cur) routeAdj[e.route_id][e.from].set(e.to, e.weight);
}

// Existe-t-il un chemin A->...->B (>=2 sauts) n'empruntant que des arêtes
// strictement plus courtes que maxW ? BFS borné : on ne suit jamais l'arête
// directe A->B (on veut une desserte alternative), et on n'explore que les
// arêtes < maxW. La borne de profondeur couvre largement les sauts observés.
function hasFinerPath(adj, a, b, maxW, maxDepth = 8) {
  const seen = new Set([a]);
  let frontier = [{ node: a, depth: 0 }];
  while (frontier.length) {
    const next = [];
    for (const { node, depth } of frontier) {
      for (const [v, w] of adj[node] || []) {
        if (w >= maxW) continue;               // seulement des sauts plus fins
        if (node === a && v === b) continue;    // ignore l'arête directe A->B
        if (v === b) return depth + 1 >= 1;     // atteint B via >=2 sauts (depth>=1 ici)
        if (!seen.has(v) && depth + 1 < maxDepth) { seen.add(v); next.push({ node: v, depth: depth + 1 }); }
      }
    }
    frontier = next;
  }
  return false;
}

// ── Détection ─────────────────────────────────────────────────────────────────
const toRemove = new Set(); // clés "from||to||route_id"
const removedLog = [];

for (const rid of Object.keys(routeAdj)) {
  const adj = routeAdj[rid];
  for (const a of Object.keys(adj)) {
    for (const [b, wAB] of adj[a]) {
      if (b === a) continue;
      if (hasFinerPath(adj, a, b, wAB)) {
        toRemove.add(`${a}||${b}||${rid}`);
        removedLog.push(`[${rid}] ${nm(a)} -> ${nm(b)}  (${wAB}s)`);
      }
    }
  }
}

console.log(`\nArêtes-raccourci métro détectées : ${toRemove.size}`);
for (const l of removedLog) console.log("  " + l);

// ── Réécriture ────────────────────────────────────────────────────────────────
const before = graph.edges.length;
graph.edges = graph.edges.filter(
  (e) => !(e.mode === "metro" && toRemove.has(`${e.from}||${e.to}||${e.route_id}`))
);
const after = graph.edges.length;
if (graph.meta) graph.meta.total_edges = after;

console.log(`\nArêtes : ${before} -> ${after}  (retirées : ${before - after})`);

if (DRY) {
  console.log("\n[--dry] Aucune écriture effectuée.");
} else {
  fs.writeFileSync(GRAPH_PATH, JSON.stringify(graph, null, 2), "utf8");
  console.log(`\ngraph.json réécrit : ${GRAPH_PATH}`);
}
