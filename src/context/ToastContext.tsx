
import { Ionicons } from '@expo/vector-icons';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { DesignTokens, getColors } from '@/constants/designSystem';
import { AppEvents, appEventEmitter } from '@/services/eventEmitter';
import { useTheme } from './ThemeContext';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastOptions {
    message: string;
    type?: ToastType;
    duration?: number;
}

interface ToastContextType {
    showToast: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within ToastProvider');
    return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { theme } = useTheme();
    const colors = getColors(theme);
    const [toast, setToast] = useState<ToastOptions | null>(null);
    const slideAnim = useRef(new Animated.Value(-100)).current;

    const showToast = useCallback((options: ToastOptions) => {
        setToast(options);
        Animated.spring(slideAnim, {
            toValue: 60,
            useNativeDriver: true,
            tension: 40,
            friction: 7,
        }).start();

        setTimeout(() => {
            Animated.timing(slideAnim, {
                toValue: -100,
                duration: 300,
                useNativeDriver: true,
            }).start(() => setToast(null));
        }, options.duration || 3000);
    }, []);

    useEffect(() => {
        appEventEmitter.on(AppEvents.SHOW_TOAST, showToast);
        return () => {
            appEventEmitter.off(AppEvents.SHOW_TOAST, showToast);
        };
    }, [showToast]);

    const getToastColor = () => {
        if (!toast) return colors.primary;
        switch (toast.type) {
            case 'success': return colors.success;
            case 'error': return colors.danger;
            case 'warning': return colors.warning;
            case 'info':
            default: return colors.primary;
        }
    };

    const getIcon = () => {
        if (!toast) return 'information-circle';
        switch (toast.type) {
            case 'success': return 'checkmark-circle';
            case 'error': return 'alert-circle';
            case 'warning': return 'warning';
            case 'info':
            default: return 'information-circle';
        }
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {toast && (
                <Animated.View
                    style={[
                        styles.toast,
                        {
                            backgroundColor: colors.surface,
                            transform: [{ translateY: slideAnim }],
                            borderLeftColor: getToastColor(),
                        },
                        DesignTokens.shadows.md,
                    ]}
                >
                    <Ionicons name={getIcon() as any} size={24} color={getToastColor()} />
                    <Text style={[styles.text, { color: colors.text }]}>{toast.message}</Text>
                </Animated.View>
            )}
        </ToastContext.Provider>
    );
};

const styles = StyleSheet.create({
    toast: {
        position: 'absolute',
        top: 0,
        left: DesignTokens.spacing.lg,
        right: DesignTokens.spacing.lg,
        padding: DesignTokens.spacing.md,
        borderRadius: DesignTokens.borderRadius.md,
        flexDirection: 'row',
        alignItems: 'center',
        gap: DesignTokens.spacing.md,
        borderLeftWidth: 4,
        zIndex: 9999,
    },
    text: {
        ...DesignTokens.typography.bodyBold,
        flex: 1,
    },
});
