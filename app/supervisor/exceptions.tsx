import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Badge } from '@/components/ui/Badge';
import { BottomNav } from '@/components/ui/BottomNav';
import { Card } from '@/components/ui/Card';
import { Header } from '@/components/ui/Header';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { getColors } from '@/constants/designSystem';
import { SUPERVISOR_NAV_ITEMS } from '@/constants/navigation';
import { useTheme } from '@/context/ThemeContext';
import { VisitService } from '@/services/visit.service';
import { useEffect } from 'react';
import { ActivityIndicator, RefreshControl } from 'react-native';


export default function ExceptionsPage() {
    const router = useRouter();
    const { theme } = useTheme();
    const colors = getColors(theme);
    
    const [exceptions, setExceptions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadExceptions();
    }, []);

    const loadExceptions = async () => {
        if (!refreshing) setLoading(true);
        try {
            const data = await VisitService.getSupervisorExceptions();
            setExceptions(data);
        } catch (error) {
            console.error('Load exceptions error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    return (
        <SafeAreaView style={[s.container, { backgroundColor: colors.background }]}>
            <Header title="Exceptions" showBack />

            <ScrollView 
                contentContainerStyle={s.scroll} 
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadExceptions(); }} tintColor={colors.primary} />
                }
            >
                {loading ? (
                    <View style={s.emptyState}>
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                ) : exceptions.length === 0 ? (
                    <View style={s.emptyState}>
                        <View style={[s.checkCircle, { backgroundColor: colors.success + '20' }]}>
                            <Ionicons name="checkmark-circle" size={80} color={colors.success} />
                        </View>
                        <Text style={[s.emptyText, { color: colors.textSecondary }]}>No exceptions today</Text>
                        <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 8 }}>Everything is running smoothly!</Text>
                    </View>
                ) : (
                    <View style={s.list}>
                        <SectionHeader title="TODAY'S ANOMALIES" />
                        {exceptions.map(exc => (
                            <Card key={exc.id} style={s.excCard}>
                                <View style={s.excHeader}>
                                    <View style={[s.excIcon, { backgroundColor: colors.danger + '10' }]}>
                                        <Ionicons name="alert-circle" size={24} color={colors.danger} />
                                    </View>
                                    <View style={s.excInfo}>
                                        <Text style={[s.excTitle, { color: colors.text }]}>{exc.title}</Text>
                                        <Text style={[s.excDesc, { color: colors.textSecondary }]}>{exc.agent} • {exc.store}</Text>
                                    </View>
                                    <Text style={[s.excTime, { color: colors.textMuted }]}>{exc.time}</Text>
                                </View>
                                <View style={s.excFooter}>
                                    <Badge label={exc.type.toUpperCase()} variant="danger" />
                                    <TouchableOpacity style={s.actionBtn}>
                                        <Text style={[s.actionText, { color: colors.primary }]}>Resolve</Text>
                                    </TouchableOpacity>
                                </View>
                            </Card>
                        ))}
                    </View>
                )}
            </ScrollView>

            <BottomNav items={SUPERVISOR_NAV_ITEMS} activeRoute="/supervisor/dashboard" />
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    container: { flex: 1 },
    scroll: { flexGrow: 1 },
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 100 },
    checkCircle: { width: 140, height: 140, borderRadius: 70, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    emptyText: { fontSize: 16, fontWeight: '600', opacity: 0.6 },
    list: { padding: 16, gap: 12 },
    excCard: { padding: 16, borderRadius: 20 },
    excHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    excIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    excInfo: { flex: 1, gap: 2 },
    excTitle: { fontSize: 15, fontWeight: '700' },
    excDesc: { fontSize: 12, fontWeight: '500' },
    excTime: { fontSize: 11, fontWeight: '600' },
    excFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
    actionBtn: { paddingHorizontal: 12, paddingVertical: 6 },
    actionText: { fontSize: 13, fontWeight: '700' },
});
