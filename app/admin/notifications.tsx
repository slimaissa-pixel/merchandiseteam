import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Alert,
    TextInput,
    ActivityIndicator,
    Platform,
} from 'react-native';
import { AdminWebLayout } from '@/components/admin/WebLayout';
import { ListSkeleton } from '@/components/ui/LoadingSkeleton';
import { DesignTokens, getColors } from '@/constants/designSystem';
import { useNotifications } from '@/context/NotificationContext';
import { useTheme } from '@/context/ThemeContext';
import { Fonts } from '@/hooks/useFonts';
import { Notification, NotificationService } from '@/services/notification.service';
import { notificationsSocket } from '@/services/notifications.supabase';
import { useToast } from '@/context/ToastContext';
import { UserService } from '@/services/user.service';

export default function NotificationsPage() {
    const router = useRouter();
    const { theme } = useTheme();
    const [selectedFilter, setSelectedFilter] = useState('unread');
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
    const { showToast } = useToast();

    // New State for Custom Notifications
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [sending, setSending] = useState(false);
    const [newNotif, setNewNotif] = useState({
        title: '',
        message: '',
        action_link: '',
        target: 'all',
        specificUserId: '',
        type: 'info'
    });

    const colors = getColors(theme);

    const loadNotifications = async () => {
        try {
            const data = await NotificationService.getNotifications();
            setNotifications(Array.isArray(data) ? data : []);
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
            UserService.getAll({ limit: 1000 }).then(data => setAllUsers(data || []));

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

    const getTypeConfig = (type: string) => {
        const t = type.toLowerCase().trim();
        switch (t) {
            case 'alert': return { icon: 'warning', color: colors.warning };
            case 'success': return { icon: 'checkmark-circle', color: colors.success };
            case 'warning': return { icon: 'alert-circle', color: colors.warning };
            case 'new_gms': return { icon: 'hourglass', color: colors.secondary };
            case 'report': return { icon: 'document-text', color: colors.warning };
            default: return { icon: 'information-circle', color: colors.primary };
        }
    };

    // --- filter helpers ---
    const filterNotifs = (id: string) =>
        notifications.filter(n => {
            const type = n.type.toLowerCase().trim();
            if (id === 'all') return true;
            if (id === 'unread') return !n.is_read;
            if (id === 'report') return type === 'report' || type === 'alert';
            if (id === 'new_gms') return type === 'new_gms';
            if (id === 'demo') return type === 'demo';
            return type === id;
        });

    const filters = [
        { id: 'all', label: 'All', count: notifications.length },
        { id: 'unread', label: 'Unread', count: filterNotifs('unread').length },
        { id: 'report', label: 'Reports', count: filterNotifs('report').length },
        { id: 'new_gms', label: 'New GMS', count: filterNotifs('new_gms').length },
        { id: 'demo', label: 'Demos', count: filterNotifs('demo').length },
    ];

    const sectionTitles: Record<string, string> = {
        all: 'All Notifications',
        unread: 'Unread',
        report: 'Reports & Alerts',
        new_gms: 'New GMS Requests',
        demo: 'Demo Requests',
    };

    const filteredNotifications = filterNotifs(selectedFilter)
        .sort((a, b) => {
            const dateA = new Date(a.created_at).getTime();
            const dateB = new Date(b.created_at).getTime();
            return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
        });

    const { decrementUnread, resetUnread } = useNotifications();

    const handleMarkAsRead = async (id: number) => {
        const updated = await NotificationService.markAsRead(id);
        if (updated) {
            setNotifications(prev => prev.map(n =>
                n.id === id ? { ...n, is_read: true } : n
            ));
            decrementUnread(1);
        }
    };

    const handleMarkAsUnread = async (id: number) => {
        const updated = await NotificationService.markAsUnread(id);
        if (updated) {
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: false } : n));
            decrementUnread(-1);
            if (showToast) showToast({ message: 'Marked as unread', type: 'info' });
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
        // Only mark the currently filtered notifications as read (not all globally)
        const unreadInView = filteredNotifications.filter(n => !n.is_read);
        if (unreadInView.length === 0) return;
        await Promise.all(unreadInView.map(n => NotificationService.markAsRead(n.id)));
        setNotifications(prev =>
            prev.map(n =>
                unreadInView.some(u => u.id === n.id) ? { ...n, is_read: true } : n
            )
        );
        decrementUnread(unreadInView.length);
    };

    const handleNotificationPress = (item: Notification) => {
        if (!item.is_read) {
            handleMarkAsRead(item.id);
        }
        // Navigate to details page as requested
        router.push(`/admin/notification/${item.id}`);
    };

    const handleDemoAction = async (action: 'approve' | 'decline', item: Notification) => {
        try {
            if (action === 'approve') {
                const success = await UserService.updateById(item.user_id, { status: 'active' });
                if (success) {
                    if (showToast) showToast({ message: 'Demo request approved', type: 'success' });
                    handleMarkAsRead(item.id);
                }
            } else {
                const success = await UserService.delete(item.user_id);
                if (success) {
                    if (showToast) showToast({ message: 'Demo request declined and user deleted', type: 'info' });
                    handleMarkAsRead(item.id);
                }
            }
        } catch (error) {
            console.error('Demo action error:', error);
            if (showToast) showToast({ message: 'Failed to perform action', type: 'error' });
        }
    };

    const formatTime = (dateStr: string) => {
        try {
            return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
        } catch (e) {
            return dateStr;
        }
    };

    const handleSendNotification = async () => {
        if (!newNotif.title || !newNotif.message) {
            if (showToast) showToast({ message: 'Title and message are required', type: 'warning' });
            return;
        }
        setSending(true);
        try {
            let targets = [];
            if (newNotif.target === 'all') targets = allUsers;
            else if (newNotif.target === 'supervisor') targets = allUsers.filter(u => u.role === 'supervisor');
            else if (newNotif.target === 'merchandiser') targets = allUsers.filter(u => u.role === 'merchandiser');
            else if (newNotif.target === 'specific') {
                const u = allUsers.find(u => u.id.toString() === newNotif.specificUserId);
                if (u) targets = [u];
            }

            if (targets.length === 0) {
                if (showToast) showToast({ message: 'No users found for selected target', type: 'warning' });
                setSending(false);
                return;
            }

            // Using any because NotificationCreate expects action_link?: string
            await Promise.all(targets.map(u => 
                NotificationService.sendNotification({
                    user_id: u.id,
                    title: newNotif.title,
                    message: newNotif.message,
                    type: newNotif.type,
                    icon: newNotif.type === 'report' ? 'document-text' : (newNotif.type === 'alert' ? 'warning' : 'information-circle'),
                    action_link: newNotif.action_link || undefined
                } as any)
            ));

            if (showToast) showToast({ message: `Sent to ${targets.length} user(s)!`, type: 'success' });
            setNewNotif({ title: '', message: '', action_link: '', target: 'all', specificUserId: '', type: 'info' });
            loadNotifications();
        } catch (err) {
            if (showToast) showToast({ message: 'Failed to send notification', type: 'error' });
        } finally {
            setSending(false);
        }
    };

return (
            <AdminWebLayout title="Notifications Center">
                {/* --- SEND CUSTOM NOTIFICATION SECTION --- */}
                <View style={[styles.composeSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                        <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15', width: 40, height: 40 }]}>
                            <Ionicons name="paper-plane" size={20} color={colors.primary} />
                        </View>
                        <View>
                            <Text style={{ fontSize: 18, fontFamily: Fonts.headingSemiBold, color: colors.text }}>Dispatch Alert or Report</Text>
                            <Text style={{ fontSize: 13, color: colors.textSecondary }}>Send a custom notification, report link, or file URL to your team.</Text>
                        </View>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 16, flexWrap: 'wrap' }}>
                        <View style={{ flex: 2, minWidth: 250, gap: 12 }}>
                            <TextInput 
                                placeholder="Notification Title" 
                                placeholderTextColor={colors.textMuted}
                                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                                value={newNotif.title}
                                onChangeText={t => setNewNotif({...newNotif, title: t})}
                            />
                            <TextInput 
                                placeholder="Message Content" 
                                placeholderTextColor={colors.textMuted}
                                multiline
                                numberOfLines={3}
                                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border, height: 80, textAlignVertical: 'top' }]}
                                value={newNotif.message}
                                onChangeText={t => setNewNotif({...newNotif, message: t})}
                            />
                        </View>

                        <View style={{ flex: 1.5, minWidth: 250, gap: 12 }}>
                            <TextInput 
                                placeholder="Paste Report Link or File URL (Optional)" 
                                placeholderTextColor={colors.textMuted}
                                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                                value={newNotif.action_link}
                                onChangeText={t => setNewNotif({...newNotif, action_link: t})}
                            />
                            
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                {['info', 'alert', 'report', 'success'].map(type => (
                                    <TouchableOpacity 
                                        key={type} 
                                        onPress={() => setNewNotif({...newNotif, type})}
                                        style={{ 
                                            flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8, borderWidth: 1,
                                            borderColor: newNotif.type === type ? colors.primary : colors.border,
                                            backgroundColor: newNotif.type === type ? colors.primary + '10' : 'transparent'
                                        }}
                                    >
                                        <Text style={{ color: newNotif.type === type ? colors.primary : colors.textSecondary, fontSize: 12, fontWeight: '600', textTransform: 'capitalize' }}>
                                            {type}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                                {['all', 'supervisor', 'merchandiser'].map(tgt => (
                                    <TouchableOpacity 
                                        key={tgt} 
                                        onPress={() => setNewNotif({...newNotif, target: tgt})}
                                        style={{ 
                                            paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
                                            backgroundColor: newNotif.target === tgt ? colors.text : colors.background
                                        }}
                                    >
                                        <Text style={{ color: newNotif.target === tgt ? colors.surface : colors.textSecondary, fontSize: 12, fontWeight: '700', textTransform: 'capitalize' }}>
                                            {tgt === 'all' ? 'All Users' : tgt + 's'}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                                <TouchableOpacity 
                                    onPress={() => setNewNotif({...newNotif, target: 'specific'})}
                                    style={{ 
                                        paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
                                        backgroundColor: newNotif.target === 'specific' ? colors.text : colors.background
                                    }}
                                >
                                    <Text style={{ color: newNotif.target === 'specific' ? colors.surface : colors.textSecondary, fontSize: 12, fontWeight: '700' }}>
                                        Specific User
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {newNotif.target === 'specific' && (
                                <View style={{ marginTop: 4, borderRadius: 12, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }}>
                                    <select 
                                        value={newNotif.specificUserId} 
                                        onChange={e => setNewNotif({...newNotif, specificUserId: e.target.value})}
                                        style={{ width: '100%', padding: 12, backgroundColor: colors.background, color: colors.text, border: 'none', outline: 'none' }}
                                    >
                                        <option value="" disabled>Select a user...</option>
                                        {allUsers.map(u => (
                                            <option key={u.id} value={u.id}>{u.first_name} {u.last_name} ({u.role})</option>
                                        ))}
                                    </select>
                                </View>
                            )}
                        </View>
                        
                        <View style={{ flex: 0.5, minWidth: 120, justifyContent: 'flex-end' }}>
                            <TouchableOpacity 
                                onPress={handleSendNotification}
                                disabled={sending}
                                style={{
                                    backgroundColor: colors.primary,
                                    padding: 16,
                                    borderRadius: 14,
                                    alignItems: 'center',
                                    flexDirection: 'row',
                                    justifyContent: 'center',
                                    gap: 8,
                                    opacity: sending ? 0.7 : 1
                                }}
                            >
                                {sending ? <ActivityIndicator color="#fff" /> : (
                                    <>
                                        <Ionicons name="send" size={18} color="#fff" />
                                        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>Dispatch</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                <View style={{ marginBottom: 32, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 16, padding: 4, alignSelf: 'flex-start', borderWidth: 1, borderColor: colors.border }}>
                        {filters.map(filter => (
                            <TouchableOpacity
                                key={filter.id}
                                onPress={() => setSelectedFilter(filter.id)}
                                style={{
                                    paddingHorizontal: 20,
                                    paddingVertical: 10,
                                    borderRadius: 12,
                                    backgroundColor: selectedFilter === filter.id ? colors.primary : 'transparent',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 8
                                }}
                            >
                                <Text style={{
                                    color: selectedFilter === filter.id ? '#fff' : colors.textSecondary,
                                    fontWeight: '700',
                                    fontSize: 14
                                }}>
                                    {filter.label}
                                </Text>
                                {filter.count > 0 && (
                                    <View style={{ backgroundColor: selectedFilter === filter.id ? 'rgba(255,255,255,0.2)' : colors.primary + '15', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                                        <Text style={{ fontSize: 11, fontWeight: '700', color: selectedFilter === filter.id ? '#fff' : colors.primary }}>{filter.count}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity
                        onPress={handleMarkAllAsRead}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: colors.primary + '30' }}
                    >
                        <Ionicons name="checkmark-done" size={18} color={colors.primary} />
                        <Text style={{ color: colors.primary, fontWeight: '700' }}>Mark all as read</Text>
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <ListSkeleton count={8} />
                ) : (
                    <View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <Text style={{ fontSize: 20, fontFamily: Fonts.headingSemiBold, color: colors.text }}>{sectionTitles[selectedFilter] ?? 'Notifications'}</Text>
                            <TouchableOpacity
                                onPress={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                                style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
                            >
                                <Ionicons name="swap-vertical" size={16} color={colors.textSecondary} />
                                <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>{sortOrder === 'desc' ? "Newest First" : "Oldest First"}</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={{ gap: 16 }}>
                            {filteredNotifications.length === 0 ? (
                                <View style={[styles.empty, { padding: 80, backgroundColor: colors.surface, borderRadius: 24 }]}>
                                    <Ionicons name="notifications-off-outline" size={64} color={colors.textMuted} />
                                    <Text style={{ color: colors.textSecondary, marginTop: 16, fontSize: 18, fontWeight: '600' }}>No notifications found</Text>
                                    <Text style={{ color: colors.textMuted, marginTop: 8 }}>You&apos;re all caught up!</Text>
                                </View>
                            ) : (
                                filteredNotifications.map(item => {
                                    const config = getTypeConfig(item.type);
                                    return (
                                        <TouchableOpacity 
                                            key={item.id}
                                            onPress={() => handleNotificationPress(item)}
                                            onLongPress={() => handleLongPress(item.id)}
                                            style={[styles.notifCard, { backgroundColor: item.is_read ? 'transparent' : colors.primary + '05', borderRadius: 16 }]}
                                        >
                                            <View style={[styles.iconContainer, { backgroundColor: config.color + '15' }]}>
                                                <Ionicons name={config.icon as any} size={22} color={config.color} />
                                            </View>
                                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                <Text style={[styles.notifTitle, { color: colors.text }]}>{item.title}</Text>
                                                <Text style={[styles.notifBody, { color: colors.textSecondary }]}>{item.message}</Text>
                                                <Text style={[styles.notifTime, { color: colors.textMuted }]}>{formatTime(item.created_at)}</Text>
                                                
                                                {item.type === 'demo' && (
                                                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                                                        <TouchableOpacity 
                                                            style={{ backgroundColor: colors.success, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 8 }}
                                                            onPress={(e) => {
                                                                // @ts-ignore
                                                                if (e && e.stopPropagation) e.stopPropagation();
                                                                handleDemoAction('approve', item);
                                                            }}
                                                        >
                                                            <Text style={{ color: '#fff', fontSize: 13, fontWeight: 'bold' }}>Approve</Text>
                                                        </TouchableOpacity>
                                                        <TouchableOpacity 
                                                            style={{ backgroundColor: colors.danger, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 8 }}
                                                            onPress={(e) => {
                                                                // @ts-ignore
                                                                if (e && e.stopPropagation) e.stopPropagation();
                                                                handleDemoAction('decline', item);
                                                            }}
                                                        >
                                                            <Text style={{ color: '#fff', fontSize: 13, fontWeight: 'bold' }}>Decline</Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                )}
                                            </div>
                                            {!item.is_read && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
                                        </TouchableOpacity>
                                    );
                                })
                            )}
                        </View>
                    </View>
                )}
            </AdminWebLayout>
        );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 120,
    },
    filterBar: {
        flexDirection: 'row',
        paddingHorizontal: DesignTokens.spacing.lg,
        paddingVertical: DesignTokens.spacing.md,
        gap: DesignTokens.spacing.sm,
    },
    filterBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
    },
    badge: {
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 5,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '700',
    },
    filterText: {
        ...DesignTokens.typography.caption,
        fontWeight: 'bold',
    },
    notificationsList: {
        padding: DesignTokens.spacing.lg,
        gap: DesignTokens.spacing.md,
    },
    notifCard: {
        flexDirection: 'row',
        padding: DesignTokens.spacing.md,
        gap: DesignTokens.spacing.md,
        alignItems: 'center',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    notifInfo: {
        flex: 1,
        gap: 2,
    },
    notifTitle: {
        ...DesignTokens.typography.bodyBold,
    },
    notifBody: {
        ...DesignTokens.typography.caption,
        lineHeight: 18,
    },
    notifTime: {
        ...DesignTokens.typography.tiny,
        marginTop: 4,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    empty: {
        alignItems: 'center',
        marginTop: 60,
    },
    composeSection: {
        padding: DesignTokens.spacing.xl,
        borderRadius: 24,
        borderWidth: 1,
        marginBottom: 40,
        ...DesignTokens.shadows.sm,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 14,
        fontFamily: Fonts.bodyMedium,
    },
});
