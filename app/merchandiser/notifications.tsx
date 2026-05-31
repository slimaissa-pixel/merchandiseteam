import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Platform, RefreshControl, ScrollView, StyleSheet, Text, View, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomNav } from '@/components/ui/BottomNav';
import { Card } from '@/components/ui/Card';
import { Header } from '@/components/ui/Header';
import { ListSkeleton } from '@/components/ui/LoadingSkeleton';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { DesignTokens, getColors } from '@/constants/designSystem';
import { MERCHANDISER_NAV_ITEMS } from '@/constants/navigation';
import { useNotifications } from '@/context/NotificationContext';
import { useTheme } from '@/context/ThemeContext';
import { Fonts } from '@/hooks/useFonts';
import { Notification, NotificationService } from '@/services/notification.service';
import { notificationsSocket } from '../../src/services/notifications.supabase';
import { PremiumPressable } from '@/components/ui/PremiumPressable';
import { useToast } from '@/context/ToastContext';

export default function MerchandiserNotifications() {
    const router = useRouter();
    const { theme } = useTheme();
    const colors = getColors(theme);
    const { showToast } = useToast();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

    const loadNotifications = async () => {
        if (!refreshing) setLoading(true);
        try {
            const data = await NotificationService.getNotifications();
            setNotifications(data);
        } catch (error) {
            console.error('Load notifications error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadNotifications();

            let cleanupWs: (() => void) | null = null;
            const setupWs = async () => {
                await notificationsSocket.connect();
                cleanupWs = notificationsSocket.subscribe((data) => {
                    if (data && data.type === 'new_notification') {
                        loadNotifications();
                    }
                });
            };
            setupWs();

            return () => {
                if (cleanupWs) cleanupWs();
                notificationsSocket.disconnect();
            };
        }, [])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadNotifications();
    }, []);

    const getTypeStyles = (type: string) => {
        switch (type) {
            case 'alert': 
            case 'report':
                return { 
                    icon: 'warning', 
                    color: colors.danger, 
                    bg: ['#FFE5E5', '#FFF0F0'],
                    glow: 'rgba(255, 68, 68, 0.15)'
                };
            case 'success': 
                return { 
                    icon: 'checkmark-circle', 
                    color: colors.success, 
                    bg: ['#E8F5E9', '#F1F8E9'],
                    glow: 'rgba(76, 175, 80, 0.15)'
                };
            case 'warning': 
                return { 
                    icon: 'alert-circle', 
                    color: colors.warning, 
                    bg: ['#FFF3E0', '#FFF8E1'],
                    glow: 'rgba(255, 152, 0, 0.15)'
                };
            case 'new_gms':
                return { 
                    icon: 'storefront', 
                    color: colors.secondary, 
                    bg: ['#E3F2FD', '#E1F5FE'],
                    glow: 'rgba(33, 150, 243, 0.15)'
                };
            default: 
                return { 
                    icon: 'notifications', 
                    color: colors.primary, 
                    bg: ['#E8EAF6', '#EEF2FF'],
                    glow: 'rgba(63, 81, 181, 0.15)'
                };
        }
    };

    const { decrementUnread, resetUnread } = useNotifications();

    const handleMarkAsRead = async (id: number) => {
        const updated = await NotificationService.markAsRead(id);
        if (updated) {
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            decrementUnread(1);
        }
    };

    const handleMarkAsUnread = async (id: number) => {
        const updated = await NotificationService.markAsUnread(id);
        if (updated) {
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: false } : n));
            decrementUnread(-1);
            showToast({ message: 'Marked as unread', type: 'info' });
        }
    };

    const handleLongPress = (id: number) => {
        Alert.alert(
            'Mark as Unread',
            'Are you sure you want to make this notification as unread?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'YES', onPress: () => handleMarkAsUnread(id) }
            ]
        );
    };

    const handleMarkAllAsRead = async () => {
        const success = await NotificationService.markAllAsRead();
        if (success) {
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            resetUnread();
        }
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const handleNotificationPress = async (item: Notification) => {
        if (!item.is_read) {
            handleMarkAsRead(item.id);
        }
        router.push(`/merchandiser/notification/${item.id}`);
    };

    const formatTime = (dateStr: string) => {
        try {
            return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
        } catch (e) {
            return dateStr;
        }
    };

    const sortedNotifications = [...notifications].sort((a, b) => {
        const timeA = new Date(a.created_at).getTime();
        const timeB = new Date(b.created_at).getTime();
        return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <Header
                title="Notifications"
                subtitle={`${unreadCount} Unread`}
                rightIcon="checkmark-done"
                onRightIconPress={handleMarkAllAsRead}
                showBack
            />

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                }
            >
                {loading ? (
                    <ListSkeleton count={6} />
                ) : notifications.length === 0 ? (
                    <View style={styles.empty}>
                        <Ionicons name="notifications-off-outline" size={64} color={colors.textMuted} />
                        <Text style={{ color: colors.textSecondary, marginTop: 16 }}>No notifications</Text>
                    </View>
                ) : (
                    <>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <SectionHeader title="Staff Alerts" />
                            <TouchableOpacity 
                                onPress={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                                style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: colors.border }}
                            >
                                <Ionicons name={sortOrder === 'desc' ? 'arrow-down' : 'arrow-up'} size={14} color={colors.textSecondary} style={{ marginRight: 4 }} />
                                <Text style={{ color: colors.textSecondary, fontFamily: Fonts.body, fontSize: 12 }}>
                                    {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.list}>
                            {sortedNotifications.map((notification) => {
                                const styles_conf = getTypeStyles(notification.type);
                                return (
                                    <PremiumPressable
                                        key={notification.id}
                                        onPress={() => handleNotificationPress(notification)}
                                        onLongPress={() => handleLongPress(notification.id)}
                                        delayLongPress={2000}
                                        scaleTo={0.97}
                                        containerStyle={styles.cardContainer}
                                    >
                                        {!notification.is_read && <View style={[styles.glowEffect, { backgroundColor: styles_conf.glow }]} />}
                                        <Card
                                            style={[
                                                styles.notifCard,
                                                { borderLeftColor: styles_conf.color },
                                                !notification.is_read && styles.unreadCard
                                            ]}
                                            pointerEvents="none"
                                        >
                                            <View style={[styles.iconBox, { backgroundColor: styles_conf.color + '15' }]}>
                                                <Ionicons name={(notification.icon || 'notifications-outline') as any} size={22} color={styles_conf.color} />
                                            </View>
                                            <View style={styles.notifBody}>
                                                <View style={styles.notifHeader}>
                                                    <Text style={[styles.notifTitle, { color: colors.text }]}>{notification.title}</Text>
                                                    {!notification.is_read && <View style={[styles.unreadDot, { backgroundColor: styles_conf.color }]} />}
                                                </View>
                                                <Text style={[styles.notifMessage, { color: colors.textSecondary }]}>{notification.message}</Text>
                                                <View style={styles.footer}>
                                                    <View style={[styles.typeTag, { backgroundColor: styles_conf.color + '10' }]}>
                                                        <Text style={[styles.typeText, { color: styles_conf.color }]}>{notification.type.replace('_', ' ')}</Text>
                                                    </View>
                                                    <Text style={[styles.notifTime, { color: colors.textMuted }]}>
                                                        {formatTime(notification.created_at)}
                                                    </Text>
                                                </View>
                                            </View>
                                        </Card>
                                    </PremiumPressable>
                                );
                            })}
                        </View>
                    </>
                )}
            </ScrollView>

            <BottomNav items={MERCHANDISER_NAV_ITEMS} activeRoute="/merchandiser/notifications" />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: DesignTokens.spacing.lg, paddingBottom: 120 },
    list: { gap: 16, marginTop: DesignTokens.spacing.md },
    cardContainer: {
        position: 'relative',
    },
    glowEffect: {
        position: 'absolute',
        top: -10,
        left: -10,
        right: -10,
        bottom: -10,
        borderRadius: 24,
        opacity: 0.5,
        zIndex: -1,
    },
    notifCard: {
        flexDirection: 'row',
        gap: DesignTokens.spacing.md,
        padding: DesignTokens.spacing.lg,
        borderRadius: 20,
        borderLeftWidth: 0,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.05,
                shadowRadius: 10,
            },
            android: {
                elevation: 3,
            }
        })
    },
    unreadCard: {
        borderLeftWidth: 5,
    },
    iconBox: { 
        width: 48, 
        height: 48, 
        borderRadius: 16, 
        alignItems: 'center', 
        justifyContent: 'center',
    },
    notifBody: { flex: 1, gap: 6 },
    notifHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    notifTitle: { 
        fontSize: 16,
        fontWeight: '700',
        fontFamily: Fonts.headingXBold,
        letterSpacing: -0.3,
    },
    notifMessage: { 
        fontSize: 14, 
        fontFamily: Fonts.body,
        lineHeight: 20,
        opacity: 0.8 
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
    },
    typeTag: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    typeText: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    notifTime: { 
        fontSize: 11,
        fontFamily: Fonts.body,
        opacity: 0.6 
    },
    unreadDot: { width: 8, height: 8, borderRadius: 4 },
    empty: { alignItems: 'center', marginTop: 80, gap: 16 },
});
