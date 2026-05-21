import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { getColors } from '@/constants/designSystem';
import { useTheme } from '@/context/ThemeContext';
import { Fonts } from '@/hooks/useFonts';
import { UserService } from '@/services/user.service';

interface ChangePasswordModalProps {
    isVisible: boolean;
    onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
    isVisible,
    onClose,
}) => {
    const { theme } = useTheme();
    const colors = getColors(theme);

    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPasswords, setShowPasswords] = useState(false);

    const handleSave = async () => {
        if (!oldPassword || !newPassword || !confirmPassword) {
            Alert.alert('Error', 'Please fill all fields.');
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'New passwords do not match.');
            return;
        }

        if (newPassword.length < 6) {
            Alert.alert('Error', 'New password must be at least 6 characters.');
            return;
        }

        setIsSubmitting(true);
        try {
            await UserService.changePassword({
                old_password: oldPassword,
                new_password: newPassword,
            });
            Alert.alert('Success', 'Password changed successfully.');
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
            onClose();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to change password.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal visible={isVisible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={[styles.container, { backgroundColor: colors.surface }]}>
                    <View style={[styles.header, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.title, { color: colors.text }]}>Change Password</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Ionicons name="close" size={24} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        <View style={styles.form}>
                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: colors.textSecondary }]}>CURRENT PASSWORD</Text>
                                <View style={styles.passwordWrapper}>
                                    <TextInput
                                        style={[styles.input, { color: colors.text, borderColor: colors.border, fontFamily: Fonts.body }]}
                                        value={oldPassword}
                                        onChangeText={setOldPassword}
                                        placeholder="Enter current password"
                                        placeholderTextColor={colors.textMuted}
                                        secureTextEntry={!showPasswords}
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: colors.textSecondary }]}>NEW PASSWORD</Text>
                                <View style={styles.passwordWrapper}>
                                    <TextInput
                                        style={[styles.input, { color: colors.text, borderColor: colors.border, fontFamily: Fonts.body }]}
                                        value={newPassword}
                                        onChangeText={setNewPassword}
                                        placeholder="Enter new password"
                                        placeholderTextColor={colors.textMuted}
                                        secureTextEntry={!showPasswords}
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: colors.textSecondary }]}>CONFIRM NEW PASSWORD</Text>
                                <View style={styles.passwordWrapper}>
                                    <TextInput
                                        style={[styles.input, { color: colors.text, borderColor: colors.border, fontFamily: Fonts.body }]}
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                        placeholder="Re-type new password"
                                        placeholderTextColor={colors.textMuted}
                                        secureTextEntry={!showPasswords}
                                    />
                                </View>
                            </View>

                            <TouchableOpacity 
                                style={styles.toggleShow} 
                                onPress={() => setShowPasswords(!showPasswords)}
                            >
                                <Ionicons 
                                    name={showPasswords ? "eye-off-outline" : "eye-outline"} 
                                    size={18} 
                                    color={colors.primary} 
                                />
                                <Text style={[styles.toggleText, { color: colors.primary }]}>
                                    {showPasswords ? "Hide Passwords" : "Show Passwords"}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.actions}>
                            <TouchableOpacity
                                style={[styles.cancelBtn, { borderColor: colors.border }]}
                                onPress={onClose}
                                disabled={isSubmitting}
                            >
                                <Text style={[styles.cancelBtnText, { color: colors.text }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.saveBtn, { backgroundColor: colors.text, opacity: isSubmitting ? 0.7 : 1 }]}
                                onPress={handleSave}
                                disabled={isSubmitting}
                            >
                                <Text style={[styles.saveBtnText, { color: colors.surface }]}>
                                    {isSubmitting ? 'Updating...' : 'Update Password'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    container: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 32,
        overflow: 'hidden',
    },
    header: {
        paddingHorizontal: 24,
        paddingVertical: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
    },
    title: {
        fontSize: 18,
        fontFamily: Fonts.heading,
    },
    closeBtn: {
        padding: 4,
    },
    content: {
        padding: 24,
    },
    form: {
        gap: 16,
        marginBottom: 24,
    },
    inputGroup: {
        gap: 6,
    },
    label: {
        fontSize: 11,
        fontFamily: Fonts.secondaryBold,
        letterSpacing: 0.5,
    },
    passwordWrapper: {
        position: 'relative',
    },
    input: {
        padding: 14,
        borderWidth: 1,
        borderRadius: 12,
        fontSize: 15,
    },
    toggleShow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 4,
    },
    toggleText: {
        fontSize: 12,
        fontFamily: Fonts.cta,
        letterSpacing: 0.5,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
        marginBottom: 20,
    },
    cancelBtn: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        minWidth: 100,
        alignItems: 'center',
    },
    cancelBtnText: {
        fontSize: 16,
        fontFamily: Fonts.cta,
        letterSpacing: 1,
    },
    saveBtn: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        minWidth: 130,
        alignItems: 'center',
    },
    saveBtnText: {
        fontSize: 16,
        fontFamily: Fonts.cta,
        letterSpacing: 1,
    },
});
