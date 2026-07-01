// Constantes pour le calcul Haversine et la Base Carbone
const RAYON_TERRE_KM = 6371;
const FACTEUR_DETOUR_BUS = 1.25;

// 1. Facteurs d'Émission d'Exploitation (Amont + Combustion/Traction) en gCO2e / passager.km
const FE_BUS_PARIS = 128.52;
const FE_BUS_PETITE_COURONNE = 136.90;
const FE_BUS_GRANDE_COURONNE = 145.68;

// Moyennes d'exploitation constatées sur les réseaux RATP / SNCF IDFM
const FE_EXPLOITATION_METRO = 3.8;
const FE_EXPLOITATION_RER_TRAIN = 4.1;
const FE_EXPLOITATION_TRAMWAY = 2.2;

// 2. Facteurs d'Émission de Fabrication (Recalculés à partir des données de l'étude)
// Intègre la masse, les places, la durée de vie et le taux de remplissage
const FE_FABRICATION_METRO = 0.22;       // gCO2e / passager.km
const FE_FABRICATION_TRAMWAY = 0.41;     // gCO2e / passager.km
const FE_FABRICATION_RER_TRAIN = 0.55;   // Moyenne d'amortissement SNCF au réel
const VITESSE_MARCHE_M_S = 1.25;

function normaliserModeTransport(mode = 'bus') {
    if (typeof mode !== 'string') return 'bus';

    const modeNettoye = mode.toLowerCase().trim();

    if (modeNettoye === 'metro' || modeNettoye === 'métro') return 'metro';
    if (modeNettoye === 'train' || modeNettoye === 'rer' || modeNettoye === 'transilien') return 'train';
    if (modeNettoye === 'tramway' || modeNettoye === 'tram') return 'tramway';

    return 'bus';
}

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
    if (!nodeA || !nodeB || typeof nodeA.latitude !== 'number' || typeof nodeA.longitude !== 'number' || typeof nodeB.latitude !== 'number' || typeof nodeB.longitude !== 'number') {
        return {
            distanceKm: 0,
            co2Grams: 0,
            details: { mode: normaliserModeTransport(mode), feExploitation: 0, feFabrication: 0, reason: 'coordonnees_manquantes' }
        };
    }

    const distanceBrute = calculerHaversineBrute(nodeA.latitude, nodeA.longitude, nodeB.latitude, nodeB.longitude);

    let distanceKm = distanceBrute;
    let feExploitation = 0;
    let feFabrication = 0;

    // Normalisation du tag mode de transport
    const modeNettoye = normaliserModeTransport(mode);

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
 * Calcule la distance parcourue à pied à partir d'un temps donné.
 * Basé sur une vitesse de marche moyenne de 4.5 km/h (1.25 m/s).
 * @param {number} tempsMarcheSecondes - Le temps de marche total en secondes
 * @returns {number} La distance estimée en kilomètres
 */
function calculerDistanceParTemps(tempsMarcheSecondes) {
    if (!Number.isFinite(tempsMarcheSecondes) || tempsMarcheSecondes <= 0) {
        return 0;
    }

    const distanceMetres = tempsMarcheSecondes * VITESSE_MARCHE_M_S;
    return distanceMetres / 1000;
}

module.exports = {
    calculerEmpreinteTroncon,
    calculerHaversineBrute,
    calculerDistanceParTemps
};