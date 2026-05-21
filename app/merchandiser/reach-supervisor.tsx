import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Linking,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Header } from '@/components/ui/Header';
import { Input } from '@/components/ui/Input';
import { DesignTokens, getColors } from '@/constants/designSystem';
import { getFullImageUrl } from '@/constants/api';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { Fonts } from '@/hooks/useFonts';
import { SupabaseService } from '@/services/supabase.service';
import { ReportService, EventSubmission } from '@/services/report.service';
import { LocationService } from '@/services/location.service';
import { UserService } from '@/services/user.service';
import { NotificationService } from '@/services/notification.service';
import { User } from '@/types/auth';
import { GMSService, GMS } from '@/services/gms.service';

const ASSISTANCE_SUBJECTS = [
    { id: 'gps_issue', label: 'GPS Issue', icon: 'navigate-outline' as const },
    { id: 'store_access', label: 'Store Access Issue', icon: 'key-outline' as const },
    { id: 'product_issue', label: 'Product Issue', icon: 'cube-outline' as const },
    { id: 'conflict', label: 'Conflict/Problem', icon: 'warning-outline' as const },
    { id: 'other', label: 'Other', icon: 'help-circle-outline' as const },
];

export default function ReachSupervisorPage() {
    const router = useRouter();
    const { theme } = useTheme();
    const colors = getColors(theme);
    const { showToast } = useToast();

    const [supervisor, setSupervisor] = useState<User | null>(null);
    const [loadingData, setLoadingData] = useState(true);
    const [activeStore, setActiveStore] = useState<GMS | null>(null);
    const [visitStatus, setVisitStatus] = useState<string>('Offline');

    const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
    const [message, setMessage] = useState('');
    const [photo, setPhoto] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoadingData(true);
        try {
            // 1. Load Supervisor (Assuming backend restricts to assigned supervisor)
            const users = await UserService.getAll();
            if (users && users.length > 0) {
                // The backend API is modified to return only the assigned supervisor
                setSupervisor(users[0]);
            }

            // 2. Load Visit Context
            const session = await LocationService.getActiveSession();
            if (session.workday) {
                setVisitStatus(session.visit ? 'In Store' : 'In Transit');
            } else {
                setVisitStatus('Not Started');
            }

            if (session.visit) {
                const store = await GMSService.getById(session.visit.gmsId);
                setActiveStore(store || null);
            }
        } catch (error) {
            console.error('Error loading reach supervisor data:', error);
        } finally {
            setLoadingData(false);
        }
    };

    const handleCall = () => {
        if (supervisor?.phone) Linking.openURL(`tel:${supervisor.phone}`);
        else showToast({ message: 'No phone number available', type: 'error' });
    };

    const handleMessage = () => {
        if (supervisor?.phone) Linking.openURL(`sms:${supervisor.phone}`);
        else showToast({ message: 'No phone number available', type: 'error' });
    };

    const handleShareLocation = async () => {
        const loc = await LocationService.getCurrentLocation();
        if (loc && supervisor?.phone) {
            const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${loc.latitude},${loc.longitude}`;
            const msg = `I need assistance. My current location is: ${mapsUrl}`;
            Linking.openURL(`sms:${supervisor.phone}?body=${encodeURIComponent(msg)}`);
        } else {
            showToast({ message: 'Could not get location or phone number', type: 'error' });
        }
    };

    const pickImage = async () => {
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                showToast({ message: 'Camera permission required', type: 'error' });
                return;
            }
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.5,
            });
            if (!result.canceled) {
                setPhoto(result.assets[0].uri);
            }
        } catch (error) {
            showToast({ message: 'Could not capture photo', type: 'error' });
        }
    };

    const submitAssistanceRequest = async () => {
        if (!selectedSubject) {
            showToast({ message: 'Please select an issue type', type: 'warning' });
            return;
        }
        if (!message.trim()) {
            showToast({ message: 'Please provide a message', type: 'warning' });
            return;
        }

        setIsSubmitting(true);
        try {
            let uploadedPhotoUrl = undefined;
            if (photo) {
                uploadedPhotoUrl = await SupabaseService.uploadImage(photo, 'support_requests');
            }

            const subjectLabel = ASSISTANCE_SUBJECTS.find(s => s.id === selectedSubject)?.label || 'Assistance Needed';
            const fullTitle = `[ASSISTANCE] ${subjectLabel}`;

            const session = await LocationService.getActiveSession();

            // Save report
            const payload: EventSubmission = {
                name: fullTitle,
                notes: message,
                type: 'assistance_request',
                photo: uploadedPhotoUrl || undefined,
                gms_id: session.visit?.gmsId,
                visit_id: session.visit ? parseInt(session.visit.id) : undefined,
                workday_id: session.workday ? parseInt(session.workday.id) : undefined,
            };

            await ReportService.submitEvent(payload);

            // Send Real-time notification to supervisor
            if (supervisor) {
                await NotificationService.sendNotification({
                    user_id: parseInt(supervisor.id),
                    title: 'Urgent: Assistance Required',
                    message: `${subjectLabel}: ${message}`,
                    type: 'alert',
                });
            }

            showToast({ message: 'Request sent to your supervisor!', type: 'success' });
            router.back();
        } catch (error) {
            showToast({ message: 'Failed to send request', type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loadingData) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <Header title="Reach Supervisor" showBack />
                <View style={styles.centerContent}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <Header title="Reach Supervisor" showBack />

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    
                    {/* Supervisor Info Card */}
                    {supervisor ? (
                        <Card style={styles.supervisorCard}>
                            <View style={styles.supervisorHeader}>
                                {supervisor.profileImage ? (
                                    <Image source={{ uri: getFullImageUrl(supervisor.profileImage) }} style={styles.avatar} />
                                ) : (
                                    <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                                        <Text style={styles.avatarInitials}>
                                            {supervisor.firstName?.charAt(0)}{supervisor.lastName?.charAt(0)}
                                        </Text>
                                    </View>
                                )}
                                <View style={styles.supervisorInfo}>
                                    <Text style={[styles.supervisorName, { color: colors.text }]}>
                                        {supervisor.firstName} {supervisor.lastName}
                                    </Text>
                                    <Text style={[styles.supervisorRole, { color: colors.textSecondary }]}>Regional Supervisor</Text>
                                    <View style={styles.statusBadge}>
                                        <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
                                        <Text style={[styles.statusText, { color: colors.success }]}>Online</Text>
                                    </View>
                                </View>
                            </View>

                            <View style={[styles.quickActionsRow, { borderTopColor: colors.border }]}>
                                <TouchableOpacity style={styles.actionBtn} onPress={handleCall}>
                                    <View style={[styles.iconWrapper, { backgroundColor: colors.primary + '15' }]}>
                                        <Ionicons name="call" size={20} color={colors.primary} />
                                    </View>
                                    <Text style={[styles.actionLabel, { color: colors.textSecondary }]}>Call</Text>
                                </TouchableOpacity>
                                
                                <TouchableOpacity style={styles.actionBtn} onPress={handleMessage}>
                                    <View style={[styles.iconWrapper, { backgroundColor: colors.secondary + '15' }]}>
                                        <Ionicons name="chatbubble" size={20} color={colors.secondary} />
                                    </View>
                                    <Text style={[styles.actionLabel, { color: colors.textSecondary }]}>Message</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.actionBtn} onPress={handleShareLocation}>
                                    <View style={[styles.iconWrapper, { backgroundColor: colors.warning + '15' }]}>
                                        <Ionicons name="location" size={20} color={colors.warning} />
                                    </View>
                                    <Text style={[styles.actionLabel, { color: colors.textSecondary }]}>Share GPS</Text>
                                </TouchableOpacity>
                            </View>
                        </Card>
                    ) : (
                        <Card style={[styles.supervisorCard, { alignItems: 'center', paddingVertical: 32 }]}>
                            <Ionicons name="person-circle-outline" size={48} color={colors.textSecondary} />
                            <Text style={{ color: colors.textSecondary, marginTop: 12, fontFamily: Fonts.body }}>No supervisor assigned</Text>
                        </Card>
                    )}

                    {/* Visit Context */}
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>CURRENT CONTEXT</Text>
                    <Card style={styles.contextCard}>
                        <View style={styles.contextRow}>
                            <MaterialIcons name="storefront" size={24} color={colors.primary} />
                            <View style={styles.contextInfo}>
                                <Text style={[styles.contextLabel, { color: colors.textSecondary }]}>Current Store</Text>
                                <Text style={[styles.contextValue, { color: colors.text }]}>
                                    {activeStore ? activeStore.name : 'Not in store'}
                                </Text>
                            </View>
                        </View>
                        <View style={[styles.divider, { backgroundColor: colors.border }]} />
                        <View style={styles.contextRow}>
                            <Ionicons name="pulse" size={24} color={colors.success} />
                            <View style={styles.contextInfo}>
                                <Text style={[styles.contextLabel, { color: colors.textSecondary }]}>Task Status</Text>
                                <Text style={[styles.contextValue, { color: colors.text }]}>{visitStatus}</Text>
                            </View>
                        </View>
                    </Card>

                    {/* Quick Assistance Form */}
                    <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 12 }]}>REQUEST ASSISTANCE</Text>
                    <Card style={styles.formCard}>
                        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Issue Type *</Text>
                        <View style={styles.subjectGrid}>
                            {ASSISTANCE_SUBJECTS.map(sub => {
                                const isSelected = selectedSubject === sub.id;
                                return (
                                    <TouchableOpacity
                                        key={sub.id}
                                        style={[
                                            styles.subjectChip,
                                            {
                                                backgroundColor: isSelected ? colors.primary + '15' : colors.surfaceSecondary,
                                                borderColor: isSelected ? colors.primary : 'transparent'
                                            }
                                        ]}
                                        onPress={() => setSelectedSubject(sub.id)}
                                    >
                                        <Ionicons name={sub.icon} size={16} color={isSelected ? colors.primary : colors.textSecondary} />
                                        <Text style={[styles.subjectText, { color: isSelected ? colors.primary : colors.text }]}>{sub.label}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 16 }]}>Message *</Text>
                        <Input
                            placeholder="Describe the issue you're facing..."
                            value={message}
                            onChangeText={setMessage}
                            multiline
                            style={{ minHeight: 80, textAlignVertical: 'top' }}
                        />

                        <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 16 }]}>Photo Attachment (Optional)</Text>
                        {photo ? (
                            <View style={styles.photoPreviewWrapper}>
                                <Image source={{ uri: photo! }} style={styles.photoPreview} />
                                <TouchableOpacity style={[styles.removePhotoBtn, { backgroundColor: colors.danger }]} onPress={() => setPhoto(null)}>
                                    <Ionicons name="close" size={16} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity 
                                style={[styles.addPhotoBtn, { borderColor: colors.border, backgroundColor: colors.surfaceSecondary }]} 
                                onPress={pickImage}
                            >
                                <Ionicons name="camera-outline" size={24} color={colors.textSecondary} />
                                <Text style={[styles.addPhotoText, { color: colors.textSecondary }]}>Capture Photo</Text>
                            </TouchableOpacity>
                        )}

                        <Button
                            title="Send Request"
                            onPress={submitAssistanceRequest}
                            loading={isSubmitting}
                            disabled={isSubmitting || !selectedSubject || !message.trim()}
                            icon="paper-plane"
                            fullWidth
                            style={styles.submitBtn}
                        />
                    </Card>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { padding: DesignTokens.spacing.md, paddingBottom: 60, gap: 16 },
    
    supervisorCard: { padding: 0, borderRadius: 20, overflow: 'hidden' },
    supervisorHeader: { flexDirection: 'row', padding: 20, alignItems: 'center', gap: 16 },
    avatar: { width: 64, height: 64, borderRadius: 32 },
    avatarPlaceholder: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
    avatarInitials: { color: '#fff', fontSize: 24, fontFamily: Fonts.headingBold },
    supervisorInfo: { flex: 1 },
    supervisorName: { fontSize: 18, fontFamily: Fonts.headingBold, marginBottom: 2 },
    supervisorRole: { fontSize: 13, fontFamily: Fonts.body, marginBottom: 8 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    statusText: { fontSize: 12, fontWeight: '700' },
    
    quickActionsRow: { flexDirection: 'row', borderTopWidth: 1, paddingVertical: 12 },
    actionBtn: { flex: 1, alignItems: 'center', gap: 6 },
    iconWrapper: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    actionLabel: { fontSize: 12, fontFamily: Fonts.bodySemiBold },

    sectionTitle: { fontSize: 12, fontFamily: Fonts.headingBold, marginLeft: 8, letterSpacing: 1 },
    
    contextCard: { padding: 0, borderRadius: 16 },
    contextRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 16 },
    contextInfo: { flex: 1 },
    contextLabel: { fontSize: 11, fontFamily: Fonts.bodyBold, textTransform: 'uppercase', marginBottom: 2 },
    contextValue: { fontSize: 15, fontFamily: Fonts.bodySemiBold },
    divider: { height: 1 },

    formCard: { padding: 16, borderRadius: 16 },
    inputLabel: { fontSize: 13, fontFamily: Fonts.bodyBold, marginBottom: 8 },
    subjectGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    subjectChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, gap: 6 },
    subjectText: { fontSize: 13, fontFamily: Fonts.bodySemiBold },
    
    addPhotoBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', gap: 8 },
    addPhotoText: { fontSize: 14, fontFamily: Fonts.bodySemiBold },
    photoPreviewWrapper: { width: 120, height: 120, borderRadius: 12, overflow: 'hidden' },
    photoPreview: { width: '100%', height: '100%' },
    removePhotoBtn: { position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    
    submitBtn: { marginTop: 24 },
});
