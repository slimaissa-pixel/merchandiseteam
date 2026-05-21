
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { 
    ActivityIndicator, 
    FlatList, 
    RefreshControl, 
    StyleSheet, 
    Text, 
    TouchableOpacity, 
    View 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Badge } from '@/components/ui/Badge';
import { BottomNav } from '@/components/ui/BottomNav';
import { Card } from '@/components/ui/Card';
import { Header } from '@/components/ui/Header';
import { DesignTokens, getColors } from '@/constants/designSystem';
import { MERCHANDISER_NAV_ITEMS } from '@/constants/navigation';
import { useTheme } from '@/context/ThemeContext';
import { Report, ReportService } from '@/services/report.service';

export default function MerchandiserEvents() {
    const router = useRouter();
    const { theme } = useTheme();
    const colors = getColors(theme);

    const [events, setEvents] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadEvents = async () => {
        setLoading(true);
        try {
            const data = await ReportService.getAll();
            // Filter only field events, not shift summaries
            const fieldEvents = data.filter(r => r.type !== 'shift-summary');
            setEvents(fieldEvents.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
        } catch (error) {
            console.error('[Events] Load error:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadEvents();
        setRefreshing(false);
    };

    useEffect(() => {
        loadEvents();
    }, []);

    const getEventIcon = (type: string) => {
        switch (type.toLowerCase()) {
            case 'anomaly': return 'alert-circle';
            case 'stock-issue': return 'cart';
            case 'facing change': return 'grid';
            case 'before/after': return 'camera';
            case 'competitor-alert': return 'megaphone';
            case 'competitor-price': return 'pricetag';
            default: return 'document-text';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return colors.success;
            case 'rejected': return colors.danger;
            default: return colors.warning;
        }
    };

    const renderEvent = ({ item }: { item: Report }) => (
        <Card style={styles.eventCard} onPress={() => router.push({ pathname: '/merchandiser/report_details', params: { id: item.id } })}>
            <View style={styles.eventHeader}>
                <View style={[styles.iconBox, { backgroundColor: colors.primary + '15' }]}>
                    <Ionicons name={getEventIcon(item.type) as any} size={22} color={colors.primary} />
                </View>
                <View style={styles.eventInfo}>
                    <Text style={[styles.eventName, { color: colors.text }]}>{item.name}</Text>
                    <Text style={[styles.eventTime, { color: colors.textMuted }]}>
                        {new Date(item.created_at).toLocaleDateString()} · {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
            </View>
            
            {item.notes && (
                <Text style={[styles.eventNotes, { color: colors.textSecondary }]} numberOfLines={2}>
                    {item.notes}
                </Text>
            )}

            <View style={styles.eventFooter}>
                <Badge label={item.type} variant="neutral" size="sm" />
                <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                    {item.status.toUpperCase()}
                </Text>
            </View>
        </Card>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <Header title="Activity Log" subtitle="History of field events" />

            {loading && !refreshing ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={events}
                    renderItem={renderEvent}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="document-text-outline" size={64} color={colors.textMuted} />
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No events reported yet</Text>
                        </View>
                    }
                />
            )}

            <BottomNav items={MERCHANDISER_NAV_ITEMS} activeRoute="/merchandiser/events" />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    list: { padding: DesignTokens.spacing.md, paddingBottom: 100 },
    eventCard: { padding: 16, marginBottom: 12 },
    eventHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    iconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    eventInfo: { flex: 1, marginLeft: 12 },
    eventName: { ...DesignTokens.typography.bodyBold, fontSize: 15 },
    eventTime: { fontSize: 12, marginTop: 2 },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    eventNotes: { fontSize: 13, lineHeight: 18, marginBottom: 12 },
    eventFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', paddingTop: 12 },
    statusText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
    emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
    emptyText: { marginTop: 16, ...DesignTokens.typography.body },
});
