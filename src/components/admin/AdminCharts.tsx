/**
 * AdminCharts.tsx — Native mobile fallback for AdminCharts.web.tsx
 *
 * Expo resolves platform-specific files by extension priority:
 *   .web.tsx → web bundle
 *   .tsx     → native (iOS / Android) fallback
 *
 * recharts cannot run in a React Native context, so this file
 * renders a lightweight native equivalent using only core RN primitives.
 */
import { StyleSheet, Text, View } from "react-native";
import { Fonts } from "@/hooks/useFonts";

const VISIT_TREND = [
  { d: "Lun", p: 32, c: 28 },
  { d: "Mar", p: 38, c: 36 },
  { d: "Mer", p: 30, c: 24 },
  { d: "Jeu", p: 40, c: 39 },
  { d: "Ven", p: 36, c: 33 },
  { d: "Sam", p: 18, c: 15 },
];

const EVT_COLORS = ["#1a6bf0", "#6b3cf0", "#e8394d", "#e07b1a", "#0e9e6b"];
const EVT_LABELS = [
  "Before/After",
  "Facing",
  "Rupture",
  "Concurrent",
  "Nouveau",
];

export default function AdminCharts({ allReports, C }: any) {
  // Count real report types
  const counts = [0, 0, 0, 0, 0];
  allReports?.forEach((r: any) => {
    if (!r.type) return;
    const t = r.type.toLowerCase();
    if (t.includes("before")) counts[0]++;
    else if (t.includes("facing")) counts[1]++;
    else if (t.includes("rupture")) counts[2]++;
    else if (t.includes("concurrent") || t.includes("prix")) counts[3]++;
    else counts[4]++;
  });

  // If no real data yet, use mock values matching the mockup
  const evtValues = counts.every((v) => v === 0) ? [31, 22, 18, 14, 9] : counts;

  const maxVisit = Math.max(...VISIT_TREND.map((d) => d.p));

  return (
    <View style={{ gap: 16 }}>
      {/* ── Visit bar chart ── */}
      <View
        style={[
          styles.card,
          { backgroundColor: C.card, borderColor: C.border },
        ]}
      >
        <Text style={[styles.title, { color: C.text }]}>
          📈 Visites planifiées vs réalisées
        </Text>

        <View style={styles.barGroup}>
          {VISIT_TREND.map(({ d, p, c }) => (
            <View key={d} style={styles.barCol}>
              <View style={styles.barsRow}>
                {/* Planned */}
                <View
                  style={[
                    styles.bar,
                    {
                      height: (p / maxVisit) * 80,
                      backgroundColor: C.border,
                      marginRight: 2,
                    },
                  ]}
                />
                {/* Completed */}
                <View
                  style={[
                    styles.bar,
                    {
                      height: (c / maxVisit) * 80,
                      backgroundColor: "#1a6bf0",
                    },
                  ]}
                />
              </View>
              <Text style={[styles.barLabel, { color: C.textMuted }]}>{d}</Text>
            </View>
          ))}
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: C.border }]} />
            <Text style={[styles.legendText, { color: C.textMuted }]}>
              Planifiées
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#1a6bf0" }]} />
            <Text style={[styles.legendText, { color: C.textMuted }]}>
              Réalisées
            </Text>
          </View>
        </View>
      </View>

      {/* ── Event breakdown ── */}
      <View
        style={[
          styles.card,
          { backgroundColor: C.card, borderColor: C.border },
        ]}
      >
        <Text style={[styles.title, { color: C.text }]}>
          📊 Répartition événements
        </Text>

        {EVT_LABELS.map((label, i) => {
          const total = evtValues.reduce((a, b) => a + b, 0) || 1;
          const pct = Math.round((evtValues[i] / total) * 100);
          return (
            <View key={label} style={{ marginBottom: 10 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 4,
                }}
              >
                <Text
                  style={{
                    color: C.textMuted,
                    fontSize: 12,
                    fontFamily: Fonts.body,
                  }}
                >
                  {label}
                </Text>
                <Text
                  style={{
                    color: C.text,
                    fontSize: 12,
                    fontFamily: Fonts.headingSemiBold,
                  }}
                >
                  {evtValues[i]} ({pct}%)
                </Text>
              </View>
              <View
                style={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: C.border,
                }}
              >
                <View
                  style={{
                    height: 6,
                    borderRadius: 3,
                    width: `${pct}%` as any,
                    backgroundColor: EVT_COLORS[i],
                  }}
                />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
  },
  title: {
    fontSize: 15,
    fontFamily: Fonts.headingXBold,
    marginBottom: 16,
  },
  barGroup: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 90,
    gap: 6,
    marginBottom: 8,
  },
  barCol: {
    flex: 1,
    alignItems: "center",
  },
  barsRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    flex: 1,
  },
  bar: {
    flex: 1,
    borderRadius: 4,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 10,
    marginTop: 4,
    fontFamily: Fonts.body,
  },
  legend: {
    flexDirection: "row",
    gap: 16,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    fontFamily: Fonts.body,
  },
});
