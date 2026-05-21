import React from 'react';
import { View, Text, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { useWebTheme } from '@/hooks/useWebTheme';
import { Fonts } from '@/hooks/useFonts';

export const WebCard = ({ children, style, noPadding = false }: { children: React.ReactNode; style?: ViewStyle; noPadding?: boolean }) => {
    const { T, isDark } = useWebTheme();
    return (
        <View style={[{
            backgroundColor: T.card,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: T.border,
            padding: noPadding ? 0 : 24,
            width: '100%',
            overflow: 'hidden',
            boxShadow: isDark ? 'none' : '0 12px 32px rgba(0,0,0,0.03)'
        } as ViewStyle, style]}>
            {children}
        </View>
    );
};

export const WebChip = ({ label, colorPreset = 'primary', style }: { label: string, colorPreset?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'default', style?: ViewStyle }) => {
    const { T } = useWebTheme();
    let bg, text;
    
    switch (colorPreset) {
        case 'success': bg = T.successBg; text = T.success; break;
        case 'warning': bg = T.warningBg; text = T.warning; break;
        case 'danger': bg = T.dangerBg; text = T.danger; break;
        case 'info': bg = T.infoBg; text = T.info; break;
        case 'primary': bg = T.primaryLight; text = T.primary; break;
        default: bg = T.surface; text = T.textMuted; break;
    }

    return (
        <View style={[{ backgroundColor: bg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }, style]}>
            <Text style={{ color: text, fontSize: 12, fontFamily: Fonts.bodySemiBold, textTransform: 'capitalize' }}>{label}</Text>
        </View>
    );
};

export const WebButton = ({ label, onPress, variant = 'primary', icon, style, disabled = false, loading = false }: { label: string, onPress: () => void, variant?: 'primary' | 'outline' | 'danger', icon?: React.ReactNode, style?: ViewStyle, disabled?: boolean, loading?: boolean }) => {
    const { T } = useWebTheme();
    let bg = T.primary;
    let text = '#fff';
    let border = 'transparent';

    if (variant === 'outline') {
        bg = 'transparent';
        text = T.primary;
        border = T.primary;
    } else if (variant === 'danger') {
        bg = T.danger;
    }

    return (
        <TouchableOpacity 
            activeOpacity={0.8} 
            onPress={onPress}
            disabled={disabled || loading}
            style={[{
                backgroundColor: disabled || loading ? bg + '80' : bg,
                borderWidth: 1,
                borderColor: border,
                borderRadius: 12,
                paddingHorizontal: 20,
                paddingVertical: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                opacity: disabled || loading ? 0.6 : 1,
            }, style]}
        >
            {icon}
            <Text style={{ color: text, fontSize: 14, fontFamily: Fonts.headingSemiBold }}>{loading ? 'Loading...' : label}</Text>
        </TouchableOpacity>
    );
};

export const WebTableHeader = ({ columns }: { columns: { label: string, flex?: number, width?: number | string, align?: 'left'|'center'|'right' }[] }) => {
    const { T } = useWebTheme();
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 24, borderBottomWidth: 1, borderBottomColor: T.border, backgroundColor: T.surface }}>
            {columns.map((c, i) => (
                <Text key={i} style={{ 
                    flex: c.flex, 
                    width: c.width as any, 
                    color: T.textMuted, 
                    fontSize: 12, 
                    fontFamily: Fonts.bodyBold, 
                    textTransform: 'uppercase', 
                    letterSpacing: 0.5,
                    textAlign: c.align || 'left'
                }}>
                    {c.label}
                </Text>
            ))}
        </View>
    );
};
