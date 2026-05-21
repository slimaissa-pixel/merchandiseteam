import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState, useCallback, useMemo } from 'react';
import {
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ActivityIndicator,
    Pressable,
    Image as RNImage
} from 'react-native';
import { AdminWebLayout } from '@/components/admin/WebLayout';
import { ListSkeleton } from '@/components/ui/LoadingSkeleton';
import { DARK_COLORS, LIGHT_COLORS } from '@/constants/appColors';
import { useTheme } from '@/context/ThemeContext';
import { Fonts } from '@/hooks/useFonts';
import { Article, ArticleService } from '@/services/article.service';
import { GMS, GMSService } from '@/services/gms.service';
import { useWebTheme } from '@/hooks/useWebTheme';
import { WebCard, WebChip, WebButton } from '@/components/ui/WebPrimitives';
import { LinearGradient } from 'expo-linear-gradient';

const TUNISIAN_BRANDS = ["Delice", "Natilait", "Vitalait", "Safia", "Sabrine", "Randa", "Warda", "l'Epi d'Or", "Sicam", "Jouda", "Said", "Maestro", "Ramo", "Other"];

const emptyForm = { 
    name: '', 
    reference: '', 
    category: 'Dairy', 
    brand: 'Delice', 
    unit: '1', 
    description: '', 
    barcode: '', 
    stock_alert_threshold: 0, 
    is_active: true,
    gms_ids: [] as number[]
};

export default function AdminArticles() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const COLOR = isDark ? DARK_COLORS : LIGHT_COLORS;
    const { T } = useWebTheme();

    const [articles, setArticles] = useState<Article[]>([]);
    const [stores, setStores] = useState<GMS[]>([]);
    const [categories, setCategories] = useState<string[]>(['All']);
    const [filtered, setFiltered] = useState<Article[]>([]);
    const [search, setSearch] = useState('');
    const [catFilter, setCatFilter] = useState('All');
    const [gmsFilter, setGmsFilter] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    const [modalVisible, setModalVisible] = useState(false);
    const [editing, setEditing] = useState<Article | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [articlesData, storesData, catsData] = await Promise.all([
                ArticleService.getAll(),
                GMSService.getAll({ limit: 100 }),
                ArticleService.getCategories()
            ]);
            setArticles(articlesData || []);
            setStores(storesData || []);
            setCategories(['All', ...(catsData || [])]);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    useEffect(() => {
        let list = articles;
        if (catFilter !== 'All') list = list.filter(a => a.category === catFilter);
        if (gmsFilter) {
            list = list.filter(a => a.gms_list?.some(g => g.id === gmsFilter));
        }
        if (search) {
            const query = search.toLowerCase();
            list = list.filter(a =>
                a.name.toLowerCase().includes(query) ||
                (a.reference || '').toLowerCase().includes(query) ||
                (a.barcode || '').toLowerCase().includes(query) ||
                (a.brand || '').toLowerCase().includes(query)
            );
        }
        setFiltered(list);
    }, [articles, catFilter, gmsFilter, search]);

    const stats = useMemo(() => {
        const total = articles.length;
        const active = articles.filter(a => a.is_active).length;
        const byCat = articles.reduce((acc, a) => {
            const cat = a.category || 'Other';
            acc[cat] = (acc[cat] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        
        return { total, active, byCat };
    }, [articles]);

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
            category: article.category || 'Other',
            brand: article.brand || '',
            unit: article.unit || '1',
            description: article.description || '',
            barcode: article.barcode || '',
            stock_alert_threshold: article.stock_alert_threshold || 0,
            is_active: article.is_active ?? true,
            gms_ids: article.gms_list?.map(g => g.id) || []
        });
        setModalVisible(true);
    };

    const handleSave = async () => {
        if (!form.name.trim()) return alert('Article name is required');
        setSaving(true);
        try {
            const payload = {
                ...form,
                stock_alert_threshold: Number(form.stock_alert_threshold)
            };
            if (editing) {
                await ArticleService.update(editing.id, payload);
            } else {
                await ArticleService.create(payload);
            }
            setModalVisible(false);
            loadData();
        } catch (error) {
            alert('Failed to save article');
        } finally {
            setSaving(false);
        }
    };

    const toggleGmsInForm = (gmsId: number) => {
        setForm(f => {
            const ids = f.gms_ids.includes(gmsId) 
                ? f.gms_ids.filter(id => id !== gmsId)
                : [...f.gms_ids, gmsId];
            return { ...f, gms_ids: ids };
        });
    };

    const onImportClick = () => {
        if (Platform.OS !== 'web') return alert('Import is only supported on web');
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv';
        input.onchange = async (e: any) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setLoading(true);
            const result = await ArticleService.importCSV(file);
            setLoading(false);
            if (result) {
                alert(`Import Complete!\nCreated: ${result.created}\nSkipped: ${result.skipped}`);
                loadData();
            }
        };
        input.click();
    };

    return (
        <AdminWebLayout title="Product Management">
            {/* KPI Header */}
            <View style={st.statsGrid}>
                <WebCard style={st.statCard}>
                    <Ionicons name="cube" size={24} color={T.primary} />
                    <View style={{marginLeft: 16}}>
                        <Text style={st.statVal}>{stats.total}</Text>
                        <Text style={st.statLab}>Total Products</Text>
                    </View>
                </WebCard>
                <WebCard style={st.statCard}>
                    <Ionicons name="checkmark-circle" size={24} color={T.success} />
                    <View style={{marginLeft: 16}}>
                        <Text style={st.statVal}>{stats.active}</Text>
                        <Text style={st.statLab}>Active Products</Text>
                    </View>
                </WebCard>
                <WebCard style={st.statCard}>
                    <Ionicons name="apps" size={24} color={T.warning} />
                    <View style={{marginLeft: 16}}>
                        <Text style={st.statVal}>{categories.length - 1}</Text>
                        <Text style={st.statLab}>Categories</Text>
                    </View>
                </WebCard>
                <WebCard style={st.statCard}>
                    <Ionicons name="stats-chart" size={24} color={T.info || T.primary} />
                    <View style={{marginLeft: 16}}>
                        <Text style={st.statVal}>84%</Text>
                        <Text style={st.statLab}>Facing Compliance</Text>
                    </View>
                </WebCard>
            </View>

            {/* Toolbar */}
            <View style={st.toolbar}>
                <View style={st.searchContainer}>
                    <View style={[st.searchInputWrapper, { backgroundColor: T.surface, borderColor: T.border }]}>
                        <Ionicons name="search" size={20} color={T.textMuted} />
                        <TextInput
                            style={[st.searchInput, { color: T.text }]}
                            placeholder="Search by name, SKU or barcode..."
                            placeholderTextColor={T.textMuted}
                            value={search}
                            onChangeText={setSearch}
                        />
                    </View>
                    <View style={[st.filterSelect, { backgroundColor: T.surface, borderColor: T.border }]}>
                        <Ionicons name="business" size={18} color={T.textMuted} />
                        <select 
                            style={{ background: 'transparent', border: 'none', color: T.text, outline: 'none', marginLeft: 8, fontSize: 14, cursor: 'pointer' }}
                            value={gmsFilter || ''}
                            onChange={(e) => setGmsFilter(e.target.value ? Number(e.target.value) : null)}
                        >
                            <option value="">All Stores</option>
                            {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </View>
                </View>
                
                <View style={{ flexDirection: 'row', gap: 12 }}>
                    <TouchableOpacity style={st.secondaryBtn} onPress={onImportClick}>
                        <Ionicons name="cloud-download-outline" size={18} color={T.text} />
                        <Text style={st.secondaryBtnText}>Import</Text>
                    </TouchableOpacity>
                    <WebButton 
                        label="Add Product" 
                        onPress={openCreate} 
                        icon={<Ionicons name="add-circle" size={18} color="#fff" />} 
                    />
                </View>
            </View>

            {/* Categories Chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={st.catScroll}>
                {categories.map(cat => (
                    <TouchableOpacity
                        key={cat}
                        onPress={() => setCatFilter(cat)}
                        style={[st.catChip, { 
                            backgroundColor: catFilter === cat ? T.primary : T.surface,
                            borderColor: catFilter === cat ? T.primary : T.border,
                        }]}
                    >
                        <Text style={[st.catChipText, { color: catFilter === cat ? '#fff' : T.textMuted }]}>{cat}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {loading ? <ListSkeleton count={6} /> : (
                <View style={st.productGrid}>
                    {filtered.length === 0 ? (
                        <View style={st.emptyState}>
                            <Ionicons name="cube-outline" size={64} color={T.borderHover} />
                            <Text style={{ color: T.textMuted, marginTop: 16 }}>No products found.</Text>
                        </View>
                    ) : (
                        filtered.map(item => (
                            <WebCard key={item.id} style={st.productCard} noPadding>
                                <View style={st.cardHeaderInfo}>
                                    <View style={st.cardIconBox}>
                                        <Ionicons name="cube" size={24} color={T.primary} />
                                    </View>
                                    <View style={st.cardBadgeContainerAlt}>
                                        <WebChip 
                                            label={item.is_active ? 'Active' : 'Inactive'} 
                                            colorPreset={item.is_active ? 'success' : 'danger'} 
                                        />
                                    </View>
                                </View>

                                <View style={st.cardContent}>
                                    <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                                        <View style={{flex: 1}}>
                                            <Text style={[st.cardName, { color: T.text }]} numberOfLines={1}>{item.name}</Text>
                                            <Text style={st.cardSub}>{item.brand} • {item.category}</Text>
                                        </View>
                                        <Text style={[st.cardPrice, { color: T.primary }]}>{item.price ? `${item.price} DT` : ''}</Text>
                                    </View>

                                    <View style={st.cardMeta}>
                                        <View style={st.metaItem}>
                                            <Ionicons name="barcode-outline" size={14} color={T.textMuted} />
                                            <Text style={st.metaText}>{item.reference || 'No SKU'}</Text>
                                        </View>
                                        <View style={st.metaItem}>
                                            <Ionicons name="eye-outline" size={14} color={T.textMuted} />
                                            <Text style={st.metaText}>Target: {item.stock_alert_threshold || 0}</Text>
                                        </View>
                                    </View>

                                    <View style={st.cardGmsList}>
                                        <Ionicons name="business-outline" size={14} color={T.textMuted} />
                                        <Text style={st.metaText} numberOfLines={1}>
                                            {item.gms_list?.length ? item.gms_list.map(g => g.name).join(', ') : 'No stores assigned'}
                                        </Text>
                                    </View>

                                    <View style={st.cardActions}>
                                        <TouchableOpacity style={st.editBtn} onPress={() => openEdit(item)}>
                                            <Ionicons name="create-outline" size={16} color={T.primary} />
                                            <Text style={[st.actionText, { color: T.text }]}>Edit</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity 
                                            style={st.deleteBtn} 
                                            onPress={() => {
                                                if (confirm(`Delete ${item.name}?`)) ArticleService.delete(item.id).then(loadData);
                                            }}
                                        >
                                            <Ionicons name="trash-outline" size={16} color={T.danger} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </WebCard>
                        ))
                    )}
                </View>
            )}

            {/* Add/Edit Modal */}
            <Modal visible={modalVisible} transparent animationType="fade">
                <View style={st.modalOverlay}>
                    <View style={[st.modalContent, { backgroundColor: T.card, borderColor: T.border }]}>
                        <View style={st.modalHeader}>
                            <Text style={[st.modalTitle, { color: T.text }]}>{editing ? 'Edit Product' : 'Add New Product'}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color={T.textMuted} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={st.modalBody}>
                            <View style={st.row}>
                                <View style={[st.field, {flex: 2}]}>
                                    <Text style={[st.label, { color: T.text }]}>Product Name *</Text>
                                    <TextInput
                                        style={[st.input, { color: T.text, borderColor: T.border, backgroundColor: T.surface }]}
                                        value={form.name}
                                        onChangeText={v => setForm(f => ({ ...f, name: v }))}
                                        placeholder="Enter product name"
                                    />
                                </View>
                                <View style={[st.field, {flex: 1}]}>
                                    <Text style={[st.label, { color: T.text }]}>Status</Text>
                                    <TouchableOpacity 
                                        style={[st.toggleBtn, { backgroundColor: form.is_active ? T.success + '20' : T.danger + '20', borderColor: form.is_active ? T.success : T.danger }]}
                                        onPress={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                                    >
                                        <Text style={{ color: form.is_active ? T.success : T.danger, fontWeight: '600' }}>
                                            {form.is_active ? 'ACTIVE' : 'INACTIVE'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={st.row}>
                                <View style={st.field}>
                                    <Text style={[st.label, { color: T.text }]}>Brand</Text>
                                    <select 
                                        style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text, padding: 12, borderRadius: 12, outline: 'none' }}
                                        value={form.brand}
                                        onChange={(e) => setForm(f => ({ ...f, brand: e.target.value }))}
                                    >
                                        {TUNISIAN_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                                    </select>
                                </View>
                                <View style={st.field}>
                                    <Text style={[st.label, { color: T.text }]}>Category</Text>
                                    <TextInput
                                        style={[st.input, { color: T.text, borderColor: T.border, backgroundColor: T.surface }]}
                                        value={form.category}
                                        onChangeText={v => setForm(f => ({ ...f, category: v }))}
                                        placeholder="Dairy, Snacks, etc."
                                    />
                                </View>
                            </View>

                            <View style={st.row}>
                                <View style={st.field}>
                                    <Text style={[st.label, { color: T.text }]}>SKU / Reference</Text>
                                    <TextInput
                                        style={[st.input, { color: T.text, borderColor: T.border, backgroundColor: T.surface }]}
                                        value={form.reference}
                                        onChangeText={v => setForm(f => ({ ...f, reference: v }))}
                                        placeholder="SKU-123"
                                    />
                                </View>
                                <View style={st.field}>
                                    <Text style={[st.label, { color: T.text }]}>Barcode</Text>
                                    <TextInput
                                        style={[st.input, { color: T.text, borderColor: T.border, backgroundColor: T.surface }]}
                                        value={form.barcode}
                                        onChangeText={v => setForm(f => ({ ...f, barcode: v }))}
                                        placeholder="EAN-13"
                                    />
                                </View>
                            </View>

                            <View style={st.row}>
                                <View style={st.field}>
                                    <Text style={[st.label, { color: T.text }]}>Facing Target</Text>
                                    <TextInput
                                        style={[st.input, { color: T.text, borderColor: T.border, backgroundColor: T.surface }]}
                                        value={String(form.stock_alert_threshold)}
                                        onChangeText={v => setForm(f => ({ ...f, stock_alert_threshold: Number(v) || 0 }))}
                                        keyboardType="numeric"
                                    />
                                </View>
                            </View>

                            <View style={st.field}>
                                <Text style={[st.label, { color: T.text }]}>Description</Text>
                                <TextInput
                                    style={[st.input, { color: T.text, borderColor: T.border, backgroundColor: T.surface, height: 80 }]}
                                    value={form.description}
                                    onChangeText={v => setForm(f => ({ ...f, description: v }))}
                                    multiline
                                />
                            </View>

                            {/* Store Assignment */}
                            <View style={st.field}>
                                <Text style={[st.label, { color: T.text }]}>Assign to Stores (GMS)</Text>
                                <View style={st.gmsGrid}>
                                    {stores.map(store => (
                                        <TouchableOpacity 
                                            key={store.id}
                                            onPress={() => toggleGmsInForm(store.id)}
                                            style={[st.gmsItem, { 
                                                backgroundColor: form.gms_ids.includes(store.id) ? T.primary + '20' : T.surface,
                                                borderColor: form.gms_ids.includes(store.id) ? T.primary : T.border
                                            }]}
                                        >
                                            <Ionicons 
                                                name={form.gms_ids.includes(store.id) ? "checkbox" : "square-outline"} 
                                                size={16} 
                                                color={form.gms_ids.includes(store.id) ? T.primary : T.textMuted} 
                                            />
                                            <Text style={[st.gmsText, { color: form.gms_ids.includes(store.id) ? T.text : T.textMuted }]}>
                                                {store.name}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <WebButton 
                                label={editing ? "Update Product" : "Create Product"} 
                                onPress={handleSave} 
                                loading={saving}
                                style={{ marginTop: 24, paddingVertical: 16 }}
                            />
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </AdminWebLayout>
    );
}

const st = StyleSheet.create({
    statsGrid: { flexDirection: 'row', gap: 20, marginBottom: 32 },
    statCard: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 24 },
    statVal: { fontSize: 24, fontWeight: '700', color: '#fff' },
    statLab: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 },
    
    toolbar: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
    searchContainer: { flexDirection: 'row', gap: 12, flex: 1 },
    searchInputWrapper: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, flex: 1 },
    searchInput: { flex: 1, paddingVertical: 12, marginLeft: 12, outlineStyle: 'none' } as any,
    filterSelect: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, width: 200 },
    
    secondaryBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    secondaryBtnText: { color: '#fff', fontWeight: '600' },
    
    catScroll: { marginBottom: 32 },
    catChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginRight: 10 },
    catChipText: { fontSize: 13, fontWeight: '600' },
    
    productGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 20 },
    productCard: { width: '31.5%', marginBottom: 10 },
    cardHeaderInfo: { height: 80, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
    cardIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
    cardBadgeContainerAlt: { },
    
    cardContent: { padding: 20 },
    cardName: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
    cardSub: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 16 },
    cardPrice: { fontSize: 16, fontWeight: '700' },
    
    cardMeta: { flexDirection: 'row', gap: 20, marginBottom: 12 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    metaText: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
    
    cardGmsList: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20, backgroundColor: 'rgba(255,255,255,0.03)', padding: 8, borderRadius: 8 },
    
    cardActions: { flexDirection: 'row', gap: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 16 },
    editBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)' },
    actionText: { fontSize: 13, fontWeight: '600' },
    deleteBtn: { padding: 10, borderRadius: 10, backgroundColor: 'rgba(255,75,75,0.1)', justifyContent: 'center', alignItems: 'center' },
    
    emptyState: { width: '100%', padding: 100, alignItems: 'center', justifyContent: 'center' },
    
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 40 },
    modalContent: { width: '100%', maxWidth: 700, borderRadius: 24, borderWidth: 1, overflow: 'hidden' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
    modalTitle: { fontSize: 20, fontWeight: '700' },
    modalBody: { padding: 24, maxHeight: '80vh' } as any,
    
    row: { flexDirection: 'row', gap: 16, marginBottom: 20 },
    field: { flex: 1 },
    label: { fontSize: 13, fontWeight: '600', marginBottom: 8, opacity: 0.7 },
    input: { padding: 12, borderRadius: 12, borderWidth: 1, fontSize: 14, outlineStyle: 'none' } as any,
    toggleBtn: { padding: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
    
    gmsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
    gmsItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
    gmsText: { fontSize: 13, fontWeight: '500' }
});
