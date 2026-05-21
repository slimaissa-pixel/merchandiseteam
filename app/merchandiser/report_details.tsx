import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Header } from '@/components/ui/Header';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { DesignTokens, getColors } from '@/constants/designSystem';
import { useTheme } from '@/context/ThemeContext';
import { Fonts } from '@/hooks/useFonts';

export default function ReportDetails() {
    const router = useRouter();
    const { theme } = useTheme();
    const colors = getColors(theme);
    const { id } = useLocalSearchParams<{ id: string }>();

    // Mock data for the detailed report
    const reportData = {
        date: 'Sunday, May 3, 2026',
        status: 'Closed',
        storesVisited: 1,
        hoursWorked: '0h 41m',
        storeName: 'Aziza Tunis',
        arrival: '09:12 AM',
        departure: '09:53 AM',
        timeSpent: '41 min',
        notes: "Full shelf stocking completed. Facing adjusted on Warda products. 2+1 promotion set up on Safia oil.",
        photos: [
            'https://picsum.photos/400/300?random=1',
            'https://picsum.photos/400/300?random=2'
        ],
        stockUpdated: true
    };

    return (
        <SafeAreaView style={[s.container, { backgroundColor: colors.background }]}>
            <Header title="Report Details" showBack />

            <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
                {/* 1. Résumé Header Card */}
                <Card style={s.resumeCard}>
                    <View style={s.resumeTop}>
                        <Text style={[s.resumeDate, { color: colors.text }]}>{reportData.date}</Text>
                        <Badge label={reportData.status} variant="success" />
                    </View>

                    <View style={[s.divider, { backgroundColor: colors.border + '30' }]} />

                    <View style={s.resumeStats}>
                        <View style={s.statItem}>
                            <View style={[s.iconCircle, { backgroundColor: colors.primary + '10' }]}>
                                <Ionicons name="storefront" size={20} color={colors.primary} />
                            </View>
                            <Text style={[s.statValue, { color: colors.text }]}>{reportData.storesVisited}</Text>
                            <Text style={[s.statLabel, { color: colors.textSecondary }]}>STORES VISITED</Text>
                        </View>
                        <View style={s.statItem}>
                            <View style={[s.iconCircle, { backgroundColor: '#F59E0B20' }]}>
                                <Ionicons name="time" size={20} color="#F59E0B" />
                            </View>
                            <Text style={[s.statValue, { color: colors.text }]}>{reportData.hoursWorked}</Text>
                            <Text style={[s.statLabel, { color: colors.textSecondary }]}>HOURS WORKED</Text>
                        </View>
                    </View>
                </Card>

                {/* 2. Détails des Visites Section */}
                <SectionHeader title="VISIT DETAILS" />
                
                <Card style={s.visitDetailCard}>
                    <View style={s.visitHeader}>
                        <Text style={[s.visitStoreName, { color: colors.text }]}>{reportData.storeName}</Text>
                        <View style={s.visitBadge}>
                            <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                            <Text style={[s.visitBadgeText, { color: colors.success }]}>Updated</Text>
                        </View>
                    </View>

                    <View style={s.timeGrid}>
                        <View style={s.timeItem}>
                            <Text style={[s.timeLabel, { color: colors.textSecondary }]}>ARRIVAL</Text>
                            <Text style={[s.timeValue, { color: colors.text }]}>{reportData.arrival}</Text>
                        </View>
                        <View style={s.timeItem}>
                            <Text style={[s.timeLabel, { color: colors.textSecondary }]}>DEPARTURE</Text>
                            <Text style={[s.timeValue, { color: colors.text }]}>{reportData.departure}</Text>
                        </View>
                        <View style={s.timeItem}>
                            <Text style={[s.timeLabel, { color: colors.textSecondary }]}>TIME SPENT</Text>
                            <Text style={[s.timeValue, { color: colors.primary }]}>{reportData.timeSpent}</Text>
                        </View>
                    </View>

                    <SectionHeader title="PHOTOS" size="sm" style={{ paddingHorizontal: 0, marginTop: 16 }} />
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.photoScroll}>
                        {reportData.photos.map((uri, index) => (
                            <Image key={index} source={{ uri }} style={s.photoPreview} />
                        ))}
                    </ScrollView>

                    <SectionHeader title="OBSERVATIONS" size="sm" style={{ paddingHorizontal: 0, marginTop: 16 }} />
                    <View style={[s.notesBox, { backgroundColor: colors.surfaceSecondary + '50' }]}>
                        <Text style={[s.notesText, { color: colors.textSecondary }]}>{reportData.notes}</Text>
                    </View>
                </Card>
            </ScrollView>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    container: { flex: 1 },
    scroll: { paddingBottom: 40 },
    resumeCard: {
        marginHorizontal: DesignTokens.spacing.lg,
        padding: 20,
        borderRadius: 24,
        marginTop: 10,
        ...DesignTokens.shadows.md,
    },
    resumeTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    resumeDate: {
        fontSize: 18,
        fontWeight: '800',
    },
    divider: {
        height: 1,
        marginVertical: 20,
    },
    resumeStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    iconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    statValue: {
        fontSize: 22,
        fontWeight: '900',
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    visitDetailCard: {
        marginHorizontal: DesignTokens.spacing.lg,
        padding: 20,
        borderRadius: 20,
        marginBottom: 20,
    },
    visitHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    visitStoreName: {
        fontSize: 20,
        fontWeight: '800',
    },
    visitBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#10B98110',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    visitBadgeText: {
        fontSize: 11,
        fontWeight: '700',
    },
    timeGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    timeItem: {
        gap: 4,
    },
    timeLabel: {
        fontSize: 10,
        fontWeight: '700',
    },
    timeValue: {
        fontSize: 14,
        fontWeight: '800',
    },
    photoScroll: {
        marginTop: 8,
    },
    photoPreview: {
        width: 140,
        height: 100,
        borderRadius: 12,
        marginRight: 10,
    },
    notesBox: {
        marginTop: 8,
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    notesText: {
        fontSize: 13,
        lineHeight: 20,
        fontFamily: Fonts.body,
    },
});
