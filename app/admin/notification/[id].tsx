import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Linking,
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
import { GMSService } from '@/services/gms.service';
import { Notification, NotificationService } from '@/services/notification.service';
import { Report, ReportService } from '@/services/report.service';
import { getFullImageUrl } from '@/constants/api';

export default function NotificationDetail() {
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
                if (reportId) {
                    const reportData = await ReportService.getById(Number(reportId));
                    setRelatedReport(reportData);
                }
            } else if (data && data.type === 'report') {
                // Sometime type is enough, but we might need more logic here 
                // if the ID isn't in the action_link
            }
        } catch (error) {
            console.error('Load detail error:', error);
            Alert.alert('Error', 'Failed to load notification details');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (action: 'approve' | 'pend' | 'delete') => {
        if (!notification) return;
        setProcessing(true);
        try {
            switch (action) {
                case 'approve':
                    if (notification.type === 'new_gms' && notification.action_link) {
                        try {
                            const payload = JSON.parse(notification.action_link);
                            const newGms = await GMSService.create(payload);
                            if (newGms) {
                                const targetUserId = payload.requester_id || notification.user_id;
                                await NotificationService.sendNotification({
                                    user_id: Number(targetUserId),
                                    title: 'New Store Approved',
                                    message: `Your request to add "${payload.name}" has been successfully approved and added to the system.`,
                                    type: 'success',
                                    icon: 'checkmark-circle'
                                });
                                await NotificationService.deleteNotification(notification.id);
                                Alert.alert('Success', 'Request approved and store created.');
                                router.back();
                            } else {
                                Alert.alert('Error', 'Failed to create GMS in database.');
                            }
                        } catch (e) {
                            console.error('Approval error:', e);
                            Alert.alert('Error', 'Failed to approve request.');
                        }
                    } else if (notification.type === 'report' || notification.type === 'alert') {
                        const targetUserId = relatedReport?.user_id || notification.user_id;

                        await NotificationService.sendNotification({
                            user_id: Number(targetUserId),
                            title: 'Issue Resolved',
                            message: `The issue regarding "${notification.title}" has been reviewed and marked as resolved.`,
                            type: 'success',
                            icon: 'checkmark-done-circle'
                        });
                        await NotificationService.deleteNotification(notification.id);
                        Alert.alert('Success', 'Issue marked as resolved.');
                        router.back();
                    }
                    break;
                case 'pend':
                    const pendTargetUserId = (notification.type === 'new_gms' && notification.action_link)
                        ? JSON.parse(notification.action_link).requester_id
                        : (relatedReport?.user_id || notification.user_id);

                    await NotificationService.sendNotification({
                        user_id: Number(pendTargetUserId),
                        title: 'Request Pending',
                        message: `Your request "${notification.title}" is currently under secondary review. Please wait for further updates.`,
                        type: 'warning',
                        icon: 'time'
                    });
                    // Mark as read so it's not "new" but keep it in the list
                    await NotificationService.markAsRead(notification.id);
                    Alert.alert('Pending', 'User has been notified that the request is under review.');
                    router.back();
                    break;
                case 'delete':
                    Alert.alert('Delete Notification', 'Are you sure you want to permanently remove this notification?', [
                        { text: 'Cancel', style: 'cancel' },
                        {
                            text: 'Delete',
                            style: 'destructive',
                            onPress: async () => {
                                const success = await NotificationService.deleteNotification(notification.id);
                                if (success) {
                                    Alert.alert('Success', 'Notification deleted');
                                    router.back();
                                }
                            }
                        }
                    ]);
                    break;
            }
        } catch (error) {
            console.error('Action error:', error);
            Alert.alert('Error', 'Failed to process action');
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <Header title="Notification Detail" showBack />
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    if (!notification) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <Header title="Notification Detail" showBack />
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
                        <View style={[styles.typeBadge, {
                            backgroundColor: notification.type === 'success' ? colors.success + '20' :
                                notification.type === 'warning' ? colors.warning + '20' :
                                    notification.type === 'report' ? colors.danger + '20' : colors.primary + '20'
                        }]}>
                            <Ionicons
                                name={(notification.icon || 'notifications') as any}
                                size={28}
                                color={notification.type === 'success' ? colors.success :
                                    notification.type === 'warning' ? colors.warning :
                                        notification.type === 'report' ? colors.danger : colors.primary}
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

                        {notification.type === 'new_gms' && (
                            <View style={styles.specialContent}>
                                <View style={[styles.infoBox, { backgroundColor: colors.primary + '10' }]}>
                                    <View style={styles.infoLine}>
                                        <Ionicons name="information-circle" size={18} color={colors.primary} />
                                        <Text style={[styles.infoTitle, { color: colors.primary }]}>Store Creation Request</Text>
                                    </View>
                                    <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                                        Verify the location and store details before authorizing.
                                    </Text>
                                </View>

                                {(() => {
                                    try {
                                        const data = JSON.parse(notification.action_link || '{}');
                                        if (!data.name) return null;
                                        return (
                                            <View style={[styles.dataCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                                                <View style={styles.dataItem}>
                                                    <Ionicons name="business" size={20} color={colors.primary} />
                                                    <View style={styles.dataText}>
                                                        <Text style={[styles.dataLabel, { color: colors.textSecondary }]}>Store Name</Text>
                                                        <Text style={[styles.dataValue, { color: colors.text }]}>{data.name}</Text>
                                                    </View>
                                                </View>
                                                <View style={styles.dataItem}>
                                                    <Ionicons name="location" size={20} color={colors.primary} />
                                                    <View style={styles.dataText}>
                                                        <Text style={[styles.dataLabel, { color: colors.textSecondary }]}>Location</Text>
                                                        <Text style={[styles.dataValue, { color: colors.text }]}>{data.address}</Text>
                                                    </View>
                                                </View>
                                                <View style={styles.dataItem}>
                                                    <Ionicons name="pricetag" size={20} color={colors.primary} />
                                                    <View style={styles.dataText}>
                                                        <Text style={[styles.dataLabel, { color: colors.textSecondary }]}>Type / Category</Text>
                                                        <Text style={[styles.dataValue, { color: colors.text }]}>{data.type}</Text>
                                                    </View>
                                                </View>

                                                {data.latitude && data.longitude && (
                                                    <View style={[styles.mapContainer, { borderColor: colors.border }]}>
                                                        <AppMapView
                                                            style={styles.miniMap}
                                                            initialRegion={{
                                                                latitude: data.latitude,
                                                                longitude: data.longitude,
                                                                latitudeDelta: 0.005,
                                                                longitudeDelta: 0.005,
                                                            }}
                                                            scrollEnabled={false}
                                                            zoomEnabled={false}
                                                        >
                                                            <Marker
                                                                coordinate={{
                                                                    latitude: data.latitude,
                                                                    longitude: data.longitude,
                                                                }}
                                                            />
                                                        </AppMapView>
                                                    </View>
                                                )}
                                            </View>
                                        );
                                    } catch (e) { return null; }
                                })()}
                            </View>
                        )}

                        {notification.action_link && notification.action_link.includes('/pdf') && (
                            <View style={styles.specialContent}>
                                <View style={[styles.infoBox, { backgroundColor: colors.info + '10', borderLeftColor: colors.info }]}>
                                    <View style={styles.infoLine}>
                                        <Ionicons name="document-attach" size={18} color={colors.info} />
                                        <Text style={[styles.infoTitle, { color: colors.info }]}>Attached Workday Report</Text>
                                    </View>
                                    <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                                        A comprehensive PDF summary of this shift's visits, tasks, and durations has been generated.
                                    </Text>
                                </View>
                                
                                <TouchableOpacity 
                                    style={[styles.downloadBtn, { backgroundColor: colors.info }]}
                                    onPress={() => {
                                        const url = getFullImageUrl(notification.action_link);
                                        if (url) {
                                            Linking.openURL(url).catch(err => {
                                                console.error('Failed to open PDF URL:', err);
                                                Alert.alert('Error', 'Could not open the report URL.');
                                            });
                                        }
                                    }}
                                >
                                    <Ionicons name="cloud-download-outline" size={22} color="#fff" />
                                    <Text style={styles.downloadBtnLabel}>Download PDF Summary</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {(notification.type === 'report' || notification.type === 'alert' || (notification.action_link && notification.action_link.includes('before-after'))) && (
                            <View style={styles.specialContent}>
                                <View style={[styles.infoBox, { backgroundColor: colors.danger + '10' }]}>
                                    <View style={styles.infoLine}>
                                        <Ionicons name="warning" size={18} color={colors.danger} />
                                        <Text style={[styles.infoTitle, { color: colors.danger }]}>Visual Evidence Report</Text>
                                    </View>
                                    <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                                        Review the field photos and report details below.
                                    </Text>
                                </View>

                                {relatedReport && (
                                    <>
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
                                                        <Text style={[styles.dataValue, { color: colors.text }]}>{relatedReport.notes || 'No additional notes provided.'}</Text>
                                                    </View>
                                                </View>
                                            </View>
                                        </View>

                                        <View style={styles.imagesGrid}>
                                            <View style={styles.imageCol}>
                                                <Text style={[styles.imageTag, { color: colors.textSecondary }]}>BEFORE</Text>
                                                <TouchableOpacity
                                                    style={styles.imageCardWrapper}
                                                    onPress={() => relatedReport.before_image && setSelectedImage(getFullImageUrl(relatedReport.before_image))}
                                                    activeOpacity={0.8}
                                                >
                                                    <Card style={styles.imageCard}>
                                                        {relatedReport.before_image ? (
                                                            <Image source={{ uri: getFullImageUrl(relatedReport.before_image) || '' }} style={styles.fullImage} resizeMode="cover" />
                                                        ) : (
                                                            <View style={styles.noImage}><Ionicons name="image-outline" size={32} color={colors.border} /></View>
                                                        )}
                                                    </Card>
                                                </TouchableOpacity>
                                            </View>
                                            <View style={styles.imageCol}>
                                                <Text style={[styles.imageTag, { color: colors.textSecondary }]}>AFTER</Text>
                                                <TouchableOpacity
                                                    style={styles.imageCardWrapper}
                                                    onPress={() => relatedReport.after_image && setSelectedImage(getFullImageUrl(relatedReport.after_image))}
                                                    activeOpacity={0.8}
                                                >
                                                    <Card style={styles.imageCard}>
                                                        {relatedReport.after_image ? (
                                                            <Image source={{ uri: getFullImageUrl(relatedReport.after_image) || '' }} style={styles.fullImage} resizeMode="cover" />
                                                        ) : (
                                                            <View style={styles.noImage}><Ionicons name="image-outline" size={32} color={colors.border} /></View>
                                                        )}
                                                    </Card>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </>
                                )}
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
                <View style={styles.actionRow}>
                    <TouchableOpacity
                        style={[styles.smallActionBtn, { borderColor: colors.danger + '40' }]}
                        onPress={() => handleAction('delete')}
                        disabled={processing}
                    >
                        <Ionicons name="trash-outline" size={20} color={colors.danger} />
                        <Text style={[styles.smallActionLabel, { color: colors.danger }]}>Delete</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.smallActionBtn, { borderColor: colors.warning + '40' }]}
                        onPress={() => handleAction('pend')}
                        disabled={processing}
                    >
                        <Ionicons name="hourglass-outline" size={20} color={colors.warning} />
                        <Text style={[styles.smallActionLabel, { color: colors.warning }]}>Pend</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.mainActionBtn, { backgroundColor: colors.success }]}
                        onPress={() => handleAction('approve')}
                        disabled={processing}
                    >
                        {processing ? <ActivityIndicator color="#fff" size="small" /> : (
                            <>
                                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                                <Text style={styles.mainActionLabel}>Approve</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
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
    actionRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
    smallActionBtn: { flex: 1, height: 54, borderRadius: 16, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
    smallActionLabel: { fontSize: 13, fontWeight: '700' },
    mainActionBtn: { flex: 1.5, height: 54, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
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
    imageCardWrapper: { flex: 1 },
    downloadBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 54,
        borderRadius: 16,
        gap: 10,
        marginTop: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2
    },
    downloadBtnLabel: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 0.5
    },
});
