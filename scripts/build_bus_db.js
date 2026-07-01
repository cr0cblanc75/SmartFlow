const fs = require('fs');

// Chargement de ton fichier brut IDFM complet
const idfmLines = require('./referentiel-des-lignes.json');

function extraireEnergiesDepuisJson(linesArray) {
    const dictionnaireEnergies = {};

    linesArray.forEach(line => {
        // Sécurité : On ne traite que les lignes de bus
        if (line.transportmode !== "bus") return;

        const shortName = line.shortname_line;
        if (!shortName) return;

        // Extraction des deux variables clés de ton JSON
        const entreprise = (line.operatorname || "").toLowerCase();
        const reseau = (line.networkname || "").toLowerCase();

        // ─── LOGIQUE DE DÉDUCTION EXCLUSIVE SUR LE JSON ───────────────────

        // 1. Déduction par exception de pointe (Lignes pilotes Hydrogène connues)
        if (shortName === "103" || shortName === "189") {
            dictionnaireEnergies[shortName] = "Hydrogène";
            return;
        }

        // 2. Déduction par Région / Réseau (Grande Couronne -> Priorité au BioGNV/Gaz)
        // On détecte les mots-clés géographiques ou de réseaux de grande couronne présents dans le JSON
        if (
            reseau.includes("orly") ||
            reseau.includes("meaux") ||
            reseau.includes("marne") ||
            reseau.includes("vexin") ||
            reseau.includes("essonne") ||
            reseau.includes("yvelines") ||
            entreprise.includes("transdev")
        ) {
            dictionnaireEnergies[shortName] = "BioGNV";
            return;
        }

        // 3. Déduction par Compagnie (RATP / Zone Urbaine Dense -> Priorité Électrique)
        // Le plan Bus2025 de la RATP convertit massivement Paris et la Petite Couronne à l'électrique
        if (entreprise.includes("ratp") || entreprise.includes("keolis ouest")) {
            dictionnaireEnergies[shortName] = "Électrique";
            return;
        }

        // 4. Fallback si le JSON ne permet pas de trancher clairement
        dictionnaireEnergies[shortName] = "Thermique/Hybride";
    });

    return dictionnaireEnergies;
}

console.log("⚡ Analyse statistique du JSON IDFM en cours...");
const baseOptimisee = extraireEnergiesDepuisJson(idfmLines);

// Sauvegarde du résultat
fs.writeFileSync('./bus_energies.json', JSON.stringify(baseOptimisee, null, 2));

// Petit log de complétion pour voir ce qu'il a extrait
const total = Object.keys(baseOptimisee).length;
console.log(`✅ Analyse terminée ! ${total} lignes de bus répertoriées dans 'bus_energies.json'.`);