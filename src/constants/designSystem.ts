import { Platform, StyleSheet } from 'react-native';

export const DesignTokens = {
    colors: {
        light: {
            primary: '#3B82F6', // Blue (actions, buttons)
            primaryLight: '#DBEAFE', // Light Blue
            primaryDark: '#1D4ED8', // Dark Blue
            secondary: '#64748B', // Slate Secondary
            success: '#10B981', // Green (completed visits)
            warning: '#F59E0B', // Orange (pending)
            danger: '#EF4444', // Red (alerts, stock issues)
            info: '#0EA5E9',
            background: '#F8FAFC', // Slate 50
            surface: '#FFFFFF',
            surfaceSecondary: '#F1F5F9', // Slate 100
            text: '#0F172A', // Slate 900
            textSecondary: '#475569', // Slate 600
            textMuted: '#94A3B8', // Slate 400
            border: '#E2E8F0', // Slate 200
            icon: '#3B82F6',
            glass: 'rgba(255, 255, 255, 0.7)',
            glassBorder: 'rgba(255, 255, 255, 0.3)',
        },
        dark: {
            primary: '#60A5FA', // Light Blue for dark mode
            primaryLight: '#1E3A8A', 
            primaryDark: '#93C5FD', 
            secondary: '#94A3B8', 
            success: '#34D399', // Green
            warning: '#FBBF24', // Orange
            danger: '#F87171', // Red
            info: '#38BDF8',
            background: '#0F172A', // Deep Slate
            surface: '#1E293B', // Slate 800
            surfaceSecondary: '#334155', // Slate 700
            text: '#F8FAFC',
            textSecondary: '#CBD5E1',
            textMuted: '#64748B',
            border: '#334155',
            icon: '#60A5FA',
            glass: 'rgba(30, 41, 59, 0.7)',
            glassBorder: 'rgba(255, 255, 255, 0.05)',
        },
    },
    glass: {
        blur: 20,
        intensity: 0.7,
        borderWidth: 1.5,
    },
    spacing: {
        xs: 4,
        sm: 8,
        md: 12,
        lg: 16,
        xl: 24,
        xxl: 32,
        huge: 48,
    },
    borderRadius: {
        xs: 4,
        sm: 8,
        md: 12,
        lg: 20,
        xl: 28,
        full: 9999,
    },
    shadows: {
        sm: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
        },
        md: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4,
        },
        lg: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.15,
            shadowRadius: 24,
            elevation: 8,
        },
    },
    typography: {
        h1: { fontFamily: 'Montserrat_700Bold', fontSize: 24, lineHeight: 32, letterSpacing: -0.5 },
        h2: { fontFamily: 'Montserrat_700Bold', fontSize: 20, lineHeight: 28, letterSpacing: -0.3 },
        h3: { fontFamily: 'Montserrat_600SemiBold', fontSize: 17, lineHeight: 24 },
        subheading: { fontFamily: 'Montserrat_600SemiBold', fontSize: 15, lineHeight: 22 },
        body: { fontFamily: 'Roboto_400Regular', fontSize: 15, lineHeight: 22 },
        bodyBold: { fontFamily: 'Roboto_700Bold', fontSize: 15, lineHeight: 22 },
        secondary: { fontFamily: 'Lato_400Regular', fontSize: 14, lineHeight: 20 },
        caption: { fontFamily: 'Lato_400Regular', fontSize: 12, lineHeight: 18, color: '#64748B' },
        tiny: { fontFamily: 'Lato_700Bold', fontSize: 11, lineHeight: 14, textTransform: 'uppercase' as const, letterSpacing: 0.5 },
        button: { fontFamily: 'Montserrat_700Bold', fontSize: 14, letterSpacing: 0.5, textTransform: 'uppercase' as const },
    },
};

export type ThemeType = 'light' | 'dark';

export const getColors = (theme: ThemeType = 'light') => DesignTokens.colors[theme];

/* ──────────────────────────────────────────
   MERGED from theme.ts
────────────────────────────────────────── */
const tintColorLight = '#0a7ea4';
const tintColorDark = '#a5a457ff';

export const Colors = {
    light: {
        text: '#0F172A',
        textSecondary: '#475569',
        background: '#F8FAFC',
        backgroundSecondary: '#F1F5F9',
        card: '#FFFFFF',
        tint: '#3B82F6',
        icon: '#3B82F6',
        tabIconDefault: '#94A3B8',
        tabIconSelected: '#3B82F6',
        border: '#E2E8F0',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#0EA5E9',
        buttonBackground: '#3B82F6',
        buttonText: '#FFFFFF',
    },
    dark: {
        text: '#F8FAFC',
        textSecondary: '#CBD5E1',
        background: '#0F172A',
        backgroundSecondary: '#1E293B',
        card: '#1E293B',
        tint: '#60A5FA',
        icon: '#60A5FA',
        tabIconDefault: '#64748B',
        tabIconSelected: '#60A5FA',
        border: '#334155',
        success: '#34D399',
        warning: '#FBBF24',
        error: '#F87171',
        info: '#38BDF8',
        buttonBackground: '#3B82F6',
        buttonText: '#FFFFFF',
    },
};

export const Fonts = Platform.select({
    ios: {
        sans: 'system-ui',
        serif: 'ui-serif',
        rounded: 'ui-rounded',
        mono: 'ui-monospace',
    },
    default: {
        sans: 'normal',
        serif: 'serif',
        rounded: 'normal',
        mono: 'monospace',
    },
    web: {
        sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        serif: "Georgia, 'Times New Roman', serif",
        rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
        mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    },
});

/* ──────────────────────────────────────────
   MERGED from styles.ts
────────────────────────────────────────── */
export const CommonStyles = StyleSheet.create({
    safeArea: { flex: 1 },
    scroll: { paddingBottom: 100 },
    container: { flex: 1, paddingHorizontal: 16 },
    flex1: { flex: 1 },
    row: { flexDirection: 'row', alignItems: 'center' },
});

export const HeaderStyles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
    headerSimple: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
    avatar: { width: 40, height: 40, borderRadius: 20 },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    headerSubtitle: { fontSize: 12 },
    iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});

export const ButtonStyles = StyleSheet.create({
    fab: {
        position: 'absolute', width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center',
        elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84,
    },
    primaryBtn: { backgroundColor: '#135bec', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    primaryBtnText: { color: '#fff', fontWeight: '700' },
});

export const MapStyles = StyleSheet.create({
    container: { flex: 1, overflow: 'hidden' },
    map: { flex: 1 },
    menu: {
        position: 'absolute', bottom: 16, right: 72, borderRadius: 12, borderWidth: 1, padding: 8, gap: 8,
        elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84,
    },
    menuOption: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
    optionText: { fontSize: 14, fontWeight: '600' },
});

export const MapOffsets = {
    fabBottomPrimary: 86,
    fabBottomSecondary: 142,
};

export const NavStyles = StyleSheet.create({
    bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 70, flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center', borderTopWidth: 1 },
    navItem: { alignItems: 'center', gap: 2 },
    navText: { fontSize: 10, fontWeight: '700' },
});

export const CardStyles = StyleSheet.create({
    card: { borderRadius: 16, padding: 16 },
    statCard: { flex: 1, padding: 14, borderRadius: 16 },
    statValue: { fontSize: 24, fontWeight: '700', marginVertical: 6 },
    statLabel: { fontSize: 11, fontWeight: '700' },
});

export const ModalStyles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
    content: { borderRadius: 20, padding: 20 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    title: { fontSize: 20, fontWeight: 'bold' },
    footer: { flexDirection: 'row', justifyContent: 'flex-end' },
    submitBtn: { backgroundColor: '#3b82f6', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
    submitBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});

export const ErrorStyles = StyleSheet.create({
    container: { alignItems: 'center', justifyContent: 'center', padding: 24, margin: 16, borderRadius: 16, gap: 12 },
    text: { fontSize: 16, textAlign: 'center', opacity: 0.8 },
    retryBtn: { backgroundColor: '#3b82f6', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, marginTop: 8 },
    retryBtnText: { color: '#fff', fontWeight: 'bold' },
});
