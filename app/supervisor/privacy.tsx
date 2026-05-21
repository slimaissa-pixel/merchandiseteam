import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomNav } from '@/components/ui/BottomNav';
import { getColors } from '@/constants/designSystem';
import { SUPERVISOR_NAV_ITEMS } from '@/constants/navigation';
import { useTheme } from '@/context/ThemeContext';

export default function PrivacyPage() {
    const router = useRouter();
    const { theme } = useTheme();
    const colors = getColors(theme);

    const [biometric, setBiometric] = useState(true);
    const [twoFactor, setTwoFactor] = useState(false);
    const [locationTracking, setLocationTracking] = useState(true);
    const [analytics, setAnalytics] = useState(true);

    const renderToggle = (label: string, value: boolean, onValueChange: (val: boolean) => void, icon: string) => (
        <View style={[styles.toggleRow, { borderBottomColor: colors.border }]}>
            <View style={styles.toggleLeft}>
                <View style={[styles.iconContainer, { backgroundColor: colors.background }]}>
                    <Ionicons name={icon as any} size={20} color={colors.text} />
                </View>
                <Text style={[styles.toggleLabel, { color: colors.text }]}>{label}</Text>
            </View>
            <Switch
                value={value}
                onValueChange={onValueChange}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={"#fff"}
            />
        </View>
    );

    const renderAction = (label: string, icon: string, onPress: () => void, color?: string) => (
        <TouchableOpacity style={[styles.actionRow, { borderBottomColor: colors.border }]} onPress={onPress}>
            <View style={styles.toggleLeft}>
                <View style={[styles.iconContainer, { backgroundColor: colors.background }]}>
                    <Ionicons name={icon as any} size={20} color={color || colors.text} />
                </View>
                <Text style={[styles.toggleLabel, { color: color || colors.text }]}>{label}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.surface }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Privacy & Security</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>SECURITY</Text>
                    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        {renderToggle('Biometric Login', biometric, setBiometric, 'finger-print')}
                        {renderToggle('Two-Factor Auth', twoFactor, setTwoFactor, 'shield-checkmark')}
                        {renderAction('Change Password', 'key', () => { }, colors.text)}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>DATA & PRIVACY</Text>
                    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        {renderToggle('Location Tracking', locationTracking, setLocationTracking, 'location')}
                        {renderToggle('Share Analytics', analytics, setAnalytics, 'bar-chart')}
                        {renderAction('Download My Data', 'download', () => { }, colors.text)}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ACCOUNT</Text>
                    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        {renderAction('Deactivate Account', 'trash', () => { }, colors.danger)}
                    </View>
                </View>

                <Text style={[styles.disclaimer, { color: colors.textSecondary }]}>
                    Read our Privacy Policy and Terms of Service for more information about how we protect your data.
                </Text>
            </ScrollView>

            <BottomNav items={SUPERVISOR_NAV_ITEMS} activeRoute="/supervisor/profile" />
        </SafeAreaView>
    );
}


const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    placeholder: { width: 32 },

    content: { padding: 16, paddingBottom: 100, gap: 24 },

    section: { gap: 8 },
    sectionTitle: { fontSize: 12, fontWeight: '600', paddingLeft: 8, marginBottom: 4 },
    card: {
        borderRadius: 16,
        borderWidth: 1,
        overflow: 'hidden',
    },
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
    },
    toggleLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    toggleLabel: { fontSize: 15, fontWeight: '500' },

    disclaimer: {
        fontSize: 12,
        textAlign: 'center',
        paddingHorizontal: 20,
        lineHeight: 18,
    },

});
