import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { AdminWebLayout } from '@/components/admin/WebLayout';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ListSkeleton } from '@/components/ui/LoadingSkeleton';
import { DesignTokens, getColors } from '@/constants/designSystem';
import { useTheme } from '@/context/ThemeContext';
import { Fonts } from '@/hooks/useFonts';
import { LeaveRequest, LeaveService } from '@/services/leave.service';

export default function LeavePage() {
    const router = useRouter();
    const { theme } = useTheme();
    const colors = getColors(theme);

    const [selectedTab, setSelectedTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);

    // Review Modal
    const [reviewing, setReviewing] = useState<LeaveRequest | null>(null);
    const [adminComment, setAdminComment] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const load = async () => {
        setLoading(true);
        const data = await LeaveService.getAll();
        setRequests(data);
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const filteredRequests = requests.filter(req =>
        selectedTab === 'all' || req.status === selectedTab
    );

    const handleProcessRequest = async (status: 'approved' | 'rejected') => {
        if (!reviewing) return;
        setIsSaving(true);
        await LeaveService.review(reviewing.id, status, adminComment);
        setIsSaving(false);
        setReviewing(null);
        Alert.alert('Success', `Request ${status} successfully.`);
        load();
    };

    const getStatusVariant = (status: string): any => {
        switch (status) {
            case 'pending': return 'warning';
            case 'approved': return 'success';
            case 'rejected': return 'danger';
            default: return 'neutral';
        }
    };

    const renderItem = ({ item }: { item: LeaveRequest }) => (
        <Card style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={[styles.avatar, { backgroundColor: colors.primary + '15' }]}>
                    <Text style={[styles.avatarText, { color: colors.primary }]}>{item.requester_name.charAt(0)}</Text>
                </View>
                <View style={styles.headerText}>
                    <Text style={[styles.name, { color: colors.text }]}>{item.requester_name}</Text>
                    <Text style={[styles.role, { color: colors.textSecondary }]}>{item.requester_role}</Text>
                </View>
                <Badge label={item.status.toUpperCase()} variant={getStatusVariant(item.status)} size="sm" />
            </View>

            <View style={[styles.details, { backgroundColor: colors.surfaceSecondary }]}>
                <View style={styles.detailRow}>
                    <Ionicons name="calendar" size={16} color={colors.primary} />
                    <Text style={[styles.typeText, { color: colors.text }]}>
                        {item.leave_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </Text>
                </View>
                <View style={styles.detailRow}>
                    <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                    <Text style={[styles.dateText, { color: colors.textSecondary }]}>
                        {item.start_date === item.end_date ? item.start_date : `${item.start_date} to ${item.end_date}`}
                    </Text>
                </View>
                {item.reason && (
                    <Text style={[styles.reason, { color: colors.textSecondary }]} numberOfLines={2}>
                        {item.reason}
                    </Text>
                )}
            </View>

            {item.status === 'pending' && (
                <View style={styles.actions}>
                    <Button
                        title="Review"
                        size="sm"
                        icon="eye-outline"
                        onPress={() => { setReviewing(item); setAdminComment(''); }}
                        style={{ flex: 1 }}
                    />
                </View>
            )}

            {item.admin_comment && item.status !== 'pending' && (
                <View style={[styles.responseBox, { borderColor: item.status === 'approved' ? colors.success + '40' : colors.danger + '40' }]}>
                    <Ionicons name={item.status === 'approved' ? "checkmark-circle" : "close-circle"} size={14} color={item.status === 'approved' ? colors.success : colors.danger} />
                    <Text style={[styles.responseText, { color: colors.text }]}>{item.admin_comment}</Text>
                </View>
            )}
        </Card>
    );
return (
            <AdminWebLayout title="Leave Management">
                <View style={{ marginBottom: 32 }}>
                    <View style={{ flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 16, padding: 4, alignSelf: 'flex-start', borderWidth: 1, borderColor: colors.border }}>
                        {(['all', 'pending', 'approved', 'rejected'] as const).map(tab => (
                            <TouchableOpacity
                                key={tab}
                                onPress={() => setSelectedTab(tab)}
                                style={{
                                    paddingHorizontal: 24,
                                    paddingVertical: 10,
                                    borderRadius: 12,
                                    backgroundColor: selectedTab === tab ? colors.primary : 'transparent',
                                }}
                            >
                                <Text style={{
                                    color: selectedTab === tab ? '#fff' : colors.textSecondary,
                                    fontWeight: '700',
                                    fontSize: 14
                                }}>
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {loading ? (
                    <ListSkeleton count={4} />
                ) : (
                    <View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <Text style={{ fontSize: 20, fontFamily: Fonts.headingSemiBold, color: colors.text }}>Staff Requests</Text>
                            <TouchableOpacity onPress={load} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Ionicons name="refresh" size={16} color={colors.primary} />
                                <Text style={{ color: colors.primary, fontWeight: '600' }}>Refresh Data</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={{ gap: 20 }}>
                            {filteredRequests.length === 0 ? (
                                <View style={[styles.empty, { padding: 80, backgroundColor: colors.surface, borderRadius: 24 }]}>
                                    <Ionicons name="calendar-outline" size={64} color={colors.textMuted} />
                                    <Text style={{ color: colors.textSecondary, marginTop: 16, fontSize: 18, fontWeight: '600' }}>No leave requests found</Text>
                                    <Text style={{ color: colors.textMuted, marginTop: 8 }}>The list is clear for this filter.</Text>
                                </View>
                            ) : (
                                filteredRequests.map((item: LeaveRequest) => (
                                    <Card key={item.id} style={{ padding: 24, borderRadius: 20, flexDirection: 'row', gap: 24, alignItems: 'center' }}>
                                        <View style={[styles.avatar, { width: 64, height: 64, borderRadius: 16, backgroundColor: colors.primary + '15' }]}>
                                            <Text style={[styles.avatarText, { fontSize: 24, color: colors.primary }]}>{item.requester_name.charAt(0)}</Text>
                                        </View>

                                        <View style={{ flex: 1 }}>
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <View>
                                                    <Text style={{ fontSize: 18, fontFamily: Fonts.headingSemiBold, color: colors.text }}>{item.requester_name}</Text>
                                                    <Text style={{ fontSize: 14, color: colors.textSecondary }}>{item.requester_role}</Text>
                                                </View>
                                                <Badge label={item.status.toUpperCase()} variant={getStatusVariant(item.status)} size="md" />
                                            </View>

                                            <View style={{ flexDirection: 'row', gap: 24, marginTop: 16 }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                    <Ionicons name="calendar" size={16} color={colors.primary} />
                                                    <Text style={{ fontWeight: '600', color: colors.text }}>{item.leave_type.replace(/_/g, ' ')}</Text>
                                                </View>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                    <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                                                    <Text style={{ color: colors.textSecondary }}>{item.start_date} → {item.end_date}</Text>
                                                </View>
                                            </View>

                                            {item.reason && (
                                                <Text style={{ marginTop: 12, color: colors.textSecondary, borderLeftWidth: 3, borderLeftColor: colors.border, paddingLeft: 12 }}>{item.reason}</Text>
                                            )}
                                        </View>

                                        {item.status === 'pending' && (
                                            <TouchableOpacity
                                                style={{ backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 }}
                                                onPress={() => { setReviewing(item); setAdminComment(''); }}
                                            >
                                                <Text style={{ color: '#fff', fontWeight: '700' }}>Review Request</Text>
                                            </TouchableOpacity>
                                        )}

                                        {item.status !== 'pending' && item.admin_comment && (
                                            <View style={{ width: 200, padding: 12, backgroundColor: colors.background, borderRadius: 12, borderWidth: 1, borderColor: colors.border }}>
                                                <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 4 }}>ADMIN RESPONSE</Text>
                                                <Text style={{ fontSize: 13, color: colors.text }}>{item.admin_comment}</Text>
                                            </View>
                                        )}
                                    </Card>
                                ))
                            )}
                        </View>
                    </View>
                )}
                {reviewing && (
                    <Modal visible={!!reviewing} transparent animationType="fade">
                        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
                            <Card style={{ width: 500, padding: 32, borderRadius: 24 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                                    <Text style={{ fontSize: 24, fontFamily: Fonts.headingSemiBold, color: colors.text }}>Review Leave Request</Text>
                                    <TouchableOpacity onPress={() => setReviewing(null)}>
                                        <Ionicons name="close" size={24} color={colors.text} />
                                    </TouchableOpacity>
                                </View>

                                <View style={{ backgroundColor: colors.background, padding: 20, borderRadius: 16, marginBottom: 24 }}>
                                    <Text style={{ fontWeight: '700', color: colors.text }}>{reviewing.requester_name}</Text>
                                    <Text style={{ color: colors.textSecondary, marginTop: 4 }}>{reviewing.leave_type.replace(/_/g, ' ')}</Text>
                                    <Text style={{ color: colors.textSecondary, marginTop: 2 }}>{reviewing.start_date} to {reviewing.end_date}</Text>
                                    {reviewing.reason && <Text style={{ marginTop: 12, fontStyle: 'italic', color: colors.textSecondary }}>&quot;{reviewing.reason}&quot;</Text>}
                                </View>

                                <Text style={{ fontWeight: '600', color: colors.textSecondary, marginBottom: 8 }}>Admin Comment</Text>
                                <TextInput
                                    style={{
                                        backgroundColor: colors.background,
                                        borderRadius: 12,
                                        padding: 16,
                                        minHeight: 100,
                                        color: colors.text,
                                        borderWidth: 1,
                                        borderColor: colors.border
                                    }}
                                    placeholder="Add a reason for approval/rejection..."
                                    value={adminComment}
                                    onChangeText={setAdminComment}
                                    multiline
                                />

                                <View style={{ flexDirection: 'row', gap: 16, marginTop: 32 }}>
                                    <TouchableOpacity
                                        style={{ flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.danger, alignItems: 'center' }}
                                        onPress={() => handleProcessRequest('rejected')}
                                        disabled={isSaving}
                                    >
                                        <Text style={{ color: colors.danger, fontWeight: '700' }}>Reject Request</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={{ flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: colors.success, alignItems: 'center' }}
                                        onPress={() => handleProcessRequest('approved')}
                                        disabled={isSaving}
                                    >
                                        <Text style={{ color: '#fff', fontWeight: '700' }}>Approve Request</Text>
                                    </TouchableOpacity>
                                </View>
                            </Card>
                        </View>
                    </Modal>
                )}
            </AdminWebLayout>
        );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
    tab: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
    tabText: { ...DesignTokens.typography.caption, fontWeight: 'bold' },
    list: { padding: DesignTokens.spacing.lg, paddingBottom: 100, gap: DesignTokens.spacing.md },
    card: { padding: DesignTokens.spacing.md, gap: DesignTokens.spacing.md, marginBottom: DesignTokens.spacing.md },
    cardHeader: { flexDirection: 'row', alignItems: 'center' },
    avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    avatarText: { ...DesignTokens.typography.h3, lineHeight: 24 },
    headerText: { flex: 1, marginLeft: DesignTokens.spacing.md },
    name: { ...DesignTokens.typography.bodyBold },
    role: { ...DesignTokens.typography.tiny },
    details: { padding: DesignTokens.spacing.md, borderRadius: 14, gap: 8 },
    detailRow: { flexDirection: 'row', alignItems: 'center', gap: DesignTokens.spacing.sm },
    typeText: { ...DesignTokens.typography.caption, fontWeight: 'bold' },
    dateText: { ...DesignTokens.typography.tiny },
    reason: { ...DesignTokens.typography.caption, lineHeight: 18 },
    actions: { flexDirection: 'row', gap: DesignTokens.spacing.md, marginTop: DesignTokens.spacing.sm },
    responseBox: { flexDirection: 'row', gap: 6, padding: 10, borderRadius: 10, borderWidth: 1, alignItems: 'center', marginTop: 4 },
    responseText: { ...DesignTokens.typography.caption, flex: 1 },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },

    // Modal
    modal: { flex: 1 },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1 },
    modalTitle: { ...DesignTokens.typography.h2 },
    modalBody: { padding: DesignTokens.spacing.lg, gap: DesignTokens.spacing.md },
    label: { ...DesignTokens.typography.caption, fontWeight: '600' },
    inputWrap: { borderRadius: 12, borderWidth: 1, padding: 12 },
    textArea: { fontSize: 14, minHeight: 100 },
    modalActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
    actionBtn: { flex: 1, borderWidth: 1, borderColor: 'transparent' },
});
