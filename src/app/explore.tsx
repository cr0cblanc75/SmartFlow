import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { Platform, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ExternalLink } from '@/components/external-link';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Collapsible } from '@/components/ui/collapsible';
import { WebBadge } from '@/components/web-badge';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { usePathfinding } from '@/hooks/use-pathfinding';

export default function TabTwoScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };
  const theme = useTheme();
  const { path, stats, loading } = usePathfinding();

  const contentPlatformStyle = Platform.select({
    android: {
      paddingTop: insets.top,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      paddingBottom: insets.bottom,
    },
    web: {
      paddingTop: Spacing.six,
      paddingBottom: Spacing.four,
    },
  });

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentInset={insets}
      contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="subtitle">SmartFlow - Pathfinding</ThemedText>
          <ThemedText style={styles.centerText} themeColor="textSecondary">
            Calcul d'itinéraire optimal avec algorithme Dijkstra
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.sectionsWrapper}>
          {loading ? (
            <ThemedText>Chargement...</ThemedText>
          ) : (
            <>
              {/* Statistiques du réseau */}
              <Collapsible title="📊 Statistiques du réseau">
                {stats && (
                  <ThemedView type="backgroundElement" style={styles.statsContainer}>
                    <ThemedText type="small">
                      <ThemedText type="smallBold">Nœuds:</ThemedText> {stats.totalNodes}
                    </ThemedText>
                    <ThemedText type="small">
                      <ThemedText type="smallBold">Arêtes:</ThemedText> {stats.totalEdges}
                    </ThemedText>
                    <ThemedText type="small">
                      <ThemedText type="smallBold">Distance moyenne:</ThemedText>{' '}
                      {stats.averageEdgeDistance.toFixed(2)} km
                    </ThemedText>
                    <ThemedText type="small">
                      <ThemedText type="smallBold">Distance max:</ThemedText>{' '}
                      {stats.maxEdgeDistance.toFixed(2)} km
                    </ThemedText>
                  </ThemedView>
                )}
              </Collapsible>

              {/* Chemin optimal */}
              <Collapsible title="🗺️ Itinéraire optimal (A → E)">
                {path && (
                  <ThemedView type="backgroundElement" style={styles.pathContainer}>
                    <ThemedText type="smallBold">Chemin:</ThemedText>
                    <ThemedText type="small" style={styles.pathText}>
                      {path.nodeNames.join(' → ')}
                    </ThemedText>

                    <ThemedText type="smallBold" style={styles.marginTop}>
                      Distance totale: {path.totalDistance.toFixed(2)} km
                    </ThemedText>

                    <ThemedText type="small" style={styles.marginTop}>
                      Étapes:
                    </ThemedText>
                    {path.path.map((nodeId, index) => (
                      <ThemedText key={nodeId} type="small" style={styles.stepText}>
                        {index + 1}. {nodeId}
                      </ThemedText>
                    ))}
                  </ThemedView>
                )}
              </Collapsible>

              {/* Documentation */}
              <Collapsible title="📚 À propos">
                <ThemedText type="small">
                  Cette démo utilise l'algorithme <ThemedText type="code">Dijkstra</ThemedText> pour
                  trouver le chemin le plus court entre deux points.
                </ThemedText>
                <ThemedText type="small" style={styles.marginTop}>
                  <ThemedText type="smallBold">Fichier de données:</ThemedText>{' '}
                  <ThemedText type="code">src/data/edges.json</ThemedText>
                </ThemedText>
                <ThemedText type="small" style={styles.marginTop}>
                  <ThemedText type="smallBold">Algorithme:</ThemedText>{' '}
                  <ThemedText type="code">src/utils/pathfinding.ts</ThemedText>
                </ThemedText>
                <ThemedText type="small" style={styles.marginTop}>
                  <ThemedText type="smallBold">Hook personnalisé:</ThemedText>{' '}
                  <ThemedText type="code">src/hooks/use-pathfinding.ts</ThemedText>
                </ThemedText>
              </Collapsible>
            </>
          )}
        </ThemedView>
        {Platform.OS === 'web' && <WebBadge />}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  container: {
    maxWidth: MaxContentWidth,
    flexGrow: 1,
  },
  titleContainer: {
    gap: Spacing.three,
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.six,
  },
  centerText: {
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  linkButton: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.five,
    justifyContent: 'center',
    gap: Spacing.one,
    alignItems: 'center',
  },
  sectionsWrapper: {
    gap: Spacing.five,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
  },
  collapsibleContent: {
    alignItems: 'center',
  },
  imageTutorial: {
    width: '100%',
    aspectRatio: 296 / 171,
    borderRadius: Spacing.three,
    marginTop: Spacing.two,
  },
  imageReact: {
    width: 100,
    height: 100,
    alignSelf: 'center',
  },
  statsContainer: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  pathContainer: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  pathText: {
    fontWeight: 'bold',
    marginTop: Spacing.one,
  },
  marginTop: {
    marginTop: Spacing.two,
  },
  stepText: {
    marginLeft: Spacing.two,
    marginTop: Spacing.one,
  },
});
