import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { useTheme } from "@/context/ThemeContext";
import { Fonts } from "@/hooks/useFonts";
import {
  KPIStats,
  StatsService,
} from "@/services/stats.service";

const isWeb = Platform.OS === "web";

export default function ExecutiveKPI({
  role = "admin"
}: {
  role?: "admin" | "supervisor", stats?: KPIStats | null, COLOR?: any
}) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [period, setPeriod] = useState<"today" | "week" | "month">("today");
  const [data, setData] = useState<KPIStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(0.4)).current;
  const hasMounted = useRef(false);

  const router = useRouter();

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await StatsService.getKPIStats(period);
      setData(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    if (!hasMounted.current) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();
      
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0.4, duration: 1000, useNativeDriver: true })
        ])
      ).start();

      hasMounted.current = true;
    }
  }, [period]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.headerContainer,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View>
            <Text style={[styles.kpiTitle, !isDark && { color: '#0F172A', fontFamily: 'Inter', fontSize: 32, fontWeight: '700' }]}>
              {role === "admin" ? "Executive Operations" : "Team Operations"}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <Animated.View style={[styles.liveDot, { opacity: pulseAnim }]} />
              <Text style={[styles.kpiSubtitle, !isDark && { color: '#64748B', fontFamily: 'Inter' }]}>
                Real-time AI Field Force Intelligence
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.periodToggle, !isDark && { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }]}>
          {(["today", "week", "month"] as const).map((p) => (
            <TouchableOpacity
              key={p}
              onPress={() => setPeriod(p)}
              style={[
                styles.pillBtn,
                period === p && styles.pillBtnActive,
                period === p && !isDark && { backgroundColor: '#EFF6FF', borderColor: '#3B82F6' }
              ]}
            >
              <Text
                style={[
                  styles.pillTxt,
                  period === p && styles.pillTxtActive,
                  !isDark && { color: '#64748B', fontFamily: 'Inter', fontWeight: '500' },
                  period === p && !isDark && { color: '#3B82F6', fontWeight: '600' }
                ]}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>

      <Animated.View style={[styles.grid, { opacity: fadeAnim }]}>
        <View style={{ flexDirection: isWeb ? 'row' : 'column', gap: 16, width: '100%' }}>
          
          <HoverMetricCard
            title="Merchandisers"
            value={data?.active_merchandisers || 0}
            icon="people"
            iconColor="#818cf8"
            subtext="Active in field right now"
            trend={data?.trends ? `${data.trends.active_merchandisers > 0 ? '+' : ''}${data.trends.active_merchandisers}` : "+0"}
            trendUp={(data?.trends?.active_merchandisers ?? 0) >= 0}
            loading={loading}
            isDark={isDark}
            onPress={() => router.push(role === 'admin' ? '/admin/users' : '/supervisor/team')}
          />

          <HoverMetricCard
            title="Stock Alerts"
            value={data?.stock_alerts_count || 0}
            icon="cart"
            iconColor="#f59e0b"
            subtext="Ruptures reported"
            trend={data?.trends ? `${data.trends.stock_alerts > 0 ? '+' : ''}${data.trends.stock_alerts}` : "+0"}
            trendUp={(data?.trends?.stock_alerts ?? 0) <= 0}
            loading={loading}
            isDark={isDark}
            onPress={() => router.push('/admin/before-after')}
          />

          <HoverMetricCard
            title="Store Anomalies"
            value={data?.anomalies_count || 0}
            icon="alert-circle"
            iconColor="#ef4444"
            subtext="Issues requiring action"
            trend={data?.trends ? `${data.trends.anomalies > 0 ? '+' : ''}${data.trends.anomalies}` : "+0"}
            trendUp={(data?.trends?.anomalies ?? 0) <= 0}
            loading={loading}
            isDark={isDark}
            onPress={() => router.push('/admin/before-after')}
          />

          <HoverMetricCard
            title="Objective Completion"
            value={data?.visit_completion_pct || 0}
            suffix="%"
            icon="analytics"
            iconColor="#10b981"
            subtext="Global success rate"
            trend={data?.trends ? `${data.trends.visit_completion > 0 ? '+' : ''}${data.trends.visit_completion}%` : "+0%"}
            trendUp={(data?.trends?.visit_completion ?? 0) >= 0}
            loading={loading}
            showProgress
            isDark={isDark}
            onPress={() => router.push(role === 'admin' ? '/admin/visits' : '/supervisor/dashboard')}
          />
        </View>
      </Animated.View>
    </View>
  );
}

const HoverMetricCard = ({ title, value, suffix = '', icon, iconColor, subtext, trend, trendUp, loading, showProgress, onPress, isDark }: any) => {
  const scale = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0)).current;

  return (
    <View
      style={{ flex: 1, cursor: 'pointer' } as any}
      {...{
        onMouseEnter: () => {
          Animated.parallel([
            Animated.spring(scale, { toValue: 1.03, friction: 6, tension: 50, useNativeDriver: false }),
            Animated.timing(glow, { toValue: 1, duration: 200, useNativeDriver: false })
          ]).start();
        },
        onMouseLeave: () => {
          Animated.parallel([
            Animated.spring(scale, { toValue: 1, friction: 6, tension: 50, useNativeDriver: false }),
            Animated.timing(glow, { toValue: 0, duration: 200, useNativeDriver: false })
          ]).start();
        }
      } as any}
    >
      <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={{ flex: 1 }}>
        <Animated.View style={[
          styles.metricCard,
          {
            backgroundColor: isDark ? '#121214' : '#FFFFFF',
            borderColor: isDark 
              ? glow.interpolate({ inputRange: [0, 1], outputRange: ['#27272a', iconColor + '60'] })
              : '#E2E8F0',
            transform: [{ scale }],
            shadowColor: isDark ? iconColor : 'rgba(0,0,0,1)',
            shadowOffset: isDark
              ? { width: 0, height: glow.interpolate({ inputRange: [0, 1], outputRange: [4, 12] }) as any }
              : { width: 0, height: 2 },
            shadowOpacity: isDark 
              ? glow.interpolate({ inputRange: [0, 1], outputRange: [0, 0.3] }) as any
              : 0.05,
            shadowRadius: isDark
              ? glow.interpolate({ inputRange: [0, 1], outputRange: [10, 24] }) as any
              : 8,
            borderRadius: isDark ? 20 : 16,
            padding: 24,
            ...(!isDark && Platform.OS === 'web' ? { boxShadow: '0 2px 8px rgba(0,0,0,0.05)' } : {})
          }
        ]}>
          {isDark && (
            <LinearGradient
              colors={['rgba(255,255,255,0.03)', 'transparent']}
              style={StyleSheet.absoluteFillObject}
            />
          )}
          
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <View style={[styles.iconBox, { backgroundColor: iconColor + '15' }]}>
                <Ionicons name={icon as any} size={18} color={iconColor} />
              </View>
              <Text style={[styles.cardTitleTxt, !isDark && { color: '#0F172A', fontFamily: 'Inter', fontWeight: '500' }]}>{title}</Text>
            </View>
            {trend && (
              <View style={[styles.trendBadge, { backgroundColor: trendUp ? '#10b98120' : '#ef444420' }]}>
                <Ionicons name={(trendUp ? "trending-up" : "trending-down") as any} size={12} color={trendUp ? "#10b981" : "#ef4444"} />
                <Text style={[styles.trendTxt, { color: trendUp ? "#10b981" : "#ef4444" }]}>{trend}</Text>
              </View>
            )}
          </View>

          {loading ? (
            <SkeletonPulse width={100} height={40} color={isDark ? "#ffffff10" : "#E2E8F0"} style={{ borderRadius: 8, marginBottom: 8 }} />
          ) : (
            <AnimatedNumber value={value} suffix={suffix} style={[styles.metricValue, !isDark && { color: '#0F172A', fontFamily: 'Inter', fontWeight: '700', fontSize: 36 }]} />
          )}

          <Text style={[styles.subtext, !isDark && { color: '#64748B', fontFamily: 'Inter' }]}>{subtext}</Text>
          
          {showProgress && !loading && (
            <AnimatedProgressBar pct={value} color={iconColor} isDark={isDark} />
          )}
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

const SkeletonPulse = ({ width, height, color, style }: any) => {
  const anim = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: false }),
        Animated.timing(anim, { toValue: 0.3, duration: 800, useNativeDriver: false }),
      ]),
    ).start();
  }, []);
  return <Animated.View style={[{ width, height, backgroundColor: color, borderRadius: 8, opacity: anim }, style]} />;
};

const AnimatedNumber = React.memo(({ value, suffix = "", style }: { value: number, suffix?: string, style: any }) => {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    let startTimestamp: number | null = null;
    const duration = 1000; // 1 second animation
    const startValue = displayValue;
    
    if (startValue === value) return;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // easeOutExpo
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = Math.floor(easeProgress * (value - startValue) + startValue);
      setDisplayValue(current);
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setDisplayValue(value);
      }
    };
    requestAnimationFrame(step);
  }, [value]);

  return <Text style={style}>{displayValue}{suffix}</Text>;
});

const AnimatedProgressBar = ({ pct, color, isDark }: { pct: number; color: string; isDark?: boolean }) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: pct > 100 ? 100 : pct, duration: 1200, useNativeDriver: false }).start();
  }, [pct]);
  return (
    <View style={[styles.progressTrack, !isDark && { backgroundColor: '#E2E8F0' }]}>
      <Animated.View
        style={[
          styles.progressFill,
          { backgroundColor: color, width: anim.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] }) }
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
    width: "100%",
  },
  headerContainer: {
    flexDirection: isWeb ? "row" : "column",
    justifyContent: "space-between",
    alignItems: isWeb ? "flex-end" : "flex-start",
    marginBottom: 20,
    gap: 16,
  },
  kpiTitle: {
    fontSize: 28,
    fontFamily: Fonts.headingXBold,
    color: "#ffffff",
    letterSpacing: 0.5,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10b981",
    marginRight: 8,
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  kpiSubtitle: {
    fontSize: 14,
    fontFamily: Fonts.body,
    color: "#a1a1aa",
  },
  periodToggle: {
    flexDirection: "row",
    backgroundColor: "#18181b",
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: "#27272a",
  },
  pillBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  pillBtnActive: {
    backgroundColor: "#27272a",
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  pillTxt: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 12,
    color: "#71717a",
  },
  pillTxtActive: {
    color: "#ffffff",
  },
  grid: {
    flexDirection: isWeb ? "row" : "column",
    gap: 16,
    marginBottom: 24,
  },
  metricCard: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  cardTitleTxt: {
    fontSize: 14,
    fontFamily: Fonts.headingSemiBold,
    color: "#d4d4d8",
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  trendTxt: {
    fontSize: 11,
    fontFamily: Fonts.headingXBold,
  },
  metricValue: {
    fontSize: 42,
    fontFamily: Fonts.headingXBold,
    color: "#ffffff",
    marginBottom: 8,
  },
  subtext: {
    fontSize: 13,
    fontFamily: Fonts.body,
    color: "#71717a",
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "#ffffff10",
    overflow: "hidden",
    marginTop: 16,
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  }
});
