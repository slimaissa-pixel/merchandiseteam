import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewProps } from 'react-native';
import { DesignTokens, getColors } from '@/constants/designSystem';
import { useTheme } from '@/context/ThemeContext';

interface SkeletonProps extends ViewProps {
    width?: number | string;
    height?: number | string;
    borderRadius?: number;
}

export const LoadingSkeleton: React.FC<SkeletonProps> = ({
    width,
    height,
    borderRadius = DesignTokens.borderRadius.sm,
    style,
}) => {
    const { theme } = useTheme();
    const colors = getColors(theme);
    const animatedValue = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(animatedValue, {
                    toValue: 0.7,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(animatedValue, {
                    toValue: 0.3,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    return (
        <Animated.View
            style={[
                {
                    width: width as any,
                    height: height as any,
                    borderRadius,
                    backgroundColor: colors.surfaceSecondary,
                    opacity: animatedValue,
                },
                style,
            ]}
        />
    );
};

export const CardSkeleton: React.FC = () => (
    <View style={styles.cardSkeleton}>
        <LoadingSkeleton width={44} height={44} borderRadius={22} style={styles.mb8} />
        <LoadingSkeleton width="80%" height={24} style={styles.mb4} />
        <LoadingSkeleton width="60%" height={16} />
    </View>
);

export const ListItemSkeleton: React.FC = () => (
    <View style={styles.listItemSkeleton}>
        <LoadingSkeleton width={48} height={48} borderRadius={24} />
        <View style={styles.listItemContent}>
            <LoadingSkeleton width="40%" height={16} style={styles.mb4} />
            <LoadingSkeleton width="70%" height={12} />
        </View>
    </View>
);

export const ListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => (
    <View style={styles.listSkeleton}>
        {Array.from({ length: count }).map((_, i) => (
            <ListItemSkeleton key={i} />
        ))}
    </View>
);

export const BannerSkeleton: React.FC = () => (
    <View style={styles.bannerSkeleton}>
        <LoadingSkeleton width="100%" height={180} borderRadius={DesignTokens.borderRadius.lg} />
    </View>
);

const styles = StyleSheet.create({
    cardSkeleton: {
        flex: 1,
        padding: DesignTokens.spacing.md,
        borderRadius: DesignTokens.borderRadius.lg,
        alignItems: 'center',
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    listItemSkeleton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: DesignTokens.spacing.md,
        gap: DesignTokens.spacing.md,
    },
    listItemContent: {
        flex: 1,
    },
    listSkeleton: {
        padding: DesignTokens.spacing.md,
        gap: DesignTokens.spacing.sm,
    },
    bannerSkeleton: {
        padding: DesignTokens.spacing.lg,
    },
    mb8: { marginBottom: 8 },
    mb4: { marginBottom: 4 },
});
