import { Feather } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, AppState, AppStateStatus, Platform, StyleSheet, Text, View } from 'react-native';
import { getColors } from '@/constants/designSystem';
import { useTheme } from '@/context/ThemeContext';

/** Poll connectivity via a lightweight HEAD request (no external package required) */
const checkOnline = async (): Promise<boolean> => {
    if (Platform.OS === 'web') return navigator.onLine;
    try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 4000);
        const res = await fetch('https://www.google.com/generate_204', {
            method: 'HEAD',
            signal: ctrl.signal,
        });
        clearTimeout(timer);
        return res.status === 204 || res.ok;
    } catch {
        return false;
    }
};

export const OfflineBanner = () => {
    const { theme } = useTheme();
    const colors = getColors(theme);
    const [isOffline, setIsOffline] = useState(false);
    const anim = useRef(new Animated.Value(-100)).current;

    const slide = (offline: boolean) => {
        Animated.timing(anim, {
            toValue: offline ? 0 : -100,
            duration: 400,
            useNativeDriver: true,
        }).start();
    };

    const update = async () => {
        const online = await checkOnline();
        const offline = !online;
        setIsOffline(offline);
        slide(offline);
    };

    useEffect(() => {
        // Initial check
        update();

        // Poll every 10 s
        const interval = setInterval(update, 10_000);

        // Re-check when app becomes active
        const subscription = AppState.addEventListener('change', (next: AppStateStatus) => {
            if (next === 'active') update();
        });

        // Web online/offline events
        if (Platform.OS === 'web') {
            const handleOnline = () => { setIsOffline(false); slide(false); };
            const handleOffline = () => { setIsOffline(true); slide(true); };
            window.addEventListener('online', handleOnline);
            window.addEventListener('offline', handleOffline);
            return () => {
                clearInterval(interval);
                subscription.remove();
                window.removeEventListener('online', handleOnline);
                window.removeEventListener('offline', handleOffline);
            };
        }

        return () => {
            clearInterval(interval);
            subscription.remove();
        };
    }, []);

    if (!isOffline) return null;

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    backgroundColor: colors.danger ?? '#ef4444',
                    transform: [{ translateY: anim }],
                },
            ]}
        >
            <View style={styles.content}>
                <Feather name="wifi-off" size={16} color="#fff" />
                <Text style={styles.text}>You are offline. Actions will sync when reconnected.</Text>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        paddingTop: 50,
        paddingBottom: 10,
        paddingHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    text: {
        color: '#fff',
        fontSize: 12,
        fontFamily: 'Outfit-Bold',
    },
});
