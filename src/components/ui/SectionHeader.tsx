
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DesignTokens, getColors } from '@/constants/designSystem';
import { useTheme } from '@/context/ThemeContext';
import { Fonts } from '@/hooks/useFonts';

interface SectionHeaderProps {
    title: string;
    actionLabel?: string;
    onAction?: () => void;
    style?: any;
    compact?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
    title,
    actionLabel,
    onAction,
    style,
    compact,
    size,
}) => {
    const { theme } = useTheme();
    const colors = getColors(theme);
    const isSmall = compact || size === 'sm';

    return (
        <View style={[
            styles.container,
            isSmall && styles.containerCompact,
            style
        ]}>
            <Text style={[
                styles.title,
                isSmall && styles.titleCompact,
                { color: colors.text }
            ]}>
                {title}
            </Text>
            {actionLabel && onAction && (
                <TouchableOpacity onPress={onAction}>
                    <Text style={[styles.action, { color: colors.primary }]}>
                        {actionLabel}
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: DesignTokens.spacing.xl,
        marginBottom: DesignTokens.spacing.md,
        paddingHorizontal: DesignTokens.spacing.lg,
    },
    containerCompact: {
        marginTop: DesignTokens.spacing.md,
        marginBottom: DesignTokens.spacing.sm,
    },
    title: {
        ...DesignTokens.typography.h2,
    },
    titleCompact: {
        ...DesignTokens.typography.h3,
        letterSpacing: 0.5,
    },
    action: {
        ...DesignTokens.typography.caption,
        fontWeight: '700',
    },
});
