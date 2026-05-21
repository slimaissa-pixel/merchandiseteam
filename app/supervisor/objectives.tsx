import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomNav } from '@/components/ui/BottomNav';
import { Card } from '@/components/ui/Card';
import { Header } from '@/components/ui/Header';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { DesignTokens, getColors } from '@/constants/designSystem';
import { SUPERVISOR_NAV_ITEMS } from '@/constants/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Objective, ObjectiveService } from '@/services/objective.service';

export default function SupervisorObjectives() {    
    const router = useRouter();
    const { user } = useAuth();
    const { theme } = useTheme();
    const colors = getColors(theme);

    const [objectives, setObjectives] = useState<Objective[]>([]);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        setLoading(true);
        const data = await ObjectiveService.getAll();
        setObjectives(data);
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    // Split objectives into Supervisor's own vs Team's
    // Assume if objective.user_id matches current user, it's theirs. 
    // Otherwise, it belongs to one of their team members.
    const currentUserId = user?.id ? Number(user.id) : -1;
    const myObjectives = objectives.filter(o => o.user_id === currentUserId);
    const teamObjectives = objectives.filter(o => o.user_id !== currentUserId);

    const renderItem = ({ item }: { item: Objective }) => {
        const progressPct = item.target > 0 ? Math.min(item.current / item.target, 1) : 0;
        const visitsPct = item.target_visits > 0 ? Math.min(item.current / item.target_visits, 1) : 0; // if visits mapped to current

        return (
            <Card style={styles.card}>
                <View style={styles.header}>
                    <View style={styles.titleInfo}>
                        <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
                        <Text style={[styles.date, { color: colors.textSecondary }]}>
                            {new Date(0, item.month - 1).toLocaleString('default', { month: 'long' })} {item.year}
                        </Text>
                    </View>
                    <View style={[styles.iconWrap, { backgroundColor: colors.primary + '18' }]}>
                        <Ionicons name="flag" size={20} color={colors.primary} />
                    </View>
                </View>

                <View style={styles.progressSection}>
                    <View style={styles.progressRow}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>Visits / Target</Text>
                        <Text style={[styles.value, { color: colors.text }]}>{item.current} / {item.target}</Text>
                    </View>
                    <ProgressBar progress={progressPct} color={colors.primary} />
                </View>

                {item.target_visits > 0 && (
                    <View style={styles.progressSection}>
                        <View style={styles.progressRow}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>Specific Visits</Text>
                            <Text style={[styles.value, { color: colors.text }]}>? / {item.target_visits}</Text>
                        </View>
                        <ProgressBar progress={0} color={colors.secondary} />
                    </View>
                )}
            </Card>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <Header title="Objectives" subtitle="Track your goals and team targets" showBack />

            <FlatList
                data={myObjectives}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    <>
                        <SectionHeader title="My Objectives" actionLabel="Refresh" onAction={load} />
                        {myObjectives.length === 0 && !loading && (
                            <View style={styles.empty}>
                                <Text style={{ color: colors.textSecondary, ...DesignTokens.typography.body }}>
                                    You have no active objectives.
                                </Text>
                            </View>
                        )}
                    </>
                }
                ListFooterComponent={
                    <>
                        {teamObjectives.length > 0 && (
                            <View style={{ marginTop: 24 }}>
                                <SectionHeader title="Team Objectives" />
                                {teamObjectives.map(obj => (
                                    <View key={obj.id} style={{ marginBottom: 16 }}>
                                        {renderItem({ item: obj })}
                                    </View>
                                ))}
                            </View>
                        )}
                    </>
                }
            />

            <BottomNav items={SUPERVISOR_NAV_ITEMS} activeRoute="/supervisor/dashboard" />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    list: { padding: DesignTokens.spacing.lg, paddingBottom: 100 },
    card: { padding: DesignTokens.spacing.lg, marginBottom: DesignTokens.spacing.md },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
    titleInfo: { flex: 1, paddingRight: 10 },
    title: { ...DesignTokens.typography.h3, marginBottom: 4 },
    date: { ...DesignTokens.typography.caption },
    iconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    progressSection: { marginBottom: 12 },
    progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    label: { ...DesignTokens.typography.caption, fontWeight: '600' },
    value: { ...DesignTokens.typography.caption, fontWeight: '800' },
    empty: { paddingVertical: 20, alignItems: 'center' },
});
