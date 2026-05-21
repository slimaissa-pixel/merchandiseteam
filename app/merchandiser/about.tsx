import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '@/components/ui/Header';
import { Card } from '@/components/ui/Card';
import { DesignTokens, getColors } from '@/constants/designSystem';
import { useTheme } from '@/context/ThemeContext';

export default function AboutPage() {
    const { theme } = useTheme();
    const colors = getColors(theme);

    return (
        <SafeAreaView style={[s.container, { backgroundColor: colors.background }]}>
            <Header title="About FieldForce" showBack />
            
            <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
                <View style={s.logoSection}>
                    <View style={[s.logoContainer, { backgroundColor: colors.primary + '10' }]}>
                        <Ionicons name="stats-chart" size={60} color={colors.primary} />
                    </View>
                    <Text style={[s.appName, { color: colors.text }]}>FieldForce</Text>
                    <Text style={[s.version, { color: colors.textSecondary }]}>Version 1.5.0 (Build 2024)</Text>
                </View>

                <Card style={s.card}>
                    <Text style={[s.description, { color: colors.text }]}>
                        FieldForce is a comprehensive merchandising management system designed to optimize field operations, tracking, and reporting for retail teams.
                    </Text>
                    
                    <View style={s.featureList}>
                        <FeatureItem icon="map" text="Real-time Route Optimization" />
                        <FeatureItem icon="camera" text="Visual Merchandising Proof" />
                        <FeatureItem icon="bar-chart-2" text="Instant Performance Analytics" />
                        <FeatureItem icon="users" text="Team Communication Hub" />
                    </View>
                </Card>

                <Text style={[s.copyright, { color: colors.textMuted }]}>
                    © 2024 FieldForce Solutions. All rights reserved.
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const FeatureItem = ({ icon, text }: any) => {
    const { theme } = useTheme();
    const colors = getColors(theme);
    return (
        <View style={s.featureItem}>
            <View style={[s.featureIcon, { backgroundColor: colors.primary + '15' }]}>
                <Feather name={icon} size={16} color={colors.primary} />
            </View>
            <Text style={[s.featureText, { color: colors.textSecondary }]}>{text}</Text>
        </View>
    );
};

const s = StyleSheet.create({
    container: { flex: 1 },
    scroll: { padding: 24, alignItems: 'center' },
    logoSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    logoContainer: {
        width: 120,
        height: 120,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    appName: {
        fontSize: 28,
        fontWeight: '900',
        letterSpacing: 1,
    },
    version: {
        fontSize: 14,
        fontWeight: '600',
        marginTop: 4,
    },
    card: {
        width: '100%',
        padding: 24,
        borderRadius: 24,
    },
    description: {
        fontSize: 16,
        lineHeight: 24,
        textAlign: 'center',
        marginBottom: 24,
    },
    featureList: {
        gap: 16,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    featureIcon: {
        width: 32,
        height: 32,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    featureText: {
        fontSize: 14,
        fontWeight: '600',
    },
    copyright: {
        marginTop: 40,
        fontSize: 12,
        fontWeight: '500',
    }
});
