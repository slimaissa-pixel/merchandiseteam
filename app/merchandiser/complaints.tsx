import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert, FlatList, Modal, ScrollView, StyleSheet,
    Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Badge } from '@/components/ui/Badge';
import { BottomNav } from '@/components/ui/BottomNav';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Header } from '@/components/ui/Header';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { DesignTokens, getColors } from '@/constants/designSystem';
import { MERCHANDISER_NAV_ITEMS } from '@/constants/navigation';
import { useTheme } from '@/context/ThemeContext';
import { Complaint, ComplaintService } from '@/services/complaint.service';

const COMPLAINT_TYPES = [
    { id: 'store_issue', label: 'Store Issue', icon: 'storefront-outline' },
    { id: 'equipment', label: 'Equipment', icon: 'hardware-chip-outline' },
    { id: 'route', label: 'Route', icon: 'map-outline' },
    { id: 'colleague', label: 'Colleague', icon: 'people-outline' },
    { id: 'other', label: 'Other', icon: 'chatbubble-ellipses-outline' },
];

export default function MerchandiserComplaints() {
    const router = useRouter();
    const { theme } = useTheme();
    const colors = getColors(theme);

    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [loading, setLoading] = useState(true);

    // new complaint modal
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedType, setSelectedType] = useState('store_issue');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const load = async () => {
        setLoading(true);
        const data = await ComplaintService.getAll();
        setComplaints(data);
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const handleSubmit = async () => {
        if (!description.trim()) {
            Alert.alert('Error', 'Please provide a description');
            return;
        }
        setIsSubmitting(true);
        await ComplaintService.create({ type: selectedType, description });
        setIsSubmitting(false);
        setModalVisible(false);
        setDescription('');
        setSelectedType('store_issue');
        load();
        Alert.alert('Success', 'Complaint submitted successfully. An admin will review it soon.');
    };

    const statusVariant = (s: string): any => {
        if (s === 'resolved') return 'success';
        if (s === 'in_review') return 'warning';
        return 'neutral';
    };

    const renderItem = ({ item }: { item: Complaint }) => {
        const typeInfo = COMPLAINT_TYPES.find(t => t.id === item.type) || COMPLAINT_TYPES[4];

        return (
            <Card style={s.card}>
                <View style={s.cardHead}>
                    <View style={[s.iconBox, { backgroundColor: colors.primary + '18' }]}>
                        <Ionicons name={typeInfo.icon as any} size={20} color={colors.primary} />
                    </View>
                    <View style={s.cardInfo}>
                        <Text style={[s.type, { color: colors.text }]}>{typeInfo.label}</Text>
                        <Text style={[s.date, { color: colors.textSecondary }]}>
                            {new Date(item.created_at).toLocaleDateString('en-GB')}
                        </Text>
                    </View>
                    <Badge label={item.status.replace('_', ' ').toUpperCase()} variant={statusVariant(item.status)} size="sm" />
                </View>

                <View style={[s.descBox, { backgroundColor: colors.surfaceSecondary }]}>
                    <Text style={[s.desc, { color: colors.textSecondary }]}>{item.description}</Text>
                </View>

                {item.admin_response && (
                    <View style={[s.responseBox, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}>
                        <Ionicons name="chatbubble-ellipses" size={14} color={colors.primary} />
                        <View style={{ flex: 1 }}>
                            <Text style={[s.respLabel, { color: colors.primary }]}>Admin Response:</Text>
                            <Text style={[s.responseText, { color: colors.primary }]}>{item.admin_response}</Text>
                        </View>
                    </View>
                )}
            </Card>
        );
    };

    return (
        <SafeAreaView style={[s.container, { backgroundColor: colors.background }]}>
            <Header
                title="Complaints"
                subtitle="Report issues or feedback"
                rightIcon="add-circle-outline"
                onRightIconPress={() => setModalVisible(true)}
                showBack
            />

            <FlatList
                data={complaints}
                renderItem={renderItem}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={s.list}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={<SectionHeader title="My Submitted Complaints" actionLabel="Refresh" onAction={load} />}
                ListEmptyComponent={
                    <View style={s.empty}>
                        <Ionicons name="chatbubbles-outline" size={64} color={colors.textMuted} />
                        <Text style={{ color: colors.textSecondary, marginTop: 12, ...DesignTokens.typography.body }}>
                            {loading ? 'Loading…' : 'No complaints submitted yet'}
                        </Text>
                        {!loading && (
                            <Button title="Submit Feedback" onPress={() => setModalVisible(true)} style={{ marginTop: 20 }} />
                        )}
                    </View>
                }
            />

            {/* Create Modal */}
            <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalVisible(false)}>
                <SafeAreaView style={[s.modal, { backgroundColor: colors.background }]}>
                    <View style={[s.modalHeader, { borderBottomColor: colors.border }]}>
                        <Text style={[s.modalTitle, { color: colors.text }]}>New Complaint</Text>
                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={s.modalBody} showsVerticalScrollIndicator={false}>
                        <Text style={[s.label, { color: colors.textSecondary }]}>Issue Type</Text>
                        <View style={s.typeGrid}>
                            {COMPLAINT_TYPES.map(type => (
                                <TouchableOpacity
                                    key={type.id}
                                    style={[s.typeBtn, {
                                        backgroundColor: selectedType === type.id ? colors.primary : colors.surface,
                                        borderColor: selectedType === type.id ? colors.primary : colors.border
                                    }]}
                                    onPress={() => setSelectedType(type.id)}
                                >
                                    <Ionicons name={type.icon as any} size={18} color={selectedType === type.id ? '#fff' : colors.textSecondary} />
                                    <Text style={[s.typeBtnText, { color: selectedType === type.id ? '#fff' : colors.text }]}>{type.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={[s.label, { color: colors.textSecondary, marginTop: 16 }]}>Description</Text>
                        <View style={[s.inputWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <TextInput
                                style={[s.textArea, { color: colors.text }]}
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

            <BottomNav items={MERCHANDISER_NAV_ITEMS} activeRoute="/merchandiser/profile" />
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    container: { flex: 1 },
    list: { padding: DesignTokens.spacing.lg, paddingBottom: 100, gap: DesignTokens.spacing.md },
    card: { padding: DesignTokens.spacing.md, gap: DesignTokens.spacing.sm },
    cardHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    iconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    cardInfo: { flex: 1 },
    type: { ...DesignTokens.typography.bodyBold },
    date: { ...DesignTokens.typography.tiny, marginTop: 2 },
    descBox: { borderRadius: 10, padding: 12 },
    desc: { ...DesignTokens.typography.caption, lineHeight: 18 },
    responseBox: { flexDirection: 'row', gap: 8, padding: 12, borderRadius: 10, borderWidth: 1, alignItems: 'flex-start' },
    respLabel: { ...DesignTokens.typography.caption, fontWeight: '700', marginBottom: 2 },
    responseText: { ...DesignTokens.typography.caption, lineHeight: 18 },
    empty: { alignItems: 'center', paddingTop: 80 },

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
