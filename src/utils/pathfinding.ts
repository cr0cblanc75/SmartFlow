/**
 * Algorithm: Dijkstra's Shortest Path
 * Utilisé pour trouver l'itinéraire optimal entre deux points
 */

interface Node {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

interface Edge {
  from: string;
  to: string;
  distance: number;
  weight: number;
}

interface Graph {
  nodes: Node[];
  edges: Edge[];
}

interface PathResult {
  path: string[];
  totalDistance: number;
  nodeNames: string[];
}

/**
 * Calcule le chemin le plus court entre deux nœuds
 * @param graph - Graphe contenant les nœuds et arêtes
 * @param start - ID du nœud de départ
 * @param end - ID du nœud d'arrivée
 * @returns Chemin optimal avec distance totale
 */
export function findShortestPath(graph: Graph, start: string, end: string): PathResult {
  const distances: { [key: string]: number } = {};
  const previous: { [key: string]: string | null } = {};
  const unvisited = new Set<string>();

  // Initialisation
  graph.nodes.forEach((node) => {
    distances[node.id] = node.id === start ? 0 : Infinity;
    previous[node.id] = null;
    unvisited.add(node.id);
  });

  while (unvisited.size > 0) {
    // Trouver le nœud non visité avec la distance minimale
    let current: string | null = null;
    let minDistance = Infinity;

    for (const nodeId of unvisited) {
      if (distances[nodeId] < minDistance) {
        minDistance = distances[nodeId];
        current = nodeId;
      }
    }

    if (!current || distances[current] === Infinity) break;

    unvisited.delete(current);

    // Mettre à jour les distances des voisins
    const neighbors = graph.edges
      .filter((edge) => edge.from === current)
      .concat(graph.edges.filter((edge) => edge.to === current));

    for (const edge of neighbors) {
      const neighbor = edge.from === current ? edge.to : edge.from;

      if (unvisited.has(neighbor)) {
        const newDistance = distances[current] + edge.distance;
        if (newDistance < distances[neighbor]) {
          distances[neighbor] = newDistance;
          previous[neighbor] = current;
        }
      }
    }
  }

  // Reconstruire le chemin
  const path: string[] = [];
  let current: string | null = end;

  while (current !== null) {
    path.unshift(current);
    current = previous[current];
  }

  if (path[0] !== start) {
    return { path: [], totalDistance: Infinity, nodeNames: [] };
  }

  // Convertir IDs en noms
  const nodeNames = path.map((id) => graph.nodes.find((n) => n.id === id)?.name || id);

  return {
    path,
    totalDistance: distances[end],
    nodeNames,
  };
}

/**
 * Calcule tous les chemins alternatifs (k-shortest paths)
 */
export function findAlternativePaths(
  graph: Graph,
  start: string,
  end: string,
  k: number = 3
): PathResult[] {
  const paths: PathResult[] = [];

  // Pour cette démo, on retourne juste le chemin principal
  // Un algo plus avancé calculerait k chemins distincts
  paths.push(findShortestPath(graph, start, end));

  return paths;
}

/**
 * Calcule les statistiques du réseau
 */
export function getNetworkStats(graph: Graph): {
  totalNodes: number;
  totalEdges: number;
  averageEdgeDistance: number;
  maxEdgeDistance: number;
} {
  const totalEdges = graph.edges.length;
  const totalDistance = graph.edges.reduce((sum, edge) => sum + edge.distance, 0);

  return {
    totalNodes: graph.nodes.length,
    totalEdges,
    averageEdgeDistance: totalEdges > 0 ? totalDistance / totalEdges : 0,
    maxEdgeDistance: graph.edges.length > 0 ? Math.max(...graph.edges.map((e) => e.distance)) : 0,
  };
}
