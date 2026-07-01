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

const { calculerEmpreinteTroncon, calculerHaversineBrute, calculerDistanceParTemps } = require('./eco_calculator');

// ─── MinHeap ──────────────────────────────────────────────────────────────────
class MinHeap {
  constructor() { this.heap = []; }

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

const normalizedNameCache = new Map();

function getNormalizedName(value) {
  if (typeof value !== "string") return "";
  if (!normalizedNameCache.has(value)) {
    normalizedNameCache.set(value, normalize(value));
  }
  return normalizedNameCache.get(value);
}

// ─── Recherche des arrets par nom ─────────────────────────────────────────────
// Priorite : exact > commence par > contient
function findStopsByName(nodes, name) {
  const query = getNormalizedName(name);
  const exact = [];
  const startsWith = [];
  const contains = [];

  for (const node of nodes) {
    const normalizedName = getNormalizedName(node.name);

    if (normalizedName === query) {
      exact.push(node);
    } else if (normalizedName.startsWith(query)) {
      startsWith.push(node);
    } else if (normalizedName.includes(query)) {
      contains.push(node);
    }
  }

  if (exact.length > 0) return exact;
  if (startsWith.length > 0) return startsWith;
  return contains;
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


// ─── Formatage duree ──────────────────────────────────────────────────────────
function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}min`;
  if (m > 0) return `${m}min ${s}s`;
  return `${s}s`;
}

const VITESSE_MARCHE_KMH = 4.5;

function convertirTempsEnDistanceMarcheKm(seconds, vitesseKmh = VITESSE_MARCHE_KMH) {
  if (!Number.isFinite(seconds) || seconds <= 0) return 0;
  return calculerDistanceParTemps(seconds) * (vitesseKmh / VITESSE_MARCHE_KMH);
}

// ─── Modes considérés comme "correspondance à pied" ───────────────────────────
const MODES_MARCHE = new Set(["transfer", "walk", "correspondance", "foot"]);

// ─── Reconstruction des etapes ────────────────────────────────────────────────
function buildSteps(pathNodes, nodeMap) {
  if (pathNodes.length < 2) return [];

  const steps = [];
  let current = null;

  for (let i = 0; i < pathNodes.length - 1; i++) {
    const edge = pathNodes[i].edgeToNext;
    const from = nodeMap[pathNodes[i].id];
    const to = nodeMap[pathNodes[i + 1].id];

    const isWalk = MODES_MARCHE.has(edge.mode);

    // Une arête de marche/transfert ouvre TOUJOURS une nouvelle étape
    // (on ne la fusionne jamais avec une étape précédente)
    if (
      !current ||
      current.route_id !== edge.route_id ||
      current.mode !== edge.mode ||
      isWalk
    ) {
      if (current) steps.push(current);
      current = {
        type: isWalk ? "correspondance" : "trajet",
        mode: edge.mode,
        route_id: edge.route_id || null,
        route_short_name: edge.route_short_name || null,
        color: edge.color || null,
        text_color: edge.text_color || null,
        from: { id: from.id, name: from.name, latitude: from.latitude, longitude: from.longitude },
        to: { id: to.id, name: to.name, latitude: to.latitude, longitude: to.longitude },
        stops: [{ id: from.id, name: from.name }],
        duration: 0,
        nb_stops: 0,
        // Pré-initialisation : sera écrasé par Haversine pour les arêtes de marche
        distanceEtapeKm: 0,
      };
    }

    current.to = { id: to.id, name: to.name, latitude: to.latitude, longitude: to.longitude };
    current.duration += edge.weight;
    current.nb_stops += 1;
    current.stops.push({ id: to.id, name: to.name });

    // ── RÈGLE DE CALCUL DE DISTANCE POUR LES CORRESPONDANCES À PIED ────────
    // Priorité 1 : Haversine entre les coords GPS du nœud de départ et d'arrivée
    //              de l'étape. Précis quand les deux quais ont des coords distinctes.
    // Priorité 2 : Si les GPS sont identiques (cas fréquent base GTFS IDFM),
    //              on bascule sur une estimation cinématique : durée × vitesse marche.
    if (isWalk) {
      const fromNode = nodeMap[current.from.id];
      const toNode = nodeMap[current.to.id];
      const SEUIL_GPS_IDENTIQUE = 0.005; // 5 mètres — en-dessous, les coords sont dégénérées

      if (
        fromNode && toNode &&
        fromNode.latitude != null && fromNode.longitude != null &&
        toNode.latitude != null && toNode.longitude != null
      ) {
        const haversine = calculerHaversineBrute(
          fromNode.latitude, fromNode.longitude,
          toNode.latitude, toNode.longitude
        );

        if (haversine > SEUIL_GPS_IDENTIQUE) {
          // Coords distinctes → distance géospatiale réelle
          current.distanceEtapeKm = haversine;
        } else {
          // Coords identiques ou trop proches → estimation cinématique
          current.distanceEtapeKm = convertirTempsEnDistanceMarcheKm(edge.weight, VITESSE_MARCHE_KMH);
        }
      } else {
        // Nœuds sans coordonnées GPS → fallback cinématique
        current.distanceEtapeKm = convertirTempsEnDistanceMarcheKm(edge.weight, VITESSE_MARCHE_KMH);
      }
    }
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
// Définition des coefficients de SmartFlow (ajustables)
// alpha : poids du temps (en minutes pour rester équilibré avec les grammes de CO2)
// beta : poids du carbone (en grammes de CO2)
// Configuration des coefficients SmartFlow (Normalisés)
let ALPHA = 0.5; // Importance du temps (0.0 à 1.0)
let BETA = 0.5;  // Importance du Carbone (0.0 à 1.0)

// Valeurs maximales de référence pour la normalisation en Île-de-France
const TEMPS_MAX_COURONNE_MIN = 90; // Un trajet de bus/train dépasse rarement 1h30 par étape
const CO2_MAX_TRONCON_GRAMMES = 500; // Seuil max de CO2 estimé pour un gros tronçon de bus

function dijkstraMultiSource(adj, nodeMap, fromIds, toIds, wheelchair) {
  const dist = {};
  const prev = {};
  const visited = new Set();

  for (const id of Object.keys(nodeMap)) dist[id] = Infinity;

  const heap = new MinHeap();

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

    if (toIds.has(id)) {
      bestToId = id;
      break;
    }

    for (const edge of (adj[id] || [])) {
      if (wheelchair && edge.wheelchair === false) continue;
      if (wheelchair && nodeMap[edge.to]?.wheelchair === false) continue;

      const nodeA = nodeMap[id];
      const nodeB = nodeMap[edge.to];

      let coutPondereEdge = 0;
      const tempsMinutes = edge.weight / 60;

      if (nodeA && nodeB) {
        // 1. Calcul du CO2 brut en grammes
        const calculCO2 = calculerEmpreinteTroncon(nodeA, nodeB, edge.mode);

        // 2. NORMALISATION (Valeurs ramenées entre 0 et 1)
        const tempsNormalise = Math.min(tempsMinutes / TEMPS_MAX_COURONNE_MIN, 1);
        const co2Normalise = Math.min(calculCO2.co2Grams / CO2_MAX_TRONCON_GRAMMES, 1);

        // 3. Fonction de coût dynamisée
        // Plus Beta est élevé, plus les trajets en bus sont pénalisés
        // par rapport aux autres modes (notamment le train).
        coutPondereEdge = (ALPHA * tempsNormalise) + (BETA * co2Normalise);

        if (edge.mode === 'bus') {
          coutPondereEdge += 0.20 * BETA;
        } else if (MODES_MARCHE.has(edge.mode)) {
          // La marche est légèrement favorisée pour rester compétitive sur de courtes distances.
          coutPondereEdge -= 0.05 + (0.03 * BETA);
        }

        // 4. PÉNALITÉ DE CORRESPONDANCE (Rupture de charge)
        // Si le mode est un transfert à pied, on ajoute un coût psychologique fixe
        if (edge.mode === 'transfer' || edge.mode === 'correspondance') {
          coutPondereEdge += 0.15; // Équivaut à une pénalité virtuelle d'effort
        }
      } else {
        coutPondereEdge = Math.min(tempsMinutes / TEMPS_MAX_COURONNE_MIN, 1);
      }

      const newCost = cost + coutPondereEdge;

      if (newCost < dist[edge.to]) {
        dist[edge.to] = newCost;
        prev[edge.to] = { nodeId: id, edge };
        heap.push({ cost: newCost, id: edge.to });
      }
    }
  }

  if (!bestToId) return null;

  const pathNodes = [];
  let current = bestToId;

  while (prev[current]) {
    const { nodeId, edge } = prev[current];
    pathNodes.unshift({ id: current, edgeToNext: null, edgeFromPrev: edge });
    current = nodeId;
  }
  pathNodes.unshift({ id: current, edgeToNext: null, edgeFromPrev: null });

  for (let i = 0; i < pathNodes.length - 1; i++) {
    pathNodes[i].edgeToNext = pathNodes[i + 1].edgeFromPrev;
  }

  const steps = buildSteps(pathNodes, nodeMap);
  const totalDuration = steps.reduce((acc, s) => acc + s.duration, 0);
  const nbCorrespondances = steps.filter(s => s.type === "correspondance").length;

  return {
    from: nodeMap[current],
    to: nodeMap[bestToId],
    total_duration: totalDuration,
    total_duration_formatted: formatDuration(totalDuration),
    nb_stops: pathNodes.length - 1,
    nb_correspondances: nbCorrespondances,
    wheelchair_accessible: wheelchair,
    steps,
    raw_path: pathNodes.map(n => n.id),
  };
}

// ─── findPathByName ───────────────────────────────────────────────────────────
function findPathByName(graph, fromName, toName, options = {}) {
  const { wheelchair = false } = options;

  const nodeMap = {};
  for (const node of graph.nodes) nodeMap[node.id] = node;

  let fromCandidates = findStopsByName(graph.nodes, fromName);
  let toCandidates = findStopsByName(graph.nodes, toName);

  if (fromCandidates.length === 0) throw new Error(`Aucun arret trouve pour : "${fromName}"`);
  if (toCandidates.length === 0) throw new Error(`Aucun arret trouve pour : "${toName}"`);

  // [ ... Ton code de filtrage wheelchair reste identique ... ]

  const fromIds = fromCandidates.map(s => s.id);
  const toIds = new Set(toCandidates.map(s => s.id));

  console.log(`Depart  : ${fromIds.length} arret(s) correspondant a "${fromName}"`);
  console.log(`Arrivee : ${toCandidates.length} arret(s) correspondant a "${toName}"\n`);

  // ─── AJOUT SMARTFLOW : VÉRIFICATION MARCHE FORCÉE ───
  // Plus Beta est élevé, plus le seuil de marche augmente : on privilégie davantage la marche
  // pour des trajets très courts, sans pour autant la forcer sur des distances plus longues.
  const seuilMarcheKm = Math.min(1.0, 0.25 + (0.75 * BETA));

  // On prend le premier candidat pour tester la distance de proximité
  const premierDepart = fromCandidates[0];
  const premierArrivee = toCandidates[0];

  // Utilisation de la fonction Haversine brute (importée en haut du module)
  const distanceDirecteKm = calculerHaversineBrute(
    premierDepart.latitude, premierDepart.longitude,
    premierArrivee.latitude, premierArrivee.longitude
  );

  if (distanceDirecteKm <= seuilMarcheKm) {
    console.log(`[SmartFlow - Info] Distance directe de ${(distanceDirecteKm * 1000).toFixed(0)}m inférieure au seuil dynamique (${(seuilMarcheKm * 1000).toFixed(0)}m). Routage 100% piéton activé.\n`);

    // On simule une vitesse de marche moyenne de 4.5 km/h (soit ~13.3 min pour 1 km)
    const tempsMarcheSecondes = Math.round((distanceDirecteKm / 4.5) * 3600);

    // On court-circuite Dijkstra en renvoyant directement un résultat propre
    return {
      from: premierDepart,
      to: premierArrivee,
      total_duration: tempsMarcheSecondes,
      total_duration_formatted: `${Math.round(tempsMarcheSecondes / 60)}min ${tempsMarcheSecondes % 60}s`,
      nb_stops: 0,
      nb_correspondances: 0,
      wheelchair_accessible: wheelchair,
      steps: [{
        type: "correspondance",
        mode: "walk",
        from: { id: premierDepart.id, name: premierDepart.name },
        to: { id: premierArrivee.id, name: premierArrivee.name },
        duration: tempsMarcheSecondes,
        duration_formatted: `${Math.round(tempsMarcheSecondes / 60)}min`,
        distanceEtapeKm: distanceDirecteKm, // Sauvegarde de la distance réelle de marche
        nb_stops: 0,
        stops: []
      }],
      raw_path: [premierDepart.id, premierArrivee.id]
    };
  }
  // ─── FIN DE L'AJOUT SMARTFLOW ───

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
  convertirTempsEnDistanceMarcheKm,
};

// ─── CLI AVEC MENU INTERACTIF SMARTFLOW ───────────────────────────────────────
if (require.main === module) {
  const minimist = require("minimist");
  const readline = require("readline");
  const args = minimist(process.argv.slice(2));
  const [fromName, toName] = args._;
  const wheelchair = !!args.wheelchair;

  if (!fromName || !toName) {
    console.log('Usage : node dijkstra.js "Nom depart" "Nom arrivee" [--wheelchair]');
    console.log('Ex    : node dijkstra.js "Chatelet" "Nation"');
    process.exit(0);
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log(`==================================================`);
  console.log(`      BIENVENUE SUR LE MOTEUR SMARTFLOW           `);
  console.log(`==================================================`);
  console.log(`Choisissez un profil éco-routage pour votre trajet :`);
  console.log(` 1. ⏱️  Profil Pressé     (Alpha = 1.0 , Beta = 0.0)`);
  console.log(` 2. ⚖️  Profil Équilibré  (Alpha = 0.5 , Beta = 0.5)`);
  console.log(` 3. 🌿  Profil Éco-Leader (Alpha = 0.2 , Beta = 0.8)`);
  console.log(` 4. 🎛️  Personnalisé      (Saisie manuelle)`);
  console.log(`==================================================`);

  rl.question('Votre choix (1-4) : ', (choix) => {
    switch (choix.trim()) {
      case '1':
        ALPHA = 1.0; BETA = 0.0;
        lancerDijkstra();
        break;
      case '2':
        ALPHA = 0.5; BETA = 0.5;
        lancerDijkstra();
        break;
      case '3':
        ALPHA = 0.2; BETA = 0.8;
        lancerDijkstra();
        break;
      case '4':
        rl.question('Entrez la valeur de Alpha (ex: 0.4) : ', (a) => {
          rl.question('Entrez la value de Beta (ex: 0.6) : ', (b) => {
            ALPHA = parseFloat(a) || 0.5;
            BETA = parseFloat(b) || 0.5;
            lancerDijkstra();
          });
        });
        break;
      default:
        console.log("Choix invalide. Profil Équilibré appliqué par défaut.\n");
        ALPHA = 0.5; BETA = 0.5;
        lancerDijkstra();
        break;
    }
  });

  function lancerDijkstra() {
    rl.close(); // Fermeture de la saisie console

    console.log(`\n[SmartFlow] Configuration active : Alpha (Temps) = ${ALPHA} | Beta (Carbone) = ${BETA}\n`);
    console.log("Chargement du graphe...");
    const graph = require("./graph.json");
    console.log(`${graph.nodes.length} sommets, ${graph.edges.length} aretes\n`);

    const nodeMap = {};
    for (const node of graph.nodes) nodeMap[node.id] = node;

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
    console.log("\nDetail du trajet :\n");

    let co2TotalTrajet = 0;
    let distanceTotaleTrajet = 0;

    result.steps.forEach((step, i) => {
      // Interception des correspondances et de la marche forcée
      if (step.type === "correspondance" || step.mode === "walk") {
        const icone = step.mode === "walk" ? "Marche à pied" : "Correspondance";

        let distanceEtapeKm = 0;

        // 1. Cas de la "Marche Forcée" : on priorise la distance Haversine si elle a été pré-calculée
        if (typeof step.distanceEtapeKm === 'number' && step.distanceEtapeKm > 0) {
          distanceEtapeKm = step.distanceEtapeKm;
        }
        // 2. Sinon, on calcule la distance directement à partir du temps de l'étape (1.25 m/s)
        else if (typeof step.duration === 'number' && step.duration > 0) {
          distanceEtapeKm = calculerDistanceParTemps(step.duration);
        }

        // Accumulation de la distance globale du trajet
        distanceTotaleTrajet += distanceEtapeKm;

        console.log(`   [${i + 1}] ${icone} - ${step.from.name} -> ${step.to.name} (${step.duration_formatted}) (${distanceEtapeKm.toFixed(2)} km, 0.0 gCO2e)`);
      } else {
        // Calcul de l'étape de transport (Bus, Métro, Train, Tramway)
        const nodeA = nodeMap[step.from.id];
        const nodeB = nodeMap[step.to.id];

        let distanceEtape = 0;
        let co2Etape = 0;

        if (nodeA && nodeB) {
          const calcul = calculerEmpreinteTroncon(nodeA, nodeB, step.mode);
          distanceEtape = calcul.distanceKm;
          co2Etape = calcul.co2Grams;

          co2TotalTrajet += co2Etape;
          distanceTotaleTrajet += distanceEtape;
        }

        const ligne = step.route_short_name ? `Ligne ${step.route_short_name}` : step.mode;
        console.log(`   [${i + 1}] ${ligne} (${step.mode}) - ${step.from.name} -> ${step.to.name} - ${step.nb_stops} arret(s) - ${step.duration_formatted} (${distanceEtape.toFixed(2)} km, ${co2Etape.toFixed(1)} gCO2e)`);
      }
    });

    console.log(`\n--------------------------------------`);
    console.log(`Duree totale    : ${result.total_duration_formatted}`);
    console.log(`Correspondances : ${result.nb_correspondances}`);
    console.log(`Nombre d'arrets : ${result.nb_stops}`);
    console.log(`Distance totale : ${distanceTotaleTrajet.toFixed(2)} km`);
    console.log(`Pollution CO2   : ${(co2TotalTrajet / 1000).toFixed(3)} kg CO2e`);
    console.log('--------------------------------------');
  }
}