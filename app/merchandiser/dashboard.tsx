import { BottomNav } from '@/components/ui/BottomNav';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Header } from '@/components/ui/Header';
import { ListItemSkeleton } from '@/components/ui/LoadingSkeleton';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SettingsItemType, SettingsModal } from '@/components/ui/SettingsModal';
import { getFullImageUrl } from '@/constants/api';
import { DesignTokens, getColors } from '@/constants/designSystem';
import { MERCHANDISER_NAV_ITEMS } from '@/constants/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Fonts } from '@/hooks/useFonts';
import { GMS, GMSService } from '@/services/gms.service';
import { LeaveRequest, LeaveService } from '@/services/leave.service';
import { LocationPoint, LocationService, WorkdaySession } from '@/services/location.service';

import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  ActivityIndicator,
  Easing,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MerchandiserDashboard() {
  const router = useRouter();
  const { signOut, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [workday, setWorkday] = useState<WorkdaySession | null>(null);
  const [activeVisit, setActiveVisit] = useState<any>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [elapsed, setElapsed] = useState('0m');
  const [stores, setStores] = useState<GMS[]>([]);
  const [currentLocation, setCurrentLocation] = useState<LocationPoint | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeLeave, setActiveLeave] = useState<LeaveRequest | null>(null);


  const colors = getColors(theme);

  const loadData = async () => {
    if (!refreshing) setLoading(true);
    try {
      const gmsData = await GMSService.getAll({ skip: 0, limit: 500 });
      setStores(gmsData);

      // Refresh session state
      const session = await LocationService.getActiveSession();
      if (session.workday) setWorkday(session.workday);
      else setWorkday(null);

      if (session.visit) setActiveVisit(session.visit);
      else setActiveVisit(null);

      // Get initial location for the live indicator
      const loc = await LocationService.getCurrentLocation();
      if (loc) setCurrentLocation(loc);

      // Check for active leave
      const leave = await LeaveService.getActiveLeave();
      setActiveLeave(leave);
    } catch (error) {

      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      LocationService.getActiveSession().then(session => {
        if (session.workday) setWorkday(session.workday);
        if (session.visit) setActiveVisit(session.visit);
      });
      loadData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  useEffect(() => {
    if (!workday || workday.status !== 'active') return;
    const update = async () => {
      const mins = LocationService.getSessionDuration(workday);
      setElapsed(LocationService.formatDuration(mins));
      LocationService.sendHeartbeat();

      // Update live coordinates
      const loc = await LocationService.getCurrentLocation();
      if (loc) setCurrentLocation(loc);
    };
    update();
    const interval = setInterval(update, 60000);

    return () => clearInterval(interval);
  }, [workday]);

  useEffect(() => {
    // Re-check leave every 3 minutes independently of workday
    const leaveCheck = setInterval(async () => {
        const leave = await LeaveService.getActiveLeave();
        setActiveLeave(leave);
    }, 180000);

    return () => clearInterval(leaveCheck);
  }, []);

  const handleStartWorkday = async () => {
    setGpsLoading(true);
    try {
      const session = await LocationService.startWorkday();
      if (session) {
        setWorkday(session);
        Alert.alert('Workday Started', 'GPS tracking is now active on the server.');
        router.push('/merchandiser/planning');
      }
    } catch (error: any) {
      const msg = error.message;
      Alert.alert(
        msg?.includes('leave') ? 'Leave Active' : 'Error', 
        msg || 'Failed to start workday. Please enable GPS and try again.'
      );
    } finally {
      setGpsLoading(false);
    }
  };

  const handleEndWorkday = async () => {
    setGpsLoading(true);
    try {
      // 1. Calculate stats for the report
      const completedCount = workday?.completedGmsIds?.length || 0;
      const totalCount = stores.length || 0;
      const reportTitle = `Workday Summary - ${new Date().toLocaleDateString()}`;
      const reportNotes = `Shift duration: ${elapsed}. Visited ${completedCount}/${totalCount} stores.`;

      // 2. Submit the report to admin
      const { ReportService } = await import('@/services/report.service');
      await ReportService.submitShiftSummary({
        name: reportTitle,
        notes: reportNotes,
        visits_planned: totalCount,
        visits_completed: completedCount,
        workday_id: workday?.id ? parseInt(workday.id) : undefined
      });

      // 3. End the workday session
      const success = await LocationService.endWorkday();
      if (success) {
        setWorkday(null);
        setActiveVisit(null);
        Alert.alert('Workday Ended', 'Your shift has been recorded. A detailed report with all your tasks has been automatically sent to the admin.');
      }
    } catch (error: any) {
      Alert.alert('Cannot End Day', error.response?.data?.detail || 'Failed to end workday');
    } finally {
      setGpsLoading(false);
    }
  };

  const confirmEndWorkday = () => {
    const activeVisitMsg = activeVisit ? "\n\nNote: Your active visit will be automatically closed." : "";
    Alert.alert(
      'End Workday?',
      `You have worked for ${elapsed}. Are you sure you want to end your shift?${activeVisitMsg}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Finish Workday', style: 'destructive', onPress: handleEndWorkday },
      ]
    );
  };

  const merchandiserName = user ? `${user.firstName} ${user.lastName}` : 'Merchandiser';
  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  const settingsItems: SettingsItemType[] = [
    {
      icon: 'notifications-outline',
      label: 'Notifications',
      color: colors.primary,
      onPress: () => { setSettingsVisible(false); router.push('/merchandiser/notifications'); }
    },
    {
      icon: 'people',
      label: 'Reach a supervisor',
      color: colors.success,
      onPress: () => { setSettingsVisible(false); router.push('/merchandiser/reach-supervisor'); }
    },
    {
      icon: 'calendar-outline',
      label: 'Request Leave',
      color: colors.success,
      onPress: () => { setSettingsVisible(false); router.push('/merchandiser/leave'); }
    },

    {
      icon: 'document-text-outline',
      label: 'Documents',
      color: colors.secondary,
      onPress: () => { setSettingsVisible(false); router.push('/merchandiser/documents'); }
    },
    {
      icon: 'chatbubbles-outline',
      label: 'Complaints',
      color: colors.warning,
      onPress: () => { setSettingsVisible(false); router.push('/merchandiser/complaints'); }
    },
    {
      icon: 'newspaper-outline',
      label: 'Articles',
      color: colors.primary,
      onPress: () => { setSettingsVisible(false); router.push('/merchandiser/articles'); }
    },
    {
      icon: theme === 'dark' ? 'moon' : 'sunny',
      label: 'Dark Mode',
      color: colors.warning,
      onPress: () => toggleTheme(),
    },
    {
      icon: 'log-out-outline',
      label: 'Sign Out',
      color: colors.danger,
      isDestructive: true,
      onPress: () => { setSettingsVisible(false); signOut(); }
    }
  ];

  const LiveGPSIndicator = () => {
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
      if (workday) {
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.2,
              duration: 1000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 1000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ])
        ).start();
      } else {
        pulseAnim.setValue(1);
      }
    }, [workday]);

    if (!workday) return null;

    const activity = workday.activity || 'still';
    const battery = workday.battery_level ? Math.round(workday.battery_level * 100) : null;

    const getActivityIcon = () => {
      switch(activity) {
        case 'driving': return 'car';
        case 'walking': return 'walk';
        case 'running': return 'fitness';
        default: return 'location';
      }
    };

    return (
      <View style={[styles.liveGpsContainer, { backgroundColor: colors.surfaceSecondary }]}>
        <View style={styles.liveGpsContent}>
          <View style={styles.liveGpsPulseContainer}>
            <Animated.View
              style={[
                styles.liveGpsPulse,
                {
                  backgroundColor: colors.success,
                  transform: [{ scale: pulseAnim }],
                  opacity: pulseAnim.interpolate({
                    inputRange: [1, 1.2],
                    outputRange: [0.6, 0]
                  })
                }
              ]}
            />
            <View style={[styles.liveGpsDot, { backgroundColor: colors.success }]} />
          </View>
          <View style={styles.liveGpsTextContainer}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
               <Ionicons name={getActivityIcon() as any} size={14} color={colors.success} />
               <Text style={[styles.liveGpsTitle, { color: colors.text }]}>
                 {activity.toUpperCase()} TRACKING
               </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {currentLocation && (
                  <Text style={[styles.liveGpsCoords, { color: colors.textSecondary }]}>
                    {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
                  </Text>
                )}
                {battery !== null && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                    <Ionicons name="battery-charging" size={12} color={colors.textSecondary} />
                    <Text style={{ fontSize: 10, color: colors.textSecondary }}>{battery}%</Text>
                  </View>
                )}
            </View>
          </View>
        </View>
        <View style={[styles.liveGpsBadge, { backgroundColor: colors.success + '20' }]}>
          <Text style={[styles.liveGpsBadgeText, { color: colors.success }]}>ACTIVE</Text>
        </View>
      </View>
    );
  };

  const LeaveBanner = () => {
    if (!activeLeave) return null;

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
      <View style={[styles.leaveBanner, { backgroundColor: colors.warning + '15' }]}>
        <View style={[styles.leaveBannerIcon, { backgroundColor: colors.warning + '20' }]}>
            <Ionicons name="calendar" size={24} color={colors.warning} />
        </View>
        <View style={{ flex: 1 }}>
            <Text style={[styles.leaveBannerTitle, { color: colors.warning }]}>
                APPROVED LEAVE ACTIVE
            </Text>
            <Text style={[styles.leaveBannerText, { color: colors.text }]}>
                You are on {activeLeave.leave_type} leave from {formatDate(activeLeave.start_date)} until {formatDate(activeLeave.end_date)}.
            </Text>
            <Text style={[styles.leaveBannerSubtitle, { color: colors.textSecondary }]}>
                Work actions are temporarily disabled.
            </Text>
        </View>
        <View style={[styles.leaveBadge, { backgroundColor: colors.warning }]}>
            <Ionicons name="lock-closed" size={12} color="#fff" />
            <Text style={styles.leaveBadgeText}>LOCKED</Text>
        </View>
      </View>
    );
  };




  const completedCount = workday?.completedGmsIds?.length || 0;
  const totalCount = stores.length || 0;
  const progress = totalCount > 0 ? completedCount / totalCount : 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title={merchandiserName}
        subtitle={todayStr}
        avatar={user?.profileImage ? { uri: getFullImageUrl(user.profileImage) } : null}
        onAvatarPress={() => router.push('/merchandiser/profile')}
        secondRightIcon="notifications-outline"
        onSecondRightIconPress={() => router.push('/merchandiser/notifications')}
        rightIcon="settings-outline"
        onRightIconPress={() => setSettingsVisible(true)}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <LeaveBanner />
        <LiveGPSIndicator />


        {/* 1. Daily Progress Section */}
        {!loading && (
          <View style={styles.dailyProgressContainer}>
            <SectionHeader title="Daily Progress" size="sm" />
            <Card style={styles.progressCard} elevation="md">
              <View style={styles.progressInfoRow}>
                <View style={styles.progressLabelCol}>
                  <Text style={[styles.progressMainLabel, { color: colors.text }]}>Visits Completion</Text>
                  <Text style={[styles.progressSubLabel, { color: colors.textSecondary }]}>
                    {completedCount} of {totalCount} stores visited today
                  </Text>
                </View>
                <View style={[styles.progressBadge, { backgroundColor: colors.primary + '15' }]}>
                  <Text style={[styles.progressBadgeText, { color: colors.primary }]}>
                    {Math.round(progress * 100)}%
                  </Text>
                </View>
              </View>
              <ProgressBar
                progress={progress}
                style={styles.progressBar}
                color={progress === 1 ? colors.success : colors.primary}
              />
            </Card>
          </View>
        )}

        {/* 2. Today's Schedule Section */}
        <SectionHeader
          title="Today's Schedule"
          actionLabel="View All"
          size="sm"
          onAction={() => router.push('/merchandiser/gms')}
        />

        <View style={styles.routeList}>
          {loading ? (
            Array(3).fill(0).map((_, i) => (
              <ListItemSkeleton key={i} />
            ))
          ) : (
            stores.slice(0, 20).map((store, idx) => {
              const isVisitingThis = activeVisit?.gmsId === store.id;
              const isCompleted = workday?.completedGmsIds?.includes(store.id);

              // Find the ID of the 'next' store in the sequence
              const nextStoreId = stores.find(s => !workday?.completedGmsIds?.includes(s.id))?.id;
              const isNext = store.id === nextStoreId;
              const isLocked = !isCompleted && !isVisitingThis && !isNext;

              return (
                <Card
                  key={store.id}
                  onPress={() => {
                    if (isVisitingThis || isNext) {
                      router.push('/merchandiser/visits');
                    } else {
                      router.push({ pathname: '/merchandiser/gms', params: { selectedId: store.id } });
                    }
                  }}
                  padding="xs"
                  style={[
                    styles.routeItem,
                    isVisitingThis && { borderLeftWidth: 4, borderLeftColor: colors.primary },
                  ]}
                >
                  <View style={styles.routeItemContent}>
                    <View style={[styles.storeIconBox, { backgroundColor: colors.surfaceSecondary }]}>
                      <MaterialIcons name="storefront" size={20} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.storeName, { color: colors.text }]} numberOfLines={1}>
                        {store.name}
                      </Text>
                      <Text style={[styles.storeAddress, { color: colors.textSecondary }]} numberOfLines={1}>
                        {store.address || store.city}
                      </Text>
                    </View>
                  </View>

                    <View style={styles.actionContainer}>
                      {isCompleted && (
                        <View style={styles.statusBox}>
                          <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                          <Text style={[styles.badgeStatusText, { color: colors.success }]}>Done</Text>
                        </View>
                      )}

                      {workday && !activeVisit && isNext && !isCompleted && (
                        <TouchableOpacity
                          style={[
                            styles.actionPill, 
                            { backgroundColor: activeLeave ? colors.border : colors.primary }
                          ]}
                          disabled={!!activeLeave}
                          onPress={async () => {
                            if (activeLeave) {
                                Alert.alert('On Leave', 'Visit actions are disabled during your approved leave.');
                                return;
                            }
                            setGpsLoading(true);
                            try {
                              const v = await LocationService.startVisit(store.id);
                              if (v) {
                                setActiveVisit(v);
                                Alert.alert('Visit Started', `You are now logged into ${store.name}`);
                                router.push('/merchandiser/visits');
                              }
                            } catch (e: any) {
                              Alert.alert('Cannot Start Visit', e.message);
                            } finally {
                              setGpsLoading(false);
                              loadData();
                            }
                          }}
                        >
                          {activeLeave ? (
                            <Ionicons name="lock-closed" size={14} color="#fff" />
                          ) : (
                            <Text style={styles.actionPillText}>VISIT</Text>
                          )}
                        </TouchableOpacity>

                      )}

                      {isVisitingThis && (
                        <TouchableOpacity
                          style={[styles.actionPill, { backgroundColor: colors.danger }]}
                          onPress={async () => {
                            setGpsLoading(true);
                            try {
                              const success = await LocationService.endVisit();
                              if (success) {
                                setActiveVisit(null);
                                const session = await LocationService.getActiveSession();
                                if (session.workday) setWorkday(session.workday);
                                loadData();
                              }
                            } catch (e: any) {
                              Alert.alert('Cannot End Visit', e.message);
                            } finally {
                              setGpsLoading(false);
                            }
                          }}
                        >
                          <Text style={styles.actionPillText}>END</Text>
                        </TouchableOpacity>
                      )}

                    {workday && !activeVisit && isLocked && !isCompleted && (
                      <View style={styles.statusBox}>
                        <Ionicons name="lock-closed" size={14} color={colors.textSecondary} />
                        <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '600' }}>Locked</Text>
                      </View>
                    )}

                    {!activeVisit && !workday && !isCompleted && (
                      <View style={styles.statusBox}>
                        <Ionicons name="time-outline" size={16} color={colors.warning} />
                        <Text style={{ color: colors.warning, fontSize: 12, fontWeight: '700' }}>Pending</Text>
                      </View>
                    )}
                  </View>
                </Card>
              );
            })
          )}

          {!loading && stores.length === 0 && (
            <View style={styles.emptyContainer}>
              <Ionicons name="map-outline" size={48} color={colors.border} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No stores on today's schedule.</Text>
            </View>
          )}
        </View>

        {/* 3. Start Work Section (Moved to Bottom) */}
        {!loading && (
          <View style={styles.workdayControlSection}>
            <SectionHeader title={workday ? "Current Session" : "Workday Management"} />
            <Card style={styles.gpsCard} elevation="md">
              <View style={styles.gpsHeader}>
                <View style={[styles.gpsIconBox, { backgroundColor: workday ? colors.success + '20' : colors.primary + '20' }]}>
                  <Ionicons name="location" size={24} color={workday ? colors.success : colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.gpsLabel, { color: colors.text }]}>Working Session</Text>
                  <View style={styles.statusRow}>
                    <View style={[styles.statusDot, { backgroundColor: workday ? colors.success : colors.textSecondary }]} />
                    <Text style={[styles.statusText, { color: workday ? colors.success : colors.textSecondary }]}>
                      {workday ? `Active (${elapsed})` : 'Not Started'}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.gpsControls}>
                {workday ? (
                  <View style={styles.activeWorkdayControls}>
                    <TouchableOpacity
                      style={[styles.actionPill, { backgroundColor: colors.danger, flex: 0, minWidth: 100, alignSelf: 'flex-end' }]}
                      onPress={confirmEndWorkday}
                    >
                      {gpsLoading ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.actionPillText}>END DAY</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={{ gap: 8 }}>
                    <Button
                      title="Start Work"
                      variant={activeLeave ? "secondary" : "primary"}
                      fullWidth
                      onPress={handleStartWorkday}
                      loading={gpsLoading}
                      disabled={!!activeLeave}
                      icon={activeLeave ? "lock-closed" : "play"}
                    />
                    {activeLeave && (
                      <Text style={{ textAlign: 'center', fontSize: 12, color: colors.warning }}>
                        You are currently on approved leave. ({new Date(activeLeave.start_date).toLocaleDateString()} - {new Date(activeLeave.end_date).toLocaleDateString()})
                      </Text>
                    )}
                  </View>
                )}

              </View>
            </Card>
          </View>
        )}
      </ScrollView>

      <BottomNav items={MERCHANDISER_NAV_ITEMS} activeRoute="/merchandiser/dashboard" />

      <SettingsModal
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        items={settingsItems}
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    paddingBottom: 120,
  },
  statsGrid: {
    flexDirection: 'row',
    padding: DesignTokens.spacing.sm,
    gap: DesignTokens.spacing.sm,
  },
  gpsCard: {
    margin: DesignTokens.spacing.lg,
    padding: 12,
    borderRadius: 16,
  },
  gpsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing.md,
  },
  gpsIconBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gpsLabel: {
    ...DesignTokens.typography.bodyBold,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    ...DesignTokens.typography.caption,
    fontFamily: Fonts.bodySemiBold,
  },
  gpsControls: {
    marginTop: DesignTokens.spacing.lg,
  },
  activeWorkdayControls: {
    flexDirection: 'row',
    gap: DesignTokens.spacing.md,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: DesignTokens.spacing.lg,
    gap: DesignTokens.spacing.md,
  },
  progressCard: {
    marginHorizontal: DesignTokens.spacing.lg,
    padding: 12,
  },
  progressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: DesignTokens.spacing.sm,
  },
  progressSubtitle: {
    ...DesignTokens.typography.caption,
  },
  routeList: {
    paddingHorizontal: DesignTokens.spacing.lg,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderRadius: 14,
    minHeight: 52,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  routeItemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  storeIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeName: {
    ...DesignTokens.typography.bodyBold,
  },
  storeAddress: {
    ...DesignTokens.typography.caption,
  },
  actionContainer: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  actionPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionPillText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  badgeStatusText: {
    fontSize: 12,
    fontWeight: '800',
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingRight: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
    gap: 12,
  },
  emptyText: {
    ...DesignTokens.typography.body,
    textAlign: 'center',
  },
  liveGpsContainer: {
    marginHorizontal: DesignTokens.spacing.lg,
    marginTop: DesignTokens.spacing.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    ...DesignTokens.shadows.sm,
  },
  liveGpsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  liveGpsPulseContainer: {
    width: 12,
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  liveGpsPulse: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  liveGpsDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  liveGpsTextContainer: {
    gap: 2,
  },
  liveGpsTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  liveGpsCoords: {
    fontSize: 12,
    fontFamily: Fonts.mono,
  },
  liveGpsBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  liveGpsBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  dailyProgressContainer: {
    marginBottom: DesignTokens.spacing.sm,
  },
  progressInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabelCol: {
    flex: 1,
  },
  progressMainLabel: {
    ...DesignTokens.typography.bodyBold,
  },
  progressSubLabel: {
    ...DesignTokens.typography.caption,
  },
  progressBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  progressBadgeText: {
    ...DesignTokens.typography.bodyBold,
    color: DesignTokens.colors.light.primary, // Placeholder for dynamic
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  workdayControlSection: {
    marginTop: DesignTokens.spacing.sm,
    marginBottom: DesignTokens.spacing.lg,
  },
  leaveBanner: {
    margin: DesignTokens.spacing.lg,
    padding: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(231, 76, 60, 0.1)',
    ...DesignTokens.shadows.md,
  },
  leaveBannerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leaveBannerTitle: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 4,
  },
  leaveBannerText: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  leaveBannerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  leaveBadge: {
    position: 'absolute',
    top: -10,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    ...DesignTokens.shadows.sm,
  },
  leaveBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
  },
});
