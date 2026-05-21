import { Feather, Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '@/components/ui/Header';
import { Card } from '@/components/ui/Card';
import { DesignTokens, getColors } from '@/constants/designSystem';
import { useTheme } from '@/context/ThemeContext';

export default function SupportPage() {
    const { theme } = useTheme();
    const colors = getColors(theme);

    const handleCall = () => Linking.openURL('tel:+21600000000');
    const handleEmail = () => Linking.openURL('mailto:support@fieldforce.tn');

    return (
        <SafeAreaView style={[s.container, { backgroundColor: colors.background }]}>
            <Header title="Help & Support" showBack />
            
            <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
                <View style={s.hero}>
                    <Text style={[s.heroTitle, { color: colors.text }]}>How can we help you today?</Text>
                    <Text style={[s.heroSub, { color: colors.textSecondary }]}>Our support team is available 24/7 to assist you with any field issues.</Text>
                </View>

                <View style={s.contactGrid}>
                    <ContactCard 
                        icon="phone" 
                        title="Call Support" 
                        sub="Direct line to HQ"
                        onPress={handleCall}
                        color="#4F46E5"
                    />
                    <ContactCard 
                        icon="mail" 
                        title="Email Us" 
                        sub="Response in 1 hour"
                        onPress={handleEmail}
                        color="#10B981"
                    />
                </View>

                <Text style={[s.sectionTitle, { color: colors.text }]}>Common Questions</Text>
                
                <FAQItem 
                    question="How do I sync my visits?" 
                    answer="The app syncs automatically when you have internet. You can also pull down on the dashboard to force a manual sync." 
                />
                <FAQItem 
                    question="Offline Mode" 
                    answer="FieldForce works offline! You can log all your activities and photos; they will be uploaded as soon as you reconnect." 
                />
                <FAQItem 
                    question="Reporting Issues" 
                    answer="Use the 'Complaints' button in your profile to send a direct alert to the administrative team." 
                />
            </ScrollView>
        </SafeAreaView>
    );
}

const ContactCard = ({ icon, title, sub, onPress, color }: any) => {
    const { theme } = useTheme();
    const colors = getColors(theme);
    return (
        <TouchableOpacity style={[s.contactCard, { backgroundColor: colors.surface }]} onPress={onPress}>
            <View style={[s.contactIcon, { backgroundColor: color + '15' }]}>
                <Feather name={icon} size={24} color={color} />
            </View>
            <Text style={[s.contactTitle, { color: colors.text }]}>{title}</Text>
            <Text style={[s.contactSub, { color: colors.textSecondary }]}>{sub}</Text>
        </TouchableOpacity>
    );
};

const FAQItem = ({ question, answer }: any) => {
    const { theme } = useTheme();
    const colors = getColors(theme);
    return (
        <Card style={s.faqCard}>
            <Text style={[s.faqQuestion, { color: colors.text }]}>{question}</Text>
            <Text style={[s.faqAnswer, { color: colors.textSecondary }]}>{answer}</Text>
        </Card>
    );
};

const s = StyleSheet.create({
    container: { flex: 1 },
    scroll: { padding: 24 },
    hero: {
        marginBottom: 32,
    },
    heroTitle: {
        fontSize: 24,
        fontWeight: '900',
        marginBottom: 8,
    },
    heroSub: {
        fontSize: 14,
        lineHeight: 20,
    },
    contactGrid: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 32,
    },
    contactCard: {
        flex: 1,
        padding: 20,
        borderRadius: 24,
        alignItems: 'center',
        ...DesignTokens.shadows.sm,
    },
    contactIcon: {
        width: 50,
        height: 50,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    contactTitle: {
        fontSize: 14,
        fontWeight: '800',
        marginBottom: 2,
    },
    contactSub: {
        fontSize: 11,
        fontWeight: '600',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 16,
    },
    faqCard: {
        padding: 20,
        borderRadius: 20,
        marginBottom: 12,
    },
    faqQuestion: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 6,
    },
    faqAnswer: {
        fontSize: 13,
        lineHeight: 18,
    }
});
