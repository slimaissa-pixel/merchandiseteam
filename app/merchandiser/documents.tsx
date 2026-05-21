
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomNav } from '@/components/ui/BottomNav';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Header } from '@/components/ui/Header';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { DesignTokens, getColors } from '@/constants/designSystem';
import { MERCHANDISER_NAV_ITEMS } from '@/constants/navigation';
import { useTheme } from '@/context/ThemeContext';
import { DocumentService } from '@/services/document.service';
import { StorageKeys, StorageService } from '@/services/storage.service';

export default function MerchandiserDocuments() {
    const router = useRouter();
    const { theme } = useTheme();
    const colors = getColors(theme);
    const [downloadingId, setDownloadingId] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState('All');
    const [documents, setDocuments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchDocuments = useCallback(async () => {
        try {
            setLoading(true);
            const token = await StorageService.getItem(StorageKeys.USER_TOKEN);
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
        const fileName = `${doc.name}.${doc.type}`;
        await DocumentService.downloadAndShare(doc.url, fileName);
        setDownloadingId(null);
    };

    const getFileIcon = (type: string) => {
        switch (type) {
            case 'pdf': return { name: 'document-text', color: colors.danger };
            case 'xlsx': return { name: 'grid', color: colors.success };
            case 'docx': return { name: 'document', color: colors.primary };
            default: return { name: 'document-outline', color: colors.secondary };
        }
    };

    const filteredDocs = activeTab === 'All'
        ? documents
        : documents.filter(d => d.category === activeTab);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <Header
                title="Documents"
                subtitle="Shared Files & Resources"
                rightIcon="refresh-outline"
                onRightIconPress={fetchDocuments}
                showBack
            />

            <View style={styles.tabsContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
                    {['All', 'Catalog', 'Guidelines', 'Templates', 'Forms'].map((cat) => (
                        <TouchableOpacity
                            key={cat}
                            onPress={() => setActiveTab(cat)}
                            style={[
                                styles.tab,
                                activeTab === cat && { backgroundColor: colors.primary }
                            ]}
                        >
                            <Text style={[
                                styles.tabText,
                                { color: activeTab === cat ? '#fff' : colors.textSecondary }
                            ]}>
                                {cat}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <SectionHeader title={`${activeTab} Resources`} />
                {loading ? (
                    <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
                ) : filteredDocs.length === 0 ? (
                    <View style={{ padding: 40, alignItems: 'center' }}>
                        <Ionicons name="document-outline" size={48} color={colors.textSecondary} />
                        <Text style={{ ...DesignTokens.typography.caption, color: colors.textSecondary, marginTop: 12 }}>No documents found.</Text>
                    </View>
                ) : (
                    filteredDocs.map((doc) => {
                        const icon = getFileIcon(doc.type);
                        return (
                            <Card key={doc.id} style={styles.docCard} elevation="sm">
                                <View style={[styles.docIcon, { backgroundColor: icon.color + '15' }]}>
                                    <Ionicons name={icon.name as any} size={24} color={icon.color} />
                                </View>
                                <View style={styles.docInfo}>
                                    <Text style={[styles.docName, { color: colors.text }]}>{doc.name}</Text>
                                    <Text style={[styles.docMeta, { color: colors.textSecondary }]}>
                                        {doc.type.toUpperCase()} • {doc.size} • {new Date(doc.created_at).toLocaleDateString()}
                                    </Text>
                                </View>
                                <View style={{ flexDirection: 'row', gap: 8 }}>
                                    <Button
                                        title=""
                                        variant="ghost"
                                        onPress={() => {
                                            if (doc.url) Linking.openURL(doc.url).catch(() => Alert.alert('Error', 'Could not open document'));
                                        }}
                                        style={styles.actionBtn}
                                        icon="eye-outline"
                                    />
                                    <Button
                                        title=""
                                        variant="ghost"
                                        onPress={() => handleDownload(doc)}
                                        disabled={downloadingId !== null}
                                        style={styles.actionBtn}
                                        icon={downloadingId === doc.id ? undefined : "download-outline"}
                                    >
                                        {downloadingId === doc.id && (
                                            <ActivityIndicator size="small" color={colors.primary} />
                                        )}
                                    </Button>
                                </View>
                            </Card>
                        );
                    })
                )}
            </ScrollView>

            <BottomNav items={MERCHANDISER_NAV_ITEMS} activeRoute="/merchandiser/documents" />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    tabsContainer: { paddingVertical: DesignTokens.spacing.md },
    tabsScroll: { paddingHorizontal: DesignTokens.spacing.lg, gap: DesignTokens.spacing.sm },
    tab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    tabText: { ...DesignTokens.typography.caption, fontWeight: '700' },
    scroll: { paddingHorizontal: DesignTokens.spacing.lg, paddingBottom: 100 },
    docCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: DesignTokens.spacing.md,
        padding: DesignTokens.spacing.md,
        marginBottom: DesignTokens.spacing.sm,
    },
    docIcon: { width: 52, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    docInfo: { flex: 1, gap: 2 },
    docName: { ...DesignTokens.typography.bodyBold, fontSize: 14 },
    docMeta: { ...DesignTokens.typography.caption, fontSize: 11 },
    actionBtn: { width: 44, height: 44, padding: 0 },
});