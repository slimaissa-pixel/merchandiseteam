import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Easing,
    Platform,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getFullImageUrl } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

export interface NavItemType {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    route: string;
}

interface BottomNavProps {
    items: NavItemType[];
    activeRoute: string;
}

// Per-item color palettes — cycling through a premium color sequence
const ITEM_COLORS = [
    { from: '#845cfdff', to: '#000000ff' }, // Indigo
    { from: '#0ea5e9', to: '#000000ff' }, // Sky
    { from: '#f59e0b', to: '#000000ff' }, // Amber
    { from: '#10b981', to: '#000000ff' }, // Emerald
    { from: '#f43f5e', to: '#000000ff' }, // Rose
];

const NavItem = React.memo(function NavItem({ item, isActive, index, onPress }: {
    item: NavItemType;
    isActive: boolean;
    index: number;
    onPress: () => void;
}) {
    const { user } = useAuth();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const palette = ITEM_COLORS[index % ITEM_COLORS.length];

    const scaleAnim = useRef(new Animated.Value(1)).current;
    const glowAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const pillScaleAnim = useRef(new Animated.Value(isActive ? 1 : 0)).current;
    const labelAnim = useRef(new Animated.Value(isActive ? 1 : 0)).current;

    useEffect(() => {
        if (isActive) {
            // Start pulsing animation when active
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.15,
                        duration: 1500,
                        easing: Easing.inOut(Easing.sin),
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1500,
                        easing: Easing.inOut(Easing.sin),
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
        }

        Animated.parallel([
            Animated.spring(pillScaleAnim, {
                toValue: isActive ? 1 : 0,
                friction: 6,
                tension: 50,
                useNativeDriver: true,
            }),
            Animated.timing(labelAnim, {
                toValue: isActive ? 1 : 0,
                duration: 200,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.timing(glowAnim, {
                toValue: isActive ? 1 : 0,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start();
    }, [isActive]);

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.85,
            friction: 5,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 5,
            useNativeDriver: true,
        }).start();
    };

    const glowOpacity = glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, isDark ? 0.45 : 0.25],
    });

    const inactiveIconColor = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.3)';

    return (
        <TouchableOpacity
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={1}
            style={styles.touchableItem}
        >
            <Animated.View style={[styles.itemInner, { transform: [{ scale: scaleAnim }] }]}>
                {/* Ambient glow blob behind active item - pulsing */}
                <Animated.View
                    style={[
                        styles.glowBlob,
                        {
                            backgroundColor: palette.from,
                            opacity: glowOpacity,
                            width: 42,
                            height: 42,
                            transform: [
                                { scaleX: Animated.multiply(1.8, pulseAnim) },
                                { scaleY: Animated.multiply(0.9, pulseAnim) },
                                { scale: glowAnim }
                            ],
                        },
                    ]}
                />

                {/* Active pill background */}
                {isActive ? (
                    <Animated.View
                        style={[
                            styles.activePill,
                            {
                                transform: [{ scale: pillScaleAnim }],
                                opacity: pillScaleAnim,
                                shadowColor: palette.from,
                            },
                        ]}
                    >
                        <LinearGradient
                            colors={[palette.from, palette.to]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.gradientPill}
                        />
                    </Animated.View>
                ) : null}

                {/* Icon or Avatar */}
                {item.label === 'Profile' && user?.profileImage ? (
                    <Animated.View style={[
                        styles.avatarContainer,
                        {
                            borderColor: isActive ? '#fff' : inactiveIconColor,
                            transform: [{ scale: isActive ? 1 : 0.9 }]
                        }
                    ]}>
                        <Animated.Image
                            source={{ uri: getFullImageUrl(user.profileImage) || '' }}
                            style={styles.avatarImage}
                        />
                    </Animated.View>
                ) : (
                    <Ionicons
                        name={item.icon}
                        size={isActive ? 20 : 22}
                        color={isActive ? '#ffffff' : inactiveIconColor}
                    />
                )}

                {/* Label fades in below icon when active */}
                <Animated.Text
                    numberOfLines={1}
                    style={[
                        styles.label,
                        {
                            color: isActive ? palette.from : inactiveIconColor,
                            opacity: isActive ? 1 : 0.7,
                            marginTop: isActive ? 4 : 3,
                            fontWeight: isActive ? '700' : '400',
                        },
                    ]}
                >
                    {item.label}
                </Animated.Text>
            </Animated.View>
        </TouchableOpacity>
    );
});

export const BottomNav: React.FC<BottomNavProps> = ({ items, activeRoute }) => {
    const { theme } = useTheme();
    
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const isDark = theme === 'dark';

    // Shimmer effect for the top line
    const shimmerAnim = useRef(new Animated.Value(0)).current;
    
    useEffect(() => {
        Animated.loop(
            Animated.timing(shimmerAnim, {
                toValue: 1,
                duration: 3000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();
    }, []);

    const shimmerTranslateX = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-150, 450],
    });

    // Glass surfaces
    const bgColor = isDark
        ? 'rgba(15, 15, 20, 0.92)'
        : 'rgba(255, 255, 255, 0.9)';
    const borderColor = isDark
        ? 'rgba(255, 255, 255, 0.12)'
        : 'rgba(0, 0, 0, 0.08)';
    const shadowColor = isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(10, 10, 26, 0.15)';

    const bottomPad = Math.max(insets.bottom, 12);
    const navHeight = 70;

    return (
        <View
            style={[
                styles.outerWrapper,
                { bottom: bottomPad },
            ]}
        >
            {/* Premium frosted-glass pill */}
            <View
                style={[
                    styles.pill,
                    {
                        backgroundColor: bgColor,
                        borderColor,
                        shadowColor,
                        height: navHeight,
                    },
                ]}
            >
                {/* Premium Shine Layer */}
                <LinearGradient
                    colors={isDark ? ['transparent', 'rgba(255,255,255,0.05)', 'transparent'] : ['transparent', 'rgba(255,255,255,0.8)', 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={StyleSheet.absoluteFill}
                    pointerEvents="none"
                />

                {/* Subtle inner highlight line at top with shimmer */}
                <View style={[styles.topShineContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                    <Animated.View style={{ flex: 1, transform: [{ translateX: shimmerTranslateX }] }}>
                        <LinearGradient
                            colors={isDark 
                                ? ['transparent', 'rgba(129, 140, 248, 0.5)', 'transparent'] 
                                : ['transparent', 'rgba(99, 102, 241, 0.3)', 'transparent']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={[
                                styles.shimmerLine,
                                { width: '40%' }
                            ]}
                        />
                    </Animated.View>
                </View>

                {items.map((item, i) => (
                    <NavItem
                        key={item.route}
                        item={item}
                        isActive={activeRoute === item.route}
                        index={i}
                        onPress={() => router.replace(item.route as any)}
                    />
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    outerWrapper: {
        position: 'absolute',
        left: 20,
        right: 20,
        alignItems: 'stretch',
        zIndex: 1000,
        // Drop shadow for the floating island
        ...(Platform.OS === 'ios'
            ? {
                shadowOffset: { width: 0, height: 12 },
                shadowRadius: 28,
                shadowOpacity: 0.22,
            }
            : {}),
        elevation: 24,
    },
    pill: {
        flexDirection: 'row',
        borderRadius: 35,
        borderWidth: 1.5,
        overflow: 'hidden',
        alignItems: 'center',
        paddingHorizontal: 6,
        // For Android shadow
        ...(Platform.OS === 'android' ? { elevation: 20 } : {}),
    },
    topShineContainer: {
        position: 'absolute',
        top: 0,
        left: 30,
        right: 30,
        height: 1.5,
        overflow: 'hidden',
        borderBottomLeftRadius: 1,
        borderBottomRightRadius: 1,
    },
    shimmerLine: {
        height: '100%',
    },
    touchableItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
    },
    itemInner: {
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        minHeight: 48,
    },
    glowBlob: {
        position: 'absolute',
        borderRadius: 999,
        // Pulse transform handled in component
    },
    activePill: {
        position: 'absolute',
        width: 50,
        height: 50,
        borderRadius: 18,
        overflow: 'hidden',
        shadowOffset: { width: 0, height: 6 },
        shadowRadius: 15,
        shadowOpacity: 0.6,
        elevation: 10,
    },
    gradientPill: {
        ...StyleSheet.absoluteFillObject,
    },
    label: {
        fontSize: 10.5,
        letterSpacing: 0.2,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
    },
    avatarContainer: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 1.5,
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
});
