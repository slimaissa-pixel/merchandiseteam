
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
    Animated,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Header } from '@/components/ui/Header';
import { Input } from '@/components/ui/Input';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { DesignTokens, getColors } from '@/constants/designSystem';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { Fonts } from '@/hooks/useFonts';
import { ReportService } from '@/services/report.service';
import { SupabaseService } from '@/services/supabase.service';
import { EventService } from '@/services/event.service';

export default function ProductCompetitorEvent() {
    const router = useRouter();
    const { theme } = useTheme();
    const colors = getColors(theme);
    const { showToast } = useToast();

    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        ourProduct: '',
        competitorProduct: '',
        ourPrice: '',
        competitorPrice: '',
        notes: '',
    });
    const [photo, setPhoto] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fadeAnim = useRef(new Animated.Value(1)).current;

    const transitionTo = (nextStep: number) => {
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
        }).start(() => {
            setStep(nextStep);
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }).start();
        });
    };

    const pickImage = async (source: 'camera' | 'library') => {
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
            quality: 0.7,
        };

        const result = source === 'camera'
            ? await ImagePicker.launchCameraAsync(options)
            : await ImagePicker.launchImageLibraryAsync(options);

        if (!result.canceled) {
            setPhoto(result.assets[0].uri);
        }
    };

    const handleSubmit = async () => {
        if (!formData.ourProduct.trim() || !formData.competitorProduct.trim()) {
            showToast({ message: 'Both product names are required', type: 'warning' });
            return;
        }

        setIsSubmitting(true);
        try {
            let photoUrl = undefined;
            if (photo) {
                photoUrl = await SupabaseService.uploadImage(photo, 'events');
            }
            
            const result = await EventService.create({
                type: 'product_comparison',
                payload: {
                    original_data: { 
                name: `${formData.ourProduct} vs ${formData.competitorProduct}`,
                notes: `Our Price: ${formData.ourPrice}\nCompetitor Price: ${formData.competitorPrice}\nNotes: ${formData.notes}`,
                // type: 'Product Comparison',
                // status: 'pending',
                before_image: photoUrl || undefined,
                visits_planned: 0,
                visits_completed: 0,
             },
                    photo_url: photoUrl
                }
            });

            if (result) {
                showToast({ message: 'Comparison reported successfully!', type: 'success' });
                router.replace('/merchandiser/dashboard');
            } else {
                showToast({ message: 'Submission failed', type: 'error' });
            }
        } catch (error) {
            showToast({ message: 'An error occurred', type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderStep1 = () => (
        <Card style={styles.formCard}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>Step 1: Comparison Target</Text>

            <View style={styles.inputGap}>
                <Input
                    label="Our Product *"
                    placeholder="Enter our product name"
                    value={formData.ourProduct}
                    onChangeText={(text) => setFormData({ ...formData, ourProduct: text })}
                    icon="checkmark-circle-outline"
                />

                <Input
                    label="Competitor Product *"
                    placeholder="Enter competitor product name"
                    value={formData.competitorProduct}
                    onChangeText={(text) => setFormData({ ...formData, competitorProduct: text })}
                    icon="close-circle-outline"
                />
            </View>

            <Button
                title="Next Step"
                onPress={() => transitionTo(2)}
                disabled={!formData.ourProduct.trim() || !formData.competitorProduct.trim()}
                fullWidth
                style={styles.nextBtn}
                icon="arrow-forward"
                iconPosition="right"
            />
        </Card>
    );

    const renderStep2 = () => (
        <Card style={styles.formCard}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>Step 2: Price Comparison</Text>

            <View style={styles.inputGap}>
                <View style={styles.row}>
                    <Input
                        label="Our Price"
                        placeholder="$0.00"
                        value={formData.ourPrice}
                        onChangeText={(text) => setFormData({ ...formData, ourPrice: text })}
                        keyboardType="decimal-pad"
                        containerStyle={{ flex: 1 }}
                        icon="pricetag-outline"
                    />
                    <Input
                        label="Comp. Price"
                        placeholder="$0.00"
                        value={formData.competitorPrice}
                        onChangeText={(text) => setFormData({ ...formData, competitorPrice: text })}
                        keyboardType="decimal-pad"
                        containerStyle={{ flex: 1 }}
                        icon="pricetags-outline"
                    />
                </View>

                <Text style={[styles.label, { color: colors.text }]}>Comparison Photo (Optional)</Text>
                {photo ? (
                    <View style={styles.previewContainer}>
                        <Image source={{ uri: photo }} style={styles.previewImage} />
                        <Button
                            title="Remove"
                            variant="ghost"
                            onPress={() => setPhoto(null)}
                            style={styles.removeBtn}
                            icon="trash"
                        />
                    </View>
                ) : (
                    <View style={styles.photoActions}>
                        <Card onPress={() => pickImage('camera')} style={styles.photoCard} elevation="md">
                            <Ionicons name="camera" size={32} color={colors.primary} />
                            <Text style={[styles.photoLabel, { color: colors.text }]}>Camera</Text>
                        </Card>
                        <Card onPress={() => pickImage('library')} style={styles.photoCard} elevation="md">
                            <Ionicons name="images" size={32} color={colors.primary} />
                            <Text style={[styles.photoLabel, { color: colors.text }]}>Gallery</Text>
                        </Card>
                    </View>
                )}
            </View>

            <View style={styles.footerBtns}>
                <Button title="Back" variant="outline" onPress={() => transitionTo(1)} style={{ flex: 1 }} />
                <Button
                    title="Next Step"
                    onPress={() => transitionTo(3)}
                    style={{ flex: 1 }}
                    icon="arrow-forward"
                    iconPosition="right"
                />
            </View>
        </Card>
    );

    const renderStep3 = () => (
        <Card style={styles.formCard}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>Step 3: Notes</Text>

            <View style={styles.inputGap}>
                <Input
                    label="Additional Notes"
                    placeholder="Shelf visibility, proximity, etc."
                    value={formData.notes}
                    onChangeText={(text) => setFormData({ ...formData, notes: text })}
                    multiline
                    style={{ minHeight: 120, textAlignVertical: 'top' }}
                    icon="reader-outline"
                />
            </View>

            <View style={styles.footerBtns}>
                <Button title="Back" variant="outline" onPress={() => transitionTo(2)} style={{ flex: 1 }} />
                <Button
                    title="Submit"
                    onPress={handleSubmit}
                    loading={isSubmitting}
                    style={{ flex: 1 }}
                    icon="checkmark-circle"
                />
            </View>
        </Card>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <Header title="Comparison" subtitle="Market competition analysis" showBack />

            <ProgressBar progress={step / 3} label={`Step ${step} of 3`} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                    <Animated.View style={{ opacity: fadeAnim }}>
                        {step === 1 && renderStep1()}
                        {step === 2 && renderStep2()}
                        {step === 3 && renderStep3()}
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { padding: DesignTokens.spacing.lg, paddingBottom: 120 },
    stepContainer: { gap: DesignTokens.spacing.lg },
    formCard: {
        padding: DesignTokens.spacing.xl,
        gap: DesignTokens.spacing.lg,
        borderRadius: DesignTokens.borderRadius.xl,
    },
    inputGap: {
        gap: DesignTokens.spacing.md,
    },
    stepTitle: {
        ...DesignTokens.typography.h3,
        marginBottom: DesignTokens.spacing.xs,
    },
    row: { flexDirection: 'row', gap: DesignTokens.spacing.md },
    label: {
        ...DesignTokens.typography.bodyBold,
        marginTop: DesignTokens.spacing.sm,
    },
    photoActions: {
        flexDirection: 'row',
        gap: DesignTokens.spacing.lg,
        paddingVertical: 8,
    },
    photoCard: {
        flex: 1,
        height: 140,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        borderRadius: DesignTokens.borderRadius.xl,
    },
    photoLabel: {
        ...DesignTokens.typography.bodyBold,
        fontFamily: Fonts.bodyBold,
        fontSize: 14,
    },
    previewContainer: { width: '100%', aspectRatio: 4 / 3, borderRadius: DesignTokens.borderRadius.lg, overflow: 'hidden' },
    previewImage: { width: '100%', height: '100%' },
    removeBtn: { position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 8 },
    footerBtns: { flexDirection: 'row', gap: DesignTokens.spacing.md, marginTop: DesignTokens.spacing.xl },
    nextBtn: { marginTop: DesignTokens.spacing.xl },
});
