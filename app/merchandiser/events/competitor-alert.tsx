
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
import { ReportService, EventSubmission } from '@/services/report.service';
import { LocationService } from '@/services/location.service';

const ALERT_TYPES = [
    { id: 'promo', label: 'Promotion', icon: 'gift-outline' as const },
    { id: 'price', label: 'Price Change', icon: 'trending-up-outline' as const },
    { id: 'new', label: 'New Product', icon: 'sparkles-outline' as const },
    { id: 'activity', label: 'Comp. Activity', icon: 'flash-outline' as const }
];

export default function CompetitorAlert() {
    const router = useRouter();
    const { theme } = useTheme();
    const colors = getColors(theme);
    const { showToast } = useToast();

    const [formData, setFormData] = useState({
        brand: '',
        alertType: null as string | null,
        description: '',
        ourPrice: '',
        compPrice: '',
        productName: '',
    });
    const [photo, setPhoto] = useState<string | null>(null);
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
                setPhoto(result.assets[0].uri);
            }
        } catch (error) {
            showToast({ message: 'Could not capture photo', type: 'error' });
        }
    };

    const handleSubmit = async () => {
        if (!formData.brand || !formData.alertType || !formData.description) {
            showToast({ message: 'Please fill all required fields', type: 'warning' });
            return;
        }

        if (formData.alertType === 'Price Change') {
            if (!formData.ourPrice || !formData.compPrice || !formData.productName) {
                showToast({ message: 'Please enter product and price details', type: 'warning' });
                return;
            }
        }

        if (!photo) {
            showToast({ message: 'Please provide an alert photo', type: 'warning' });
            return;
        }

        setIsSubmitting(true);
        try {
            const imageUrl = await SupabaseService.uploadImage(photo, 'competitor_alerts');

            const payload: EventSubmission = {
                name: `Comp. Alert: ${formData.alertType} - ${formData.brand}`,
                notes: formData.alertType === 'Price Change' 
                    ? `Price Alert for ${formData.productName}. Our Price: ${formData.ourPrice} | Comp Price: ${formData.compPrice}. ${formData.description}`
                    : formData.description,
                type: 'competitor-alert',
                gms_id: gmsId || undefined,
                visit_id: visitId || undefined,
                before_image: imageUrl || undefined,
                metadata: {
                    brand: formData.brand,
                    alert_type: formData.alertType,
                    description: formData.description,
                    product_name: formData.productName,
                    our_price: formData.ourPrice,
                    comp_price: formData.compPrice
                }
            };

            const result = await ReportService.submitEvent(payload);

            if (result) {
                showToast({ message: 'Competitor alert sent successfully!', type: 'success' });
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

    const isPriceAlert = formData.alertType === 'Price Change';

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <Header title="Competitor Alert" subtitle="Real-time market insights" showBack />

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                    <Card style={styles.formCard}>
                        <View style={styles.inputsContainer}>
                            <Input
                                label="Brand *"
                                placeholder="Which brand is active?"
                                value={formData.brand}
                                onChangeText={(val) => setFormData({...formData, brand: val})}
                                icon="business-outline"
                            />
                        </View>

                        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 20 }]}>Alert Type *</Text>
                        <View style={styles.alertTypeGrid}>
                            {ALERT_TYPES.map(type => {
                                const isSelected = formData.alertType === type.label;
                                return (
                                    <TouchableOpacity
                                        key={type.id}
                                        style={[
                                            styles.typeItem,
                                            { backgroundColor: isSelected ? colors.primary + '15' : colors.surfaceSecondary,
                                              borderColor: isSelected ? colors.primary : 'transparent' }
                                        ]}
                                        onPress={() => setFormData({...formData, alertType: type.label})}
                                    >
                                        <Ionicons name={type.icon} size={20} color={isSelected ? colors.primary : colors.textSecondary} />
                                        <Text style={[styles.typeLabel, { color: isSelected ? colors.primary : colors.text }]}>
                                            {type.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {isPriceAlert && (
                            <View style={{ marginTop: 24, gap: 12 }}>
                                <Text style={[styles.sectionTitle, { color: colors.text }]}>Price Details *</Text>
                                <Input
                                    label="Product Name"
                                    placeholder="e.g. Coca Cola 1.5L"
                                    value={formData.productName}
                                    onChangeText={(val) => setFormData({...formData, productName: val})}
                                    icon="cube-outline"
                                />
                                <View style={styles.priceRow}>
                                    <View style={{ flex: 1 }}>
                                        <Input
                                            label="Our Price"
                                            placeholder="0.000"
                                            value={formData.ourPrice}
                                            onChangeText={(val) => setFormData({...formData, ourPrice: val})}
                                            keyboardType="numeric"
                                            icon="pricetag-outline"
                                        />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Input
                                            label="Comp. Price"
                                            placeholder="0.000"
                                            value={formData.compPrice}
                                            onChangeText={(val) => setFormData({...formData, compPrice: val})}
                                            keyboardType="numeric"
                                            icon="trending-up-outline"
                                        />
                                    </View>
                                </View>
                            </View>
                        )}

                        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 24 }]}>Details & Description *</Text>
                        <Input
                            placeholder="Describe the competitor's activity..."
                            value={formData.description}
                            onChangeText={(val) => setFormData({...formData, description: val})}
                            multiline
                            style={{ minHeight: 100, textAlignVertical: 'top' }}
                            icon="reader-outline"
                        />

                        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 24 }]}>Alert Photo *</Text>
                        {photo ? (
                            <View style={styles.previewContainer}>
                                <Image source={{ uri: photo }} style={styles.previewImage} />
                                <TouchableOpacity style={[styles.removeBtn, { backgroundColor: colors.danger }]} onPress={() => setPhoto(null)}>
                                    <Ionicons name="trash-outline" size={20} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.photoActions}>
                                <TouchableOpacity style={[styles.photoBtn, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]} onPress={() => pickImage('camera')}>
                                    <Ionicons name="camera" size={28} color={colors.primary} />
                                    <Text style={[styles.photoBtnText, { color: colors.primary }]}>Camera</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.photoBtn, { backgroundColor: colors.secondary + '10', borderColor: colors.secondary + '30' }]} onPress={() => pickImage('library')}>
                                    <Ionicons name="images" size={28} color={colors.secondary} />
                                    <Text style={[styles.photoBtnText, { color: colors.secondary }]}>Gallery</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        <Button
                            title={isSubmitting ? "Sending Alert..." : "Submit Alert"}
                            onPress={handleSubmit}
                            loading={isSubmitting}
                            disabled={isSubmitting}
                            icon="megaphone-outline"
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
    inputsContainer: { gap: 12 },
    sectionTitle: { ...DesignTokens.typography.bodyBold, fontSize: 13, marginLeft: 4, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
    alertTypeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    typeItem: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: '45%' },
    typeLabel: { fontSize: 12, fontFamily: Fonts.bodySemiBold },
    priceRow: { flexDirection: 'row', gap: 12 },
    photoActions: { flexDirection: 'row', gap: DesignTokens.spacing.md },
    photoBtn: { flex: 1, height: 100, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 8 },
    photoBtnText: { fontSize: 12, fontFamily: Fonts.bodyBold },
    previewContainer: { width: '100%', height: 200, borderRadius: 16, overflow: 'hidden', position: 'relative' },
    previewImage: { width: '100%', height: '100%' },
    removeBtn: { position: 'absolute', top: 8, right: 8, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    submitBtn: { marginTop: 32 },
});
