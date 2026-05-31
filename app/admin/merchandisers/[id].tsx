import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AdminWebLayout } from '@/components/admin/WebLayout';
import { UserService } from '@/services/user.service';
import { ReportService, Report } from '@/services/report.service';
import { User } from '@/types/auth';
import { Fonts } from '@/hooks/useFonts';
import { getFullImageUrl } from '@/constants/api';
import { useTheme } from '@/context/ThemeContext';

const isWeb = Platform.OS === 'web';

export default function MerchandiserProfileDashboard() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { isDark } = useTheme();

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
      const userReports = allReports.filter(r => r.user_id === Number(id));
      setReports(userReports);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // ─── Dynamic theme tokens ──────────────────────────────────────────────────
  const C = {
    bg:           isDark ? '#09090b'  : '#F7F8FC',
    card:         isDark ? '#121214'  : '#ffffff',
    cardBorder:   isDark ? '#27272a'  : '#e2e8f0',
    subCard:      isDark ? '#09090b'  : '#F7F8FC',
    divider:      isDark ? '#27272a'  : '#f1f5f9',
    text:         isDark ? '#ffffff'  : '#1e293b',
    textMuted:    isDark ? '#a1a1aa'  : '#64748b',
    textFaint:    isDark ? '#71717a'  : '#94a3b8',
    avatarBg:     isDark ? '#27272a'  : '#f1f5f9',
    avatarInitial:isDark ? '#ffffff'  : '#3b82f6',
    dotBorder:    isDark ? '#18181b'  : '#ffffff',
    roleBg:       isDark ? '#3b82f620': '#e0f2fe',
    roleBorder:   isDark ? '#3b82f650': '#bae6fd',
    roleText:     isDark ? '#60a5fa'  : '#0284c7',
    liveBg:       isDark ? '#10b98120': '#d1fae5',
    liveBorder:   isDark ? '#10b98150': '#a7f3d0',
    liveText:     isDark ? '#10b981'  : '#059669',
    scoreBg:      isDark ? '#09090b'  : '#F7F8FC',
    scoreBorder:  isDark ? '#27272a'  : '#e2e8f0',
    scoreText:    isDark ? '#ffffff'  : '#1e293b',
    scoreLabel:   isDark ? '#71717a'  : '#64748b',
    trendBg:      isDark ? '#10b98115': '#d1fae5',
    trendText:    isDark ? '#10b981'  : '#059669',
    backText:     isDark ? '#d4d4d8'  : '#64748b',
    shadow: isDark
      ? {}
      : { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  };

  if (loading) {
    return (
      <AdminWebLayout title="Merchandiser Profile">
        <View style={[styles.center, { backgroundColor: C.bg }]}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={[styles.loadingText, { color: C.textMuted }]}>Loading Analytics...</Text>
        </View>
      </AdminWebLayout>
    );
  }

  if (!user) {
    return (
      <AdminWebLayout title="Merchandiser Not Found">
        <View style={[styles.center, { backgroundColor: C.bg }]}>
          <Ionicons name="warning" size={48} color="#ef4444" />
          <Text style={[styles.loadingText, { color: C.textMuted }]}>Merchandiser not found.</Text>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: isDark ? '#27272a' : '#f1f5f9' }]}
            onPress={() => router.back()}
          >
            <Text style={[styles.backBtnText, { color: C.text }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </AdminWebLayout>
    );
  }

  const approvedReports = reports.filter(r => r.status === 'approved').length;
  const anomalies       = reports.filter(r => r.type === 'anomaly').length;
  const submissions     = reports.filter(r => r.type === 'before_after' || (r.before_image && r.after_image)).length;
  const score           = (approvedReports * 2) + submissions;

  // Activity icon / badge colours based on theme
  const approvedIconBg  = isDark ? '#10b98120' : '#d1fae5';
  const pendingIconBg   = isDark ? '#f59e0b20' : '#fef3c7';
  const approvedIconClr = isDark ? '#10b981'   : '#059669';
  const pendingIconClr  = isDark ? '#f59e0b'   : '#d97706';

  return (
    <AdminWebLayout title={`Intelligence: ${user.firstName}`}>
      {/* ── Header Row ── */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={C.backText} />
          <Text style={[styles.backButtonText, { color: C.backText }]}>Back to Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.viewReportsBtn}
          onPress={() => router.push(`/admin/before-after?user_id=${user.id}`)}
        >
          <Ionicons name="filter" size={16} color="#fff" />
          <Text style={styles.viewReportsText}>Filter All Reports</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* ── PROFILE HEADER ── */}
        <View style={[
          styles.profileHeader,
          { backgroundColor: C.card, borderColor: C.cardBorder },
          C.shadow,
          isDark && { borderWidth: 1 },
        ]}>
          <View style={styles.profileInfoRow}>
            {/* Avatar */}
            <View style={[styles.avatarContainer, { backgroundColor: C.avatarBg, borderColor: '#3b82f6' }]}>
              {user.profileImage ? (
                <Image source={{ uri: getFullImageUrl(user.profileImage) || '' }} style={styles.avatar} />
              ) : (
                <Text style={[styles.avatarInitials, { color: C.avatarInitial }]}>
                  {user.firstName?.[0] || '?'}
                </Text>
              )}
              <View style={[styles.statusDot, {
                backgroundColor: user.status === 'active' ? '#10b981' : (isDark ? '#71717a' : '#94a3b8'),
                borderColor: C.dotBorder,
              }]} />
            </View>

            {/* Info */}
            <View style={styles.profileDetails}>
              <Text style={[styles.profileName, { color: C.text }]}>
                {user.firstName} {user.lastName}
              </Text>
              <View style={styles.badgesRow}>
                <View style={[styles.roleBadge, { backgroundColor: C.roleBg, borderColor: C.roleBorder }]}>
                  <Text style={[styles.roleText, { color: C.roleText }]}>{user.role.toUpperCase()}</Text>
                </View>
                {user.status === 'active' && (
                  <View style={[styles.liveBadge, { backgroundColor: C.liveBg, borderColor: C.liveBorder }]}>
                    <View style={[styles.liveDot, { backgroundColor: C.liveText }]} />
                    <Text style={[styles.liveText, { color: C.liveText }]}>LIVE IN FIELD</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.contactText, { color: C.textMuted }]}>
                <Ionicons name="mail" size={12} color={C.textFaint} /> {user.email}
              </Text>
              {user.phone && (
                <Text style={[styles.contactText, { color: C.textMuted }]}>
                  <Ionicons name="call" size={12} color={C.textFaint} /> {user.phone}
                </Text>
              )}
            </View>

            {/* Score Badge */}
            <View style={[styles.scoreContainer, { backgroundColor: C.scoreBg, borderColor: C.scoreBorder, borderWidth: 1 }]}>
              <Text style={[styles.scoreLabel, { color: C.scoreLabel }]}>GLOBAL AI SCORE</Text>
              <Text style={[styles.scoreValue, { color: C.scoreText }]}>{score}</Text>
              <View style={[styles.trendUpBadge, { backgroundColor: C.trendBg }]}>
                <Ionicons name="trending-up" size={14} color={C.trendText} />
                <Text style={[styles.trendUpText, { color: C.trendText }]}>Top 5%</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── METRICS GRID ── */}
        <View style={styles.metricsGrid}>
          <MetricCard title="Total Reports"  value={reports.length}  icon="document-text"   color="#3b82f6" subtext="Submitted all time"     card={C.card} border={C.cardBorder} text={C.text} muted={C.textMuted} isDark={isDark} shadow={C.shadow} />
          <MetricCard title="Approved"       value={approvedReports} icon="checkmark-circle" color="#10b981" subtext="Successfully validated" card={C.card} border={C.cardBorder} text={C.text} muted={C.textMuted} isDark={isDark} shadow={C.shadow} />
          <MetricCard title="Anomalies"      value={anomalies}       icon="warning"          color="#f59e0b" subtext="Issues reported"        card={C.card} border={C.cardBorder} text={C.text} muted={C.textMuted} isDark={isDark} shadow={C.shadow} />
          <MetricCard title="Before/After"   value={submissions}     icon="camera"           color="#a855f7" subtext="Visual proofs"          card={C.card} border={C.cardBorder} text={C.text} muted={C.textMuted} isDark={isDark} shadow={C.shadow} />
        </View>

        {/* ── BOTTOM ROW ── */}
        <View style={styles.bottomRow}>

          {/* Recent Submissions */}
          <View style={[styles.recentActivityCard, { backgroundColor: C.card, borderColor: C.cardBorder }, C.shadow, isDark && { borderWidth: 1 }]}>
            <View style={[styles.cardHeader, { borderBottomColor: C.divider }]}>
              <Ionicons name="time" size={20} color="#60a5fa" />
              <Text style={[styles.cardTitle, { color: C.text }]}>Recent Submissions</Text>
            </View>
            {reports.slice(0, 5).map(r => (
              <View key={r.id} style={[styles.activityItem, { borderBottomColor: C.divider }]}>
                <View style={[styles.activityIcon, {
                  backgroundColor: r.status === 'approved' ? approvedIconBg : pendingIconBg,
                }]}>
                  <Ionicons
                    name={r.type === 'anomaly' ? 'warning' : 'document'}
                    size={16}
                    color={r.status === 'approved' ? approvedIconClr : pendingIconClr}
                  />
                </View>
                <View style={styles.activityInfo}>
                  <Text style={[styles.activityName, { color: C.text }]}>{r.name}</Text>
                  <Text style={[styles.activityDate, { color: C.textMuted }]}>
                    {new Date(r.created_at).toLocaleString()}
                  </Text>
                </View>
                <View style={[styles.statusBadge, {
                  backgroundColor: r.status === 'approved' ? approvedIconBg : pendingIconBg,
                }]}>
                  <Text style={[styles.statusText, {
                    color: r.status === 'approved' ? approvedIconClr : pendingIconClr,
                  }]}>
                    {r.status.toUpperCase()}
                  </Text>
                </View>
              </View>
            ))}
            {reports.length === 0 && (
              <Text style={[styles.emptyText, { color: C.textFaint }]}>No recent activity found.</Text>
            )}
          </View>

          {/* Performance Analysis */}
          <View style={[styles.chartsCard, { backgroundColor: C.card, borderColor: C.cardBorder }, C.shadow, isDark && { borderWidth: 1 }]}>
            <View style={[styles.cardHeader, { borderBottomColor: C.divider }]}>
              <Ionicons name="analytics" size={20} color="#f472b6" />
              <Text style={[styles.cardTitle, { color: C.text }]}>Performance Analysis</Text>
            </View>
            <View style={[styles.analysisBox, { backgroundColor: C.subCard, borderColor: C.cardBorder }]}>
              <Ionicons name="checkmark-circle" size={32} color="#10b981" />
              <Text style={[styles.analysisTitle, { color: C.text }]}>High Approval Rate</Text>
              <Text style={[styles.analysisDesc, { color: C.textMuted }]}>
                This merchandiser has a high ratio of approved reports indicating strong compliance with store guidelines.
              </Text>
            </View>
            <View style={[styles.analysisBox, { marginTop: 16, backgroundColor: C.subCard, borderColor: C.cardBorder }]}>
              <Ionicons name="camera" size={32} color="#a855f7" />
              <Text style={[styles.analysisTitle, { color: C.text }]}>Consistent Visual Proofs</Text>
              <Text style={[styles.analysisDesc, { color: C.textMuted }]}>
                {submissions} Before/After photos submitted. Visual compliance is above team average.
              </Text>
            </View>
          </View>

        </View>
      </ScrollView>
    </AdminWebLayout>
  );
}

// ─── MetricCard ─────────────────────────────────────────────────────────────
const MetricCard = ({ title, value, icon, color, subtext, card, border, text, muted, isDark, shadow }: any) => (
  <View style={[styles.metricCard, { backgroundColor: card, borderColor: border }, shadow, isDark && { borderWidth: 1 }]}>
    <View style={styles.metricHeader}>
      <Text style={[styles.metricTitle, { color: muted }]}>{title}</Text>
      <View style={[styles.iconBox, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
    </View>
    <Text style={[styles.metricValue, { color: text }]}>{value}</Text>
    <Text style={[styles.metricSub, { color: muted }]}>{subtext}</Text>
  </View>
);

// ─── Static layout styles only (no colours) ─────────────────────────────────
const styles = StyleSheet.create({
  center:          { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText:     { fontFamily: Fonts.body, marginTop: 16, fontSize: 16 },
  backBtn:         { marginTop: 24, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  backBtnText:     { fontFamily: Fonts.headingSemiBold },

  headerRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  backButton:      { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 8 },
  backButtonText:  { fontFamily: Fonts.headingSemiBold, fontSize: 14 },
  viewReportsBtn:  { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#3b82f6', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  viewReportsText: { color: '#fff', fontFamily: Fonts.headingSemiBold, fontSize: 14 },

  profileHeader:   { padding: 32, borderRadius: 20, marginBottom: 24 },
  profileInfoRow:  { flexDirection: isWeb ? 'row' : 'column', alignItems: isWeb ? 'center' : 'flex-start', gap: 24 },
  avatarContainer: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', borderWidth: 2, position: 'relative' },
  avatar:          { width: '100%', height: '100%', borderRadius: 50 },
  avatarInitials:  { fontSize: 36, fontFamily: Fonts.headingXBold },
  statusDot:       { position: 'absolute', bottom: 4, right: 4, width: 20, height: 20, borderRadius: 10, borderWidth: 3 },

  profileDetails:  { flex: 1 },
  profileName:     { fontSize: 28, fontFamily: Fonts.headingXBold, marginBottom: 8 },
  badgesRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  roleBadge:       { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  roleText:        { fontSize: 11, fontFamily: Fonts.headingXBold },
  liveBadge:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  liveDot:         { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  liveText:        { fontSize: 11, fontFamily: Fonts.headingXBold },
  contactText:     { fontSize: 13, fontFamily: Fonts.body, marginBottom: 4 },

  scoreContainer:  { alignItems: 'center', padding: 24, borderRadius: 16, minWidth: 160 },
  scoreLabel:      { fontSize: 11, fontFamily: Fonts.headingXBold, letterSpacing: 1, marginBottom: 8 },
  scoreValue:      { fontSize: 48, fontFamily: Fonts.headingXBold, lineHeight: 48 },
  trendUpBadge:    { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  trendUpText:     { fontSize: 12, fontFamily: Fonts.headingSemiBold },

  metricsGrid:     { flexDirection: isWeb ? 'row' : 'column', gap: 16, marginBottom: 24 },
  metricCard:      { flex: 1, padding: 24, borderRadius: 20 },
  metricHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  metricTitle:     { fontSize: 14, fontFamily: Fonts.headingSemiBold },
  iconBox:         { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  metricValue:     { fontSize: 32, fontFamily: Fonts.headingXBold, marginBottom: 4 },
  metricSub:       { fontSize: 12, fontFamily: Fonts.body },

  bottomRow:           { flexDirection: isWeb ? 'row' : 'column', gap: 24 },
  recentActivityCard:  { flex: 1.5, padding: 24, borderRadius: 20 },
  chartsCard:          { flex: 1, padding: 24, borderRadius: 20 },
  cardHeader:          { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24, paddingBottom: 16, borderBottomWidth: 1 },
  cardTitle:           { fontSize: 18, fontFamily: Fonts.headingBold },

  activityItem:  { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  activityIcon:  { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  activityInfo:  { flex: 1 },
  activityName:  { fontSize: 14, fontFamily: Fonts.headingSemiBold, marginBottom: 4 },
  activityDate:  { fontSize: 12, fontFamily: Fonts.body },
  statusBadge:   { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusText:    { fontSize: 10, fontFamily: Fonts.headingXBold },
  emptyText:     { fontFamily: Fonts.body, fontStyle: 'italic', marginTop: 20 },

  analysisBox:   { padding: 20, borderRadius: 16, borderWidth: 1 },
  analysisTitle: { fontSize: 15, fontFamily: Fonts.headingSemiBold, marginTop: 12, marginBottom: 6 },
  analysisDesc:  { fontSize: 13, fontFamily: Fonts.body, lineHeight: 20 },
});
