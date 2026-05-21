import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomNav } from '@/components/ui/BottomNav';
import { getColors } from '@/constants/designSystem';
import { SUPERVISOR_NAV_ITEMS } from '@/constants/navigation';
import { useTheme } from '@/context/ThemeContext';
import { Fonts } from '@/hooks/useFonts';
import { DocumentService } from '@/services/document.service';
import { StorageKeys, StorageService } from '@/services/storage.service';

// Helper to get dynamic icon and color
const getFileIcon = (type: string) => {
    switch (type.toLowerCase()) {
        case 'pdf': return { name: 'document-text', color: '#ef4444' };
        case 'xlsx': return { name: 'grid', color: '#10b981' };
        case 'docx': return { name: 'document', color: '#3b82f6' };
        case 'zip': return { name: 'folder', color: '#f59e0b' };
        default: return { name: 'document-outline', color: '#64748b' };
    }
};

const categories = ['All', 'Training', 'Catalog', 'Templates', 'Compliance', 'Branding'];

export default function DocumentsPage() {
    const router = useRouter();
    const { theme } = useTheme();
    const colors = getColors(theme);
    const [downloadingId, setDownloadingId] = useState<number | null>(null);
    const [documents, setDocuments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('All');

    const fetchDocuments = useCallback(async () => {
        try {
            setLoading(true);
            const m = await import('@/services/apiClient');
            const res = await m.default.get('/api/documents/', { params: { limit: 100 } });
            setDocuments(res.data || []);
        } catch (error) {
            console.error('Failed to load documents:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDocuments();
    }, [fetchDocuments]);

    const handleDownload = async (doc: any) => {
        setDownloadingId(doc.id);
        const fileName = `${doc.name}.${doc.type.toLowerCase()}`;
        await DocumentService.downloadAndShare(doc.url, fileName);
        setDownloadingId(null);
    };

    const renderDocument = (item: any) => {
        const iconInfo = getFileIcon(item.type);
        return (
            <View
                key={item.id}
                style={[styles.card, { backgroundColor: colors.surface }]}
            >
                <View style={[styles.iconContainer, { backgroundColor: iconInfo.color + '20' }]}>
                    <Ionicons name={iconInfo.name as any} size={24} color={iconInfo.color} />
                </View>
                <View style={styles.cardInfo}>
                    <Text style={[styles.docTitle, { color: colors.text }]} numberOfLines={1}>
                        {item.name}
                    </Text>
                    <View style={styles.metaRow}>
                        <View style={[styles.typeBadge, { backgroundColor: colors.background }]}>
                            <Text style={[styles.typeText, { color: colors.textSecondary }]}>{item.type.toUpperCase()}</Text>
                        </View>
                        <Text style={[styles.metaText, { color: colors.textSecondary }]}>{item.size}</Text>
                        <Text style={[styles.metaText, { color: colors.textSecondary }]}>•</Text>
                        <Text style={[styles.metaText, { color: colors.textSecondary }]}>{new Date(item.created_at).toLocaleDateString()}</Text>
                    </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: colors.background }]}
                        onPress={() => {
                            if (item.url) Linking.openURL(item.url).catch(() => Alert.alert('Error', 'Could not open document'));
                        }}
                    >
                        <Ionicons name="eye-outline" size={18} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                        onPress={() => handleDownload(item)}
                        disabled={downloadingId !== null}
                    >
                        {downloadingId === item.id ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Ionicons name="download-outline" size={18} color="#fff" />
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={[styles.header, { backgroundColor: colors.surface }]}>
                    <View style={styles.headerRow}>
                        <TouchableOpacity onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={24} color={colors.text} />
                        </TouchableOpacity>
                        <Text style={[styles.headerTitle, { color: colors.text }]}>Documents</Text>
                        <TouchableOpacity>
                            <Ionicons name="search" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>
                    <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                        Access guides, catalogs, and training materials
                    </Text>
                </View>

                {/* Categories */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoriesContainer}
                >
                    {categories.map((cat, index) => (
                        <TouchableOpacity
                            key={cat}
                            onPress={() => setActiveTab(cat)}
                            style={[
                                styles.categoryChip,
                                {
                                    backgroundColor: activeTab === cat ? colors.primary : colors.surface,
                                    borderColor: colors.border,
                                }
                            ]}
                        >
                            <Text style={[
                                styles.categoryText,
                                { color: activeTab === cat ? '#fff' : colors.text }
                            ]}>
                                {cat}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Stats */}
                <View style={styles.statsRow}>
                    <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
                        <Ionicons name="document" size={20} color={colors.primary} />
                        <Text style={[styles.statValue, { color: colors.text }]}>{documents.length}</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Files</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
                        <Ionicons name="cloud-download" size={20} color="#10b981" />
                        <Text style={[styles.statValue, { color: colors.text }]}>29.9 MB</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Size</Text>
                    </View>
                </View>

                {/* Section Title */}
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Documents</Text>
                </View>

                {/* Documents List */}
                <View style={styles.listContainer}>
                    {loading ? (
                        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
                    ) : (
                        documents
                            .filter(d => activeTab === 'All' || d.category === activeTab)
                            .map(renderDocument)
                    )}
                </View>
            </ScrollView>

            <BottomNav items={SUPERVISOR_NAV_ITEMS} activeRoute="/supervisor/documents" />
        </SafeAreaView>
    );
}


const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    scroll: { paddingBottom: 100 },

    header: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: { fontSize: 20, fontFamily: Fonts.heading },
    headerSubtitle: { fontSize: 13, marginTop: 8, fontFamily: Fonts.body },

    categoriesContainer: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        gap: 10,
    },
    categoryChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 10,
        borderWidth: 1,
    },
    categoryText: { fontSize: 13, fontFamily: Fonts.bodySemiBold },

    statsRow: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 16,
    },
    statCard: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        gap: 6,
    },
    statValue: { fontSize: 18, fontFamily: Fonts.heading },
    statLabel: { fontSize: 11, fontFamily: Fonts.bodySemiBold },

    sectionHeader: {
        paddingHorizontal: 16,
        marginTop: 20,
        marginBottom: 12,
    },
    sectionTitle: { fontSize: 18, fontFamily: Fonts.heading },

    listContainer: {
        paddingHorizontal: 16,
        gap: 12,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        marginBottom: 12,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    cardInfo: { flex: 1 },
    docTitle: { fontSize: 15, fontFamily: Fonts.bodySemiBold },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 6,
    },
    typeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    typeText: { fontSize: 10, fontFamily: Fonts.bodyBold },
    metaText: { fontSize: 11, fontFamily: Fonts.body },
    actionBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },

});