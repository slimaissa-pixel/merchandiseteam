import { useTheme } from '@/context/ThemeContext';

export function useWebTheme() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // Premium mockup tokens derived from user's "merchandising-mockups"
    const T = {
        // Backgrounds
        bg: isDark ? '#09090b' : '#f8fafc',
        sidebarBg: isDark ? '#121214' : '#ffffff',
        card: isDark ? '#18181b' : '#ffffff',
        surface: isDark ? '#27272a' : '#f1f5f9',
        
        // Borders
        border: isDark ? '#27272a' : '#e2e8f0',
        borderHover: isDark ? '#3f3f46' : '#cbd5e1',

        // Typography
        text: isDark ? '#ffffff' : '#0f172a',
        textMuted: isDark ? '#a1a1aa' : '#64748b',
        textSecondary: isDark ? '#a1a1aa' : '#475569',
        
        // Brand & Accents
        primary: '#3b82f6',
        primaryHover: '#2563eb',
        primaryLight: isDark ? '#3b82f620' : '#eff6ff',
        secondary: isDark ? '#a78bfa' : '#7c3aed',
        
        // Semantic
        success: isDark ? '#10b981' : '#059669',
        successBg: isDark ? '#10b98115' : '#ecfdf5',
        warning: isDark ? '#f59e0b' : '#d97706',
        warningBg: isDark ? '#f59e0b15' : '#fffbeb',
        danger: isDark ? '#ef4444' : '#dc2626',
        dangerBg: isDark ? '#ef444415' : '#fef2f2',
        info: isDark ? '#0ea5e9' : '#0284c7',
        infoBg: isDark ? '#0ea5e915' : '#f0f9ff',
        
        // Layout Config
        shadow: isDark ? '0 10px 40px -10px rgba(0,0,0,0.5)' : '0 10px 40px -10px rgba(0,0,0,0.05)',
        shadowSm: isDark ? '0 2px 10px rgba(0,0,0,0.3)' : '0 2px 10px rgba(0,0,0,0.03)',
    };

    return { T, isDark, theme };
}
