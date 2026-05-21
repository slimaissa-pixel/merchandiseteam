
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomNav } from '@/components/ui/BottomNav';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Header } from '@/components/ui/Header';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { DesignTokens, getColors } from '@/constants/designSystem';
import { MERCHANDISER_NAV_ITEMS } from '@/constants/navigation';
import { useTheme } from '@/context/ThemeContext';

const faqItems = [
    { question: 'How do I submit a leave request?', answer: 'Go to your Profile and select Leave Requests. Click on the "Submit Request" button after filling out the form.' },
    { question: 'How can I change my password?', answer: 'Go to Profile > Privacy & Security > Change Password.' },
    { question: 'Where can I find my objectives?', answer: 'Your objectives are listed under the "Journal" tab or "Performance Index" in your Profile.' },
];

export default function HelpPage() {
    const router = useRouter();
    const { theme } = useTheme();
    const colors = getColors(theme);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <Header title="Help & Support" subtitle="Get assistance & FAQs" showBack />

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <SectionHeader title="Contact Support" />
                <Card style={styles.contactCard}>
                    <Button
                        title="Call Support"
                        variant="ghost"
                        onPress={() => { }}
                        style={styles.contactBtn}
                        icon="call"
                        rightIcon="chevron-forward"
                        subtitle="+216 55 55 55 55"
                    />
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    <Button
                        title="Email Support"
                        variant="ghost"
                        onPress={() => { }}
                        style={styles.contactBtn}
                        icon="mail"
                        rightIcon="chevron-forward"
                        subtitle="support@merchanapp.com"
                    />
                </Card>

                <SectionHeader title="Common Questions" />
                <View style={styles.faqList}>
                    {faqItems.map((item, index) => (
                        <Card key={index} style={styles.faqCard}>
                            <Text style={[styles.question, { color: colors.text }]}>{item.question}</Text>
                            <Text style={[styles.answer, { color: colors.textSecondary }]}>{item.answer}</Text>
                        </Card>
                    ))}
                </View>

                <View style={styles.footer}>
                    <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                        Version 1.2.0 (Build 104)
                    </Text>
                    <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                        © 2024 FieldForce Enterprise Solutions
                    </Text>
                </View>
            </ScrollView>

            <BottomNav items={MERCHANDISER_NAV_ITEMS} activeRoute="/merchandiser/profile" />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { paddingBottom: 100 },
    contactCard: { marginHorizontal: DesignTokens.spacing.lg, padding: 4 },
    contactBtn: { justifyContent: 'flex-start', paddingVertical: DesignTokens.spacing.md },
    iconBox: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    divider: { height: 1, marginHorizontal: DesignTokens.spacing.md },
    faqList: { paddingHorizontal: DesignTokens.spacing.lg, gap: DesignTokens.spacing.md },
    faqCard: { padding: DesignTokens.spacing.lg, gap: 8 },
    question: { ...DesignTokens.typography.bodyBold },
    answer: { ...DesignTokens.typography.body, fontSize: 14, lineHeight: 20 },
    footer: { padding: DesignTokens.spacing.xxl, alignItems: 'center', gap: 4 },
    footerText: { ...DesignTokens.typography.caption, fontSize: 11, opacity: 0.6 },
});
