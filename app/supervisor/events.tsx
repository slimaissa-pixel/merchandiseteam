import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Badge } from '@/components/ui/Badge';
import { BottomNav } from '@/components/ui/BottomNav';
import { Card, StatCard } from '@/components/ui/Card';
import { Header } from '@/components/ui/Header';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { DesignTokens, getColors } from '@/constants/designSystem';
import { useTheme } from '@/context/ThemeContext';
import { MERCHANDISER_NAV_ITEMS } from '@/constants/navigation';
import apiClient from '@/services/apiClient';

const eventTypes = [
    { id: 'out-of-stock'        , title: 'Out of Stock'         , icon: 'alert-circle'     , color: '#ef4444', description: 'Report unavailable products', route: '/supervisor/events/out-of-stock' },
    { id: 'before-after'        , title: 'Before/After'         , icon: 'camera'           , color: '#3b82f6', description: 'Document shelf changes'     , route: '/supervisor/events/before-after' },
    { id: 'facing-change'       , title: 'Facing Change'        , icon: 'swap-horizontal'  , color: '#f59e0b', description: 'Report product placement'   , route: '/supervisor/events/facing-change' },
    { id: 'product-competitor'  , title: 'Product vs Competitor', icon: 'git-compare'      , color: '#8b5cf6', description: 'Market comparison'          , route: '/supervisor/events/product-competitor' },
    { id: 'new-product'         , title: 'New Product'          , icon: 'add-circle'       , color: '#10b981', description: 'Add new items'              , route: '/supervisor/events/new-product' },
    { id: 'competitive-event'   , title: 'Competitive Event'    , icon: 'trophy'           , color: '#f97316', description: 'Competitor activities'      , route: '/supervisor/events/competitive-event' },
];

export default function MerchandiserEvents() {
    const router = useRouter();
    const { theme } = useTheme();
    const colors = getColors(theme);
    const [recentEvents, setRecentEvents] = useState<any[]>([]);
    const [isLoadingEvents, setIsLoadingEvents] = useState(true);
    const [weekCount, setWeekCount] = useState(0);
    const [monthCount, setMonthCount] = useState(0);
    const [showSubmitMenu, setShowSubmitMenu] = useState(false);

    useEffect(() => {
        const fetchEvents = async () => {
            setIsLoadingEvents(true);
            try {
                const response = await apiClient.get('/api/events/', { params: { limit: 5 } });
                const data = response.data || [];
                setRecentEvents(data);

                const now = new Date();
                const weekStart = new Date(now);
                weekStart.setDate(now.getDate() - 7);
                const monthStart = new Date(now);
                monthStart.setDate(now.getDate() - 30);

                setWeekCount(data.filter((e: any) => new Date(e.created_at) >= weekStart).length);
                setMonthCount(data.filter((e: any) => new Date(e.created_at) >= monthStart).length);
            } catch (error) {
                console.error('[Events] Fetch error:', error);
            } finally {
                setIsLoadingEvents(false);
            }
        };
        fetchEvents();
    }, []);

    const getBadgeVariant = (status: string) => {
        switch (status) {
            case 'approved': return 'success';
            case 'pending': return 'warning';
            case 'rejected': return 'danger';
            default: return 'neutral';
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <Header
                title="Reports & Events"
                subtitle="Your field activity"
                showBack={false}
                
            />

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* Submit CTA */}
                <View style={[styles.ctaCard, { backgroundColor: colors.primary }]}>
                    <View style={styles.ctaText}>
                        <Text style={styles.ctaTitle}>Submit New Event</Text>
                        <Text style={styles.ctaSubtitle}>Report a field activity from your current visit</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.ctaBtn}
                        onPress={() => setShowSubmitMenu(true)}
                    >
                        <Ionicons name="add" size={22} color={colors.primary} />
                    </TouchableOpacity>
                </View>

                <View style={styles.statsRow}>
                    <StatCard
                        label="THIS WEEK"
                        value={weekCount.toString()}
                        icon="calendar"
                        color={colors.primary}
                    />
                    <StatCard
                        label="THIS MONTH"
                        value={monthCount.toString()}
                        icon="bar-chart"
                        color={colors.secondary}
                    />
                </View>

                <SectionHeader title="Event Types" />
                <View style={styles.eventGrid}>
                    {eventTypes.map((event) => (
                        <StatCard
                            key={event.id}
                            label="Action"
                            value={event.title}
                            icon={event.icon as any}
                            color={event.color}
                            onPress={() => router.push(event.route as any)}
                            style={styles.eventGridCard}
                            valueStyle={{ fontSize: 13 }}
                        />
                    ))}
                </View>

            {/* Event picker bottom-sheet modal */}
            <Modal
                visible={showSubmitMenu}
                transparent
                animationType="slide"
                onRequestClose={() => setShowSubmitMenu(false)}
            >
                <Pressable style={styles.modalBackdrop} onPress={() => setShowSubmitMenu(false)} />
                <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
                    <View style={styles.modalHandle} />
                    <Text style={[styles.modalTitle, { color: colors.text }]}>Choose Event Type</Text>
                    <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>Select the type of field activity to report</Text>
                    <View style={styles.modalGrid}>
                        {eventTypes.map((event) => (
                            <TouchableOpacity
                                key={event.id}
                                style={[styles.modalEventItem, { backgroundColor: event.color + '18', borderColor: event.color + '40' }]}
                                onPress={() => {
                                    setShowSubmitMenu(false);
                                    router.push(event.route as any);
                                }}
                            >
                                <View style={[styles.modalEventIcon, { backgroundColor: event.color + '25' }]}>
                                    <Ionicons name={event.icon as any} size={24} color={event.color} />
                                </View>
                                <Text style={[styles.modalEventTitle, { color: colors.text }]}>{event.title}</Text>
                                <Text style={[styles.modalEventDesc, { color: colors.textSecondary }]}>{event.description}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </Modal>

                <SectionHeader
                    title="Recent Activity"
                    actionLabel="View All"
                    onAction={() => { }}
                />
                <View style={styles.recentList}>
                    {isLoadingEvents ? (
                        <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
                    ) : recentEvents.length === 0 ? (
                        <Text style={{ color: colors.textSecondary, textAlign: 'center', padding: 20 }}>No recent events yet.</Text>
                    ) : recentEvents.map((event) => (
                        <Card key={event.id} style={styles.recentItem}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.recentType, { color: colors.text }]}>{event.type}</Text>
                                <Text style={[styles.recentStore, { color: colors.textSecondary }]}>{event.gms_name || event.store || 'Unknown Store'}</Text>
                            </View>
                            <View style={{ alignItems: 'flex-end', gap: 4 }}>
                                <Badge
                                    label={event.status}
                                    variant={getBadgeVariant(event.status) as any}
                                />
                                <Text style={[styles.recentTime, { color: colors.textSecondary }]}>{event.time}</Text>
                            </View>
                        </Card>
                    ))}
                </View>
            </ScrollView>

            <BottomNav items={MERCHANDISER_NAV_ITEMS} activeRoute="/supervisor/events" />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scroll: {
        paddingBottom: 100,
    },
    ctaCard: {
        marginHorizontal: DesignTokens.spacing.lg,
        marginTop: DesignTokens.spacing.md,
        marginBottom: DesignTokens.spacing.sm,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        gap: 12,
    },
    ctaText: { flex: 1 },
    ctaTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
    ctaSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 },
    ctaBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
    statsRow: {
        flexDirection: 'row',
        paddingVertical: DesignTokens.spacing.xs,
        gap: DesignTokens.spacing.sm,
    },
    eventGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: DesignTokens.spacing.lg,
        gap: DesignTokens.spacing.sm,
    },
    eventGridCard: {
        flex: 1,
        minWidth: '45%',
    },
    recentList: {
        paddingHorizontal: DesignTokens.spacing.lg,
    },
    recentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: DesignTokens.spacing.md,
        marginBottom: DesignTokens.spacing.sm,
    },
    recentType: {
        ...DesignTokens.typography.bodyBold,
    },
    recentStore: {
        ...DesignTokens.typography.caption,
    },
    recentTime: {
        fontSize: 10,
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalSheet: {
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        padding: 24,
        paddingBottom: 40,
    },
    modalHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(128,128,128,0.3)',
        alignSelf: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 4,
    },
    modalSubtitle: {
        fontSize: 13,
        marginBottom: 20,
    },
    modalGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    modalEventItem: {
        width: '47%',
        borderRadius: 16,
        borderWidth: 1,
        padding: 16,
        gap: 8,
    },
    modalEventIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalEventTitle: {
        fontSize: 13,
        fontWeight: '700',
        lineHeight: 16,
    },
    modalEventDesc: {
        fontSize: 11,
        lineHeight: 14,
    },
});
