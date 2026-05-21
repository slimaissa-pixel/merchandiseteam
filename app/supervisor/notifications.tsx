import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomNav } from '@/components/ui/BottomNav';
import { Header } from '@/components/ui/Header';
import { ListSkeleton } from '@/components/ui/LoadingSkeleton';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { getColors } from '@/constants/designSystem';
import { SUPERVISOR_NAV_ITEMS } from '@/constants/navigation';
import { useNotifications } from '@/context/NotificationContext';
import { useTheme } from '@/context/ThemeContext';
import { Fonts } from '@/hooks/useFonts';
import { Notification, NotificationService } from '@/services/notification.service';
import { notificationsSocket } from '@/services/notifications.supabase';
import { PremiumPressable } from '@/components/ui/PremiumPressable';
import { useToast } from '@/context/ToastContext';

export default function NotificationsPage() {
    const router = useRouter();
    const { theme } = useTheme();
    const colors = getColors(theme);
    const { showToast } = useToast();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

    const loadNotifications = async () => {
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

    const { decrementUnread, resetUnread } = useNotifications();

    const handleMarkAsRead = async (id: number) => {
        const updated = await NotificationService.markAsRead(id);
        if (updated) {
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, is_read: true } : n)
            );
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

    const getTypeStyles = (type: string) => {
        const t = type.toLowerCase().trim();
        switch (t) {
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
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
            <Header
                title="Notifications"
                showBack
                rightIcon="checkmark-done"
                onRightIconPress={handleMarkAllAsRead}
            />

            {loading ? (
                <View style={styles.scroll}>
                    <ListSkeleton count={6} />
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={styles.scroll}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                >
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
                    {notifications.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="notifications-off-outline" size={48} color={colors.textSecondary} />
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                No notifications yet
                            </Text>
                        </View>
                    ) : (
                        sortedNotifications.map((item) => {
                            const styles_conf = getTypeStyles(item.type);
                            return (
                                <PremiumPressable
                                    key={item.id}
                                    onPress={() => {
                                        if (!item.is_read) handleMarkAsRead(item.id);
                                        router.push(`/supervisor/notification/${item.id}`);
                                    }}
                                    onLongPress={() => handleLongPress(item.id)}
                                    delayLongPress={2000}
                                    scaleTo={0.97}
                                    containerStyle={styles.cardWrapper}
                                >
                                    {!item.is_read && <View style={[styles.glowEffect, { backgroundColor: styles_conf.glow }]} />}
                                    <View
                                        style={[
                                            styles.notificationCard,
                                            {
                                                backgroundColor: item.is_read ? colors.surface : colors.surface,
                                                borderColor: item.is_read ? colors.border : styles_conf.color,
                                                borderLeftWidth: item.is_read ? 1 : 6,
                                            }
                                        ]}
                                        pointerEvents="none"
                                    >
                                        <View style={[styles.iconContainer, { backgroundColor: styles_conf.color + '15' }]}>
                                            <Ionicons name={(item.icon || styles_conf.icon) as any} size={24} color={styles_conf.color} />
                                        </View>
                                        <View style={styles.contentContainer}>
                                            <View style={styles.topRow}>
                                                <Text style={[styles.title, { color: colors.text, opacity: item.is_read ? 0.7 : 1 }]}>
                                                    {item.title}
                                                </Text>
                                                {!item.is_read && (
                                                    <View style={[styles.dot, { backgroundColor: styles_conf.color }]} />
                                                )}
                                            </View>
                                            <Text style={[styles.message, { color: colors.textSecondary }]} numberOfLines={2}>
                                                {item.message}
                                            </Text>
                                            <View style={styles.footer}>
                                                <View style={[styles.typeTag, { backgroundColor: styles_conf.color + '10' }]}>
                                                    <Text style={[styles.typeText, { color: styles_conf.color }]}>{item.type.replace('_', ' ')}</Text>
                                                </View>
                                                <Text style={[styles.time, { color: colors.textMuted }]}>
                                                    {formatTime(item.created_at)}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                </PremiumPressable>
                            )
                        })
                    )}
                </ScrollView>
            )}

            <BottomNav items={SUPERVISOR_NAV_ITEMS} activeRoute="/supervisor/notifications" />
        </SafeAreaView>
    );
}


const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100, gap: 12 },
    emptyText: { fontSize: 16, fontFamily: Fonts.bodySemiBold },
    scroll: { padding: 16, paddingBottom: 120, gap: 16 },
    cardWrapper: {
        position: 'relative',
        marginBottom: 4,
    },
    glowEffect: {
        position: 'absolute',
        top: -8,
        left: -8,
        right: -8,
        bottom: -8,
        borderRadius: 20,
        opacity: 0.4,
        zIndex: -1,
    },
    notificationCard: {
        flexDirection: 'row',
        padding: 18,
        borderRadius: 16,
        borderWidth: 1,
        alignItems: 'center',
        gap: 14,
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
    iconContainer: {
        width: 52,
        height: 52,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    contentContainer: { flex: 1, gap: 6 },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: { 
        fontSize: 16, 
        fontFamily: Fonts.headingXBold,
        letterSpacing: -0.3,
    },
    message: { 
        fontSize: 14, 
        lineHeight: 20, 
        fontFamily: Fonts.body,
        opacity: 0.8,
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
    time: { 
        fontSize: 11, 
        fontFamily: Fonts.body,
        opacity: 0.6,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
});
