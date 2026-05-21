
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DesignTokens, getColors } from '@/constants/designSystem';
import { useTheme } from '@/context/ThemeContext';
import { Button } from './Button';

interface EmptyStateProps {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    description: string;
    actionTitle?: string;
    onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    icon,
    title,
    description,
    actionTitle,
    onAction,
}) => {
    const { theme } = useTheme();
    const colors = getColors(theme);

    return (
        <View style={styles.container}>
            <View style={[styles.iconBox, { backgroundColor: colors.surfaceSecondary }]}>
                <Ionicons name={icon} size={64} color={colors.textMuted} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
                {description}
            </Text>
            {actionTitle && onAction && (
                <Button
                    title={actionTitle}
                    onPress={onAction}
                    variant="outline"
                    style={styles.button}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: DesignTokens.spacing.xxl,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconBox: {
        width: 120,
        height: 120,
        borderRadius: 60,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: DesignTokens.spacing.xl,
    },
    title: {
        ...DesignTokens.typography.h2,
        textAlign: 'center',
        marginBottom: DesignTokens.spacing.sm,
    },
    description: {
        ...DesignTokens.typography.body,
        textAlign: 'center',
        marginBottom: DesignTokens.spacing.xl,
    },
    button: {
        minWidth: 160,
    },
});
