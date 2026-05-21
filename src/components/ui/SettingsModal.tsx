
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { DesignTokens, getColors } from '@/constants/designSystem';
import { getFullImageUrl } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { PremiumPressable } from './PremiumPressable';
import { Image } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BUBBLE_WIDTH = Math.min(SCREEN_WIDTH * 0.8, 300);

export interface SettingsItemType {
    icon?: keyof typeof Ionicons.glyphMap;
    label: string;
    onPress: () => void;
    color?: string;
    isDestructive?: boolean;
    rightElement?: React.ReactNode;
}

interface SettingsModalProps {
    visible: boolean;
    onClose: () => void;
    title?: string;
    items: SettingsItemType[];
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
    visible,
    onClose,
    title = 'Settings',
    items,
}) => {
    const { theme } = useTheme();
    const colors = getColors(theme);
    const { user } = useAuth();

    const scaleAnim = useRef(new Animated.Value(0.9)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    useNativeDriver: true,
                    tension: 50,
                    friction: 8,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(scaleAnim, {
                    toValue: 0.9,
                    duration: 150,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible]);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <Animated.View
                            style={[
                                styles.bubble,
                                {
                                    backgroundColor: colors.surface,
                                    opacity: opacityAnim,
                                    transform: [{ scale: scaleAnim }],
                                },
                            ]}
                        >
                            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                                <View style={styles.headerTitleContainer}>
                                    {user?.profileImage && (
                                        <Image
                                            source={{ uri: getFullImageUrl(user.profileImage) || '' }}
                                            style={styles.headerAvatar}
                                        />
                                    )}
                                    <View>
                                        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
                                        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{user?.firstName} {user?.lastName}</Text>
                                    </View>
                                </View>
                                <PremiumPressable onPress={onClose} enableScale style={styles.closeBtn}>
                                    <Ionicons name="close" size={20} color={colors.textSecondary} />
                                </PremiumPressable>
                            </View>

                            <View style={styles.content}>
                                {items.map((item, index) => (
                                    <PremiumPressable
                                        key={index}
                                        style={[
                                            styles.item,
                                            { backgroundColor: colors.surfaceSecondary },
                                        ]}
                                        onPress={item.onPress}
                                        enableScale
                                    >
                                        {item.icon && (
                                            <View
                                                style={[
                                                    styles.iconBox,
                                                    { backgroundColor: `${item.color || colors.primary}20` },
                                                ]}
                                            >
                                                <Ionicons
                                                    name={item.icon}
                                                    size={20}
                                                    color={item.isDestructive ? colors.danger : item.color || colors.primary}
                                                />
                                            </View>
                                        )}
                                        <Text
                                            style={[
                                                styles.label,
                                                { color: item.isDestructive ? colors.danger : colors.text },
                                            ]}
                                        >
                                            {item.label}
                                        </Text>
                                        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                                    </PremiumPressable>
                                ))}
                            </View>
                        </Animated.View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    bubble: {
        position: 'absolute',
        top: Platform.OS === 'web' ? 80 : 100,
        right: 16,
        width: BUBBLE_WIDTH,
        borderRadius: 24,
        paddingTop: 8,
        paddingBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: DesignTokens.spacing.lg,
        paddingBottom: DesignTokens.spacing.md,
        borderBottomWidth: 1,
    },
    title: {
        ...DesignTokens.typography.h3,
    },
    subtitle: {
        fontSize: 11,
        fontFamily: 'Inter-Medium',
        marginTop: -2,
    },
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    headerAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    closeBtn: {
        padding: 4,
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 12,
    },
    content: {
        padding: DesignTokens.spacing.md,
        gap: DesignTokens.spacing.sm,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: DesignTokens.spacing.sm,
        borderRadius: 16,
        gap: DesignTokens.spacing.md,
    },
    label: {
        flex: 1,
        fontSize: 15,
        fontFamily: 'Inter-SemiBold',
    },
    iconBox: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
