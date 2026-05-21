/**
 * mobileModals.tsx
 * ─────────────────────────────────────────────────────────────
 * Centralised, premium-quality modal UI primitives for the
 * mobile app (iOS & Android).  Import from here instead of
 * re-implementing inline modals in every screen.
 *
 * Exports:
 *  • BottomSheet          – slide-up sheet container
 *  • SheetHeader          – drag-handle + title + close button
 *  • SheetInput           – styled TextInput with label
 *  • SheetTextArea        – multiline SheetInput
 *  • SheetRolePicker      – segmented role-selector row
 *  • SheetFooter          – cancel + confirm button row
 *  • RequestUserModal     – full "request new user" bottom sheet
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { getColors } from './designSystem';
import { Fonts } from '@/hooks/useFonts';

// ─── Theme helper ─────────────────────────────────────────────
type Colors = ReturnType<typeof getColors>;

// ─── BottomSheet ──────────────────────────────────────────────
interface BottomSheetProps {
    visible: boolean;
    onClose: () => void;
    colors: Colors;
    children: React.ReactNode;
    /** Max height as a percentage string, default '90%' */
    maxHeight?: string;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
    visible,
    onClose,
    colors,
    children,
    maxHeight = '92%',
}) => (
    <Modal
        visible={visible}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={onClose}
    >
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={sheetStyles.overlay}
        >
            <TouchableOpacity style={sheetStyles.backdrop} activeOpacity={1} onPress={onClose} />
            <View
                style={[
                    sheetStyles.sheet,
                    { backgroundColor: colors.surface, maxHeight: maxHeight as any },
                ]}
            >
                {/* Drag handle */}
                <View style={[sheetStyles.handle, { backgroundColor: colors.border }]} />
                {children}
            </View>
        </KeyboardAvoidingView>
    </Modal>
);

// ─── SheetHeader ──────────────────────────────────────────────
interface SheetHeaderProps {
    title: string;
    subtitle?: string;
    onClose: () => void;
    colors: Colors;
}

export const SheetHeader: React.FC<SheetHeaderProps> = ({ title, subtitle, onClose, colors }) => (
    <View style={sheetStyles.header}>
        <View style={{ flex: 1 }}>
            <Text style={[sheetStyles.title, { color: colors.text }]}>{title}</Text>
            {subtitle ? (
                <Text style={[sheetStyles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
            ) : null}
        </View>
        <TouchableOpacity onPress={onClose} style={[sheetStyles.closeBtn, { backgroundColor: colors.surfaceSecondary }]}>
            <Ionicons name="close" size={18} color={colors.textMuted} />
        </TouchableOpacity>
    </View>
);

// ─── SheetInput ───────────────────────────────────────────────
interface SheetInputProps {
    label: string;
    required?: boolean;
    value: string;
    onChangeText: (t: string) => void;
    placeholder?: string;
    keyboardType?: 'default' | 'email-address' | 'phone-pad';
    autoCapitalize?: 'none' | 'sentences' | 'words';
    colors: Colors;
}

export const SheetInput: React.FC<SheetInputProps> = ({
    label, required, value, onChangeText, placeholder,
    keyboardType = 'default', autoCapitalize = 'sentences', colors,
}) => (
    <View style={sheetStyles.fieldWrap}>
        <Text style={[sheetStyles.label, { color: colors.textSecondary }]}>
            {label}{required && <Text style={{ color: colors.danger }}> *</Text>}
        </Text>
        <TextInput
            style={[sheetStyles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={colors.textMuted}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
        />
    </View>
);

// ─── SheetTextArea ────────────────────────────────────────────
export const SheetTextArea: React.FC<SheetInputProps> = (props) => (
    <View style={sheetStyles.fieldWrap}>
        <Text style={[sheetStyles.label, { color: props.colors.textSecondary }]}>
            {props.label}
        </Text>
        <TextInput
            style={[sheetStyles.input, sheetStyles.textArea, { backgroundColor: props.colors.background, color: props.colors.text, borderColor: props.colors.border }]}
            value={props.value}
            onChangeText={props.onChangeText}
            placeholder={props.placeholder}
            placeholderTextColor={props.colors.textMuted}
            multiline
            textAlignVertical="top"
            numberOfLines={4}
        />
    </View>
);

// ─── SheetRolePicker ──────────────────────────────────────────
interface RoleOption { label: string; value: string; }

interface SheetRolePickerProps {
    label?: string;
    options: RoleOption[];
    selected: string;
    onSelect: (v: string) => void;
    colors: Colors;
}

export const SheetRolePicker: React.FC<SheetRolePickerProps> = ({
    label = 'Role', options, selected, onSelect, colors,
}) => (
    <View style={sheetStyles.fieldWrap}>
        <Text style={[sheetStyles.label, { color: colors.textSecondary }]}>{label}</Text>
        <View style={sheetStyles.roleRow}>
            {options.map((opt) => {
                const active = selected === opt.value;
                return (
                    <TouchableOpacity
                        key={opt.value}
                        onPress={() => onSelect(opt.value)}
                        style={[
                            sheetStyles.roleChip,
                            {
                                flex: 1,
                                backgroundColor: active ? colors.primary : colors.background,
                                borderColor: active ? colors.primary : colors.border,
                            },
                        ]}
                    >
                        <Text style={[sheetStyles.roleChipText, { color: active ? '#fff' : colors.textSecondary }]}>
                            {opt.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    </View>
);

// ─── SheetFooter ──────────────────────────────────────────────
interface SheetFooterProps {
    onCancel: () => void;
    onConfirm: () => void;
    confirmLabel?: string;
    confirmLoading?: boolean;
    colors: Colors;
}

export const SheetFooter: React.FC<SheetFooterProps> = ({
    onCancel, onConfirm, confirmLabel = 'Confirm', colors,
}) => (
    <View style={[sheetStyles.footer, { borderTopColor: colors.border }]}>
        <TouchableOpacity
            onPress={onCancel}
            style={[sheetStyles.footerBtn, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
        >
            <Text style={[sheetStyles.footerBtnText, { color: colors.textSecondary }]}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
            onPress={onConfirm}
            style={[sheetStyles.footerBtn, sheetStyles.footerBtnPrimary, { backgroundColor: colors.primary }]}
        >
            <Text style={[sheetStyles.footerBtnText, { color: '#fff' }]}>{confirmLabel}</Text>
        </TouchableOpacity>
    </View>
);

// ─── RequestUserModal ─────────────────────────────────────────
export interface RequestUserFormData {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: string;
    assignedGms: string;
    notes: string;
}

interface RequestUserModalProps {
    visible: boolean;
    onClose: () => void;
    formData: RequestUserFormData;
    onChange: (data: RequestUserFormData) => void;
    onSubmit: () => void;
    colors: Colors;
}

export const RequestUserModal: React.FC<RequestUserModalProps> = ({
    visible, onClose, formData, onChange, onSubmit, colors,
}) => {
    const set = (key: keyof RequestUserFormData) => (val: string) =>
        onChange({ ...formData, [key]: val });

    return (
        <BottomSheet visible={visible} onClose={onClose} colors={colors}>
            <SheetHeader
                title="Request New User"
                subtitle="Admin will review and approve this request."
                onClose={onClose}
                colors={colors}
            />

            <ScrollView
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 8 }}
            >
                {/* Role picker */}
                <SheetRolePicker
                    options={[
                        { label: 'Merchandiser', value: 'merchandiser' },
                        { label: 'Supervisor', value: 'supervisor' },
                    ]}
                    selected={formData.role}
                    onSelect={set('role')}
                    colors={colors}
                />

                {/* Name row */}
                <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ flex: 1 }}>
                        <SheetInput
                            label="First Name" required
                            value={formData.firstName} onChangeText={set('firstName')}
                            placeholder="John" colors={colors}
                        />
                    </View>
                    <View style={{ flex: 1 }}>
                        <SheetInput
                            label="Last Name" required
                            value={formData.lastName} onChangeText={set('lastName')}
                            placeholder="Doe" colors={colors}
                        />
                    </View>
                </View>

                <SheetInput
                    label="Email" required
                    value={formData.email} onChangeText={set('email')}
                    placeholder="john@company.com"
                    keyboardType="email-address" autoCapitalize="none"
                    colors={colors}
                />

                <SheetInput
                    label="Phone"
                    value={formData.phone} onChangeText={set('phone')}
                    placeholder="+213 6xx xxx xxx"
                    keyboardType="phone-pad"
                    colors={colors}
                />

                <SheetInput
                    label="Assigned Store (optional)"
                    value={formData.assignedGms} onChangeText={set('assignedGms')}
                    placeholder="Store name or ID"
                    colors={colors}
                />

                <SheetTextArea
                    label="Notes"
                    value={formData.notes} onChangeText={set('notes')}
                    placeholder="Additional context for the admin..."
                    colors={colors}
                />
            </ScrollView>

            <SheetFooter
                onCancel={onClose}
                onConfirm={onSubmit}
                confirmLabel="Send Request"
                colors={colors}
            />
        </BottomSheet>
    );
};

// ─── Shared Styles ────────────────────────────────────────────
const sheetStyles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.55)',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    sheet: {
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingHorizontal: 20,
        paddingBottom: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.18,
        shadowRadius: 20,
        elevation: 20,
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 20,
        gap: 12,
    },
    title: {
        fontSize: 20,
        fontFamily: Fonts.headingXBold,
        lineHeight: 26,
    },
    subtitle: {
        fontSize: 13,
        fontFamily: Fonts.body,
        marginTop: 4,
        lineHeight: 18,
    },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    fieldWrap: {
        marginBottom: 16,
    },
    label: {
        fontSize: 12,
        fontFamily: Fonts.bodyBold,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 8,
    },
    input: {
        paddingHorizontal: 14,
        paddingVertical: 13,
        borderRadius: 12,
        borderWidth: 1,
        fontSize: 15,
        fontFamily: Fonts.body,
    },
    textArea: {
        height: 90,
        paddingTop: 12,
    },
    roleRow: {
        flexDirection: 'row',
        gap: 10,
    },
    roleChip: {
        paddingVertical: 11,
        borderRadius: 12,
        borderWidth: 1.5,
        alignItems: 'center',
    },
    roleChipText: {
        fontSize: 14,
        fontFamily: Fonts.bodyBold,
    },
    footer: {
        flexDirection: 'row',
        gap: 12,
        paddingTop: 16,
        borderTopWidth: 1,
        marginTop: 8,
    },
    footerBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center',
        borderWidth: 1,
    },
    footerBtnPrimary: {
        borderWidth: 0,
    },
    footerBtnText: {
        fontSize: 15,
        fontFamily: Fonts.bodyBold,
    },
});
