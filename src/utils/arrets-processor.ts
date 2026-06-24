/**
 * Loadeur et processeur pour les données réelles d'arrêts
 * Transforme les données IDFM en graphe d'itinéraires
 */

import { ARRETS_DATA } from '@/data/arrets-data';

interface Arret {
  id: string;
  route_long_name: string;
  stop_id: string;
  stop_name: string;
  stop_lon: string;
  stop_lat: string;
  mode: string;
  nom_commune: string;
}

interface ProcessedNode {
  id: string;
  name: string;
  lat: number;
  lng: number;
  commune: string;
  mode: string;
}

interface ProcessedEdge {
  from: string;
  to: string;
  distance: number;
  weight: number;
  routeName: string;
}

/**
 * Calcule la distance entre deux coordonnées GPS (Haversine)
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Traite les données brutes pour créer un graphe
 */
export function processArretData() {
  try {
    const arrets = ARRETS_DATA as Arret[];
    
    const nodeMap = new Map<string, ProcessedNode>();
    const edges: ProcessedEdge[] = [];
    const routeStops = new Map<string, Arret[]>();

    // Étape 1: Créer les nœuds uniques
    arrets.forEach((arret) => {
      if (!nodeMap.has(arret.stop_id)) {
        nodeMap.set(arret.stop_id, {
          id: arret.stop_id,
          name: arret.stop_name,
          lat: parseFloat(arret.stop_lat),
          lng: parseFloat(arret.stop_lon),
          commune: arret.nom_commune,
          mode: arret.mode,
        });
      }

      // Regrouper par route
      if (!routeStops.has(arret.route_long_name)) {
        routeStops.set(arret.route_long_name, []);
      }
      routeStops.get(arret.route_long_name)?.push(arret);
    });

    // Étape 2: Créer les arêtes (connexions entre arrêts d'une même ligne)
    routeStops.forEach((stops, routeName) => {
      // Trier par position (lat/lon approximatif)
      const sorted = stops.sort((a, b) => {
        const latA = parseFloat(a.stop_lat);
        const lonA = parseFloat(a.stop_lon);
        const latB = parseFloat(b.stop_lat);
        const lonB = parseFloat(b.stop_lon);
        return latA - latB || lonA - lonB;
      });

      // Créer des arêtes entre arrêts consécutifs
      for (let i = 0; i < sorted.length - 1; i++) {
        const from = sorted[i];
        const to = sorted[i + 1];

        const distance = calculateDistance(
          parseFloat(from.stop_lat),
          parseFloat(from.stop_lon),
          parseFloat(to.stop_lat),
          parseFloat(to.stop_lon)
        );

        edges.push({
          from: from.stop_id,
          to: to.stop_id,
          distance: distance,
          weight: 1,
          routeName: routeName,
        });
      }
    });

    const nodes = Array.from(nodeMap.values());

    return {
      nodes,
      edges,
      stats: {
        totalArrets: nodes.length,
        totalConnections: edges.length,
        lignes: routeStops.size,
        centroid: {
          lat:
            nodes.reduce((sum, n) => sum + n.lat, 0) / nodes.length ||
            48.8566,
          lng:
            nodes.reduce((sum, n) => sum + n.lng, 0) / nodes.length ||
            2.3522,
        },
      },
    };
  } catch (error) {
    console.error('Erreur lors du chargement des arrêts:', error);
    throw error;
  }
}
