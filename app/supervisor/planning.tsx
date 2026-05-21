import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Animated, Platform, RefreshControl, ScrollView, StyleSheet, Text, View, } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomNav } from '@/components/ui/BottomNav';
import { Card } from '@/components/ui/Card';
import { Header } from '@/components/ui/Header';
import { PremiumPressable } from '@/components/ui/PremiumPressable';
import { SupervisorWebLayout } from '@/components/admin/WebLayout';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { DesignTokens, getColors } from '@/constants/designSystem';
import { SUPERVISOR_NAV_ITEMS } from '@/constants/navigation';
import { useTheme } from '@/context/ThemeContext';
import { GMS, GMSService } from '@/services/gms.service';
import { StatsService } from '@/services/stats.service';

export default function PlanningPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const colors = getColors(theme);
  const [stores, setStores] = useState<GMS[]>([]);
  const [orderedStores, setOrderedStores] = useState<GMS[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [draggingId, setDraggingId] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!refreshing) setLoading(true);
    try {
      const [gmsData, kpiData] = await Promise.all([
          GMSService.getAll(),
          StatsService.getKPIStats()
      ]);
      setStores(gmsData);
      setOrderedStores(gmsData.slice(0, 5));
      setStats(kpiData);
    } catch (error) {
      console.error('Failed to load planning data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const navigateToStore = (store: GMS) => {
    router.push({
      pathname: '/supervisor/map',
      params: {
        lat: store.latitude.toString(),
        lng: store.longitude.toString(),
        storeName: store.name,
        zoom: '16',
      },
    });
  };

  const pct = stats?.visit_completion_pct || 0;
  const isWeb = Platform.OS === 'web';
  const today = new Date().getDate();

  const Content = (
    <>
      {!isWeb && (
        <Header
          title="Planning"
          subtitle="Manage routes & visit progress"
          showBack
          rightIcon="calendar-outline"
        />
      )}

      <ScrollView
        contentContainerStyle={isWeb ? { paddingBottom: 40 } : styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <SectionHeader title="Calendar View" />

        <Card style={styles.calendarCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700' }}>May 2026</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                    <Ionicons name="chevron-back" size={20} color={colors.textSecondary} />
                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                </View>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                    <Text key={i} style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', width: 30, textAlign: 'center' }}>{day}</Text>
                ))}
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 }}>
                {Array.from({ length: 31 }).map((_, i) => {
                    const isToday = i + 1 === today;
                    return (
                        <View key={i} style={{ width: '14.28%', aspectRatio: 1, padding: 4 }}>
                            <View style={{ flex: 1, borderRadius: 8, backgroundColor: isToday ? colors.primary : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                                <Text style={{ color: isToday ? '#fff' : colors.text, fontSize: 14, fontWeight: isToday ? '700' : '400' }}>{i + 1}</Text>
                            </View>
                        </View>
                    );
                })}
            </View>
        </Card>

        <SectionHeader title="Assign / Edit Tasks" actionLabel="New Task" onAction={() => {}} />

        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : orderedStores.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={{ color: colors.textSecondary }}>No stores found</Text>
          </View>
        ) : (
          <View style={styles.storeList}>
            <Text style={{ color: colors.textMuted, fontSize: 11, paddingHorizontal: 20, paddingBottom: 8, letterSpacing: 1 }}>
              LONG-PRESS TO REORDER
            </Text>
            {orderedStores.map((store, index) => {
              const isDragging = draggingId === store.id;
              return (
                <Animated.View
                  key={store.id}
                  style={[
                    styles.storeCard,
                    {
                      backgroundColor: isDragging ? colors.primary + '18' : colors.surface,
                      borderColor: isDragging ? colors.primary : colors.border,
                      borderWidth: isDragging ? 1.5 : 1,
                      transform: [{ scale: isDragging ? 1.02 : 1 }],
                      shadowColor: isDragging ? colors.primary : 'transparent',
                      shadowOffset: { width: 0, height: isDragging ? 8 : 2 },
                      shadowOpacity: isDragging ? 0.3 : 0.08,
                      shadowRadius: isDragging ? 16 : 4,
                      elevation: isDragging ? 12 : 2,
                    },
                  ]}
                >
                  {/* Drag Handle */}
                  <PremiumPressable
                    onLongPress={() => setDraggingId(store.id)}
                    onPressOut={() => {
                      if (draggingId === store.id) {
                        // Simulate reorder: move dragged item up one position
                        setOrderedStores(prev => {
                          const newOrder = [...prev];
                          const idx = newOrder.findIndex(s => s.id === store.id);
                          if (idx > 0) {
                            [newOrder[idx - 1], newOrder[idx]] = [newOrder[idx], newOrder[idx - 1]];
                          }
                          return newOrder;
                        });
                        setDraggingId(null);
                      }
                    }}
                    style={{ padding: 10 }}
                    enableScale={false}
                  >
                    <Ionicons
                      name="reorder-three"
                      size={22}
                      color={isDragging ? colors.primary : colors.textMuted}
                    />
                  </PremiumPressable>

                  <View style={[styles.storeIconWrap, { backgroundColor: colors.primary + '15' }]}>
                    <Ionicons name="storefront" size={20} color={colors.primary} />
                  </View>

                  <View style={styles.storeInfo}>
                    <Text style={[styles.storeName, { color: colors.text }]}>{store.name}</Text>
                    <Text style={[styles.storeAddr, { color: colors.textSecondary }]} numberOfLines={1}>
                      Priority #{index + 1} · {store.address || 'No address'}
                    </Text>
                  </View>

                  <PremiumPressable
                    onPress={() => navigateToStore(store)}
                    style={{ backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 }}
                  >
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Assign</Text>
                  </PremiumPressable>
                </Animated.View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {!isWeb && <BottomNav items={SUPERVISOR_NAV_ITEMS} activeRoute="/supervisor/planning" />}
    </>
  );

  return (
    <SupervisorWebLayout title="Planning & Scheduling">
      {isWeb ? (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
           {Content}
        </View>
      ) : (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
           {Content}
        </SafeAreaView>
      )}
    </SupervisorWebLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: 120 },
  calendarCard: { marginHorizontal: DesignTokens.spacing.lg, padding: DesignTokens.spacing.lg },
  storeList: { paddingHorizontal: DesignTokens.spacing.lg, gap: DesignTokens.spacing.sm },
  storeCard: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8, borderRadius: 16, marginBottom: 8 },
  storeIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  storeInfo: { flex: 1 },
  storeName: { ...DesignTokens.typography.bodyBold, fontSize: 15 },
  storeAddr: { ...DesignTokens.typography.caption },
  mapPressable: { marginHorizontal: DesignTokens.spacing.lg, borderRadius: 16, overflow: 'hidden' },
  mapCard: { height: 200, overflow: 'hidden', padding: 0, marginHorizontal: 0 },
  mapImage: { width: '100%', height: '100%' },
  mapOverlay: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  mapOverlayText: { fontSize: 13, fontWeight: '700' },
  loadingContainer: { padding: 40, alignItems: 'center' },
  emptyContainer: { padding: 40, alignItems: 'center' },
});
