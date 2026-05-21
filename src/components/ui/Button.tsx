
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ActivityIndicator,
    Platform,
    PressableProps,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { DesignTokens, getColors } from '@/constants/designSystem';
import { useTheme } from '@/context/ThemeContext';
import { Fonts } from '@/hooks/useFonts';
import { PremiumPressable } from './PremiumPressable';

type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'danger' | 'secondary' | 'success' | 'warning';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends PressableProps {
    title?: string;
    subtitle?: string;
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    icon?: keyof typeof Ionicons.glyphMap;
    iconPosition?: 'left' | 'right';
    fullWidth?: boolean;
    textStyle?: object;
    rightIcon?: keyof typeof Ionicons.glyphMap;
    centered?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    title,
    subtitle,
    variant = 'primary',
    size = 'md',
    loading = false,
    icon,
    iconPosition = 'left',
    fullWidth = false,
    style,
    disabled,
    textStyle,
    rightIcon,
    centered = false,
    ...props
}) => {
    const { theme } = useTheme();
    const colors = getColors(theme);

    const getVariantStyles = () => {
        switch (variant) {
            case 'primary':
                return {
                    container: { backgroundColor: colors.primary },
                    text: { color: '#FFFFFF' },
                    icon: '#FFFFFF',
                };
            case 'secondary':
                return {
                    container: { backgroundColor: colors.secondary },
                    text: { color: '#FFFFFF' },
                    icon: '#FFFFFF',
                };
            case 'outline':
                return {
                    container: {
                        backgroundColor: 'transparent',
                        borderWidth: 1.5,
                        borderColor: colors.primary,
                    },
                    text: { color: colors.primary },
                    icon: colors.primary,
                };
            case 'ghost':
                return {
                    container: { backgroundColor: 'transparent' },
                    text: { color: colors.primary },
                    icon: colors.primary,
                };
            case 'danger':
                return {
                    container: { backgroundColor: colors.danger },
                    text: { color: '#FFFFFF' },
                    icon: '#FFFFFF',
                };
            case 'success':
                return {
                    container: { backgroundColor: colors.success },
                    text: { color: '#FFFFFF' },
                    icon: '#FFFFFF',
                };
            case 'warning':
                return {
                    container: { backgroundColor: colors.warning },
                    text: { color: '#FFFFFF' },
                    icon: '#FFFFFF',
                };
            default:
                return {
                    container: { backgroundColor: colors.primary },
                    text: { color: '#FFFFFF' },
                    icon: '#FFFFFF',
                };
        }
    };

    const getSizeStyles = () => {
        switch (size) {
            case 'sm':
                return {
                    container: { paddingVertical: 6, paddingHorizontal: 12 },
                    text: { ...DesignTokens.typography.tiny, textTransform: 'uppercase' as const },
                };
            case 'md':
                return {
                    container: { paddingVertical: 14, paddingHorizontal: 20 },
                    text: DesignTokens.typography.button,
                };
            case 'lg':
                return {
                    container: { paddingVertical: 18, paddingHorizontal: 24 },
                    text: { ...DesignTokens.typography.button, fontSize: 18 },
                };
        }
    };

    const variantStyles = getVariantStyles();
    const sizeStyles = getSizeStyles();

    return (
        <PremiumPressable
            disabled={disabled || loading}
            enableScale={!loading && !disabled}
            style={({ pressed }: { pressed: boolean }) => [
                styles.container,
                sizeStyles.container,
                variantStyles.container,
                fullWidth && styles.fullWidth,
                disabled && styles.disabled,
                { opacity: pressed ? 0.8 : 1 }, // Simulating activeOpacity
                style as any,
            ]}
            {...props}
        >
            {loading ? (
                <ActivityIndicator color={variantStyles.text.color} size="small" />
            ) : (
                <View style={[styles.content, fullWidth && { flex: 1 }]}>
                    {icon && iconPosition === 'left' && (
                        <Ionicons
                            name={icon}
                            size={size === 'sm' ? 16 : 20}
                            color={variantStyles.icon as any}
                            style={styles.iconLeft}
                        />
                    )}
                    
                    <View style={styles.textWrapper}>
                        {(title !== undefined && title !== '') && (
                            <Text 
                                style={[
                                    styles.text, 
                                    sizeStyles.text, 
                                    variantStyles.text, 
                                    textStyle,
                                    { fontWeight: '700' }
                                ]}
                                numberOfLines={1}
                            >
                                {title}
                            </Text>
                        )}
                        {subtitle && (
                            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                                {subtitle}
                            </Text>
                        )}
                    </View>

                    {icon && iconPosition === 'right' && (
                        <Ionicons
                            name={icon}
                            size={size === 'sm' ? 16 : 20}
                            color={variantStyles.icon as any}
                            style={styles.iconRight}
                        />
                    )}
                    {rightIcon && (
                        <Ionicons
                            name={rightIcon}
                            size={size === 'sm' ? 16 : 20}
                            color={colors.textMuted}
                            style={styles.rightIcon}
                        />
                    )}
                </View>
            )}
        </PremiumPressable>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: DesignTokens.borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    fullWidth: {
        width: '100%',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
    },
    textWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
    },
    text: {
        textAlign: 'center',
        fontFamily: Platform.select({ ios: 'Arial', android: 'sans-serif', default: 'System' }),
    },
    subtitle: {
        ...DesignTokens.typography.caption,
        fontSize: 11,
        marginTop: 2,
    },
    disabled: {
        opacity: 0.5,
    },
    iconLeft: {
        marginRight: 12,
    },
    iconRight: {
        marginLeft: 8,
    },
    rightIcon: {
        marginLeft: 'auto',
    },
});
