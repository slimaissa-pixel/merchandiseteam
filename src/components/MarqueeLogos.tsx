import { useEffect, useRef } from 'react';
import {
    Animated,
    Easing,
    Image,
    Platform,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { Fonts } from '@/hooks/useFonts';
const MARQUES_IMAGE = require('@/assets/images/Marques_Transparent.png');

// Base image dimensions (1536 x 1024)
const IMG_WIDTH = 1536;
const IMG_HEIGHT = 1024;

/**
 * Manual coordinates for each logo on the Marques.png sheet.
 * This ensures perfect centering even if the original grid is irregular.
 */
const LOGO_COORDS = [
    // Row 1
    { x: 90, y: 130, w: 319, h: 210 }, // Delice (Recalibrated for perfect centering)
    { x: 465, y: 165, w: 280, h: 165 }, // Vitalait
    { x: 790, y: 145, w: 250, h: 200 }, // Boga
    { x: 1080, y: 155, w: 285, h: 175 }, // Apla
    // Row 2
    { x: 125, y: 405, w: 290, h: 170 }, // Samba
    { x: 475, y: 395, w: 285, h: 185 }, // Randa
    { x: 795, y: 385, w: 250, h: 200 }, // Triki
    { x: 1075, y: 400, w: 300, h: 185 }, // Diari
    // Row 3
    { x: 135, y: 705, w: 275, h: 210 }, // Saida
    { x: 455, y: 730, w: 310, h: 145 }, // Biscri
    { x: 785, y: 720, w: 290, h: 155 }, // Jbeil
    { x: 1090, y: 715, w: 285, h: 175 }, // Olio
];

// Display settings
const DISPLAY_WIDTH = Platform.select({ web: 140, default: 120 }) || 120;
const LOGO_MARGIN = 40;
const SINGLE_SET_WIDTH = LOGO_COORDS.length * (DISPLAY_WIDTH + LOGO_MARGIN);
const DURATION = (SINGLE_SET_WIDTH / 35) * 1000; // ~35px/s constant speed

const SlicedLogo = ({ index }: { index: number }) => {
    const coord = LOGO_COORDS[index];

    // Scale the entire source image so 'coord.w' becomes 'DISPLAY_WIDTH'
    const scale = DISPLAY_WIDTH / coord.w;
    const targetHeight = coord.h * scale;

    return (
        <View style={styles.logoItem}>
            <View style={[styles.logoSlot, { width: DISPLAY_WIDTH, height: targetHeight }]}>
                <Image
                    source={MARQUES_IMAGE}
                    style={{
                        width: IMG_WIDTH * scale,
                        height: IMG_HEIGHT * scale,
                        position: 'absolute',
                        left: -coord.x * scale,
                        top: -coord.y * scale,
                    }}
                    resizeMode="contain"
                />
            </View>
        </View>
    );
};

export default function MarqueeLogos() {
    const scrollX = useRef(new Animated.Value(0)).current;
    const animRef = useRef<Animated.CompositeAnimation | null>(null);

    useEffect(() => {
        const startAnimation = () => {
            scrollX.setValue(0);
            animRef.current = Animated.timing(scrollX, {
                toValue: -SINGLE_SET_WIDTH,
                duration: DURATION,
                easing: Easing.linear,
                useNativeDriver: true,
            });
            animRef.current.start(({ finished }) => {
                if (finished) startAnimation();
            });
        };

        startAnimation();
        return () => { animRef.current?.stop(); };
    }, []);

    const renderLogos = (prefix: string) =>
        LOGO_COORDS.map((_, index) => (
            <SlicedLogo key={`${prefix}-${index}`} index={index} />
        ));

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.line} />
                <Text style={styles.headerText}>OUR STRATEGIC PARTNERS</Text>
                <View style={styles.line} />
            </View>

            <View style={styles.marqueeContainer}>
                <View style={styles.fadeLeft} />
                <View style={styles.fadeRight} />

                <Animated.View
                    style={[styles.animatedRow, { transform: [{ translateX: scrollX }] }]}
                >
                    {renderLogos('a')}
                    {renderLogos('b')}
                    {renderLogos('c')}
                </Animated.View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginVertical: 15,
        width: '100%',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        paddingHorizontal: 32,
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.08)',
    },
    headerText: {
        fontSize: 10,
        fontFamily: Fonts.heading,
        color: '#64748b',
        letterSpacing: 6,
        marginHorizontal: 16,
        opacity: 0.8,
        textAlign: 'center',
    },
    marqueeContainer: {
        overflow: 'hidden',
        width: '100%',
        height: 95,
        position: 'relative',
    },
    fadeLeft: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 100,
        zIndex: 10,
        ...Platform.select({
            web: { background: 'linear-gradient(to right, rgba(255,255,255,0.95), transparent)' } as any,
            default: {},
        }),
    },
    fadeRight: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: 100,
        zIndex: 10,
        ...Platform.select({
            web: { background: 'linear-gradient(to left, rgba(255,255,255,0.95), transparent)' } as any,
            default: {},
        }),
    },
    animatedRow: {
        flexDirection: 'row',
        alignItems: 'center',
        width: SINGLE_SET_WIDTH * 3,
    },
    logoItem: {
        width: DISPLAY_WIDTH,
        height: 85,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: LOGO_MARGIN / 2,
    },
    logoSlot: {
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    }
});
