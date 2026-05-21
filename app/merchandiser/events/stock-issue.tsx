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
    TouchableOpacity,
    View,
    TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Header } from '@/components/ui/Header';
import { DesignTokens, getColors } from '@/constants/designSystem';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { Fonts } from '@/hooks/useFonts';
import { Article, ArticleService } from '@/services/article.service';
import { LocationService } from '@/services/location.service';
import { ReportService, EventSubmission } from '@/services/report.service';
import { SupabaseService } from '@/services/supabase.service';

export default function StockIssueReport() {
    const router = useRouter();
    const { theme } = useTheme();
    const colors = getColors(theme);
    const { showToast } = useToast();

    const [loading, setLoading] = useState(true);
    const [articles, setArticles] = useState<Article[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedArticles, setSelectedArticles] = useState<Article[]>([]);
    const [status, setStatus] = useState<'Out of Stock' | 'Low Stock'>('Out of Stock');
    const [notes, setNotes] = useState('');
    const [photo, setPhoto] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [gmsId, setGmsId] = useState<number | null>(null);
    const [visitId, setVisitId] = useState<number | null>(null);

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
            } catch (error) {
                console.error('[StockIssue] Load error:', error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

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

    const handleSubmit = async () => {
        if (selectedArticles.length === 0) {
            showToast({ message: 'Please select at least one product', type: 'warning' });
            return;
        }
        if (!photo) {
            showToast({ message: 'Please provide a photo of the shelf', type: 'warning' });
            return;
        }

        setIsSubmitting(true);
        try {
            const imageUrl = await SupabaseService.uploadImage(photo, 'stock_issues');

            const productNames = selectedArticles.map(a => a.name).join(', ');
            const productIds = selectedArticles.map(a => a.id);
            const productSkus = selectedArticles.map(a => a.sku).join(', ');

            const title = selectedArticles.length === 1 
                ? `[${status.toUpperCase()}] ${selectedArticles[0].name}`
                : `[${status.toUpperCase()}] ${selectedArticles.length} Products`;

            const payload: EventSubmission = {
                name: title,
                notes: notes || `Products: ${productNames}. Status: ${status}.`,
                type: 'stock-issue',
                gms_id: gmsId || undefined,
                visit_id: visitId || undefined,
                photo: imageUrl || undefined,
                metadata: {
                    article_ids: productIds,
                    skus: productSkus,
                    stock_status: status,
                    timestamp: new Date().toISOString()
                }
            };

            const result = await ReportService.submitEvent(payload);

            if (result) {
                showToast({ message: `${status} reported successfully!`, type: 'success' });
                router.back();
            } else {
                alert('Submission failed: The server rejected the report. Please check your internet and try again.');
                showToast({ message: 'Failed to submit report', type: 'error' });
            }
        } catch (error: any) {
            console.error('Submission error:', error);
            alert(`Error: ${error?.message || 'Unknown submission error'}`);
            showToast({ message: 'An error occurred during submission', type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredArticles = articles.filter(a => 
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (a.sku && a.sku.toLowerCase().includes(searchQuery.toLowerCase()))
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
            <Header title="Rupture Stock" subtitle="Report stock availability" showBack />

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                    <Card style={styles.formCard}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>1. Select Products *</Text>
                        
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

                        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 24 }]}>2. Stock Status *</Text>
                        <View style={styles.statusGrid}>
                            {(['Out of Stock', 'Low Stock'] as const).map(s => {
                                const isSelected = status === s;
                                return (
                                    <TouchableOpacity
                                        key={s}
                                        style={[
                                            styles.statusItem,
                                            { backgroundColor: isSelected ? (s === 'Out of Stock' ? colors.danger + '15' : colors.warning + '15') : colors.surfaceSecondary,
                                              borderColor: isSelected ? (s === 'Out of Stock' ? colors.danger : colors.warning) : 'transparent' }
                                        ]}
                                        onPress={() => setStatus(s)}
                                    >
                                        <Ionicons 
                                            name={s === 'Out of Stock' ? 'close-circle' : 'alert-circle'} 
                                            size={20} 
                                            color={isSelected ? (s === 'Out of Stock' ? colors.danger : colors.warning) : colors.textSecondary} 
                                        />
                                        <Text style={[styles.statusLabel, { color: isSelected ? colors.text : colors.textSecondary }]}>{s}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 24 }]}>3. Shelf Photo *</Text>
                        {photo ? (
                            <View style={styles.previewContainer}>
                                <Image source={{ uri: photo }} style={styles.previewImage} />
                                <TouchableOpacity style={[styles.removeBtn, { backgroundColor: colors.danger }]} onPress={() => setPhoto(null)}>
                                    <Ionicons name="trash-outline" size={20} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity style={[styles.photoPlaceholder, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]} onPress={pickImage}>
                                <Ionicons name="camera" size={40} color={colors.textSecondary} />
                                <Text style={[styles.photoText, { color: colors.textSecondary }]}>Take proof photo</Text>
                            </TouchableOpacity>
                        )}

                        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 24 }]}>4. Notes (Optional)</Text>
                        <TextInput
                            placeholder="Add any additional details..."
                            placeholderTextColor={colors.textMuted}
                            value={notes}
                            onChangeText={setNotes}
                            multiline
                            style={[styles.notesInput, { color: colors.text, backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
                        />

                        <Button
                            title={isSubmitting ? "Reporting..." : "Submit Stock Report"}
                            onPress={handleSubmit}
                            loading={isSubmitting}
                            disabled={isSubmitting || selectedArticles.length === 0 || !photo}
                            icon="cloud-upload"
                            fullWidth
                            size="lg"
                            style={[
                                styles.submitBtn,
                                (selectedArticles.length === 0 || !photo) && { opacity: 0.5 }
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
    sectionTitle: { ...DesignTokens.typography.bodyBold, fontSize: 13, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
    searchBox: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, height: 44, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
    searchInput: { flex: 1, fontSize: 14, fontFamily: Fonts.body },
    articleList: { maxHeight: 250 },
    articleItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 8, paddingVertical: 12, borderBottomWidth: 1, borderRadius: 8 },
    articleName: { fontSize: 14, fontWeight: '700' },
    articleSku: { fontSize: 11, marginTop: 2 },
    selectedPill: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, gap: 6 },
    statusGrid: { flexDirection: 'row', gap: 10 },
    statusItem: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 8, flexDirection: 'row' },
    statusLabel: { fontSize: 13, fontWeight: '700' },
    photoPlaceholder: { height: 160, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 8 },
    photoText: { fontSize: 12, fontWeight: '600' },
    previewContainer: { width: '100%', height: 200, borderRadius: 16, overflow: 'hidden', position: 'relative' },
    previewImage: { width: '100%', height: '100%' },
    removeBtn: { position: 'absolute', top: 8, right: 8, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    notesInput: { height: 80, borderRadius: 12, borderWidth: 1, padding: 12, fontSize: 14, textAlignVertical: 'top' },
    submitBtn: { marginTop: 32 },
    emptyText: { textAlign: 'center', paddingVertical: 20, fontSize: 12 },
});
