import { Ionicons } from '@expo/vector-icons';
import { format, isToday, isThisWeek, isThisMonth } from 'date-fns';
import { useEffect, useState } from 'react';
import { 
    ActivityIndicator, 
    Text, 
    TouchableOpacity, 
    View, 
    ScrollView, 
    StyleSheet, 
    Linking,
    Platform
} from 'react-native';
import { AdminWebLayout } from '@/components/admin/WebLayout';
import { Card } from '@/components/ui/Card';
import { getColors } from '@/constants/designSystem';
import { useTheme } from '@/context/ThemeContext';
import { Fonts } from '@/hooks/useFonts';
import apiClient from '@/services/apiClient';
import { API_BASE_URL } from '@/constants/api';

interface WorkdayStat {
    id: number;
    merchandiser: string;
    date: string;
    stores_visited: number;
    reports_submitted: number;
    duration: string;
    status: string;
    user_id: number;
    user_email: string;
    user_role: string;
}

export default function ReportingPage() {
    const { theme } = useTheme();
    const colors = getColors(theme);
    const [reports, setReports] = useState<WorkdayStat[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

    const fetchReports = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/api/export/workdays/all');
            setReports(response.data || []);
        } catch (error: any) {
            console.error('[Reporting] Failed to fetch reports:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const handleDownload = async (workdayId: number) => {
        try {
            if (Platform.OS === 'web') {
                // Fetch as blob to include Auth headers
                const response = await apiClient.get(`/api/export/workday/${workdayId}/pdf`, {
                    responseType: 'blob'
                });
                
                if (response.data.size < 100) {
                    throw new Error('PDF file is empty or corrupted.');
                }

                // Create local URL for the blob
                const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
                
                // Open in new tab
                window.open(url, '_blank');
                
                // Optional cleanup - usually we don't revoke immediately if we want to view it
                // but for a one-off view it's okay after some time
                setTimeout(() => window.URL.revokeObjectURL(url), 10000);
            } else {
                // For mobile, we still use Linking but it might need a token in query param 
                // or a different approach (like expo-file-system)
                const url = `${API_BASE_URL}/api/export/workday/${workdayId}/pdf`;
                Linking.openURL(url);
            }
        } catch (error) {
            console.error('Download error:', error);
            alert('Failed to download PDF. Please check your connection.');
        }
    };

    const handleDelete = async (id: number) => {
        if (confirm('Are you sure you want to delete this report?')) {
            try {
                // Assuming we have a delete workday or similar. 
                // For now, let's just alert since I don't have a specific delete endpoint for reports.
                alert('Delete functionality not implemented yet for this endpoint.');
            } catch (error) {
                console.error(error);
            }
        }
    };

    const filteredReports = reports.filter(r => {
        if (!r.date) return filter === 'all';
        const d = new Date(r.date);
        if (filter === 'today') return isToday(d);
        if (filter === 'week') return isThisWeek(d);
        if (filter === 'month') return isThisMonth(d);
        return true;
    });

    return (
        <AdminWebLayout title="Reporting">
            {/* Main Console Header */}
            <View style={rSt.header}>
                <View>
                    <Text style={[rSt.headerTitle, { color: colors.text }]}>Documents & Rapports</Text>
                    <Text style={[rSt.headerSub, { color: colors.textMuted }]}>Rapports journaliers des merchandisers</Text>
                </View>
                <TouchableOpacity 
                    style={[rSt.refreshBtn, { backgroundColor: colors.primary }]}
                    onPress={fetchReports}
                >
                    <Ionicons name="refresh" size={16} color="#fff" />
                    <Text style={rSt.refreshBtnText}>Actualiser</Text>
                </TouchableOpacity>
            </View>

            {/* Filters & Count */}
            <View style={rSt.filterBar}>
                <View style={[rSt.filterTabs, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                    {(['all', 'today', 'week', 'month'] as const).map(f => (
                        <TouchableOpacity 
                            key={f}
                            onPress={() => setFilter(f)}
                            style={[
                                rSt.filterTab, 
                                filter === f && { backgroundColor: colors.primary }
                            ]}
                        >
                            <Text style={[
                                rSt.filterTabText, 
                                { color: filter === f ? '#fff' : colors.textMuted }
                            ]}>
                                {f === 'all' ? 'Tous' : f === 'today' ? "Aujourd'hui" : f === 'week' ? 'Cette semaine' : 'Ce mois'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
                <Text style={[rSt.countText, { color: colors.textMuted }]}>{filteredReports.length} document(s)</Text>
            </View>

            {/* List */}
            {loading ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 60 }} />
            ) : (
                <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
                    {filteredReports.map(report => (
                        <Card key={report.id} style={[rSt.reportCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <View style={rSt.reportIconBox}>
                                <Ionicons name="document-text" size={24} color={colors.textMuted} />
                            </View>
                            
                            <View style={rSt.reportContent}>
                                <Text style={[rSt.reportTitle, { color: colors.text }]}>
                                    Rapport Journalier - {report.date ? format(new Date(report.date), 'eeee dd MMMM yyyy') : 'Date inconnue'}
                                </Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, marginBottom: 4 }}>
                                    <View style={{ backgroundColor: report.user_role === 'supervisor' ? colors.primary + '20' : colors.info + '20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginRight: 8 }}>
                                        <Text style={{ fontSize: 10, fontWeight: '700', color: report.user_role === 'supervisor' ? colors.primary : colors.info, textTransform: 'uppercase' }}>
                                            {report.user_role || 'MERCHANDISER'}
                                        </Text>
                                    </View>
                                    <Text style={[rSt.reportStats, { color: colors.textMuted, marginTop: 0 }]}>
                                        {report.merchandiser} - {report.stores_visited} magasins, {report.duration} travaillés, {report.reports_submitted} rapports
                                    </Text>
                                </View>
                                <View style={rSt.reportFooter}>
                                    <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
                                    <Text style={[rSt.reportMeta, { color: colors.textMuted }]}>
                                        {report.date ? format(new Date(report.date), 'dd MMMM yyyy à HH:mm') : '---'}
                                    </Text>
                                    <Ionicons name="person-outline" size={12} color={colors.textMuted} style={{ marginLeft: 12 }} />
                                    <Text style={[rSt.reportMeta, { color: colors.textMuted }]}>{report.user_email}</Text>
                                </View>
                            </View>

                            <View style={rSt.reportActions}>
                                <TouchableOpacity 
                                    style={[rSt.downloadBtn, { backgroundColor: colors.primary }]}
                                    onPress={() => handleDownload(report.id)}
                                >
                                    <Ionicons name="download-outline" size={16} color="#fff" />
                                    <Text style={rSt.downloadBtnText}>Télécharger</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={[rSt.deleteBtn, { borderColor: colors.danger + '40' }]}
                                    onPress={() => handleDelete(report.id)}
                                >
                                    <Ionicons name="trash-outline" size={18} color={colors.danger} />
                                </TouchableOpacity>
                            </View>
                        </Card>
                    ))}

                    {filteredReports.length === 0 && (
                        <View style={rSt.emptyState}>
                            <Ionicons name="document-outline" size={48} color={colors.textMuted} />
                            <Text style={{ color: colors.textMuted, marginTop: 12 }}>Aucun rapport trouvé pour cette période.</Text>
                        </View>
                    )}
                    
                    <View style={{ height: 40 }} />
                </ScrollView>
            )}
        </AdminWebLayout>
    );
}

const rSt = StyleSheet.create({
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    headerTitle: { fontSize: 22, fontWeight: '800' },
    headerSub: { fontSize: 13, marginTop: 4 },
    refreshBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
    refreshBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
    filterBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    filterTabs: { flexDirection: 'row', padding: 4, borderRadius: 12, borderWidth: 1 },
    filterTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
    filterTabText: { fontSize: 13, fontWeight: '700' },
    countText: { fontSize: 13, fontWeight: '600' },
    reportCard: { flexDirection: 'row', alignItems: 'center', padding: 20, marginBottom: 12, borderRadius: 16, borderWidth: 1 },
    reportIconBox: { width: 50, height: 50, borderRadius: 12, backgroundColor: '#80808010', alignItems: 'center', justifyContent: 'center' },
    reportContent: { flex: 1, marginLeft: 16 },
    reportTitle: { fontSize: 15, fontWeight: '700' },
    reportStats: { fontSize: 13, marginTop: 4 },
    reportFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
    reportMeta: { fontSize: 11, fontWeight: '600', marginLeft: 4 },
    reportActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    downloadBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
    downloadBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
    deleteBtn: { padding: 10, borderRadius: 10, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
    emptyState: { alignItems: 'center', paddingVertical: 80 }
});
