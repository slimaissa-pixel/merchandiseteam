import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    TextInputProps,
    View,
    Platform,
} from 'react-native';
import { DesignTokens, getColors } from '@/constants/designSystem';
import { useTheme } from '@/context/ThemeContext';
import { Fonts } from '@/hooks/useFonts';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    required?: boolean;
    containerStyle?: any;
    icon?: keyof typeof Ionicons.glyphMap;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    required,
    style,
    containerStyle,
    onFocus,
    onBlur,
    icon,
    ...props
}) => {
    const { theme } = useTheme();
    const colors = getColors(theme);
    const [isFocused, setIsFocused] = useState(false);

    const handleFocus = (e: any) => {
        setIsFocused(true);
        onFocus?.(e);
    };

    const handleBlur = (e: any) => {
        setIsFocused(false);
        onBlur?.(e);
    };

    const borderColor = error
        ? colors.danger
        : isFocused
            ? colors.primary
            : colors.border;

    const labelColor = error
        ? colors.danger
        : isFocused
            ? colors.primary
            : colors.textSecondary;

    return (
        <View style={[styles.container, containerStyle]}>
            {label && (
                <View style={styles.labelRow}>
                    <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
                    {required && <Text style={[styles.required, { color: colors.danger }]}>*</Text>}
                </View>
            )}
            <View style={[
                styles.inputWrapper,
                {
                    backgroundColor: colors.surface,
                    borderColor: borderColor,
                    borderWidth: isFocused ? 2 : 1.5,
                    height: props.multiline ? undefined : 52,
                    alignItems: props.multiline ? 'flex-start' : 'center',
                    paddingVertical: props.multiline ? DesignTokens.spacing.sm : 0,
                }
            ]}>
                {icon && (
                    <View style={[styles.iconBox, props.multiline && { marginTop: 4 }]}>
                        <Ionicons
                            name={icon}
                            size={20}
                            color={isFocused ? colors.primary : colors.textMuted}
                        />
                    </View>
                )}
                <TextInput
                    style={[
                        styles.input,
                        {
                            color: colors.text,
                            textAlignVertical: props.multiline ? 'top' : 'center',
                        }, 
                        // @ts-ignore
                        Platform.OS === 'web' && { outlineStyle: 'none' },
                        style,
                    ]}
                    placeholderTextColor={colors.textMuted}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    {...props}
                />
            </View>
            {error && <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: DesignTokens.spacing.md,
        width: '100%',
    },
    labelRow: {
        flexDirection: 'row',
        marginBottom: DesignTokens.spacing.xs,
    },
    label: {
        ...DesignTokens.typography.caption,
        fontFamily: Fonts.bodySemiBold,
    },
    required: {
        marginLeft: 2,
        ...DesignTokens.typography.caption,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 52,
        borderRadius: DesignTokens.borderRadius.lg,
        paddingHorizontal: DesignTokens.spacing.md,
    },
    iconBox: {
        marginRight: DesignTokens.spacing.sm,
    },
    input: {
        flex: 1,
        height: '100%',
        fontSize: 15,
    },
    error: {
        ...DesignTokens.typography.tiny,
        marginTop: 4,
    },
});
