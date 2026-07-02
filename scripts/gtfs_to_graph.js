/**
 * GTFS → graph.json (version streaming + wheelchair + couleurs)
 *
 * Usage :
 *   node gtfs_to_graph.js --input ./gtfs --output ./graph.json
 *
 * Dépendances :
 *   npm install papaparse minimist
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");
const Papa = require("papaparse");
const minimist = require("minimist");

const args = minimist(process.argv.slice(2));
const GTFS_DIR = path.resolve(args.input || "./gtfs");
const OUT_FILE = path.resolve(args.output || "./graph.json");

const ROUTE_TYPE_LABEL = {
    0: "tram",
    1: "metro",
    2: "train",
    3: "bus",
    4: "ferry",
    11: "trolleybus",
    12: "monorail",
    100: "train",
    400: "metro",
    700: "bus",
    900: "tram",
};

// wheelchair_boarding / wheelchair_accessible :
//   0 = info inconnue
//   1 = accessible
//   2 = non accessible
function parseWheelchair(val) {
    const v = parseInt(val, 10);
    if (v === 1) return true;
    if (v === 2) return false;
    return null; // inconnu
}

/** Normalise une couleur hex GTFS → "#RRGGBB" ou null */
function parseColor(val) {
    if (!val) return null;
    const c = val.trim().replace(/^#/, "");
    if (!/^[0-9A-Fa-f]{6}$/.test(c)) return null;
    return `#${c.toUpperCase()}`;
}

// ─── Helper : lit un petit fichier CSV en entier ──────────────────────────────
function readCSV(filename) {
    const filepath = path.join(GTFS_DIR, filename);
    if (!fs.existsSync(filepath)) {
        console.warn(`⚠️  Fichier manquant : ${filename} (ignoré)`);
        return [];
    }
    const raw = fs.readFileSync(filepath, "utf8");
    const result = Papa.parse(raw, { header: true, skipEmptyLines: true });
    console.log(`✅ ${filename} → ${result.data.length} lignes`);
    return result.data;
}

// ─── Helper : convertit HH:MM:SS en secondes ─────────────────────────────────
function toSeconds(t) {
    if (!t) return null;
    const [h, m, s] = t.trim().split(":").map(Number);
    if ([h, m, s].some(isNaN)) return null;
    return h * 3600 + m * 60 + s;
}

// ─── Streaming stop_times.txt ─────────────────────────────────────────────────
function streamStopTimes(filepath, tripIndex, nodes) {
    return new Promise((resolve, reject) => {
        const edgeAccum = {};
        let headers = null;
        let lineCount = 0;
        let lastTrip = null;
        let lastStop = null;

        const rl = readline.createInterface({
            input: fs.createReadStream(filepath, { encoding: "utf8" }),
            crlfDelay: Infinity,
        });

        rl.on("line", (line) => {
            lineCount++;

            if (!headers) {
                headers = line.split(",").map((s) => s.trim().replace(/^\uFEFF/, ""));
                return;
            }

            if (lineCount % 500000 === 0) {
                process.stdout.write(`   ... ${(lineCount / 1e6).toFixed(1)}M lignes lues\r`);
            }

            const cols = line.split(",");
            const row = {};
            headers.forEach((h, i) => {
                row[h] = (cols[i] || "").trim();
            });

            const tripId = row["trip_id"];
            const stopId = row["stop_id"];
            const arrTime = row["arrival_time"];
            const depTime = row["departure_time"];

            if (!nodes[stopId]) return;

            const tripInfo = tripIndex[tripId];
            if (!tripInfo) return;

            // Enrichit les modes de l'arrêt
            nodes[stopId].modes.add(tripInfo.mode);

            // Arête avec l'arrêt précédent du même trip
            if (lastTrip && lastTrip.tripId === tripId && lastStop) {
                const depSec = toSeconds(lastStop.depTime);
                const arrSec = toSeconds(arrTime);

                if (depSec !== null && arrSec !== null) {
                    const duration = arrSec - depSec;

                    if (duration >= 0 && duration <= 7200) {
                        const key = `${lastStop.stopId}||${stopId}||${tripInfo.route_id}`;
                        if (!edgeAccum[key]) {
                            edgeAccum[key] = {
                                from: lastStop.stopId,
                                to: stopId,
                                route_id: tripInfo.route_id,
                                route_short_name: tripInfo.route_short_name,
                                mode: tripInfo.mode,
                                color: tripInfo.color,
                                text_color: tripInfo.text_color,
                                total: 0,
                                count: 0,
                            };
                        }
                        edgeAccum[key].total += duration;
                        edgeAccum[key].count += 1;
                    }
                }
            }

            lastTrip = { tripId };
            lastStop = { stopId, depTime };
        });

        rl.on("close", () => {
            console.log(`\n✅ stop_times.txt → ${lineCount.toLocaleString()} lignes lues`);
            resolve(edgeAccum);
        });

        rl.on("error", reject);
    });
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
    console.log("\n📂 Lecture des fichiers GTFS depuis :", GTFS_DIR);

    const rawStops = readCSV("stops.txt");
    const rawRoutes = readCSV("routes.txt");
    const rawTrips = readCSV("trips.txt");
    const rawTransfers = readCSV("transfers.txt");

    // ── Sommets ────────────────────────────────────────────────────────────────
    console.log("\n🔵 Construction des sommets...");
    const nodes = {};
    for (const stop of rawStops) {
        const lat = parseFloat(stop.stop_lat);
        const lon = parseFloat(stop.stop_lon);
        if (isNaN(lat) || isNaN(lon)) continue;

        nodes[stop.stop_id] = {
            id: stop.stop_id,
            name: (stop.stop_name || "Inconnu").trim(),
            latitude: lat,
            longitude: lon,
            modes: new Set(),
            // Accessibilité PMR : true / false / null (inconnu)
            wheelchair: parseWheelchair(stop.wheelchair_boarding),
        };
    }
    console.log(`   → ${Object.keys(nodes).length} sommets créés`);

    // ── Index routes (avec couleurs) ───────────────────────────────────────────
    console.log("\n🔶 Index routes & trips...");
    const routeIndex = {};
    for (const r of rawRoutes) {
        routeIndex[r.route_id] = {
            route_type: parseInt(r.route_type, 10) || 3,
            color: parseColor(r.route_color),
            text_color: parseColor(r.route_text_color),
        };
    }

    const tripIndex = {};
    for (const t of rawTrips) {
        const ri = routeIndex[t.route_id] || { route_type: 3, color: null, text_color: null };
        const rtype = ri.route_type;
        tripIndex[t.trip_id] = {
            route_id: t.route_id,
            route_short_name: (t.route_short_name || t.trip_headsign || "").trim(),
            mode: ROUTE_TYPE_LABEL[rtype] || "bus",
            color: ri.color,
            text_color: ri.text_color,
        };
    }
    console.log(`   → ${Object.keys(tripIndex).length} trips indexés`);

    // ── Streaming stop_times ───────────────────────────────────────────────────
    console.log("\n🔴 Lecture streaming de stop_times.txt...");
    const stopTimesPath = path.join(GTFS_DIR, "stop_times.txt");
    if (!fs.existsSync(stopTimesPath)) {
        console.error("❌ stop_times.txt introuvable !");
        process.exit(1);
    }

    const edgeAccum = await streamStopTimes(stopTimesPath, tripIndex, nodes);

    // ── Arêtes finales ─────────────────────────────────────────────────────────
    const edges = Object.values(edgeAccum).map((e) => ({
        from: e.from,
        to: e.to,
        weight: Math.round(e.total / e.count), // secondes
        mode: e.mode,
        route_id: e.route_id,
        route_short_name: e.route_short_name,
        color: e.color, // ex: "#F2A900" pour la ligne 5 RATP
        text_color: e.text_color, // ex: "#FFFFFF"
    }));
    console.log(`\n🔴 ${edges.length} arêtes calculées`);

    // ── Correspondances ────────────────────────────────────────────────────────
    if (rawTransfers.length > 0) {
        console.log("🟡 Ajout des correspondances...");
        let count = 0;
        for (const t of rawTransfers) {
            if (!nodes[t.from_stop_id] || !nodes[t.to_stop_id]) continue;
            if (t.from_stop_id === t.to_stop_id) continue;

            const weight = t.transfer_type === "2" && t.min_transfer_time ? parseInt(t.min_transfer_time, 10) : 180; // 3 min par défaut

            // Une correspondance est accessible PMR seulement si les deux arrêts le sont
            const wFrom = nodes[t.from_stop_id].wheelchair;
            const wTo = nodes[t.to_stop_id].wheelchair;
            const wc = wFrom === true && wTo === true ? true : wFrom === false || wTo === false ? false : null;

            edges.push({
                from: t.from_stop_id,
                to: t.to_stop_id,
                weight,
                mode: "transfer",
                route_id: null,
                route_short_name: "correspondance",
                color: null,
                text_color: null,
                wheelchair: wc,
            });
            count++;
        }
        console.log(`   → ${count} correspondances ajoutées`);
    }

    // ── Nettoyage ──────────────────────────────────────────────────────────────
    console.log("\n🧹 Nettoyage...");
    const usedIds = new Set(edges.flatMap((e) => [e.from, e.to]));
    const cleanNodes = Object.values(nodes)
        .filter((n) => usedIds.has(n.id))
        .map((n) => ({ ...n, modes: [...n.modes] }));
    console.log(`   → ${cleanNodes.length} sommets utiles conservés`);

    // ── Écriture JSON ──────────────────────────────────────────────────────────
    const graph = {
        meta: {
            generated_at: new Date().toISOString(),
            source: "GTFS IDFM",
            total_nodes: cleanNodes.length,
            total_edges: edges.length,
        },
        nodes: cleanNodes,
        edges,
    };

    fs.writeFileSync(OUT_FILE, JSON.stringify(graph, null, 2), "utf8");

    console.log(`\n✅ graph.json généré → ${OUT_FILE}`);
    console.log(`   Sommets : ${cleanNodes.length}`);
    console.log(`   Arêtes  : ${edges.length}`);
    console.log("\nExemple sommet :\n", JSON.stringify(cleanNodes[0], null, 2));
    console.log("\nExemple arête  :\n", JSON.stringify(edges[0], null, 2));
}

main().catch((err) => {
    console.error("❌ Erreur :", err);
    process.exit(1);
});
