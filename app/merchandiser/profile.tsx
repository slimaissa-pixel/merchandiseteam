import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomNav } from '@/components/ui/BottomNav';
import { EditProfileModal } from '@/components/ui/EditProfileModal';
import { ChangePasswordModal } from '@/components/ui/ChangePasswordModal';
import { getFullImageUrl } from '@/constants/api';
import { DesignTokens, getColors } from '@/constants/designSystem';
import { MERCHANDISER_NAV_ITEMS } from '@/constants/navigation';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { useTheme } from '@/context/ThemeContext';
import { Fonts } from '@/hooks/useFonts';
import { UserService } from '@/services/user.service';
import { User } from '@/types/auth';

interface MenuItemProps {
    icon: any;
    label: string;
    subLabel?: string;
    onPress: () => void;
    iconBg: string;
    iconColor: string;
    isLast?: boolean;
}

const MenuItem = ({ icon, label, subLabel, onPress, iconBg, iconColor, isLast }: MenuItemProps) => {
    const { theme } = useTheme();
    const colors = getColors(theme);

    return (
        <TouchableOpacity 
            style={[s.menuItem, !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border + '50' }]} 
            onPress={onPress}
        >
            <View style={[s.iconBox, { backgroundColor: iconBg }]}>
                <Feather name={icon} size={18} color={iconColor} />
            </View>
            <View style={s.menuText}>
                <Text style={[s.menuLabel, { color: colors.text }]}>{label}</Text>
                {subLabel && <Text style={[s.menuSubLabel, { color: colors.textSecondary }]}>{subLabel}</Text>}
            </View>
            <Feather name="chevron-right" size={18} color={colors.textMuted} />
        </TouchableOpacity>
    );
};

export default function Profile() {
    const router = useRouter();
    const { user, signOut } = useAuth();
    const { theme } = useTheme();
    const colors = getColors(theme);
    
    const [profileUser, setProfileUser] = useState<User | null>(user);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            const data = await UserService.getMe();
            if (data) setProfileUser(data);
        };
        fetchProfile();
    }, []);

    return (
        <SafeAreaView style={[s.container, { backgroundColor: colors.background }]}>
            <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
                {/* 1. Account Section */}
                <Text style={[s.sectionTitle, { color: colors.textSecondary }]}>ACCOUNT</Text>
                <Card style={s.sectionCard}>
                    <MenuItem 
                        icon="user" 
                        label="Edit Profile" 
                        subLabel="Update your personal information"
                        iconBg="#EEF2FF"
                        iconColor="#4F46E5"
                        onPress={() => setIsEditModalVisible(true)}
                    />
                    <MenuItem 
                        icon="lock" 
                        label="Change Password" 
                        subLabel="Update your password"
                        iconBg="#F0FDF4"
                        iconColor="#16A34A"
                        onPress={() => setIsPasswordModalVisible(true)}
                    />
                    <MenuItem 
                        icon="bell" 
                        label="Notifications" 
                        subLabel="Manage notification preferences"
                        iconBg="#FFF7ED"
                        iconColor="#EA580C"
                        isLast
                        onPress={() => router.push('/merchandiser/notifications')}
                    />
                </Card>

                {/* 2. Work Section */}
                <Text style={[s.sectionTitle, { color: colors.textSecondary, marginTop: 24 }]}>WORK</Text>
                <Card style={s.sectionCard}>
                    <MenuItem 
                        icon="map-pin" 
                        label="My Routes" 
                        subLabel="View your assigned routes"
                        iconBg="#FEFCE8"
                        iconColor="#CA8A04"
                        onPress={() => router.push('/merchandiser/planning')}
                    />
                    <MenuItem 
                        icon="bar-chart-2" 
                        label="Performance" 
                        subLabel="View your work statistics"
                        iconBg="#F0FDF4"
                        iconColor="#16A34A"
                        onPress={() => router.push('/merchandiser/reports')}
                    />
                    <MenuItem 
                        icon="calendar" 
                        label="Leave Requests" 
                        subLabel="Request and view leave history"
                        iconBg="#EEF2FF"
                        iconColor="#4F46E5"
                        onPress={() => router.push('/merchandiser/leave')}
                    />
                    <MenuItem 
                        icon="alert-circle" 
                        label="Complaints" 
                        subLabel="Report a problem to admin"
                        iconBg="#FEF2F2"
                        iconColor="#DC2626"
                        onPress={() => router.push('/merchandiser/complaints')}
                    />
                    <MenuItem 
                        icon="file-text" 
                        label="Documents" 
                        subLabel="View shared documents"
                        iconBg="#F8FAFC"
                        iconColor="#475569"
                        isLast
                        onPress={() => Alert.alert('Info', 'Documents feature')}
                    />
                </Card>

                {/* 3. App Section */}
                <Text style={[s.sectionTitle, { color: colors.textSecondary, marginTop: 24 }]}>APP</Text>
                <Card style={s.sectionCard}>
                    <MenuItem 
                        icon="info" 
                        label="About" 
                        iconBg="#F1F5F9"
                        iconColor="#64748B"
                        onPress={() => router.push('/merchandiser/about')}
                    />
                    <MenuItem 
                        icon="help-circle" 
                        label="Help and Support" 
                        iconBg="#F1F5F9"
                        iconColor="#64748B"
                        onPress={() => router.push('/merchandiser/support')}
                    />
                    <MenuItem 
                        icon="shield" 
                        label="Privacy Policy" 
                        iconBg="#F1F5F9"
                        iconColor="#64748B"
                        onPress={() => router.push('/merchandiser/privacy')}
                    />
                    <MenuItem 
                        icon="log-out" 
                        label="Logout" 
                        iconBg="#FEF2F2"
                        iconColor="#DC2626"
                        isLast
                        onPress={signOut}
                    />
                </Card>

                <View style={s.footer}>
                    <Text style={[s.footerText, { color: colors.textMuted }]}>FieldForce Merchandiser v1.5.0</Text>
                </View>
            </ScrollView>

            <EditProfileModal
                isVisible={isEditModalVisible}
                onClose={() => setIsEditModalVisible(false)}
                onSave={async () => {}}
                userData={{
                    firstName: profileUser?.firstName || '',
                    lastName: profileUser?.lastName || '',
                    email: profileUser?.email || '',
                    role: profileUser?.role || 'merchandiser',
                    phone: profileUser?.phone || '',
                    address: profileUser?.address || '',
                    profileZone: profileUser?.profileZone || '',
                    profileImage: profileUser?.profileImage || null,
                }}
                isSubmitting={false}
            />

            <ChangePasswordModal
                isVisible={isPasswordModalVisible}
                onClose={() => setIsPasswordModalVisible(false)}
            />

            <BottomNav items={MERCHANDISER_NAV_ITEMS} activeRoute="/merchandiser/profile" />
        </SafeAreaView>
    );
}

const Card = ({ children, style }: any) => {
    const { theme } = useTheme();
    const colors = getColors(theme);
    return (
        <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border + '50' }, style]}>
            {children}
        </View>
    );
};

const s = StyleSheet.create({
    container: { flex: 1 },
    scroll: { paddingBottom: 100, paddingTop: 20 },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '800',
        marginLeft: 24,
        marginBottom: 10,
        letterSpacing: 1,
    },
    card: {
        marginHorizontal: 20,
        borderRadius: 20,
        borderWidth: 1,
        overflow: 'hidden',
    },
    sectionCard: {
        ...DesignTokens.shadows.sm,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    menuText: {
        flex: 1,
    },
    menuLabel: {
        fontSize: 15,
        fontWeight: '700',
    },
    menuSubLabel: {
        fontSize: 12,
        fontWeight: '500',
        marginTop: 2,
    },
    footer: {
        marginTop: 32,
        alignItems: 'center',
        paddingBottom: 20,
    },
    footerText: {
        fontSize: 12,
        fontWeight: '600',
    },
});
