// Constantes pour le calcul Haversine et la Base Carbone
const RAYON_TERRE_KM = 6371;
const FACTEUR_DETOUR_BUS = 1.25;
const VITESSE_MARCHE_KMH = 5; // vitesse moyenne d'un pieton, utilisee pour estimer
// une distance a partir d'un temps de correspondance

// 1. Facteurs d'Émission d'Exploitation (Amont + Combustion/Traction) en gCO2e / passager.km
const FE_BUS_PARIS = 128.52;
const FE_BUS_PETITE_COURONNE = 136.90;
const FE_BUS_GRANDE_COURONNE = 145.68;

// Reference "mode le plus sale" utilisee par le routeur SmartFlow pour
// exprimer le cout carbone d'un troncon comme un ratio de propretee
// (emission du mode / emission de cette reference), plutot qu'en grammes
// bruts. C'est ce qui permet a beta d'avoir un effet progressif : le ratio
// vaut ~1 pour un bus (le pire cas courant) et ~0.02-0.03 pour le rail,
// quelle que soit la distance du troncon.
const FE_REFERENCE_SALE_G_PAR_KM = FE_BUS_GRANDE_COURONNE;

// Moyennes d'exploitation constatées sur les réseaux RATP / SNCF IDFM
const FE_EXPLOITATION_METRO = 3.8;
const FE_EXPLOITATION_RER_TRAIN = 4.1;
const FE_EXPLOITATION_TRAMWAY = 2.2;

// 2. Facteurs d'Émission de Fabrication (Recalculés à partir des données de l'étude)
// Intègre la masse, les places, la durée de vie et le taux de remplissage
const FE_FABRICATION_METRO = 0.22;       // gCO2e / passager.km
const FE_FABRICATION_TRAMWAY = 0.41;     // gCO2e / passager.km
const FE_FABRICATION_RER_TRAIN = 0.55;   // Moyenne d'amortissement SNCF au réel

/**
 * Détermine la couronne IDFM par rapport au centre de Paris (Notre-Dame)
 */
function determinerZoneIdfm(latitude, longitude) {
    const latParis = 48.8566;
    const lonParis = 2.3522;
    const d = calculerHaversineBrute(latitude, longitude, latParis, lonParis);

    if (d <= 6) return "PARIS";
    if (d <= 18) return "PETITE_COURONNE";
    return "GRANDE_COURONNE";
}

/**
 * Calcul de la distance à vol d'oiseau
 */
function calculerHaversineBrute(lat1, lon1, lat2, lon2) {
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const rLat1 = (lat1 * Math.PI) / 180;
    const rLat2 = (lat2 * Math.PI) / 180;

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return RAYON_TERRE_KM * c;
}

/**
 * Calcule l'empreinte carbone complète d'un tronçon (Exploitation + Fabrication)
 * @param {Object} nodeA Arrêt de départ
 * @param {Object} nodeB Arrêt d'arrivée
 * @param {string} mode 'bus', 'metro', 'train', 'tramway'
 */
function calculerEmpreinteTroncon(nodeA, nodeB, mode = 'bus') {
    const distanceBrute = calculerHaversineBrute(nodeA.latitude, nodeA.longitude, nodeB.latitude, nodeB.longitude);

    let distanceKm = distanceBrute;
    let feExploitation = 0;
    let feFabrication = 0;

    // Normalisation du tag mode de transport
    const modeNettoye = mode.toLowerCase().trim();

    switch (modeNettoye) {
        case 'metro':
        case 'métro':
            feExploitation = FE_EXPLOITATION_METRO;
            feFabrication = FE_FABRICATION_METRO;
            break;

        case 'train':
        case 'rer':
        case 'transilien':
            feExploitation = FE_EXPLOITATION_RER_TRAIN;
            feFabrication = FE_FABRICATION_RER_TRAIN;
            break;

        case 'tramway':
        case 'tram':
            feExploitation = FE_EXPLOITATION_TRAMWAY;
            feFabrication = FE_FABRICATION_TRAMWAY;
            break;

        case 'bus':
        default:
            // Application du coefficient de voirie sinueuse pour le bus
            distanceKm = distanceBrute * FACTEUR_DETOUR_BUS;

            const midLat = (nodeA.latitude + nodeB.latitude) / 2;
            const midLon = (nodeA.longitude + nodeB.longitude) / 2;
            const zone = determinerZoneIdfm(midLat, midLon);

            if (zone === "PARIS") feExploitation = FE_BUS_PARIS;
            else if (zone === "PETITE_COURONNE") feExploitation = FE_BUS_PETITE_COURONNE;
            else feExploitation = FE_BUS_GRANDE_COURONNE;

            feFabrication = 0; // Inclus ou négligeable selon les données UTP fournies
            break;
    }

    const co2Grams = distanceKm * (feExploitation + feFabrication);

    return {
        distanceKm,
        co2Grams,
        details: { mode: modeNettoye, feExploitation, feFabrication }
    };
}

/**
 * Estime une distance parcourue a pied a partir d'une duree de correspondance.
 * Utilise par les etapes de type "transfer" / "correspondance", pour lesquelles
 * on ne dispose pas de coordonnees fiables mais seulement d'un temps de trajet.
 * @param {number} travelSec duree du tronçon pieton, en secondes
 */
function calculerDistanceParTemps(travelSec) {
    if (!travelSec || travelSec <= 0) return 0;
    return (travelSec / 3600) * VITESSE_MARCHE_KMH;
}

module.exports = {
    calculerEmpreinteTroncon,
    calculerHaversineBrute,
    calculerDistanceParTemps,
    FE_REFERENCE_SALE_G_PAR_KM
};