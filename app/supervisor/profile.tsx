import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MeshGradient from '@/components/MeshGradient';
import { BottomNav } from '@/components/ui/BottomNav';
import { EditProfileModal } from '@/components/ui/EditProfileModal';
import { ChangePasswordModal } from '@/components/ui/ChangePasswordModal';
import { Header } from '@/components/ui/Header';
import { getFullImageUrl } from '@/constants/api';
import { getColors } from '@/constants/designSystem';
import { SUPERVISOR_NAV_ITEMS } from '@/constants/navigation';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { useTheme } from '@/context/ThemeContext';
import { Fonts } from '@/hooks/useFonts';
import { UserService, UserUpdateData } from '@/services/user.service';
import { User } from '@/types/auth';

const ProfileHeader = ({ user, colors, onEdit, isDark }: { user: any, colors: any, onEdit: () => void, isDark: boolean }) => {
  const initials = user ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() : 'SV';
  const fullName = user ? `${user.firstName} ${user.lastName}` : 'Supervisor';
  const roleDisplay = 'Supervisor';

  return (
    <View style={styles.premiumHeader}>
      <View style={styles.headerBackgroundContainer}>
        {Platform.OS !== 'web' ? (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? colors.background : '#fff' }]}>
            <Image 
              source={require('@/assets/images/neat.png')} 
              style={[
                StyleSheet.absoluteFill, 
                { width: '100%', height: '100%' },
                isDark ? { opacity: 0.15, tintColor: colors.primary } : { opacity: 0.9 }
              ]} 
              resizeMode="cover" 
            />
          </View>
        ) : (
          <MeshGradient />
        )}
        <LinearGradient
            colors={['transparent', colors.background]}
            style={StyleSheet.absoluteFill}
        />
      </View>

      <View style={styles.headerContent}>
        <View style={styles.avatarWrapper}>
          <View style={[styles.avatarGlow, { backgroundColor: colors.primary + '40' }]} />
          <View style={[styles.avatarOutline, { borderColor: colors.background }]}>
            <View style={[styles.premiumAvatarContainer, { backgroundColor: user?.profileImage ? 'transparent' : colors.primary }]}>
              {user?.profileImage ? (
                <Image source={{ uri: getFullImageUrl(user.profileImage) || '' }} style={styles.premiumAvatar} />
              ) : (
                <Text style={styles.avatarText}>{initials}</Text>
              )}
            </View>
          </View>
          <TouchableOpacity onPress={onEdit} style={[styles.premiumEditBtn, { backgroundColor: colors.primary, borderColor: colors.background }]}>
            <Feather name="edit-2" size={14} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.profileTextInfo}>
          <Text style={[styles.premiumName, { color: colors.text }]}>{fullName}</Text>
          <View style={[styles.roleBadge, { backgroundColor: colors.primary + '20' }]}>
            <Text style={[styles.roleBadgeText, { color: colors.primary }]}>{roleDisplay}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const MenuItem = ({ item, isLast, colors, router }: any) => (
  <TouchableOpacity
    onPress={() => item.onPress ? item.onPress() : router.push(item.path)}
    style={[styles.menuItemGlass, !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border + '50' }]}
  >
    <View style={[styles.menuIconContainerGlass, { backgroundColor: item.color || colors.primary + '15' }]}>
      <Ionicons name={item.icon} size={20} color={item.iconColor || colors.primary} />
    </View>
    <View style={styles.menuTextContainer}>
        <Text style={[styles.menuLabel, { color: colors.text }]}>{item.label}</Text>
        {item.subtitle && <Text style={[styles.menuSubtitle, { color: colors.textMuted }]}>{item.subtitle}</Text>}
    </View>
    {item.badge ? (
      <View style={[styles.badge, { backgroundColor: colors.danger }]}>
        <Text style={styles.badgeText}>{item.badge}</Text>
      </View>
    ) : null}
    <Feather name="chevron-right" size={18} color={colors.textMuted} />
  </TouchableOpacity>
);

export default function Profile() {
  const router = useRouter();
  const { user, signOut, updateUser } = useAuth();
  const { theme } = useTheme();
  const { unreadCount } = useNotifications();
  const colors = getColors(theme);
  const isDark = theme === 'dark';

  const [profileUser, setProfileUser] = useState<User | null>(user);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isChangePasswordModalVisible, setIsChangePasswordModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProfile = async () => {
    try {
      const data = await UserService.getMe();
      if (data) setProfileUser(data);
    } catch (err) {
      console.error('Fetch profile error:', err);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (data: any) => {
    if (!profileUser?.id) return;
    setIsSubmitting(true);
    try {
      const updateData: UserUpdateData = {
        first_name: data.firstName,
        last_name: data.lastName,
        phone: data.phone,
        address: data.address,
        profile_image: data.image,
      };
      const updated = await UserService.update(profileUser.id, updateData);
      if (updated) {
        Alert.alert('Success', 'Profile updated successfully');
        await fetchProfile();
        updateUser(updated);
        setIsEditModalVisible(false);
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while updating profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const SECTIONS = [
    {
      title: 'ACCOUNT',
      items: [
        { icon: 'person-outline', label: 'Edit Profile', subtitle: 'Personal info and avatar', onPress: () => setIsEditModalVisible(true) },
        { icon: 'lock-closed-outline', label: 'Change Password', subtitle: 'Update security credentials', onPress: () => setIsChangePasswordModalVisible(true) },
        { icon: 'notifications-outline', label: 'Notifications', subtitle: 'Alerts and sound settings', badge: unreadCount, path: '/supervisor/notifications' },
      ]
    },
    {
      title: 'WORK',
      items: [
        { icon: 'map-outline', label: 'My Routes', subtitle: 'View assigned team routes', path: '/supervisor/map' },
        { icon: 'trending-up-outline', label: 'Performance', subtitle: 'Team ranking and stats', path: '/supervisor/performance' },
        { icon: 'calendar-outline', label: 'Visit Schedule', subtitle: 'Manage absences and time off', path: '/supervisor/team' },
        { icon: 'chatbubbles-outline', label: 'Complaints', subtitle: 'Review and report issues', path: '/supervisor/complaints' },
        { icon: 'document-attach-outline', label: 'Documents', subtitle: 'Reports and administrative files', path: '/supervisor/documents' },
      ]
    },
    {
      title: 'APP',
      items: [
        { icon: 'information-circle-outline', label: 'About', subtitle: 'Version 1.2.0 (Build 24)', path: '/supervisor/profile' },
        { icon: 'help-buoy-outline', label: 'Help and Support', subtitle: 'FAQs and contact center', path: '/supervisor/help' },
        { icon: 'shield-checkmark-outline', label: 'Privacy Policy', subtitle: 'Data usage and legal info', path: '/supervisor/privacy' },
        { icon: 'log-out-outline', label: 'Logout', subtitle: 'Sign out of your account', iconColor: colors.danger, color: colors.danger + '15', onPress: signOut },
      ]
    }
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <Header title="Profile" showBack />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <ProfileHeader user={profileUser || user} colors={colors} onEdit={() => setIsEditModalVisible(true)} isDark={isDark} />

        {SECTIONS.map((section, sIndex) => (
          <View key={section.title} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>{section.title}</Text>
            <View style={[styles.menuCardGlass, { backgroundColor: colors.surface + '40', borderColor: colors.border }]}>
              {section.items.map((item, index) => (
                <MenuItem
                  key={item.label}
                  item={item}
                  isLast={index === section.items.length - 1}
                  colors={colors}
                  router={router}
                />
              ))}
            </View>
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textMuted }]}>FieldForce Supervisor © 2026</Text>
        </View>
      </ScrollView>

      <EditProfileModal
        isVisible={isEditModalVisible}
        onClose={() => setIsEditModalVisible(false)}
        onSave={handleUpdateProfile}
        userData={{
            firstName: profileUser?.firstName || user?.firstName || '',
            lastName: profileUser?.lastName || user?.lastName || '',
            email: profileUser?.email || user?.email || '',
            role: 'supervisor',
            phone: profileUser?.phone || user?.phone || '',
            address: profileUser?.address || user?.address || '',
            profileZone: profileUser?.profileZone || user?.profileZone || '',
            profileImage: profileUser?.profileImage || user?.profileImage || null,
        }}
        isSubmitting={isSubmitting}
      />

      <ChangePasswordModal 
        isVisible={isChangePasswordModalVisible}
        onClose={() => setIsChangePasswordModalVisible(false)}
      />

      <BottomNav items={SUPERVISOR_NAV_ITEMS} activeRoute="/supervisor/profile" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: { paddingBottom: 120 },
  section: { paddingHorizontal: 20, marginBottom: 24, marginTop: 8 },
  sectionTitle: { fontSize: 13, fontFamily: Fonts.headingSemiBold, marginBottom: 12, letterSpacing: 1.5, opacity: 0.7 },
  premiumHeader: { position: 'relative', overflow: 'hidden', marginBottom: 20 },
  headerBackgroundContainer: { height: 260, position: 'absolute', top: 0, left: 0, right: 0 },
  headerContent: { alignItems: 'center', paddingTop: 40, paddingHorizontal: 20 },
  avatarWrapper: { position: 'relative', zIndex: 1 },
  avatarGlow: { position: 'absolute', width: 140, height: 140, borderRadius: 70, top: -15, left: -15, transform: [{ scale: 1.2 }], opacity: 0.5 },
  avatarOutline: { padding: 5, borderRadius: 65, borderWidth: 3.5 },
  premiumAvatarContainer: { width: 110, height: 110, borderRadius: 55, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  premiumAvatar: { width: '100%', height: '100%' },
  avatarText: { color: '#fff', fontSize: 36, fontFamily: Fonts.headingXBold },
  premiumEditBtn: { position: 'absolute', bottom: 2, right: 2, width: 36, height: 36, borderRadius: 18, borderWidth: 3, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 5 },
  profileTextInfo: { alignItems: 'center', marginTop: 16, gap: 6, zIndex: 1 },
  premiumName: { fontSize: 26, fontFamily: Fonts.headingXBold, letterSpacing: -0.5 },
  roleBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 14 },
  roleBadgeText: { fontSize: 13, fontFamily: Fonts.bodyBold, letterSpacing: 1, textTransform: 'uppercase' },
  menuCardGlass: { borderRadius: 24, borderWidth: 1, overflow: 'hidden' },
  menuItemGlass: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 16 },
  menuIconContainerGlass: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  menuTextContainer: { flex: 1, gap: 2 },
  menuLabel: { fontSize: 15, fontFamily: Fonts.headingSemiBold },
  menuSubtitle: { fontSize: 12, fontFamily: Fonts.body },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: '#fff', fontSize: 11, fontFamily: Fonts.bodyBold },
  footer: { alignItems: 'center', marginTop: 24, paddingBottom: 20 },
  footerText: { fontSize: 12, fontFamily: Fonts.body, opacity: 0.5 },
});
