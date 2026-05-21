import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Easing,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';
const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient);

interface PremiumButtonProps {
    title?: string;
    children?: React.ReactNode;
    onPress?: () => void;
    icon?: keyof typeof Ionicons.glyphMap;
    variant?: 'primary' | 'secondary' | 'glass' | 'neon-white' | 'dark-gray';
    style?: ViewStyle;
    gradientColors?: string[];
    pulse?: boolean;
    disabled?: boolean;
}

/**
 * PremiumGlowButton - Ultra High-End Version
 * Features:
 * - Animated Moving Gradient Outline
 * - Dual-layer Breathing & Pulse Glow
 * - Interactive Scale & Haptics-simulated spring
 * - Shimmer streak
 */
const PremiumGlowButton: React.FC<PremiumButtonProps> = ({
    title,
    children,
    onPress,
    icon,
    variant = 'primary',
    style,
    gradientColors,
    pulse = true,
    disabled = false,
}) => {
    // Animation values
    const scaleValue = useRef(new Animated.Value(1)).current;
    const glowOpacity = useRef(new Animated.Value(0.4)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const shimmerProgress = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // 1. Breathing Glow Animation
        if (pulse) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(glowOpacity, {
                        toValue: 0.9,
                        duration: 2200,
                        easing: Easing.bezier(0.42, 0, 0.58, 1),
                        useNativeDriver: true,
                    }),
                    Animated.timing(glowOpacity, {
                        toValue: 0.2,
                        duration: 2200,
                        easing: Easing.bezier(0.42, 0, 0.58, 1),
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        }

        // 2. High-Refresh Native Border Rotation
        Animated.loop(
            Animated.timing(rotateAnim, {
                toValue: 1,
                duration: 6000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();

        // 3. Smooth Shimmer Logic
        const startShimmer = () => {
            shimmerProgress.setValue(0);
            Animated.timing(shimmerProgress, {
                toValue: 1,
                duration: 2500,
                easing: Easing.inOut(Easing.quad),
                useNativeDriver: true,
            }).start(() => {
                setTimeout(startShimmer, 3500);
            });
        };
        startShimmer();
    }, [pulse]);

    const handlePressIn = () => {
        Animated.spring(scaleValue, {
            toValue: 0.92,
            useNativeDriver: true,
            tension: 130,
            friction: 8,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleValue, {
            toValue: 1,
            useNativeDriver: true,
            tension: 110,
            friction: 6,
        }).start();
    };

    const getColors = () => {
        if (gradientColors) return gradientColors;
        switch (variant) {
            case 'primary': return ['#6366f1', '#a855f7', '#ec4899']; // Indigo-Purple-Pink
            case 'secondary': return ['#22d3ee', '#0ea5e9', '#6366f1']; // Cyan-Sky-Indigo
            case 'glass': return ['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)', 'rgba(255,255,255,0.15)'];
            case 'neon-white': return ['#6366f1', '#a855f7', '#22d3ee']; // Indigo-Purple-Cyan (Professional Match)
            case 'dark-gray': return ['#404040', '#525252', '#404040']; // Neutral dark grays
            default: return ['#6366f1', '#a855f7'];
        }
    };

    const colors = getColors();

    const rotation = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const shimmerTranslateX = shimmerProgress.interpolate({
        inputRange: [0, 1],
        outputRange: [-250, 250],
    });

    return (
        <View style={[styles.outerWrapper, { opacity: disabled ? 0.6 : 1 }, style]}>
            <Animated.View
                style={[
                    styles.glowLayer,
                    {
                        opacity: glowOpacity,
                        backgroundColor: variant === 'glass' ? '#fff' : colors[0],
                        shadowColor: colors[1],
                        transform: [{
                            scale: glowOpacity.interpolate({
                                inputRange: [0, 1],
                                outputRange: [1, 1.15]
                            })
                        }]
                    },
                ]}
            />

            <Animated.View
                style={[
                    styles.btnScaleContainer,
                    {
                        transform: [
                            { scale: scaleValue },
                            {
                                scale: pulse ? glowOpacity.interpolate({
                                    inputRange: [0.2, 0.9],
                                    outputRange: [1, 1.03]
                                }) : 1
                            }
                        ]
                    }
                ]}
            >
                {/* 100% Smooth Native Border */}
                <View style={styles.borderOverflowContainer}>
                    <Animated.View style={[
                        styles.rotatingBorderLayer,
                        { transform: [{ rotate: rotation }] }
                    ]}>
                        <LinearGradient
                            colors={[...colors, ...colors] as any}
                            style={StyleSheet.absoluteFill}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        />
                    </Animated.View>
                </View>
                <View style={[
                    styles.innerMask,
                    variant === 'glass' && styles.glassInner,
                    variant === 'neon-white' && styles.neonWhiteInner
                ]}>
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={onPress}
                        onPressIn={handlePressIn}
                        onPressOut={handlePressOut}
                        disabled={disabled}
                        style={styles.touchable}
                    >
                        <LinearGradient
                            colors={
                                variant === 'neon-white' ? ['#1c3378ff', '#0c68aaff'] :
                                    variant === 'glass' ? ['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.6)'] :
                                        variant === 'dark-gray' ? ['#171717', '#262626'] :
                                            [colors[0], colors[1]] as any
                            }
                            style={styles.contentGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            {/* Shimmer Streak */}
                            <Animated.View
                                style={[
                                    styles.shimmer,
                                    { transform: [{ translateX: shimmerTranslateX }, { skewX: '-45deg' }] },
                                ]}
                            >
                                <LinearGradient
                                    colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.3)', 'rgba(255,255,255,0.6)', 'rgba(255,255,255,0.3)', 'rgba(255,255,255,0)']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={StyleSheet.absoluteFill}
                                />
                            </Animated.View>

                            <View style={styles.content}>
                                {icon && (
                                    <View style={styles.iconBox}>
                                        <Ionicons
                                            name={icon}
                                            size={19}
                                            color="#fff"
                                        />
                                    </View>
                                )}
                                <Text style={styles.btnText}>
                                    {title}
                                </Text>
                                {children}
                                <Ionicons
                                    name="chevron-forward"
                                    size={14}
                                    color="rgba(255,255,255,0.7)"
                                    style={styles.arrowIcon}
                                />
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    outerWrapper: {
        height: 56,
        minWidth: 170,
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 12,
    },
    glowLayer: {
        position: 'absolute',
        width: '80%',
        height: '50%',
        borderRadius: 100,
        ...Platform.select({
            ios: {
                shadowOpacity: 1,
                shadowRadius: 20,
                shadowOffset: { width: 0, height: 0 },
            },
            android: {
                elevation: 25,
            },
            web: {
                filter: 'blur(30px)',
            }
        } as any),
    },
    btnScaleContainer: {
        width: '100%',
        height: '100%',
        borderRadius: 28,
        overflow: 'hidden',
    },
    borderOverflowContainer: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 28,
        overflow: 'hidden',
        padding: 2,
    },
    rotatingBorderLayer: {
        position: 'absolute',
        top: '-100%',
        left: '-100%',
        width: '300%',
        height: '300%',
    },
    innerMask: {
        flex: 1,
        borderRadius: 26,
        overflow: 'hidden',
        backgroundColor: '#000',
        ...Platform.select({
            ios: {
                shadowOpacity: 0.5,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 0 },
            },
            android: {
                elevation: 4,
            },
            web: {
                boxShadow: '0 0 15px rgba(255,255,255,0.3)',
            }
        } as any),
    },
    glassInner: {
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    neonWhiteInner: {
        backgroundColor: '#1c3378',
    },
    touchable: {
        flex: 1,
    },
    contentGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 26,
    },
    iconBox: {
        marginRight: 10,
    },
    btnText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '800',
        letterSpacing: 0.8,
        textTransform: 'uppercase',
    },
    arrowIcon: {
        marginLeft: 10,
    },
    shimmer: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 140, // Wider for sharper tilt
    },
});

export default PremiumGlowButton;
