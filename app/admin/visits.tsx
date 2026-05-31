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
import { VisitCalendar } from '@/components/admin/VisitCalendar';
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
    const [statusFilter, setStatusFilter] = useState('all');
    
    // Selection & Bulk
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    // Dropdown
    const [openMenuId, setOpenMenuId] = useState<number | null>(null);

    // Modals
    const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<Assignment | null>(null);
    const [deleteMode, setDeleteMode] = useState<'single' | 'future' | 'all'>('single');
    
    const [detailsModalVisible, setDetailsModalVisible] = useState(false);
    const [selectedItem, setSelectedItem] = useState<Assignment | null>(null);
    const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
    
    // Create Modal State
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

    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editForm, setEditForm] = useState({
        id: 0,
        gms_id: '',
        user_id: '',
        scheduled_date: '',
        notes: ''
    });

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

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

    const filteredAssignments = assignments.filter(a => {
        const matchesSearch = a.user?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.user?.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.gms?.name?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const toggleSelection = (id: number) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} schedules?`)) return;
        const ok = await GMSService.bulkDeleteAssignments(selectedIds);
        if (ok) {
            showToast(`Deleted ${selectedIds.length} schedules`, 'success');
            setSelectedIds([]);
            loadData();
        } else {
            showToast('Failed to delete schedules', 'error');
        }
    };

    const handleDeleteClick = (item: Assignment) => {
        setItemToDelete(item);
        setDeleteMode('single');
        setDeleteConfirmVisible(true);
        setOpenMenuId(null);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;
        setSaving(true);
        const ok = await GMSService.deleteAssignment(itemToDelete.id, deleteMode);
        setSaving(false);
        if (ok) {
            showToast('Schedule deleted successfully', 'success');
            setDeleteConfirmVisible(false);
            setItemToDelete(null);
            loadData();
        } else {
            showToast('Failed to delete schedule', 'error');
        }
    };

    const handlePause = async (item: Assignment) => {
        setOpenMenuId(null);
        if (!window.confirm('Pause all future recurring visits for this schedule?')) return;
        const ok = await GMSService.pauseAssignment(item.id);
        if (ok) {
            showToast('Recurring schedule paused', 'success');
            loadData();
        } else {
            showToast('Failed to pause schedule', 'error');
        }
    };

    const handleResume = async (item: Assignment) => {
        setOpenMenuId(null);
        const ok = await GMSService.resumeAssignment(item.id);
        if (ok) {
            showToast('Recurring schedule resumed', 'success');
            loadData();
        } else {
            showToast('Failed to resume schedule', 'error');
        }
    };

    const handleEditClick = (item: Assignment) => {
        setEditForm({
            id: item.id,
            gms_id: item.gms_id ? item.gms_id.toString() : '',
            user_id: item.user_id ? item.user_id.toString() : '',
            scheduled_date: item.scheduled_date ? item.scheduled_date.split('T')[0] : '',
            notes: item.notes || ''
        });
        setEditModalVisible(true);
        setOpenMenuId(null);
    };

    const handleUpdateVisit = async () => {
        if (!editForm.gms_id || !editForm.user_id || !editForm.scheduled_date) {
            showToast('Please fill in all required fields.', 'error');
            return;
        }
        setSaving(true);
        const ok = await GMSService.updateAssignment(editForm.id, {
            gms_id: parseInt(editForm.gms_id),
            user_id: parseInt(editForm.user_id),
            scheduled_date: new Date(editForm.scheduled_date).toISOString(),
            notes: editForm.notes
        });
        setSaving(false);
        if (ok) {
            showToast('Schedule updated successfully', 'success');
            setEditModalVisible(false);
            loadData();
        } else {
            showToast('Failed to update schedule', 'error');
        }
    };

    const handleViewDetails = (item: Assignment) => {
        setSelectedItem(item);
        setDetailsModalVisible(true);
        setOpenMenuId(null);
    };

    const isDark = theme === 'dark';

    return (
        <AdminWebLayout title="Visits Tracking">
            {/* Toast Notification */}
            {toast && (
                <View style={{
                    position: 'absolute', top: 40, right: 40, zIndex: 9999,
                    backgroundColor: toast.type === 'success' ? colors.success : colors.danger,
                    paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8,
                    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5
                }}>
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>{toast.message}</Text>
                </View>
            )}

            {/* Header & Search Area */}
            <View style={vSt.headerArea}>
                {/* Search Box */}
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
                {/* Action Buttons */}
                <View style={vSt.actionButtons}>
                    {selectedIds.length > 0 && (
                        <TouchableOpacity style={[vSt.scheduleBtn, { backgroundColor: colors.danger }]}
                            onPress={handleBulkDelete}>
                            <Ionicons name="trash" size={20} color="#fff" />
                            <Text style={vSt.scheduleBtnText}>Delete ({selectedIds.length})</Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity style={[vSt.scheduleBtn, { backgroundColor: colors.primary }]}
                        onPress={() => setModalVisible(true)}>
                        <Ionicons name="add" size={20} color="#fff" />
                        <Text style={vSt.scheduleBtnText}>Schedule Visit</Text>
                    </TouchableOpacity>
                </View>
            </View>

<View style={{ marginTop: 24 }}>
  <VisitCalendar assignments={filteredAssignments} />
</View>

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

            {/* Delete Confirmation Modal */}
            <Modal visible={deleteConfirmVisible} transparent animationType="fade">
                <View style={vSt.modalOverlay}>
                    <View style={[vSt.modalContent, { backgroundColor: colors.surface, width: 400 }]}>
                        <View style={{ padding: 24 }}>
                            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.danger + '15', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                                <Ionicons name="warning" size={24} color={colors.danger} />
                            </View>
                            <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 8 }}>Delete Schedule</Text>
                            <Text style={{ color: colors.textMuted, fontSize: 14, marginBottom: 24 }}>
                                Are you sure you want to delete this scheduled visit?
                            </Text>

                            {itemToDelete?.rule_id && (
                                <View style={{ marginBottom: 24, gap: 12 }}>
                                    <TouchableOpacity 
                                        style={[vSt.typeOption, { borderColor: deleteMode === 'single' ? colors.primary : colors.border, backgroundColor: deleteMode === 'single' ? colors.primary + '10' : 'transparent' }]}
                                        onPress={() => setDeleteMode('single')}
                                    >
                                        <Ionicons name="calendar-outline" size={16} color={deleteMode === 'single' ? colors.primary : colors.textMuted} />
                                        <Text style={{ color: deleteMode === 'single' ? colors.primary : colors.text, fontWeight: '600' }}>Only this visit</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        style={[vSt.typeOption, { borderColor: deleteMode === 'future' ? colors.primary : colors.border, backgroundColor: deleteMode === 'future' ? colors.primary + '10' : 'transparent' }]}
                                        onPress={() => setDeleteMode('future')}
                                    >
                                        <Ionicons name="arrow-forward-outline" size={16} color={deleteMode === 'future' ? colors.primary : colors.textMuted} />
                                        <Text style={{ color: deleteMode === 'future' ? colors.primary : colors.text, fontWeight: '600' }}>This and future visits</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        style={[vSt.typeOption, { borderColor: deleteMode === 'all' ? colors.primary : colors.border, backgroundColor: deleteMode === 'all' ? colors.primary + '10' : 'transparent' }]}
                                        onPress={() => setDeleteMode('all')}
                                    >
                                        <Ionicons name="list-outline" size={16} color={deleteMode === 'all' ? colors.primary : colors.textMuted} />
                                        <Text style={{ color: deleteMode === 'all' ? colors.primary : colors.text, fontWeight: '600' }}>All recurring visits</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            <View style={{ flexDirection: 'row', gap: 12 }}>
                                <TouchableOpacity 
                                    style={{ flex: 1, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.border, alignItems: 'center' }}
                                    onPress={() => setDeleteConfirmVisible(false)}
                                >
                                    <Text style={{ color: colors.text, fontWeight: '600' }}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={{ flex: 1, padding: 12, borderRadius: 12, backgroundColor: colors.danger, alignItems: 'center' }}
                                    onPress={confirmDelete}
                                    disabled={saving}
                                >
                                    {saving ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '600' }}>Delete</Text>}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Visit Details Modal */}
            <Modal visible={detailsModalVisible} transparent animationType="fade">
                <View style={vSt.modalOverlay}>
                    <View style={[vSt.modalContent, { backgroundColor: colors.surface }]}>
                        <View style={vSt.modalHeader}>
                            <Text style={[vSt.modalTitle, { color: colors.text }]}>Schedule Details</Text>
                            <TouchableOpacity onPress={() => setDetailsModalVisible(false)}>
                                <Ionicons name="close" size={24} color={colors.textMuted} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={{ padding: 24 }}>
                            {selectedItem && (
                                <View style={{ gap: 24 }}>
                                    <View style={{ flexDirection: 'row', gap: 16 }}>
                                        <View style={{ flex: 1, backgroundColor: colors.background, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.border }}>
                                            <Text style={{ fontSize: 12, color: colors.textMuted, fontWeight: '700', marginBottom: 8 }}>MERCHANDISER</Text>
                                            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>{selectedItem.user?.first_name} {selectedItem.user?.last_name}</Text>
                                            <Text style={{ fontSize: 13, color: colors.textMuted }}>ID: #{selectedItem.user?.id}</Text>
                                        </View>
                                        <View style={{ flex: 1, backgroundColor: colors.background, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.border }}>
                                            <Text style={{ fontSize: 12, color: colors.textMuted, fontWeight: '700', marginBottom: 8 }}>STORE</Text>
                                            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>{selectedItem.gms?.name}</Text>
                                            <Text style={{ fontSize: 13, color: colors.textMuted }}>{selectedItem.gms?.address}</Text>
                                        </View>
                                    </View>

                                    <View style={{ backgroundColor: colors.background, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.border }}>
                                        <Text style={{ fontSize: 12, color: colors.textMuted, fontWeight: '700', marginBottom: 12 }}>VISIT INFORMATION</Text>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                                            <Text style={{ color: colors.textMuted }}>Planned Date:</Text>
                                            <Text style={{ color: colors.text, fontWeight: '600' }}>{selectedItem.scheduled_date ? format(new Date(selectedItem.scheduled_date), 'PPP') : 'N/A'}</Text>
                                        </View>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                                            <Text style={{ color: colors.textMuted }}>Check In:</Text>
                                            <Text style={{ color: colors.text, fontWeight: '600' }}>{selectedItem.check_in ? format(new Date(selectedItem.check_in), 'pp') : 'Not Checked In'}</Text>
                                        </View>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                                            <Text style={{ color: colors.textMuted }}>Check Out:</Text>
                                            <Text style={{ color: colors.text, fontWeight: '600' }}>{selectedItem.check_out ? format(new Date(selectedItem.check_out), 'pp') : 'Not Checked Out'}</Text>
                                        </View>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                                            <Text style={{ color: colors.textMuted }}>Duration:</Text>
                                            <Text style={{ color: colors.text, fontWeight: '600' }}>{selectedItem.duration_minutes || 0} minutes</Text>
                                        </View>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                            <Text style={{ color: colors.textMuted }}>Recurrence:</Text>
                                            <Text style={{ color: colors.text, fontWeight: '600' }}>{selectedItem.rule_id ? `Recurring Rule #${selectedItem.rule_id}` : 'Single Visit'}</Text>
                                        </View>
                                    </View>

                                    {selectedItem.status === 'completed' && (
                                        <TouchableOpacity 
                                            style={{ padding: 16, backgroundColor: colors.primary, borderRadius: 12, alignItems: 'center' }}
                                            onPress={() => {
                                                setDetailsModalVisible(false);
                                                router.push(`/admin/visit-report/${selectedItem.id}`);
                                            }}
                                        >
                                            <Text style={{ color: '#fff', fontWeight: '700' }}>Open Full Report</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Edit Schedule Modal */}
            <Modal visible={editModalVisible} transparent animationType="fade">
                <View style={vSt.modalOverlay}>
                    <View style={[vSt.modalContent, { backgroundColor: colors.surface }]}>
                        <View style={vSt.modalHeader}>
                            <Text style={[vSt.modalTitle, { color: colors.text }]}>Edit Schedule</Text>
                            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                                <Ionicons name="close" size={24} color={colors.textMuted} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={{ padding: 24 }}>
                            <View style={vSt.formGroup}>
                                <Text style={[vSt.label, { color: colors.text }]}>Stores *</Text>
                                <View style={vSt.selectWrapper}>
                                    <select 
                                        value={editForm.gms_id}
                                        onChange={e => setEditForm({...editForm, gms_id: (e.target as any).value})}
                                        style={{ width: '100%', padding: 12, backgroundColor: colors.background, color: colors.text, border: 'none', outline: 'none', fontSize: 14 }}
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
                                        value={editForm.user_id}
                                        onChange={e => setEditForm({...editForm, user_id: (e.target as any).value})}
                                        style={{ width: '100%', padding: 12, backgroundColor: colors.background, color: colors.text, border: 'none', outline: 'none', fontSize: 14 }}
                                    >
                                        <option value="">-- Select a merchandiser --</option>
                                        {merchandisers.map(m => <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>)}
                                    </select>
                                </View>
                            </View>

                            <View style={vSt.formGroup}>
                                <Text style={[vSt.label, { color: colors.text }]}>Scheduled Date *</Text>
                                {Platform.OS === 'web' ? (
                                    <input 
                                        type="date"
                                        value={editForm.scheduled_date}
                                        onChange={e => setEditForm({...editForm, scheduled_date: e.target.value})}
                                        style={{ width: '100%', padding: '12px', backgroundColor: colors.background, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: '12px', outline: 'none', fontSize: '14px' }}
                                    />
                                ) : (
                                    <TextInput 
                                        style={[vSt.modalInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                                        placeholder="YYYY-MM-DD"
                                        placeholderTextColor={colors.textMuted}
                                        value={editForm.scheduled_date}
                                        onChangeText={t => setEditForm({...editForm, scheduled_date: t})}
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
                                    value={editForm.notes}
                                    onChangeText={t => setEditForm({...editForm, notes: t})}
                                />
                            </View>

                            <TouchableOpacity 
                                style={[vSt.submitBtn, { backgroundColor: colors.primary }]}
                                onPress={handleUpdateVisit}
                                disabled={saving}
                            >
                                {saving ? <ActivityIndicator color="#fff" /> : <Text style={vSt.submitBtnText}>Update Schedule</Text>}
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
    autoPlanBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: '#3B82F6' },
    overrideBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: '#EF4444' },
    actionBtnText: { color: '#fff', fontWeight: '600' },
    scheduleBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, gap: 8 },
    scheduleBtnText: { color: '#fff', fontWeight: '700' },
    filterBtn: { padding: 8 },
    tableCard: { borderRadius: 16, borderWidth: 1, overflow: 'visible' },
    tableHeader: { flexDirection: 'row', padding: 16, borderBottomWidth: 1, zIndex: 2 },
    colHeader: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
    tableRow: { flexDirection: 'row', padding: 16, borderBottomWidth: 1, alignItems: 'center', position: 'relative' },
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
    },
    dropdownMenu: {
        position: 'absolute',
        top: 32,
        right: 0,
        width: 180,
        borderWidth: 1,
        borderRadius: 12,
        padding: 4,
        zIndex: 10,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        gap: 12,
        borderRadius: 8
    }
});
