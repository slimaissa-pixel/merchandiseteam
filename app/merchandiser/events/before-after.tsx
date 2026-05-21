import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
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
import { Article, ArticleService } from '@/services/article.service';
import { SupabaseService } from '@/services/supabase.service';
import { ReportService } from '@/services/report.service';
import { LocationService } from '@/services/location.service';

export default function BeforeAfterEvent() {
    const router = useRouter();
    const { theme } = useTheme();
    const colors = getColors(theme);
    const { showToast } = useToast();

    const [loading, setLoading] = useState(true);
    const [articles, setArticles] = useState<Article[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedArticles, setSelectedArticles] = useState<Article[]>([]);

    const [formData, setFormData] = useState({
        description: '',
    });
    const [beforePhoto, setBeforePhoto] = useState<string | null>(null);
    const [afterPhoto, setAfterPhoto] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [gmsId, setGmsId] = useState<number | null>(null);
    const [visitId, setVisitId] = useState<number | null>(null);
    const [workdayId, setWorkdayId] = useState<number | null>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const session = await LocationService.getActiveSession();
                if (session.visit) {
                    setGmsId(session.visit.gmsId);
                    setVisitId(parseInt(session.visit.id));
                    
                    const data = await ArticleService.getAll(session.visit.gmsId);
                    setArticles(data);
                }
                if (session.workday) {
                    setWorkdayId(parseInt(session.workday.id));
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const pickImage = async (type: 'before' | 'after', source: 'camera' | 'library') => {
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
                const asset = result.assets[0];
                if (type === 'before') {
                    setBeforePhoto(asset.uri);
                } else {
                    setAfterPhoto(asset.uri);
                }
            }
        } catch (error) {
            console.error('[Camera] Error:', error);
            showToast({ message: 'Could not capture photo', type: 'error' });
        }
    };

    const handleSubmit = async () => {
        if (selectedArticles.length === 0) {
            showToast({ message: 'Please select at least one product', type: 'warning' });
            return;
        }
        if (!formData.description.trim()) {
            showToast({ message: 'Please enter a description', type: 'warning' });
            return;
        }
        if (!beforePhoto || !afterPhoto) {
            showToast({ message: 'Please provide both before and after photos', type: 'warning' });
            return;
        }

        setIsSubmitting(true);
        try {
            // Upload images
            const beforeUrl = await SupabaseService.uploadImage(beforePhoto, 'before_after');
            const afterUrl = await SupabaseService.uploadImage(afterPhoto, 'before_after');

            const title = selectedArticles.length === 1 
                ? `Before/After: ${selectedArticles[0].name}`
                : `Before/After: ${selectedArticles.length} Products`;
                
            const productIds = selectedArticles.map(a => a.id);
            const productSkus = selectedArticles.map(a => a.sku).join(', ');

            const result = await ReportService.submitEvent({
                name: title,
                notes: formData.description,
                type: 'Before/After',
                gms_id: gmsId || undefined,
                visit_id: visitId || undefined,
                workday_id: workdayId || undefined,
                before_image: beforeUrl,
                after_image: afterUrl,
                metadata: {
                    article_ids: productIds,
                    skus: productSkus
                }
            });

            if (result) {
                showToast({ message: 'Before/After report submitted successfully!', type: 'success' });
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

    const filteredArticles = articles.filter(a => 
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (a.sku && a.sku.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const PhotoSection = ({ title, photo, type }: { title: string, photo: string | null, type: 'before' | 'after' }) => (
        <View style={styles.photoSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
            {photo ? (
                <View style={styles.previewContainer}>
                    <Image source={{ uri: photo }} style={styles.previewImage} />
                    <TouchableOpacity
                        style={[styles.removeBtn, { backgroundColor: colors.danger }]}
                        onPress={() => type === 'before' ? setBeforePhoto(null) : setAfterPhoto(null)}
                    >
                        <Ionicons name="trash-outline" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.photoActions}>
                    <TouchableOpacity
                        style={[styles.photoBtn, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}
                        onPress={() => pickImage(type, 'camera')}
                    >
                        <Ionicons name="camera" size={28} color={colors.primary} />
                        <Text style={[styles.photoBtnText, { color: colors.primary }]}>Camera</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.photoBtn, { backgroundColor: colors.secondary + '10', borderColor: colors.secondary + '30' }]}
                        onPress={() => pickImage(type, 'library')}
                    >
                        <Ionicons name="images" size={28} color={colors.secondary} />
                        <Text style={[styles.photoBtnText, { color: colors.secondary }]}>Gallery</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <Header
                title="Before/After"
                subtitle="Document shelf changes"
                showBack
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                    <Card style={styles.formCard}>
                        <View style={styles.inputsContainer}>
                            
                            <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 12 }]}>Product Names *</Text>
                            
                            <View>
                                <View style={[styles.searchBox, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                                    <Ionicons name="search" size={18} color={colors.textSecondary} />
                                    <TextInput
                                        placeholder="Search by name or SKU..."
                                        placeholderTextColor={colors.textMuted}
                                        style={[styles.searchInput, { color: colors.text }]}
                                        value={searchQuery}
                                        onChangeText={setSearchQuery}
                                    />
                                </View>

                                {selectedArticles.length > 0 && (
                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                                        {selectedArticles.map(article => (
                                            <View key={`sel-${article.id}`} style={[styles.selectedPill, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}>
                                                <Text style={{ fontSize: 12, color: colors.text, fontWeight: '600' }}>{article.name}</Text>
                                                <TouchableOpacity onPress={() => setSelectedArticles(prev => prev.filter(a => a.id !== article.id))}>
                                                    <Ionicons name="close-circle" size={16} color={colors.danger} />
                                                </TouchableOpacity>
                                            </View>
                                        ))}
                                    </View>
                                )}

                                <View style={styles.articleList}>
                                    {filteredArticles.slice(0, 5).map(article => {
                                        const isSelected = selectedArticles.some(a => a.id === article.id);
                                        return (
                                        <TouchableOpacity 
                                            key={article.id} 
                                            style={[styles.articleItem, { borderBottomColor: colors.border + '30', backgroundColor: isSelected ? colors.primary + '08' : 'transparent' }]}
                                            onPress={() => {
                                                if (isSelected) {
                                                    setSelectedArticles(prev => prev.filter(a => a.id !== article.id));
                                                } else {
                                                    setSelectedArticles(prev => [...prev, article]);
                                                }
                                            }}
                                        >
                                            <MaterialCommunityIcons name="pasta" size={20} color={colors.primary} />
                                            <View style={{ flex: 1 }}>
                                                <Text style={[styles.articleName, { color: colors.text }]}>{article.name}</Text>
                                                <Text style={[styles.articleSku, { color: colors.textSecondary }]}>SKU: {article.sku || 'N/A'}</Text>
                                            </View>
                                            <Ionicons name={isSelected ? "checkmark-circle" : "add-circle-outline"} size={22} color={colors.primary} />
                                        </TouchableOpacity>
                                    )})}
                                    {filteredArticles.length === 0 && (
                                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No products found</Text>
                                    )}
                                </View>
                            </View>

                            <View style={{ marginTop: 12 }}>
                                <Input
                                    label="Description *"
                                    placeholder="Describe the changes you made..."
                                    value={formData.description}
                                    onChangeText={(text: string) => setFormData({ ...formData, description: text })}
                                    multiline
                                    style={{ minHeight: 100, textAlignVertical: 'top' }}
                                    icon="reader-outline"
                                />
                            </View>
                        </View>

                        <View style={styles.photosGrid}>
                            <PhotoSection title="Before Photo *" photo={beforePhoto} type="before" />
                            <PhotoSection title="After Photo *" photo={afterPhoto} type="after" />
                        </View>

                        <Button
                            title={isSubmitting ? "Submitting..." : "Submit Report"}
                            onPress={handleSubmit}
                            loading={isSubmitting}
                            disabled={isSubmitting || selectedArticles.length === 0}
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
    container: {
        flex: 1,
    },
    scroll: {
        padding: DesignTokens.spacing.md,
        paddingBottom: 40,
    },
    formCard: {
        padding: DesignTokens.spacing.lg,
        borderRadius: 20,
    },
    inputsContainer: {
        gap: DesignTokens.spacing.md,
        marginBottom: DesignTokens.spacing.lg,
    },
    photosGrid: {
        gap: DesignTokens.spacing.lg,
        marginBottom: DesignTokens.spacing.xl,
    },
    photoSection: {
        gap: 8,
    },
    sectionTitle: {
        ...DesignTokens.typography.bodyBold,
        fontSize: 14,
        marginLeft: 4,
    },
    photoActions: {
        flexDirection: 'row',
        gap: DesignTokens.spacing.md,
    },
    photoBtn: {
        flex: 1,
        height: 100,
        borderRadius: 16,
        borderWidth: 1,
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    photoBtnText: {
        fontSize: 12,
        fontFamily: Fonts.bodyBold,
    },
    previewContainer: {
        width: '100%',
        height: 200,
        borderRadius: 16,
        overflow: 'hidden',
        position: 'relative',
    },
    previewImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    removeBtn: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    submitBtn: {
        marginTop: DesignTokens.spacing.sm,
    },
    searchBox: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, height: 44, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
    searchInput: { flex: 1, fontSize: 14, fontFamily: Fonts.body },
    articleList: { maxHeight: 250 },
    articleItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 8, paddingVertical: 12, borderBottomWidth: 1, borderRadius: 8 },
    articleName: { fontSize: 14, fontWeight: '700' },
    articleSku: { fontSize: 11, marginTop: 2 },
    selectedPill: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, gap: 6 },
    emptyText: { textAlign: 'center', paddingVertical: 20, fontSize: 12 },
});
