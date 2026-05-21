import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Badge } from '@/components/ui/Badge';
import { BottomNav } from '@/components/ui/BottomNav';
import { Card } from '@/components/ui/Card';
import { Header } from '@/components/ui/Header';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { DesignTokens, getColors } from '@/constants/designSystem';
import { SUPERVISOR_NAV_ITEMS } from '@/constants/navigation';
import { useTheme } from '@/context/ThemeContext';
import { Fonts } from '@/hooks/useFonts';
import { VisitService } from '@/services/visit.service';
import { useEffect } from 'react';
import { ActivityIndicator, RefreshControl } from 'react-native';


export default function PerformancePage() {
    const router = useRouter();
    const { theme } = useTheme();
    const colors = getColors(theme);
    const [performance, setPerformance] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadPerformance();
    }, []);

    const loadPerformance = async () => {
        if (!refreshing) setLoading(true);
        try {
            const data = await VisitService.getSupervisorPerformance();
            setPerformance(data);
        } catch (error) {
            console.error('Load performance error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    if (loading && !refreshing) {
        return (
            <SafeAreaView style={[s.container, { backgroundColor: colors.background, justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </SafeAreaView>
        );
    }

    const summary = performance?.summary || { avgCompletion: 0, totalReports: 0, avgVisitTime: '---' };
    const leaderboard = performance?.leaderboard || [];

    return (
        <SafeAreaView style={[s.container, { backgroundColor: colors.background }]}>
            <Header title="Performance" showBack />

            <ScrollView 
                contentContainerStyle={s.scroll} 
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadPerformance(); }} tintColor={colors.primary} />
                }
            >
                {/* 1. Global Stats Summary */}
                <View style={s.statsGrid}>
                    <Card style={s.statBox}>
                        <Text style={[s.statVal, { color: colors.primary }]}>{summary.avgCompletion}%</Text>
                        <Text style={[s.statLab, { color: colors.textSecondary }]}>Avg Completion</Text>
                    </Card>
                    <Card style={s.statBox}>
                        <Text style={[s.statVal, { color: colors.success }]}>{summary.totalReports}</Text>
                        <Text style={[s.statLab, { color: colors.textSecondary }]}>Total Reports</Text>
                    </Card>
                    <Card style={[s.statBox, { width: '100%' }]}>
                        <View style={s.statRow}>
                            <View>
                                <Text style={[s.statVal, { color: '#F59E0B' }]}>{summary.avgVisitTime}</Text>
                                <Text style={[s.statLab, { color: colors.textSecondary }]}>Avg Time / Visit</Text>
                            </View>
                            <View style={s.trendBox}>
                                <Ionicons name="stats-chart" size={20} color={colors.success} />
                                <Text style={[s.trendText, { color: colors.success }]}>Real-time metrics</Text>
                            </View>
                        </View>
                    </Card>
                </View>

                {/* 2. Agents Ranking */}
                <SectionHeader title="AGENTS RANKING" />
                <View style={s.leaderboard}>
                    {leaderboard.length > 0 ? (
                        leaderboard.map((agent: any) => (
                            <Card key={agent.id} style={s.agentRow}>
                                <View style={s.rankCircle}>
                                    {agent.rank <= 3 ? (
                                        <MaterialCommunityIcons 
                                            name="trophy" 
                                            size={20} 
                                            color={agent.rank === 1 ? '#FFD700' : agent.rank === 2 ? '#C0C0C0' : '#CD7F32'} 
                                        />
                                    ) : (
                                        <Text style={[s.rankText, { color: colors.textMuted }]}>{agent.rank}</Text>
                                    )}
                                </View>

                                <View style={s.agentInfo}>
                                    <Text style={[s.agentName, { color: colors.text }]}>{agent.name}</Text>
                                    <View style={s.agentMeta}>
                                        <Text style={[s.metaText, { color: colors.textSecondary }]}>{agent.reports} reports • {agent.avgTime}</Text>
                                    </View>
                                </View>

                                <View style={s.scoreBox}>
                                    <Text style={[s.scoreVal, { color: colors.primary }]}>{agent.completion}%</Text>
                                    <ProgressBar 
                                        progress={agent.completion / 100} 
                                        style={s.miniProgress}
                                        color={agent.completion > 90 ? colors.success : colors.primary}
                                    />
                                </View>
                            </Card>
                        ))
                    ) : (
                        <View style={{ padding: 40, alignItems: 'center' }}>
                            <Ionicons name="bar-chart-outline" size={48} color={colors.textMuted} />
                            <Text style={{ color: colors.textSecondary, marginTop: 12, fontWeight: '600' }}>No performance data available.</Text>
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
    statBox: { width: '48.5%', padding: 20, borderRadius: 24 },
    statVal: { fontSize: 26, fontWeight: '900' },
    statLab: { fontSize: 11, fontWeight: '700', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
    statRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    trendBox: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(16, 185, 129, 0.1)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
    trendText: { fontSize: 12, fontWeight: '700' },
    leaderboard: { paddingHorizontal: 16, gap: 12 },
    agentRow: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20 },
    rankCircle: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    rankText: { fontSize: 16, fontWeight: '800' },
    agentInfo: { flex: 1, marginLeft: 12 },
    agentName: { fontSize: 15, fontWeight: '700' },
    agentMeta: { marginTop: 2 },
    metaText: { fontSize: 11, fontWeight: '600' },
    scoreBox: { alignItems: 'flex-end', width: 80 },
    scoreVal: { fontSize: 16, fontWeight: '800', marginBottom: 6 },
    miniProgress: { height: 4, width: '100%' },
});
