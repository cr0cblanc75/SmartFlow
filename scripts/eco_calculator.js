// eco_calculator.js
// Fonctions de calcul carbone pour SmartFlow.
// Ce module évalue les émissions de CO2 par tronçon en combinant
// l'exploitation des véhicules et, le cas échéant, leur fabrication.

// Constantes globales
const RAYON_TERRE_KM = 6371;
const FACTEUR_DETOUR_BUS = 1.25;
const VITESSE_MARCHE_KMH = 5;

// 1. Facteurs d'émission d'exploitation (gCO2e / passager.km)
const FE_BUS_PARIS = 128.52;
const FE_BUS_PETITE_COURONNE = 136.90;
const FE_BUS_GRANDE_COURONNE = 145.68;

// Référence du « mode le plus sale » pour la normalisation carbone.
// Utilisée en interne pour calculer des ratios de propreté plutôt que des valeurs absolues.
const FE_REFERENCE_SALE_G_PAR_KM = FE_BUS_GRANDE_COURONNE;

// Moyennes observées sur les réseaux RATP / SNCF IDFM
const FE_EXPLOITATION_METRO = 3.8;
const FE_EXPLOITATION_RER_TRAIN = 4.1;
const FE_EXPLOITATION_TRAMWAY = 2.2;

// 2. Facteurs d'émission de fabrication (gCO2e / passager.km)
// Ces valeurs incluent l'amortissement des véhicules, la capacité et les taux de remplissage.
const FE_FABRICATION_METRO = 0.22;
const FE_FABRICATION_TRAMWAY = 0.41;
const FE_FABRICATION_RER_TRAIN = 0.55;

/**
 * Détermine la zone IDFM associée à une coordonnée.
 * @param {number} latitude
 * @param {number} longitude
 * @returns {string} "PARIS", "PETITE_COURONNE" ou "GRANDE_COURONNE"
 */
function determinerZoneIdfm(latitude, longitude) {
    const latParis = 48.8566;
    const lonParis = 2.3522;
    const distanceVersParis = calculerHaversineBrute(latitude, longitude, latParis, lonParis);

    if (distanceVersParis <= 6) return "PARIS";
    if (distanceVersParis <= 18) return "PETITE_COURONNE";
    return "GRANDE_COURONNE";
}

/**
 * Calcule la distance à vol d'oiseau entre deux points GPS.
 * Utilise la formule de Haversine.
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {number} distance en kilomètres
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
 * Calcule l'empreinte carbone d'un tronçon entre deux arrêts.
 * Combine distance, mode de transport et facteurs d'émission.
 * @param {Object} nodeA Objet de départ contenant latitude et longitude
 * @param {Object} nodeB Objet d'arrivée contenant latitude et longitude
 * @param {string} mode Mode de transport : 'bus', 'metro', 'train', 'tramway'
 * @returns {Object} { distanceKm, co2Grams, details }
 */
function calculerEmpreinteTroncon(nodeA, nodeB, mode = 'bus') {
    const distanceBrute = calculerHaversineBrute(nodeA.latitude, nodeA.longitude, nodeB.latitude, nodeB.longitude);

    let distanceKm = distanceBrute;
    let feExploitation = 0;
    let feFabrication = 0;
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
            // Les bus suivent un parcours plus sinueux que la ligne droite.
            distanceKm = distanceBrute * FACTEUR_DETOUR_BUS;

            const midLat = (nodeA.latitude + nodeB.latitude) / 2;
            const midLon = (nodeA.longitude + nodeB.longitude) / 2;
            const zone = determinerZoneIdfm(midLat, midLon);

            if (zone === "PARIS") feExploitation = FE_BUS_PARIS;
            else if (zone === "PETITE_COURONNE") feExploitation = FE_BUS_PETITE_COURONNE;
            else feExploitation = FE_BUS_GRANDE_COURONNE;

            feFabrication = 0; // Fabrication bus non prise en compte par défaut
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
 * Estime une distance piétonne à partir d'un temps de correspondance.
 * Utilisé lorsque les coordonnées exactes ne sont pas disponibles.
 * @param {number} travelSec Durée du tronçon en secondes
 * @returns {number} distance estimée en kilomètres
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