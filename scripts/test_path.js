/**
 * Harnais de test pour back_path.js
 * ---------------------------------
 * Rejoue un trajet en ligne de commande, sans passer par l'app Expo.
 *
 * Usage (depuis le dossier scripts/) :
 *   node test_path.js "République" "Bastille"                 -> départ par défaut 08:00
 *   node test_path.js "République" "Bastille" --time 20:05    -> heure de départ
 *   node test_path.js "République" "Bastille" --arrive 09:00  -> heure d'arrivée souhaitée
 *   node test_path.js "République" "Bastille" --time 20:05 --wheelchair
 *
 * Rien à installer : back_path.js est du CommonJS et ne dépend que de
 * eco_calculator.js (local). graph.json / timetable.json sont lus ici.
 */

const bp = require("./back_path.js");

// ─── Lecture des arguments (sans dépendance externe) ──────────────────────────
const argv = process.argv.slice(2);
const positional = argv.filter((a) => !a.startsWith("--"));
const [fromName, toName] = positional;

function flag(name) {
  const i = argv.indexOf(`--${name}`);
  return i !== -1 ? argv[i + 1] : null;
}
const departureTime = flag("time");
const arrivalTime = flag("arrive");
const wheelchair = argv.includes("--wheelchair");

// Permet de tester une nouvelle génération sans écraser les fichiers courants :
//   node test_path.js "A" "B" --graph graph.new.json --timetable timetable.new.json
const graph = require("./" + (flag("graph") || "graph.json"));
const timetable = require("./" + (flag("timetable") || "timetable.json"));

if (!fromName || !toName) {
  console.log('Usage : node test_path.js "Départ" "Arrivée" [--time HH:MM | --arrive HH:MM] [--wheelchair]');
  process.exit(0);
}

// ─── Choix de la fonction selon les options ───────────────────────────────────
let result;
if (arrivalTime) {
  result = bp.findPathTimedArrival(graph, timetable, fromName, toName, { arrivalTime, wheelchair });
} else {
  result = bp.findPathTimed(graph, timetable, fromName, toName, { departureTime: departureTime || "08:00", wheelchair });
}

// ─── Affichage lisible ────────────────────────────────────────────────────────
if (!result) {
  console.log("Aucun chemin trouvé.");
  process.exit(0);
}

console.log(`\n${result.from.name} -> ${result.to.name}`);
console.log(`Départ  : ${result.departure_time}   Arrivée : ${result.arrival_time}`);
console.log(`Durée   : ${result.total_duration_formatted}   Correspondances : ${result.nb_correspondances}   Arrêts : ${result.nb_stops}`);
console.log("\nDétail :");

result.steps.forEach((step, i) => {
  if (step.type === "correspondance") {
    console.log(`  [${i + 1}] Correspondance  ${step.from.name} -> ${step.to.name}  (${step.duration_formatted})`);
  } else {
    const line = step.route_short_name ? `Ligne ${step.route_short_name}` : step.mode;
    const dir = step.direction_label && step.direction_label !== step.route_short_name ? ` dir. ${step.direction_label}` : "";
    console.log(`  [${i + 1}] ${line}${dir} (${step.mode})  ${step.from.name} -> ${step.to.name}  | ${step.nb_stops} arrêt(s) | ${step.duration_formatted}`);
    // Décommenter pour voir chaque arrêt intermédiaire :
    // console.log("       " + step.stops.map((s) => s.name).join(" -> "));
  }
});
console.log("");
