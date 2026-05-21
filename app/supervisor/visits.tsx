import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomNav } from '@/components/ui/BottomNav';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Header } from '@/components/ui/Header';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { DesignTokens, getColors } from '@/constants/designSystem';
import { SUPERVISOR_NAV_ITEMS } from '@/constants/navigation';
import { useTheme } from '@/context/ThemeContext';
import { Fonts } from '@/hooks/useFonts';
import { LocationService } from '@/services/location.service';
import { GMSService, GMS } from '@/services/gms.service';

const MOCK_TASKS = [
    { id: '1', title: 'Check Promotion Display', completed: true },
    { id: '2', title: 'Verify Price Tags', completed: false },
    { id: '3', title: 'Restock Empty Shelves', completed: false },
    { id: '4', title: 'Take Before/After Photos', completed: false },
];

export default function SupervisorTasks() {
    const router = useRouter();
    const { theme } = useTheme();
    const colors = getColors(theme);
    const params = useLocalSearchParams<{ storeId?: string; storeName?: string }>();
    
    const [loading, setLoading] = useState(true);
    const [activeVisit, setActiveVisit] = useState<any>(null);
    const [store, setStore] = useState<GMS | null>(null);
    const [tasks, setTasks] = useState(MOCK_TASKS);
    const [endingVisit, setEndingVisit] = useState(false);
    const [preSelectedStoreName] = useState(params.storeName || null);

    useEffect(() => {
        const loadVisit = async () => {
            setLoading(true);
            try {
                const session = await LocationService.getActiveSession();
                if (session.visit) {
                    setActiveVisit(session.visit);
                    const visit = session.visit;
                    const allStores = await GMSService.getAll();
                    const s = allStores.find(st => st.id === visit?.gmsId);
                    if (s) setStore(s);
                } else if (params.storeId) {
                    // Navigated from GMS store details — pre-load store info
                    const allStores = await GMSService.getAll();
                    const s = allStores.find(st => st.id.toString() === params.storeId);
                    if (s) setStore(s);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        loadVisit();
    }, []);

    const toggleTask = (id: string) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    };

    const handleEndVisit = async () => {
        setEndingVisit(true);
        const success = await LocationService.endVisit();
        if (success) {
            Alert.alert('Visit Ended', 'Great job! Taking you back to the Dashboard.');
            router.push('/supervisor/dashboard');
        }
        setEndingVisit(false);
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
                <Header title="Tasks" subtitle="Current Store Visit" />
                <View style={styles.emptyState}>
                    <Ionicons name="storefront-outline" size={64} color={colors.border} />
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No active store visit.</Text>
                    <Button 
                        title="Go to Dashboard" 
                        onPress={() => router.push('/supervisor/dashboard')} 
                        style={{ marginTop: 20 }}
                    />
                </View>
                <BottomNav items={SUPERVISOR_NAV_ITEMS} activeRoute="/supervisor/dashboard" />
            </SafeAreaView>
        );
    }

    const progress = tasks.filter(t => t.completed).length / tasks.length;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <Header
                title="Store Visit"
                subtitle="Active execution"
                showBack
                rightIcon="information-circle-outline"
                onRightIconPress={() => {}}
            />

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* Store Info & GPS Status */}
                <Card style={styles.infoCard}>
                    <View style={styles.infoHeader}>
                        <View style={[styles.iconBox, { backgroundColor: colors.primary + '20' }]}>
                            <Ionicons name="storefront" size={24} color={colors.primary} />
                        </View>
                        <View style={styles.infoText}>
                            <Text style={[styles.storeName, { color: colors.text }]}>{store.name}</Text>
                            <Text style={[styles.storeAddress, { color: colors.textSecondary }]} numberOfLines={2}>
                                {store.address || store.city}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.gpsStatus}>
                        <Ionicons name="navigate-circle" size={16} color={colors.success} />
                        <Text style={[styles.gpsText, { color: colors.success }]}>GPS Tracking Active</Text>
                    </View>
                </Card>

                {/* Progress Bar (from wireframe Tasks) */}
                <SectionHeader title="Tasks Progress" />
                <Card style={styles.progressCard}>
                    <View style={styles.progressHeader}>
                        <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>Completion</Text>
                        <Text style={[styles.progressVal, { color: colors.text }]}>{Math.round(progress * 100)}%</Text>
                    </View>
                    <View style={[styles.barBg, { backgroundColor: colors.surfaceSecondary }]}>
                        <View style={[styles.barFill, { backgroundColor: colors.primary, width: `${progress * 100}%` }]} />
                    </View>
                </Card>

                {/* Checklist */}
                <SectionHeader title="Visit Checklist" />
                <Card style={styles.checklistCard}>
                    {tasks.map((task, index) => (
                        <View key={task.id} style={[styles.taskItem, index < tasks.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border + '50' }]}>
                            <Button
                                title=""
                                variant="ghost"
                                size="sm"
                                icon={task.completed ? "checkbox" : "square-outline"}
                                onPress={() => toggleTask(task.id)}
                                style={styles.checkBtn}
                            />
                            <Text style={[
                                styles.taskText,
                                { color: task.completed ? colors.textMuted : colors.text },
                                task.completed && { textDecorationLine: 'line-through' }
                            ]}>
                                {task.title}
                            </Text>
                        </View>
                    ))}
                </Card>

                {/* Buttons: Add Report, End Visit */}
                <SectionHeader title="Actions" />
                <View style={styles.actionsBox}>
                    <Button
                        title="Add Report / Event"
                        variant="outline"
                        fullWidth
                        icon="add-circle-outline"
                        onPress={() => router.push('/supervisor/events')}
                        style={{ marginBottom: 12 }}
                    />
                    <Button
                        title="End Visit"
                        variant="danger"
                        fullWidth
                        icon="stop-circle-outline"
                        loading={endingVisit}
                        onPress={handleEndVisit}
                    />
                </View>
            </ScrollView>

            <BottomNav items={SUPERVISOR_NAV_ITEMS} activeRoute="/supervisor/dashboard" />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { paddingHorizontal: DesignTokens.spacing.lg, paddingBottom: 100 },
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    emptyText: { ...DesignTokens.typography.h3, marginTop: 16 },
    infoCard: { padding: DesignTokens.spacing.md, marginBottom: DesignTokens.spacing.md },
    infoHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    iconBox: { width: 52, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    infoText: { flex: 1 },
    storeName: { ...DesignTokens.typography.h3 },
    storeAddress: { ...DesignTokens.typography.caption, marginTop: 2 },
    gpsStatus: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
    gpsText: { ...DesignTokens.typography.caption, fontFamily: Fonts.bodyBold },
    progressCard: { padding: DesignTokens.spacing.md, marginBottom: DesignTokens.spacing.md },
    progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    progressLabel: { ...DesignTokens.typography.caption },
    progressVal: { ...DesignTokens.typography.bodyBold },
    barBg: { height: 8, borderRadius: 4, overflow: 'hidden' },
    barFill: { height: '100%', borderRadius: 4 },
    checklistCard: { paddingHorizontal: DesignTokens.spacing.md },
    taskItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
    checkBtn: { width: 44, height: 44 },
    taskText: { ...DesignTokens.typography.body, flex: 1 },
    actionsBox: { marginTop: 8 },
});
