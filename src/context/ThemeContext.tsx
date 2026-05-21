import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    setThemeManual: (t: Theme) => void;
    toggleTheme: () => void;
    isDark: boolean;
}

const STORAGE_KEY = 'app_theme';

// Platform-safe persistence helpers
const saveTheme = async (value: Theme) => {
    if (Platform.OS === 'web') {
        try { localStorage.setItem(STORAGE_KEY, value); } catch {}
    } else {
        try { await AsyncStorage.setItem(STORAGE_KEY, value); } catch {}
    }
};

const loadTheme = async (): Promise<Theme | null> => {
    if (Platform.OS === 'web') {
        try {
            const v = localStorage.getItem(STORAGE_KEY);
            return (v === 'light' || v === 'dark') ? v : null;
        } catch { return null; }
    } else {
        try {
            const v = await AsyncStorage.getItem(STORAGE_KEY);
            return (v === 'light' || v === 'dark') ? v : null;
        } catch { return null; }
    }
};

const ThemeContext = createContext<ThemeContextType>({
    theme: 'dark',
    isDark: true,
    setThemeManual: () => {},
    toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const [theme, setTheme] = useState<Theme>('dark');

    useEffect(() => {
        loadTheme().then(saved => {
            if (saved) setTheme(saved);
        });
    }, []);

    const toggleTheme = () => {
        setTheme(prev => {
            const next: Theme = prev === 'light' ? 'dark' : 'light';
            saveTheme(next);
            return next;
        });
    };

    const setThemeManual = (t: Theme) => {
        setTheme(t);
        saveTheme(t);
    };

    return (
        <ThemeContext.Provider value={{ theme, isDark: theme === 'dark', toggleTheme, setThemeManual }}>
            {children}
        </ThemeContext.Provider>
    );
};
