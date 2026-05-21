import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomNav } from '@/components/ui/BottomNav';
import { Card } from '@/components/ui/Card';
import { Header } from '@/components/ui/Header';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SettingsDrawer, SettingsItemType } from '@/components/ui/SettingsDrawer';
import { getFullImageUrl } from '@/constants/api';
import { DesignTokens, getColors } from '@/constants/designSystem';
import { SUPERVISOR_NAV_ITEMS } from '@/constants/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { StatsService, SupervisorStats } from '@/services/stats.service';

export default function SupervisorDashboard() {
  const router = useRouter();
  const { signOut, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<SupervisorStats | null>(null);
  const [teamAgents, setTeamAgents] = useState<any[]>([]);

  const colors = getColors(theme);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!refreshing) setLoading(true);
    try {
      const [dbStats, teamData] = await Promise.all([
        StatsService.getSupervisorStats(),
        StatsService.getTeamStatus()
      ]);
      if (dbStats) setStats(dbStats);
      if (teamData) setTeamAgents(teamData);
    } catch (err) {
      console.error('Supervisor load data error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const supervisorName = user ? `${user.firstName} ${user.lastName}` : 'Supervisor';

  const settingsItems: SettingsItemType[] = [
    {
      icon: 'notifications-outline',
      label: 'Notifications',
      color: colors.primary,
      onPress: () => { setSettingsVisible(false); router.push('/supervisor/notifications'); }
    },
    {
      icon: 'document-text-outline',
      label: 'Documents',
      color: colors.primary,
      onPress: () => { setSettingsVisible(false); router.push('/supervisor/documents'); }
    },
    {
      icon: 'map-outline',
      label: 'My Routes',
      color: colors.primary,
      onPress: () => { setSettingsVisible(false); router.push('/supervisor/map'); }
    },
    {
      icon: 'calendar-outline',
      label: 'Visit Schedule',
      color: colors.primary,
      onPress: () => { setSettingsVisible(false); router.push('/supervisor/planning'); }
    },
    {
      icon: 'warning-outline',
      label: 'Complaints',
      color: colors.primary,
      onPress: () => { setSettingsVisible(false); router.push('/supervisor/complaints'); }
    },
    {
      icon: 'airplane-outline',
      label: 'Leave Requests',
      color: colors.primary,
      onPress: () => { setSettingsVisible(false); router.push('/supervisor/leave'); }
    },
    {
      icon: 'log-out-outline',
      label: 'Sign Out',
      color: colors.danger,
      isDestructive: true,
      onPress: () => { setSettingsVisible(false); signOut(); }
    }
  ];


  const REPORT_ACTIONS = [
    { id: 'attendance', label: 'Attendance', icon: 'account-clock-outline', type: 'mci', color: '#4F46E5', route: '/supervisor/attendance' },
    { id: 'logs', label: 'Visit Logs', icon: 'clipboard-list-outline', type: 'mci', color: '#10B981', route: '/supervisor/visit_logs' },
    { id: 'complaints', label: 'Issues & Reports', icon: 'alert-circle-outline', type: 'mci', color: '#EF4444', route: '/supervisor/complaints' },
    { id: 'performance', label: 'Performance', icon: 'trending-up', type: 'ion', color: '#F59E0B', route: '/supervisor/performance' },
  ];

  const Content = (
    <>
      <Header
        title={supervisorName}
        subtitle="Team Command Center"
        avatar={user?.profileImage ? { uri: getFullImageUrl(user.profileImage) } : null}
        onAvatarPress={() => router.push('/supervisor/profile')}
        secondRightIcon="notifications-outline"
        onSecondRightIconPress={() => router.push('/supervisor/notifications')}
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
        {/* 1. Real-time Team Status */}
        <SectionHeader title="Team Operations Live" actionLabel="View Map" onAction={() => router.push('/supervisor/map')} />
        <View style={styles.teamList}>
          {teamAgents.length > 0 ? (
            teamAgents.map(agent => (
              <Card key={agent.id} style={styles.detailedAgentCard}>
                <View style={styles.detailedAgentHeader}>
                  <Image 
                    source={agent.avatar ? { uri: getFullImageUrl(agent.avatar) } : require('@/assets/images/neat.png')} 
                    style={styles.agentAvatar} 
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.agentName, { color: colors.text }]}>{agent.name}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <View style={[styles.statusDot, { backgroundColor: agent.status === 'visiting' ? colors.success : agent.status === 'travelling' ? colors.primary : agent.status === 'on_leave' ? colors.danger : colors.border }]} />
                      <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary }}>
                        {agent.status === 'visiting' ? 'Active Visit' : agent.status === 'travelling' ? 'Travelling' : agent.status === 'on_leave' ? 'On Leave' : 'Offline'}
                      </Text>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                     <Text style={{ fontSize: 18, fontWeight: '800', color: agent.completion_pct >= 100 ? colors.success : colors.primary }}>{agent.completion_pct || 0}%</Text>
                     <Text style={{ fontSize: 9, fontWeight: '700', color: colors.textMuted }}>COMPLETED</Text>
                  </View>
                </View>
                
                <View style={{ height: 1, backgroundColor: colors.border + '40', marginVertical: 12 }} />
                
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <View style={{ flex: 1.5 }}>
                    <Text style={{ fontSize: 9, color: colors.textMuted, fontWeight: '800', marginBottom: 4 }}>CURRENT ACTIVITY</Text>
                    <Text style={{ fontSize: 12, color: colors.text, fontWeight: '600' }} numberOfLines={1}>{agent.store}</Text>
                  </View>
                  <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={{ fontSize: 9, color: colors.textMuted, fontWeight: '800', marginBottom: 4 }}>DURATION</Text>
                    <Text style={{ fontSize: 12, color: colors.text, fontWeight: '600' }}>{agent.time}</Text>
                  </View>
                  <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 9, color: colors.textMuted, fontWeight: '800', marginBottom: 4 }}>VISITS</Text>
                    <Text style={{ fontSize: 12, color: colors.text, fontWeight: '600' }}>{agent.completed_visits || 0} / {agent.assigned_stores || 0}</Text>
                  </View>
                </View>
                
                {/* Progress Bar */}
                <View style={{ height: 6, backgroundColor: colors.border + '30', borderRadius: 3, marginTop: 16, overflow: 'hidden' }}>
                    <View style={{ height: '100%', width: `${Math.min(100, agent.completion_pct || 0)}%`, backgroundColor: agent.completion_pct >= 100 ? colors.success : colors.primary, borderRadius: 3 }} />
                </View>
              </Card>
            ))
          ) : (
            <View style={{ padding: 20, alignItems: 'center', width: '100%' }}>
              <Text style={{ color: colors.textSecondary, fontStyle: 'italic' }}>No merchandisers currently assigned to your team.</Text>
            </View>
          )}
        </View>

        {/* 2. Today's Planning */}
        <SectionHeader 
          title="Today's Planning" 
          actionLabel="View Schedule" 
          onAction={() => router.push('/supervisor/team')}
        />
        <Card style={styles.progressCard}>
          <ProgressBar
            progress={stats ? (stats.visited_today / (stats.assigned_stores || 1)) : 0}
            label="Total Daily Visit Completion"
            showPercentage
          />
          <View style={styles.progressStats}>
            <View style={styles.progressStatItem}>
              <Ionicons name="storefront-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.progressStatText, { color: colors.textSecondary }]}>
                {stats?.visited_today || 0}/{stats?.assigned_stores || 0} Visited
              </Text>
            </View>
            <View style={styles.progressStatItem}>
              <Ionicons name="people-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.progressStatText, { color: colors.textSecondary }]}>
                {stats?.active_teams || 0} Agents Active
              </Text>
            </View>
          </View>
        </Card>

        {/* 3. Team Reports */}
        <SectionHeader title="Team Reports" />
        <View style={styles.reportGrid}>
          {REPORT_ACTIONS.map(item => (
            <TouchableOpacity 
              key={item.id} 
              style={[styles.reportItem, { backgroundColor: colors.surface }]}
              onPress={() => router.push(item.route)}
            >
              <View style={[styles.reportIconBox, { backgroundColor: item.color + '10' }]}>
                {item.type === 'mci' ? (
                  <MaterialCommunityIcons name={item.icon as any} size={24} color={item.color} />
                ) : (
                  <Ionicons name={item.icon as any} size={24} color={item.color} />
                )}
              </View>
              <Text style={[styles.reportLabel, { color: colors.text }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 4. Live Map Snapshot */}
        <SectionHeader title="Live Map Snapshot" actionLabel="Full Map" onAction={() => router.push('/supervisor/map')} />
        <TouchableOpacity style={styles.mapContainer} onPress={() => router.push('/supervisor/map')}>
          <Image 
            source={{ uri: 'https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/9.08,34.00,6,0/600x300?access_token=pk.eyJ1IjoiZGV2ZWxvcGVyIiwiYSI6ImNr...' }} 
            style={styles.mapSnapshot}
            defaultSource={require('@/assets/images/neat.png')}
          />
          <View style={[styles.mapOverlay, { backgroundColor: 'rgba(0,0,0,0.3)' }]}>
            <View style={styles.mapBadge}>
              <Ionicons name="location" size={14} color="#fff" />
              <Text style={styles.mapBadgeText}>8 Active Locations</Text>
            </View>
          </View>
        </TouchableOpacity>
      </ScrollView>

      <BottomNav items={SUPERVISOR_NAV_ITEMS} activeRoute="/supervisor/dashboard" />

      <SettingsDrawer
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        items={settingsItems}
      />
    </>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
       {Content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: 100 },
  teamList: { paddingHorizontal: 16, gap: 12, paddingBottom: 8 },
  detailedAgentCard: { padding: 16, borderRadius: 20, ...DesignTokens.shadows.md },
  detailedAgentHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  agentAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E5E7EB' },
  agentName: { fontSize: 15, fontWeight: '700' },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  progressCard: { marginHorizontal: 16, padding: 16, borderRadius: 20 },
  progressStats: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  progressStatItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  progressStatText: { fontSize: 11, fontWeight: '600' },
  reportGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 12 },
  reportItem: { width: '48%', padding: 16, borderRadius: 20, alignItems: 'center', gap: 10, ...DesignTokens.shadows.sm },
  reportIconBox: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  reportLabel: { fontSize: 13, fontWeight: '700' },
  mapContainer: { marginHorizontal: 16, height: 160, borderRadius: 24, overflow: 'hidden', ...DesignTokens.shadows.md },
  mapSnapshot: { width: '100%', height: '100%' },
  mapOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  mapBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  mapBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
