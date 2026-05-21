import { BottomNav } from '@/components/ui/BottomNav';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Header } from '@/components/ui/Header';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { DesignTokens, getColors } from '@/constants/designSystem';
import { MERCHANDISER_NAV_ITEMS } from '@/constants/navigation';
import { useTheme } from '@/context/ThemeContext';
import { Fonts } from '@/hooks/useFonts';
import { Article, ArticleService } from '@/services/article.service';
import { DetectionResult, DetectionService } from '@/services/detection.service';
import { GMS, GMSService } from '@/services/gms.service';
import { LocationService } from '@/services/location.service';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MerchandiserTasks() {
    const router = useRouter();
    const { theme } = useTheme();
    const colors = getColors(theme);
    const params = useLocalSearchParams<{ storeId?: string }>();
    
    const [loading, setLoading] = useState(true);
    const [activeVisit, setActiveVisit] = useState<any>(null);
    const [store, setStore] = useState<GMS | null>(null);
    const [articles, setArticles] = useState<Article[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [endingVisit, setEndingVisit] = useState(false);
    const [timer, setTimer] = useState('00:00:00');
    const [activeTab, setActiveTab] = useState('Articles');
    const [ruptureIds, setRuptureIds] = useState<number[]>([]);
    const [notes, setNotes] = useState('');
    const [savingNotes, setSavingNotes] = useState(false);
    
    // Analyze states
    const [originalImageUri, setOriginalImageUri] = useState<string | null>(null);
    const [visualizedImage, setVisualizedImage] = useState<string | null>(null);
    const [displayMode, setDisplayMode] = useState<'original' | 'visualized'>('original');
    const [detections, setDetections] = useState<DetectionResult[]>([]);
    const [isScanning, setIsScanning] = useState(false);
    const [processingTime, setProcessingTime] = useState<number | null>(null);
    const [hasBeforeAfter, setHasBeforeAfter] = useState(false);
    
    // Import apiClient dynamically to prevent circular dependencies if any
    const getApiClient = () => require('@/services/apiClient').default;
    // Mock products based on user screenshot
    const [mockArticles] = useState<any[]>([
        { id: 1, name: 'Warda Bidha Spaghetti N°3', subtitle: '500g • Semoule dure', price: '2.450 TND' },
        { id: 2, name: 'Warda Bidha Spaghetti N°5', subtitle: '500g • Cuisson rapide', price: '2.600 TND' },
        { id: 3, name: 'Warda Bidha Penne Rigate', subtitle: '400g • Format familial', price: '2.950 TND' },
        { id: 4, name: 'Warda Bidha Coquillettes', subtitle: '500g • Pates fines', price: '2.300 TND' },
        { id: 5, name: 'Warda Bidha Farfalle', subtitle: '400g • Format Papillon', price: '2.850 TND' },
    ]);

    const [refreshing, setRefreshing] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const startTimer = (startTime: number) => {
        if (timerRef.current) clearInterval(timerRef.current);
        const update = () => {
            const diff = Date.now() - startTime;
            const hours = Math.floor(diff / 3600000);
            const minutes = Math.floor((diff % 3600000) / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);
            const format = (n: number) => n.toString().padStart(2, '0');
            setTimer(`${format(hours)}:${format(minutes)}:${format(seconds)}`);
        };
        update();
        timerRef.current = setInterval(update, 1000);
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const session = await LocationService.getActiveSession();
            if (session.visit) {
                setActiveVisit(session.visit);
                startTimer(session.visit.startTime);
                
                const allStores = await GMSService.getAll();
                const s = allStores.find(st => st.id === session.visit?.gmsId);
                if (s) {
                    setStore(s);
                    const data = await ArticleService.getAll(s.id);
                    setArticles(data);
                }
                
                // Check Before/After completion from flags
                console.log("[DEBUG] Loaded visit data:", session.visit.id, "proof_before:", session.visit.proof_before, "proof_after:", session.visit.proof_after);
                setHasBeforeAfter(session.visit.proof_before && session.visit.proof_after);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadData();
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadData();
            return () => { if (timerRef.current) clearInterval(timerRef.current); };
        }, [])
    );

    const toggleRupture = (id: number) => {
        setRuptureIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleSaveNotes = () => {
        setSavingNotes(true);
        setTimeout(() => {
            setSavingNotes(false);
            Alert.alert('Success', 'Observations saved.');
        }, 1000);
    };

    const handleEndVisit = async () => {
        if (!hasBeforeAfter) {
            Alert.alert('Validation Required', 'Before and After visit submissions are required before ending the visit.');
            return;
        }

        Alert.alert(
            'Finish Visit?',
            'Are you sure you want to complete this visit? Ensure all tasks and photos are recorded.',
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Finish', 
                    style: 'destructive',
                    onPress: async () => {
                        setEndingVisit(true);
                        try {
                            const success = await LocationService.endVisit();
                            if (success) {
                                Alert.alert('Visit Finished', 'The visit has been successfully completed.');
                                router.push('/merchandiser/dashboard');
                            }
                        } catch (e: any) {
                            Alert.alert('Error', e.message);
                        } finally {
                            setEndingVisit(false);
                        }
                    }
                }
            ]
        );
    };

    const handlePickImage = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Camera permission is required.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled) {
            const uri = result.assets[0].uri;
            setOriginalImageUri(uri);
            setVisualizedImage(null);
            setDetections([]);
            setDisplayMode('original');
            runDetection(uri);
        }
    };

    const handlePickFromLibrary = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled) {
            const uri = result.assets[0].uri;
            setOriginalImageUri(uri);
            setVisualizedImage(null);
            setDetections([]);
            setDisplayMode('original');
            runDetection(uri);
        }
    };

    const runDetection = async (uri: string) => {
        setIsScanning(true);
        setProcessingTime(null);
        try {
            const res = await DetectionService.detect(uri, true);
            if (res) {
                if (res.predictions) setDetections(res.predictions);
                if (res.image_base64) setVisualizedImage(res.image_base64);
                if (res.processing_time) setProcessingTime(res.processing_time);
                
                if (res.predictions && res.predictions.length === 0) {
                    Alert.alert('Analysis Result', 'No specific products detected in this area.');
                }
            } else {
                Alert.alert('Service Error', 'Failed to reach the AI model. Please check if the service is running.');
            }
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'An error occurred during analysis.');
        } finally {
            setIsScanning(false);
        }
    };


    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </SafeAreaView>
        );
    }

    if (!activeVisit || !store) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <Header title="Visit Store" showBack />
                <View style={styles.emptyState}>
                    <Ionicons name="storefront-outline" size={64} color={colors.border} />
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No active store visit.</Text>
                    <Button title="Go to Dashboard" onPress={() => router.push('/merchandiser/dashboard')} style={{ marginTop: 20 }} />
                </View>
                <BottomNav items={MERCHANDISER_NAV_ITEMS} activeRoute="/merchandiser/visits" />
            </SafeAreaView>
        );
    }

    const EVENT_GRID = [
        { id: 'anomalie', label: 'Anomaly', icon: 'alert-circle-outline', type: 'ion' },
        { id: 'stock', label: 'Rupture', icon: 'cart-outline', type: 'ion' },
        { id: 'facing', label: 'Product Facing', icon: 'view-grid-plus-outline', type: 'mci' },
        { id: 'ajout', label: 'Before/After', icon: 'camera-outline', type: 'ion' },
        { id: 'alerte', label: 'Competitor Alert', icon: 'bell-outline', type: 'mci' },
    ];

    const displayArticles = searchQuery 
        ? mockArticles.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()))
        : mockArticles;
        
    const executionPercent = mockArticles.length > 0 ? Math.round(( (mockArticles.length - ruptureIds.length) / mockArticles.length) * 100) : 0;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <Header title="Visit Store" showBack />

            <ScrollView 
                contentContainerStyle={styles.scroll} 
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                }
            >
                {/* 1. Compact Header Area */}
                <Card style={[styles.compactHeader, { backgroundColor: colors.surfaceSecondary + '30' }]}>
                    <View style={styles.headerInfo}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Ionicons name="storefront" size={18} color={colors.primary} />
                            <Text style={[styles.headerName, { color: colors.text }]} numberOfLines={1}>
                                {store.name} {store.type ? `(${store.type})` : ''}
                            </Text>
                        </View>
                        <View style={styles.addressRow}>
                            <Text style={[styles.storeAddress, { color: colors.textSecondary }]} numberOfLines={1}>
                                {store.address || store.city}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.headerRight}>
                        <View style={styles.headerBadgeColumn}>
                            <View style={[styles.timerBadge, { backgroundColor: colors.primary + '15' }]}>
                                <Text style={[styles.headerTimer, { color: colors.primary }]}>{timer}</Text>
                            </View>
                            <Text style={styles.badgeSubLabel}>Time on Site</Text>
                        </View>
                        <View style={styles.headerBadgeColumn}>
                            <Text style={[styles.executionText, { color: colors.text }]}>{executionPercent}%</Text>
                            <Text style={styles.badgeSubLabel}>Execution</Text>
                        </View>
                    </View>
                </Card>

                <View style={[styles.tabsContainer, { backgroundColor: colors.surfaceSecondary + '50' }]}>
                    {['Products', 'Events', 'Analyze', 'Store Info'].map(tab => {
                        const isActive = activeTab === tab || (activeTab === 'Articles' && tab === 'Products');
                        return (
                            <TouchableOpacity 
                                key={tab} 
                                style={[
                                    styles.tabItem, 
                                    isActive && [styles.tabItemActive, { backgroundColor: theme === 'light' ? '#fff' : colors.surface }]
                                ]} 
                                onPress={() => setActiveTab(tab === 'Products' ? 'Articles' : tab)}
                            >
                                <Text style={[styles.tabText, { color: isActive ? colors.primary : colors.textSecondary }]}>{tab}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {activeTab === 'Events' && (
                    <View style={styles.eventGrid}>
                        {EVENT_GRID.map(item => (
                            <TouchableOpacity 
                                key={item.id} 
                                style={[styles.gridItem, { backgroundColor: colors.surface }]}
                                onPress={() => {
                                    if (item.id === 'anomalie') router.push('/merchandiser/events/anomaly');
                                    else if (item.id === 'stock') router.push('/merchandiser/events/stock-issue');
                                    else if (item.id === 'ajout') router.push('/merchandiser/events/before-after');
                                    else if (item.id === 'alerte') router.push('/merchandiser/events/competitor-alert');
                                    else if (item.id === 'facing') router.push('/merchandiser/events/facing-change');
                                    else Alert.alert('Info', `${item.label} feature coming soon!`);
                                }}
                            >
                                <View style={[styles.gridIconBox, { backgroundColor: colors.primary + '10' }]}>
                                    {item.type === 'ion' ? (
                                        <Ionicons name={item.icon as any} size={28} color={colors.primary} />
                                    ) : (
                                        <MaterialCommunityIcons name={item.icon as any} size={28} color={colors.primary} />
                                    )}
                                </View>
                                <Text style={[styles.gridLabel, { color: colors.text }]}>{item.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {activeTab === 'Analyze' && (
                    <View style={s.analyzeTab}>
                        {!originalImageUri ? (
                            <View style={s.emptyAnalyze}>
                                <View style={[s.analyzeIconCircle, { backgroundColor: colors.primary + '10' }]}>
                                    <Ionicons name="scan-outline" size={48} color={colors.primary} />
                                </View>
                                <Text style={[s.analyzeTitle, { color: colors.text }]}>AI Shelf Analysis</Text>
                                <Text style={[s.analyzeDesc, { color: colors.textSecondary }]}>
                                    Take a photo of the shelf to automatically detect products and check stock status.
                                </Text>
                                <View style={s.analyzeActions}>
                                    <Button 
                                        title="Take Photo" 
                                        onPress={handlePickImage} 
                                        icon="camera-outline" 
                                        style={{ flex: 1 }}
                                    />
                                    <Button 
                                        title="Gallery" 
                                        variant="secondary"
                                        onPress={handlePickFromLibrary} 
                                        icon="image-outline"
                                        style={{ flex: 1 }}
                                    />
                                </View>
                            </View>
                        ) : (
                            <View style={s.analyzeContent}>
                                <Card style={s.imagePreviewCard}>
                                    <Image 
                                        source={{ uri: visualizedImage && displayMode === 'visualized' ? visualizedImage : originalImageUri }}
                                        style={s.previewImage}
                                        contentFit="contain"
                                    />
                                    {isScanning && (
                                        <View style={s.scanningOverlay}>
                                            <ActivityIndicator size="large" color="#fff" />
                                            <Text style={{ color: '#fff', fontWeight: '700', marginTop: 10 }}>Analyzing Shelf...</Text>
                                        </View>
                                    )}
                                    
                                    {!isScanning && visualizedImage && (
                                        <TouchableOpacity 
                                            style={s.toggleVisualize}
                                            onPress={() => setDisplayMode(prev => prev === 'original' ? 'visualized' : 'original')}
                                        >
                                            <Ionicons 
                                                name={displayMode === 'visualized' ? "eye-off-outline" : "eye-outline"} 
                                                size={20} 
                                                color="#fff" 
                                            />
                                            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 12 }}>
                                                {displayMode === 'visualized' ? 'Hide Boxes' : 'Show Detections'}
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                </Card>

                                {detections.length > 0 && (
                                    <View style={s.cleanResultsContainer}>
                                        <Text style={[s.resultsTitle, { color: colors.textSecondary }]}>
                                            DETECTION SUMMARY
                                        </Text>
                                        <View style={s.resultsGrid}>
                                            {Object.entries(
                                                detections.reduce((acc: Record<string, number>, det: DetectionResult) => {
                                                    const key = det.class_name || 'Unknown';
                                                    acc[key] = (acc[key] || 0) + 1;
                                                    return acc;
                                                }, {})
                                            ).map(([name, count], i) => (
                                                <View key={i} style={[s.resultChip, { backgroundColor: colors.surfaceSecondary }]}>
                                                    <View style={[s.chipDot, { backgroundColor: colors.primary }]} />
                                                    <Text style={[s.chipText, { color: colors.text }]}>
                                                        <Text style={{ fontWeight: '800', color: colors.primary }}>{count}</Text> {name}
                                                    </Text>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                )}

                                <Button 
                                    title="New Scan" 
                                    onPress={() => {
                                        setOriginalImageUri(null);
                                        setVisualizedImage(null);
                                        setDetections([]);
                                    }}
                                    variant="secondary"
                                    icon="camera-outline"
                                    style={{ marginTop: 20 }}
                                />
                                </View>
                        )}
                    </View>
                )}


                {activeTab === 'Articles' && (
                    <View style={styles.articlesTab}>
                        <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <Ionicons name="search" size={18} color={colors.textSecondary} />
                            <TextInput 
                                placeholder="Search product..." 
                                placeholderTextColor={colors.textMuted}
                                style={[styles.searchInput, { color: colors.text }]}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                        </View>
                        <View style={s.articleList}>
                            {displayArticles.map(article => {
                                const isRupture = ruptureIds.includes(article.id);
                                return (
                                    <Card key={article.id} style={s.articleItem}>
                                        <View style={s.productIcon}>
                                            <MaterialCommunityIcons name="pasta" size={24} color={colors.warning} />
                                        </View>
                                        <View style={s.articleLeft}>
                                            <Text style={[s.articleName, { color: colors.text }]}>{article.name}</Text>
                                            <Text style={[s.articleSubtitle, { color: colors.textSecondary }]}>{article.subtitle}</Text>
                                            <Text style={[s.articlePrice, { color: colors.primary }]}>{article.price}</Text>
                                        </View>
                                        <TouchableOpacity 
                                            style={[
                                                s.statusPill, 
                                                { backgroundColor: isRupture ? colors.danger + '15' : colors.surfaceSecondary + '50' },
                                                isRupture && { borderColor: colors.danger, borderWidth: 1 }
                                            ]}
                                            onPress={() => toggleRupture(article.id)}
                                        >
                                            <Text style={[s.statusPillText, { color: isRupture ? colors.danger : colors.textSecondary }]}>
                                                {isRupture ? 'OUT OF STOCK' : 'IN STOCK'}
                                            </Text>
                                        </TouchableOpacity>
                                    </Card>
                                );
                            })}
                        </View>
                    </View>
                )}

                {activeTab === 'Store Info' && (
                    <View style={styles.infoTab}>
                        <View style={s.infoRows}>
                            <View style={s.infoRow}>
                                <Text style={[s.infoRowLabel, { color: colors.textSecondary }]}>Scheduled Time</Text>
                                <Text style={[s.infoRowValue, { color: colors.text }]}>12:00 AM</Text>
                            </View>
                            <View style={s.infoRow}>
                                <Text style={[s.infoRowLabel, { color: colors.textSecondary }]}>GPS</Text>
                                <Text style={[s.infoRowValue, { color: colors.primary, fontWeight: '800' }]}>GPS ACTIVE: TRACKING ENABLED</Text>
                            </View>
                            <View style={s.infoRow}>
                                <Text style={[s.infoRowLabel, { color: colors.textSecondary }]}>Progression</Text>
                                <Text style={[s.infoRowValue, { color: colors.text }]}>{executionPercent}%</Text>
                            </View>
                        </View>

                        <SectionHeader title="STORE NOTES" />
                        <Card style={s.notesCard}>
                            <TextInput
                                style={[s.notesInput, { color: colors.text }]}
                                placeholder="Add observations about the store..."
                                placeholderTextColor={colors.textMuted}
                                multiline
                                numberOfLines={6}
                                value={notes}
                                onChangeText={setNotes}
                            />
                        </Card>

                        <Button
                            title="Save Notes"
                            variant="secondary"
                            fullWidth
                            icon="save-outline"
                            loading={savingNotes}
                            onPress={handleSaveNotes}
                            style={s.saveNotesBtn}
                        />
                    </View>
                )}
            </ScrollView>

            <View style={[styles.footer, { borderTopColor: colors.border + '30' }]}>
                <View style={styles.footerStatusRow}>
                    <View style={styles.statusIndicator}>
                        <Ionicons 
                            name={activeVisit?.proof_before ? "checkmark-circle" : "ellipse-outline"} 
                            size={16} 
                            color={activeVisit?.proof_before ? colors.success : colors.textMuted} 
                        />
                        <Text style={[styles.statusText, { color: activeVisit?.proof_before ? colors.success : colors.textSecondary }]}>
                            Before Photo
                        </Text>
                    </View>
                    <View style={styles.statusIndicator}>
                        <Ionicons 
                            name={activeVisit?.proof_after ? "checkmark-circle" : "ellipse-outline"} 
                            size={16} 
                            color={activeVisit?.proof_after ? colors.success : colors.textMuted} 
                        />
                        <Text style={[styles.statusText, { color: activeVisit?.proof_after ? colors.success : colors.textSecondary }]}>
                            After Photo
                        </Text>
                    </View>
                </View>

                {!hasBeforeAfter && (
                    <Text style={[styles.footerHelper, { color: colors.warning }]}>
                        Complete both proofs to unlock "End Visit"
                    </Text>
                )}
                <Button 
                    title="END VISIT" 
                    variant={hasBeforeAfter ? "primary" : "neutral"} 
                    fullWidth 
                    icon={hasBeforeAfter ? "log-out-outline" : "lock-closed-outline"} 
                    loading={endingVisit} 
                    onPress={handleEndVisit} 
                    style={[styles.closeBtn, !hasBeforeAfter && { opacity: 0.7 }]} 
                />
            </View>

            <BottomNav items={MERCHANDISER_NAV_ITEMS} activeRoute="/merchandiser/visits" />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { paddingBottom: 180 },
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    emptyText: { ...DesignTokens.typography.h3, marginTop: 16 },
    compactHeader: {
        marginHorizontal: DesignTokens.spacing.lg,
        marginTop: 10,
        marginBottom: 16,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 16,
        borderWidth: 1,
    },
    headerInfo: { flex: 1, gap: 2 },
    headerName: { fontSize: 16, fontWeight: '800' },
    headerRight: { flexDirection: 'row', gap: 16, alignItems: 'center' },
    headerBadgeColumn: { alignItems: 'center', gap: 2 },
    badgeSubLabel: { fontSize: 9, fontWeight: '600', opacity: 0.5, textTransform: 'uppercase' },
    timerBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    headerTimer: { fontSize: 16, fontWeight: '800', fontFamily: Fonts.mono },
    executionText: { fontSize: 16, fontWeight: '800' },
    addressRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
    storeAddress: { fontSize: 11, fontWeight: '500' },
    tabsContainer: { flexDirection: 'row', marginHorizontal: DesignTokens.spacing.lg, padding: 4, borderRadius: 12, marginBottom: 24 },
    tabItem: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
    tabItemActive: { ...DesignTokens.shadows.sm },
    tabText: { fontSize: 12, fontWeight: '700' },
    eventGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: DesignTokens.spacing.lg, gap: 10 },
    gridItem: { width: '48%', paddingVertical: 14, borderRadius: 16, justifyContent: 'center', alignItems: 'center', ...DesignTokens.shadows.sm },
    gridIconBox: { width: 50, height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    gridLabel: { fontSize: 14, fontWeight: '700', textAlign: 'center' },
    footer: { position: 'absolute', bottom: 80, left: 0, right: 0, padding: DesignTokens.spacing.lg, backgroundColor: 'rgba(255,255,255,0.98)', borderTopWidth: 1 },
    footerStatusRow: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginBottom: 12 },
    statusIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    statusText: { fontSize: 12, fontWeight: '700' },
    footerHelper: { fontSize: 11, fontWeight: '600', textAlign: 'center', marginBottom: 12 },
    closeBtn: { height: 56, borderRadius: 16 },
    articlesTab: { paddingHorizontal: DesignTokens.spacing.lg },
});

const s = StyleSheet.create({
    analyzeTab: { paddingHorizontal: DesignTokens.spacing.lg },
    emptyAnalyze: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 16 },
    analyzeIconCircle: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center' },
    analyzeTitle: { ...DesignTokens.typography.h2, textAlign: 'center' },
    analyzeDesc: { ...DesignTokens.typography.body, textAlign: 'center', opacity: 0.8, paddingHorizontal: 20 },
    analyzeActions: { flexDirection: 'row', gap: 12, marginTop: 10, width: '100%' },
    analyzeContent: { gap: 16 },
    imagePreviewCard: { height: 300, borderRadius: 20, overflow: 'hidden', padding: 0 },
    previewImage: { width: '100%', height: '100%' },
    scanningOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    toggleVisualize: { position: 'absolute', bottom: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.6)', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
    analyzeStats: { flexDirection: 'row', gap: 12 },
    statItem: { flex: 1, padding: 12, borderRadius: 16, alignItems: 'center', justifyContent: 'center', ...DesignTokens.shadows.sm },
    statValue: { fontSize: 20, fontWeight: '800' },
    statLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', marginTop: 2 },
    detectionsList: { gap: 4 },
    detRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, gap: 12 },
    detDot: { width: 8, height: 8, borderRadius: 4 },
    detName: { flex: 1, fontSize: 14, fontWeight: '600' },
    detConf: { fontSize: 12, fontWeight: '700', opacity: 0.7 },
    infoTab: { paddingHorizontal: DesignTokens.spacing.lg },
    articleList: { gap: 10 },
    articleItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 16, gap: 12 },
    productIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: DesignTokens.colors.light.warning + '15', alignItems: 'center', justifyContent: 'center' },
    articleLeft: { flex: 1, gap: 1 },
    articleName: { fontSize: 13, fontWeight: '800' },
    articleSubtitle: { fontSize: 10, fontWeight: '500', opacity: 0.6 },
    articlePrice: { fontSize: 14, fontWeight: '900', marginTop: 2 },
    statusPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, minWidth: 90, alignItems: 'center' },
    statusPillText: { fontSize: 9, fontWeight: '800' },
    
    // Info tab styles
    infoRows: { gap: 12, marginBottom: 20 },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    infoRowLabel: { fontSize: 12, fontWeight: '600' },
    infoRowValue: { fontSize: 12, fontWeight: '700', textAlign: 'right' },
    notesCard: { padding: 16, minHeight: 120 },
    notesInput: { fontSize: 14, textAlignVertical: 'top' },
    saveNotesBtn: { marginTop: 16, backgroundColor: 'rgba(0,0,0,0.05)' },
    
    // Clean Results Styles
    cleanResultsContainer: { marginTop: 10, gap: 10 },
    resultsTitle: { fontSize: 10, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
    resultsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    resultChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, gap: 8, ...DesignTokens.shadows.sm },
    chipDot: { width: 6, height: 6, borderRadius: 3 },
    chipText: { fontSize: 13, fontWeight: '600' },
});
