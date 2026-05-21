
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
import { ReportService } from '@/services/report.service';
import { LocationService } from '@/services/location.service';

export default function FacingChangeEvent() {
    const router = useRouter();
    const { theme } = useTheme();
    const colors = getColors(theme);
    const { showToast } = useToast();

    const [formData, setFormData] = useState({
        productName: '',
        facingsCount: '',
        notes: '',
    });
    const [photo, setPhoto] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [gmsId, setGmsId] = useState<number | null>(null);
    const [visitId, setVisitId] = useState<number | null>(null);
    const [workdayId, setWorkdayId] = useState<number | null>(null);

    useEffect(() => {
        const loadSession = async () => {
            const session = await LocationService.getActiveSession();
            if (session.visit) {
                setGmsId(session.visit.gmsId);
                setVisitId(parseInt(session.visit.id));
            }
            if (session.workday) {
                setWorkdayId(parseInt(session.workday.id));
            }
        };
        loadSession();
    }, []);

    const pickImage = async (source: 'camera' | 'library') => {
        try {
            const { status } = source === 'camera'
                ? await ImagePicker.requestCameraPermissionsAsync()
                : await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (status !== 'granted') {
                showToast({ message: 'Permission required to access photos', type: 'error' });
                return;
            }

            const options: ImagePicker.ImagePickerOptions = {
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.5,
                base64: true,
            };

            const result = source === 'camera'
                ? await ImagePicker.launchCameraAsync(options)
                : await ImagePicker.launchImageLibraryAsync(options);

            if (!result.canceled) {
                setPhoto(result.assets[0].uri);
            }
        } catch (error) {
            console.error('[Camera] Error:', error);
            showToast({ message: 'Could not capture photo', type: 'error' });
        }
    };

    const handleSubmit = async () => {
        if (!formData.productName.trim()) {
            showToast({ message: 'Please enter the product name', type: 'warning' });
            return;
        }
        if (!formData.facingsCount.trim()) {
            showToast({ message: 'Please enter the facings count', type: 'warning' });
            return;
        }

        setIsSubmitting(true);
        try {
            const imageUrl = photo ? await SupabaseService.uploadImage(photo, 'facing_changes') : undefined;

            const result = await ReportService.submitEvent({
                name: `Facing Change: ${formData.productName}`,
                notes: `New facings count: ${formData.facingsCount}. ${formData.notes}`,
                type: 'Facing Change',
                gms_id: gmsId || undefined,
                visit_id: visitId || undefined,
                workday_id: workdayId || undefined,
                photo: imageUrl,
            });

            if (result) {
                showToast({ message: 'Facing change reported successfully!', type: 'success' });
                router.back();
            } else {
                showToast({ message: 'Failed to submit report', type: 'error' });
            }
        } catch (error) {
            console.error('Submission error:', error);
            showToast({ message: 'An error occurred during submission', type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <Header
                title="Product Facing"
                subtitle="Report shelf placement"
                showBack
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                    <Card style={styles.formCard}>
                        <View style={styles.inputsContainer}>
                            <Input
                                label="Product Name *"
                                placeholder="Which product was adjusted?"
                                value={formData.productName}
                                onChangeText={(text: string) => setFormData({ ...formData, productName: text })}
                                icon="cube-outline"
                            />

                            <Input
                                label="New Facings Count *"
                                placeholder="e.g., 4"
                                value={formData.facingsCount}
                                onChangeText={(text: string) => setFormData({ ...formData, facingsCount: text })}
                                keyboardType="numeric"
                                icon="grid-outline"
                            />

                            <Input
                                label="Additional Notes"
                                placeholder="Any other details..."
                                value={formData.notes}
                                onChangeText={(text: string) => setFormData({ ...formData, notes: text })}
                                multiline
                                style={{ minHeight: 80, textAlignVertical: 'top' }}
                                icon="reader-outline"
                            />
                        </View>

                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Proof Photo (Optional)</Text>
                        {photo ? (
                            <View style={styles.previewContainer}>
                                <Image source={{ uri: photo }} style={styles.previewImage} />
                                <TouchableOpacity
                                    style={[styles.removeBtn, { backgroundColor: colors.danger }]}
                                    onPress={() => setPhoto(null)}
                                >
                                    <Ionicons name="trash-outline" size={20} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.photoActions}>
                                <TouchableOpacity
                                    style={[styles.photoBtn, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}
                                    onPress={() => pickImage('camera')}
                                >
                                    <Ionicons name="camera" size={28} color={colors.primary} />
                                    <Text style={[styles.photoBtnText, { color: colors.primary }]}>Camera</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.photoBtn, { backgroundColor: colors.secondary + '10', borderColor: colors.secondary + '30' }]}
                                    onPress={() => pickImage('library')}
                                >
                                    <Ionicons name="images" size={28} color={colors.secondary} />
                                    <Text style={[styles.photoBtnText, { color: colors.secondary }]}>Gallery</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        <Button
                            title={isSubmitting ? "Submitting..." : "Submit Report"}
                            onPress={handleSubmit}
                            loading={isSubmitting}
                            disabled={isSubmitting}
                            icon="checkmark-circle"
                            fullWidth
                            size="lg"
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
    scroll: { padding: DesignTokens.spacing.md, paddingBottom: 40 },
    formCard: { padding: DesignTokens.spacing.lg, borderRadius: 20 },
    inputsContainer: { gap: DesignTokens.spacing.md, marginBottom: DesignTokens.spacing.lg },
    sectionTitle: { ...DesignTokens.typography.bodyBold, fontSize: 14, marginLeft: 4, marginBottom: 8 },
    photoActions: { flexDirection: 'row', gap: DesignTokens.spacing.md, marginBottom: DesignTokens.spacing.xl },
    photoBtn: { flex: 1, height: 100, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 8 },
    photoBtnText: { fontSize: 12, fontFamily: Fonts.bodyBold },
    previewContainer: { width: '100%', height: 200, borderRadius: 16, overflow: 'hidden', position: 'relative', marginBottom: DesignTokens.spacing.xl },
    previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    removeBtn: { position: 'absolute', top: 8, right: 8, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84 },
    submitBtn: { marginTop: DesignTokens.spacing.sm },
});
