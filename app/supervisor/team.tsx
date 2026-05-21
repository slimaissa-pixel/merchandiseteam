import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Badge } from '@/components/ui/Badge';
import { BottomNav } from '@/components/ui/BottomNav';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { getFullImageUrl } from '@/constants/api';
import { DesignTokens, getColors } from '@/constants/designSystem';
import { SUPERVISOR_NAV_ITEMS } from '@/constants/navigation';
import { useTheme } from '@/context/ThemeContext';
import { StatsService } from '@/services/stats.service';

export default function TeamPage() {
    const router = useRouter();
    const { theme } = useTheme();
    const colors = getColors(theme);
    const [loading, setLoading] = useState(true);
    const [teamAgents, setTeamAgents] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');

    const loadTeam = async () => {
        setLoading(true);
        try {
            const data = await StatsService.getTeamStatus();
            if (data) setTeamAgents(data);
        } catch (error) {
            console.error('Failed to load team:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTeam();
    }, []);

    const activeCount = teamAgents.filter(a => a.status === 'visiting' || a.status === 'travelling').length;
    const leaveCount = teamAgents.filter(a => a.status === 'on_leave').length;
    const offlineCount = teamAgents.filter(a => a.status === 'offline').length;

    const filters = [
        { label: 'All', count: teamAgents.length },
        { label: 'Active', count: activeCount },
        { label: 'Offline', count: offlineCount },
        { label: 'On Leave', count: leaveCount },
    ];

    const filteredTeam = teamAgents.filter(a => {
        const matchesSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = activeFilter === 'All' 
            ? true 
            : activeFilter === 'Active' ? (a.status === 'visiting' || a.status === 'travelling')
            : activeFilter === 'Offline' ? a.status === 'offline'
            : activeFilter === 'On Leave' ? a.status === 'on_leave' : true;
        return matchesSearch && matchesFilter;
    });

    return (
        <SafeAreaView style={[s.container, { backgroundColor: colors.background }]}>
            {/* 1. Custom Header */}
            <View style={s.header}>
                <View style={s.headerTop}>
                    <View>
                        <Text style={[s.headerTitle, { color: colors.text }]}>Team Directory</Text>
                        <Text style={[s.headerSub, { color: colors.textSecondary }]}>{teamAgents.length} assigned agents</Text>
                    </View>
                    <View style={s.headerBadges}>
                        <View style={s.miniBadge}>
                            <View style={[s.dot, { backgroundColor: colors.success }]} />
                            <Text style={[s.miniBadgeText, { color: colors.textSecondary }]}>{activeCount} Active</Text>
                        </View>
                        {leaveCount > 0 && (
                            <View style={s.miniBadge}>
                                <View style={[s.dot, { backgroundColor: colors.danger }]} />
                                <Text style={[s.miniBadgeText, { color: colors.textSecondary }]}>{leaveCount} On Leave</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* 2. Search & Filters */}
                <View style={[s.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Ionicons name="search" size={18} color={colors.textSecondary} />
                    <TextInput 
                        placeholder="Search agents..." 
                        placeholderTextColor={colors.textMuted}
                        style={[s.searchInput, { color: colors.text }]}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterScroll}>
                    {filters.map(f => (
                        <TouchableOpacity 
                            key={f.label} 
                            style={[
                                s.filterTab, 
                                activeFilter === f.label ? { backgroundColor: colors.primary } : { backgroundColor: colors.surfaceSecondary + '50' }
                            ]}
                            onPress={() => setActiveFilter(f.label)}
                        >
                            <Text style={[s.filterText, { color: activeFilter === f.label ? '#fff' : colors.textSecondary }]}>{f.label}</Text>
                            <View style={[s.filterCount, { backgroundColor: activeFilter === f.label ? 'rgba(255,255,255,0.2)' : colors.border }]}>
                                <Text style={[s.filterCountText, { color: activeFilter === f.label ? '#fff' : colors.textSecondary }]}>{f.count}</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {loading ? (
                <View style={s.loading}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
                    {filteredTeam.map(agent => (
                        <Card key={agent.id} style={s.agentCard}>
                            <View style={s.cardTop}>
                                <Image 
                                    source={agent.avatar ? { uri: getFullImageUrl(agent.avatar) } : require('@/assets/images/neat.png')} 
                                    style={s.avatar} 
                                />
                                <View style={s.info}>
                                    <Text style={[s.name, { color: colors.text }]}>{agent.name}</Text>
                                    <View style={s.metaRow}>
                                        <View style={s.metaItem}>
                                            <Ionicons name="storefront-outline" size={12} color={colors.textSecondary} />
                                            <Text style={[s.metaText, { color: colors.textSecondary }]}>{agent.completed_visits || 0}/{agent.assigned_stores || 0} visits</Text>
                                        </View>
                                        <View style={s.metaItem}>
                                            <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
                                            <Text style={[s.metaText, { color: colors.textSecondary }]}>{agent.time}</Text>
                                        </View>
                                    </View>
                                </View>
                                <Badge 
                                    label={agent.status === 'visiting' ? 'VISITING' : agent.status === 'travelling' ? 'TRAVELLING' : agent.status === 'on_leave' ? 'ON LEAVE' : 'OFFLINE'} 
                                    variant={agent.status === 'visiting' ? 'success' : agent.status === 'travelling' ? 'primary' : agent.status === 'on_leave' ? 'danger' : 'neutral'} 
                                    size="sm" 
                                />
                            </View>
                            
                            <View style={{ height: 1, backgroundColor: colors.border + '40', marginVertical: 12 }} />
                            
                            <Text style={{ fontSize: 12, color: colors.text, fontWeight: '600', marginBottom: 12 }} numberOfLines={1}>
                                {agent.store}
                            </Text>

                            <View style={s.cardBottom}>
                                <ProgressBar 
                                    progress={(agent.completion_pct || 0) / 100} 
                                    style={s.progress} 
                                    color={agent.completion_pct >= 100 ? colors.success : agent.completion_pct < 20 ? colors.danger : colors.primary} 
                                />
                                <Text style={[s.percent, { color: colors.textSecondary }]}>{Math.min(100, agent.completion_pct || 0)}%</Text>
                            </View>
                        </Card>
                    ))}
                </ScrollView>
            )}

            <BottomNav items={SUPERVISOR_NAV_ITEMS} activeRoute="/supervisor/team" />
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    container: { flex: 1 },
    header: { padding: 16, gap: 16 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    headerTitle: { fontSize: 24, fontWeight: '800' },
    headerSub: { fontSize: 13, fontWeight: '600' },
    headerBadges: { gap: 4, alignItems: 'flex-end' },
    miniBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.03)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    dot: { width: 6, height: 6, borderRadius: 3 },
    miniBadgeText: { fontSize: 10, fontWeight: '700' },
    searchBox: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, height: 48, borderRadius: 12, borderWidth: 1 },
    searchInput: { flex: 1, fontSize: 14, fontWeight: '500' },
    filterScroll: { flexDirection: 'row' },
    filterTab: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8 },
    filterText: { fontSize: 12, fontWeight: '700' },
    filterCount: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
    filterCountText: { fontSize: 10, fontWeight: '800' },
    loading: { flex: 1, justifyContent: 'center' },
    scroll: { paddingHorizontal: 16, paddingBottom: 100 },
    agentCard: { padding: 16, borderRadius: 20, marginBottom: 12 },
    cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
    avatar: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontSize: 18, fontWeight: '800' },
    info: { flex: 1, gap: 2 },
    name: { fontSize: 16, fontWeight: '800' },
    username: { fontSize: 13, fontWeight: '600' },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontSize: 11, fontWeight: '600' },
    cardBottom: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16 },
    progress: { flex: 1, height: 6 },
    percent: { fontSize: 12, fontWeight: '800', width: 40, textAlign: 'right' },
});
