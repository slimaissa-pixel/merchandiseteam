import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomNav } from '@/components/ui/BottomNav';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Header } from '@/components/ui/Header';
import { PremiumPressable } from '@/components/ui/PremiumPressable';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { DesignTokens, getColors } from '@/constants/designSystem';
import { MERCHANDISER_NAV_ITEMS } from '@/constants/navigation';
import { useTheme } from '@/context/ThemeContext';
import { GMS, GMSService } from '@/services/gms.service';
import { LocationService, WorkdaySession } from '@/services/location.service';
import { Fonts } from '@/hooks/useFonts';

export default function MerchandiserPlanning() {
    const router = useRouter();
    const { theme } = useTheme();
    const colors = getColors(theme);

    const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [stores, setStores] = useState<GMS[]>([]);
    const [workday, setWorkday] = useState<WorkdaySession | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await GMSService.getAll();
            setStores(data);
            const session = await LocationService.getActiveSession();
            if (session.workday) setWorkday(session.workday);
        } catch (error) {
            console.error('[Planning] loadData error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const handleCheckIn = async (storeId: number, storeName: string) => {
        setActionLoading(true);
        try {
            const v = await LocationService.startVisit(storeId);
            if (v) {
                router.push('/merchandiser/visits');
            }
        } catch (e: any) {
            Alert.alert('Check-in Error', e.message || 'Could not start visit. Please try again.');
        } finally {
            setActionLoading(false);
        }
    };

    const completedCount = workday?.completedGmsIds?.length || 0;
    const totalCount = stores.length || 0;
    const progress = totalCount > 0 ? completedCount / totalCount : 0;
    const isToday = selectedDate === new Date().toISOString().split('T')[0];

    return (
        <SafeAreaView style={[s.container, { backgroundColor: colors.background }]}>
            <Header title="Daily Planning" subtitle="Your monthly schedule" showBack />

            <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
                {/* 1. Horizontal Date Strip */}
                <View style={[s.dateStrip, { backgroundColor: colors.surface }]}>
                    {['MON', 'TUE', 'WED', 'THU', 'FRI'].map((day, i) => {
                        const date = 4 + i;
                        const dateStr = `2026-05-0${date}`;
                        const isSelected = selectedDate === dateStr;
                        return (
                            <PremiumPressable 
                                key={day} 
                                style={[s.dateItem, isSelected && { borderBottomWidth: 3, borderBottomColor: colors.primary }]}
                                onPress={() => setSelectedDate(dateStr)}
                            >
                                <Text style={[s.dateDay, { color: colors.textSecondary }]}>{day}</Text>
                                <Text style={[s.dateNumber, { color: isSelected ? colors.primary : colors.text }]}>{date}</Text>
                            </PremiumPressable>
                        );
                    })}
                </View>

                {/* 2. Styled Daily Progress Card */}
                {isToday && !loading && (
                    <Card style={s.progressCardDesign} elevation="sm">
                        <View style={s.progressRowTop}>
                            <View>
                                <Text style={[s.progressTitle, { color: colors.text }]}>Daily Progress</Text>
                                <Text style={[s.progressRouteId, { color: colors.textSecondary }]}>Route ID: #MR-4029</Text>
                            </View>
                            <Text style={[s.progressPercent, { color: colors.primary }]}>{Math.round(progress * 100)}%</Text>
                        </View>
                        
                        <View style={[s.thinProgressBarContainer, { backgroundColor: colors.border + '30' }]}>
                            <View style={[s.thinProgressBar, { width: `${progress * 100}%`, backgroundColor: colors.primary }]} />
                        </View>

                        <View style={s.progressFooter}>
                            <Text style={[s.progressFooterText, { color: colors.textSecondary }]}>{completedCount} OF {totalCount} STORES</Text>
                            <Text style={[s.progressFooterText, { color: colors.textSecondary }]}>{totalCount - completedCount} REMAINING</Text>
                        </View>
                    </Card>
                )}

                <SectionHeader title="SCHEDULE" />

                <View style={s.timelineContainer}>
                    {loading ? (
                        <View style={{ padding: 40, alignItems: 'center' }}>
                            <Text style={[s.loadingTxt, { color: colors.textSecondary }]}>Loading schedule...</Text>
                        </View>
                    ) : stores.length > 0 ? (
                        stores.map((store, index) => {
                            const isCompleted = workday?.completedGmsIds?.includes(store.id);
                            const isCurrent = (workday && !isCompleted && stores.find(s => !workday.completedGmsIds?.includes(s.id))?.id === store.id);
                            const isLocked = workday && !isCompleted && !isCurrent;

                            return (
                                <View key={store.id} style={s.timelineItem}>
                                    <View style={s.timelineLeft}>
                                        <View style={[s.timelineDot, { backgroundColor: isCurrent ? colors.primary : (isCompleted ? colors.success : colors.textSecondary + '40') }]} />
                                        {index < stores.length - 1 && <View style={[s.timelineLine, { backgroundColor: colors.textSecondary + '20' }]} />}
                                    </View>

                                    <View style={s.timelineRight}>
                                        <Card 
                                            style={[
                                                s.scheduleCard, 
                                                isCurrent && { borderColor: colors.primary, borderWidth: 1, backgroundColor: colors.primary + '05' },
                                                isLocked && { opacity: 0.6 }
                                            ]}
                                            onPress={() => {
                                                if (isCurrent || isCompleted) {
                                                    router.push('/merchandiser/visits');
                                                } else {
                                                    router.push({ pathname: '/merchandiser/gms', params: { selectedId: store.id } });
                                                }
                                            }}
                                        >
                                            <View style={s.cardHeader}>
                                                <Text style={[s.storeNameText, { color: isLocked ? colors.textSecondary : colors.text }]}>{store.name}</Text>
                                                {isCurrent && (
                                                    <View style={[s.badgeCurrent, { backgroundColor: colors.primary }]}>
                                                        <Text style={s.badgeTextWhite}>CURRENT</Text>
                                                    </View>
                                                )}
                                                {isLocked && (
                                                    <View style={[s.badgeLocked, { backgroundColor: colors.textSecondary + '30' }]}>
                                                        <Text style={[s.badgeTextDark, { color: colors.textSecondary }]}>LOCKED</Text>
                                                    </View>
                                                )}
                                            </View>

                                            {isCurrent && (
                                                <Button 
                                                    title="Check-in" 
                                                    size="md" 
                                                    variant="primary"
                                                    style={s.visitBtn}
                                                    loading={actionLoading}
                                                    onPress={() => handleCheckIn(store.id, store.name)}
                                                />
                                            )}
                                        </Card>
                                    </View>
                                </View>
                            );
                        })
                    ) : (
                        <View style={s.empty}>
                            <Ionicons name="calendar-outline" size={48} color={colors.textMuted} />
                            <Text style={{ ...DesignTokens.typography.body, color: colors.textSecondary, marginTop: 12 }}>
                                No visits planned for this date.
                            </Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            <BottomNav items={MERCHANDISER_NAV_ITEMS} activeRoute="/merchandiser/planning" />
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    container: { flex: 1 },
    scroll: { paddingBottom: 100 },
    empty: { alignItems: 'center', paddingTop: 40 },
    loadingTxt: { textAlign: 'center', marginTop: 20 },

    // New Design Styles
    dateStrip: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 12,
        marginBottom: DesignTokens.spacing.md,
    },
    dateItem: {
        alignItems: 'center',
        paddingVertical: 8,
        width: 50,
    },
    dateDay: {
        fontSize: 11,
        fontWeight: '600',
        marginBottom: 4,
    },
    dateNumber: {
        fontSize: 18,
        fontWeight: '700',
    },
    progressCardDesign: {
        marginHorizontal: DesignTokens.spacing.lg,
        padding: 20,
        marginBottom: 20,
    },
    progressRowTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    progressTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    progressRouteId: {
        fontSize: 12,
        marginTop: 2,
    },
    progressPercent: {
        fontSize: 26,
        fontWeight: '800',
    },
    thinProgressBarContainer: {
        height: 2,
        width: '100%',
        borderRadius: 1,
        marginBottom: 16,
    },
    thinProgressBar: {
        height: '100%',
        borderRadius: 1,
    },
    progressFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    progressFooterText: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    timelineContainer: {
        paddingHorizontal: DesignTokens.spacing.lg,
    },
    timelineItem: {
        flexDirection: 'row',
    },
    timelineLeft: {
        width: 30,
        alignItems: 'center',
    },
    timelineDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginTop: 18,
        zIndex: 2,
    },
    timelineLine: {
        position: 'absolute',
        top: 28,
        bottom: -18,
        width: 2,
        zIndex: 1,
    },
    timelineRight: {
        flex: 1,
        paddingBottom: 20,
    },
    scheduleCard: {
        padding: 16,
        borderRadius: 12,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    storeNameText: {
        fontSize: 17,
        fontWeight: '700',
    },
    badgeCurrent: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    badgeLocked: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    badgeTextWhite: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '800',
    },
    badgeTextDark: {
        fontSize: 11,
        fontWeight: '800',
    },
    visitBtn: {
        marginTop: 12,
    },
});
