import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AdminWebLayout } from '@/components/admin/WebLayout';
import { UserService } from '@/services/user.service';
import { ReportService, Report } from '@/services/report.service';
import { User } from '@/types/auth';
import { Fonts } from '@/hooks/useFonts';
import { getFullImageUrl } from '@/constants/api';

const isWeb = Platform.OS === 'web';

export default function MerchandiserProfileDashboard() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const u = await UserService.getById(id as string);
      if (u) setUser(u);

      const allReports = await ReportService.getAll({ skip: 0, limit: 1000 });
      // Filter reports for this specific merchandiser
      const userReports = allReports.filter(r => r.user_id === Number(id));
      setReports(userReports);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminWebLayout title="Merchandiser Profile">
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading Analytics...</Text>
        </View>
      </AdminWebLayout>
    );
  }

  if (!user) {
    return (
      <AdminWebLayout title="Merchandiser Not Found">
        <View style={styles.center}>
          <Ionicons name="warning" size={48} color="#ef4444" />
          <Text style={styles.loadingText}>Merchandiser not found.</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </AdminWebLayout>
    );
  }

  const approvedReports = reports.filter(r => r.status === 'approved').length;
  const anomalies = reports.filter(r => r.type === 'anomaly').length;
  const submissions = reports.filter(r => r.type === 'before_after' || (r.before_image && r.after_image)).length;
  const score = (approvedReports * 2) + submissions;

  return (
    <AdminWebLayout title={`Intelligence: ${user.firstName}`}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#d4d4d8" />
          <Text style={styles.backButtonText}>Back to Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.viewReportsBtn} onPress={() => router.push(`/admin/before-after?user_id=${user.id}`)}>
          <Ionicons name="filter" size={16} color="#fff" />
          <Text style={styles.viewReportsText}>Filter All Reports</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* PROFILE HEADER */}
        <LinearGradient colors={['#18181b', '#121214']} style={styles.profileHeader}>
          <View style={styles.profileInfoRow}>
            <View style={styles.avatarContainer}>
              {user.profileImage ? (
                <Image source={{ uri: getFullImageUrl(user.profileImage) || '' }} style={styles.avatar} />
              ) : (
                <Text style={styles.avatarInitials}>{user.firstName?.[0] || '?'}</Text>
              )}
              <View style={[styles.statusDot, { backgroundColor: user.status === 'active' ? '#10b981' : '#71717a' }]} />
            </View>
            <View style={styles.profileDetails}>
              <Text style={styles.profileName}>{user.firstName} {user.lastName}</Text>
              <View style={styles.badgesRow}>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleText}>{user.role.toUpperCase()}</Text>
                </View>
                {user.status === 'active' && (
                  <View style={styles.liveBadge}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>LIVE IN FIELD</Text>
                  </View>
                )}
              </View>
              <Text style={styles.contactText}><Ionicons name="mail" size={12} color="#a1a1aa" /> {user.email}</Text>
              {user.phone && <Text style={styles.contactText}><Ionicons name="call" size={12} color="#a1a1aa" /> {user.phone}</Text>}
            </View>
            
            {/* KPI SCORE BIG BADGE */}
            <View style={styles.scoreContainer}>
              <Text style={styles.scoreLabel}>GLOBAL AI SCORE</Text>
              <Text style={styles.scoreValue}>{score}</Text>
              <View style={styles.trendUpBadge}>
                <Ionicons name="trending-up" size={14} color="#10b981" />
                <Text style={styles.trendUpText}>Top 5%</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* METRICS GRID */}
        <View style={styles.metricsGrid}>
          <MetricCard title="Total Reports" value={reports.length} icon="document-text" color="#3b82f6" subtext="Submitted all time" />
          <MetricCard title="Approved" value={approvedReports} icon="checkmark-circle" color="#10b981" subtext="Successfully validated" />
          <MetricCard title="Anomalies" value={anomalies} icon="warning" color="#f59e0b" subtext="Issues reported" />
          <MetricCard title="Before/After" value={submissions} icon="camera" color="#a855f7" subtext="Visual proofs" />
        </View>

        {/* BOTTOM SECTIONS */}
        <View style={styles.bottomRow}>
          {/* Recent Activity */}
          <View style={styles.recentActivityCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="time" size={20} color="#60a5fa" />
              <Text style={styles.cardTitle}>Recent Submissions</Text>
            </View>
            {reports.slice(0, 5).map(r => (
              <View key={r.id} style={styles.activityItem}>
                <View style={[styles.activityIcon, { backgroundColor: r.status === 'approved' ? '#10b98120' : '#f59e0b20' }]}>
                  <Ionicons name={r.type === 'anomaly' ? 'warning' : 'document'} size={16} color={r.status === 'approved' ? '#10b981' : '#f59e0b'} />
                </View>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityName}>{r.name}</Text>
                  <Text style={styles.activityDate}>{new Date(r.created_at).toLocaleString()}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: r.status === 'approved' ? '#10b98120' : '#f59e0b20' }]}>
                  <Text style={[styles.statusText, { color: r.status === 'approved' ? '#10b981' : '#f59e0b' }]}>{r.status.toUpperCase()}</Text>
                </View>
              </View>
            ))}
            {reports.length === 0 && (
              <Text style={styles.emptyText}>No recent activity found.</Text>
            )}
          </View>

          {/* AI Productivity Charts */}
          <View style={styles.chartsCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="analytics" size={20} color="#f472b6" />
              <Text style={styles.cardTitle}>Performance Analysis</Text>
            </View>
            <View style={styles.analysisBox}>
              <Ionicons name="checkmark-circle" size={32} color="#10b981" />
              <Text style={styles.analysisTitle}>High Approval Rate</Text>
              <Text style={styles.analysisDesc}>This merchandiser has a high ratio of approved reports indicating strong compliance with store guidelines.</Text>
            </View>
            <View style={[styles.analysisBox, { marginTop: 16 }]}>
              <Ionicons name="camera" size={32} color="#a855f7" />
              <Text style={styles.analysisTitle}>Consistent Visual Proofs</Text>
              <Text style={styles.analysisDesc}>{submissions} Before/After photos submitted. Visual compliance is above team average.</Text>
            </View>
          </View>
        </View>

      </ScrollView>
    </AdminWebLayout>
  );
}

const MetricCard = ({ title, value, icon, color, subtext }: any) => (
  <View style={styles.metricCard}>
    <View style={styles.metricHeader}>
      <Text style={styles.metricTitle}>{title}</Text>
      <View style={[styles.iconBox, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
    </View>
    <Text style={styles.metricValue}>{value}</Text>
    <Text style={styles.metricSub}>{subtext}</Text>
  </View>
);

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#09090b' },
  loadingText: { color: '#a1a1aa', fontFamily: Fonts.body, marginTop: 16, fontSize: 16 },
  backBtn: { marginTop: 24, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#27272a', borderRadius: 8 },
  backBtnText: { color: '#fff', fontFamily: Fonts.headingSemiBold },
  
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 8 },
  backButtonText: { color: '#d4d4d8', fontFamily: Fonts.headingSemiBold, fontSize: 14 },
  viewReportsBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#3b82f6', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  viewReportsText: { color: '#fff', fontFamily: Fonts.headingSemiBold, fontSize: 14 },

  profileHeader: { padding: 32, borderRadius: 24, borderWidth: 1, borderColor: '#27272a', marginBottom: 24 },
  profileInfoRow: { flexDirection: isWeb ? 'row' : 'column', alignItems: isWeb ? 'center' : 'flex-start', gap: 24 },
  avatarContainer: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#27272a', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#3b82f6', position: 'relative' },
  avatar: { width: '100%', height: '100%', borderRadius: 50 },
  avatarInitials: { fontSize: 36, fontFamily: Fonts.headingXBold, color: '#fff' },
  statusDot: { position: 'absolute', bottom: 4, right: 4, width: 20, height: 20, borderRadius: 10, borderWidth: 3, borderColor: '#18181b' },
  
  profileDetails: { flex: 1 },
  profileName: { fontSize: 28, fontFamily: Fonts.headingXBold, color: '#fff', marginBottom: 8 },
  badgesRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  roleBadge: { backgroundColor: '#3b82f620', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#3b82f650' },
  roleText: { color: '#60a5fa', fontSize: 11, fontFamily: Fonts.headingXBold },
  liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#10b98120', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#10b98150' },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10b981', marginRight: 6 },
  liveText: { color: '#10b981', fontSize: 11, fontFamily: Fonts.headingXBold },
  contactText: { color: '#a1a1aa', fontSize: 13, fontFamily: Fonts.body, marginBottom: 4 },

  scoreContainer: { alignItems: 'center', backgroundColor: '#09090b', padding: 24, borderRadius: 16, borderWidth: 1, borderColor: '#27272a', minWidth: 160 },
  scoreLabel: { color: '#71717a', fontSize: 11, fontFamily: Fonts.headingXBold, letterSpacing: 1, marginBottom: 8 },
  scoreValue: { color: '#fff', fontSize: 48, fontFamily: Fonts.headingXBold, lineHeight: 48 },
  trendUpBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, backgroundColor: '#10b98115', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  trendUpText: { color: '#10b981', fontSize: 12, fontFamily: Fonts.headingSemiBold },

  metricsGrid: { flexDirection: isWeb ? 'row' : 'column', gap: 16, marginBottom: 24 },
  metricCard: { flex: 1, backgroundColor: '#121214', padding: 24, borderRadius: 20, borderWidth: 1, borderColor: '#27272a' },
  metricHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  metricTitle: { color: '#a1a1aa', fontSize: 14, fontFamily: Fonts.headingSemiBold },
  iconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  metricValue: { color: '#fff', fontSize: 32, fontFamily: Fonts.headingXBold, marginBottom: 4 },
  metricSub: { color: '#71717a', fontSize: 12, fontFamily: Fonts.body },

  bottomRow: { flexDirection: isWeb ? 'row' : 'column', gap: 24 },
  recentActivityCard: { flex: 1.5, backgroundColor: '#121214', padding: 24, borderRadius: 24, borderWidth: 1, borderColor: '#27272a' },
  chartsCard: { flex: 1, backgroundColor: '#121214', padding: 24, borderRadius: 24, borderWidth: 1, borderColor: '#27272a' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#27272a' },
  cardTitle: { color: '#fff', fontSize: 18, fontFamily: Fonts.headingBold },
  
  activityItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#ffffff0a' },
  activityIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  activityInfo: { flex: 1 },
  activityName: { color: '#fff', fontSize: 14, fontFamily: Fonts.headingSemiBold, marginBottom: 4 },
  activityDate: { color: '#71717a', fontSize: 12, fontFamily: Fonts.body },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 10, fontFamily: Fonts.headingXBold },
  emptyText: { color: '#71717a', fontFamily: Fonts.body, fontStyle: 'italic', marginTop: 20 },

  analysisBox: { backgroundColor: '#09090b', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#27272a' },
  analysisTitle: { color: '#fff', fontSize: 15, fontFamily: Fonts.headingSemiBold, marginTop: 12, marginBottom: 6 },
  analysisDesc: { color: '#a1a1aa', fontSize: 13, fontFamily: Fonts.body, lineHeight: 20 }
});
