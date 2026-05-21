import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
    FlatList, Modal, ScrollView, StyleSheet, Text,
    TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Badge } from '@/components/ui/Badge';
import { BottomNav } from '@/components/ui/BottomNav';
import { Card } from '@/components/ui/Card';
import { Header } from '@/components/ui/Header';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { DesignTokens, getColors } from '@/constants/designSystem';
import { MERCHANDISER_NAV_ITEMS } from '@/constants/navigation';
import { useTheme } from '@/context/ThemeContext';
import { Article, ArticleService } from '@/services/article.service';

const CATEGORIES = ['All', 'Dairy', 'Beverage', 'Snacks', 'Frozen', 'Bakery', 'Hygiene', 'Other'];

export default function MerchandiserArticles() {
    const { theme } = useTheme();
    const colors = getColors(theme);

    const [articles, setArticles] = useState<Article[]>([]);
    const [filtered, setFiltered] = useState<Article[]>([]);
    const [search, setSearch] = useState('');
    const [catFilter, setCatFilter] = useState('All');
    const [loading, setLoading] = useState(true);
    const [viewing, setViewing] = useState<Article | null>(null);

    const load = async () => {
        setLoading(true);
        const data = await ArticleService.getAll();
        setArticles(data);
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    useEffect(() => {
        let list = articles;
        if (catFilter !== 'All') list = list.filter(a => a.category === catFilter);
        if (search) list = list.filter(a =>
            a.name.toLowerCase().includes(search.toLowerCase()) ||
            (a.reference || '').toLowerCase().includes(search.toLowerCase()) ||
            (a.brand || '').toLowerCase().includes(search.toLowerCase())
        );
        setFiltered(list);
    }, [articles, catFilter, search]);

    const renderItem = ({ item }: { item: Article }) => (
        <Card style={s.card} onPress={() => setViewing(item)}>
            <View style={s.cardRow}>
                <View style={[s.catDot, { backgroundColor: colors.primary + '20' }]}>
                    <Ionicons name="cube-outline" size={20} color={colors.primary} />
                </View>
                <View style={s.cardInfo}>
                    <Text style={[s.artName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
                    <Text style={[s.artSub, { color: colors.textSecondary }]}>
                        {[item.brand, item.reference, item.unit].filter(Boolean).join(' · ')}
                    </Text>
                </View>
                <Badge label={item.category || 'N/A'} variant="neutral" size="sm" />
            </View>
            {item.description ? (
                <Text style={[s.desc, { color: colors.textSecondary }]} numberOfLines={2}>{item.description}</Text>
            ) : null}
        </Card>
    );

    return (
        <SafeAreaView style={[s.container, { backgroundColor: colors.background }]}>
            <Header
                title="Articles"
                subtitle={`${filtered.length} article${filtered.length !== 1 ? 's' : ''}`}
                showBack
            />

            {/* Search */}
            <View style={[s.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Ionicons name="search-outline" size={18} color={colors.textMuted} />
                <TextInput
                    style={[s.searchInput, { color: colors.text }]}
                    placeholder="Search articles…"
                    placeholderTextColor={colors.textMuted}
                    value={search}
                    onChangeText={setSearch}
                />
            </View>

            {/* Category filter chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
                {CATEGORIES.map(cat => (
                    <TouchableOpacity
                        key={cat}
                        onPress={() => setCatFilter(cat)}
                        style={[s.chip, { borderColor: colors.border, backgroundColor: catFilter === cat ? colors.primary : colors.surface }]}
                    >
                        <Text style={[s.chipText, { color: catFilter === cat ? '#fff' : colors.textSecondary }]}>{cat}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <FlatList
                data={filtered}
                renderItem={renderItem}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={s.list}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={<SectionHeader title="Product Catalogue" actionLabel="Refresh" onAction={load} style={{ marginTop: 0, marginBottom: 8, paddingHorizontal: 0 }} />}
                ListEmptyComponent={
                    <View style={s.empty}>
                        <Ionicons name="cube-outline" size={64} color={colors.textMuted} />
                        <Text style={{ color: colors.textSecondary, marginTop: 12, ...DesignTokens.typography.body }}>
                            {loading ? 'Loading…' : 'No articles found'}
                        </Text>
                    </View>
                }
            />

            {/* View Detail Modal */}
            <Modal visible={!!viewing} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setViewing(null)}>
                <SafeAreaView style={[s.modal, { backgroundColor: colors.background }]}>
                    <View style={[s.modalHeader, { borderBottomColor: colors.border }]}>
                        <Text style={[s.modalTitle, { color: colors.text }]}>Article Details</Text>
                        <TouchableOpacity onPress={() => setViewing(null)}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>
                    {viewing && (
                        <ScrollView contentContainerStyle={s.modalBody}>
                            <View style={[s.detailCard, { backgroundColor: colors.surface }]}>
                                <View style={[s.catDot, { backgroundColor: colors.primary + '20', alignSelf: 'center', width: 60, height: 60, borderRadius: 30, marginBottom: 12 }]}>
                                    <Ionicons name="cube-outline" size={32} color={colors.primary} />
                                </View>
                                <Text style={[s.artName, { color: colors.text, textAlign: 'center', fontSize: 20 }]}>{viewing.name}</Text>
                                {viewing.brand && <Text style={[s.artSub, { color: colors.textSecondary, textAlign: 'center', marginTop: 4 }]}>{viewing.brand}</Text>}
                                <View style={{ alignItems: 'center', marginTop: 8 }}>
                                    <Badge label={viewing.category || 'N/A'} variant="neutral" />
                                </View>
                            </View>

                            {[
                                { label: 'Reference / SKU', value: viewing.reference },
                                { label: 'Unit', value: viewing.unit },
                                { label: 'Description', value: viewing.description },
                            ].filter(r => r.value).map(row => (
                                <View key={row.label} style={[s.detailRow, { borderColor: colors.border }]}>
                                    <Text style={[s.detailLabel, { color: colors.textSecondary }]}>{row.label}</Text>
                                    <Text style={[s.detailValue, { color: colors.text }]}>{row.value}</Text>
                                </View>
                            ))}
                        </ScrollView>
                    )}
                </SafeAreaView>
            </Modal>

            <BottomNav items={MERCHANDISER_NAV_ITEMS} activeRoute="/merchandiser/articles" />
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    container: { flex: 1 },
    searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, margin: DesignTokens.spacing.lg, padding: 12, borderRadius: 12, borderWidth: 1 },
    searchInput: { flex: 1, fontSize: 14 },
    chips: { paddingHorizontal: DesignTokens.spacing.lg, paddingBottom: 0, gap: 8 },
    chip: {
        width: 100,
        height: 38,
        borderRadius: 19,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    chipText: { fontSize: 12, fontWeight: '600' },
    list: { paddingHorizontal: DesignTokens.spacing.lg, paddingBottom: 100 },
    card: { padding: DesignTokens.spacing.md, marginBottom: DesignTokens.spacing.md, gap: 8 },
    cardRow: { flexDirection: 'row', alignItems: 'center', gap: DesignTokens.spacing.md },
    catDot: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    cardInfo: { flex: 1 },
    artName: { ...DesignTokens.typography.bodyBold },
    artSub: { ...DesignTokens.typography.caption, marginTop: 2 },
    desc: { ...DesignTokens.typography.caption, lineHeight: 18 },
    empty: { alignItems: 'center', paddingTop: 100 },
    modal: { flex: 1 },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1 },
    modalTitle: { ...DesignTokens.typography.h2 },
    modalBody: { padding: DesignTokens.spacing.lg, gap: DesignTokens.spacing.md },
    detailCard: { padding: 20, borderRadius: 16, alignItems: 'center', marginBottom: 8 },
    detailRow: { borderBottomWidth: 1, paddingVertical: 12, gap: 4 },
    detailLabel: { ...DesignTokens.typography.caption, fontWeight: '600' },
    detailValue: { ...DesignTokens.typography.body },
});
