import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Badge } from '@/components/ui/Badge';
import { BottomNav } from '@/components/ui/BottomNav';
import { Card } from '@/components/ui/Card';
import { Header } from '@/components/ui/Header';
import { DesignTokens, getColors } from '@/constants/designSystem';
import { MERCHANDISER_NAV_ITEMS } from '@/constants/navigation';
import { useTheme } from '@/context/ThemeContext';
import { Fonts } from '@/hooks/useFonts';

const mockReports = [
    { id: '1', store: 'Aziza Tunis', status: 'closed', time: '09:30 AM', duration: '45m', execution: '95%', date: '2026-05-03' },
    { id: '2', store: 'Carrefour Marsa', status: 'closed', time: '11:15 AM', duration: '52m', execution: '100%', date: '2026-05-03' },
    { id: '3', store: 'Aziza Ariana', status: 'open', time: '02:45 PM', duration: '---', execution: '20%', date: '2026-05-03' },
];

export default function ReportsPage() {
    const router = useRouter();
    const { theme } = useTheme();
    const colors = getColors(theme);

    const today = new Date();
    const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
    const formattedDate = today.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <Header title="Reports" showBack />

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* 1. Date Header */}
                <View style={styles.dateHeader}>
                    <Text style={[styles.todayText, { color: colors.textSecondary }]}>Today, {dayName}</Text>
                    <Text style={[styles.dateText, { color: colors.text }]}>{formattedDate}</Text>
                </View>

                {/* 2. Stats Row */}
                <View style={styles.statsGrid}>
                    <Card style={styles.statBox}>
                        <Text style={[styles.statValue, { color: colors.primary }]}>3</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Visits</Text>
                    </Card>
                    <Card style={styles.statBox}>
                        <Text style={[styles.statValue, { color: colors.success }]}>92%</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Avg. Execution</Text>
                    </Card>
                </View>

                {/* 3. Reports List */}
                <View style={styles.listContainer}>
                    {mockReports.map(report => (
                        <Card key={report.id} style={styles.reportCard}>
                            <View style={styles.cardTop}>
                                <View style={styles.cardInfo}>
                                    <Text style={[styles.storeName, { color: colors.text }]}>{report.store}</Text>
                                    <View style={styles.timeRow}>
                                        <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                                        <Text style={[styles.timeText, { color: colors.textSecondary }]}>{report.time}</Text>
                                    </View>
                                </View>
                                <Badge 
                                    label={report.status.toUpperCase()} 
                                    variant={report.status === 'closed' ? 'success' : 'warning'}
                                />
                            </View>

                            <View style={[styles.divider, { backgroundColor: colors.border + '30' }]} />

                            <View style={styles.cardDetails}>
                                <View style={styles.detailItem}>
                                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Execution</Text>
                                    <Text style={[styles.detailValue, { color: colors.text }]}>{report.execution}</Text>
                                </View>
                                <View style={styles.detailItem}>
                                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Duration</Text>
                                    <Text style={[styles.detailValue, { color: colors.text }]}>{report.duration}</Text>
                                </View>
                            </View>

                            <TouchableOpacity 
                                style={[styles.detailsBtn, { backgroundColor: colors.primary + '10' }]}
                                onPress={() => router.push({ pathname: '/merchandiser/report_details', params: { id: report.id } })}
                            >
                                <Text style={[styles.detailsBtnText, { color: colors.primary }]}>Click to check details</Text>
                                <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                            </TouchableOpacity>
                        </Card>
                    ))}
                </View>
            </ScrollView>

            <BottomNav items={MERCHANDISER_NAV_ITEMS} activeRoute="/merchandiser/reports" />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { paddingBottom: 100 },
    dateHeader: { paddingHorizontal: DesignTokens.spacing.lg, paddingTop: 10, marginBottom: 20 },
    todayText: { fontSize: 14, fontWeight: '600', textTransform: 'uppercase' },
    dateText: { fontSize: 24, fontWeight: '800', marginTop: 2 },
    statsGrid: { flexDirection: 'row', paddingHorizontal: DesignTokens.spacing.lg, gap: 12, marginBottom: 24 },
    statBox: { flex: 1, padding: 16, alignItems: 'center' },
    statValue: { fontSize: 20, fontWeight: '800' },
    statLabel: { fontSize: 11, fontWeight: '600', marginTop: 4 },
    listContainer: { paddingHorizontal: DesignTokens.spacing.lg, gap: 16 },
    reportCard: { padding: 16, borderRadius: 20 },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    cardInfo: { flex: 1, gap: 4 },
    storeName: { fontSize: 16, fontWeight: '700' },
    timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    timeText: { fontSize: 12, fontWeight: '500' },
    divider: { height: 1, marginVertical: 12 },
    cardDetails: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
    detailItem: { gap: 4 },
    detailLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase' },
    detailValue: { fontSize: 14, fontWeight: '700' },
    detailsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 44, borderRadius: 12, gap: 8 },
    detailsBtnText: { fontSize: 13, fontWeight: '700' },
});
