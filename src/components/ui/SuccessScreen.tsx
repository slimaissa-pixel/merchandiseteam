
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { DesignTokens, getColors } from '@/constants/designSystem';
import { useTheme } from '@/context/ThemeContext';
import { Button } from './Button';

interface SuccessScreenProps {
    title?: string;
    message?: string;
    onDone?: () => void;
    buttonLabel?: string;
}

export const SuccessScreen: React.FC<SuccessScreenProps> = ({
    title = "Success!",
    message = "Your report has been submitted successfully.",
    onDone,
    buttonLabel = "Back to Home"
}) => {
    const { theme } = useTheme();
    const colors = getColors(theme);
    const router = useRouter();

    const scaleAnim = useRef(new Animated.Value(0)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
                toValue: 1,
                duration: 500,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const handlePress = () => {
        if (onDone) {
            onDone();
        } else {
            router.back();
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Animated.View style={[
                styles.iconContainer,
                {
                    backgroundColor: colors.success + '20',
                    transform: [{ scale: scaleAnim }],
                    opacity: opacityAnim
                }
            ]}>
                <Ionicons name="checkmark-circle" size={80} color={colors.success} />
            </Animated.View>

            <Animated.View style={{ opacity: opacityAnim, alignItems: 'center' }}>
                <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
                <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
            </Animated.View>

            <View style={styles.footer}>
                <Button
                    title={buttonLabel}
                    onPress={handlePress}
                    fullWidth
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: DesignTokens.spacing.xxl,
    },
    iconContainer: {
        width: 140,
        height: 140,
        borderRadius: 70,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: DesignTokens.spacing.xl,
    },
    title: {
        ...DesignTokens.typography.h1,
        marginBottom: DesignTokens.spacing.sm,
    },
    message: {
        ...DesignTokens.typography.body,
        textAlign: 'center',
        marginBottom: DesignTokens.spacing.xl,
    },
    footer: {
        width: '100%',
        position: 'absolute',
        bottom: DesignTokens.spacing.xxl,
        paddingHorizontal: DesignTokens.spacing.xxl,
    },
});
