import { useEffect, useState } from 'react';

import { processArretData } from '@/utils/arrets-processor';
import { findShortestPath, getNetworkStats, PathResult } from '@/utils/pathfinding';

interface Graph {
  nodes: Array<{ id: string; name: string; lat: number; lng: number; commune?: string; mode?: string }>;
  edges: Array<{ from: string; to: string; distance: number; weight: number }>;
}

export function usePathfinding() {
  const [graph, setGraph] = useState<Graph | null>(null);
  const [path, setPath] = useState<PathResult | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        // Charger et traiter les données réelles d'arrêts
        const processedData = await processArretData();
        const graphData: Graph = {
          nodes: processedData.nodes,
          edges: processedData.edges,
        };

        setGraph(graphData);

        // Si on a au moins 2 arrêts, calculer un chemin exemple
        if (processedData.nodes.length >= 2) {
          const startNode = processedData.nodes[0];
          const endNode = processedData.nodes[Math.min(processedData.nodes.length - 1, 10)];

          const result = findShortestPath(graphData, startNode.id, endNode.id);
          setPath(result);
        }

        // Calculer les stats du réseau
        const networkStats = getNetworkStats(graphData);
        setStats({
          ...networkStats,
          ...processedData.stats,
        });

        setLoading(false);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        setError((error as Error).message);
        setLoading(false);
      }
    })();
  }, []);

  const calculatePath = (start: string, end: string) => {
    if (!graph) return null;
    return findShortestPath(graph, start, end);
  };

  return {
    graph,
    path,
    stats,
    loading,
    error,
    calculatePath,
  };
}
