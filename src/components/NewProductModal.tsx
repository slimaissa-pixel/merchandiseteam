import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
    Image,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { usePermissions } from '@/hooks/usePermissions';

interface NewProductModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    isDark: boolean;
}

export function NewProductModal({ visible, onClose, onSubmit, isDark }: NewProductModalProps) {
    const [name, setName] = useState('');
    const [notes, setNotes] = useState('');
    const [beforeImage, setBeforeImage] = useState<string | null>(null);
    const [afterImage, setAfterImage] = useState<string | null>(null);

    const { requestCameraPermission } = usePermissions();

    const bgColor = isDark ? '#1e293b' : '#ffffff';
    const textColor = isDark ? '#f8fafc' : '#0f172a';
    const subTextColor = isDark ? '#94a3b8' : '#64748b';
    const inputBg = isDark ? '#334155' : '#f1f5f9';
    const borderColor = isDark ? '#475569' : '#e2e8f0';

    const handleTakePhoto = async (type: 'before' | 'after') => {
        try {
            const hasPermission = await requestCameraPermission();
            if (!hasPermission) {
                alert('Camera permission is required to take photos.');
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.5,
            });

            if (!result.canceled) {
                if (type === 'before') setBeforeImage(result.assets[0].uri);
                else setAfterImage(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Camera error:', error);
            alert('Failed to open camera.');
        }
    };

    const handleSubmit = () => {
        if (!name.trim()) {
            alert('Please enter a product name.');
            return;
        }
        if (!beforeImage) {
            alert('Please take a "Before" photo.');
            return;
        }

        onSubmit({ name, notes, beforeImage, afterImage });
        resetForm();
    };

    const resetForm = () => {
        setName('');
        setNotes('');
        setBeforeImage(null);
        setAfterImage(null);
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={[styles.modalContent, { backgroundColor: bgColor, borderColor }]}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: textColor }]}>New Product Shipment</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={subTextColor} />
                        </TouchableOpacity>
                    </View>

                    <Text style={[styles.label, { color: subTextColor }]}>Product Name</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: inputBg, color: textColor, borderColor }]}
                        placeholder="Enter product name"
                        placeholderTextColor={subTextColor}
                        value={name}
                        onChangeText={setName}
                    />

                    <Text style={[styles.label, { color: subTextColor }]}>Notes</Text>
                    <TextInput
                        style={[styles.input, styles.textArea, { backgroundColor: inputBg, color: textColor, borderColor }]}
                        placeholder="Add details..."
                        placeholderTextColor={subTextColor}
                        value={notes}
                        onChangeText={setNotes}
                        multiline
                    />

                    <View style={styles.photoContainer}>
                        <TouchableOpacity
                            style={[styles.photoBox, { borderColor: beforeImage ? '#10b981' : borderColor }]}
                            onPress={() => handleTakePhoto('before')}
                        >
                            {beforeImage ? (
                                <Image source={{ uri: beforeImage }} style={styles.photo} />
                            ) : (
                                <>
                                    <Ionicons name="camera-outline" size={24} color={subTextColor} />
                                    <Text style={[styles.photoText, { color: subTextColor }]}>Before</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.photoBox, { borderColor: afterImage ? '#10b981' : borderColor }]}
                            onPress={() => handleTakePhoto('after')}
                        >
                            {afterImage ? (
                                <Image source={{ uri: afterImage }} style={styles.photo} />
                            ) : (
                                <>
                                    <Ionicons name="camera-outline" size={24} color={subTextColor} />
                                    <Text style={[styles.photoText, { color: subTextColor }]}>After</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
                        <Text style={styles.submitText}>Submit Report</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 16,
    },
    modalContent: {
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        elevation: 5,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 6,
    },
    input: {
        height: 44,
        borderRadius: 12,
        paddingHorizontal: 12,
        borderWidth: 1,
        marginBottom: 16,
    },
    textArea: {
        height: 80,
        paddingVertical: 12,
        textAlignVertical: 'top',
    },
    photoContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    photoBox: {
        flex: 1,
        height: 120,
        borderRadius: 12,
        borderWidth: 2,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    photo: {
        width: '100%',
        height: '100%',
    },
    photoText: {
        fontSize: 12,
        marginTop: 4,
    },
    submitBtn: {
        backgroundColor: '#135bec',
        padding: 16,
        borderRadius: 14,
        alignItems: 'center',
    },
    submitText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
});
