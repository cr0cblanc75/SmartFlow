/**
 * GTFS -> timetable.json
 * ----------------------
 * Genere un fichier minimaliste d'horaires de depart par arret et par ligne.
 *
 * Structure de sortie :
 * {
 *   "STOP_ID": {
 *     "ROUTE_ID": [28800, 29160, 29520, ...]  // secondes depuis minuit, tries
 *   }
 * }
 *
 * Usage :
 *   node gtfs_to_timetable.js --input ./gtfs --output ./timetable.json
 *
 * Dependances :
 *   npm install papaparse minimist
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");
const Papa = require("papaparse");
const minimist = require("minimist");

const args = minimist(process.argv.slice(2));
const GTFS_DIR = path.resolve(args.input || "./gtfs");
const OUT_FILE = path.resolve(args.output || "./timetable.json");

// ─── Helper CSV ───────────────────────────────────────────────────────────────
function readCSV(filename) {
    const filepath = path.join(GTFS_DIR, filename);
    if (!fs.existsSync(filepath)) {
        console.warn(`Fichier manquant : ${filename} (ignore)`);
        return [];
    }
    const raw = fs.readFileSync(filepath, "utf8");
    const result = Papa.parse(raw, { header: true, skipEmptyLines: true });
    console.log(`${filename} -> ${result.data.length} lignes`);
    return result.data;
}

// ─── HH:MM:SS -> secondes ─────────────────────────────────────────────────────
function toSeconds(t) {
    if (!t) return null;
    const [h, m, s] = t.trim().split(":").map(Number);
    if ([h, m, s].some(isNaN)) return null;
    return h * 3600 + m * 60 + s;
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
    console.log("\nLecture des fichiers GTFS depuis :", GTFS_DIR);

    const rawTrips = readCSV("trips.txt");
    const rawRoutes = readCSV("routes.txt");

    // Index trip_id -> route_id + direction_id.
    // La cle des horaires est route_id||direction_id : elle sepable les deux sens
    // (departs differents selon la direction) sans fragmenter comme le ferait le
    // headsign (les short-turns partagent le meme direction_id). Doit rester
    // strictement alignee avec la cle utilisee cote graphe et back_path.js.
    const routeOfTrip = {};
    const dirOfTrip = {};
    for (const t of rawTrips) {
        routeOfTrip[t.trip_id] = t.route_id;
        dirOfTrip[t.trip_id] = (t.direction_id || "").trim();
    }

    console.log(`${Object.keys(routeOfTrip).length} trips indexes\n`);

    // ── Streaming stop_times ───────────────────────────────────────────────────
    // timetable : { stop_id -> { route_id -> Set<departure_sec> } }
    const timetable = {};
    let headers = null;
    let lineCount = 0;

    const stopTimesPath = path.join(GTFS_DIR, "stop_times.txt");
    if (!fs.existsSync(stopTimesPath)) {
        console.error("stop_times.txt introuvable !");
        process.exit(1);
    }

    await new Promise((resolve, reject) => {
        const rl = readline.createInterface({
            input: fs.createReadStream(stopTimesPath, { encoding: "utf8" }),
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
            const depTime = row["departure_time"];

            const depSec = toSeconds(depTime);
            if (depSec === null) return;

            const routeId = routeOfTrip[tripId];
            if (!routeId) return;
            const dir = dirOfTrip[tripId] || "";
            const key = `${routeId}||${dir}`;

            if (!timetable[stopId]) timetable[stopId] = {};
            if (!timetable[stopId][key]) timetable[stopId][key] = new Set();
            timetable[stopId][key].add(depSec);
        });

        rl.on("close", () => {
            console.log(`\nstop_times.txt -> ${lineCount.toLocaleString()} lignes lues`);
            resolve();
        });

        rl.on("error", reject);
    });

    // ── Conversion Set -> Array trie + ecriture streaming ─────────────────────
    console.log("\nEcriture de timetable.json...");

    const out = fs.createWriteStream(OUT_FILE, { encoding: "utf8" });

    out.write("{\n");

    const stopIds = Object.keys(timetable);
    for (let i = 0; i < stopIds.length; i++) {
        const stopId = stopIds[i];
        const routes = timetable[stopId];
        const comma = i < stopIds.length - 1 ? "," : "";

        // Convertit chaque Set en Array trie
        const cleanRoutes = {};
        for (const [routeId, depSet] of Object.entries(routes)) {
            cleanRoutes[routeId] = [...depSet].sort((a, b) => a - b);
        }

        out.write(`  ${JSON.stringify(stopId)}: ${JSON.stringify(cleanRoutes)}${comma}\n`);
    }

    out.write("}\n");

    await new Promise((resolve, reject) => {
        out.end();
        out.on("finish", resolve);
        out.on("error", reject);
    });

    console.log(`\ntimetable.json genere -> ${OUT_FILE}`);
    console.log(`  Arrets avec horaires : ${stopIds.length}`);
}

main().catch((err) => {
    console.error("Erreur :", err);
    process.exit(1);
});
