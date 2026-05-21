import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
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
import { ReportService } from '@/services/report.service';
import { SupabaseService } from '@/services/supabase.service';
import { EventService } from '@/services/event.service';


export default function NewProductEvent() {
    const router = useRouter();
    const { theme } = useTheme();
    const colors = getColors(theme);
    const { showToast } = useToast();

    const [articles, setArticles] = useState<Article[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        setIsLoading(true);
        try {
            const data = await ArticleService.getAll();
            setArticles(data);
        } catch (error) {
            showToast({ message: 'Failed to load products', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const categories = Array.from(new Set(articles.map(a => a.category).filter(Boolean))) as string[];

    const filteredArticles = articles.filter(a => {
        const matchesSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (a.reference && a.reference.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesCategory = selectedCategory ? a.category === selectedCategory : true;
        return matchesSearch && matchesCategory;
    });

    const handleSubmit = async () => {
        if (!selectedArticle) return;

        setIsSubmitting(true);
        try {
            
            
            const result = await EventService.create({
                type: 'new_product',
                payload: {
                    original_data: { 
                name: selectedArticle.name,
                notes: notes.trim() ? `Notes: ${notes}` : undefined,
                // type: 'New Product',
                // status: 'pending',
                visits_planned: 0,
                visits_completed: 0,
             }
                }
            });

            if (result) {
                showToast({ message: 'New product reported!', type: 'success' });
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

    const renderArticleCard = ({ item }: { item: Article }) => (
        <Card
            style={[
                styles.articleCard,
                selectedArticle?.id === item.id && { borderColor: colors.primary, borderWidth: 2 }
            ]}
            onPress={() => setSelectedArticle(item)}
        >
            <View style={styles.cardHeader}>
                <Text style={[styles.articleName, { color: colors.text }]}>{item.name}</Text>
                {selectedArticle?.id === item.id && (
                    <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                )}
            </View>
            <Text style={[styles.articleMeta, { color: colors.textSecondary }]}>
                {item.category || 'No Category'} {item.brand ? `• ${item.brand}` : ''}
            </Text>
            {item.reference && (
                <Text style={[styles.articleRef, { color: colors.textSecondary }]}>Ref: {item.reference}</Text>
            )}
        </Card>
    );

    if (isSubmitting) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={{ marginTop: 12, color: colors.textSecondary, fontFamily: Fonts.body }}>Submitting Report...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <Header title="New Product" subtitle="Report newly added items" showBack />

            {selectedArticle ? (
                // Selected State - Confirmation Panel
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                    <View style={styles.confirmationPanel}>
                        <Card style={styles.selectedCard}>
                            <View style={styles.selectedHeader}>
                                <View style={styles.iconBox}>
                                    <Ionicons name="cube-outline" size={32} color={colors.primary} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.selectedTitle, { color: colors.text }]}>Selected Product</Text>
                                    <Text style={[styles.selectedName, { color: colors.text }]}>{selectedArticle.name}</Text>
                                </View>
                            </View>
                            <Button
                                title="Change Product"
                                variant="outline"
                                onPress={() => setSelectedArticle(null)}
                                size="sm"
                                style={{ marginTop: 16 }}
                            />
                        </Card>

                        <Text style={[styles.label, { color: colors.text }]}>Additional Notes (Optional)</Text>
                        <Input
                            placeholder="Add details about product condition, placement, etc..."
                            value={notes}
                            onChangeText={setNotes}
                            multiline
                            style={{ minHeight: 120, textAlignVertical: 'top' }}
                        />

                        <View style={{ flex: 1 }} />

                        <Button
                            title="Submit Report"
                            onPress={handleSubmit}
                            icon="checkmark-circle"
                            fullWidth
                            size="lg"
                            style={{ marginBottom: 20 }}
                        />
                    </View>
                </KeyboardAvoidingView>
            ) : (
                // List State
                <View style={{ flex: 1 }}>
                    {/* Search Bar */}
                    <View style={styles.searchContainer}>
                        <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <Ionicons name="search" size={20} color={colors.textSecondary} />
                            <TextInput
                                style={[styles.searchInput, { color: colors.text }]}
                                placeholder="Search products..."
                                placeholderTextColor={colors.textSecondary}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setSearchQuery('')}>
                                    <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* Category Filter */}
                    {categories.length > 0 && (
                        <View style={{ paddingBottom: 12 }}>
                            <FlatList
                                horizontal
                                data={['All', ...categories]}
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
                                renderItem={({ item }) => {
                                    const isSelected = item === 'All' ? selectedCategory === null : selectedCategory === item;
                                    return (
                                        <TouchableOpacity
                                            style={[
                                                styles.chip,
                                                { backgroundColor: isSelected ? colors.primary : colors.surface, borderColor: isSelected ? colors.primary : colors.border }
                                            ]}
                                            onPress={() => setSelectedCategory(item === 'All' ? null : item)}
                                        >
                                            <Text style={[styles.chipText, { color: isSelected ? '#fff' : colors.text }]}>{item}</Text>
                                        </TouchableOpacity>
                                    );
                                }}
                            />
                        </View>
                    )}

                    {/* Content Area */}
                    {isLoading ? (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <ActivityIndicator size="large" color={colors.primary} />
                            <Text style={{ marginTop: 12, color: colors.textSecondary, fontFamily: Fonts.body }}>Loading product catalog...</Text>
                        </View>
                    ) : filteredArticles.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="cube-outline" size={48} color={colors.border} />
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No products found.</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={filteredArticles}
                            keyExtractor={item => item.id.toString()}
                            renderItem={renderArticleCard}
                            contentContainerStyle={styles.listContainer}
                            showsVerticalScrollIndicator={false}
                        />
                    )}
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    searchContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        height: 48,
        borderRadius: 12,
        borderWidth: 1,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontFamily: Fonts.body,
        fontSize: 16,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
    },
    chipText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 14,
    },
    listContainer: {
        padding: 16,
        gap: 12,
        paddingBottom: 100,
    },
    articleCard: {
        padding: 16,
        borderRadius: 12,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    articleName: {
        fontFamily: Fonts.headingSemiBold,
        fontSize: 16,
        flex: 1,
    },
    articleMeta: {
        fontFamily: Fonts.body,
        fontSize: 14,
        marginBottom: 2,
    },
    articleRef: {
        fontFamily: Fonts.body,
        fontSize: 12,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    emptyText: {
        fontFamily: Fonts.body,
        fontSize: 16,
    },
    confirmationPanel: {
        flex: 1,
        padding: 20,
    },
    selectedCard: {
        padding: 20,
        borderRadius: 16,
        marginBottom: 24,
    },
    selectedHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    iconBox: {
        width: 60,
        height: 60,
        borderRadius: 16,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectedTitle: {
        fontFamily: Fonts.bodyBold,
        fontSize: 14,
        opacity: 0.7,
        marginBottom: 4,
    },
    selectedName: {
        fontFamily: Fonts.headingSemiBold,
        fontSize: 18,
    },
    label: {
        fontFamily: Fonts.headingSemiBold,
        fontSize: 16,
        marginBottom: 12,
    },
});

