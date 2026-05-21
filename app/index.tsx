import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  InteractionManager,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { APP_COLORS } from '@/constants/appColors';
import { DesignTokens } from '@/constants/designSystem';
import { Fonts } from '@/hooks/useFonts';
import { useAuth } from '@/context/AuthContext';
import PremiumGlowButton from '@/components/ui/PremiumGlowButton';
import MarqueeLogos from '@/components/MarqueeLogos';

const { width: W, height: H } = Dimensions.get("window");

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

const DOT_COLS = 10;
const DOT_ROWS = 14;
const DOT_SPACING = W / DOT_COLS;

const GridDots = React.memo(function GridDots() {
  const anims = useRef(
    Array.from({ length: DOT_COLS * DOT_ROWS }, () => new Animated.Value(rand(0.05, 0.35)))
  ).current;

  useEffect(() => {
    anims.forEach((a, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(a, {
            toValue: rand(0.4, 0.9),
            duration: rand(1800, 3600),
            delay: rand(0, 800) + i * 12,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(a, {
            toValue: rand(0.05, 0.25),
            duration: rand(1800, 3200),
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {anims.map((a, idx) => {
        const col = idx % DOT_COLS;
        const row = Math.floor(idx / DOT_COLS);
        return (
          <Animated.View
            key={idx}
            style={{
              position: "absolute",
              width: 3,
              height: 3,
              borderRadius: 1.5,
              backgroundColor: "#8b5cf6",
              left: col * DOT_SPACING + DOT_SPACING / 2,
              top: row * (H / DOT_ROWS) + H / DOT_ROWS / 2,
              opacity: a,
            }}
          />
        );
      })}
    </View>
  );
});

export default function HomeScreen() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  // ⚡ Performance optimization: if we are on mobile and already logged in, 
  // don't render the landing page flash — let AuthContext handle the redirect.
  if (Platform.OS !== 'web' && (user || authLoading)) {
      return null;
  }

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const [showMarquee, setShowMarquee] = useState(false);

  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      setShowMarquee(true);
    });
    const t = setTimeout(() => setShowMarquee(true), 800);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 20, friction: 7, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 20, friction: 7, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <GridDots />
      <View style={[styles.blob, { top: -80, left: -60, backgroundColor: "#7c3aed" }]} />
      <View style={[styles.blob, { bottom: 120, right: -80, backgroundColor: "#a21caf", width: 260, height: 260 }]} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(11, 6, 21, 0.4)' }]} />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <Animated.View style={[styles.branding, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
            <Image
              source={require('@/assets/images/index.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <TouchableOpacity>
              <Text style={styles.appName}>MerchandisingTeam</Text>
            </TouchableOpacity>
            <View style={styles.taglineRow}>
              <View style={styles.line} />
              <Text style={styles.tagline}>INTELLIGENT FIELD OPS</Text>
              <View style={styles.line} />
            </View>
          </Animated.View>

          <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Text style={styles.title}>Streamline Your</Text>
            <Text style={styles.accentTitle}>Field Success</Text>
            <Text style={styles.description}>
              The all-in-one platform for real-time visibility, automated reporting, and intelligent field team coordination.
            </Text>

            <View style={styles.features}>
              <Feature icon="analytics-outline" label="Analytics" />
              <View style={styles.dot} />
              <Feature icon="location-outline" label="Live GPS" />
              <View style={styles.dot} />
              <Feature icon="people-outline" label="Team Sync" />
            </View>
          </Animated.View>

          {showMarquee ? <MarqueeLogos /> : <View style={{ height: 60 }} />}

          <View style={styles.actions}>
            <PremiumGlowButton
              title="Get Started"
              onPress={() => router.push('/login')}
              icon="rocket-outline"
              pulse={true}
              variant="neon-white"
              style={{ marginTop: 10, width: '100%' }}
            />
            <TouchableOpacity
              style={styles.skipBtn}
              onPress={() => router.push('/about')}
            >
              <Text style={styles.skipText}>Learn More About Us</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Crafted by Team Dev  •  v1.0.5</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const Feature = ({ icon, label }: { icon: any, label: string }) => (
  <View style={styles.feat}>
    <Ionicons name={icon} size={20} color={APP_COLORS.accent} />
    <Text style={styles.featLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0615' },
  blob: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: 160,
    opacity: 0.12,
  },
  safeArea: { flex: 1 },
  scrollContent: { paddingBottom: 60 },
  branding: {
    alignItems: 'center',
    paddingTop: 50,
    marginBottom: 0,
  },
  logo: { width: 100, height: 100, backgroundColor: 'transparent' },
  appName: {
    fontSize: 26,
    fontFamily: Fonts.headingXBold,
    color: '#fff',
    marginTop: 18,
    letterSpacing: 0.5,
  },
  taglineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    opacity: 0.6,
  },
  line: { width: 16, height: 1, backgroundColor: '#fff', marginHorizontal: 8 },
  tagline: { fontSize: 11, fontFamily: Fonts.subheading, color: '#fff', letterSpacing: 2 },
  content: {
    paddingHorizontal: 28,
    marginBottom: 10,
  },
  title: { fontSize: 32, fontFamily: Fonts.headingLight, color: '#e2e8f0', textAlign: 'center' },
  accentTitle: {
    fontSize: 36,
    fontFamily: Fonts.heading,
    color: APP_COLORS.accent,
    textAlign: 'center',
    marginTop: -8,
  },
  description: {
    fontSize: 15,
    fontFamily: Fonts.body,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 24,
    marginTop: 16,
    marginBottom: 28,
  },
  features: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  feat: { alignItems: 'center' },
  featLabel: { fontSize: 11, fontFamily: Fonts.bodyMedium, color: '#64748b', marginTop: 4 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#334155' },
  actions: { paddingHorizontal: 28, marginTop: 10 },
  primaryBtn: {
    borderRadius: 18,
    overflow: 'hidden',
    marginTop: 10,
    ...DesignTokens.shadows.md,
  },
  btnGradient: {
    flexDirection: 'row',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { color: '#fff', fontSize: 18, fontFamily: Fonts.cta, letterSpacing: 1 },
  iconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginLeft: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 18,
    paddingVertical: 14,
    marginTop: 12,
  },
  googleBtnText: { color: '#fff', fontSize: 16, fontFamily: Fonts.bodyMedium },
  skipBtn: { paddingVertical: 16, alignItems: 'center' },
  skipText: { color: '#64748b', fontSize: 15, fontFamily: Fonts.cta, opacity: 0.8 },
  footer: {
    paddingBottom: 20,
    alignItems: 'center',
    opacity: 0.4,
  },
  footerText: { color: '#fff', fontSize: 10, fontFamily: Fonts.body },
});
