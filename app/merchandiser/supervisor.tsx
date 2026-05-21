
import { User } from '@/types/auth';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    Linking,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomNav } from '@/components/ui/BottomNav';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Header } from '@/components/ui/Header';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { DesignTokens, getColors } from '@/constants/designSystem';
import { MERCHANDISER_NAV_ITEMS } from '@/constants/navigation';
import { useTheme } from '@/context/ThemeContext';
import { Fonts } from '@/hooks/useFonts';
import { UserService } from '@/services/user.service';

export default function TeamPage() {
    const router = useRouter();
    const { theme } = useTheme();
    const colors = getColors(theme);

    const [supervisors, setSupervisors] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTeam();
    }, []);

    const loadTeam = async () => {
        try {
            const users = await UserService.getAll();
            setSupervisors(users.filter(u => u.role === 'supervisor'));
        } catch (error) {
            console.error('Failed to load team:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEmail = (email?: string) => Linking.openURL(`mailto:${email || ''}`);
    const handleReport = (supervisorName: string) => {
        // Logic to navigate to a report submission or open a modal
        console.log(`Reporting issue with supervisor: ${supervisorName}`);
        router.push('/merchandiser/reach-supervisor' as any);
    };

    const handlePhone = (phone?: string) => {
        if (phone) Linking.openURL(`tel:${phone}`);
        else Alert.alert('Error', 'No phone number available');
    };

    const renderSupervisorCard = (user: User) => (
        <Card style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                    <Text style={styles.avatarText}>
                        {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                    </Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.userName, { color: colors.text }]}>
                        {user.firstName} {user.lastName}
                    </Text>
                    <Text style={[styles.userRole, { color: colors.primary }]}>
                        Regional Supervisor
                    </Text>
                </View>
                <Button
                    title=""
                    variant="ghost"
                    size="md"
                    onPress={() => handlePhone(user.phone)}
                    icon="call"
                    style={styles.floatingPhoneBtn}
                />
            </View>

            <View style={[styles.actionRow, { borderTopColor: colors.border }]}>
                <Button
                    title="Send Email"
                    variant="ghost"
                    size="sm"
                    onPress={() => handleEmail(user.email)}
                    icon="mail-outline"
                    style={{ flex: 1 }}
                />
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <Button
                    title="Send Report"
                    variant="ghost"
                    size="sm"
                    onPress={() => handleReport(`${user.firstName} ${user.lastName}`)}
                    icon="alert-circle-outline"
                    style={{ flex: 1 }}
                    textStyle={{ color: colors.danger }}
                />
            </View>
        </Card>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <Header title="My Supervisors" subtitle="Contact your management team" showBack />

            <View style={styles.content}>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <LoadingSkeleton width="100%" height={120} borderRadius={DesignTokens.borderRadius.lg} />
                        <LoadingSkeleton width="100%" height={120} borderRadius={DesignTokens.borderRadius.lg} />
                    </View>
                ) : (
                    <FlatList
                        data={supervisors}
                        keyExtractor={(item) => item.id.toString()}
                        ListHeaderComponent={() => <SectionHeader title="Active Supervisors" />}
                        renderItem={({ item }) => (
                            <View style={styles.sectionPadding}>
                                {renderSupervisorCard(item)}
                            </View>
                        )}
                        contentContainerStyle={styles.listPadding}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <View style={styles.empty}>
                                <Ionicons name="people-outline" size={48} color={colors.border} />
                                <Text style={{ color: colors.textSecondary, marginTop: 12 }}>No supervisors assigned.</Text>
                            </View>
                        }
                    />
                )}
            </View>

            <BottomNav items={MERCHANDISER_NAV_ITEMS} activeRoute="/merchandiser/supervisor" />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { flex: 1 },
    sectionPadding: { paddingHorizontal: DesignTokens.spacing.lg },
    listPadding: { paddingBottom: 100 },
    loadingContainer: { padding: DesignTokens.spacing.lg, gap: DesignTokens.spacing.lg },
    card: { padding: DesignTokens.spacing.lg, marginBottom: DesignTokens.spacing.md },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: DesignTokens.spacing.md, marginBottom: DesignTokens.spacing.lg },
    avatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
    avatarText: { color: '#fff', fontSize: 20, fontFamily: Fonts.heading },
    userName: { ...DesignTokens.typography.bodyBold, fontSize: 18 },
    userRole: { ...DesignTokens.typography.caption, fontFamily: Fonts.bodySemiBold },
    actionRow: { flexDirection: 'row', borderTopWidth: 1, paddingTop: DesignTokens.spacing.sm, alignItems: 'center' },
    divider: { width: 1, height: 20 },
    empty: { alignItems: 'center', marginTop: 60 },
    floatingPhoneBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
