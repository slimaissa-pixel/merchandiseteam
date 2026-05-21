import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { getFullImageUrl } from '@/constants/api';
import { DesignTokens, getColors } from '@/constants/designSystem';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { GlassView } from './GlassView';
import { PremiumPressable } from './PremiumPressable';
import { useNotifications } from '@/context/NotificationContext';

interface HeaderProps {
    title: string;
    subtitle?: string;
    avatar?: any;
    onAvatarPress?: () => void;
    rightIcon?: keyof typeof Ionicons.glyphMap;
    onRightIconPress?: () => void;
    secondRightIcon?: keyof typeof Ionicons.glyphMap;
    onSecondRightIconPress?: () => void;
    showBack?: boolean;
    onBack?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
    title,
    subtitle,
    avatar,
    onAvatarPress,
    rightIcon,
    onRightIconPress,
    secondRightIcon,
    onSecondRightIconPress,
    showBack = false,
    onBack,
}) => {
    const { theme } = useTheme();
    const colors = getColors(theme);
    const router = useRouter();
    const { user } = useAuth();
    const { unreadCount } = useNotifications();

    const displayAvatar = avatar || (user?.profileImage ? { uri: getFullImageUrl(user.profileImage) } : null);

    const renderIconWithBadge = (iconName: keyof typeof Ionicons.glyphMap, onPress?: () => void) => {
        const isNotification = iconName === 'notifications-outline' || iconName === 'notifications';

        // Use solid bell icon when there are unread notifications
        const currentIcon = (isNotification && unreadCount > 0) ? 'notifications' : iconName;

        return (
            <PremiumPressable onPress={onPress} style={styles.rightBtn} enableScale>
                <Ionicons name={currentIcon as any} size={24} color={colors.text} />
                {isNotification && unreadCount > 0 && (
                    <View style={[styles.badgeContainer, { backgroundColor: colors.danger }]}>
                        <Text style={styles.badgeText}>
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </Text>
                    </View>
                )}
            </PremiumPressable>
        );
    };

    return (
        <View style={styles.outerContainer}>
            <GlassView
                style={styles.container}
                intensity={30}
                hasBorder={false}
                borderRadius={0}
            >
                <View style={styles.left}>
                    {showBack ? (
                        <PremiumPressable
                            onPress={() => onBack ? onBack() : router.back()}
                            style={styles.backBtn}
                            enableScale
                        >
                            <Ionicons name="arrow-back" size={24} color={colors.text} />
                        </PremiumPressable>
                    ) : (
                        <PremiumPressable onPress={onAvatarPress} style={styles.avatarContainer} enableScale disabled={!onAvatarPress}>
                            {displayAvatar ? (
                                <Image source={displayAvatar} style={styles.avatar} />
                            ) : (
                                <View style={[styles.avatar, styles.avatarInitials, { backgroundColor: colors.primary }]}>
                                    <Text style={styles.initialsText}>
                                        {title ? title.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '??'}
                                    </Text>
                                </View>
                            )}
                        </PremiumPressable>
                    )}

                    <View style={styles.titleContainer}>
                        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
                        {subtitle && (
                            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                                {subtitle}
                            </Text>
                        )}
                    </View>
                </View>

                <View style={styles.rightActions}>
                    {secondRightIcon && renderIconWithBadge(secondRightIcon, onSecondRightIconPress)}
                    {rightIcon && renderIconWithBadge(rightIcon, onRightIconPress)}
                </View>
            </GlassView>
        </View>
    );
};

const styles = StyleSheet.create({
    outerContainer: {
        zIndex: 10,
        width: '100%',
    },
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: DesignTokens.spacing.lg,
        paddingTop: DesignTokens.spacing.lg,
        paddingBottom: DesignTokens.spacing.sm,
    },
    left: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: DesignTokens.spacing.md,
    },
    avatarContainer: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    avatarInitials: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    initialsText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.08)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    titleContainer: {
        justifyContent: 'center',
    },
    title: {
        ...DesignTokens.typography.h2,
    },
    subtitle: {
        ...DesignTokens.typography.caption,
    },
    rightBtn: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        position: 'relative',
    },
    rightActions: {
        flexDirection: 'row',
        gap: DesignTokens.spacing.sm,
    },
    badgeContainer: {
        position: 'absolute',
        top: -5,
        right: -5,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        borderWidth: 2,
        borderColor: '#fff',
    },
    badgeText: {
        color: '#fff',
        fontSize: 9,
        fontWeight: 'bold',
        textAlign: 'center',
    },
});
