import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import React, { useRef } from 'react';
import {
    Animated,
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Pressable,
} from 'react-native';
import { getFullImageUrl } from '@/constants/api';
import { getColors } from '@/constants/designSystem';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Fonts } from '@/hooks/useFonts';

const SIDEBAR_WIDTH = 260;
const COLLAPSED_WIDTH = 70;

let globalIsCollapsed = true;

const ADMIN_LINKS = [
    { icon: 'grid-outline',          label: 'Dashboard',               route: '/admin/dashboard',        group: 'Menu' },
    { icon: 'people-outline',        label: 'Team Management',         route: '/admin/users',            group: 'Menu' },
    { icon: 'cube-outline',          label: 'Products',                route: '/admin/articles',         group: 'Menu' },
    { icon: 'storefront-outline',    label: 'Stores',                  route: '/admin/gms',              group: 'Menu' },
    { icon: 'location-outline',      label: 'Visits Tracking',         route: '/admin/visits',           group: 'Menu' },
    { icon: 'document-text-outline', label: 'Documents',               route: '/admin/documents',        group: 'Menu' },
    { icon: 'bar-chart-outline',     label: 'Reporting',               route: '/admin/reporting',        group: 'Menu' },
    { icon: 'calendar-outline',      label: 'Leave Requests',          route: '/admin/leave',            group: 'Menu' },
    { icon: 'warning-outline',       label: 'Complaints',              route: '/admin/complaints',       group: 'Menu' },
    { icon: 'settings-outline',      label: 'Settings',                route: '/admin/profile',          group: 'Menu' },
];

const GROUPS = ['Menu']; // Single group for the simple list

const NavItem = React.memo(function NavItem({ link, isActive, onPress, colors, isDark, isCollapsed }: any) {
    const hoverAnim = useRef(new Animated.Value(0)).current;

    const handleHoverIn = () => { Animated.timing(hoverAnim, { toValue: 1, duration: 160, useNativeDriver: false }).start(); };
    const handleHoverOut = () => { Animated.timing(hoverAnim, { toValue: 0, duration: 160, useNativeDriver: false }).start(); };

    const hoverBg = isDark ? '#ffffff0d' : 'rgba(59,130,246,0.08)';
    const activeBg = isDark ? '#ffffff14' : 'rgba(59,130,246,0.15)';
    const bgColor = isActive ? activeBg : hoverAnim.interpolate({ inputRange: [0, 1], outputRange: ['transparent', hoverBg] });

    const itemColor = isDark ? (isActive ? colors.primary : colors.textMuted) : (isActive ? '#FFFFFF' : '#94A3B8');

    return (
        <Pressable
            onPress={onPress}
            onHoverIn={handleHoverIn}
            onHoverOut={handleHoverOut}
            style={({ pressed }) => [
                { cursor: Platform.OS === 'web' ? 'pointer' : 'default', opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] } as any
            ]}
        >
            <Animated.View 
                {...(Platform.OS === 'web' && isCollapsed ? { title: link.label } as any : {})}
                style={[navSt.item, { backgroundColor: bgColor, justifyContent: isCollapsed ? 'center' : 'flex-start', borderLeftWidth: isActive && !isDark ? 4 : 0, borderLeftColor: isActive && !isDark ? '#3B82F6' : 'transparent', paddingLeft: isActive && !isDark ? 12 : 16 }]}
            >
                {isActive && isDark && <View style={[navSt.pill, { backgroundColor: colors.primary }]} />}
                <Ionicons name={link.icon as any} size={isCollapsed ? 22 : 18} color={itemColor} style={!isCollapsed && { marginRight: 12 }} />
                {!isCollapsed && <Text style={[navSt.label, { color: itemColor, fontWeight: isActive ? '700' : '500' }]} numberOfLines={1}>{link.label}</Text>}
            </Animated.View>
        </Pressable>
    );
});

const navSt = StyleSheet.create({
    item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, marginBottom: 4, position: 'relative' },
    pill: { position: 'absolute', left: 0, top: '25%', bottom: '25%', width: 4, borderRadius: 2 },
    label: { fontSize: 13.5, fontFamily: Fonts.body },
});

function BaseWebLayout({ children, title, links }: { children: React.ReactNode; title: string; links: any[] }) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, signOut } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [isCollapsed, setIsCollapsed] = React.useState(globalIsCollapsed);
    const sidebarWidth = useRef(new Animated.Value(globalIsCollapsed ? COLLAPSED_WIDTH : SIDEBAR_WIDTH)).current;
    const logoHoverAnim = useRef(new Animated.Value(0)).current;

    const handleLogoHoverIn = () => { Animated.timing(logoHoverAnim, { toValue: 1, duration: 160, useNativeDriver: false }).start(); };
    const handleLogoHoverOut = () => { Animated.timing(logoHoverAnim, { toValue: 0, duration: 160, useNativeDriver: false }).start(); };

    const toggleCollapse = () => {
        const nextState = !isCollapsed;
        globalIsCollapsed = nextState;
        setIsCollapsed(nextState);
        const toValue = nextState ? COLLAPSED_WIDTH : SIDEBAR_WIDTH;
        Animated.spring(sidebarWidth, { toValue, useNativeDriver: false, friction: 8, tension: 40 }).start();
    };

    if (Platform.OS !== 'web') return <>{children}</>;

    const isDark = theme === 'dark';
    const colors = getColors(theme);
    const logoSource = isDark ? require('@/assets/images/dark.png') : require('@/assets/images/logo-light.png');
    const sidebarBg = isDark ? '#0f0f12' : '#0F172A';
    const pageBg = isDark ? '#09090b' : '#F8FAFC';
    const border = isDark ? '#1e1e24' : 'rgba(255,255,255,0.08)';
    const groupLabel = isDark ? '#52525b' : '#64748B';

    return (
        <View style={{ flex: 1, flexDirection: 'row', backgroundColor: isDark ? undefined : pageBg, backgroundImage: isDark ? 'linear-gradient(135deg, #09090b 0%, #18181b 100%)' : undefined, height: '100vh' } as any}>
            <Animated.View style={[sidebarSt.sidebar, { width: sidebarWidth, backgroundColor: sidebarBg, borderRightColor: border }]}>
                <View style={[sidebarSt.brand, isCollapsed && { paddingHorizontal: 0, justifyContent: 'center' }]}>
                    <Pressable
                        onPress={isCollapsed ? toggleCollapse : undefined}
                        onHoverIn={isCollapsed ? handleLogoHoverIn : undefined}
                        onHoverOut={isCollapsed ? handleLogoHoverOut : undefined}
                        style={({ pressed }) => [
                            isCollapsed && Platform.OS === 'web' ? { cursor: 'pointer' } : { cursor: 'default' } as any,
                            { opacity: pressed && isCollapsed ? 0.8 : 1 } as any
                        ]}
                    >
                        <Animated.View style={[sidebarSt.logoBox, { backgroundColor: colors.primary, transform: [{ scale: isCollapsed ? logoHoverAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] }) : 1 }] }]}>
                            <Image source={logoSource} style={sidebarSt.logo} />
                        </Animated.View>
                    </Pressable>
                    {!isCollapsed && (
                        <View>
                            <Text style={[sidebarSt.brandName, { color: isDark ? colors.text : '#FFFFFF', fontSize: 16 }]}>MerchAdmin</Text>
                            <Text style={{ fontSize: 9, color: isDark ? colors.textMuted : '#94A3B8', fontWeight: '700', marginTop: -2, letterSpacing: 0.5 }}>MANAGEMENT SYSTEM</Text>
                        </View>
                    )}
                    {!isCollapsed && (
                        <TouchableOpacity onPress={toggleCollapse} style={sidebarSt.themeBtn}>
                            <Ionicons name="chevron-back-outline" size={18} color={isDark ? colors.textMuted : '#94A3B8'} />
                        </TouchableOpacity>
                    )}
                </View>


                <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1, paddingHorizontal: 12 }}>
                    {GROUPS.map(group => {
                        const groupLinks = links.filter(l => l.group === group);
                        if (groupLinks.length === 0) return null;
                        return (
                            <View key={group} style={{ marginBottom: 20 }}>
                                {!isCollapsed && group !== 'Menu' && <Text style={[sidebarSt.groupLabel, { color: groupLabel }]}>{group.toUpperCase()}</Text>}
                                {groupLinks.map(link => (
                                    <NavItem key={link.route} link={link} isActive={pathname === link.route} onPress={() => router.push(link.route as any)} colors={colors} isDark={isDark} isCollapsed={isCollapsed} />
                                ))}
                            </View>
                        );
                    })}
                </ScrollView>

                <Pressable style={[sidebarSt.footer, { borderTopColor: border }]} onPress={() => router.push('/admin/profile')}>
                    <View style={[sidebarSt.userRow, isCollapsed && { justifyContent: 'center' }]}>
                        <View style={[sidebarSt.avatar, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30', overflow: 'hidden' }]}>
                            {user?.profileImage ? (
                                <Image source={{ uri: getFullImageUrl(user.profileImage) || '' }} style={sidebarSt.avatarImg} />
                            ) : (
                                <Text style={[sidebarSt.avatarText, { color: colors.primary }]}>{user?.firstName?.[0] ?? 'A'}</Text>
                            )}
                        </View>
                        {!isCollapsed && (
                            <>
                                <View style={{ flex: 1 }}>
                                    <Text style={[sidebarSt.userName, { color: isDark ? colors.text : '#FFFFFF' }]} numberOfLines={1}>{user?.firstName} {user?.lastName}</Text>
                                    <Text style={[sidebarSt.userEmail, { color: isDark ? colors.textMuted : '#94A3B8' }]} numberOfLines={1}>{user?.role?.toUpperCase() || 'USER'}</Text>
                                </View>
                                <TouchableOpacity onPress={signOut} style={sidebarSt.signOutBtn}>
                                    <Ionicons name="log-out-outline" size={18} color={colors.danger} />
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </Pressable>
            </Animated.View>

            <View style={{ flex: 1, backgroundColor: isDark ? undefined : pageBg, backgroundImage: isDark ? 'linear-gradient(135deg, #09090b 0%, #18181b 100%)' : undefined } as any}>
                {!isDark && (
                    <View style={headerSt.container}>
                        <View style={headerSt.searchBox}>
                            <Ionicons name="search" size={18} color="#94A3B8" />
                            <TextInput
                                style={headerSt.searchInput}
                                placeholder="Search across enterprise..."
                                placeholderTextColor="#94A3B8"
                            />
                        </View>
                        <View style={headerSt.headerActions}>
                            <TouchableOpacity style={headerSt.iconBtn} onPress={toggleTheme}>
                                <Ionicons name="moon-outline" size={20} color="#64748B" />
                            </TouchableOpacity>
                            <TouchableOpacity style={headerSt.iconBtn}>
                                <Ionicons name="notifications-outline" size={20} color="#64748B" />
                            </TouchableOpacity>
                            <View style={headerSt.profileDivider} />
                            <TouchableOpacity style={headerSt.profileBtn} onPress={() => router.push('/admin/profile')}>
                                <View style={headerSt.profileAvatar}>
                                    <Text style={headerSt.profileAvatarTxt}>{user?.firstName?.[0] ?? 'A'}</Text>
                                </View>
                                <View style={headerSt.profileInfo}>
                                    <Text style={headerSt.profileName}>{user?.firstName} {user?.lastName}</Text>
                                    <Text style={headerSt.profileRole}>{user?.role?.toUpperCase() || 'USER'}</Text>
                                </View>
                                <Ionicons name="chevron-down" size={16} color="#64748B" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
                
                <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: isDark ? 40 : 32, flexGrow: 1 }} showsVerticalScrollIndicator={false}>
                    <View style={{ width: '100%', flex: 1 }}>
                        {title ? (
                            <View style={{ marginBottom: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Text style={{ fontSize: isDark ? 24 : 32, fontWeight: isDark ? '800' : '700', color: isDark ? colors.text : '#0F172A', fontFamily: isDark ? undefined : 'Inter' }}>{title}</Text>
                                {isDark && (
                                    <TouchableOpacity style={{ padding: 8, backgroundColor: isDark ? '#18181b' : '#FFFFFF', borderRadius: 8 }} onPress={toggleTheme}>
                                        <Ionicons name="sunny-outline" size={20} color={colors.text} />
                                    </TouchableOpacity>
                                )}
                            </View>
                        ) : null}
                        {children}
                    </View>
                </ScrollView>
            </View>
        </View>
    );
}

export const AdminWebLayout = ({ children, title }: { children: React.ReactNode; title: string }) => <BaseWebLayout title={title} links={ADMIN_LINKS}>{children}</BaseWebLayout>;

const SUPERVISOR_LINKS = [
    { icon: 'home-outline',       label: 'Home',         route: '/supervisor/dashboard', group: 'Overview' },
    { icon: 'calendar-outline',   label: 'Planning',     route: '/supervisor/planning',  group: 'Overview' },
    { icon: 'bar-chart-outline',  label: 'Reports',      route: '/supervisor/reports',   group: 'Overview' },
    { icon: 'person-outline',     label: 'Profile',      route: '/supervisor/profile',   group: 'Overview' },
];
export const SupervisorWebLayout = ({ children, title }: { children: React.ReactNode; title: string }) => <BaseWebLayout title={title} links={SUPERVISOR_LINKS}>{children}</BaseWebLayout>;

const sidebarSt = StyleSheet.create({
    sidebar: { borderRightWidth: 1, paddingVertical: 24 },
    brand: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 22, marginBottom: 32, gap: 12 },
    logoBox: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    logo: { width: 20, height: 20, resizeMode: 'contain' },
    brandName: { flex: 1, fontWeight: '900', letterSpacing: -0.5 },
    themeBtn: { padding: 6, borderRadius: 8, backgroundColor: '#80808010' },
    searchBar: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, marginHorizontal: 16, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, marginBottom: 28, gap: 10 },
    searchHint: { flex: 1, fontSize: 13, fontFamily: Fonts.body },
    groupLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 12, paddingHorizontal: 16 },
    footer: { paddingHorizontal: 16, paddingTop: 16, borderTopWidth: 1, marginTop: 'auto' },
    userRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatar: { width: 36, height: 36, borderRadius: 12, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
    avatarImg: { width: '100%', height: '100%' },
    avatarText: { fontSize: 15, fontWeight: '900' },
    userName: { fontSize: 14, fontWeight: '700' },
    userEmail: { fontSize: 11, fontWeight: '600', opacity: 0.6 },
    signOutBtn: { padding: 8, borderRadius: 10, backgroundColor: '#ef444410' },
});

const headerSt = StyleSheet.create({
    container: { height: 80, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 32 },
    searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', paddingHorizontal: 16, height: 44, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', flex: 1, maxWidth: 400, gap: 12 },
    searchInput: { flex: 1, fontSize: 14, color: '#0F172A', fontFamily: 'Inter', outlineStyle: 'none' } as any,
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    iconBtn: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
    profileDivider: { width: 1, height: 24, backgroundColor: '#E2E8F0', marginHorizontal: 8 },
    profileBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12 },
    profileAvatar: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#DBEAFE' },
    profileAvatarTxt: { color: '#3B82F6', fontSize: 16, fontWeight: '700' },
    profileInfo: { marginRight: 8 },
    profileName: { fontSize: 14, fontWeight: '600', color: '#0F172A', fontFamily: 'Inter' },
    profileRole: { fontSize: 12, color: '#64748B', fontFamily: 'Inter' },
});


