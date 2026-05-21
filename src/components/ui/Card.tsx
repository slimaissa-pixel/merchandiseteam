
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    StyleSheet,
    Text,
    View,
    ViewProps
} from 'react-native';
import { DesignTokens, getColors } from '@/constants/designSystem';
import { useTheme } from '@/context/ThemeContext';
import { PremiumPressable } from './PremiumPressable';

interface CardProps extends ViewProps {
    onPress?: () => void;
    padding?: keyof typeof DesignTokens.spacing;
    elevation?: keyof typeof DesignTokens.shadows;
}

export const Card: React.FC<CardProps> = ({
    children,
    onPress,
    padding = 'md',
    elevation = 'sm',
    style,
    ...props
}) => {
    const { theme } = useTheme();
    const colors = getColors(theme);

    const cardStyle = [
        styles.card,
        {
            backgroundColor: colors.surface,
            padding: DesignTokens.spacing[padding],
            borderWidth: 1,
            borderColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
        },
        DesignTokens.shadows[elevation],
        style,
    ];

    if (onPress) {
        return (
            <PremiumPressable
                onPress={onPress}
                style={cardStyle}
                enableScale
                {...(props as any)}
            >
                {children}
            </PremiumPressable>
        );
    }

    return (
        <View style={cardStyle} {...props}>
            {children}
        </View>
    );
};

interface StatCardProps {
    label: string;
    value: string | number;
    icon: keyof typeof Ionicons.glyphMap;
    color?: string;
    trend?: string;
    trendUp?: boolean;
    onPress?: () => void;
    style?: any;
    valueStyle?: any;
}

export const StatCard: React.FC<StatCardProps> = ({
    label,
    value,
    icon,
    color,
    trend,
    trendUp,
    onPress,
    style,
    valueStyle,
}) => {
    const { theme } = useTheme();
    const colors = getColors(theme);
    const iconColor = color || colors.primary;

    return (
        <Card style={[styles.statCard, style]} onPress={onPress}>
            <View style={[styles.iconBox, { backgroundColor: `${iconColor}20` }]}>
                <Ionicons name={icon} size={22} color={iconColor} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }, valueStyle]}>{value}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
            {trend && (
                <Text
                    style={[
                        styles.statTrend,
                        { color: trendUp ? colors.success : colors.danger },
                    ]}
                >
                    {trendUp ? '↑' : '↓'} {trend}
                </Text>
            )}
        </Card>
    );
};

interface ActionCardProps {
    title: string;
    subtitle: string;
    icon: keyof typeof Ionicons.glyphMap;
    color?: string;
    onPress: () => void;
    vertical?: boolean;
    showChevron?: boolean;
}

export const ActionCard: React.FC<ActionCardProps> = ({
    title,
    subtitle,
    icon,
    color,
    onPress,
    vertical = false,
    showChevron = true,
}) => {
    const { theme } = useTheme();
    const colors = getColors(theme);
    const iconColor = color || colors.primary;

    return (
        <Card
            onPress={onPress}
            style={[
                styles.actionCard,
                vertical && styles.actionCardVertical
            ]}
        >
            <View style={[
                styles.actionIconBox,
                { backgroundColor: `${iconColor}20` },
                vertical && styles.actionIconBoxVertical
            ]}>
                <Ionicons name={icon} size={vertical ? 28 : 24} color={iconColor} />
            </View>
            <View style={styles.actionContent}>
                <Text style={[
                    styles.actionTitle,
                    { color: colors.text },
                    vertical && { textAlign: 'center', fontSize: 14 }
                ]}>
                    {title}
                </Text>
                <Text style={[
                    styles.actionSubtitle,
                    { color: colors.textSecondary },
                    vertical && { textAlign: 'center' }
                ]}>
                    {subtitle}
                </Text>
            </View>
            {showChevron && !vertical && (
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            )}
        </Card>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: DesignTokens.borderRadius.lg,
    },
    statCard: {
        flex: 1,
        alignItems: 'center',
        minWidth: '45%',
        margin: 4,
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: DesignTokens.spacing.sm,
    },
    statValue: {
        ...DesignTokens.typography.h2,
        marginBottom: 4,
        textAlign: 'center',
    },
    statLabel: {
        ...DesignTokens.typography.caption,
        textAlign: 'center',
    },
    statTrend: {
        ...DesignTokens.typography.tiny,
        marginTop: 4,
    },
    actionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: DesignTokens.spacing.md,
    },
    actionCardVertical: {
        flex: 1,
        minWidth: '45%',
        flexDirection: 'column',
        padding: DesignTokens.spacing.lg,
        alignItems: 'center',
        marginBottom: DesignTokens.spacing.sm,
    },
    actionIconBox: {
        width: 52,
        height: 52,
        borderRadius: DesignTokens.borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: DesignTokens.spacing.md,
    },
    actionIconBoxVertical: {
        marginBottom: DesignTokens.spacing.sm,
        marginRight: 0,
    },
    actionContent: {
        flex: 1,
    },
    actionTitle: {
        ...DesignTokens.typography.h3,
        marginBottom: 2,
    },
    actionSubtitle: {
        ...DesignTokens.typography.caption,
    },
});
