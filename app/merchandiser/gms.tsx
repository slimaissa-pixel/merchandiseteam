import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomNav } from '@/components/ui/BottomNav';
import { Card, StatCard } from '@/components/ui/Card';
import { Header } from '@/components/ui/Header';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { DesignTokens, getColors } from '@/constants/designSystem';
import { MERCHANDISER_NAV_ITEMS } from '@/constants/navigation';
import { useTheme } from '@/context/ThemeContext';
import { Fonts } from '@/hooks/useFonts';
import { Button } from '@/components/ui/Button';
import { GMS, GMSService } from '@/services/gms.service';

export default function MerchandiserGMS() {
    const router = useRouter();
    const { theme } = useTheme();
    const colors = getColors(theme);

    const [stores, setStores] = useState<GMS[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [isSearchVisible, setIsSearchVisible] = useState(false);
    const [selectedStore, setSelectedStore] = useState<GMS | null>(null);
    const [showStoreDetails, setShowStoreDetails] = useState(false);

    useEffect(() => {
        loadStores();
    }, []);

    const loadStores = async () => {
        if (!refreshing) setLoading(true);
        try {
            const data = await GMSService.getAll();
            setStores(data);
        } catch (error) {
            console.error('Failed to load stores:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadStores();
    };

    const filteredStores = stores.filter(store =>
        store.name.toLowerCase().includes(searchText.toLowerCase()) ||
        store.city?.toLowerCase().includes(searchText.toLowerCase())
    );

    const handleStoreClick = (store: GMS) => {
        setSelectedStore(store);
        setShowStoreDetails(true);
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <Header
                title="Assigned Stores"
                subtitle="Your route and locations"
                rightIcon="map-outline"
                onRightIconPress={() => router.push('/merchandiser/map')}
                secondRightIcon="search-outline"
                onSecondRightIconPress={() => setIsSearchVisible(!isSearchVisible)}
                showBack
            />

            {isSearchVisible && (
                <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
                    <Ionicons name="search" size={20} color={colors.textMuted} />
                    <TextInput
                        style={[styles.searchInput, { color: colors.text }]}
                        placeholder="Search stores..."
                        placeholderTextColor={colors.textMuted}
                        value={searchText}
                        onChangeText={setSearchText}
                        autoFocus
                    />
                    {searchText !== '' && (
                        <Ionicons
                            name="close-circle"
                            size={20}
                            color={colors.textMuted}
                            onPress={() => setSearchText('')}
                        />
                    )}
                </View>
            )}

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                }
            >
                <View style={styles.statsRow}>
                    <StatCard
                        label="TOTAL STORES"
                        value={stores.length.toString()}
                        icon="storefront"
                        color={colors.primary}
                    />
                    <StatCard
                        label="PENDING"
                        value={stores.length.toString()} // Dummy value for pending
                        icon="time"
                        color={colors.warning}
                    />
                </View>

                <SectionHeader title="Store List" />

                {filteredStores.map(store => (
                    <Card key={store.id} style={styles.storeCard} onPress={() => handleStoreClick(store)}>
                        <View style={[styles.iconBox, { backgroundColor: colors.primary + '15' }]}>
                            <Ionicons name="storefront" size={24} color={colors.primary} />
                        </View>
                        <View style={styles.storeInfo}>
                            <Text style={[styles.storeName, { color: colors.text }]}>{store.name}</Text>
                            <Text style={[styles.storeAddress, { color: colors.textSecondary }]}>{store.address}</Text>
                            <View style={styles.tagRow}>
                                <View style={[styles.tag, { backgroundColor: colors.surfaceSecondary }]}>
                                    <Ionicons name="location" size={12} color={colors.textSecondary} />
                                    <Text style={[styles.tagText, { color: colors.textSecondary }]}>{store.city}</Text>
                                </View>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.border} />
                    </Card>
                ))}
            </ScrollView>

            {/* Store Details Modal */}
            <Modal visible={showStoreDetails} transparent animationType="slide" onRequestClose={() => setShowStoreDetails(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>Store Details</Text>
                            <TouchableOpacity onPress={() => setShowStoreDetails(false)}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        {selectedStore && (
                            <ScrollView showsVerticalScrollIndicator={false}>
                                <View style={styles.detailSection}>
                                    <Text style={[styles.sectionTitle, { color: colors.text }]}>General Info</Text>
                                    <View style={[styles.infoCard, { backgroundColor: colors.surfaceSecondary }]}>
                                        <View style={styles.infoRow}>
                                            <Ionicons name="storefront" size={16} color={colors.textSecondary} />
                                            <Text style={[styles.infoText, { color: colors.text }]}>{selectedStore.name}</Text>
                                        </View>
                                        <View style={styles.infoRow}>
                                            <Ionicons name="location" size={16} color={colors.textSecondary} />
                                            <Text style={[styles.infoText, { color: colors.text }]}>{selectedStore.address}, {selectedStore.city}</Text>
                                        </View>
                                        <View style={styles.infoRow}>
                                            <Ionicons name="map" size={16} color={colors.textSecondary} />
                                            <Text style={[styles.infoText, { color: colors.text }]}>GPS: {selectedStore.latitude.toFixed(4)}, {selectedStore.longitude.toFixed(4)}</Text>
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.detailSection}>
                                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Articles Assigned</Text>
                                    <View style={[styles.infoCard, { backgroundColor: colors.surfaceSecondary }]}>
                                        <Text style={[styles.infoText, { color: colors.textSecondary, fontStyle: 'italic' }]}>All standard catalog articles are assigned to this store.</Text>
                                    </View>
                                </View>

                                <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
                                    <Button
                                        title="Start Visit"
                                        icon="play-circle"
                                        variant="success"
                                        style={{ flex: 1 }}
                                        onPress={() => {
                                            setShowStoreDetails(false);
                                            router.push({
                                                pathname: '/merchandiser/visits',
                                                params: { storeId: selectedStore.id.toString(), storeName: selectedStore.name },
                                            });
                                        }}
                                    />
                                    <Button
                                        title="View Map"
                                        icon="map"
                                        variant="outline"
                                        style={{ flex: 1 }}
                                        onPress={() => {
                                            setShowStoreDetails(false);
                                            router.push({
                                                pathname: '/merchandiser/map',
                                                params: {
                                                    lat: selectedStore.latitude.toString(),
                                                    lng: selectedStore.longitude.toString(),
                                                    storeName: selectedStore.name,
                                                    zoom: '16',
                                                },
                                            });
                                        }}
                                    />
                                </View>
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>

            <BottomNav items={MERCHANDISER_NAV_ITEMS} activeRoute="/merchandiser/gms" />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: DesignTokens.spacing.lg, paddingBottom: 100 },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: DesignTokens.spacing.lg,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 14,
        marginTop: 10,
        gap: 12,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    searchInput: { flex: 1, fontSize: 15, fontFamily: Fonts.bodyMedium },
    statsRow: { flexDirection: 'row', gap: DesignTokens.spacing.sm, marginBottom: DesignTokens.spacing.md },
    storeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: DesignTokens.spacing.md,
        marginBottom: DesignTokens.spacing.sm,
        gap: DesignTokens.spacing.md,
    },
    iconBox: {
        width: 52,
        height: 52,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    storeInfo: { flex: 1, gap: 2 },
    storeName: { ...DesignTokens.typography.bodyBold, fontSize: 16 },
    storeAddress: { ...DesignTokens.typography.caption, marginTop: 2 },
    tagRow: { flexDirection: 'row', marginTop: 6 },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    tagText: { ...DesignTokens.typography.tiny, fontFamily: Fonts.bodyBold },
    navBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: '85%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { ...DesignTokens.typography.h2 },
    detailSection: { marginTop: 16 },
    sectionTitle: { ...DesignTokens.typography.bodyBold, marginBottom: 8 },
    infoCard: { padding: 16, borderRadius: 12, gap: 12 },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    infoText: { ...DesignTokens.typography.body },
});
