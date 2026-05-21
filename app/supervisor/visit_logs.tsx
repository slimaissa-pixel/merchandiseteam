import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Badge } from '@/components/ui/Badge';
import { BottomNav } from '@/components/ui/BottomNav';
import { Card } from '@/components/ui/Card';
import { Header } from '@/components/ui/Header';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { DesignTokens, getColors } from '@/constants/designSystem';
import { SUPERVISOR_NAV_ITEMS } from '@/constants/navigation';
import { useTheme } from '@/context/ThemeContext';
import { Fonts } from '@/hooks/useFonts';
import { VisitLog, VisitService } from '@/services/visit.service';
import { useEffect } from 'react';
import { ActivityIndicator, RefreshControl } from 'react-native';


export default function VisitLogsPage() {
    const router = useRouter();
    const { theme } = useTheme();
    const colors = getColors(theme);
    const [searchQuery, setSearchQuery] = useState('');
    const [logs, setLogs] = useState<VisitLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadLogs();
    }, []);

    const loadLogs = async () => {
        if (!refreshing) setLoading(true);
        try {
            const data = await VisitService.getSupervisorLogs();
            setLogs(data);
        } catch (error) {
            console.error('Load logs error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const stats = {
        total: logs.length,
        completed: logs.filter(l => l.status === 'completed').length,
        pending: logs.filter(l => l.status === 'pending').length,
        canceled: logs.filter(l => l.status === 'canceled').length,
    };

    const filteredLogs = logs.filter(l => 
        l.agent.toLowerCase().includes(searchQuery.toLowerCase()) || 
        l.store.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <SafeAreaView style={[s.container, { backgroundColor: colors.background }]}>
            <Header title="Visit Logs" showBack />

            <ScrollView 
                contentContainerStyle={s.scroll} 
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadLogs(); }} tintColor={colors.primary} />
                }
            >
                {/* 1. Summary Header */}
                <View style={s.statsGrid}>
                    <Card style={s.statBox}>
                        <Text style={[s.statVal, { color: colors.primary }]}>{stats.total}</Text>
                        <Text style={[s.statLab, { color: colors.textSecondary }]}>Total Visits</Text>
                    </Card>
                    <Card style={s.statBox}>
                        <Text style={[s.statVal, { color: colors.success }]}>{stats.completed}</Text>
                        <Text style={[s.statLab, { color: colors.textSecondary }]}>Completed</Text>
                    </Card>
                    <Card style={s.statBox}>
                        <Text style={[s.statVal, { color: '#F59E0B' }]}>{stats.pending}</Text>
                        <Text style={[s.statLab, { color: colors.textSecondary }]}>Pending</Text>
                    </Card>
                    <Card style={s.statBox}>
                        <Text style={[s.statVal, { color: colors.danger }]}>{stats.canceled}</Text>
                        <Text style={[s.statLab, { color: colors.textSecondary }]}>Canceled</Text>
                    </Card>
                </View>

                {/* 2. Search */}
                <View style={s.searchContainer}>
                    <View style={[s.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Ionicons name="search" size={20} color={colors.textSecondary} />
                        <TextInput 
                            placeholder="Search store or agent..." 
                            placeholderTextColor={colors.textMuted}
                            style={[s.searchInput, { color: colors.text }]}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                </View>

                {/* 3. Tracker List */}
                <SectionHeader title="VISIT TRACKER" />
                <View style={s.list}>
                    {loading ? (
                        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
                    ) : filteredLogs.length > 0 ? (
                        filteredLogs.map(log => (
                            <Card key={log.id} style={s.logCard}>
                                <View style={s.cardTop}>
                                    <View style={s.info}>
                                        <Text style={[s.storeName, { color: colors.text }]}>{log.store}</Text>
                                        <View style={s.agentRow}>
                                            <Ionicons name="person-outline" size={12} color={colors.textSecondary} />
                                            <Text style={[s.agentName, { color: colors.textSecondary }]}>{log.agent}</Text>
                                        </View>
                                    </View>
                                    <Badge 
                                        label={log.status.toUpperCase()} 
                                        variant={log.status === 'completed' ? 'success' : log.status === 'pending' ? 'warning' : 'danger'} 
                                    />
                                </View>

                                <View style={[s.divider, { backgroundColor: colors.border + '30' }]} />

                                <View style={s.cardBottom}>
                                    <View style={s.detailItem}>
                                        <Text style={[s.detailLab, { color: colors.textSecondary }]}>TIME</Text>
                                        <Text style={[s.detailVal, { color: colors.text }]}>{log.start} - {log.end}</Text>
                                    </View>
                                    <View style={s.detailItem}>
                                        <Text style={[s.detailLab, { color: colors.textSecondary }]}>DURÉE</Text>
                                        <Text style={[s.detailVal, { color: colors.text }]}>{log.duration}</Text>
                                    </View>
                                    <View style={s.detailItem}>
                                        <Text style={[s.detailLab, { color: colors.textSecondary }]}>EXECUTION</Text>
                                        <Text style={[s.detailVal, { color: colors.primary }]}>{log.execution}</Text>
                                    </View>
                                </View>

                                <View style={[s.divider, { backgroundColor: colors.border + '10', marginVertical: 8 }]} />
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <Ionicons name="document-text-outline" size={14} color={colors.textSecondary} />
                                    <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '600' }}>
                                        {log.reports_count} reports submitted
                                    </Text>
                                </View>
                                
                                {log.reason && (
                                    <View style={[s.reasonBox, { backgroundColor: colors.danger + '10' }]}>
                                        <Text style={[s.reasonText, { color: colors.danger }]}>Reason: {log.reason}</Text>
                                    </View>
                                )}
                            </Card>
                        ))
                    ) : (
                        <View style={{ padding: 40, alignItems: 'center' }}>
                            <Ionicons name="clipboard-outline" size={48} color={colors.textMuted} />
                            <Text style={{ color: colors.textSecondary, marginTop: 12, fontWeight: '600' }}>No visit logs found.</Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            <BottomNav items={SUPERVISOR_NAV_ITEMS} activeRoute="/supervisor/dashboard" />
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    container: { flex: 1 },
    scroll: { paddingBottom: 100 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 10 },
    statBox: { width: '48.5%', padding: 16, alignItems: 'center' },
    statVal: { fontSize: 24, fontWeight: '800' },
    statLab: { fontSize: 11, fontWeight: '700', marginTop: 4, textTransform: 'uppercase' },
    searchContainer: { paddingHorizontal: 16, marginBottom: 16 },
    searchBox: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, height: 50, borderRadius: 15, borderWidth: 1 },
    searchInput: { flex: 1, fontSize: 14, fontWeight: '500' },
    list: { paddingHorizontal: 16, gap: 12 },
    logCard: { padding: 16, borderRadius: 20 },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
    info: { flex: 1, gap: 4 },
    storeName: { fontSize: 16, fontWeight: '800' },
    agentRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    agentName: { fontSize: 12, fontWeight: '600' },
    divider: { height: 1, marginVertical: 16 },
    cardBottom: { flexDirection: 'row', justifyContent: 'space-between' },
    detailItem: { gap: 4 },
    detailLab: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
    detailVal: { fontSize: 12, fontWeight: '700' },
    reasonBox: { marginTop: 12, padding: 8, borderRadius: 8 },
    reasonText: { fontSize: 11, fontWeight: '700' },
});
