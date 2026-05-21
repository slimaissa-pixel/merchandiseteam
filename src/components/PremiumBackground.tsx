import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function PremiumBackground() {
    // Shared slowly drifting animation
    const moveAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.timing(moveAnim, {
                toValue: 1,
                duration: 25000,
                useNativeDriver: true,
            })
        ).start();
    }, []);

    const drift1 = moveAnim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0, 50, 0],
    });

    const drift2 = moveAnim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0, -40, 0],
    });

    return (
        <View style={styles.container}>
            {/* Base Gradient Layer */}
            <LinearGradient
                colors={['#bfc8deff', '#8ca1d3ff', '#4a5a8cff']}
                style={StyleSheet.absoluteFill}
            />

            {/* Glowing Accent Orbs (Drifting) */}
            <Animated.View
                style={[
                    styles.glow,
                    {
                        backgroundColor: '#3b82f625',
                        width: width * 1.2,
                        height: width * 1.2,
                        top: -width * 0.4,
                        right: -width * 0.4,
                        transform: [{ translateX: drift1 }, { translateY: drift2 }],
                    },
                ]}
            />

            <Animated.View
                style={[
                    styles.glow,
                    {
                        backgroundColor: '#afb0ee9a',
                        width: width * 1.5,
                        height: width * 1.5,
                        bottom: -width * 0.5,
                        left: -width * 0.5,
                        transform: [{ translateX: drift2 }, { translateY: drift1 }],
                    },
                ]}
            />

            {/* Subtle Overlay Pattern or Blur */}
            <View style={[styles.overlay, { backgroundColor: 'rgba(15, 23, 42, 0.3)' }]} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#0f172a',
        overflow: 'hidden',
    },
    glow: {
        position: 'absolute',
        borderRadius: 1000,
        opacity: 0.6,
        filter: 'blur(80px)', // Note: standard blur filter might need specific handling on some RN versions, 
        // using opacity and large size is safer for generic RN.
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
    },
});
