import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Platform,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
    Text,
} from 'react-native';
import { APP_COLORS } from '@/constants/appColors';
import { Fonts } from '@/hooks/useFonts';

interface FloatingLabelInputProps {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    secureTextEntry?: boolean;
    keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
    autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
    icon: keyof typeof Ionicons.glyphMap;
    variant?: 'light' | 'dark';
    /** @deprecated — ignored, component always uses the dark auth palette */
    theme?: object;
    error?: string;
}

const FloatingLabelInput = ({
    label, value, onChangeText, secureTextEntry,
    keyboardType = 'default', autoCapitalize = 'none', icon,
    variant = 'dark', error
}: FloatingLabelInputProps) => {
    const [isFocused, setIsFocused] = useState(false);
    const [hiddenPassword, setHiddenPassword] = useState(secureTextEntry);
    const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;

    useEffect(() => {
        Animated.timing(animatedValue, {
            toValue: (isFocused || value) ? 1 : 0,
            duration: 200,
            useNativeDriver: false,
        }).start();
    }, [isFocused, value]);

    const isLight = variant === 'light';
    const textColor = isLight ? '#000000' : APP_COLORS.textPrimary;
    const borderColor = isLight ? '#E2E8F0' : APP_COLORS.inputBorder;
    const labelColor = isLight ? '#475569' : APP_COLORS.textSecondary;
    const bgColor = isLight ? '#fff' : 'transparent';
    const icColor = isLight ? '#64748B' : APP_COLORS.textSecondary;

    const labelStyle = {
        position: 'absolute' as const,
        left: 40,
        top: animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [18, -10],
        }),
        fontSize: animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [16, 13],
        }),
        color: animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [labelColor, APP_COLORS.accent],
        }),
        backgroundColor: animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: ['transparent', isLight ? '#fff' : '#0F172A'], // Pure white for light, Slate for dark
        }),
        paddingHorizontal: 6,
        zIndex: 1,
        fontFamily: Fonts.bodySemiBold,
    };

    return (
        <View style={[styles.inputContainer, {
            borderColor: isFocused ? APP_COLORS.accent : borderColor,
            borderWidth: isFocused ? 1.5 : 1,
            backgroundColor: bgColor,
        }]}>
            {/* Icon */}
            <View style={{ marginRight: 12, justifyContent: 'center' }}>
                <Ionicons
                    name={icon}
                    size={20}
                    color={isFocused ? APP_COLORS.accent : icColor}
                />
            </View>

            {/* Floating label */}
            <Animated.Text pointerEvents="none" style={labelStyle}>{label}</Animated.Text>

            {/* Text input */}
            <TextInput
                style={[styles.input, { color: textColor }]}
                value={value}
                onChangeText={onChangeText}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                secureTextEntry={hiddenPassword}
                keyboardType={keyboardType}
                autoCapitalize={autoCapitalize}
                placeholderTextColor="transparent"
            />

            {/* Show/hide password toggle */}
            {secureTextEntry && (
                <TouchableOpacity onPress={() => setHiddenPassword(!hiddenPassword)} style={{ padding: 5 }}>
                    <Ionicons
                        name={hiddenPassword ? 'eye-outline' : 'eye-off-outline'}
                        size={20}
                        color={icColor}
                    />
                </TouchableOpacity>
            )}
            
            {/* Error message */}
            {error ? (
                <Text style={{ position: 'absolute', bottom: -20, left: 16, color: '#ef4444', fontSize: 12, fontFamily: Fonts.body }}>
                    {error}
                </Text>
            ) : null}
        </View>
    );
};

const styles = StyleSheet.create({
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 14,
        paddingHorizontal: 16,
        marginBottom: 20,
        height: 64,
        position: 'relative',
    },
    input: {
        flex: 1,
        fontSize: 16,
        height: '100%',
        paddingTop: 18,
        paddingBottom: 4,
        fontFamily: Fonts.body,
        ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}) as any,
    },
});

export default FloatingLabelInput;
