import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomNav } from '@/components/ui/BottomNav';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Header } from '@/components/ui/Header';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { DesignTokens, getColors } from '@/constants/designSystem';
import { SUPERVISOR_NAV_ITEMS } from '@/constants/navigation';
import { useTheme } from '@/context/ThemeContext';
import { LeaveService } from '@/services/leave.service';

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
                [{ text: 'OK', onPress: () => router.back() }]
            );
        } else {
            Alert.alert('Error', 'Failed to submit leave request. Please try again.');
        }
    };

    const handleCancel = () => {
        Alert.alert(
            'Cancel Request',
            'Are you sure you want to cancel this request?',
            [
                { text: 'No', style: 'cancel' },
                { text: 'Yes', onPress: () => router.back() }
            ]
        );
    };

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
            <Header title="Leave Request" subtitle="Apply for time off" showBack />

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Leave Type Section */}
                <SectionHeader title="Leave Type" />
                <View style={styles.typeGrid}>
                    {leaveTypes.map(type => (
                        <Card
                            key={type.id}
                            style={[
                                styles.typeCard,
                                selectedType === type.id && { borderColor: colors.primary, backgroundColor: colors.primary + '08' }
                            ]}
                            onPress={() => setSelectedType(type.id)}
                        >
                            <View style={[
                                styles.typeIcon,
                                { backgroundColor: selectedType === type.id ? colors.primary + '20' : colors.surfaceSecondary }
                            ]}>
                                <Ionicons
                                    name={type.icon as any}
                                    size={20}
                                    color={selectedType === type.id ? colors.primary : colors.textMuted}
                                />
                            </View>
                            <Text style={[
                                styles.typeLabel,
                                { color: selectedType === type.id ? colors.primary : colors.text }
                            ]}>
                                {type.label}
                            </Text>
                        </Card>
                    ))}
                </View>

                {/* Date Selection Section */}
                <SectionHeader title="Select Date Range" />
                <Card style={[styles.calendarCard, { marginTop: 8, marginBottom: 16 }]}>
                    <Calendar
                        minDate={new Date().toISOString().split('T')[0]}
                        markingType={'period'}
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

                <View style={[styles.rangeInfo, { backgroundColor: colors.surfaceSecondary }]}>
                    <View style={styles.dateDisplay}>
                        <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>FROM</Text>
                        <Text style={[styles.dateValue, { color: colors.text }]}>{startDate || '--/--/----'}</Text>
                    </View>
                    <View style={styles.rangeArrow}>
                        <Feather name="arrow-right" size={20} color={colors.primary} />
                    </View>
                    <View style={styles.dateDisplay}>
                        <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>TO</Text>
                        <Text style={[styles.dateValue, { color: colors.text }]}>{endDate || '--/--/----'}</Text>
                    </View>
                </View>

                {/* Reason Section */}
                <SectionHeader title="Reason" />
                <View style={[styles.textAreaContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <TextInput
                        style={[styles.textArea, { color: colors.text }]}
                        placeholder="Please describe your reason for leave..."
                        placeholderTextColor={colors.textSecondary}
                        value={reason}
                        onChangeText={setReason}
                        multiline
                        numberOfLines={5}
                        textAlignVertical="top"
                    />
                </View>
                <Text style={[styles.charCount, { color: colors.textSecondary }]}>
                    {reason.length}/500 characters
                </Text>

                {/* Info Card */}
                <View style={[styles.infoCard, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '40' }]}>
                    <Ionicons name="information-circle" size={20} color={colors.primary} />
                    <Text style={[styles.infoText, { color: colors.primary }]}>
                        Your request will be reviewed by the admin. You will receive a notification once it&apos;s approved or rejected.
                    </Text>
                </View>

                {/* Action Buttons */}
                <View style={styles.buttonRow}>
                    <Button
                        title="Cancel"
                        variant="ghost"
                        onPress={handleCancel}
                        style={{ flex: 1 }}
                        icon="close-outline"
                        disabled={isSubmitting}
                    />
                    <Button
                        title={isSubmitting ? "Submitting..." : "Submit"}
                        onPress={handleSubmit}
                        style={{ flex: 1.5 }}
                        icon="send-outline"
                        disabled={isSubmitting}
                    />
                </View>

                <BottomNav items={SUPERVISOR_NAV_ITEMS} activeRoute="/supervisor/leave" />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    content: { padding: 16, paddingBottom: 100, gap: 20 },
    typeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        rowGap: 16,
    },
    typeCard: {
        width: '48%',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
        paddingHorizontal: 8,
        gap: 12,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    typeIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    typeLabel: { 
        ...DesignTokens.typography.bodyBold, 
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20
    },
    calendarCard: {
        padding: 8,
    },
    rangeInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 16,
    },
    dateDisplay: {
        flex: 1,
        alignItems: 'center',
    },
    dateLabel: {
        ...DesignTokens.typography.tiny,
        marginBottom: 4,
    },
    dateValue: {
        ...DesignTokens.typography.bodyBold,
        fontSize: 14,
    },
    rangeArrow: {
        paddingHorizontal: 12,
    },
    textAreaContainer: {
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        minHeight: 120,
    },
    textArea: { fontSize: 14, lineHeight: 22 },
    charCount: { ...DesignTokens.typography.caption, textAlign: 'right', marginTop: 4 },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        gap: 10,
    },
    infoText: { flex: 1, fontSize: 13, lineHeight: 20 },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
});
