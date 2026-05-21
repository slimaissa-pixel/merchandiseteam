import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { AdminWebLayout } from '@/components/admin/WebLayout';
import { Card, StatCard } from '@/components/ui/Card';
import { useWebTheme } from '@/hooks/useWebTheme';
import { Fonts } from '@/hooks/useFonts';
import { StorageKeys, StorageService } from '@/services/storage.service';

export default function EventsPage() {
    const router = useRouter();
    const { T: colors } = useWebTheme();
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchEvents = useCallback(async () => {
        try {
            setLoading(true);
            const token = await StorageService.getItem(StorageKeys.USER_TOKEN);
            const m = await import('@/services/apiClient');
            const res = await m.default.get('/api/events/', { params: { limit: 100 } });
            setEvents(res.data || []);
        } catch (error) {
            console.error('Failed to load events:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    const handleStatusUpdate = async (id: number, newStatus: string) => {
        try {
            const m = await import('@/services/apiClient');
            await m.default.patch(`/api/events/${id}/status`, null, { params: { status: newStatus } });
            setEvents(prev => prev.map(e => e.id === id ? { ...e, status: newStatus } : e));
        } catch (error) {
            console.error('Failed to update status', error);
            alert('Failed to update event status');
        }
    };

    const getTypeConfig = (type: string) => {
        switch (type) {
            case 'out-of-stock': return { icon: 'alert-circle', color: colors.danger, label: 'Out of Stock' };
            case 'facing-change': return { icon: 'swap-horizontal', color: colors.warning, label: 'Facing Change' };
            case 'before-after': return { icon: 'images', color: colors.primary, label: 'Before/After' };
            case 'new-product': return { icon: 'add-circle', color: colors.success, label: 'New Product' };
            default: return { icon: 'notifications', color: colors.textSecondary, label: type || 'Other' };
        }
    };

    const filters = [
        { id: 'all', label: 'All Events' },
        { id: 'out-of-stock', label: 'Stock Issues' },
        { id: 'facing-change', label: 'Facing Changes' },
        { id: 'before-after', label: 'Photos' },
    ];

    const filteredEvents = events.filter(event =>
        selectedFilter === 'all' || event.type === selectedFilter
    );

    const pendingCount = events.filter(e => e.status === 'pending').length;
    const resolvedCount = events.filter(e => e.status === 'resolved' || e.status === 'approved').length;

    return (
        <AdminWebLayout title="Event Inbox">
            <View style={{ flexDirection: 'row', gap: 24, marginBottom: 32 }}>
                <StatCard
                    label="TOTAL EVENTS"
                    value={events.length.toString()}
                    icon="list"
                    color={colors.primary}
                    style={{ flex: 1, height: 120 }}
                />
                <StatCard
                    label="PENDING REVIEW"
                    value={pendingCount.toString()}
                    icon="time"
                    color={colors.warning}
                    style={{ flex: 1, height: 120 }}
                />
                <StatCard
                    label="RESOLVED"
                    value={resolvedCount.toString()}
                    icon="checkmark-circle"
                    color={colors.success}
                    style={{ flex: 1, height: 120 }}
                />
            </View>

            <View style={{ marginBottom: 32, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 16, padding: 4, alignSelf: 'flex-start', borderWidth: 1, borderColor: colors.border }}>
                    {filters.map(filter => (
                        <TouchableOpacity
                            key={filter.id}
                            onPress={() => setSelectedFilter(filter.id)}
                            style={{
                                paddingHorizontal: 24,
                                paddingVertical: 10,
                                borderRadius: 12,
                                backgroundColor: selectedFilter === filter.id ? colors.primary : 'transparent',
                            }}
                        >
                            <Text style={{
                                color: selectedFilter === filter.id ? '#fff' : colors.textSecondary,
                                fontWeight: '700',
                                fontSize: 14
                            }}>
                                {filter.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
                <TouchableOpacity onPress={fetchEvents} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10 }}>
                    <Ionicons name="refresh" size={18} color={colors.primary} />
                    <Text style={{ color: colors.primary, fontWeight: '700' }}>Refresh</Text>
                </TouchableOpacity>
            </View>

            <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 20, fontFamily: Fonts.headingSemiBold, color: colors.text, marginBottom: 20 }}>Unified Inbox</Text>

                {loading ? (
                    <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
                ) : filteredEvents.length === 0 ? (
                    <View style={{ padding: 40, alignItems: 'center', backgroundColor: colors.card, borderRadius: 16 }}>
                        <Ionicons name="archive-outline" size={48} color={colors.textSecondary} />
                        <Text style={{ marginTop: 16, color: colors.textSecondary, fontFamily: Fonts.body }}>No events found.</Text>
                    </View>
                ) : (
                    <ScrollView style={{ gap: 16 }} contentContainerStyle={{ paddingBottom: 40 }}>
                        {filteredEvents.map((event: any) => {
                            const config = getTypeConfig(event.type);
                            return (
                                <View 
                                    key={event.id}
                                    style={{ 
                                        backgroundColor: colors.card,
                                        borderRadius: 20,
                                        padding: 24,
                                        marginBottom: 16,
                                        borderWidth: 1,
                                        borderColor: colors.border,
                                    }}
                                >
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                            <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: config.color + '15', alignItems: 'center', justifyContent: 'center' }}>
                                                <Ionicons name={config.icon as any} size={22} color={config.color} />
                                            </View>
                                            <View>
                                                <Text style={{ fontSize: 18, color: colors.text, fontFamily: Fonts.headingSemiBold }}>{config.label}</Text>
                                                <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>
                                                    {event.created_at ? new Date(event.created_at).toLocaleString() : ''}
                                                </Text>
                                            </View>
                                        </View>
                                        <View style={{ backgroundColor: event.status === 'resolved' ? colors.success + '20' : colors.warning + '20', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}>
                                            <Text style={{ color: event.status === 'resolved' ? colors.success : colors.warning, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' }}>
                                                {event.status || 'pending'}
                                            </Text>
                                        </View>
                                    </View>
                                    
                                    {event.payload && (
                                        <View style={{ backgroundColor: colors.surface, padding: 16, borderRadius: 12, marginBottom: 16 }}>
                                            <Text style={{ color: colors.text, fontFamily: Fonts.body }}>
                                                {typeof event.payload === 'string' ? event.payload : JSON.stringify(event.payload)}
                                            </Text>
                                        </View>
                                    )}

                                    {event.status !== 'resolved' && (
                                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
                                            <TouchableOpacity 
                                                onPress={() => handleStatusUpdate(event.id, 'resolved')}
                                                style={{ backgroundColor: colors.success, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 }}
                                            >
                                                <Ionicons name="checkmark" size={18} color="#fff" />
                                                <Text style={{ color: '#fff', fontWeight: '700' }}>Mark Resolved</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>
                            );
                        })}
                    </ScrollView>
                )}
            </View>
        </AdminWebLayout>
    );
}


