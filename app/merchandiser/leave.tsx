import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
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
import { LeaveRequest, LeaveService } from '@/services/leave.service';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_SPACING = 12;
const SIDE_PADDING = 20;
const CARD_WIDTH = (SCREEN_WIDTH - (SIDE_PADDING * 2) - GRID_SPACING) / 2;

const leaveTypes = [
    { id: 'annual', label: 'Annual Leave', icon: 'sunny' },
    { id: 'sick', label: 'Sick Leave', icon: 'medical' },
    { id: 'personal', label: 'Personal Leave', icon: 'person' },
    { id: 'emergency', label: 'Emergency Leave', icon: 'warning' },
];

export default function LeavePage() {
    const router = useRouter();
    const { theme } = useTheme();
    const colors = getColors(theme);

    const [selectedType, setSelectedType] = useState('annual');
    const [startDate, setStartDate] = useState<string | null>(null);
    const [endDate, setEndDate] = useState<string | null>(null);
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadRequests = async () => {
        setIsLoading(true);
        const data = await LeaveService.getAll();
        setRequests(data);
        setIsLoading(false);
    };

    useEffect(() => {
        loadRequests();
    }, []);

    const onDayPress = (day: any) => {
        if (!startDate || startDate !== endDate) {
            setStartDate(day.dateString);
            setEndDate(day.dateString);
        } else {
            if (day.dateString < startDate) {
                setEndDate(startDate);
                setStartDate(day.dateString);
            } else {
                setEndDate(day.dateString);
            }
        }
    };

    const getMarkedDates = () => {
        let marked: any = {};
        if (startDate && startDate === endDate) {
            marked[startDate] = {
                startingDay: true,
                endingDay: true,
                color: colors.primary,
                textColor: '#fff',
            };
        } else if (startDate && endDate) {
            marked[startDate] = {
                startingDay: true,
                color: colors.primary,
                textColor: '#fff',
            };
            marked[endDate] = {
                endingDay: true,
                color: colors.primary,
                textColor: '#fff',
            };

            let start = new Date(startDate);
            let end = new Date(endDate);
            let curr = new Date(start);
            curr.setDate(curr.getDate() + 1);

            while (curr < end) {
                const dateStr = curr.toISOString().split('T')[0];
                marked[dateStr] = {
                    color: colors.primary + '30',
                    textColor: colors.text
                };
                curr.setDate(curr.getDate() + 1);
            }
        }
        return marked;
    };

    const handleSubmit = async () => {
        if (!startDate || !endDate || !reason) {
            Alert.alert('Error', 'Please select a date and provide a reason');
            return;
        }
        setIsSubmitting(true);
        const res = await LeaveService.create({
            leave_type: selectedType,
            start_date: startDate,
            end_date: endDate,
            reason: reason,
        });
        setIsSubmitting(false);

        if (res) {
            const isSingleDay = startDate === endDate;
            const message = isSingleDay
                ? `Your 1-day leave request for ${startDate} has been sent for approval.`
                : `Your leave request from ${startDate} to ${endDate} has been sent for approval.`;
                
            Alert.alert(
                'Request Submitted',
                message,
                [{ text: 'OK', onPress: () => {
                    setStartDate(null);
                    setEndDate(null);
                    setReason('');
                    loadRequests();
                } }]
            );
        } else {
            Alert.alert('Error', 'Failed to submit leave request. Please try again.');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return 'success';
            case 'rejected': return 'danger';
            default: return 'warning';
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <Header title="Leave Request" subtitle="Apply for time off" showBack />

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <SectionHeader title="Leave Type" compact />
                <View style={styles.typeGrid}>
                    {leaveTypes.map(type => {
                        const isActive = selectedType === type.id;
                        return (
                            <TouchableOpacity
                                key={type.id}
                                onPress={() => setSelectedType(type.id)}
                                style={[
                                    styles.typeCard,
                                    { 
                                        backgroundColor: colors.surface, 
                                        borderColor: isActive ? colors.primary : colors.border,
                                        width: CARD_WIDTH
                                    },
                                    isActive && { backgroundColor: colors.primary + '08' }
                                ]}
                            >
                                <View style={[
                                    styles.typeIcon,
                                    { backgroundColor: isActive ? colors.primary + '15' : colors.surfaceSecondary + '50' }
                                ]}>
                                    <Ionicons
                                        name={type.icon as any}
                                        size={18}
                                        color={isActive ? colors.primary : colors.textSecondary}
                                    />
                                </View>
                                <Text 
                                    style={[
                                        styles.typeLabel,
                                        { color: isActive ? colors.primary : colors.text }
                                    ]} 
                                    numberOfLines={1}
                                    adjustsFontSizeToFit
                                    minimumFontScale={0.8}
                                >
                                    {type.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <SectionHeader title="Select Dates" compact />
                <Card style={styles.calendarCard}>
                    <Calendar
                        minDate={new Date().toISOString().split('T')[0]}
                        markingType="period"
                        markedDates={getMarkedDates()}
                        onDayPress={onDayPress}
                        theme={{
                            calendarBackground: colors.surface,
                            textSectionTitleColor: colors.textSecondary,
                            dayTextColor: colors.text,
                            todayTextColor: colors.primary,
                            selectedDayBackgroundColor: colors.primary,
                            selectedDayTextColor: '#fff',
                            monthTextColor: colors.text,
                            indicatorColor: colors.primary,
                            textDisabledColor: colors.textSecondary + '50',
                            arrowColor: colors.primary,
                        }}
                    />
                </Card>

                <SectionHeader title="Reason" compact />
                <Card style={styles.inputCard}>
                    <TextInput
                        style={[styles.input, { color: colors.text }]}
                        placeholder="Why do you need this leave?"
                        placeholderTextColor={colors.textMuted}
                        multiline
                        numberOfLines={4}
                        value={reason}
                        onChangeText={setReason}
                    />
                </Card>

                <View style={styles.footer}>
                    <Button
                        title={isSubmitting ? "Submitting..." : "Submit Request"}
                        onPress={handleSubmit}
                        disabled={isSubmitting}
                    />
                </View>

                <SectionHeader title="My Requests" compact />
                <View style={styles.requestList}>
                    {isLoading ? (
                        <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
                    ) : requests.length > 0 ? (
                        requests.map((req) => (
                            <Card key={req.id} style={styles.reqCard}>
                                <View style={styles.reqHeader}>
                                    <View style={styles.reqTypeInfo}>
                                        <Text style={[styles.reqTypeText, { color: colors.text }]}>
                                            {leaveTypes.find(t => t.id === req.leave_type)?.label || req.leave_type}
                                        </Text>
                                        <Text style={[styles.reqDates, { color: colors.textSecondary }]}>
                                            {req.start_date === req.end_date ? `${req.start_date} (1 Day)` : `${req.start_date} → ${req.end_date}`}
                                        </Text>
                                    </View>
                                    <Badge 
                                        label={req.status.toUpperCase()} 
                                        variant={getStatusColor(req.status)}
                                    />
                                </View>
                                {req.reason && (
                                    <Text style={[styles.reqReason, { color: colors.textMuted }]} numberOfLines={1}>
                                        "{req.reason}"
                                    </Text>
                                )}
                                {req.admin_comment && (
                                    <View style={[styles.commentBox, { backgroundColor: colors.surfaceSecondary + '50' }]}>
                                        <Text style={[styles.commentText, { color: colors.textSecondary }]}><Text style={{ fontWeight: '800' }}>Admin:</Text> {req.admin_comment}</Text>
                                    </View>
                                )}
                            </Card>
                        ))
                    ) : (
                        <Text style={[styles.emptyText, { color: colors.textMuted }]}>No previous requests found.</Text>
                    )}
                </View>
            </ScrollView>

            <BottomNav items={MERCHANDISER_NAV_ITEMS} activeRoute="/merchandiser/leave" />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { paddingBottom: 120 },
    typeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: GRID_SPACING,
        paddingHorizontal: SIDE_PADDING,
        marginBottom: 8,
    },
    typeCard: {
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        borderRadius: 14,
        borderWidth: 1.5,
    },
    typeIcon: {
        width: 34,
        height: 34,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    typeLabel: {
        fontSize: 14,
        fontWeight: '800',
        flex: 1,
    },
    calendarCard: {
        marginHorizontal: DesignTokens.spacing.lg,
        padding: 8,
    },
    inputCard: {
        marginHorizontal: DesignTokens.spacing.lg,
        padding: DesignTokens.spacing.md,
    },
    input: {
        ...DesignTokens.typography.body,
        textAlignVertical: 'top',
        minHeight: 100,
    },
    footer: {
        padding: DesignTokens.spacing.lg,
    },
    requestList: {
        paddingHorizontal: DesignTokens.spacing.lg,
        gap: DesignTokens.spacing.sm,
    },
    reqCard: {
        padding: 12,
        borderRadius: 16,
    },
    reqHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 6,
    },
    reqTypeInfo: {
        flex: 1,
        gap: 2,
    },
    reqTypeText: {
        fontSize: 14,
        fontWeight: '800',
    },
    reqDates: {
        fontSize: 11,
        fontWeight: '600',
    },
    reqReason: {
        fontSize: 11,
        fontStyle: 'italic',
        marginTop: 2,
    },
    commentBox: {
        marginTop: 8,
        padding: 8,
        borderRadius: 10,
    },
    commentText: {
        fontSize: 11,
        lineHeight: 16,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 20,
        ...DesignTokens.typography.caption,
    },
});
