import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import {
    Animated,
    Dimensions,
    Easing,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Sparkles as SparklesMobile, Target, BarChart3, Users, Zap, Shield } from 'lucide-react-native';
import PremiumGlowButton from '@/components/ui/PremiumGlowButton';
import { Fonts } from '@/hooks/useFonts';

const { width: W, height: H } = Dimensions.get('window');

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
                            position: 'absolute',
                            width: 3,
                            height: 3,
                            borderRadius: 1.5,
                            backgroundColor: '#8b5cf6',
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

const MOBILE_FEATURES = [
    { icon: Target, title: 'Precision GPS', desc: 'Sub-meter geofencing.' },
    { icon: BarChart3, title: 'Analytics', desc: 'Real-time dashboards.' },
    { icon: Users, title: 'Team Sync', desc: 'Live coordination.' },
    { icon: Zap, title: 'Instant Reports', desc: 'Fast reporting.' },
    { icon: Shield, title: 'Security', desc: 'Enterprise-grade encryption.' },
];

export default function AboutPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const meshAnim1 = useRef(new Animated.Value(0)).current;
    const meshAnim2 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(meshAnim1, { toValue: 1, duration: 8000, useNativeDriver: true }),
                Animated.timing(meshAnim1, { toValue: 0, duration: 8000, useNativeDriver: true })
            ])
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(meshAnim2, { toValue: 1, duration: 12000, useNativeDriver: true }),
                Animated.timing(meshAnim2, { toValue: 0, duration: 12000, useNativeDriver: true })
            ])
        ).start();
    }, [meshAnim1, meshAnim2]);

    const mesh1Style = {
        transform: [
            { translateX: meshAnim1.interpolate({ inputRange: [0, 1], outputRange: [-50, 100] }) },
            { translateY: meshAnim1.interpolate({ inputRange: [0, 1], outputRange: [-50, 150] }) },
            { scale: meshAnim1.interpolate({ inputRange: [0, 1], outputRange: [1, 1.2] }) }
        ]
    };

    const mesh2Style = {
        transform: [
            { translateX: meshAnim2.interpolate({ inputRange: [0, 1], outputRange: [50, -100] }) },
            { translateY: meshAnim2.interpolate({ inputRange: [0, 1], outputRange: [150, -50] }) },
            { scale: meshAnim2.interpolate({ inputRange: [0, 1], outputRange: [1, 1.3] }) }
        ]
    };

    return (
        <View style={styles.container}>
            <View style={StyleSheet.absoluteFill}>
                <View style={[StyleSheet.absoluteFill, { backgroundColor: '#0B0615' }]} />
                <Animated.View style={[{ position: 'absolute', width: 400, height: 400, borderRadius: 200, backgroundColor: 'rgba(212,168,75,0.15)', top: '-10%', left: '-20%' }, mesh1Style]} />
                <Animated.View style={[{ position: 'absolute', width: 400, height: 400, borderRadius: 200, backgroundColor: 'rgba(139,92,246,0.12)', bottom: '-10%', right: '-20%' }, mesh2Style]} />
                <View style={[StyleSheet.absoluteFill, { opacity: 0.03 }]} />
            </View>

            <SafeAreaView style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                    <View style={styles.header}>
                        <View style={styles.badgeContainer}>
                            <SparklesMobile size={14} color="#d4a84b" />
                            <Text style={styles.badge}>ENTERPRISE FIELD INTELLIGENCE</Text>
                        </View>
                        <Text style={styles.title}>Orchestrate{'\n'}<Text style={styles.gold}>Field Success</Text></Text>
                        <Text style={styles.subtitle}>The all-in-one platform for real-time visibility, automated reporting, and intelligent field team coordination.</Text>
                        <PremiumGlowButton
                            title="Launch Platform"
                            onPress={() => router.replace('/')}
                            icon="rocket-outline"
                            pulse={true}
                            variant="neon-white"
                            style={{ marginTop: 10, alignSelf: 'center', minWidth: 220 }}
                        />
                    </View>

                    <View style={styles.section}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                            <View style={{ height: 1, width: 30, backgroundColor: '#d4a84b' }} />
                            <Text style={styles.sectionTitle}>Platform Capabilities</Text>
                        </View>
                        <View style={styles.grid}>
                            {MOBILE_FEATURES.map((f, i) => (
                                <View key={i} style={styles.card}>
                                    <View style={styles.cardIconBox}>
                                        <f.icon size={22} color="#d4a84b" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.cardTitle}>{f.title}</Text>
                                        <Text style={styles.cardDesc}>{f.desc}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>

                    <View style={styles.cta}>
                        <Text style={styles.ctaTitle}>Ready to scale?</Text>
                        <Text style={[styles.subtitle, { marginBottom: 24 }]}>Join thousands of merchandisers already using FieldForce.</Text>
                        <View style={styles.inputRow}>
                            <TextInput
                                placeholder="your@enterprise.com"
                                placeholderTextColor="#64748b"
                                value={email}
                                onChangeText={setEmail}
                                style={styles.input}
                            />
                            <TouchableOpacity style={styles.primaryBtn}>
                                <Text style={styles.btnText}>Request</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0B0615' },
    scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 40, paddingBottom: 80 },
    header: { alignItems: 'center', marginBottom: 60 },
    badgeContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(212,168,75,0.3)', backgroundColor: 'rgba(212,168,75,0.08)', marginBottom: 24 },
    badge: { color: '#fcd98e', fontSize: 10, fontFamily: Fonts.headingXBold, letterSpacing: 2 },
    title: { fontSize: 42, fontFamily: Fonts.heading, color: '#fff', textAlign: 'center', marginBottom: 16, lineHeight: 46 },
    gold: { color: '#d4a84b', fontFamily: Fonts.headingLight },
    subtitle: { color: '#94a3b8', textAlign: 'center', marginBottom: 32, fontSize: 15, fontFamily: Fonts.body, lineHeight: 24, paddingHorizontal: 10 },
    section: { marginBottom: 60 },
    sectionTitle: { color: '#d4a84b', fontFamily: Fonts.headingXBold, fontSize: 11, letterSpacing: 2.5 },
    grid: { gap: 16 },
    card: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 20, borderRadius: 20 },
    cardIconBox: { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(212,168,75,0.1)', borderWidth: 1, borderColor: 'rgba(212,168,75,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    cardTitle: { color: '#fff', fontFamily: Fonts.headingSemiBold, fontSize: 16, marginBottom: 4 },
    cardDesc: { color: '#94a3b8', fontFamily: Fonts.body, fontSize: 13, lineHeight: 20 },
    cta: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)', padding: 30, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    ctaTitle: { color: '#fff', fontSize: 24, fontFamily: Fonts.heading, marginBottom: 8 },
    inputRow: { flexDirection: 'row', gap: 10, width: '100%' },
    input: { flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 14, color: '#fff', fontFamily: Fonts.body, fontSize: 14 },
    primaryBtn: { backgroundColor: '#d4a84b', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 14, justifyContent: 'center' },
    btnText: { color: '#000', fontFamily: Fonts.headingXBold, fontSize: 14 },
});
