import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Modal, Platform, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Badge } from '@/components/ui/Badge';
import { BottomNav } from '@/components/ui/BottomNav';
import { Button } from '@/components/ui/Button';
import { Card, StatCard } from '@/components/ui/Card';
import { Header } from '@/components/ui/Header';
import { CardSkeleton } from '@/components/ui/LoadingSkeleton';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SupervisorWebLayout } from '@/components/admin/WebLayout';
import { DesignTokens, getColors } from '@/constants/designSystem';
import { SUPERVISOR_NAV_ITEMS } from '@/constants/navigation';
import { useTheme } from '@/context/ThemeContext';
import { API_ENDPOINTS } from '@/constants/api';
import { Report, ReportService } from '@/services/report.service';
import { StorageKeys, StorageService } from '@/services/storage.service';

const EVENT_TYPES_META = [
    { type: 'out-of-stock', label: 'Stock Rupture', color: '#ef4444', icon: 'alert-circle' },
    { type: 'before-after', label: 'Before/After', color: '#3b82f6', icon: 'camera' },
    { type: 'facing-change', label: 'Facing Change', color: '#f59e0b', icon: 'swap-horizontal' },
    { type: 'new-product', label: 'New Product', color: '#10b981', icon: 'add-circle' },
];

export default function ReportsPage() {
    const router = useRouter();
    const { theme } = useTheme();
    const colors = getColors(theme);
    const [reports, setReports] = useState<Report[]>([]);
    const [events, setEvents] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

    const fetchReports = useCallback(async () => {
        if (!refreshing) setIsLoading(true);
        try {
            const [reportData, eventsResponse] = await Promise.all([
                ReportService.getAll(),
                StorageService.getItem(StorageKeys.USER_TOKEN).then(() =>
                    import('@/services/apiClient').then(m => m.default.get('/api/events/', { params: { limit: 100 } }))
                )
            ]);
            setReports(reportData);
            setEvents(eventsResponse.data || []);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to load reports');
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, [refreshing]);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    const eventSummary = EVENT_TYPES_META.map(meta => ({
        ...meta,
        count: events.filter((e: any) => e.type === meta.type).length
    }));

    const onRefresh = () => {
        setRefreshing(true);
        fetchReports();
    };

    const getStatusVariant = (status: string): any => {
        switch (status) {
            case 'approved': return 'success';
            case 'rejected': return 'danger';
            case 'pending': return 'warning';
            default: return 'neutral';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return colors.success;
            case 'rejected': return colors.danger;
            case 'pending': return colors.warning;
            default: return colors.textSecondary;
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'approved': return 'checkmark-circle';
            case 'rejected': return 'close-circle';
            case 'pending': return 'time';
            default: return 'ellipse';
        }
    };

    const filteredReports = activeFilter === 'all'
        ? reports
        : reports.filter(r => r.status === activeFilter);

    const stats = {
        total: reports.length,
        pending: reports.filter(r => r.status === 'pending').length,
        approved: reports.filter(r => r.status === 'approved').length,
        rejected: reports.filter(r => r.status === 'rejected').length,
    };

    const openReport = (report: Report) => {
        setSelectedReport(report);
        setShowDetailModal(true);
    };

    const approveReport = async (reportId: number) => {
        try {
            const updated = await ReportService.updateStatus(reportId, 'approved');
            if (updated) {
                setReports(prev => prev.map(r => r.id === reportId ? updated : r));
                Alert.alert('Success', 'Report approved successfully');
                setShowDetailModal(false);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to approve report');
        }
    };

    const handleReject = async () => {
        if (!rejectionReason.trim()) {
            Alert.alert('Required', 'Please provide a reason for rejection');
            return;
        }
        if (selectedReport) {
            try {
                const updated = await ReportService.updateStatus(selectedReport.id, 'rejected', rejectionReason);
                if (updated) {
                    setReports(prev => prev.map(r => r.id === selectedReport.id ? updated : r));
                    setShowRejectModal(false);
                    setRejectionReason('');
                    Alert.alert('Success', 'Report rejected');
                }
            } catch (error) {
                Alert.alert('Error', 'Failed to reject report');
            }
        }
    };

    const exportToPDF = async () => {
        try {
            const html = `
                <html>
                <head>
                    <style>
                        body { font-family: Helvetica; padding: 40px; }
                        h1 { color: #135bec; text-align: center; margin-bottom: 30px; }
                        .header { margin-bottom: 20px; border-bottom: 2px solid #eee; padding-bottom: 10px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                        th { background-color: #f8fafc; color: #1e293b; font-weight: bold; }
                        .status { font-weight: bold; text-transform: uppercase; font-size: 11px; }
                        .approved { color: #10b981; }
                        .pending { color: #f59e0b; }
                        .rejected { color: #ef4444; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>Field Force Performance Summary</h1>
                        <p>Date Generated: ${new Date().toLocaleString()}</p>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Report ID</th>
                                <th>Merchandiser</th>
                                <th>Date</th>
                                <th>Progress</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${reports.map(r => `
                                <tr>
                                    <td>#${r.id}</td>
                                    <td>${r.merchandiser_name || 'N/A'}</td>
                                    <td>${new Date(r.created_at).toLocaleDateString()}</td>
                                    <td>${r.visits_completed}/${r.visits_planned}</td>
                                    <td class="status ${r.status}">${r.status}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </body>
                </html>
            `;

            const { uri } = await Print.printToFileAsync({ html });
            await Sharing.shareAsync(uri);
        } catch (error) {
            Alert.alert('Error', 'Failed to generate export');
        }
    };

    const Content = (
        <>
            <Header
                title="Validation"
                subtitle="Review and approve team reports"
                rightIcon="cloud-download-outline"
                onRightIconPress={exportToPDF}
            />

            <View style={styles.statsGrid}>
                <StatCard label="PENDING" value={stats.pending} icon="time" color={colors.warning} />
                <StatCard label="APPROVED" value={stats.approved} icon="checkmark-circle" color={colors.success} />
            </View>

            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
            >
                <SectionHeader title="Activity Summary" />
                <Card style={styles.eventCard}>
                    {eventSummary.map((event, index) => (
                        <View key={event.type} style={[styles.eventRow, index < eventSummary.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border + '50' }]}>
                            <View style={[styles.eventIcon, { backgroundColor: event.color + '15' }]}>
                                <Ionicons name={event.icon as any} size={18} color={event.color} />
                            </View>
                        <Text style={[styles.eventType, { color: colors.text }]}>{event.label}</Text>
                            <Badge
                                label={event.count.toString()}
                                style={{ backgroundColor: event.color + '80' }}
                            />
                        </View>
                    ))}
                </Card>

                <View style={styles.filterContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                        {(['all', 'pending', 'approved', 'rejected'] as const).map(key => (
                            <TouchableOpacity
                                key={key}
                                onPress={() => setActiveFilter(key)}
                                style={[styles.filterTab, { backgroundColor: activeFilter === key ? colors.primary : colors.surface }, DesignTokens.shadows.sm]}
                            >
                                <Text style={[styles.filterText, { color: activeFilter === key ? '#fff' : colors.textSecondary }]}>
                                    {key.charAt(0).toUpperCase() + key.slice(1)}
                                </Text>
                                <View style={[styles.filterBadge, { backgroundColor: activeFilter === key ? 'rgba(255,255,255,0.2)' : colors.background }]}>
                                    <Text style={[styles.filterBadgeText, { color: activeFilter === key ? '#fff' : colors.textSecondary }]}>
                                        {key === 'all' ? stats.total : stats[key]}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                <SectionHeader title="Report List" />

                <View style={styles.reportList}>
                    {isLoading ? (
                        Array(3).fill(0).map((_, i) => <CardSkeleton key={i} />)
                    ) : filteredReports.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="document-text-outline" size={48} color={colors.textMuted} />
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No reports found</Text>
                        </View>
                    ) : (
                        filteredReports.map((report) => (
                            <Card key={report.id} style={styles.reportCard} onPress={() => openReport(report)}>
                                <View style={styles.reportHeader}>
                                    <View style={[styles.reportIconBox, { backgroundColor: getStatusColor(report.status) + '15' }]}>
                                        <Ionicons name={getStatusIcon(report.status) as any} size={20} color={getStatusColor(report.status)} />
                                    </View>
                                    <View style={styles.reportInfo}>
                                        <Text style={[styles.reportTitle, { color: colors.text }]}>{report.name}</Text>
                                        <Text style={[styles.reportMeta, { color: colors.textSecondary }]}>
                                            {report.merchandiser_name} • {new Date(report.created_at).toLocaleDateString()}
                                        </Text>
                                    </View>
                                    <View style={styles.reportProgressBox}>
                                        <Text style={[styles.progressVal, { color: colors.primary }]}>
                                            {report.visits_completed}/{report.visits_planned}
                                        </Text>
                                        <Text style={[styles.progressLab, { color: colors.textSecondary }]}>Visits</Text>
                                    </View>
                                </View>

                                <View style={styles.barContainer}>
                                    <ProgressBar
                                        progress={report.visits_completed / Math.max(1, report.visits_planned)}
                                        color={getStatusColor(report.status)}
                                    />
                                </View>

                                {report.status === 'pending' && (
                                    <View style={styles.quickActions}>
                                        <Button
                                            title="Approve"
                                            size="sm"
                                            variant="success"
                                            icon="checkmark"
                                            onPress={() => approveReport(report.id)}
                                            style={styles.quickBtn}
                                        />
                                        <Button
                                            title="Reject"
                                            size="sm"
                                            variant="danger"
                                            icon="close"
                                            onPress={() => { setSelectedReport(report); setShowRejectModal(true); }}
                                            style={styles.quickBtn}
                                        />
                                    </View>
                                )}
                            </Card>
                        ))
                    )}
                </View>
            </ScrollView>

            {/* Report Detail Modal */}
            <Modal visible={showDetailModal} transparent animationType="slide" onRequestClose={() => setShowDetailModal(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>Report Details</Text>
                            <TouchableOpacity onPress={() => setShowDetailModal(false)} style={styles.modalClose}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        {selectedReport && (
                            <ScrollView showsVerticalScrollIndicator={false}>
                                <View style={styles.detailCard}>
                                    <View style={styles.detailRow}>
                                        <View style={[styles.detailAvatar, { backgroundColor: colors.primary + '15' }]}>
                                            <Text style={[styles.avatarText, { color: colors.primary }]}>
                                                {selectedReport.merchandiser_name?.charAt(0) || 'M'}
                                            </Text>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.detailName, { color: colors.text }]}>{selectedReport.merchandiser_name}</Text>
                                            <Text style={[styles.detailDate, { color: colors.textSecondary }]}>{new Date(selectedReport.created_at).toLocaleString()}</Text>
                                        </View>
                                        <Badge label={selectedReport.status} variant={getStatusVariant(selectedReport.status)} />
                                    </View>

                                    <View style={[styles.metricRow, { backgroundColor: colors.background }]}>
                                        <View style={styles.metricItem}>
                                            <Text style={[styles.metricVal, { color: colors.primary }]}>{selectedReport.visits_completed}/{selectedReport.visits_planned}</Text>
                                            <Text style={[styles.metricLab, { color: colors.textSecondary }]}>Visits</Text>
                                        </View>
                                        <View style={[styles.metricDivider, { backgroundColor: colors.border }]} />
                                        <View style={styles.metricItem}>
                                            <Text style={[styles.metricVal, { color: colors.primary }]}>{selectedReport.type}</Text>
                                            <Text style={[styles.metricLab, { color: colors.textSecondary }]}>Event Type</Text>
                                        </View>
                                    </View>

                                    <Text style={[styles.sectionSubtitle, { color: colors.text, marginTop: 24 }]}>Merchandiser Notes</Text>
                                    <View style={[styles.notesBox, { backgroundColor: colors.surfaceSecondary, borderLeftColor: colors.primary }]}>
                                        <Text style={[styles.notesText, { color: colors.textSecondary }]}>
                                            {selectedReport.notes || "No additional comments provided by the merchandiser."}
                                        </Text>
                                    </View>

                                    {selectedReport.status === 'rejected' && selectedReport.rejection_reason && (
                                        <View style={[styles.rejectionReviewBox, { backgroundColor: colors.danger + '10' }]}>
                                            <Text style={[styles.rejectionReviewTitle, { color: colors.danger }]}>Rejection Feedback</Text>
                                            <Text style={[styles.rejectionReviewText, { color: colors.textSecondary }]}>{selectedReport.rejection_reason}</Text>
                                        </View>
                                    )}

                                    {selectedReport.status === 'pending' && (
                                        <View style={styles.modalActions}>
                                            <Button
                                                title="Approve Report"
                                                variant="success"
                                                fullWidth
                                                icon="checkmark-circle"
                                                onPress={() => approveReport(selectedReport.id)}
                                                style={{ marginBottom: 12 }}
                                            />
                                            <Button
                                                title="Reject Report"
                                                variant="danger"
                                                fullWidth
                                                icon="close-circle"
                                                onPress={() => setShowRejectModal(true)}
                                            />
                                        </View>
                                    )}
                                </View>
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>

            {/* Reject Modal */}
            <Modal visible={showRejectModal} transparent animationType="fade" onRequestClose={() => setShowRejectModal(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.rejectContent, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Reason for Rejection</Text>
                        <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>Please explain why this report is being rejected.</Text>

                        <TextInput
                            style={[styles.rejectInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                            placeholder="Type feedback here..."
                            placeholderTextColor={colors.textMuted}
                            multiline
                            numberOfLines={4}
                            value={rejectionReason}
                            onChangeText={setRejectionReason}
                            textAlignVertical="top"
                        />

                        <View style={styles.rejectActions}>
                            <Button title="Cancel" variant="ghost" style={{ flex: 1 }} onPress={() => setShowRejectModal(false)} />
                            <Button title="Confirm Reject" variant="danger" style={{ flex: 1 }} onPress={handleReject} />
                        </View>
                    </View>
                </View>
            </Modal>

            <BottomNav items={SUPERVISOR_NAV_ITEMS} activeRoute="/supervisor/reports" />
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
    scroll: { paddingBottom: 120 },
    statsGrid: { flexDirection: 'row', padding: DesignTokens.spacing.sm, gap: DesignTokens.spacing.sm },
    eventCard: { marginHorizontal: DesignTokens.spacing.lg, padding: 4 },
    eventRow: { flexDirection: 'row', alignItems: 'center', padding: 12 },
    eventIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    eventType: { flex: 1, ...DesignTokens.typography.bodyBold },
    filterContainer: { marginTop: 16 },
    filterScroll: { paddingHorizontal: DesignTokens.spacing.lg, gap: 10, paddingBottom: 4 },
    filterTab: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24 },
    filterText: { ...DesignTokens.typography.caption, fontWeight: 'bold' },
    filterBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
    filterBadgeText: { fontSize: 10, fontWeight: 'bold' },
    reportList: { paddingHorizontal: DesignTokens.spacing.lg, gap: DesignTokens.spacing.md, marginTop: 8 },
    reportCard: { padding: DesignTokens.spacing.md },
    reportHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    reportIconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    reportInfo: { flex: 1, gap: 2 },
    reportTitle: { ...DesignTokens.typography.bodyBold },
    reportMeta: { ...DesignTokens.typography.tiny },
    reportProgressBox: { alignItems: 'flex-end', minWidth: 50 },
    progressVal: { ...DesignTokens.typography.bodyBold },
    progressLab: { ...DesignTokens.typography.tiny },
    barContainer: { marginTop: 12 },
    quickActions: { flexDirection: 'row', gap: 10, marginTop: 16, borderTopWidth: 1, borderTopColor: '#0000000a', paddingTop: 12 },
    quickBtn: { flex: 1 },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
    emptyText: { ...DesignTokens.typography.body },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: '85%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { ...DesignTokens.typography.h2 },
    modalClose: { padding: 4 },
    detailCard: { gap: 16 },
    detailRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    detailAvatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
    avatarText: { ...DesignTokens.typography.h2, fontWeight: 'bold' },
    detailName: { ...DesignTokens.typography.h3 },
    detailDate: { ...DesignTokens.typography.caption },
    metricRow: { flexDirection: 'row', padding: 16, borderRadius: 16, gap: 24 },
    metricItem: { flex: 1, alignItems: 'center' },
    metricVal: { ...DesignTokens.typography.h3, fontWeight: 'bold' },
    metricLab: { ...DesignTokens.typography.tiny, textTransform: 'uppercase', marginTop: 4 },
    metricDivider: { width: 1, height: '100%' },
    sectionSubtitle: { ...DesignTokens.typography.bodyBold },
    notesBox: { padding: 16, borderRadius: 16, borderLeftWidth: 4 },
    notesText: { ...DesignTokens.typography.body, fontStyle: 'italic', lineHeight: 22 },
    rejectionReviewBox: { padding: 16, borderRadius: 16, gap: 4 },
    rejectionReviewTitle: { ...DesignTokens.typography.caption, fontWeight: 'bold' },
    rejectionReviewText: { ...DesignTokens.typography.body },
    modalActions: { marginTop: 32 },
    rejectContent: { padding: 24, borderRadius: 24, margin: 20, width: '90%', alignSelf: 'center' },
    modalSubtitle: { ...DesignTokens.typography.body, marginBottom: 16 },
    rejectInput: { borderRadius: 16, padding: 16, minHeight: 120, borderWidth: 1, marginTop: 8 },
    rejectActions: { flexDirection: 'row', gap: 12, marginTop: 24 },
});
