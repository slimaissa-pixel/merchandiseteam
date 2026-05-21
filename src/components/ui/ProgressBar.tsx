
import React, { useEffect, useRef } from 'react';
import { Animated, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { DesignTokens, getColors } from '@/constants/designSystem';
import { useTheme } from '@/context/ThemeContext';

interface ProgressBarProps {
    progress: number; // 0 to 1
    label?: string;
    showPercentage?: boolean;
    color?: string;
    style?: StyleProp<ViewStyle>;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
    progress,
    label,
    showPercentage = true,
    color,
    style,
}) => {
    const { theme } = useTheme();
    const colors = getColors(theme);
    const animatedWidth = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(animatedWidth, {
            toValue: Math.max(0, Math.min(1, progress)),
            duration: 1000,
            useNativeDriver: false, // width cannot be animated with native driver
        }).start();
    }, [progress]);

    const accentColor = color || colors.primary;

    return (
        <View style={[styles.container, style]}>
            {(label || showPercentage) && (
                <View style={styles.header}>
                    {label && (
                        <Text style={[styles.label, { color: colors.textSecondary }]}>
                            {label}
                        </Text>
                    )}
                    {showPercentage && (
                        <Text style={[styles.percentage, { color: accentColor }]}>
                            {Math.round(progress * 100)}%
                        </Text>
                    )}
                </View>
            )}
            <View
                style={[
                    styles.track,
                    { backgroundColor: colors.surfaceSecondary },
                ]}
            >
                <Animated.View
                    style={[
                        styles.fill,
                        {
                            backgroundColor: accentColor,
                            width: animatedWidth.interpolate({
                                inputRange: [0, 1],
                                outputRange: ['0%', '100%'],
                            }),
                        },
                    ]}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        marginVertical: DesignTokens.spacing.sm,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: DesignTokens.spacing.xs,
    },
    label: {
        ...DesignTokens.typography.caption,
        fontWeight: '600',
    },
    percentage: {
        ...DesignTokens.typography.caption,
        fontWeight: '700',
    },
    track: {
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
    },
    fill: {
        height: '100%',
        borderRadius: 4,
    },
});
