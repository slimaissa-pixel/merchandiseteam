import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppMapView, { Marker } from '@/components/AppMapView';
import { Card } from '@/components/ui/Card';
import { Header } from '@/components/ui/Header';
import { DesignTokens, getColors } from '@/constants/designSystem';
import { useTheme } from '@/context/ThemeContext';
import { Notification, NotificationService } from '@/services/notification.service';
import { Report, ReportService } from '@/services/report.service';

export default function SupervisorNotificationDetail() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { theme } = useTheme();
    const colors = getColors(theme);

    const [notification, setNotification] = useState<Notification | null>(null);
    const [relatedReport, setRelatedReport] = useState<Report | null>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        loadDetail();
    }, [id]);

    const loadDetail = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const data = await NotificationService.getNotificationDetail(Number(id));
            setNotification(data);
            if (data && !data.is_read) {
                await NotificationService.markAsRead(data.id);
            }

            // Check if it's a report notification to fetch images
            if (data && data.action_link && data.action_link.includes('id=')) {
                const reportId = data.action_link.split('id=')[1];
                if (reportId && !isNaN(Number(reportId))) {
                    const reportData = await ReportService.getById(Number(reportId));
                    setRelatedReport(reportData);
                }
            }
        } catch (error) {
            console.error('Load detail error:', error);
            Alert.alert('Error', 'Failed to load notification details');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        router.back();
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <Header title="Notification" showBack />
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    if (!notification) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <Header title="Notification" showBack />
                <View style={styles.centered}>
                    <Text style={{ color: colors.textSecondary }}>Notification not found</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <SafeAreaView edges={['top']} style={{ backgroundColor: colors.primary }}>
                <Header title="Notification Detail" showBack />
            </SafeAreaView>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Card style={styles.detailCard}>
                    <View style={styles.headerRow}>
                        <View style={[styles.typeBadge, { backgroundColor: colors.primary + '20' }]}>
                            <Ionicons
                                name={(notification.icon || 'notifications') as any}
                                size={28}
                                color={colors.primary}
                            />
                        </View>
                        <View style={styles.headerText}>
                            <Text style={[styles.time, { color: colors.textSecondary }]}>
                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </Text>
                            <Text style={[styles.title, { color: colors.text }]}>{notification.title}</Text>
                        </View>
                    </View>

                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

                    <View style={styles.body}>
                        <View style={styles.messageSection}>
                            <Ionicons name="chatbox-ellipses-outline" size={20} color={colors.textSecondary} style={{ marginTop: 2 }} />
                            <Text style={[styles.message, { color: colors.text }]}>{notification.message}</Text>
                        </View>

                        {notification.action_link && (() => {
                            try {
                                const data = JSON.parse(notification.action_link || '{}');
                                if (Object.keys(data).length === 0) return null;
                                return (
                                    <View style={[styles.dataCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                                        <Text style={[styles.dataHeader, { color: colors.text }]}>Attached Information</Text>
                                        <View style={styles.dataList}>
                                            {Object.entries(data).map(([key, value], index) => {
                                                const formattedKey = key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                                                if (typeof value !== 'string' && typeof value !== 'number') return null;

                                                let icon = "information-circle-outline";
                                                if (key.includes('name')) icon = "business-outline";
                                                if (key.includes('address') || key.includes('location')) icon = "map-outline";
                                                if (key.includes('type') || key.includes('category')) icon = "layers-outline";
                                                if (key.includes('id')) icon = "id-card-outline";

                                                return (
                                                    <View key={index} style={styles.dataItem}>
                                                        <Ionicons name={icon as any} size={18} color={colors.primary} />
                                                        <View style={styles.dataText}>
                                                            <Text style={[styles.dataLabel, { color: colors.textSecondary }]}>{formattedKey}</Text>
                                                            <Text style={[styles.dataValue, { color: colors.text }]}>{String(value)}</Text>
                                                        </View>
                                                    </View>
                                                );
                                            })}

                                            {data.latitude && data.longitude && (
                                                <View style={[styles.mapContainer, { borderColor: colors.border }]}>
                                                    <AppMapView
                                                        style={styles.miniMap}
                                                        initialRegion={{
                                                            latitude: Number(data.latitude),
                                                            longitude: Number(data.longitude),
                                                            latitudeDelta: 0.005,
                                                            longitudeDelta: 0.005,
                                                        }}
                                                        scrollEnabled={false}
                                                        zoomEnabled={false}
                                                    >
                                                        <Marker
                                                            coordinate={{
                                                                latitude: Number(data.latitude),
                                                                longitude: Number(data.longitude),
                                                            }}
                                                        />
                                                    </AppMapView>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                );
                            } catch (e) { return null; }
                        })()}

                        {relatedReport && (
                            <View style={styles.specialContent}>
                                <View style={[styles.infoBox, { backgroundColor: colors.danger + '10', borderLeftColor: colors.danger }]}>
                                    <View style={styles.infoLine}>
                                        <Ionicons name="warning" size={18} color={colors.danger} />
                                        <Text style={[styles.infoTitle, { color: colors.danger }]}>Visual Evidence Report</Text>
                                    </View>
                                    <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                                        Detailed view of the submitted field evidence.
                                    </Text>
                                </View>

                                <View style={[styles.dataCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                                    <Text style={[styles.dataHeader, { color: colors.text }]}>Organized Report Details</Text>

                                    <View style={styles.dataList}>
                                        <View style={styles.dataItem}>
                                            <View style={[styles.miniBadge, { backgroundColor: colors.primary + '15' }]}>
                                                <Ionicons name="person" size={14} color={colors.primary} />
                                            </View>
                                            <View style={styles.dataText}>
                                                <Text style={[styles.dataLabel, { color: colors.textSecondary }]}>Reporter Name</Text>
                                                <Text style={[styles.dataValue, { color: colors.text }]}>{relatedReport.merchandiser_name}</Text>
                                            </View>
                                        </View>

                                        <View style={styles.dataItem}>
                                            <View style={[styles.miniBadge, { backgroundColor: colors.secondary + '15' }]}>
                                                <Ionicons name="shield" size={14} color={colors.secondary} />
                                            </View>
                                            <View style={styles.dataText}>
                                                <Text style={[styles.dataLabel, { color: colors.textSecondary }]}>User Role</Text>
                                                <Text style={[styles.dataValue, { color: colors.text }]}>Merchandiser</Text>
                                            </View>
                                        </View>

                                        <View style={styles.dataItem}>
                                            <View style={[styles.miniBadge, { backgroundColor: colors.warning + '15' }]}>
                                                <Ionicons name="alert-circle" size={14} color={colors.warning} />
                                            </View>
                                            <View style={styles.dataText}>
                                                <Text style={[styles.dataLabel, { color: colors.textSecondary }]}>Issue Type</Text>
                                                <Text style={[styles.dataValue, { color: colors.text }]}>{relatedReport.type || 'Field Report'}</Text>
                                            </View>
                                        </View>

                                        <View style={styles.dataItem}>
                                            <View style={[styles.miniBadge, { backgroundColor: colors.info + '15' }]}>
                                                <Ionicons name="document-text" size={14} color={colors.info} />
                                            </View>
                                            <View style={styles.dataText}>
                                                <Text style={[styles.dataLabel, { color: colors.textSecondary }]}>Description</Text>
                                                <Text style={[styles.dataValue, { color: colors.text }]}>{relatedReport.notes || 'No notes.'}</Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.imagesGrid}>
                                    <View style={styles.imageCol}>
                                        <Text style={[styles.imageTag, { color: colors.textSecondary }]}>BEFORE</Text>
                                        <TouchableOpacity
                                            activeOpacity={0.8}
                                            onPress={() => relatedReport.before_image && setSelectedImage(relatedReport.before_image)}
                                        >
                                            <Card style={styles.imageCard}>
                                                {relatedReport.before_image ? (
                                                    <Image source={{ uri: relatedReport.before_image }} style={styles.fullImage} resizeMode="cover" />
                                                ) : (
                                                    <View style={styles.noImage}><Ionicons name="image-outline" size={32} color={colors.border} /></View>
                                                )}
                                            </Card>
                                        </TouchableOpacity>
                                    </View>
                                    <View style={styles.imageCol}>
                                        <Text style={[styles.imageTag, { color: colors.textSecondary }]}>AFTER</Text>
                                        <TouchableOpacity
                                            activeOpacity={0.8}
                                            onPress={() => relatedReport.after_image && setSelectedImage(relatedReport.after_image)}
                                        >
                                            <Card style={styles.imageCard}>
                                                {relatedReport.after_image ? (
                                                    <Image source={{ uri: relatedReport.after_image }} style={styles.fullImage} resizeMode="cover" />
                                                ) : (
                                                    <View style={styles.noImage}><Ionicons name="image-outline" size={32} color={colors.border} /></View>
                                                )}
                                            </Card>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        )}
                    </View>
                </Card>
            </ScrollView>

            {/* Full Screen Image Modal */}
            <Modal visible={!!selectedImage} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <SafeAreaView style={styles.modalHeaderClose}>
                        <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedImage(null)}>
                            <Ionicons name="close" size={32} color="#fff" />
                        </TouchableOpacity>
                    </SafeAreaView>
                    <View style={styles.modalBody}>
                        {selectedImage && (
                            <Image source={{ uri: selectedImage }} style={styles.fullscreenImage} resizeMode="contain" />
                        )}
                    </View>
                </View>
            </Modal>

            <View style={[styles.actionFooter, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
                <TouchableOpacity
                    style={[styles.mainActionBtn, { backgroundColor: colors.primary }]}
                    onPress={handleClose}
                >
                    <Ionicons name="close-circle-outline" size={20} color="#fff" />
                    <Text style={styles.mainActionLabel}>Close Notification</Text>
                </TouchableOpacity>
                <SafeAreaView edges={['bottom']} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { padding: 20, paddingBottom: 140 },
    detailCard: { padding: 20, borderRadius: 24, elevation: 4 },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    typeBadge: { width: 60, height: 60, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    headerText: { flex: 1 },
    title: { fontSize: 20, fontFamily: DesignTokens.typography.h3.fontFamily, fontWeight: '700', marginTop: 2 },
    time: { fontSize: 12, fontFamily: DesignTokens.typography.tiny.fontFamily, opacity: 0.6 },
    divider: { height: 1, marginVertical: 20 },
    body: { gap: 20 },
    messageSection: { flexDirection: 'row', gap: 12 },
    message: { flex: 1, fontSize: 16, lineHeight: 24, fontFamily: DesignTokens.typography.body.fontFamily },
    specialContent: { gap: 16 },
    infoBox: { padding: 12, borderRadius: 12, borderLeftWidth: 4 },
    infoLine: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    infoTitle: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
    infoText: { fontSize: 13, lineHeight: 18 },
    dataCard: { padding: 16, borderRadius: 20, borderWidth: 1, gap: 16 },
    dataItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    dataText: { flex: 1 },
    dataLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
    dataValue: { fontSize: 14, fontWeight: '500' },
    mapContainer: { height: 160, borderRadius: 16, overflow: 'hidden', borderWidth: 1 },
    miniMap: { width: '100%', height: '100%' },
    imagesGrid: { flexDirection: 'row', gap: 12 },
    imageCol: { flex: 1, gap: 6 },
    imageTag: { fontSize: 11, fontWeight: '800', textAlign: 'center' },
    imageCard: { height: 140, borderRadius: 16, overflow: 'hidden', padding: 0 },
    fullImage: { width: '100%', height: '100%' },
    noImage: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#00000005' },
    actionFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingTop: 16, borderTopWidth: 1 },
    mainActionBtn: { height: 54, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10 },
    mainActionLabel: { color: '#fff', fontSize: 15, fontWeight: '800' },
    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)' },
    modalHeaderClose: { alignItems: 'flex-end', padding: 20 },
    closeBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    modalBody: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    fullscreenImage: { width: '100%', height: '100%' },
    // Enhanced Data Styles
    dataHeader: { fontSize: 16, fontWeight: '800', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
    dataList: { gap: 16 },
    miniBadge: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
});
