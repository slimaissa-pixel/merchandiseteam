import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Badge } from '@/components/ui/Badge';
import { BottomNav } from '@/components/ui/BottomNav';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Header } from '@/components/ui/Header';


// Role color mapping for badge display
const ROLE_COLOR: Record<string, { bg: string; text: string }> = {
  merchandiser: { bg: '#1d4ed820', text: '#60a5fa' },
  supervisor: { bg: '#7c3aed20', text: '#a78bfa' },
  admin: { bg: '#dc262620', text: '#f87171' },
  other: { bg: '#6b728020', text: '#9ca3af' },
};
import { getFullImageUrl } from '@/constants/api';
import { DesignTokens, getColors } from '@/constants/designSystem';
import { SUPERVISOR_NAV_ITEMS } from '@/constants/navigation';
import { useTheme } from '@/context/ThemeContext';
import { ComplaintService } from '@/services/complaint.service';

interface Complaint {
    id: number;
    type: string;
    description: string;
    photo_url?: string;
    status: 'open' | 'in_review' | 'resolved' | 'rejected';
    admin_response?: string;
    requester_name: string;
    requester_role?: string;
    created_at: string;
}

const COMPLAINT_TYPES = [
    { id: 'store_issue', label: 'Store Issue', icon: 'storefront-outline' },
    { id: 'equipment', label: 'Equipment', icon: 'hardware-chip-outline' },
    { id: 'route', label: 'Route', icon: 'map-outline' },
    { id: 'colleague', label: 'Colleague', icon: 'people-outline' },
    { id: 'other', label: 'Other', icon: 'chatbubble-ellipses-outline' },
];

export default function ComplaintsPage() {
    const router = useRouter();
    const { theme } = useTheme();
    const colors = getColors(theme);

    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('all');

    // new complaint modal
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedType, setSelectedType] = useState('store_issue');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadComplaints();
    }, []);

    const loadComplaints = async () => {
        try {
            if (!refreshing) setLoading(true);
            const res = await apiClient.get('/api/complaints/');
            setComplaints(res.data);
        } catch (error) {
            console.error('Failed to load complaints:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadComplaints();
    };

    const handleSubmit = async () => {
        if (!description.trim()) {
            Alert.alert('Error', 'Please provide a description');
            return;
        }
        setIsSubmitting(true);
        try {
            await ComplaintService.create({ type: selectedType, description });
            setModalVisible(false);
            setDescription('');
            setSelectedType('store_issue');
            loadComplaints();
            Alert.alert('Success', 'Complaint submitted successfully. An admin will review it soon.');
        } catch (error) {
            Alert.alert('Error', 'Failed to submit complaint');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'open': return colors.warning;
            case 'in_review': return colors.primary;
            case 'resolved': return colors.success;
            case 'rejected': return colors.danger;
            default: return colors.textMuted;
        }
    };

    const filteredComplaints = complaints.filter(c => {
        if (filter === 'all') return true;
        if (filter === 'resolved') return c.status === 'resolved' || c.status === 'rejected';
        return c.status === 'open' || c.status === 'in_review';
    });

    const FilterTab = ({ label, value }: { label: string, value: 'all' | 'open' | 'resolved' }) => (
        <TouchableOpacity
            style={[styles.filterTab, filter === value && { backgroundColor: colors.primary }]}
            onPress={() => setFilter(value)}
        >
            <Text style={[styles.filterText, { color: filter === value ? '#fff' : colors.textSecondary }]}>
                {label}
            </Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <Header 
                title="Issues & Reports" 
                showBack 
                onBack={() => router.push('/supervisor/dashboard')} 
                rightIcon="add-circle-outline"
                onRightIconPress={() => setModalVisible(true)}
            />

            <View style={styles.filterContainer}>
                <FilterTab label="All" value="all" />
                <FilterTab label="Open" value="open" />
                <FilterTab label="Resolved" value="resolved" />
            </View>

            <ScrollView
                contentContainerStyle={styles.scroll}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
            >
                {loading ? (
                    <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
                ) : filteredComplaints.length > 0 ? (
                    filteredComplaints.map(complaint => (
                        <Card key={complaint.id} style={styles.card}>
                            <View style={styles.cardHeader}>
                                <View>
                                    <Text style={[styles.type, { color: colors.text }]}>{complaint.type.toUpperCase()}</Text>
                                    <Text style={[styles.date, { color: colors.textSecondary }]}>
                                        {new Date(complaint.created_at).toLocaleString()}
                                    </Text>
                                </View>
                                <Badge 
                                    label={complaint.status.replace('_', ' ').toUpperCase()} 
                                    variant={complaint.status === 'open' ? 'warning' : complaint.status === 'resolved' ? 'success' : 'danger'} 
                                />
                            </View>

                            <View style={[styles.divider, { backgroundColor: colors.border + '40' }]} />

                            <Text style={[styles.description, { color: colors.text }]} numberOfLines={3}>
                                {complaint.description}
                            </Text>

                            {complaint.photo_url && (
                                <Image 
                                    source={{ uri: getFullImageUrl(complaint.photo_url) || '' }} 
                                    style={styles.image} 
                                    resizeMode="cover"
                                />
                            )}

                            <View style={[styles.divider, { backgroundColor: colors.border + '40' }]} />

                            <View style={styles.footer}>
  <View style={styles.reporterInfo}>
    <Ionicons name="person-circle-outline" size={16} color={colors.textSecondary} />
    <Text style={[styles.reporterName, { color: colors.textSecondary }]}>
      {complaint.requester_name}
    </Text>
    {/* Role badge */}
    <View style={{
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
      backgroundColor: ROLE_COLOR[(complaint.requester_role?.toLowerCase() === 'livreur' ? 'supervisor' : (complaint.requester_role || 'merchandiser'))]?.bg || ROLE_COLOR.other.bg,
      marginLeft: 8,
    }}>
      <Text style={{ fontSize: 10, fontWeight: '700', color: ROLE_COLOR[(complaint.requester_role?.toLowerCase() === 'livreur' ? 'supervisor' : (complaint.requester_role || 'merchandiser'))]?.text || ROLE_COLOR.other.text }}>
        {(complaint.requester_role?.toLowerCase() === 'livreur' ? 'SUPERVISOR' : (complaint.requester_role?.toUpperCase() || 'MERCHANDISER'))}
      </Text>
    </View>
  </View>
  <TouchableOpacity style={styles.actionBtn}>
    <Text style={[styles.actionText, { color: colors.primary }]}>Review</Text>
    <Ionicons name="chevron-forward" size={16} color={colors.primary} />
  </TouchableOpacity>
</View>
                        </Card>
                    ))
                ) : (
                    <View style={styles.empty}>
                        <Ionicons name="checkmark-circle-outline" size={64} color={colors.textMuted} />
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No issues reported.</Text>
                    </View>
                )}
            </ScrollView>

            {/* Create Modal */}
            <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalVisible(false)}>
                <SafeAreaView style={[styles.modal, { backgroundColor: colors.background }]}>
                    <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>New Complaint</Text>
                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>Issue Type</Text>
                        <View style={styles.typeGrid}>
                            {COMPLAINT_TYPES.map(type => (
                                <TouchableOpacity
                                    key={type.id}
                                    style={[styles.typeBtn, {
                                        backgroundColor: selectedType === type.id ? colors.primary : colors.surface,
                                        borderColor: selectedType === type.id ? colors.primary : colors.border
                                    }]}
                                    onPress={() => setSelectedType(type.id)}
                                >
                                    <Ionicons name={type.icon as any} size={18} color={selectedType === type.id ? '#fff' : colors.textSecondary} />
                                    <Text style={[styles.typeBtnText, { color: selectedType === type.id ? '#fff' : colors.text }]}>{type.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={[styles.label, { color: colors.textSecondary, marginTop: 16 }]}>Description</Text>
                        <View style={[styles.inputWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <TextInput
                                style={[styles.textArea, { color: colors.text }]}
                                placeholder="Describe the issue in detail..."
                                placeholderTextColor={colors.textMuted}
                                value={description}
                                onChangeText={setDescription}
                                multiline
                                numberOfLines={6}
                                textAlignVertical="top"
                            />
                        </View>

                        <Button
                            title={isSubmitting ? 'Submitting...' : 'Submit Complaint'}
                            onPress={handleSubmit}
                            size="lg"
                            icon="send-outline"
                            style={{ marginTop: 24 }}
                            disabled={isSubmitting}
                        />
                    </ScrollView>
                </SafeAreaView>
            </Modal>

            <BottomNav items={SUPERVISOR_NAV_ITEMS} activeRoute="/supervisor/dashboard" />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { padding: 16, gap: 16, paddingBottom: 100 },
    filterContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingBottom: 16,
        gap: 8,
    },
    filterTab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#E5E7EB',
    },
    filterText: {
        fontSize: 13,
        fontWeight: '700',
    },
    card: {
        padding: 16,
        borderRadius: 16,
        ...DesignTokens.shadows.md,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    type: {
        fontSize: 14,
        fontWeight: '800',
        marginBottom: 4,
    },
    date: {
        fontSize: 11,
        fontWeight: '600',
    },
    divider: {
        height: 1,
        marginVertical: 12,
    },
    description: {
        fontSize: 14,
        lineHeight: 20,
    },
    image: {
        width: '100%',
        height: 150,
        borderRadius: 8,
        marginTop: 12,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    reporterInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    reporterName: {
        fontSize: 12,
        fontWeight: '600',
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionText: {
        fontSize: 13,
        fontWeight: '700',
        marginRight: 2,
    },
    empty: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 40,
    },
    emptyText: {
        marginTop: 12,
        fontSize: 15,
        fontWeight: '600',
    },
    // Modal
    modal: { flex: 1 },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1 },
    modalTitle: { ...DesignTokens.typography.h2 },
    modalBody: { padding: DesignTokens.spacing.lg },
    label: { ...DesignTokens.typography.caption, fontWeight: '700', marginBottom: 8 },
    typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    typeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
    typeBtnText: { ...DesignTokens.typography.caption, fontWeight: '600' },
    inputWrap: { borderRadius: 12, borderWidth: 1, padding: 12 },
    textArea: { fontSize: 14, minHeight: 120 },
});
