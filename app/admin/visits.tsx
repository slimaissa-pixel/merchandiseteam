import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { 
    ActivityIndicator, 
    Text, 
    TouchableOpacity, 
    View, 
    ScrollView, 
    StyleSheet, 
    Modal, 
    TextInput,
    Image,
    Platform
} from 'react-native';
import { AdminWebLayout } from '@/components/admin/WebLayout';
import { Card } from '@/components/ui/Card';
import { getColors } from '@/constants/designSystem';
import { useTheme } from '@/context/ThemeContext';
import { Fonts } from '@/hooks/useFonts';
import { GMSService, GMS, Assignment } from '@/services/gms.service';
import { UserService } from '@/services/user.service';
import { User } from '@/types/auth';
import { getFullImageUrl } from '@/constants/api';

export default function AdminVisitsPage() {
    const router = useRouter();
    const { theme } = useTheme();
    const colors = getColors(theme);
    
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [stores, setStores] = useState<GMS[]>([]);
    const [merchandisers, setMerchandisers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        gms_id: '',
        user_id: '',
        scheduled_date: new Date().toISOString().split('T')[0],
        schedule_type: 'single', // 'single' | 'recurring'
        duration_months: 8,
        days_of_week: [] as number[],
        notes: ''
    });

    const WEEKDAYS = [
        { id: 0, label: 'Mon' },
        { id: 1, label: 'Tue' },
        { id: 2, label: 'Wed' },
        { id: 3, label: 'Thu' },
        { id: 4, label: 'Fri' },
        { id: 5, label: 'Sat' },
        { id: 6, label: 'Sun' }
    ];


    const loadData = async () => {
        setLoading(true);
        try {
            const [assigns, allStores, allUsers] = await Promise.all([
                GMSService.getAllAssignments(),
                GMSService.getAll(),
                UserService.getAll({ limit: 1000 })
            ]);
            setAssignments(assigns);
            setStores(allStores);
            setMerchandisers(allUsers.filter(u => u.role === 'merchandiser'));
        } catch (error) {
            console.error('Error loading visits tracking data', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleScheduleVisit = async () => {
        if (!form.gms_id || !form.user_id || !form.scheduled_date) {
            alert('Please fill in all required fields.');
            return;
        }
        setSaving(true);
        try {
            const baseData = {
                gms_id: parseInt(form.gms_id),
                user_id: parseInt(form.user_id),
                notes: form.notes
            };

            if (form.schedule_type === 'recurring') {
                if (form.days_of_week.length === 0) {
                    alert('Please select at least one working day.');
                    setSaving(false);
                    return;
                }
                const startDate = new Date(form.scheduled_date);
                const endDate = new Date(startDate);
                endDate.setMonth(endDate.getMonth() + form.duration_months);

                const res = await GMSService.assignRecurringMerchandiser({
                    ...baseData,
                    start_date: startDate.toISOString(),
                    end_date: endDate.toISOString(),
                    days_of_week: form.days_of_week
                });
                
                if (res && res.success) {
                    alert(`Successfully scheduled! Created ${res.assignments_created} visits.` + (res.skipped_for_leave ? ` Skipped ${res.skipped_for_leave} dates due to approved leave.` : ''));
                } else {
                    alert('Failed to schedule recurring visits.');
                }
            } else {
                await GMSService.assignMerchandiser({
                    ...baseData,
                    scheduled_date: new Date(form.scheduled_date).toISOString()
                });
            }

            setModalVisible(false);
            setForm({ ...form, notes: '', schedule_type: 'single', days_of_week: [] });
            loadData();
        } catch (error) {
            console.error(error);
            alert('Failed to schedule visit(s).');
        } finally {
            setSaving(false);
        }
    };

    const filteredAssignments = assignments.filter(a => 
        a.user?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.user?.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.gms?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const isDark = theme === 'dark';

    return (
        <AdminWebLayout title="Visits Tracking">
            {/* Header & Search Area */}
            <View style={vSt.headerArea}>
                <View style={vSt.searchContainer}>
                    <View style={[vSt.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Ionicons name="search" size={18} color={colors.textMuted} />
                        <TextInput 
                            style={[vSt.searchInput, { color: colors.text, outlineStyle: 'none' } as any]}
                            placeholder="Search for merchandisers, stores or reports..."
                            placeholderTextColor={colors.textMuted}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                </View>
                
                <View style={vSt.actionButtons}>
                    <TouchableOpacity 
                        style={[vSt.scheduleBtn, { backgroundColor: colors.primary }]}
                        onPress={() => setModalVisible(true)}
                    >
                        <Ionicons name="add" size={20} color="#fff" />
                        <Text style={vSt.scheduleBtnText}>Schedule Visit</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={vSt.filterBtn}>
                        <Text style={{ color: colors.primary, fontWeight: '600' }}>Clear Filters</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Main Content Table */}
            <Card style={[vSt.tableCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {/* Table Header */}
                <View style={[vSt.tableHeader, { borderBottomColor: colors.border }]}>
                    <Text style={[vSt.colHeader, { flex: 2, color: colors.textMuted }]}>MERCHANDISER</Text>
                    <Text style={[vSt.colHeader, { flex: 2, color: colors.textMuted }]}>STORE NAME</Text>
                    <Text style={[vSt.colHeader, { flex: 1.5, color: colors.textMuted }]}>PLANNED DATE</Text>
                    <Text style={[vSt.colHeader, { flex: 1.5, color: colors.textMuted }]}>CHECK-IN / OUT</Text>
                    <Text style={[vSt.colHeader, { flex: 1, color: colors.textMuted }]}>DURATION</Text>
                    <Text style={[vSt.colHeader, { flex: 1, color: colors.textMuted, textAlign: 'center' }]}>STATUS</Text>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 60 }} />
                ) : filteredAssignments.length === 0 ? (
                    <View style={vSt.emptyState}>
                        <Ionicons name="calendar-outline" size={48} color={colors.textMuted} />
                        <Text style={{ color: colors.textMuted, marginTop: 12 }}>No visits found.</Text>
                    </View>
                ) : (
                    <ScrollView>
                        {filteredAssignments.map((item) => (
                            <View key={item.id} style={[vSt.tableRow, { borderBottomColor: colors.border + '50' }]}>
                                {/* Merchandiser */}
                                <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                    <View style={vSt.avatar}>
                                        {item.user?.profile_image ? (
                                            <Image source={{ uri: getFullImageUrl(item.user.profile_image) || '' }} style={vSt.avatarImg} />
                                        ) : (
                                            <Text style={[vSt.avatarText, { color: colors.primary }]}>{item.user?.first_name?.[0]}</Text>
                                        )}
                                    </View>
                                    <View>
                                        <Text style={[vSt.rowMainText, { color: colors.text }]}>{item.user?.first_name} {item.user?.last_name}</Text>
                                        <Text style={[vSt.rowSubText, { color: colors.textMuted }]}>ID #{item.user?.id}</Text>
                                    </View>
                                </View>

                                {/* Store */}
                                <View style={{ flex: 2 }}>
                                    <Text style={[vSt.rowMainText, { color: colors.text }]}>{item.gms?.name}</Text>
                                    <Text style={[vSt.rowSubText, { color: colors.textMuted }]} numberOfLines={1}>{item.gms?.address || 'Address not available'}</Text>
                                </View>

                                {/* Planned Date */}
                                <View style={{ flex: 1.5 }}>
                                    <Text style={[vSt.rowMainText, { color: colors.text }]}>
                                        {item.scheduled_date ? format(new Date(item.scheduled_date), 'MMM dd, yyyy') : 'No date'}
                                    </Text>
                                </View>

                                {/* Check-in/out */}
                                <View style={{ flex: 1.5 }}>
                                    <Text style={[vSt.rowSubText, { color: item.check_in ? colors.success : colors.textMuted }]}>
                                        {item.check_in ? format(new Date(item.check_in), 'hh:mm a') : 'Not Recorded'}
                                    </Text>
                                    <Text style={[vSt.rowSubText, { color: item.check_out ? colors.danger : colors.textMuted }]}>
                                        {item.check_out ? format(new Date(item.check_out), 'hh:mm a') : 'Not Recorded'}
                                    </Text>
                                </View>

                                {/* Duration */}
                                <View style={{ flex: 1 }}>
                                    <Text style={[vSt.rowMainText, { color: colors.text }]}>
                                        {item.duration_minutes ? `${item.duration_minutes}m` : (item.status === 'completed' ? 'N/A' : '0m')}
                                    </Text>
                                </View>

                                {/* Status */}
                                <View style={{ flex: 1, alignItems: 'center' }}>
                                    <View style={[vSt.statusBadge, { backgroundColor: item.status === 'completed' ? colors.success + '15' : colors.primary + '15' }]}>
                                        <View style={[vSt.statusDot, { backgroundColor: item.status === 'completed' ? colors.success : colors.primary }]} />
                                        <Text style={[vSt.statusText, { color: item.status === 'completed' ? colors.success : colors.primary }]}>
                                            {item.status.toUpperCase()}
                                        </Text>
                                    </View>
                                </View>

                                {/* Action */}
                                <View style={{ width: 120, alignItems: 'flex-end' }}>
                                    {item.status === 'completed' ? (
                                        <TouchableOpacity 
                                            style={[vSt.viewReportBtn, { backgroundColor: colors.primary }]}
                                            onPress={() => router.push(`/admin/visit-report/${item.id}`)}
                                        >
                                            <Text style={vSt.viewReportText}>View Report</Text>
                                        </TouchableOpacity>
                                    ) : (
                                        <Text style={{ color: colors.textMuted, fontSize: 12, fontStyle: 'italic' }}>Pending...</Text>
                                    )}
                                </View>
                            </View>
                        ))}
                    </ScrollView>
                )}
            </Card>

            {/* Schedule Visit Modal */}
            <Modal visible={modalVisible} transparent animationType="fade">
                <View style={vSt.modalOverlay}>
                    <View style={[vSt.modalContent, { backgroundColor: colors.surface }]}>
                        <View style={vSt.modalHeader}>
                            <Text style={[vSt.modalTitle, { color: colors.text }]}>Schedule New Visit</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color={colors.textMuted} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={{ padding: 24 }}>
                            <View style={vSt.formGroup}>
                                <Text style={[vSt.label, { color: colors.text }]}>Stores *</Text>
                                <View style={vSt.selectWrapper}>
                                    <select 
                                        value={form.gms_id}
                                        onChange={e => setForm({...form, gms_id: (e.target as any).value})}
                                        style={{
                                            width: '100%',
                                            padding: 12,
                                            backgroundColor: colors.background,
                                            color: colors.text,
                                            border: 'none',
                                            outline: 'none',
                                            fontSize: 14
                                        }}
                                    >
                                        <option value="">Select a store --</option>
                                        {stores.map(s => <option key={s.id} value={s.id}>{s.name} ({s.city})</option>)}
                                    </select>
                                </View>
                            </View>

                            <View style={vSt.formGroup}>
                                <Text style={[vSt.label, { color: colors.text }]}>Merchandiser *</Text>
                                <View style={vSt.selectWrapper}>
                                    <select 
                                        value={form.user_id}
                                        onChange={e => setForm({...form, user_id: (e.target as any).value})}
                                        style={{
                                            width: '100%',
                                            padding: 12,
                                            backgroundColor: colors.background,
                                            color: colors.text,
                                            border: 'none',
                                            outline: 'none',
                                            fontSize: 14
                                        }}
                                    >
                                        <option value="">-- Select a merchandiser --</option>
                                        {merchandisers.map(m => <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>)}
                                    </select>
                                </View>
                            </View>

                            <View style={vSt.formGroup}>
                                <Text style={[vSt.label, { color: colors.text }]}>Schedule Type</Text>
                                <View style={{ flexDirection: 'row', gap: 12 }}>
                                    <TouchableOpacity 
                                        style={[vSt.typeOption, { borderColor: form.schedule_type === 'single' ? colors.primary : colors.border, backgroundColor: form.schedule_type === 'single' ? colors.primary + '10' : 'transparent' }]}
                                        onPress={() => setForm({...form, schedule_type: 'single'})}
                                    >
                                        <Ionicons name="calendar" size={16} color={form.schedule_type === 'single' ? colors.primary : colors.textMuted} />
                                        <Text style={{ color: form.schedule_type === 'single' ? colors.primary : colors.text, fontWeight: '600', fontSize: 13 }}>Single Visit</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        style={[vSt.typeOption, { borderColor: form.schedule_type === 'recurring' ? colors.primary : colors.border, backgroundColor: form.schedule_type === 'recurring' ? colors.primary + '10' : 'transparent' }]}
                                        onPress={() => setForm({...form, schedule_type: 'recurring'})}
                                    >
                                        <Ionicons name="repeat" size={16} color={form.schedule_type === 'recurring' ? colors.primary : colors.textMuted} />
                                        <Text style={{ color: form.schedule_type === 'recurring' ? colors.primary : colors.text, fontWeight: '600', fontSize: 13 }}>Recurring Schedule</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {form.schedule_type === 'recurring' && (
                                <>
                                    <View style={vSt.formGroup}>
                                        <Text style={[vSt.label, { color: colors.text }]}>Repeat Duration</Text>
                                        <View style={vSt.selectWrapper}>
                                            <select 
                                                value={form.duration_months}
                                                onChange={e => setForm({...form, duration_months: parseInt((e.target as any).value)})}
                                                style={{
                                                    width: '100%',
                                                    padding: 12,
                                                    backgroundColor: colors.background,
                                                    color: colors.text,
                                                    border: 'none',
                                                    outline: 'none',
                                                    fontSize: 14
                                                }}
                                            >
                                                <option value={1}>1 Month</option>
                                                <option value={3}>3 Months</option>
                                                <option value={6}>6 Months</option>
                                                <option value={8}>8 Months</option>
                                                <option value={12}>1 Year</option>
                                                <option value={24}>2 Years</option>
                                            </select>
                                        </View>
                                    </View>

                                    <View style={vSt.formGroup}>
                                        <Text style={[vSt.label, { color: colors.text }]}>Working Days (Select multiple)</Text>
                                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                                            {WEEKDAYS.map(day => {
                                                const isSelected = form.days_of_week.includes(day.id);
                                                return (
                                                    <TouchableOpacity 
                                                        key={day.id}
                                                        style={[vSt.dayBadge, { 
                                                            backgroundColor: isSelected ? colors.primary : colors.background,
                                                            borderColor: isSelected ? colors.primary : colors.border
                                                        }]}
                                                        onPress={() => {
                                                            const newDays = isSelected 
                                                                ? form.days_of_week.filter(d => d !== day.id)
                                                                : [...form.days_of_week, day.id];
                                                            setForm({...form, days_of_week: newDays});
                                                        }}
                                                    >
                                                        <Text style={{ 
                                                            color: isSelected ? '#fff' : colors.textMuted, 
                                                            fontWeight: '600', 
                                                            fontSize: 12 
                                                        }}>
                                                            {day.label}
                                                        </Text>
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </View>
                                    </View>
                                </>
                            )}

                            <View style={vSt.formGroup}>
                                <Text style={[vSt.label, { color: colors.text }]}>{form.schedule_type === 'recurring' ? 'Starting Date *' : 'Scheduled Date *'}</Text>
                                {Platform.OS === 'web' ? (
                                    <input 
                                        type="date"
                                        value={form.scheduled_date}
                                        onChange={e => setForm({...form, scheduled_date: e.target.value})}
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            backgroundColor: colors.background,
                                            color: colors.text,
                                            border: `1px solid ${colors.border}`,
                                            borderRadius: '12px',
                                            outline: 'none',
                                            fontSize: '14px'
                                        }}
                                    />
                                ) : (
                                    <TextInput 
                                        style={[vSt.modalInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                                        placeholder="YYYY-MM-DD"
                                        placeholderTextColor={colors.textMuted}
                                        value={form.scheduled_date}
                                        onChangeText={t => setForm({...form, scheduled_date: t})}
                                    />
                                )}
                            </View>

                            <View style={vSt.formGroup}>
                                <Text style={[vSt.label, { color: colors.text }]}>Notes (Optional)</Text>
                                <TextInput 
                                    style={[vSt.modalInput, vSt.textArea, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                                    placeholder="Add any additional notes or instructions..."
                                    placeholderTextColor={colors.textMuted}
                                    multiline
                                    value={form.notes}
                                    onChangeText={t => setForm({...form, notes: t})}
                                />
                            </View>

                            <TouchableOpacity 
                                style={[vSt.submitBtn, { backgroundColor: colors.primary }]}
                                onPress={handleScheduleVisit}
                                disabled={saving}
                            >
                                {saving ? <ActivityIndicator color="#fff" /> : <Text style={vSt.submitBtnText}>Confirm Schedule</Text>}
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </AdminWebLayout>
    );
}

const vSt = StyleSheet.create({
    headerArea: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
    searchContainer: { flex: 1, marginRight: 24 },
    searchBox: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1, gap: 12 },
    searchInput: { flex: 1, fontSize: 14 },
    actionButtons: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    scheduleBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, gap: 8 },
    scheduleBtnText: { color: '#fff', fontWeight: '700' },
    filterBtn: { padding: 8 },
    tableCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
    tableHeader: { flexDirection: 'row', padding: 16, borderBottomWidth: 1 },
    colHeader: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
    tableRow: { flexDirection: 'row', padding: 16, borderBottomWidth: 1, alignItems: 'center' },
    avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#80808020', justifyContent: 'center', alignItems: 'center' },
    avatarImg: { width: '100%', height: '100%', borderRadius: 16 },
    avatarText: { fontSize: 12, fontWeight: '700' },
    rowMainText: { fontSize: 14, fontWeight: '700' },
    rowSubText: { fontSize: 12, marginTop: 2 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, gap: 6 },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusText: { fontSize: 10, fontWeight: '800' },
    emptyState: { padding: 60, alignItems: 'center' },
    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: 550, borderRadius: 24, maxHeight: '90%', overflow: 'hidden' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: '#80808020' },
    modalTitle: { fontSize: 18, fontWeight: '800' },
    formGroup: { marginBottom: 20 },
    label: { fontSize: 13, fontWeight: '700', marginBottom: 8 },
    selectWrapper: { borderWidth: 1, borderColor: '#80808030', borderRadius: 12, overflow: 'hidden' },
    modalInput: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 14 },
    textArea: { height: 100, textAlignVertical: 'top' },
    submitBtn: { padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
    submitBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
    typeOption: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        gap: 8
    },
    viewReportBtn: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center'
    },
    viewReportText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700'
    },
    dayBadge: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        marginBottom: 4
    }
});
