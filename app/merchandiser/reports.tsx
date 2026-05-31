import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Badge } from '@/components/ui/Badge';
import { BottomNav } from '@/components/ui/BottomNav';
import { Card } from '@/components/ui/Card';
import { Header } from '@/components/ui/Header';
import { DesignTokens, getColors } from '@/constants/designSystem';
import { MERCHANDISER_NAV_ITEMS } from '@/constants/navigation';
import { useTheme } from '@/context/ThemeContext';
import { StatsService, MerchandiserStats } from '@/services/stats.service';
import { ReportService, Report } from '@/services/report.service';
import { ExportService } from '@/services/export.service';
import { format } from 'date-fns';

const { width } = Dimensions.get('window');

export default function ReportsPage() {
    const router = useRouter();
    const { theme } = useTheme();
    const colors = getColors(theme);

    const [activeTab, setActiveTab] = useState<'analytics' | 'history'>('analytics');
    const [stats, setStats] = useState<MerchandiserStats | null>(null);
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [isExporting, setIsExporting] = useState(false);

    const loadData = async () => {
        setLoading(true);
        const [statsData, reportsData] = await Promise.all([
            StatsService.getMerchandiserStats(),
            ReportService.getAll()
        ]);
        if (statsData) setStats(statsData);
        if (reportsData) setReports(reportsData);
        setLoading(false);
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const handleExport = async () => {
        setIsExporting(true);
        const today = new Date().toISOString().split('T')[0];
        await ExportService.downloadDailyReport(today);
        setIsExporting(false);
    };

    const today = new Date();
    const formattedDate = format(today, 'dd MMM yyyy');

    const filteredReports = reports.filter(r => filterStatus === 'all' || r.status === filterStatus);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <Header title="Analytics & Reports" showBack rightIcon="refresh" onRightPress={loadData} />

            <View style={styles.tabsContainer}>
                <TouchableOpacity 
                    style={[styles.tabBtn, activeTab === 'analytics' && { backgroundColor: colors.primary }]}
                    onPress={() => setActiveTab('analytics')}
                >
                    <Text style={[styles.tabText, { color: activeTab === 'analytics' ? '#FFF' : colors.textSecondary }]}>Analytics</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.tabBtn, activeTab === 'history' && { backgroundColor: colors.primary }]}
                    onPress={() => setActiveTab('history')}
                >
                    <Text style={[styles.tabText, { color: activeTab === 'history' ? '#FFF' : colors.textSecondary }]}>History</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.centerLoad}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                    {activeTab === 'analytics' && stats ? (
                        <>
                            <View style={styles.scoreContainer}>
                                <View style={[styles.scoreCircle, { borderColor: colors.primary }]}>
                                    <Text style={[styles.scoreValue, { color: colors.primary }]}>{stats.productivity?.score ?? '--'}</Text>
                                    <Text style={[styles.scoreLabel, { color: colors.textSecondary }]}>Score</Text>
                                </View>
                                <View style={styles.scoreDetails}>
                                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Productivity</Text>
                                    <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>
                                        Attendance: {stats.productivity?.attendance_rate ?? '--'}%
                                    </Text>
                                    <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>
                                        Coverage: {stats.productivity?.store_coverage_pct ?? '--'}%
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.statsGrid}>
                                <Card style={styles.statBox}>
                                    <Ionicons name="location" size={24} color={colors.primary} />
                                    <Text style={[styles.statValue, { color: colors.text }]}>{stats.visits?.today ?? '--'}</Text>
                                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Visits Today</Text>
                                </Card>
                                <Card style={styles.statBox}>
                                    <Ionicons name="time" size={24} color={colors.warning} />
                                    <Text style={[styles.statValue, { color: colors.text }]}>{stats.visits?.avg_duration_mins ?? '--'}m</Text>
                                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Avg Time</Text>
                                </Card>
                                <Card style={styles.statBox}>
                                    <Ionicons name="checkmark-done" size={24} color={colors.success} />
                                    <Text style={[styles.statValue, { color: colors.text }]}>{stats.visits?.completed_pct ?? '--'}%</Text>
                                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Completion</Text>
                                </Card>
                            </View>

                            <Card style={styles.chartCard}>
                                <Text style={[styles.cardTitle, { color: colors.text }]}>Weekly Activity</Text>
                                <View style={styles.barChart}>
                                    {stats.charts?.weekly_activity?.map((item, idx) => {
                                        const maxVisits = Math.max(...(stats.charts?.weekly_activity?.map(d => d.visits) ?? [1]));
                                        const height = (item.visits / maxVisits) * 100;
                                        return (
                                            <View key={idx} style={styles.barCol}>
                                                <Text style={[styles.barValue, { color: colors.text }]}>{item.visits}</Text>
                                                <View style={styles.barTrack}>
                                                    <View style={[styles.barFill, { height: `${height}%`, backgroundColor: colors.primary }]} />
                                                </View>
                                                <Text style={[styles.barLabel, { color: colors.textSecondary }]}>{item.day}</Text>
                                            </View>
                                        );
                                    })}
                                </View>
                            </Card>

                            <Card style={styles.summaryCard}>
                                <Text style={[styles.cardTitle, { color: colors.text }]}>Reports Breakdown</Text>
                                <View style={styles.breakdownList}>
                                    {stats.charts?.report_distribution?.map((dist, idx) => (
                                        <View key={idx} style={styles.breakdownRow}>
                                            <Text style={{ color: colors.textSecondary, fontSize: 14 }}>{dist.type}</Text>
                                            <Text style={{ color: colors.text, fontSize: 14, fontWeight: '700' }}>{dist.count}</Text>
                                        </View>
                                    ))}
                                </View>
                            </Card>
                        </>
                    ) : (
                        <View style={styles.historyContainer}>
                            <View style={styles.filterRow}>
                                {['all', 'pending', 'approved', 'rejected'].map(f => (
                                    <TouchableOpacity 
                                        key={f} 
                                        style={[styles.filterBtn, filterStatus === f && { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}
                                        onPress={() => setFilterStatus(f)}
                                    >
                                        <Text style={[styles.filterText, filterStatus === f ? { color: colors.primary, fontWeight: '700' } : { color: colors.textSecondary }]}>
                                            {f.charAt(0).toUpperCase() + f.slice(1)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                                <TouchableOpacity onPress={handleExport} disabled={isExporting} style={styles.exportBtn}>
                                    {isExporting ? <ActivityIndicator size="small" color={colors.primary} /> : <Ionicons name="download-outline" size={20} color={colors.primary} />}
                                </TouchableOpacity>
                            </View>

                            {filteredReports.length === 0 ? (
                                <View style={styles.emptyState}>
                                    <Ionicons name="document-text-outline" size={48} color={colors.border} />
                                    <Text style={{ color: colors.textSecondary, marginTop: 12 }}>No reports found.</Text>
                                </View>
                            ) : (
                                filteredReports.map(report => (
                                    <Card key={report.id} style={styles.reportCard}>
                                        <View style={styles.cardTop}>
                                            <View style={styles.cardInfo}>
                                                <Text style={[styles.reportName, { color: colors.text }]}>{report.name}</Text>
                                                <View style={styles.timeRow}>
                                                    <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                                                    <Text style={[styles.timeText, { color: colors.textSecondary }]}>
                                                        {format(new Date(report.created_at), 'dd MMM yyyy HH:mm')}
                                                    </Text>
                                                </View>
                                            </View>
                                            <Badge 
                                                label={report.status.toUpperCase()} 
                                                variant={report.status === 'approved' ? 'success' : report.status === 'rejected' ? 'error' : 'warning'}
                                            />
                                        </View>

                                        <View style={[styles.divider, { backgroundColor: colors.border + '30' }]} />

                                        <View style={styles.cardDetails}>
                                            <View style={styles.detailItem}>
                                                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Type</Text>
                                                <Text style={[styles.detailValue, { color: colors.text }]}>{report.type}</Text>
                                            </View>
                                            <View style={styles.detailItem}>
                                                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Store</Text>
                                                <Text style={[styles.detailValue, { color: colors.text }]} numberOfLines={1}>
                                                    {(report as any).gms?.name || 'Unknown Store'}
                                                </Text>
                                            </View>
                                        </View>

                                        <TouchableOpacity 
                                            style={[styles.detailsBtn, { backgroundColor: colors.primary + '10' }]}
                                            onPress={() => router.push({ pathname: '/merchandiser/report_details', params: { id: report.id } })}
                                        >
                                            <Text style={[styles.detailsBtnText, { color: colors.primary }]}>View Full Details</Text>
                                            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                                        </TouchableOpacity>
                                    </Card>
                                ))
                            )}
                        </View>
                    )}
                </ScrollView>
            )}

            <BottomNav items={MERCHANDISER_NAV_ITEMS} activeRoute="/merchandiser/reports" />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    centerLoad: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    tabsContainer: { flexDirection: 'row', paddingHorizontal: DesignTokens.spacing.lg, marginVertical: 12, gap: 12 },
    tabBtn: { flex: 1, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: '#e2e8f0' },
    tabText: { fontSize: 14, fontWeight: '700' },
    scroll: { paddingBottom: 100 },
    scoreContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: DesignTokens.spacing.lg, marginBottom: 20, gap: 20 },
    scoreCircle: { width: 80, height: 80, borderRadius: 40, borderWidth: 6, justifyContent: 'center', alignItems: 'center' },
    scoreValue: { fontSize: 24, fontWeight: '800' },
    scoreLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase' },
    scoreDetails: { flex: 1 },
    sectionTitle: { fontSize: 18, fontWeight: '700' },
    statsGrid: { flexDirection: 'row', paddingHorizontal: DesignTokens.spacing.lg, gap: 12, marginBottom: 24 },
    statBox: { flex: 1, padding: 16, alignItems: 'center', borderRadius: 16 },
    statValue: { fontSize: 20, fontWeight: '800', marginTop: 8 },
    statLabel: { fontSize: 11, fontWeight: '600', marginTop: 4, textAlign: 'center' },
    chartCard: { marginHorizontal: DesignTokens.spacing.lg, padding: 16, borderRadius: 16, marginBottom: 16 },
    cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 16 },
    barChart: { flexDirection: 'row', justifyContent: 'space-between', height: 160, alignItems: 'flex-end', paddingTop: 20 },
    barCol: { alignItems: 'center', flex: 1 },
    barValue: { fontSize: 11, fontWeight: '600', marginBottom: 4 },
    barTrack: { height: 100, width: 8, backgroundColor: '#f1f5f9', borderRadius: 4, justifyContent: 'flex-end' },
    barFill: { width: '100%', borderRadius: 4 },
    barLabel: { fontSize: 11, fontWeight: '500', marginTop: 8 },
    summaryCard: { marginHorizontal: DesignTokens.spacing.lg, padding: 16, borderRadius: 16, marginBottom: 24 },
    breakdownList: { gap: 12 },
    breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    historyContainer: { paddingHorizontal: DesignTokens.spacing.lg },
    filterRow: { flexDirection: 'row', gap: 8, marginBottom: 16, alignItems: 'center' },
    filterBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: 'transparent' },
    filterText: { fontSize: 12 },
    exportBtn: { marginLeft: 'auto', padding: 6 },
    reportCard: { padding: 16, borderRadius: 16, marginBottom: 16 },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    cardInfo: { flex: 1, gap: 4, paddingRight: 8 },
    reportName: { fontSize: 15, fontWeight: '700' },
    timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    timeText: { fontSize: 12, fontWeight: '500' },
    divider: { height: 1, marginVertical: 12 },
    cardDetails: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
    detailItem: { flex: 1, gap: 4 },
    detailLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase' },
    detailValue: { fontSize: 13, fontWeight: '600' },
    detailsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 40, borderRadius: 12, gap: 8 },
    detailsBtnText: { fontSize: 13, fontWeight: '700' },
    emptyState: { alignItems: 'center', paddingVertical: 40 },
});
