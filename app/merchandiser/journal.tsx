
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Badge } from '@/components/ui/Badge';
import { BottomNav, NavItemType } from '@/components/ui/BottomNav';
import { Button } from '@/components/ui/Button';
import { Card, StatCard } from '@/components/ui/Card';
import { Header } from '@/components/ui/Header';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { DesignTokens, getColors } from '@/constants/designSystem';
import { useTheme } from '@/context/ThemeContext';

// Using MERCHANDISER_NAV_ITEMS from constants/navigation.ts


export default function MerchandiserJournal() {
  const router = useRouter();
  const { theme } = useTheme();
  const colors = getColors(theme);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Journal"
        subtitle="Daily objectives & performance"
        showBack
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <SectionHeader title="Progress Snapshot" />
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Daily Target</Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                156 / 240 Visits Completed
              </Text>
            </View>
            <Badge label="65%" variant="info" />
          </View>

          <ProgressBar
            progress={0.65}
          />

          <View style={styles.cardFooter}>
            <View style={styles.row}>
              <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
              <Text style={[styles.muted, { color: colors.textSecondary }]}>On track for 6:00 PM finish</Text>
            </View>
            <Button
              title="View Schedule"
              size="sm"
              onPress={() => router.push('/merchandiser/visits')}
            />
          </View>
        </Card>

        <SectionHeader title="Performance Analytics" />
        <View style={styles.grid}>
          <StatCard label="ATTENDANCE" value="100%" icon="checkmark-done" color={colors.primary} />
          <StatCard label="VISIT LOGS" value="Active" icon="document-text" color={colors.secondary} />
          <StatCard label="EXCEPTIONS" value="3" icon="alert-circle" color={colors.danger} />
          <StatCard label="EFFICIENCY" value="8.4" icon="bar-chart" color={colors.success} />
        </View>

        <SectionHeader
          title="Team Map Snapshot"
          actionLabel="View Map"
          onAction={() => router.push('/merchandiser/map')}
        />
        <Card style={styles.mapCard}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=600' }}
            style={styles.mapImage}
          />
          <View style={styles.mapOverlay}>
            <Button
              title="Expand View"
              variant="ghost"
              size="sm"
              onPress={() => router.push('/merchandiser/map')}
              icon="calendar-outline"
              style={{ backgroundColor: colors.surface + 'cc' }}
            />
          </View>
        </Card>

      </ScrollView>

      <BottomNav items={MERCHANDISER_NAV_ITEMS} activeRoute="/merchandiser/journal" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: 100 },
  card: { marginHorizontal: DesignTokens.spacing.lg, padding: DesignTokens.spacing.lg, marginBottom: DesignTokens.spacing.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: DesignTokens.spacing.md },
  cardTitle: { ...DesignTokens.typography.bodyBold },
  cardSubtitle: { ...DesignTokens.typography.caption },
  progress: { marginBottom: DesignTokens.spacing.md },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  muted: { ...DesignTokens.typography.caption },
  grid: { paddingHorizontal: DesignTokens.spacing.lg, flexDirection: 'row', flexWrap: 'wrap', gap: DesignTokens.spacing.sm },
  mapCard: { marginHorizontal: DesignTokens.spacing.lg, overflow: 'hidden', padding: 0 },
  mapImage: { width: '100%', height: 180 },
  mapOverlay: { position: 'absolute', bottom: 12, right: 12 },
});
