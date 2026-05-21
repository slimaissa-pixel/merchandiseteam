
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Image,
    KeyboardAvoidingView,
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
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { Fonts } from '@/hooks/useFonts';
import { SupabaseService } from '@/services/supabase.service';
import { ReportService, ReportSubmission } from '@/services/report.service';
import { LocationService } from '@/services/location.service';

const CATEGORIES = [
    { id: 'empty', label: 'Empty Shelf', icon: 'square-outline' as const },
    { id: 'damaged', label: 'Damaged Product', icon: 'close-circle-outline' as const },
    { id: 'wrong', label: 'Wrong Placement', icon: 'swap-horizontal-outline' as const },
    { id: 'price', label: 'Missing Price Label', icon: 'pricetag-outline' as const },
    { id: 'hygiene', label: 'Hygiene Issue', icon: 'water-outline' as const },
    { id: 'competitor', label: 'Competitor in Our Area', icon: 'people-outline' as const },
    { id: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline' as const }
];

const SEVERITIES = [
    { id: 'low', label: 'Low', color: '#10B981' },
    { id: 'medium', label: 'Medium', color: '#F59E0B' },
    { id: 'high', label: 'High', color: '#EF4444' },
    { id: 'critical', label: 'Critical', color: '#7F1D1D' }
];

export default function ReportAnomaly() {
    const router = useRouter();
    const { theme } = useTheme();
    const colors = getColors(theme);
    const { showToast } = useToast();

    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedSeverity, setSelectedSeverity] = useState<string>('medium');
    const [photos, setPhotos] = useState<string[]>([]);
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [gmsId, setGmsId] = useState<number | null>(null);
    const [visitId, setVisitId] = useState<number | null>(null);

    useEffect(() => {
        const loadSession = async () => {
            const session = await LocationService.getActiveSession();
            if (session.visit) {
                setGmsId(session.visit.gmsId);
                setVisitId(parseInt(session.visit.id));
            }
        };
        loadSession();
    }, []);

    const pickImage = async (source: 'camera' | 'library') => {
        if (photos.length >= 3) {
            showToast({ message: 'Maximum 3 photos allowed', type: 'warning' });
            return;
        }

        try {
            const { status } = source === 'camera'
                ? await ImagePicker.requestCameraPermissionsAsync()
                : await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (status !== 'granted') {
                showToast({ message: 'Permission required', type: 'error' });
                return;
            }

            const options: ImagePicker.ImagePickerOptions = {
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.5,
            };

            const result = source === 'camera'
                ? await ImagePicker.launchCameraAsync(options)
                : await ImagePicker.launchImageLibraryAsync(options);

            if (!result.canceled) {
                setPhotos(prev => [...prev, result.assets[0].uri]);
            }
        } catch (error) {
            showToast({ message: 'Could not capture photo', type: 'error' });
        }
    };

    const removePhoto = (index: number) => {
        setPhotos(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!selectedCategory) {
            showToast({ message: 'Please select a category', type: 'warning' });
            return;
        }
        if (photos.length === 0) {
            showToast({ message: 'Please provide at least one photo', type: 'warning' });
            return;
        }
        if (!description.trim()) {
            showToast({ message: 'Please provide a description', type: 'warning' });
            return;
        }

        setIsSubmitting(true);
        try {
            const category = selectedCategory!;
            // Upload all photos
            const uploadPromises = photos.map(uri => SupabaseService.uploadImage(uri, 'anomalies'));
            const imageUrls = await Promise.all(uploadPromises);

            const payload: ReportSubmission = {
                name: `[${selectedSeverity.toUpperCase()}] ${category}`,
                notes: description,
                photo: imageUrls[0], // Primary photo
                before_image: imageUrls[1], // Secondary
                after_image: imageUrls[2], // Tertiary
                gms_id: gmsId || undefined,
                visit_id: visitId || undefined,
            };

            const result = await ReportService.submitAnomaly(payload);

            if (result) {
                showToast({ message: 'Anomaly reported and admin alerted!', type: 'success' });
                router.back();
            } else {
                showToast({ message: 'Failed to submit report', type: 'error' });
            }
        } catch (error) {
            showToast({ message: 'An error occurred during submission', type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <Header title="Report Anomaly" subtitle="Identify field issues" showBack />

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                    <Card style={styles.formCard}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>What is the issue? *</Text>
                        <View style={styles.categoryGrid}>
                            {CATEGORIES.map(cat => {
                                const isSelected = selectedCategory === cat.label;
                                return (
                                    <TouchableOpacity
                                        key={cat.id}
                                        style={[
                                            styles.categoryItem,
                                            { backgroundColor: isSelected ? colors.primary + '15' : colors.surfaceSecondary,
                                              borderColor: isSelected ? colors.primary : 'transparent' }
                                        ]}
                                        onPress={() => setSelectedCategory(cat.label)}
                                    >
                                        <Ionicons name={cat.icon} size={20} color={isSelected ? colors.primary : colors.textSecondary} />
                                        <Text style={[styles.categoryLabel, { color: isSelected ? colors.primary : colors.text }]}>
                                            {cat.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 24 }]}>Severity Level *</Text>
                        <View style={styles.severityRow}>
                            {SEVERITIES.map(sev => {
                                const isSelected = selectedSeverity === sev.id;
                                return (
                                    <TouchableOpacity
                                        key={sev.id}
                                        style={[
                                            styles.severityChip,
                                            { borderColor: isSelected ? sev.color : 'transparent',
                                              backgroundColor: isSelected ? sev.color + '15' : colors.surfaceSecondary }
                                        ]}
                                        onPress={() => setSelectedSeverity(sev.id)}
                                    >
                                        <View style={[styles.severityDot, { backgroundColor: sev.color }]} />
                                        <Text style={[styles.severityLabel, { color: isSelected ? sev.color : colors.textSecondary }]}>
                                            {sev.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 24 }]}>Description & Notes *</Text>
                        <Input
                            placeholder="Provide details about the issue..."
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            style={{ minHeight: 100, textAlignVertical: 'top' }}
                            icon="reader-outline"
                        />

                        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 24 }]}>Evidence Photos ({photos.length}/3) *</Text>
                        <View style={styles.photoGrid}>
                            {photos.map((uri, index) => (
                                <View key={index} style={styles.photoPreviewWrapper}>
                                    <Image source={{ uri }} style={styles.photoPreview} />
                                    <TouchableOpacity style={[styles.removePhotoBtn, { backgroundColor: colors.danger }]} onPress={() => removePhoto(index)}>
                                        <Ionicons name="close" size={16} color="#fff" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                            {photos.length < 3 && (
                                <TouchableOpacity 
                                    style={[styles.addPhotoBtn, { backgroundColor: colors.surfaceSecondary, borderStyle: 'dashed', borderColor: colors.border }]} 
                                    onPress={() => pickImage('camera')}
                                >
                                    <Ionicons name="camera" size={32} color={colors.textSecondary} />
                                    <Text style={[styles.addPhotoText, { color: colors.textSecondary }]}>Add Photo</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        <Button
                            title={isSubmitting ? "Reporting Issue..." : "Submit Anomaly"}
                            onPress={handleSubmit}
                            loading={isSubmitting}
                            disabled={isSubmitting || !selectedCategory || photos.length === 0 || !description.trim()}
                            icon="alert-circle"
                            fullWidth
                            size="lg"
                            style={[
                                styles.submitBtn,
                                (!selectedCategory || photos.length === 0 || !description.trim()) && { opacity: 0.5 }
                            ]}
                        />
                    </Card>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { padding: DesignTokens.spacing.md, paddingBottom: 40 },
    formCard: { padding: DesignTokens.spacing.lg, borderRadius: 20 },
    sectionTitle: { ...DesignTokens.typography.bodyBold, fontSize: 13, marginLeft: 4, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
    categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    categoryItem: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: '45%' },
    categoryLabel: { fontSize: 12, fontFamily: Fonts.bodySemiBold },
    severityRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    severityChip: { flex: 1, minWidth: '22%', height: 40, borderRadius: 20, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
    severityDot: { width: 8, height: 8, borderRadius: 4 },
    severityLabel: { fontSize: 11, fontWeight: '700' },
    photoGrid: { flexDirection: 'row', gap: 12, flexWrap: 'wrap', marginTop: 8 },
    photoPreviewWrapper: { width: 100, height: 100, borderRadius: 12, overflow: 'hidden', position: 'relative' },
    photoPreview: { width: '100%', height: '100%' },
    removePhotoBtn: { position: 'absolute', top: 4, right: 4, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    addPhotoBtn: { width: 100, height: 100, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
    addPhotoText: { fontSize: 10, fontWeight: '700' },
    submitBtn: { marginTop: 32 },
});
