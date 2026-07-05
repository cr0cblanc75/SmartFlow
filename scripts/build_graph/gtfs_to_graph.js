/**
 * GTFS -> graph.json (version streaming + wheelchair + couleurs + aretes consecutives)
 *
 * Correctif principal : on ne cree une arete que si les deux arrets sont
 * CONSECUTIFS dans le trip (stop_sequence n puis n+1). Cela elimine les
 * aretes "express" qui sautent des arrets intermediaires et causaient des
 * trajets avec un nombre d'arrets incorrect.
 *
 * Usage :
 *   node gtfs_to_graph.js --input ./gtfs --output ./graph.json
 *
 * Dependances :
 *   npm install papaparse minimist
 */

const fs       = require("fs");
const path     = require("path");
const readline = require("readline");
const Papa     = require("papaparse");
const minimist = require("minimist");

const args     = minimist(process.argv.slice(2));
const GTFS_DIR = path.resolve(args.input  || "./gtfs");
const OUT_FILE = path.resolve(args.output || "./graph.json");

const ROUTE_TYPE_LABEL = {
  0: "tram", 1: "metro", 2: "train", 3: "bus",
  4: "ferry", 11: "trolleybus", 12: "monorail",
  100: "train", 400: "metro", 700: "bus", 900: "tram",
};

function parseWheelchair(val) {
  const v = parseInt(val, 10);
  if (v === 1) return true;
  if (v === 2) return false;
  return null;
}

function parseColor(val) {
  if (!val) return null;
  const c = val.trim().replace(/^#/, "");
  if (!/^[0-9A-Fa-f]{6}$/.test(c)) return null;
  return `#${c.toUpperCase()}`;
}

function readCSV(filename) {
  const filepath = path.join(GTFS_DIR, filename);
  if (!fs.existsSync(filepath)) {
    console.warn(`Fichier manquant : ${filename} (ignore)`);
    return [];
  }
  const raw    = fs.readFileSync(filepath, "utf8");
  const result = Papa.parse(raw, { header: true, skipEmptyLines: true });
  console.log(`${filename} -> ${result.data.length} lignes`);
  return result.data;
}

function toSeconds(t) {
  if (!t) return null;
  const [h, m, s] = t.trim().split(":").map(Number);
  if ([h, m, s].some(isNaN)) return null;
  return h * 3600 + m * 60 + s;
}

// ─── Streaming stop_times.txt ─────────────────────────────────────────────────
// On stocke maintenant le stop_sequence pour verifier la consecutivite.
// Une arete n'est creee que si seq actuel == seq precedent + 1.
function streamStopTimes(filepath, tripIndex, nodes) {
  return new Promise((resolve, reject) => {
    const edgeAccum = {};
    let headers     = null;
    let lineCount   = 0;
    let lastTrip    = null;
    let lastStop    = null;

    const rl = readline.createInterface({
      input:     fs.createReadStream(filepath, { encoding: "utf8" }),
      crlfDelay: Infinity,
    });

    rl.on("line", (line) => {
      lineCount++;

      if (!headers) {
        headers = line.split(",").map(s => s.trim().replace(/^\uFEFF/, ""));
        return;
      }

      if (lineCount % 500000 === 0) {
        process.stdout.write(`   ... ${(lineCount / 1e6).toFixed(1)}M lignes lues\r`);
      }

      const cols = line.split(",");
      const row  = {};
      headers.forEach((h, i) => { row[h] = (cols[i] || "").trim(); });

      const tripId  = row["trip_id"];
      const stopId  = row["stop_id"];
      const seq     = parseInt(row["stop_sequence"], 10);
      const arrTime = row["arrival_time"];
      const depTime = row["departure_time"];

      if (!nodes[stopId]) return;
      if (isNaN(seq)) return;

      const tripInfo = tripIndex[tripId];
      if (!tripInfo) return;

      // Enrichit les modes de l'arret
      nodes[stopId].modes.add(tripInfo.mode);

      // Arete avec l'arret precedent du meme trip
      // CONDITION CLEE : on ne cree l'arete que si les deux arrets sont consecutifs
      if (lastTrip && lastTrip.tripId === tripId && lastStop) {
        const seqDiff = seq - lastStop.seq;

        // On accepte uniquement les aretes entre arrets strictement consecutifs
        if (seqDiff === 1) {
          const depSec = toSeconds(lastStop.depTime);
          const arrSec = toSeconds(arrTime);

          if (depSec !== null && arrSec !== null) {
            const duration = arrSec - depSec;

            if (duration >= 0 && duration <= 7200) {
              // Cle par sens (direction_id) : une arete A->B appartient a un seul
              // sens, on ne fusionne donc jamais les deux directions.
              const key = `${lastStop.stopId}||${stopId}||${tripInfo.route_id}||${tripInfo.direction_id}`;
              if (!edgeAccum[key]) {
                edgeAccum[key] = {
                  from:             lastStop.stopId,
                  to:               stopId,
                  route_id:         tripInfo.route_id,
                  route_short_name: tripInfo.route_short_name, // vrai n° de ligne
                  route_long_name:  tripInfo.route_long_name,
                  headsign:         tripInfo.headsign,          // terminus = direction
                  direction_id:     tripInfo.direction_id,
                  mode:             tripInfo.mode,
                  color:            tripInfo.color,
                  text_color:       tripInfo.text_color,
                  total:            0,
                  count:            0,
                };
              }
              edgeAccum[key].total += duration;
              edgeAccum[key].count += 1;
            }
          }
        }
        // Si seqDiff > 1 : service partiel / express -> on ignore l'arete
      }

      lastTrip = { tripId };
      lastStop = { stopId, seq, depTime };
    });

    rl.on("close", () => {
      console.log(`\nstop_times.txt -> ${lineCount.toLocaleString()} lignes lues`);
      resolve(edgeAccum);
    });

    rl.on("error", reject);
  });
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("\nLecture des fichiers GTFS depuis :", GTFS_DIR);

  const rawStops     = readCSV("stops.txt");
  const rawRoutes    = readCSV("routes.txt");
  const rawTrips     = readCSV("trips.txt");
  const rawTransfers = readCSV("transfers.txt");

  // Sommets
  console.log("\nConstruction des sommets...");
  const nodes = {};
  for (const stop of rawStops) {
    const lat = parseFloat(stop.stop_lat);
    const lon = parseFloat(stop.stop_lon);
    if (isNaN(lat) || isNaN(lon)) continue;

    nodes[stop.stop_id] = {
      id:         stop.stop_id,
      name:       (stop.stop_name || "Inconnu").trim(),
      latitude:   lat,
      longitude:  lon,
      modes:      new Set(),
      wheelchair: parseWheelchair(stop.wheelchair_boarding),
    };
  }
  console.log(`   -> ${Object.keys(nodes).length} sommets crees`);

  // Index routes + trips
  console.log("\nIndex routes & trips...");
  // IMPORTANT : le vrai numero de ligne ("1", "8", "A") est dans routes.txt
  // (route_short_name / route_long_name), PAS dans trips.txt. L'ancienne version
  // lisait t.route_short_name (colonne inexistante dans trips) et retombait donc
  // sur trip_headsign -> le champ "route_short_name" du graphe contenait en fait
  // le terminus. On capte ici la vraie identite de ligne depuis routes.txt.
  const routeIndex = {};
  for (const r of rawRoutes) {
    routeIndex[r.route_id] = {
      route_type:       parseInt(r.route_type, 10) || 3,
      route_short_name: (r.route_short_name || "").trim(),
      route_long_name:  (r.route_long_name  || "").trim(),
      color:            parseColor(r.route_color),
      text_color:       parseColor(r.route_text_color),
    };
  }

  // Terminus (headsign) majoritaire par (route_id, direction_id).
  // Le direction_id (0/1) identifie le sens ; le headsign majoritaire de ce sens
  // donne le terminus a afficher ("Direction Chateau de Vincennes"), robuste aux
  // trajets partiels (short-turns) qui ont un headsign minoritaire.
  const dirHeadsignCount = {};
  for (const t of rawTrips) {
    const rid = t.route_id;
    const dir = (t.direction_id || "").trim();
    const hs  = (t.trip_headsign || "").trim();
    if (!hs) continue;
    ((dirHeadsignCount[rid] ??= {})[dir] ??= {});
    dirHeadsignCount[rid][dir][hs] = (dirHeadsignCount[rid][dir][hs] || 0) + 1;
  }
  const dirHeadsign = {};
  for (const rid of Object.keys(dirHeadsignCount)) {
    dirHeadsign[rid] = {};
    for (const dir of Object.keys(dirHeadsignCount[rid])) {
      dirHeadsign[rid][dir] = Object.entries(dirHeadsignCount[rid][dir])
        .sort((a, b) => b[1] - a[1])[0][0];
    }
  }

  const tripIndex = {};
  for (const t of rawTrips) {
    const ri    = routeIndex[t.route_id] || {};
    const rtype = ri.route_type ?? 3;
    const dir   = (t.direction_id || "").trim();
    tripIndex[t.trip_id] = {
      route_id:         t.route_id,
      route_short_name: ri.route_short_name || "",                 // vrai n° de ligne
      route_long_name:  ri.route_long_name  || "",
      direction_id:     dir,
      headsign:         dirHeadsign[t.route_id]?.[dir]             // terminus du sens
                        || (t.trip_headsign || "").trim(),
      mode:             ROUTE_TYPE_LABEL[rtype] || "bus",
      color:            ri.color || null,
      text_color:       ri.text_color || null,
    };
  }
  console.log(`   -> ${Object.keys(tripIndex).length} trips indexes`);

  // Streaming stop_times
  console.log("\nLecture streaming de stop_times.txt...");
  const stopTimesPath = path.join(GTFS_DIR, "stop_times.txt");
  if (!fs.existsSync(stopTimesPath)) {
    console.error("stop_times.txt introuvable !");
    process.exit(1);
  }

  const edgeAccum = await streamStopTimes(stopTimesPath, tripIndex, nodes);

  // Aretes finales
  const edges = Object.values(edgeAccum).map(e => ({
    from:             e.from,
    to:               e.to,
    weight:           Math.round(e.total / e.count),
    mode:             e.mode,
    route_id:         e.route_id,
    route_short_name: e.route_short_name, // vrai n° de ligne ("1", "8", "A")
    route_long_name:  e.route_long_name,
    headsign:         e.headsign,         // terminus du sens (direction)
    direction_id:     e.direction_id,
    color:            e.color,
    text_color:       e.text_color,
  }));
  console.log(`\n${edges.length} aretes calculees`);

  // Correspondances
  if (rawTransfers.length > 0) {
    console.log("Ajout des correspondances...");
    let count = 0;
    for (const t of rawTransfers) {
      if (!nodes[t.from_stop_id] || !nodes[t.to_stop_id]) continue;
      if (t.from_stop_id === t.to_stop_id) continue;

      const weight = t.transfer_type === "2" && t.min_transfer_time
        ? parseInt(t.min_transfer_time, 10)
        : 180;

      const wFrom = nodes[t.from_stop_id].wheelchair;
      const wTo   = nodes[t.to_stop_id].wheelchair;
      const wc    = (wFrom === true && wTo === true) ? true
                  : (wFrom === false || wTo === false) ? false
                  : null;

      edges.push({
        from:             t.from_stop_id,
        to:               t.to_stop_id,
        weight,
        mode:             "transfer",
        route_id:         null,
        route_short_name: "correspondance",
        route_long_name:  null,
        headsign:         null,
        direction_id:     null,
        color:            null,
        text_color:       null,
        wheelchair:       wc,
      });
      count++;
    }
    console.log(`   -> ${count} correspondances ajoutees`);
  }

  // Nettoyage
  console.log("\nNettoyage...");
  const usedIds    = new Set(edges.flatMap(e => [e.from, e.to]));
  const cleanNodes = Object.values(nodes)
    .filter(n => usedIds.has(n.id))
    .map(n => ({ ...n, modes: [...n.modes] }));
  console.log(`   -> ${cleanNodes.length} sommets utiles conserves`);

  // Ecriture JSON
  const graph = {
    meta: {
      generated_at: new Date().toISOString(),
      source:       "GTFS IDFM",
      total_nodes:  cleanNodes.length,
      total_edges:  edges.length,
    },
    nodes: cleanNodes,
    edges,
  };

  fs.writeFileSync(OUT_FILE, JSON.stringify(graph, null, 2), "utf8");

  console.log(`\ngraph.json genere -> ${OUT_FILE}`);
  console.log(`   Sommets : ${cleanNodes.length}`);
  console.log(`   Aretes  : ${edges.length}`);
}

main().catch(err => {
  console.error("Erreur :", err);
  process.exit(1);
});