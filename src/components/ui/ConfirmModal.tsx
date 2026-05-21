
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';
import { DesignTokens, getColors } from '@/constants/designSystem';
import { useTheme } from '@/context/ThemeContext';
import { Button } from './Button';

type ModalVariant = 'warning' | 'danger' | 'info';

interface ModalButton {
    text: string;
    style?: 'default' | 'cancel' | 'destructive';
    onPress?: () => void;
}

interface ConfirmModalProps {
    visible: boolean;
    onClose: () => void;
    title: string;
    message: string;
    buttons?: ModalButton[];
    // Legacy props for backward compatibility
    onConfirm?: () => void;
    confirmLabel?: string;
    cancelLabel?: string;
    hideCancel?: boolean;
    variant?: ModalVariant;
    loading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    visible,
    onClose,
    title,
    message,
    buttons,
    // Legacy mapping
    onConfirm,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'info',
    loading = false,
    hideCancel = false,
}) => {
    const { theme } = useTheme();
    const colors = getColors(theme);

    const getVariantColor = () => {
        switch (variant) {
            case 'warning': return colors.warning;
            case 'danger': return colors.danger;
            case 'info':
            default: return colors.primary;
        }
    };

    const iconName = variant === 'danger' ? 'alert-circle' : variant === 'warning' ? 'warning' : 'information-circle';
    const accentColor = getVariantColor();

    const modalButtons: ModalButton[] = buttons && buttons.length > 0 ? buttons : [{ text: 'D\'accord', style: 'default' }];

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <TouchableWithoutFeedback onPress={onClose}>
                    <View style={styles.backdrop} />
                </TouchableWithoutFeedback>
                <View style={[styles.content, { backgroundColor: colors.surface }]}>
                    <View style={[styles.iconBox, { backgroundColor: `${accentColor}15` }]}>
                        <Ionicons name={iconName} size={32} color={accentColor} />
                    </View>

                    <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
                    <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>

                    <View style={styles.footer}>
                        {modalButtons.map((btn, index) => {
                            let btnVariant: any = 'primary';
                            if (btn.style === 'destructive') btnVariant = 'danger';
                            else if (btn.style === 'cancel') btnVariant = 'outline';
                            
                            return (
                                <Button
                                    key={index}
                                    title={btn.text}
                                    onPress={btn.onPress ?? onClose}
                                    variant={btnVariant}
                                    style={styles.button}
                                    centered
                                    size="md"
                                />
                            );
                        })}
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.75)',
    },
    content: {
        width: '100%',
        maxWidth: 340,
        borderRadius: 28,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 20,
    },
    iconBox: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    title: {
        ...DesignTokens.typography.h2,
        fontSize: 22,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 8,
    },
    message: {
        ...DesignTokens.typography.body,
        fontSize: 17,
        lineHeight: 26,
        fontWeight: '500',
        textAlign: 'center',
        marginBottom: 24,
    },
    footer: {
        width: '100%',
        gap: 12,
    },
    button: {
        width: '100%',
        height: 52,
        borderRadius: 16,
    },
});
