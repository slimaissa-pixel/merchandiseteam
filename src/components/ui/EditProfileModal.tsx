import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
    ActionSheetIOS,
    Alert,
    Image,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { getFullImageUrl } from '@/constants/api';
import { getColors } from '@/constants/designSystem';
import { useTheme } from '@/context/ThemeContext';
import { Fonts } from '@/hooks/useFonts';
import { UserRole } from '@/types/auth';

interface EditProfileModalProps {
    isVisible: boolean;
    onClose: () => void;
    onSave: (data: {
        firstName: string;
        lastName: string;
        phone: string;
        address?: string;
        profileZone?: string;
        image?: string | null;
    }) => void;
    userData: {
        firstName: string;
        lastName: string;
        email: string;
        role: UserRole;
        phone: string;
        address?: string;
        profileZone?: string;
        profileImage?: string | null;
    };
    isSubmitting: boolean;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
    isVisible,
    onClose,
    onSave,
    userData,
    isSubmitting,
}) => {
    const { theme } = useTheme();
    const colors = getColors(theme);

    const [firstName, setFirstName] = useState(userData.firstName);
    const [lastName, setLastName] = useState(userData.lastName);
    const [phone, setPhone] = useState(userData.phone);
    const [address, setAddress] = useState(userData.address || '');
    const [profileZone, setProfileZone] = useState(userData.profileZone || '');
    const [image, setImage] = useState<string | null>(getFullImageUrl(userData.profileImage) || null);

    // Reset form every time the modal opens with fresh data
    useEffect(() => {
        if (isVisible) {
            setFirstName(userData.firstName);
            setLastName(userData.lastName);
            setPhone(userData.phone);
            setAddress(userData.address || '');
            setProfileZone(userData.profileZone || '');
            setImage(getFullImageUrl(userData.profileImage) || null);
        }
    }, [isVisible]);

    const handlePickImage = async () => {
        const options = ['Take a quick photo', 'Import from device', 'Cancel'];
        const cancelButtonIndex = 2;

        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options,
                    cancelButtonIndex,
                },
                (buttonIndex) => {
                    if (buttonIndex === 0) launchCamera();
                    else if (buttonIndex === 1) launchImageLibrary();
                }
            );
        } else {
            Alert.alert(
                'Profile Photo',
                'Choose an option',
                [
                    { text: 'Take Photo', onPress: launchCamera },
                    { text: 'Choose from Gallery', onPress: launchImageLibrary },
                    { text: 'Cancel', style: 'cancel' },
                ]
            );
        }
    };

    const launchCamera = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Camera permission is required to take photos.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
            base64: true,
        });

        if (!result.canceled) {
            const asset = result.assets[0];
            // Check file size (1MB limit)
            if (asset.fileSize && asset.fileSize > 1024 * 1024) {
                Alert.alert('File too large', 'Please choose an image smaller than 1MB.');
                return;
            }
            if (asset.base64) {
                setImage(`data:image/jpeg;base64,${asset.base64}`);
            } else {
                setImage(asset.uri);
            }
        }
    };

    const launchImageLibrary = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Gallery permission is required to pick photos.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
            base64: true,
        });

        if (!result.canceled) {
            const asset = result.assets[0];
            // Check file size (1MB limit)
            if (asset.fileSize && asset.fileSize > 1024 * 1024) {
                Alert.alert('File too large', 'Please choose an image smaller than 1MB.');
                return;
            }
            if (asset.base64) {
                setImage(`data:image/jpeg;base64,${asset.base64}`);
            } else {
                setImage(asset.uri);
            }
        }
    };

    const handleSave = async () => {
        onSave({
            firstName,
            lastName,
            phone,
            address,
            profileZone: userData.role !== 'admin' ? profileZone : undefined,
            image: image,
        });
    };

    return (
        <Modal visible={isVisible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={[styles.container, { backgroundColor: colors.surface }]}>
                    <View style={[styles.header, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.title, { color: colors.text }]}>Modify Profile</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Ionicons name="close" size={24} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        <View style={styles.avatarSection}>
                            <View style={styles.avatarWrapper}>
                                <View style={[styles.avatar, { borderColor: colors.border, backgroundColor: colors.surfaceSecondary }]}>
                                    {image ? (
                                        <Image source={{ uri: image }} style={styles.avatarImg} />
                                    ) : (
                                        <Ionicons name="person" size={50} color={colors.textMuted} />
                                    )}
                                </View>
                                <TouchableOpacity
                                    style={[styles.plusBtn, { backgroundColor: colors.primary, borderColor: colors.surface }]}
                                    onPress={image ? () => setImage(null) : handlePickImage}
                                >
                                    <Ionicons name={image ? "close" : "add"} size={18} color="#fff" />
                                </TouchableOpacity>
                            </View>
                            <Text style={[styles.uploadText, { color: colors.text }]}>Upload Image</Text>
                            <Text style={[styles.uploadSubtext, { color: colors.textSecondary }]}>Max file size: 1MB</Text>

                            <TouchableOpacity style={[styles.addBtn, { borderColor: colors.border }]} onPress={handlePickImage}>
                                <Text style={[styles.addBtnText, { color: colors.text }]}>Add Image</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.form}>
                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: colors.textSecondary }]}>EMAIL (READ-ONLY)</Text>
                                <View style={[styles.readOnlyField, { backgroundColor: colors.background }]}>
                                    <Text style={{ color: colors.textMuted, fontFamily: Fonts.body }}>{userData.email}</Text>
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: colors.textSecondary }]}>ROLE (READ-ONLY)</Text>
                                <View style={[styles.readOnlyField, { backgroundColor: colors.background }]}>
                                    <Text style={{ color: colors.textMuted, fontFamily: Fonts.body }}>{userData.role.toUpperCase()}</Text>
                                </View>
                            </View>

                            <View style={styles.row}>
                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text style={[styles.label, { color: colors.textSecondary }]}>FIRST NAME <Text style={{ color: colors.primary }}>*</Text></Text>
                                    <TextInput
                                        style={[styles.input, { color: Platform.OS === 'web' ? '#000' : colors.text, borderColor: colors.border, fontFamily: Fonts.body }]}
                                        value={firstName}
                                        onChangeText={setFirstName}
                                        placeholder="First Name"
                                        placeholderTextColor={colors.textMuted}
                                    />
                                </View>
                                <View style={{ width: 12 }} />
                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text style={[styles.label, { color: colors.textSecondary }]}>LAST NAME <Text style={{ color: colors.primary }}>*</Text></Text>
                                    <TextInput
                                        style={[styles.input, { color: Platform.OS === 'web' ? '#000' : colors.text, borderColor: colors.border, fontFamily: Fonts.body }]}
                                        value={lastName}
                                        onChangeText={setLastName}
                                        placeholder="Last Name"
                                        placeholderTextColor={colors.textMuted}
                                    />
                                </View>
                            </View>

                            {userData.role !== 'admin' && (
                                <View style={styles.inputGroup}>
                                    <Text style={[styles.label, { color: colors.textSecondary }]}>TITLE / ZONE</Text>
                                    <TextInput
                                        style={[styles.input, { color: Platform.OS === 'web' ? '#000' : colors.text, borderColor: colors.border, fontFamily: Fonts.body }]}
                                        value={profileZone}
                                        onChangeText={setProfileZone}
                                        placeholder="e.g. Design Engineer"
                                        placeholderTextColor={colors.textMuted}
                                    />
                                </View>
                            )}

                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: colors.textSecondary }]}>PHONE NUMBER</Text>
                                <TextInput
                                    style={[styles.input, { color: Platform.OS === 'web' ? '#000' : colors.text, borderColor: colors.border, fontFamily: Fonts.body }]}
                                    value={phone}
                                    onChangeText={setPhone}
                                    keyboardType="phone-pad"
                                    placeholder="+216 -- --- ---"
                                    placeholderTextColor={colors.textMuted}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: colors.textSecondary }]}>ADDRESS</Text>
                                <TextInput
                                    style={[styles.input, { color: Platform.OS === 'web' ? '#000' : colors.text, borderColor: colors.border, fontFamily: Fonts.body }]}
                                    value={address}
                                    onChangeText={setAddress}
                                    placeholder="Where exactly in Tunisia?"
                                    placeholderTextColor={colors.textMuted}
                                />
                            </View>
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
                                    {isSubmitting ? 'Saving...' : 'Save Changes'}
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
        maxWidth: 500,
        maxHeight: '90%',
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
    avatarSection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    avatarWrapper: {
        position: 'relative',
        marginBottom: 12,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    avatarImg: {
        width: '100%',
        height: '100%',
    },
    plusBtn: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 3,
        justifyContent: 'center',
        alignItems: 'center',
    },
    uploadText: {
        fontSize: 16,
        fontFamily: Fonts.heading,
    },
    uploadSubtext: {
        fontSize: 12,
        fontFamily: Fonts.secondary,
        marginTop: 2,
    },
    addBtn: {
        marginTop: 12,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
    },
    addBtnText: {
        fontSize: 14,
        fontFamily: Fonts.cta,
        letterSpacing: 1,
    },
    form: {
        gap: 16,
        marginBottom: 24,
    },
    inputGroup: {
        gap: 6,
    },
    row: {
        flexDirection: 'row',
    },
    label: {
        fontSize: 11,
        fontFamily: Fonts.secondaryBold,
        letterSpacing: 0.5,
    },
    readOnlyField: {
        padding: 14,
        borderRadius: 12,
        justifyContent: 'center',
    },
    input: {
        padding: 14,
        borderWidth: 1,
        borderRadius: 12,
        fontSize: 15,
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
