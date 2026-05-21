import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Text,
    TouchableOpacity,
    View,
    TextInput,
    Modal,
    ScrollView
} from 'react-native';
import { AdminWebLayout } from '@/components/admin/WebLayout';
import { Card } from '@/components/ui/Card';
import { DesignTokens, getColors } from '@/constants/designSystem';
import { useTheme } from '@/context/ThemeContext';
import { Fonts } from '@/hooks/useFonts';
import { GMSService } from '@/services/gms.service';
import { Notification, NotificationService } from '@/services/notification.service';
import { Objective, ObjectiveService } from '@/services/objective.service';
import { UserService } from '@/services/user.service';

export default function PlanningPage() {
    const router = useRouter();
    const { theme } = useTheme();
    const colors = getColors(theme);

    const [mainTab, setMainTab] = useState<'objectives' | 'requests'>('objectives');

    // --- REQUESTS STATE ---
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loadingReqs, setLoadingReqs] = useState(true);

    // --- OBJECTIVES STATE ---
    const [objectives, setObjectives] = useState<Objective[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [loadingObjs, setLoadingObjs] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        user_id: '',
        title: '',
        description: '',
        target: '0',
        target_visits: '0',
        month: (new Date().getMonth() + 1).toString(),
        year: new Date().getFullYear().toString()
    });

    const loadNotifications = async () => {
        try {
            setLoadingReqs(true);
            const data = await NotificationService.getNotifications();
            setNotifications(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Load requests error:', error);
        } finally {
            setLoadingReqs(false);
        }
    };

    const loadObjectives = async () => {
        try {
            setLoadingObjs(true);
            const [objsData, usersData] = await Promise.all([
                ObjectiveService.getAll(),
                UserService.getAll({ limit: 1000 })
            ]);
            setObjectives(objsData || []);
            setUsers((usersData || []).filter((u: any) => u.role !== 'admin'));
        } catch (error) {
            console.error('Error loading objectives', error);
        } finally {
            setLoadingObjs(false);
        }
    };

    useEffect(() => {
        if (mainTab === 'requests') loadNotifications();
        else loadObjectives();
    }, [mainTab]);

    // ==========================================
    // REQUESTS LOGIC
    // ==========================================
    const requestsList = notifications.filter(notif =>
        ['new_gms', 'report', 'alert'].includes(notif.type)
    );

    const handleDeleteNotification = async (id: number) => {
        const success = await NotificationService.deleteNotification(id);
        if (success) {
            setNotifications(prev => prev.filter(n => n.id !== id));
        } else {
            alert('Failed to delete notification');
        }
    };

    const handleActionOption = async (action: 'approve' | 'wait' | 'delete' | 'fixed', item: Notification) => {
        try {
            switch (action) {
                case 'approve':
                    if (item.action_link) {
                        const payload = JSON.parse(item.action_link);
                        const createPayload = { 
                            ...payload, 
                            supervisor_id: payload.requester_id || payload.supervisor_id 
                        };
                        const newGms = await GMSService.create(createPayload);

                        if (newGms) {
                            await NotificationService.sendNotification({
                                user_id: item.user_id || 1,
                                title: 'New GMS Approved',
                                message: `Your request to add ${payload.name} has been approved.`,
                                type: 'success',
                                icon: 'checkmark-circle'
                            } as any);
                            await handleDeleteNotification(item.id);
                            alert('GMS approved and created.');
                        } else {
                            alert('Failed to create GMS in database.');
                        }
                    }
                    break;
                case 'fixed':
                    await NotificationService.sendNotification({
                        user_id: item.user_id || 1,
                        title: 'Report Fixed',
                        message: `The issue you reported has been resolved.`,
                        type: 'success',
                        icon: 'build'
                    } as any);
                    await handleDeleteNotification(item.id);
                    alert('Sender notified and report marked fixed.');
                    break;
                case 'wait':
                    if (!item.is_read) {
                        await NotificationService.markAsRead(item.id);
                        setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, is_read: true } : n));
                    }
                    break;
                case 'delete':
                    if (window.confirm('Are you sure you want to delete this request?')) {
                        handleDeleteNotification(item.id);
                    }
                    break;
            }
        } catch (error) {
            console.error('Action error', error);
            alert('An error occurred while processing the action.');
        }
    };

    const getRequestTypeLabel = (type: string) => {
        switch (type) {
            case 'new_gms': return 'New GMS Request';
            case 'report':
            case 'alert': return 'Field Report / Alert';
            default: return 'Request';
        }
    };

    // ==========================================
    // OBJECTIVES LOGIC
    // ==========================================
    const handleSaveObjective = async () => {
        if (!form.user_id || !form.title) {
            alert('Please select a user and provide a title.');
            return;
        }
        setSaving(true);
        try {
            await ObjectiveService.create({
                ...form,
                user_id: parseInt(form.user_id),
                target: parseInt(form.target) || 0,
                target_visits: parseInt(form.target_visits) || 0,
                month: parseInt(form.month),
                year: parseInt(form.year),
                current: 0,
                status: 'pending'
            });
            alert('Objective assigned successfully!');
            setModalVisible(false);
            setForm({ ...form, title: '', description: '', target: '0', target_visits: '0' });
            loadObjectives();
        } catch (error) {
            console.error(error);
            alert('Failed to create objective.');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteObjective = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this objective?')) {
            await ObjectiveService.delete(id);
            loadObjectives();
        }
    };

    return (
        <AdminWebLayout title="Planning & Objectives">
            {/* Top Level Mode Switcher */}
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 32, padding: 6, backgroundColor: colors.surface, borderRadius: 16, alignSelf: 'flex-start', borderWidth: 1, borderColor: colors.border }}>
                <TouchableOpacity onPress={() => setMainTab('objectives')} style={{ paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, backgroundColor: mainTab === 'objectives' ? colors.primary : 'transparent' }}>
                    <Text style={{ color: mainTab === 'objectives' ? '#fff' : colors.textSecondary, fontWeight: '700', fontFamily: Fonts.headingSemiBold }}>Monthly Objectives</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setMainTab('requests')} style={{ paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, backgroundColor: mainTab === 'requests' ? colors.primary : 'transparent' }}>
                    <Text style={{ color: mainTab === 'requests' ? '#fff' : colors.textSecondary, fontWeight: '700', fontFamily: Fonts.headingSemiBold }}>Management Requests</Text>
                </TouchableOpacity>
            </View>

            {mainTab === 'requests' ? (
                // ------------------------------------
                // REQUESTS VIEW
                // ------------------------------------
                <View>
                    {loadingReqs ? <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 100 }} /> : (
                        <View style={{ gap: 20 }}>
                            {requestsList.length === 0 ? (
                                <View style={{ alignItems: 'center', marginTop: 60, padding: 80, backgroundColor: colors.surface, borderRadius: 24 }}>
                                    <Ionicons name="checkmark-done-circle-outline" size={64} color={colors.textMuted} />
                                    <Text style={{ color: colors.textSecondary, marginTop: 16, fontSize: 18, fontWeight: '600' }}>No pending requests at the moment</Text>
                                </View>
                            ) : (
                                requestsList.map((item: Notification) => {
                                    const icon = item.type === 'new_gms' ? 'storefront' : 'alert-circle';
                                    const color = item.type === 'new_gms' ? colors.success : colors.danger;
                                    return (
                                        <View key={item.id} style={{ backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                                                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: color + '15', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Ionicons name={icon as any} size={20} color={color} />
                                                </View>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>{getRequestTypeLabel(item.type)}</Text>
                                                    <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>{new Date(item.created_at).toLocaleDateString()}</Text>
                                                </View>
                                            </View>

                                            <View style={{ padding: 16, backgroundColor: colors.surfaceSecondary }}>
                                                <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 4 }}>{item.title}</Text>
                                                <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 18 }}>{item.message}</Text>
                                            </View>

                                            <View style={{ flexDirection: 'row', gap: 8, padding: 12 }}>
                                                {item.type === 'new_gms' && (
                                                    <TouchableOpacity onPress={() => handleActionOption('approve', item)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, backgroundColor: colors.success }}>
                                                        <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
                                                        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Approve</Text>
                                                    </TouchableOpacity>
                                                )}
                                                {(item.type === 'report' || item.type === 'alert') && (
                                                    <TouchableOpacity onPress={() => handleActionOption('fixed', item)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, backgroundColor: colors.primary }}>
                                                        <Ionicons name="build-outline" size={16} color="#fff" />
                                                        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Mark Fixed</Text>
                                                    </TouchableOpacity>
                                                )}
                                                <TouchableOpacity onPress={() => handleActionOption('delete', item)} style={{ paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: colors.danger }}>
                                                    <Ionicons name="trash-outline" size={16} color="#fff" />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    );
                                })
                            )}
                        </View>
                    )}
                </View>
            ) : (
                // ------------------------------------
                // OBJECTIVES VIEW
                // ------------------------------------
                <View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                        <Text style={{ fontSize: 20, fontFamily: Fonts.headingSemiBold, color: colors.text }}>Team Objectives</Text>
                        <TouchableOpacity 
                            onPress={() => setModalVisible(true)}
                            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 }}
                        >
                            <Ionicons name="add" size={20} color="#fff" />
                            <Text style={{ color: '#fff', fontFamily: Fonts.bodySemiBold }}>Assign Objective</Text>
                        </TouchableOpacity>
                    </View>

                    {loadingObjs ? <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 100 }} /> : (
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 20 }}>
                            {objectives.length === 0 ? (
                                <View style={{ width: '100%', alignItems: 'center', marginTop: 60, padding: 80, backgroundColor: colors.surface, borderRadius: 24 }}>
                                    <Ionicons name="flag-outline" size={64} color={colors.textMuted} />
                                    <Text style={{ color: colors.textSecondary, marginTop: 16, fontSize: 18, fontWeight: '600' }}>No Objectives Set</Text>
                                    <Text style={{ color: colors.textMuted, marginTop: 8 }}>Assign goals to your team members to track performance.</Text>
                                </View>
                            ) : (
                                objectives.map((obj) => {
                                    const user = users.find(u => u.id === obj.user_id);
                                    const visitProgress = obj.target_visits > 0 ? (obj.current / obj.target_visits) * 100 : 0;
                                    const progressColor = visitProgress >= 100 ? colors.success : colors.primary;

                                    return (
                                        <Card key={obj.id} style={{ width: '32%', padding: 20, backgroundColor: colors.surface }}>
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary + '20', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Text style={{ color: colors.primary, fontWeight: 'bold' }}>
                                                            {user ? user.first_name[0] + user.last_name[0] : '?'}
                                                        </Text>
                                                    </View>
                                                    <View>
                                                        <Text style={{ color: colors.text, fontFamily: Fonts.bodySemiBold }}>{user ? `${user.first_name} ${user.last_name}` : 'Unknown'}</Text>
                                                        <Text style={{ color: colors.textMuted, fontSize: 12 }}>{user?.role}</Text>
                                                    </View>
                                                </View>
                                                <TouchableOpacity onPress={() => handleDeleteObjective(obj.id)}>
                                                    <Ionicons name="trash-outline" size={18} color={colors.danger} />
                                                </TouchableOpacity>
                                            </View>

                                            <Text style={{ color: colors.text, fontSize: 16, fontFamily: Fonts.headingSemiBold, marginBottom: 8 }}>{obj.title}</Text>
                                            <Text style={{ color: colors.textMuted, fontSize: 13, marginBottom: 20 }} numberOfLines={2}>{obj.description || 'No description provided'}</Text>

                                            <View style={{ backgroundColor: colors.background, padding: 16, borderRadius: 12, gap: 12 }}>
                                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                                    <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '600' }}>Visit Progress</Text>
                                                    <Text style={{ color: colors.text, fontSize: 13, fontWeight: 'bold' }}>{obj.current} / {obj.target_visits}</Text>
                                                </View>
                                                <View style={{ height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden' }}>
                                                    <View style={{ height: '100%', width: `${Math.min(visitProgress, 100)}%`, backgroundColor: progressColor }} />
                                                </View>
                                                
                                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                                                    <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '600' }}>Sales/Tasks Target</Text>
                                                    <Text style={{ color: colors.text, fontSize: 13, fontWeight: 'bold' }}>{obj.target}</Text>
                                                </View>
                                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                                    <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '600' }}>Period</Text>
                                                    <Text style={{ color: colors.primary, fontSize: 13, fontWeight: 'bold' }}>Month {obj.month}, {obj.year}</Text>
                                                </View>
                                            </View>
                                        </Card>
                                    );
                                })
                            )}
                        </View>
                    )}
                </View>
            )}

            {/* Modal for Creating Objective */}
            <Modal visible={modalVisible} transparent animationType="fade">
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
                    <View style={{ backgroundColor: colors.surface, width: 500, borderRadius: 24, padding: 32 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <Text style={{ fontSize: 20, fontFamily: Fonts.headingSemiBold, color: colors.text }}>Assign Monthly Objective</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color={colors.textMuted} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={{ maxHeight: 500 }}>
                            <View style={{ marginBottom: 16 }}>
                                <Text style={{ color: colors.text, marginBottom: 8, fontFamily: Fonts.bodySemiBold }}>Assign To User</Text>
                                <select 
                                    value={form.user_id} 
                                    onChange={e => setForm({...form, user_id: e.target.value})}
                                    style={{ width: '100%', padding: 12, backgroundColor: colors.background, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: 12, outline: 'none' }}
                                >
                                    <option value="" disabled>Select User...</option>
                                    {users.map(u => (
                                        <option key={u.id} value={u.id}>{u.first_name} {u.last_name} ({u.role})</option>
                                    ))}
                                </select>
                            </View>

                            <View style={{ marginBottom: 16 }}>
                                <Text style={{ color: colors.text, marginBottom: 8, fontFamily: Fonts.bodySemiBold }}>Objective Title</Text>
                                <TextInput 
                                    style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, color: colors.text, backgroundColor: colors.background }}
                                    placeholder="e.g. Q2 Display Checks"
                                    placeholderTextColor={colors.textMuted}
                                    value={form.title}
                                    onChangeText={t => setForm({...form, title: t})}
                                />
                            </View>

                            <View style={{ marginBottom: 16 }}>
                                <Text style={{ color: colors.text, marginBottom: 8, fontFamily: Fonts.bodySemiBold }}>Description (Optional)</Text>
                                <TextInput 
                                    style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, color: colors.text, backgroundColor: colors.background, height: 80, textAlignVertical: 'top' }}
                                    placeholder="Details..."
                                    placeholderTextColor={colors.textMuted}
                                    multiline
                                    value={form.description}
                                    onChangeText={t => setForm({...form, description: t})}
                                />
                            </View>

                            <View style={{ flexDirection: 'row', gap: 16, marginBottom: 16 }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ color: colors.text, marginBottom: 8, fontFamily: Fonts.bodySemiBold }}>Target Visits</Text>
                                    <TextInput 
                                        style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, color: colors.text, backgroundColor: colors.background }}
                                        keyboardType="numeric"
                                        value={form.target_visits}
                                        onChangeText={t => setForm({...form, target_visits: t})}
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ color: colors.text, marginBottom: 8, fontFamily: Fonts.bodySemiBold }}>Other Numeric Target</Text>
                                    <TextInput 
                                        style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, color: colors.text, backgroundColor: colors.background }}
                                        keyboardType="numeric"
                                        value={form.target}
                                        onChangeText={t => setForm({...form, target: t})}
                                    />
                                </View>
                            </View>

                            <View style={{ flexDirection: 'row', gap: 16, marginBottom: 24 }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ color: colors.text, marginBottom: 8, fontFamily: Fonts.bodySemiBold }}>Month (1-12)</Text>
                                    <TextInput 
                                        style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, color: colors.text, backgroundColor: colors.background }}
                                        keyboardType="numeric"
                                        value={form.month}
                                        onChangeText={t => setForm({...form, month: t})}
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ color: colors.text, marginBottom: 8, fontFamily: Fonts.bodySemiBold }}>Year</Text>
                                    <TextInput 
                                        style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, color: colors.text, backgroundColor: colors.background }}
                                        keyboardType="numeric"
                                        value={form.year}
                                        onChangeText={t => setForm({...form, year: t})}
                                    />
                                </View>
                            </View>

                            <TouchableOpacity 
                                style={{ backgroundColor: colors.primary, padding: 16, borderRadius: 12, alignItems: 'center' }}
                                onPress={handleSaveObjective}
                                disabled={saving}
                            >
                                {saving ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontFamily: Fonts.bodySemiBold, fontSize: 16 }}>Save Objective</Text>}
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </AdminWebLayout>
    );
}