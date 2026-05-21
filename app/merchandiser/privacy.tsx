import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '@/components/ui/Header';
import { DesignTokens, getColors } from '@/constants/designSystem';
import { useTheme } from '@/context/ThemeContext';

export default function PrivacyPage() {
    const { theme } = useTheme();
    const colors = getColors(theme);

    return (
        <SafeAreaView style={[s.container, { backgroundColor: colors.background }]}>
            <Header title="Privacy Policy" showBack />
            
            <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
                <View style={s.content}>
                    <Text style={[s.lastUpdated, { color: colors.textSecondary }]}>Last Updated: May 2024</Text>
                    
                    <PolicySection 
                        title="1. Data Collection" 
                        content="We collect location data (GPS) only when you are checked into a store visit to ensure accurate reporting and mileage tracking. We also collect photos uploaded during your reports." 
                    />

                    <PolicySection 
                        title="2. How We Use Data" 
                        content="Your data is used to generate performance reports for your management team and to verify the successful completion of assigned merchandising tasks." 
                    />

                    <PolicySection 
                        title="3. Data Security" 
                        content="FieldForce uses industry-standard encryption (SSL/TLS) to protect your data during transmission and storage in our secure cloud infrastructure." 
                    />

                    <PolicySection 
                        title="4. Your Rights" 
                        content="You have the right to access your personal profile data and request corrections. Contact your administrator for data deletion requests." 
                    />

                    <PolicySection 
                        title="5. Third Parties" 
                        content="We do not sell your personal data to third parties. Data is shared only with your employer as part of the FieldForce management service." 
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const PolicySection = ({ title, content }: any) => {
    const { theme } = useTheme();
    const colors = getColors(theme);
    return (
        <View style={s.section}>
            <Text style={[s.sectionTitle, { color: colors.text }]}>{title}</Text>
            <Text style={[s.sectionText, { color: colors.textSecondary }]}>{content}</Text>
        </View>
    );
};

const s = StyleSheet.create({
    container: { flex: 1 },
    scroll: { padding: 24 },
    content: {
        gap: 24,
        paddingBottom: 40,
    },
    lastUpdated: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 8,
    },
    section: {
        gap: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
    },
    sectionText: {
        fontSize: 14,
        lineHeight: 22,
        fontWeight: '500',
    }
});
