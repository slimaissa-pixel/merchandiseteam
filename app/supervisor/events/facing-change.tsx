
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

export default function FacingChangeEvent() {
    const router = useRouter();
    const { theme } = useTheme();
    const colors = getColors(theme);
    const { showToast } = useToast();

    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        productName: '',
        oldPosition: '',
        newPosition: '',
        reason: '',
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
        if (!formData.productName.trim()) {
            showToast({ message: 'Product name is required', type: 'warning' });
            return;
        }

        setIsSubmitting(true);
        try {
            let photoUrl = undefined;
            if (photo) {
                photoUrl = await SupabaseService.uploadImage(photo, 'events');
            }
            
            const result = await EventService.create({
                type: 'facing_change',
                payload: {
                    original_data: { 
                name: formData.productName,
                notes: `Old: ${formData.oldPosition}\nNew: ${formData.newPosition}\nReason: ${formData.reason}`,
                // type: 'Facing Change',
                // status: 'pending',
                before_image: photoUrl || undefined,
                visits_planned: 0,
                visits_completed: 0,
             },
                    photo_url: photoUrl
                }
            });

            if (result) {
                showToast({ message: 'Facing change reported!', type: 'success' });
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
            <Text style={[styles.stepTitle, { color: colors.text }]}>Product & Positions</Text>

            <View style={styles.inputGap}>
                <Input
                    label="Product Name *"
                    placeholder="Enter product name"
                    value={formData.productName}
                    onChangeText={(text) => setFormData({ ...formData, productName: text })}
                    icon="cube-outline"
                />

                <View style={styles.row}>
                    <Input
                        label="Old Position"
                        placeholder="Aisle 1"
                        value={formData.oldPosition}
                        onChangeText={(text) => setFormData({ ...formData, oldPosition: text })}
                        containerStyle={{ flex: 1 }}
                        icon="exit-outline"
                    />
                    <Input
                        label="New Position"
                        placeholder="Aisle 3"
                        value={formData.newPosition}
                        onChangeText={(text) => setFormData({ ...formData, newPosition: text })}
                        containerStyle={{ flex: 1 }}
                        icon="enter-outline"
                    />
                </View>
            </View>

            <Button
                title="Next Step"
                onPress={() => transitionTo(2)}
                disabled={!formData.productName.trim()}
                fullWidth
                style={styles.nextBtn}
                icon="arrow-forward"
                iconPosition="right"
            />
        </Card>
    );

    const renderStep2 = () => (
        <Card style={styles.formCard}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>Reason & Photo</Text>

            <View style={styles.inputGap}>
                <Input
                    label="Reason for Change"
                    placeholder="e.g., Seasonal promotion"
                    value={formData.reason}
                    onChangeText={(text) => setFormData({ ...formData, reason: text })}
                    icon="help-circle-outline"
                />

                <Text style={[styles.label, { color: colors.text }]}>Placement Photo (Optional)</Text>
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
            <Header title="Facing Change" subtitle="Report placement changes" showBack />

            <ProgressBar progress={step / 2} label={`Step ${step} of 2`} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                    <Animated.View style={{ opacity: fadeAnim }}>
                        {step === 1 && renderStep1()}
                        {step === 2 && renderStep2()}
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
