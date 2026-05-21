
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DesignTokens, getColors } from '@/constants/designSystem';
import { useTheme } from '@/context/ThemeContext';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';

interface BadgeProps {
    label: string;
    variant?: BadgeVariant;
    size?: 'sm' | 'md';
    style?: any;
}

export const Badge: React.FC<BadgeProps> = ({
    label,
    variant = 'neutral',
    size = 'md',
    style,
}) => {
    const { theme } = useTheme();
    const colors = getColors(theme);

    const getVariantStyles = () => {
        switch (variant) {
            case 'success':
                return { bg: colors.success + '20', text: colors.success };
            case 'warning':
                return { bg: colors.warning + '20', text: colors.warning };
            case 'danger':
                return { bg: colors.danger + '20', text: colors.danger };
            case 'info':
                return { bg: colors.info + '20', text: colors.info };
            case 'primary':
                return { bg: colors.primary + '20', text: colors.primary };
            case 'neutral':
            default:
                return { bg: colors.surfaceSecondary, text: colors.textSecondary };
        }
    };

    const { bg, text } = getVariantStyles();

    return (
        <View
            style={[
                styles.container,
                { backgroundColor: bg },
                size === 'sm' ? styles.sm : styles.md,
                style,
            ]}
        >
            <Text
                style={[
                    styles.text,
                    { color: text },
                    size === 'sm' ? DesignTokens.typography.tiny : DesignTokens.typography.caption,
                ]}
            >
                {label.toUpperCase()}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignSelf: 'flex-start',
        borderRadius: DesignTokens.borderRadius.full,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sm: {
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    md: {
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    text: {
        fontWeight: '700',
    },
});
