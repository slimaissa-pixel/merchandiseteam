import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
    Alert, FlatList, Modal, ScrollView, StyleSheet, Text,
    TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Badge } from '@/components/ui/Badge';
import { BottomNav } from '@/components/ui/BottomNav';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Header } from '@/components/ui/Header';
import { ListSkeleton } from '@/components/ui/LoadingSkeleton';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { DesignTokens, getColors } from '@/constants/designSystem';
import { SUPERVISOR_NAV_ITEMS } from '@/constants/navigation';
import { useTheme } from '@/context/ThemeContext';
import { Article, ArticleService } from '@/services/article.service';

const CATEGORIES = ['All', 'Dairy', 'Beverage', 'Snacks', 'Frozen', 'Bakery', 'Hygiene', 'Other'];

const emptyForm = { name: '', reference: '', category: 'Snacks', brand: '', unit: 'piece', description: '' };

export default function AdminArticles() {
    const { theme } = useTheme();
    const colors = getColors(theme);

    const [articles, setArticles] = useState<Article[]>([]);
    const [filtered, setFiltered] = useState<Article[]>([]);
    const [search, setSearch] = useState('');
    const [catFilter, setCatFilter] = useState('All');
    const [loading, setLoading] = useState(true);

    // modal state
    const [modalVisible, setModalVisible] = useState(false);
    const [editing, setEditing] = useState<Article | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);

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

    const openCreate = () => {
        setEditing(null);
        setForm(emptyForm);
        setModalVisible(true);
    };

    const openEdit = (article: Article) => {
        setEditing(article);
        setForm({
            name: article.name,
            reference: article.reference || '',
            category: article.category || 'Snacks',
            brand: article.brand || '',
            unit: article.unit || 'piece',
            description: article.description || '',
        });
        setModalVisible(true);
    };

    const handleNameChange = (name: string) => {
        setForm(f => {
            const newForm = { ...f, name };
            // Auto-generate reference for new articles only
            if (!editing && name.trim().length >= 3) {
                const prefix = name.substring(0, 3).toUpperCase();
                const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
                newForm.reference = `${prefix}-${random}-MT`;
            }
            return newForm;
        });
    };

    const handleSave = async () => {
        if (!form.name.trim()) {
            Alert.alert('Error', 'Article name is required');
            return;
        }
        setSaving(true);
        if (editing) {
            await ArticleService.update(editing.id, form);
        } else {
            await ArticleService.create(form);
        }
        setSaving(false);
        setModalVisible(false);
        load();
    };

    const handleDelete = (article: Article) => {
        Alert.alert('Delete Article', `Delete "${article.name}"?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: async () => {
                    await ArticleService.delete(article.id);
                    load();
                }
            },
        ]);
    };

    const renderItem = ({ item }: { item: Article }) => (
        <Card style={s.card}>
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
            <View style={s.actions}>
                <Button title="Edit" variant="ghost" size="sm" icon="create-outline" onPress={() => openEdit(item)} style={s.btn} />
                <Button title="Delete" variant="ghost" size="sm" icon="trash-outline" onPress={() => handleDelete(item)} style={[s.btn, { borderColor: colors.danger + '40' }]} />
            </View>
        </Card>
    );

    return (
        <SafeAreaView style={[s.container, { backgroundColor: colors.background }]}>
            <Header
                title="Articles"
                subtitle={`${filtered.length} article${filtered.length !== 1 ? 's' : ''}`}
                rightIcon="add-circle-outline"
                onRightIconPress={openCreate}
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

            {loading ? (
                <View style={s.list}>
                    <ListSkeleton count={6} />
                </View>
            ) : (
                <FlatList
                    data={filtered}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={s.list}
                    showsVerticalScrollIndicator={false}
                    ListHeaderComponent={<SectionHeader title="Articles List" actionLabel="Refresh" onAction={load} />}
                    ListEmptyComponent={
                        <View style={s.empty}>
                            <Ionicons name="cube-outline" size={64} color={colors.textMuted} />
                            <Text style={{ color: colors.textSecondary, marginTop: 12, ...DesignTokens.typography.body }}>
                                No articles found
                            </Text>
                            <Button title="Add First Article" onPress={openCreate} style={{ marginTop: 16 }} />
                        </View>
                    }
                />
            )}

            {/* Create / Edit Modal */}
            <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalVisible(false)}>
                <SafeAreaView style={[s.modal, { backgroundColor: colors.background }]}>
                    <View style={[s.modalHeader, { borderBottomColor: colors.border }]}>
                        <Text style={[s.modalTitle, { color: colors.text }]}>{editing ? 'Edit Article' : 'New Article'}</Text>
                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={s.modalBody}>
                        {([
                            { key: 'name', label: 'Article Name *', placeholder: 'e.g. Danone Yogurt 150g' },
                            { key: 'reference', label: 'Reference / SKU', placeholder: 'e.g. DAN-YOG-150' },
                            { key: 'brand', label: 'Brand', placeholder: 'e.g. Danone' },
                            { key: 'unit', label: 'Unit', placeholder: 'piece / kg / litre' },
                            { key: 'description', label: 'Description', placeholder: 'Optional notes…' },
                        ] as any[]).map(field => (
                            <View key={field.key} style={s.fieldGroup}>
                                <Text style={[s.label, { color: colors.textSecondary }]}>{field.label}</Text>
                                <View style={[s.inputWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                    <TextInput
                                        style={[s.input, { color: colors.text }]}
                                        placeholder={field.placeholder}
                                        placeholderTextColor={colors.textMuted}
                                        value={(form as any)[field.key]}
                                        onChangeText={v => {
                                            if (field.key === 'name') {
                                                handleNameChange(v);
                                            } else {
                                                setForm(f => ({ ...f, [field.key]: v }));
                                            }
                                        }}
                                        multiline={field.key === 'description'}
                                        numberOfLines={field.key === 'description' ? 3 : 1}
                                    />
                                </View>
                            </View>
                        ))}

                        {/* Category picker */}
                        <View style={s.fieldGroup}>
                            <Text style={[s.label, { color: colors.textSecondary }]}>Category</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                                {CATEGORIES.filter(c => c !== 'All').map(cat => (
                                    <TouchableOpacity
                                        key={cat}
                                        onPress={() => setForm(f => ({ ...f, category: cat }))}
                                        style={[s.chip, { borderColor: colors.border, backgroundColor: form.category === cat ? colors.primary : colors.surface }]}
                                    >
                                        <Text style={[s.chipText, { color: form.category === cat ? '#fff' : colors.textSecondary }]}>{cat}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        <Button
                            title={saving ? 'Saving…' : (editing ? 'Save Changes' : 'Create Article')}
                            onPress={handleSave}
                            size="lg"
                            icon="checkmark-circle-outline"
                            style={{ marginTop: 8 }}
                        />
                    </ScrollView>
                </SafeAreaView>
            </Modal>

            <BottomNav items={SUPERVISOR_NAV_ITEMS} activeRoute="/supervisor/articles" />
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    container: { flex: 1 },
    searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, margin: DesignTokens.spacing.lg, padding: 12, borderRadius: 12, borderWidth: 1 },
    searchInput: { flex: 1, fontSize: 14 },
    chips: { paddingHorizontal: DesignTokens.spacing.lg, paddingBottom: 8, gap: 8 },
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
    actions: { flexDirection: 'row', gap: 8 },
    btn: { flex: 1 },
    empty: { alignItems: 'center', paddingTop: 100 },
    // modal
    modal: { flex: 1 },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1 },
    modalTitle: { ...DesignTokens.typography.h2 },
    modalBody: { padding: DesignTokens.spacing.lg, gap: DesignTokens.spacing.md },
    fieldGroup: { gap: 6 },
    label: { ...DesignTokens.typography.caption, fontWeight: '600' },
    inputWrap: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
    input: { fontSize: 14 },
});
