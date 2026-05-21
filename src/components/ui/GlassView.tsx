import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Platform, StyleSheet, View, ViewStyle } from 'react-native';
import { DesignTokens, ThemeType } from '@/constants/designSystem';
import { useTheme } from '@/context/ThemeContext';

interface GlassViewProps {
    children?: React.ReactNode;
    style?: ViewStyle;
    intensity?: number;
    tint?: 'light' | 'dark' | 'default';
    borderRadius?: number;
    borderWidth?: number;
    hasBorder?: boolean;
}

export const GlassView: React.FC<GlassViewProps> = ({
    children,
    style,
    intensity = DesignTokens.glass.blur,
    tint,
    borderRadius = DesignTokens.borderRadius.lg,
    borderWidth = DesignTokens.glass.borderWidth,
    hasBorder = true,
}) => {
    const { theme } = useTheme();

    const glassTint = tint || (theme === 'dark' ? 'dark' : 'light');
    const colors = DesignTokens.colors[theme as ThemeType];

    const containerStyle: ViewStyle = {
        borderRadius,
        overflow: 'hidden',
        borderWidth: hasBorder ? borderWidth : 0,
        borderColor: colors.glassBorder,
        ...style,
    };

    if (Platform.OS === 'android') {
        // Fallback or specific Android styling if needed, though expo-blur works on modern Android
        return (
            <View style={[containerStyle, { backgroundColor: colors.glass }]}>
                {children}
            </View>
        );
    }

    return (
        <BlurView
            intensity={intensity}
            tint={glassTint}
            style={containerStyle}
        >
            <LinearGradient
                colors={[
                    'rgba(255, 255, 255, 0.05)',
                    'rgba(255, 255, 255, 0.01)',
                ]}
                style={StyleSheet.absoluteFill}
            />
            {children}
        </BlurView>
    );
};

const styles = StyleSheet.create({
    container: {
        overflow: 'hidden',
    },
});
