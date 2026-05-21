import { Ionicons } from '@expo/vector-icons';
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
import { VisitService } from '@/services/visit.service';
import { useEffect } from 'react';
import { ActivityIndicator, RefreshControl } from 'react-native';


export default function AttendancePage() {
    const router = useRouter();
    const { theme } = useTheme();
    const colors = getColors(theme);
    const [searchQuery, setSearchQuery] = useState('');
    const [agents, setAgents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadAttendance();
    }, []);

    const loadAttendance = async () => {
        if (!refreshing) setLoading(true);
        try {
            const data = await VisitService.getSupervisorAttendance();
            setAgents(data);
        } catch (error) {
            console.error('Load attendance error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const stats = {
        total: agents.length,
        started: agents.filter(a => a.status === 'started').length,
        finished: agents.filter(a => a.status === 'finished').length,
        notStarted: agents.filter(a => a.status === 'not_started').length,
        onLeave: agents.filter(a => a.status === 'on_leave').length,
    };

    const filteredAgents = agents.filter(a => 
        a.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <SafeAreaView style={[s.container, { backgroundColor: colors.background }]}>
            <Header title="Attendance" showBack />

            <ScrollView 
                contentContainerStyle={s.scroll} 
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadAttendance(); }} tintColor={colors.primary} />
                }
            >
                {/* 1. Summary Header */}
                <View style={s.statsGrid}>
                    <Card style={s.statBox}>
                        <Text style={[s.statVal, { color: colors.primary }]}>{stats.total}</Text>
                        <Text style={[s.statLab, { color: colors.textSecondary }]}>Total</Text>
                    </Card>
                    <Card style={s.statBox}>
                        <Text style={[s.statVal, { color: colors.success }]}>{stats.started}</Text>
                        <Text style={[s.statLab, { color: colors.textSecondary }]}>Working</Text>
                    </Card>
                    <Card style={s.statBox}>
                        <Text style={[s.statVal, { color: colors.danger }]}>{stats.onLeave}</Text>
                        <Text style={[s.statLab, { color: colors.textSecondary }]}>On Leave</Text>
                    </Card>
                    <Card style={s.statBox}>
                        <Text style={[s.statVal, { color: colors.textMuted }]}>{stats.notStarted}</Text>
                        <Text style={[s.statLab, { color: colors.textSecondary }]}>Pending</Text>
                    </Card>
                </View>

                {/* 2. Search */}
                <View style={s.searchContainer}>
                    <View style={[s.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Ionicons name="search" size={20} color={colors.textSecondary} />
                        <TextInput 
                            placeholder="Search agent name..." 
                            placeholderTextColor={colors.textMuted}
                            style={[s.searchInput, { color: colors.text }]}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                </View>

                {/* 3. Agent List */}
                <SectionHeader title="TEAMS ATTENDANCE" />
                <View style={s.list}>
                    {loading ? (
                        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
                    ) : filteredAgents.length > 0 ? (
                        filteredAgents.map(agent => (
                            <Card key={agent.id} style={s.agentCard}>
                                <View style={s.cardTop}>
                                    <View style={[s.avatar, { backgroundColor: colors.primary + '10' }]}>
                                        <Text style={[s.avatarText, { color: colors.primary }]}>{agent.name.charAt(0)}</Text>
                                    </View>
                                    <View style={s.info}>
                                        <Text style={[s.name, { color: colors.text }]}>{agent.name}</Text>
                                        <View style={s.statusRow}>
                                            <View style={[s.dot, { backgroundColor: agent.status === 'started' ? colors.success : agent.status === 'finished' ? '#F59E0B' : agent.status === 'on_leave' ? colors.danger : colors.textMuted }]} />
                                            <Text style={[s.statusText, { color: colors.textSecondary }]}>
                                                {agent.status === 'started' ? 'Working Now' : agent.status === 'finished' ? 'Work Finished' : agent.status === 'on_leave' ? 'On Approved Leave' : 'Not Started Yet'}
                                            </Text>
                                        </View>
                                    </View>
                                    <Badge 
                                        label={agent.status === 'on_leave' ? 'ON LEAVE' : agent.status.replace('_', ' ').toUpperCase()} 
                                        variant={agent.status === 'started' ? 'success' : agent.status === 'finished' ? 'warning' : agent.status === 'on_leave' ? 'danger' : 'neutral'} 
                                    />
                                </View>

                                <View style={[s.divider, { backgroundColor: colors.border + '30' }]} />

                                <View style={s.cardBottom}>
                                    <View style={s.timeItem}>
                                        <Text style={[s.timeLab, { color: colors.textSecondary }]}>START TIME</Text>
                                        <Text style={[s.timeVal, { color: colors.text }]}>{agent.startTime}</Text>
                                    </View>
                                    <View style={s.timeItem}>
                                        <Text style={[s.timeLab, { color: colors.textSecondary }]}>END TIME</Text>
                                        <Text style={[s.timeVal, { color: colors.text }]}>{agent.endTime}</Text>
                                    </View>
                                    <View style={s.timeItem}>
                                        <Text style={[s.timeLab, { color: colors.textSecondary }]}>PROGRESS</Text>
                                        <Text style={[s.timeVal, { color: colors.primary }]}>{Math.round(agent.progress * 100)}%</Text>
                                    </View>
                                </View>
                            </Card>
                        ))
                    ) : (
                        <View style={{ padding: 40, alignItems: 'center' }}>
                            <Ionicons name="people-outline" size={48} color={colors.textMuted} />
                            <Text style={{ color: colors.textSecondary, marginTop: 12, fontWeight: '600' }}>No attendance records found.</Text>
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
    agentCard: { padding: 16, borderRadius: 20 },
    cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatar: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontSize: 18, fontWeight: '800' },
    info: { flex: 1, gap: 2 },
    name: { fontSize: 15, fontWeight: '700' },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dot: { width: 6, height: 6, borderRadius: 3 },
    statusText: { fontSize: 11, fontWeight: '600' },
    divider: { height: 1, marginVertical: 16 },
    cardBottom: { flexDirection: 'row', justifyContent: 'space-between' },
    timeItem: { gap: 4 },
    timeLab: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
    timeVal: { fontSize: 13, fontWeight: '700' },
});
