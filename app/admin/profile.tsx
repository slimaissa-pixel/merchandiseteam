import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import {
    Image,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
    ActivityIndicator
} from 'react-native';
import { AdminWebLayout } from '@/components/admin/WebLayout';
import MeshGradient from '@/components/MeshGradient';
import { EditProfileModal } from '@/components/ui/EditProfileModal';
import { getFullImageUrl } from '@/constants/api';
import { DARK_COLORS, LIGHT_COLORS } from '@/constants/appColors';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { useTheme } from '@/context/ThemeContext';
import { Fonts } from '@/hooks/useFonts';
import { UserService, UserUpdateData } from '@/services/user.service';
import { User } from '@/types/auth';
import { useWebTheme } from '@/hooks/useWebTheme';
import { WebCard } from '@/components/ui/WebPrimitives';

export default function Profile() {
    const router = useRouter();
    const { user, signOut, updateUser } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';
    const COLOR = isDark ? DARK_COLORS : LIGHT_COLORS;
    const { T } = useWebTheme();
    const { unreadCount } = useNotifications();

    const [profileUser, setProfileUser] = useState<User | null>(user);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const menuItems = [
        { icon: 'bell', label: 'Notifications', badge: unreadCount, path: '/admin/notifications' },
        { icon: 'calendar', label: 'My Objectives', path: '/admin/planning' },
        { icon: 'file-text', label: 'Documents', path: '/admin/documents' },
        { icon: 'clock', label: 'Leave Requests', path: '/admin/leave' },
        { icon: 'shield', label: 'Privacy & Security', path: '/admin/privacy' },
        { icon: 'help-circle', label: 'Help & Support', path: '/admin/help' },
    ];

    const fetchProfile = useCallback(async () => {
        try {
            const data = await UserService.getMe();
            if (data) setProfileUser(data);
        } catch (err) {
            console.error('Fetch profile error:', err);
        }
    }, []);

    useEffect(() => { fetchProfile(); }, [fetchProfile]);

    const handleUpdateProfile = async (data: any) => {
        if (!profileUser?.id) return;
        setIsSubmitting(true);
        try {
            const updateData: UserUpdateData = {
                first_name: data.firstName,
                last_name: data.lastName,
                phone: data.phone,
                address: data.address,
                profile_zone: data.profileZone,
                profile_image: data.image,
            };

            const updated = await UserService.update(profileUser.id, updateData);
            if (updated) {
                alert('Profile updated successfully');
                await fetchProfile();
                updateUser(updated);
                setIsEditModalVisible(false);
            } else {
                alert('Failed to update profile');
            }
        } catch (error) {
            console.error('Update profile error:', error);
            alert('An error occurred while updating profile');
        } finally {
            setIsSubmitting(false);
        }
    };

    const initials = profileUser ? `${profileUser.firstName?.[0] || ''}${profileUser.lastName?.[0] || ''}`.toUpperCase() : 'AD';
    const fullName = profileUser ? `${profileUser.firstName} ${profileUser.lastName}` : 'Administrator';

    return (
        <AdminWebLayout title="Admin Profile">
            <View style={{ flexDirection: 'row', gap: 32, alignItems: 'flex-start' }}>
                {/* Left Column: Profile Card */}
                <View style={{ width: 350, gap: 24 }}>
                    <WebCard style={{ padding: 32, alignItems: 'center' }}>
                        <View style={[styles.avatarOutline, { borderColor: COLOR.border, padding: 6 }]}>
                            <View style={[styles.avatarContainer, { backgroundColor: profileUser?.profileImage ? 'transparent' : COLOR.primary }]}>
                                {profileUser?.profileImage ? (
                                    <Image source={{ uri: getFullImageUrl(profileUser.profileImage) || '' }} style={styles.avatarImage} />
                                ) : (
                                    <Text style={styles.avatarText}>{initials}</Text>
                                )}
                            </View>
                        </View>

                        <Text style={{ fontSize: 24, fontFamily: Fonts.headingSemiBold, color: COLOR.text, marginTop: 20 }}>{fullName}</Text>
                        <View style={{ backgroundColor: COLOR.primary + '15', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 12, marginTop: 8 }}>
                            <Text style={{ color: COLOR.primary, fontSize: 13, fontFamily: Fonts.bodyBold }}>{profileUser?.role?.toUpperCase() || 'ADMIN'}</Text>
                        </View>

                        <TouchableOpacity
                            style={{ backgroundColor: COLOR.primary, width: '100%', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 32 }}
                            onPress={() => setIsEditModalVisible(true)}
                        >
                            <Text style={{ color: '#fff', fontSize: 15, fontFamily: Fonts.headingSemiBold }}>Edit Profile Information</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={{ width: '100%', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 12, borderWidth: 1, borderColor: COLOR.danger + '40' }}
                            onPress={signOut}
                        >
                            <Text style={{ color: COLOR.danger, fontSize: 15, fontFamily: Fonts.headingSemiBold }}>Sign Out Account</Text>
                        </TouchableOpacity>
                    </WebCard>

                    <WebCard>
                        <Text style={{ color: COLOR.text, fontSize: 18, fontFamily: Fonts.headingSemiBold, marginBottom: 16 }}>Contact Details</Text>
                        <View style={{ gap: 16 }}>
                            <ContactItem icon="mail" label="EMAIL ADDRESS" value={profileUser?.email || '—'} COLOR={COLOR} />
                            <ContactItem icon="phone" label="PHONE NUMBER" value={profileUser?.phone || '—'} COLOR={COLOR} />
                            <ContactItem icon="map-pin" label="ADDRESS" value={profileUser?.address || '—'} COLOR={COLOR} />
                        </View>
                    </WebCard>
                </View>

                {/* Right Column: Settings & Preferences */}
                <View style={{ flex: 1, gap: 24 }}>
                    <View style={{ flexDirection: 'row', gap: 20 }}>
                        <WebCard style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                                <Ionicons name="sunny-outline" size={24} color="#fbbf24" />
                                <Text style={{ fontSize: 16, fontFamily: Fonts.headingSemiBold, color: COLOR.text }}>Interface Theme</Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLOR.bg, padding: 16, borderRadius: 16 }}>
                                <Text style={{ color: COLOR.textMuted, fontFamily: Fonts.body }}>Dark Mode Preference</Text>
                                <Switch
                                    value={isDark}
                                    onValueChange={toggleTheme}
                                    trackColor={{ false: "#cbd5e1", true: COLOR.primary }}
                                />
                            </View>
                        </WebCard>

                        <WebCard style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                                <Ionicons name="notifications-outline" size={24} color={COLOR.primary} />
                                <Text style={{ fontSize: 16, fontFamily: Fonts.headingSemiBold, color: COLOR.text }}>Notifications</Text>
                            </View>
                            <TouchableOpacity
                                style={{ backgroundColor: COLOR.bg, padding: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                                onPress={() => router.push('/admin/notifications')}
                            >
                                <Text style={{ color: COLOR.textMuted, fontFamily: Fonts.body }}>Check unread alerts</Text>
                                {unreadCount > 0 && (
                                    <View style={{ backgroundColor: COLOR.danger, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 }}>
                                        <Text style={{ color: '#fff', fontSize: 12, fontFamily: Fonts.bodyBold }}>{unreadCount} New</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </WebCard>
                    </View>

                    <WebCard>
                        <Text style={{ color: COLOR.text, fontSize: 18, fontFamily: Fonts.headingSemiBold, marginBottom: 16 }}>Quick Links & Support</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
                            {menuItems.map(item => (
                                <TouchableOpacity
                                    key={item.label}
                                    style={{ width: '32%', padding: 20, backgroundColor: COLOR.bg, borderRadius: 20, alignItems: 'center', gap: 12, borderWidth: 1, borderColor: COLOR.border }}
                                    onPress={() => router.push(item.path as any)}
                                >
                                    <View style={{ backgroundColor: COLOR.primary + '15', width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}>
                                        <Feather name={item.icon as any} size={20} color={COLOR.primary} />
                                    </View>
                                    <Text style={{ fontSize: 13, fontFamily: Fonts.bodySemiBold, color: COLOR.text }}>{item.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </WebCard>

                    <View style={{ marginTop: 'auto', alignItems: 'center', paddingBottom: 20 }}>
                        <Text style={{ color: COLOR.textMuted, fontSize: 13, fontFamily: Fonts.body }}>FieldForce Enterprise Admin Control Panel</Text>
                        <Text style={{ color: COLOR.textMuted, fontSize: 12, marginTop: 4, fontFamily: Fonts.secondary }}>Version 1.2.0 • Build 2024.1</Text>
                    </View>
                </View>
            </View>

            <EditProfileModal
                isVisible={isEditModalVisible}
                onClose={() => setIsEditModalVisible(false)}
                onSave={handleUpdateProfile}
                userData={{
                    firstName: profileUser?.firstName || user?.firstName || '',
                    lastName: profileUser?.lastName || user?.lastName || '',
                    email: profileUser?.email || user?.email || '',
                    role: profileUser?.role || user?.role || 'admin',
                    phone: profileUser?.phone || user?.phone || '',
                    address: profileUser?.address || user?.address || '',
                    profileZone: profileUser?.profileZone || user?.profileZone || '',
                    profileImage: profileUser?.profileImage || user?.profileImage || null,
                }}
                isSubmitting={isSubmitting}
            />
        </AdminWebLayout>
    );
}

function ContactItem({ icon, label, value, COLOR }: any) {
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: COLOR.bg, alignItems: 'center', justifyContent: 'center' }}>
                <Feather name={icon} size={16} color={COLOR.primary} />
            </View>
            <View>
                <Text style={{ fontSize: 11, color: COLOR.textMuted, fontFamily: Fonts.bodyBold, letterSpacing: 0.5 }}>{label}</Text>
                <Text style={{ fontSize: 14, color: COLOR.text, fontFamily: Fonts.bodySemiBold }}>{value}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    avatarOutline: {
        borderRadius: 70,
        borderWidth: 2,
    },
    avatarContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    avatarText: {
        color: '#fff',
        fontSize: 40,
        fontFamily: Fonts.headingXBold,
    },
});
