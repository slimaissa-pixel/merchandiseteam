import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { AdminWebLayout } from '@/components/admin/WebLayout';
import { useWebTheme } from '@/hooks/useWebTheme';
import { Complaint, ComplaintService } from '@/services/complaint.service';

const TYPE_LABELS: Record<string, string> = {
    store_issue: 'Stock Issue',
    colleague: 'Colleague',
    equipment: 'Equipment',
    route: 'Route',
    other: 'Other',
};

const STATUS_COLOR: Record<string, string> = {
    open: '#f59e0b',
    in_review: '#3b82f6',
    resolved: '#10b981',
    rejected: '#ef4444',
};

const ROLE_COLOR: Record<string, { bg: string; text: string }> = {
    merchandiser: { bg: '#1d4ed820', text: '#60a5fa' },
    supervisor: { bg: '#7c3aed20', text: '#a78bfa' },
    admin: { bg: '#dc262620', text: '#f87171' },
    other: { bg: '#6b728020', text: '#9ca3af' },
};

export default function AdminComplaints() {
    const { T: colors } = useWebTheme();

    const [activeTab, setActiveTab] = useState<'all' | 'open' | 'in_review' | 'resolved'>('all');
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [detail, setDetail] = useState<Complaint | null>(null);
    const [responseText, setResponseText] = useState('');
    const [processing, setProcessing] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        const data = await ComplaintService.getAll(activeTab === 'all' ? '' : activeTab);
        setComplaints(data);
        setLoading(false);
    }, [activeTab]);

    useEffect(() => { load(); }, [load]);

    const stats = useMemo(() => ({
        total: complaints.length,
        open: complaints.filter(c => c.status === 'open').length,
        in_review: complaints.filter(c => c.status === 'in_review').length,
        resolved: complaints.filter(c => c.status === 'resolved').length,
    }), [complaints]);

    const filtered = useMemo(() =>
        complaints.filter(c =>
            (activeTab === 'all' || c.status === activeTab) &&
            (c.description.toLowerCase().includes(search.toLowerCase()) ||
             c.requester_name.toLowerCase().includes(search.toLowerCase()))
        ), [complaints, search, activeTab]);

    const handleResolve = async (status: 'resolved' | 'rejected') => {
        if (!detail) return;
        setProcessing(true);
        await ComplaintService.resolve(detail.id, status, responseText || undefined);
        setProcessing(false);
        setDetail(null);
        setResponseText('');
        load();
    };

    const handleInReview = async (item: Complaint) => {
        await ComplaintService.resolve(item.id, 'in_review');
        load();
    };

    return (
        <AdminWebLayout title="Complaints">
            {/* Stats Row */}
            <View style={{ flexDirection: 'row', gap: 16, marginBottom: 32 }}>
                {[
                    { label: 'TOTAL', value: stats.total, color: colors.primary },
                    { label: 'OPEN', value: stats.open, color: colors.warning },
                    { label: 'IN REVIEW', value: stats.in_review, color: colors.info },
                    { label: 'RESOLVED', value: stats.resolved, color: colors.success },
                ].map(s => (
                    <View key={s.label} style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: colors.border }}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textSecondary, letterSpacing: 1, marginBottom: 8 }}>{s.label}</Text>
                        <Text style={{ fontSize: 28, fontWeight: '900', color: s.color }}>{s.value}</Text>
                    </View>
                ))}
            </View>

            {/* Filter Tabs + Search */}
            <View style={{ flexDirection: 'row', gap: 16, marginBottom: 24, alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 12, padding: 4, borderWidth: 1, borderColor: colors.border }}>
                    {(['all', 'open', 'in_review', 'resolved'] as const).map(tab => (
                        <TouchableOpacity
                            key={tab}
                            onPress={() => setActiveTab(tab)}
                            style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: activeTab === tab ? colors.primary : 'transparent' }}
                        >
                            <Text style={{ color: activeTab === tab ? '#fff' : colors.textSecondary, fontWeight: '700', fontSize: 13 }}>
                                {tab.charAt(0).toUpperCase() + tab.slice(1).replace('_', ' ')}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
                <TextInput
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Search complaints…"
                    placeholderTextColor={colors.textSecondary}
                    style={{ flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, color: colors.text, fontSize: 14 } as any}
                />
            </View>

            {/* Complaints List */}
            {loading ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 80 }} />
            ) : (
                <View style={{ gap: 12 }}>
                    {filtered.length === 0 ? (
                        <View style={{ padding: 80, alignItems: 'center', backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.border }}>
                            <Ionicons name="checkmark-done-circle-outline" size={64} color={colors.textSecondary} />
                            <Text style={{ color: colors.textSecondary, marginTop: 16, fontSize: 18, fontWeight: '600' }}>No complaints found</Text>
                        </View>
                    ) : (
                        filtered.map(c => {
const roleLabel = c.requester_role?.toLowerCase() === 'livreur' ? 'SUPERVISOR' : (c.requester_role?.toUpperCase() || 'MERCHANDISER');
                                            const roleColorKey = c.requester_role?.toLowerCase() === 'livreur' ? 'supervisor' : (c.requester_role?.toLowerCase() || 'merchandiser');
                                            const roleColorObj = ROLE_COLOR[roleColorKey] || ROLE_COLOR.other;
                                            
                                            return (
                                                <TouchableOpacity
                                                    key={c.id}
                                                    onPress={() => setDetail(c)}
                                                    style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: colors.border }}
                                                >
                                                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                                                        <View style={{ flex: 1 }}>
                                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                                                                <View style={{
                                                                    paddingHorizontal: 10,
                                                                    paddingVertical: 3,
                                                                    borderRadius: 8,
                                                                    backgroundColor: roleColorObj.bg
                                                                }}>
                                                                    <Text style={{
                                                                        fontSize: 11,
                                                                        fontWeight: '700',
                                                                        color: roleColorObj.text
                                                                    }}>
                                                                        {roleLabel}
                                                                    </Text>
                                                                </View>
                                                                <Text style={{ fontSize: 12, color: colors.textSecondary }}>{c.requester_name}</Text>
                                                            </View>
                                                            <Text style={{ fontSize: 14, color: colors.text, lineHeight: 20 }} numberOfLines={2}>{c.description}</Text>
                                    </View>
                                    <View style={{ alignItems: 'flex-end', gap: 8 }}>
                                        <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: STATUS_COLOR[c.status] + '20' }}>
                                            <Text style={{ color: STATUS_COLOR[c.status], fontWeight: '700', fontSize: 11, textTransform: 'uppercase' }}>{c.status}</Text>
                                        </View>
                                        <Text style={{ fontSize: 11, color: colors.textSecondary }}>{TYPE_LABELS[c.type] || c.type}</Text>
                                    </View>
                                </View>
                                {c.status === 'open' && (
                                    <TouchableOpacity
                                        onPress={() => handleInReview(c)}
                                        style={{ marginTop: 12, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: colors.info + '20', borderWidth: 1, borderColor: colors.info + '40' }}
                                    >
                                        <Ionicons name="eye-outline" size={14} color={colors.info} />
                                        <Text style={{ color: colors.info, fontWeight: '700', fontSize: 12 }}>Mark as In Review</Text>
                                    </TouchableOpacity>
                                )}
                            </TouchableOpacity>
                        );
                    })
                    )}
                </View>
            )}

            {/* Detail Modal */}
            <Modal visible={!!detail} transparent animationType="fade" onRequestClose={() => setDetail(null)}>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
                    <View style={{ backgroundColor: colors.surface, borderRadius: 24, padding: 32, width: '100%', maxWidth: 560 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>Complaint Detail</Text>
                            <TouchableOpacity onPress={() => setDetail(null)}>
                                <Ionicons name="close" size={24} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                        {detail && (
                            <>
                                <Text style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 8 }}>
                                    From: <Text style={{ fontWeight: '700', color: colors.text }}>{detail.requester_name}</Text> ({detail.requester_role}) · {TYPE_LABELS[detail.type] || detail.type}
                                </Text>
                                <View style={{ backgroundColor: colors.bg, borderRadius: 12, padding: 16, marginBottom: 20 }}>
                                    <Text style={{ color: colors.text, fontSize: 14, lineHeight: 22 }}>{detail.description}</Text>
                                </View>
                                <TextInput
                                    value={responseText}
                                    onChangeText={setResponseText}
                                    placeholder="Optional response message…"
                                    placeholderTextColor={colors.textSecondary}
                                    multiline
                                    numberOfLines={3}
                                    style={{ backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, color: colors.text, fontSize: 14, marginBottom: 20, minHeight: 80 } as any}
                                />
                                <View style={{ flexDirection: 'row', gap: 12 }}>
                                    <TouchableOpacity
                                        onPress={() => handleResolve('resolved')}
                                        disabled={processing}
                                        style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, backgroundColor: colors.success }}
                                    >
                                        <Ionicons name="checkmark-circle" size={18} color="#fff" />
                                        <Text style={{ color: '#fff', fontWeight: '700' }}>Resolve</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => handleResolve('rejected')}
                                        disabled={processing}
                                        style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, backgroundColor: colors.danger }}
                                    >
                                        <Ionicons name="close-circle" size={18} color="#fff" />
                                        <Text style={{ color: '#fff', fontWeight: '700' }}>Reject</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
        </AdminWebLayout>
    );
}
