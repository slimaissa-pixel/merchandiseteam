import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import { 
    ActivityIndicator, 
    Text, 
    TouchableOpacity, 
    View, 
    ScrollView, 
    StyleSheet, 
    Image,
    Platform
} from 'react-native';
import { AdminWebLayout } from '@/components/admin/WebLayout';
import { Card } from '@/components/ui/Card';
import { getColors } from '@/constants/designSystem';
import { useTheme } from '@/context/ThemeContext';
import apiClient from '@/services/apiClient';
import { getFullImageUrl } from '@/constants/api';

interface TimelineEvent {
    id: string | number;
    type: string;
    timestamp: string;
    title: string;
    description?: string;
    payload?: any;
    status?: string;
}

interface VisitReport {
    visit_id: number;
    merchandiser: { id: number; name: string; avatar?: string };
    store: { id: number; name: string; city: string; address: string };
    start_time: string;
    end_time?: string;
    duration_minutes?: number;
    status: string;
    timeline: TimelineEvent[];
    gallery: any[];
    anomalies: any[];
    before_after: any[];
    ai_analysis: any[];
    compliance_score: number;
    task_completion_rate: number;
    performance_summary?: string;
}

export default function VisitFullReportPage() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { theme } = useTheme();
    const colors = getColors(theme);
    
    const [report, setReport] = useState<VisitReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'timeline' | 'gallery' | 'analysis' | 'anomalies'>('timeline');

    useEffect(() => {
        if (id) fetchReport();
    }, [id]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get(`/api/reports/visit/${id}/full`);
            setReport(response.data);
        } catch (error) {
            console.error('Failed to fetch visit report:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <AdminWebLayout title="Visit Report">
                <View style={s.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={{ color: colors.textMuted, marginTop: 12 }}>Generating full audit report...</Text>
                </View>
            </AdminWebLayout>
        );
    }

    if (!report) {
        return (
            <AdminWebLayout title="Visit Report">
                <View style={s.center}>
                    <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
                    <Text style={{ color: colors.text, marginTop: 12 }}>Report not found</Text>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Text style={{ color: colors.primary, marginTop: 8 }}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </AdminWebLayout>
        );
    }

    return (
        <AdminWebLayout title={`Visit Report - ${report.store.name}`}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* 1. Header Overview */}
                <Card style={[s.headerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={s.headerLeft}>
                        <View style={s.merchInfo}>
                            <View style={s.avatarLarge}>
                                {report.merchandiser.avatar ? (
                                    <Image source={{ uri: getFullImageUrl(report.merchandiser.avatar) }} style={s.fullImg} />
                                ) : (
                                    <Text style={[s.avatarText, { color: colors.primary }]}>
                                        {report.merchandiser.name ? report.merchandiser.name[0] : 'U'}
                                    </Text>
                                )}
                            </View>
                            <View>
                                <Text style={[s.merchName, { color: colors.text }]}>{report.merchandiser.name}</Text>
                                <Text style={[s.merchRole, { color: colors.textMuted }]}>Merchandiser ID #{report.merchandiser.id}</Text>
                            </View>
                        </View>
                        
                        <View style={s.storeInfo}>
                            <Ionicons name="storefront" size={20} color={colors.primary} />
                            <View>
                                <Text style={[s.storeName, { color: colors.text }]}>{report.store.name}</Text>
                                <Text style={[s.storeAddr, { color: colors.textMuted }]}>{report.store.address}, {report.store.city}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={s.headerRight}>
                        <View style={s.statsGrid}>
                            <View style={s.statBox}>
                                <Text style={[s.statVal, { color: colors.primary }]}>{report.duration_minutes || '---'}m</Text>
                                <Text style={[s.statLbl, { color: colors.textMuted }]}>Duration</Text>
                            </View>
                            <View style={s.statBox}>
                                <Text style={[s.statVal, { color: colors.success }]}>{report.compliance_score}%</Text>
                                <Text style={[s.statLbl, { color: colors.textMuted }]}>Compliance</Text>
                            </View>
                            <View style={s.statBox}>
                                <Text style={[s.statVal, { color: colors.warning }]}>{report.task_completion_rate.toFixed(0)}%</Text>
                                <Text style={[s.statLbl, { color: colors.textMuted }]}>Task Rate</Text>
                            </View>
                        </View>
                        <View style={[s.badge, { backgroundColor: report.status === 'completed' ? colors.success + '15' : colors.warning + '15' }]}>
                            <View style={[s.dot, { backgroundColor: report.status === 'completed' ? colors.success : colors.warning }]} />
                            <Text style={[s.badgeText, { color: report.status === 'completed' ? colors.success : colors.warning }]}>
                                {report.status.toUpperCase()}
                            </Text>
                        </View>
                    </View>
                </Card>

                {/* 2. Navigation Tabs */}
                <View style={s.tabBar}>
                    {(['timeline', 'analysis', 'gallery', 'anomalies'] as const).map((tabId) => {
                        const labels = { timeline: 'Timeline', analysis: 'AI & Comparison', gallery: 'Smart Gallery', anomalies: 'Anomalies' };
                        const icons: Record<string, any> = { timeline: 'list', analysis: 'analytics', gallery: 'images', anomalies: 'alert-circle' };
                        return (
                            <TouchableOpacity 
                                key={tabId}
                                onPress={() => setActiveTab(tabId)}
                                style={[s.tab, activeTab === tabId && { borderBottomColor: colors.primary }]}
                            >
                                <Ionicons name={icons[tabId]} size={18} color={activeTab === tabId ? colors.primary : colors.textMuted} />
                                <Text style={[s.tabText, { color: activeTab === tabId ? colors.primary : colors.textMuted }]}>
                                    {labels[tabId]}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* 3. Content Sections */}
                {activeTab === 'timeline' && (
                    <Card style={[s.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Text style={[s.sectionTitle, { color: colors.text }]}>Visit Activity Timeline</Text>
                        <View style={s.timelineContainer}>
                            {report.timeline.map((event, index) => (
                                <View key={event.id} style={s.timelineItem}>
                                    <View style={s.timelineLeft}>
                                        <Text style={[s.timeText, { color: colors.textMuted }]}>
                                            {format(new Date(event.timestamp), 'HH:mm')}
                                        </Text>
                                        <View style={[s.timelineDot, { backgroundColor: colors.primary }]} />
                                        {index < report.timeline.length - 1 && <View style={[s.timelineLine, { backgroundColor: colors.border }]} />}
                                    </View>
                                    <View style={s.timelineRight}>
                                        <Text style={[s.eventTitle, { color: colors.text }]}>{event.title}</Text>
                                        {event.description && <Text style={[s.eventDesc, { color: colors.textMuted }]}>{event.description}</Text>}
                                        {event.payload?.image && (
                                            <Image source={{ uri: getFullImageUrl(event.payload.image) }} style={s.eventImg} />
                                        )}
                                        {event.payload?.before && (
                                            <View style={s.eventSplit}>
                                                <Image source={{ uri: getFullImageUrl(event.payload.before) }} style={s.eventImgSmall} />
                                                <Image source={{ uri: getFullImageUrl(event.payload.after) }} style={s.eventImgSmall} />
                                            </View>
                                        )}
                                    </View>
                                </View>
                            ))}
                        </View>
                    </Card>
                )}

                {activeTab === 'analysis' && (
                    <View style={s.tabContent}>
                        {/* Before/After Section */}
                        {report.before_after.map((ba, idx) => (
                            <Card key={idx} style={[s.comparisonCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                <Text style={[s.sectionTitle, { color: colors.text }]}>Before / After Comparison</Text>
                                <View style={s.splitView}>
                                    <View style={s.splitCol}>
                                        <Text style={s.splitLabel}>BEFORE</Text>
                                        <Image source={{ uri: getFullImageUrl(ba.before) }} style={s.splitImg} />
                                    </View>
                                    <View style={s.splitCol}>
                                        <Text style={s.splitLabel}>AFTER</Text>
                                        <Image source={{ uri: getFullImageUrl(ba.after) }} style={s.splitImg} />
                                    </View>
                                </View>
                                {ba.notes && <Text style={[s.baNotes, { color: colors.textMuted }]}>Notes: {ba.notes}</Text>}
                            </Card>
                        ))}

                        {/* AI Detection Section */}
                        {report.ai_analysis.length > 0 && (
                            <Card style={[s.analysisCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                <Text style={[s.sectionTitle, { color: colors.text }]}>AI Visual Intelligence Results</Text>
                                {report.ai_analysis.map((ai, idx) => (
                                    <View key={idx} style={s.aiItem}>
                                        <Image source={{ uri: getFullImageUrl(ai.image) }} style={s.aiImg} />
                                        <View style={s.aiResults}>
                                            <Text style={[s.aiHeader, { color: colors.text }]}>Detection Summary</Text>
                                            {ai.results?.detections ? (
                                                ai.results.detections.map((det: any, dIdx: number) => (
                                                    <View key={dIdx} style={s.detRow}>
                                                        <Text style={[s.detName, { color: colors.text }]}>{det.class}</Text>
                                                        <Text style={[s.detConf, { color: colors.primary }]}>{(det.confidence * 100).toFixed(0)}% Match</Text>
                                                    </View>
                                                ))
                                            ) : (
                                                <Text style={{ color: colors.textMuted }}>No AI metadata available for this scan.</Text>
                                            )}
                                        </View>
                                    </View>
                                ))}
                            </Card>
                        )}
                    </View>
                )}

                {activeTab === 'gallery' && (
                    <Card style={[s.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Text style={[s.sectionTitle, { color: colors.text }]}>Categorized Visit Gallery</Text>
                        <View style={s.galleryGrid}>
                            {report.gallery.map((img, idx) => (
                                <View key={idx} style={s.galleryItem}>
                                    <Image source={{ uri: getFullImageUrl(img.url) }} style={s.galleryImg} />
                                    <View style={[s.galleryTag, { backgroundColor: colors.primary }]}>
                                        <Text style={s.galleryTagText}>{img.category}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </Card>
                )}

                {activeTab === 'anomalies' && (
                    <View style={s.tabContent}>
                        {report.anomalies.length === 0 ? (
                            <View style={s.emptyState}>
                                <Ionicons name="checkmark-done-circle-outline" size={64} color={colors.success} />
                                <Text style={[s.emptyText, { color: colors.text }]}>No Anomalies Reported</Text>
                                <Text style={{ color: colors.textMuted }}>Visit was compliant and clean.</Text>
                            </View>
                        ) : (
                            report.anomalies.map((an, idx) => (
                                <Card key={idx} style={[s.anomalyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                    <View style={s.anomalyHeader}>
                                        <View style={[s.severityBadge, { backgroundColor: an.severity === 'high' ? colors.danger : colors.warning }]}>
                                            <Text style={s.severityText}>{an.severity?.toUpperCase()}</Text>
                                        </View>
                                        <Text style={[s.anomalyTime, { color: colors.textMuted }]}>{format(new Date(an.timestamp), 'HH:mm')}</Text>
                                    </View>
                                    <View style={s.anomalyBody}>
                                        <Image source={{ uri: getFullImageUrl(an.image) }} style={s.anomalyImg} />
                                        <View style={s.anomalyContent}>
                                            <Text style={[s.anomalyTitle, { color: colors.text }]}>{an.title}</Text>
                                            <Text style={[s.anomalyDesc, { color: colors.textMuted }]}>{an.notes || 'No description provided.'}</Text>
                                        </View>
                                    </View>
                                </Card>
                            ))
                        )}
                    </View>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>
        </AdminWebLayout>
    );
}

const s = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    headerCard: { flexDirection: 'row', padding: 24, borderRadius: 24, marginBottom: 24, justifyContent: 'space-between' },
    headerLeft: { gap: 20 },
    merchInfo: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    avatarLarge: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#80808020', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    fullImg: { width: '100%', height: '100%' },
    avatarText: { fontSize: 24, fontWeight: '800' },
    merchName: { fontSize: 18, fontWeight: '800' },
    merchRole: { fontSize: 13 },
    storeInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    storeName: { fontSize: 16, fontWeight: '700' },
    storeAddr: { fontSize: 13 },
    headerRight: { alignItems: 'flex-end', justifyContent: 'space-between' },
    statsGrid: { flexDirection: 'row', gap: 20, marginBottom: 16 },
    statBox: { alignItems: 'center' },
    statVal: { fontSize: 20, fontWeight: '900' },
    statLbl: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
    badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    badgeText: { fontSize: 11, fontWeight: '800' },
    tabBar: { flexDirection: 'row', gap: 32, marginBottom: 24, borderBottomWidth: 1, borderBottomColor: '#80808020' },
    tab: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, borderBottomWidth: 3, borderBottomColor: 'transparent' },
    tabText: { fontSize: 14, fontWeight: '700' },
    tabContent: { gap: 20 },
    sectionCard: { padding: 24, borderRadius: 24 },
    sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 24 },
    timelineContainer: { paddingLeft: 8 },
    timelineItem: { flexDirection: 'row', gap: 20, marginBottom: 24 },
    timelineLeft: { alignItems: 'center', width: 60 },
    timeText: { fontSize: 12, fontWeight: '700' },
    timelineDot: { width: 14, height: 14, borderRadius: 7, marginTop: 8, zIndex: 1, borderWidth: 3, borderColor: '#fff' },
    timelineLine: { position: 'absolute', top: 28, bottom: -24, width: 2, left: '50%', marginLeft: 11 },
    timelineRight: { flex: 1, paddingTop: 4 },
    eventTitle: { fontSize: 15, fontWeight: '700' },
    eventDesc: { fontSize: 13, marginTop: 4, lineHeight: 18 },
    eventImg: { width: '100%', height: 200, borderRadius: 16, marginTop: 12, resizeMode: 'cover' },
    eventImgSmall: { flex: 1, height: 120, borderRadius: 12 },
    eventSplit: { flexDirection: 'row', gap: 12, marginTop: 12 },
    comparisonCard: { padding: 24, borderRadius: 24 },
    splitView: { flexDirection: 'row', gap: 20, marginBottom: 16 },
    splitCol: { flex: 1, gap: 8 },
    splitLabel: { fontSize: 11, fontWeight: '800', textAlign: 'center', color: '#808080' },
    splitImg: { width: '100%', height: 300, borderRadius: 16 },
    baNotes: { fontSize: 14, fontStyle: 'italic' },
    analysisCard: { padding: 24, borderRadius: 24 },
    aiItem: { flexDirection: 'row', gap: 20, marginBottom: 20 },
    aiImg: { width: 200, height: 150, borderRadius: 16 },
    aiResults: { flex: 1, gap: 8 },
    aiHeader: { fontSize: 14, fontWeight: '800', marginBottom: 4 },
    detRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#80808010' },
    detName: { fontSize: 13, fontWeight: '600' },
    detConf: { fontSize: 12, fontWeight: '700' },
    galleryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
    galleryItem: { width: '23%', height: 180, borderRadius: 16, overflow: 'hidden' },
    galleryImg: { width: '100%', height: '100%' },
    galleryTag: { position: 'absolute', bottom: 10, left: 10, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    galleryTagText: { color: '#fff', fontSize: 10, fontWeight: '800' },
    anomalyCard: { padding: 24, borderRadius: 24 },
    anomalyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    severityBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
    severityText: { color: '#fff', fontSize: 10, fontWeight: '900' },
    anomalyTime: { fontSize: 12, fontWeight: '700' },
    anomalyBody: { flexDirection: 'row', gap: 20 },
    anomalyImg: { width: 120, height: 120, borderRadius: 16 },
    anomalyContent: { flex: 1 },
    anomalyTitle: { fontSize: 16, fontWeight: '800' },
    anomalyDesc: { fontSize: 14, marginTop: 8, lineHeight: 20 },
    emptyState: { padding: 60, alignItems: 'center' },
    emptyText: { fontSize: 20, fontWeight: '800', marginTop: 16 },
});
