import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
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
  Pressable
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AdminWebLayout } from '@/components/admin/WebLayout';
import PremiumGlowButton from '@/components/ui/PremiumGlowButton';
import { getFullImageUrl } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { DARK_COLORS, LIGHT_COLORS } from '@/constants/appColors';
import { Fonts } from '@/hooks/useFonts';
import { GMS, GMSService } from '@/services/gms.service';
import { ExportService } from '@/services/export.service';
import { MAP_DEFAULTS } from '@/config/mainMap';
import AppMapView, { Marker } from '@/components/AppMapView';
import { Report, ReportService } from '@/services/report.service';
import { AdminStats, StatsService } from '@/services/stats.service';
import { UserService } from '@/services/user.service';
import { User } from '@/types/auth';
import ExecutiveKPI from '@/components/admin/ExecutiveKPI';
import PerformanceLeaderboard from '@/components/admin/PerformanceLeaderboard';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/hooks/useToast';
import WebPerformanceChart from '@/components/ui/WebPerformanceChart';

// ── Helpers ──────────────────────────────────────────────────────────────────
function isWithinDays(dateStr: string, days: number) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return new Date(dateStr) >= cutoff;
}

function getRelativeTime(dateStr: string) {
  const h = Math.round((Date.now() - new Date(dateStr).getTime()) / 3_600_000);
  if (h < 1) return 'Just now';
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'Yesterday';
  return d < 7 ? `${d} days ago` : new Date(dateStr).toLocaleDateString();
}

function buildChartData(reports: Report[], stores: any[], period: 'weekly' | 'monthly') {
  if (period === 'weekly') {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const label = d.toLocaleDateString('en', { weekday: 'short' });
      const dayStr = d.toISOString().slice(0, 10);
      const dayReports = reports.filter(r => r.created_at?.slice(0, 10) === dayStr);
      
      return { 
        label, 
        visits: dayReports.length * 2 + Math.floor(Math.random() * 5), // Mock dual data based on reports
        objectives: dayReports.length + Math.floor(Math.random() * 3)
      };
    });
  }

  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const label = d.toLocaleDateString('en', { month: 'short' });
    const yr = d.getFullYear(), mo = d.getMonth();
    const moReports = reports.filter(r => {
      const rd = new Date(r.created_at);
      return rd.getFullYear() === yr && rd.getMonth() === mo;
    });

    return { 
      label, 
      visits: moReports.length * 2 + Math.floor(Math.random() * 10), 
      objectives: moReports.length + Math.floor(Math.random() * 5)
    };
  });
}

const AnimatedBar = ({ value, maxValue, color, delay }: { value: number; maxValue: number; color: string; delay: number }) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.spring(anim, { toValue: maxValue > 0 ? (value / maxValue) * 100 : 0, friction: 8, tension: 45, useNativeDriver: false }),
    ]).start();
  }, [value, maxValue]);
  return (
    <Animated.View style={{
      width: 14, borderRadius: 4,
      backgroundColor: color,
      height: anim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
    }} />
  );
};

const AnimatedProgressBar = ({ pct, color }: { pct: number; color: string }) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: pct, duration: 700, useNativeDriver: false }).start();
  }, [pct]);
  return (
    <View style={{ height: 6, borderRadius: 3, backgroundColor: color + '25', overflow: 'hidden', marginTop: 6 }}>
      <Animated.View style={{
        height: '100%', borderRadius: 3, backgroundColor: color,
        width: anim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
      }} />
    </View>
  );
};

const HoverStatCard = ({ title, value, icon, trend, trendUp, COLOR, onPress }: any) => {
  const scale = useRef(new Animated.Value(1)).current;
  const hoverIn = () => Animated.spring(scale, { toValue: 1.025, friction: 7, tension: 40, useNativeDriver: true }).start();
  const hoverOut = () => Animated.spring(scale, { toValue: 1, friction: 7, tension: 40, useNativeDriver: true }).start();
  return (
    <View
      style={{ flex: 1, cursor: 'pointer' } as any}
      {...{
        onMouseEnter: hoverIn,
        onMouseLeave: hoverOut
      } as any}
    >
      <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={{ flex: 1 }}>
        <Animated.View style={[wSt.statCard, { backgroundColor: COLOR.card, borderColor: COLOR.border, transform: [{ scale }] }]}>
          <View style={wSt.statRow}>
            <Text style={[wSt.statTitle, { color: COLOR.textMuted }]}>{title}</Text>
            <View style={[wSt.iconBox, { backgroundColor: COLOR.surface }]}>
              <Ionicons name={icon} size={15} color={COLOR.textMuted} />
            </View>
          </View>
          <Text style={[wSt.statValue, { color: COLOR.text }]}>{value}</Text>
          <View style={[wSt.trendBadge, { backgroundColor: trendUp ? COLOR.success + '22' : COLOR.warning + '22' }]}>
            <Ionicons name={trendUp ? 'trending-up' : 'trending-down'} size={12} color={trendUp ? COLOR.success : COLOR.warning} />
            <Text style={[wSt.trendTxt, { color: trendUp ? COLOR.success : COLOR.warning }]}>{trend}</Text>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

const HoverRow = ({ children, COLOR, onPress }: any) => {
  const bg = useRef(new Animated.Value(0)).current;
  return (
    <Pressable
      onPress={onPress}
      {...{
        onMouseEnter: () => Animated.timing(bg, { toValue: 1, duration: 150, useNativeDriver: false }).start(),
        onMouseLeave: () => Animated.timing(bg, { toValue: 0, duration: 150, useNativeDriver: false }).start()
      } as any}
      style={({ pressed }) => [{ cursor: 'pointer', opacity: pressed ? 0.9 : 1 } as any]}
    >
      <Animated.View style={[
        wSt.tableRow, { borderBottomColor: COLOR.border },
        { backgroundColor: bg.interpolate({ inputRange: [0, 1], outputRange: ['transparent', COLOR.surface + '80'] }) }
      ]}>
        {children}
      </Animated.View>
    </Pressable>
  );
};

const DashboardRow = ({ u, COLOR, router, isDark, setConfirmDelete }: any) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const firstName = u.first_name || u.firstName || '';
  const lastName = u.last_name || u.lastName || '';
  const status = u.status || 'active';
  const statusColor = status === 'active' ? COLOR.success : status === 'inactive' ? COLOR.danger : COLOR.warning;
  const profileImg = u.profile_image || u.profileImage;
  
  return (
    <HoverRow COLOR={COLOR} onPress={() => router.push(`/admin/users?edit=${u.id}`)}>
      {/* 1. MEMBER */}
      <View style={{ flex: 2.5, flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: COLOR.primary + '30', borderWidth: 1, borderColor: COLOR.primary + '50', justifyContent: 'center', alignItems: 'center', marginRight: 12, overflow: 'hidden', position: 'relative' }}>
          {profileImg ? (
            <Image source={{ uri: getFullImageUrl(profileImg) || '' }} style={{ width: 32, height: 32 }} />
          ) : (
            <Text style={{ color: COLOR.primary, fontSize: 14, fontFamily: Fonts.headingSemiBold }}>{firstName?.[0] || '?'}</Text>
          )}
        </View>
        <View>
          <Text style={{ color: COLOR.text, fontSize: 13, fontFamily: Fonts.headingSemiBold }} numberOfLines={1}>{firstName} {lastName}</Text>
          <Text style={{ color: COLOR.textMuted, fontSize: 11, marginTop: 2 }}>{u.email}</Text>
        </View>
      </View>
      
      {/* 2. ADDRESS */}
      <Text style={{ flex: 1.5, color: COLOR.textMuted, fontSize: 13 }} numberOfLines={1}>{u.address || "-"}</Text>

      {/* 3. PHONE */}
      <Text style={{ flex: 1.5, color: COLOR.textMuted, fontSize: 13 }} numberOfLines={1}>{u.phone || "-"}</Text>

      {/* 4. JOB TITLE */}
      <View style={{ flex: 1.5 }}>
        <View style={{ alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: u.role === 'admin' ? COLOR.danger + '20' : u.role === 'supervisor' ? COLOR.warning + '20' : COLOR.primary + '20' }}>
          <Text style={{ fontSize: 11, color: u.role === 'admin' ? COLOR.danger : u.role === 'supervisor' ? COLOR.warning : COLOR.primary, fontWeight: '700', textTransform: 'capitalize' }}>{u.role}</Text>
        </View>
      </View>

      {/* 5. ASSIGNMENT (SUPERVISOR) */}
      <View style={{ flex: 1.5, paddingRight: 10, zIndex: 99 }}>
        {u.role === 'admin' ? (
          <Text style={{ color: COLOR.textMuted, fontSize: 13 }}>N/A</Text>
        ) : u.role === 'supervisor' ? (
          <Text style={{ color: COLOR.textMuted, fontSize: 13, fontStyle: 'italic' }}>Team lead</Text>
        ) : (
          <View style={{ position: 'relative' }}>
            <TouchableOpacity 
              style={{ borderWidth: 1, borderColor: COLOR.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: isDark ? '#18181b' : '#f4f4f5', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
              onPress={(e) => {
                e.stopPropagation();
                // @ts-ignore
                if (e.nativeEvent) e.nativeEvent.stopImmediatePropagation?.();
                setMenuOpen(!menuOpen);
              }}
            >
              <Text style={{ color: COLOR.text, fontSize: 12 }}>Unassigned</Text>
              <Ionicons name="chevron-down" size={12} color={COLOR.textMuted} />
            </TouchableOpacity>
            {menuOpen && (
              <View style={{ position: 'absolute', top: 35, left: 0, right: 0, backgroundColor: isDark ? '#1f2937' : '#ffffff', borderWidth: 1, borderColor: COLOR.border, borderRadius: 8, zIndex: 1000, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10 }}>
                <TouchableOpacity style={{ padding: 10, borderBottomWidth: 1, borderBottomColor: COLOR.border }} onPress={(e) => { e.stopPropagation(); setMenuOpen(false); }}>
                  <Text style={{ color: COLOR.text, fontSize: 12 }}>Unassign</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ padding: 10 }} onPress={(e) => { e.stopPropagation(); setMenuOpen(false); }}>
                  <Text style={{ color: COLOR.text, fontSize: 12 }}>Select Supervisor...</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>
      
      {/* 6. STATUS */}
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: statusColor, marginRight: 6 }} />
          <Text style={{ color: COLOR.textMuted, fontSize: 12, textTransform: 'capitalize' }}>{status}</Text>
        </View>
      </View>

      {/* 7. ACTIONS */}
      <View style={{ width: 80, alignItems: 'flex-end' }}>
        <ActionMenu
          u={{ ...u, firstName, lastName }}
          router={router}
          COLOR={COLOR}
          onDeletePress={(e: any) => {
            e.stopPropagation();
            setConfirmDelete({ visible: true, user: { ...u, firstName, lastName } });
          }}
        />
      </View>
    </HoverRow>
  );
};

const ActionMenu = ({ u, router, COLOR, onDeletePress }: any) => {
  return (
    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'flex-end' }}>
      <TouchableOpacity
        style={{ padding: 6, borderRadius: 8, backgroundColor: COLOR.primary + '15' }}
        onPress={(e: any) => {
          e.stopPropagation();
          router.push(`/admin/users?edit=${u.id}`);
        }}
      >
        <Ionicons name="pencil" size={14} color={COLOR.primary} />
      </TouchableOpacity>
      <TouchableOpacity
        style={{ padding: 6, borderRadius: 8, backgroundColor: COLOR.danger + '15' }}
        onPress={(e: any) => {
          e.stopPropagation();
          if (onDeletePress) onDeletePress(e);
        }}
      >
        <Ionicons name="trash" size={14} color={COLOR.danger} />
      </TouchableOpacity>
    </View>
  );
};

const getDonutSegments = (COLOR: any) => [
  { role: 'admin',        label: 'Admin',        color: COLOR.danger },
  { role: 'supervisor',   label: 'Supervisor',   color: COLOR.warning },
  { role: 'merchandiser', label: 'Merchandiser', color: COLOR.primary },
];

const DonutChart = ({ users, COLOR }: { users: any[]; COLOR: any }) => {
  const circleRef = useRef<any>(null);
  const hoverScale = useRef(new Animated.Value(1)).current;

  const total = users.filter((u: any) => {
    const name = `${u.first_name || u.firstName || ''} ${u.last_name || u.lastName || ''}`;
    const isDemo = name.startsWith("Demo") || name.endsWith("Demo User") || (u.email || '').toLowerCase().includes('demo') || u.status === 'demo';
    return !isDemo;
  }).length || 1;

  const segments = getDonutSegments(COLOR).map(s => ({
    ...s,
    count: users.filter((u: any) => {
      const name = `${u.first_name || u.firstName || ''} ${u.last_name || u.lastName || ''}`;
      const isDemo = name.endsWith("Demo User") || (u.email || '').toLowerCase().includes('demo');
      return u.role === s.role && !isDemo;
    }).length,
    pct: Math.round((users.filter((u: any) => {
      const name = `${u.first_name || u.firstName || ''} ${u.last_name || u.lastName || ''}`;
      const isDemo = name.endsWith("Demo User") || (u.email || '').toLowerCase().includes('demo');
      return u.role === s.role && !isDemo;
    }).length / total) * 100),
  }));

  const radius = 65;
  const circumference = 2 * Math.PI * radius;

  // Animate the mask circle via CSS on mount
  useEffect(() => {
    if (Platform.OS !== 'web' || !circleRef.current) return;
    const el = circleRef.current;
    el.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)';
    el.style.strokeDashoffset = `${circumference}`;
    // Trigger animation on next frame
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.strokeDashoffset = '0';
      });
    });
  }, [total]);

  const scale = hoverScale.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] });

  // Build conic-gradient stops for the coloured segments
  let cumulative = 0;
  const stops = segments.map(s => {
    const from = cumulative;
    const to = cumulative + s.pct;
    cumulative = to;
    return `${s.color} ${from}% ${to}%`;
  }).join(', ');

  return (
    <View
      {...{
        onMouseEnter: () => Animated.spring(hoverScale, { toValue: 1, friction: 7, tension: 40, useNativeDriver: false }).start(),
        onMouseLeave: () => Animated.spring(hoverScale, { toValue: 0, friction: 7, tension: 40, useNativeDriver: false }).start()
      } as any}
    >
      <View style={{ alignItems: 'center', marginBottom: 16 }}>
        <Animated.View style={{ width: 160, height: 160, alignItems: 'center', justifyContent: 'center', transform: [{ scale }] }}>
          {Platform.OS === 'web' ? (
            <svg width="160" height="160" viewBox="0 0 160 160" style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' } as any}>
              {/* Coloured segments (background) */}
              <circle
                cx="80" cy="80" r={radius}
                fill="transparent"
                stroke="transparent"
                strokeWidth="20"
              />
              {segments.map((s, i) => {
                let segOffset = 0;
                for (let j = 0; j < i; j++) segOffset += (segments[j].pct / 100) * circumference;
                return (
                  <circle
                    key={s.role}
                    cx="80" cy="80" r={radius}
                    fill="transparent"
                    stroke={s.color}
                    strokeWidth="20"
                    strokeDasharray={`${(s.pct / 100) * circumference} ${circumference}`}
                    strokeDashoffset={-segOffset}
                  />
                );
              })}
              {/* Sweep mask circle — animates from full to 0 via CSS transition */}
              <circle
                ref={circleRef}
                cx="80" cy="80" r={radius}
                fill="transparent"
                stroke="#0d1117"
                strokeWidth="22"
                strokeDasharray={`${circumference} ${circumference}`}
                strokeDashoffset={circumference}
              />
            </svg>
          ) : (
            <View style={{ width: 160, height: 160, borderRadius: 80, borderWidth: 20, borderColor: COLOR.primary }} />
          )}
          {/* Centre label */}
          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: COLOR.textMuted, fontSize: 11, fontFamily: Fonts.body }}>Total</Text>
            <Text style={{ color: COLOR.text, fontSize: 22, fontFamily: Fonts.heading }}>{total}</Text>
          </View>
        </Animated.View>
      </View>
      {/* Legend */}
      <View style={{ gap: 8 }}>
        {segments.map(s => (
          <View key={s.role} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: s.color }} />
              <Text style={{ color: COLOR.textMuted, fontSize: 13, fontFamily: Fonts.body }}>{s.label}</Text>
            </View>
            <Text style={{ color: COLOR.text, fontSize: 13, fontFamily: Fonts.headingSemiBold }}>
              {s.count} <Text style={{ color: COLOR.textMuted, fontFamily: Fonts.body }}>({s.pct}%)</Text>
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

export default function AdminDashboard() {
  const router = useRouter();
  const { signOut, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const COLOR = isDark ? DARK_COLORS : LIGHT_COLORS;
  const { showToast, ToastContainer } = useToast();

  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allReports, setAllReports] = useState<Report[]>([]);
  const [allGms, setAllGms] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  // ── Grab browser geolocation for the live map ───────────────────────────
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (!navigator?.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      pos => setUserLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => setUserLocation({ latitude: 36.8065, longitude: 10.1815 }) // fallback: Tunis
    );
  }, []);

  const [confirmDelete, setConfirmDelete] = useState<{ visible: boolean; user: any | null }>({ visible: false, user: null });
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('weekly');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [tablePage, setTablePage] = useState(1);
  const PAGE_SIZE = 8;

  const mounted = useRef(true);
  useEffect(() => {
    return () => { mounted.current = false; };
  }, []);

  const loadData = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const [users, reports, stores, dbStats, kpiStats] = await Promise.all([
        UserService.getAll({ skip: 0, limit: 200 }),
        ReportService.getAll({ skip: 0, limit: 200 }),
        GMSService.getAll({ skip: 0, limit: 500 }),
        StatsService.getAdminStats(),
        StatsService.getKPIStats('today')
      ]);
      if (!mounted.current) return;
      setAllUsers(users as unknown as User[]);
      setAllReports(reports);
      setAllGms(stores);
      setStats({ ...dbStats, ...kpiStats } as any);
    } catch (e) {
      console.error(e);
    } finally {
      if (mounted.current) setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const chartData = buildChartData(allReports, allGms, period);

  const periodDays = period === 'weekly' ? 7 : 30;
  const periodReports = allReports.filter(r => isWithinDays(r.created_at, periodDays));
  const approved = periodReports.filter(r => r.status === 'approved').length;
  const pending = periodReports.filter(r => r.status === 'pending').length;
  const rejected = periodReports.filter(r => r.status === 'rejected').length;
  const total = periodReports.length;
  const pct = (n: number) => total > 0 ? Math.round((n / total) * 100) : 0;

  const filteredUsers = allUsers.filter((u: any) => {
    const fn = u.first_name || u.firstName || '';
    const ln = u.last_name || u.lastName || '';
    const name = `${fn} ${ln}`.toLowerCase();
    const matchSearch = name.includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRole = roleFilter === 'All' || u.role.toLowerCase() === roleFilter.toLowerCase();
    const userStatus = u.status || 'active';
    const matchStatus = statusFilter === 'All' || userStatus.toLowerCase() === statusFilter.toLowerCase();
    const fullNameStr = `${fn} ${ln}`;
    const isDemo = fullNameStr.startsWith("Demo") || fullNameStr.endsWith("Demo User") || (u.email || '').toLowerCase().includes('demo') || u.status === 'demo';
    return matchSearch && matchRole && matchStatus && !isDemo;
  });
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const safePage = Math.min(tablePage, totalPages);
  const pageUsers = filteredUsers.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const adminName = user ? `${(user as any).first_name || user.firstName || ''} ${(user as any).last_name || user.lastName || ''}`.trim() || 'Admin' : 'Admin';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <AdminWebLayout title={``}>
      <ToastContainer />
      <ConfirmDialog
        visible={confirmDelete.visible}
        title="Delete Member"
        message={`Are you sure you want to delete ${confirmDelete.user?.firstName} ${confirmDelete.user?.lastName}? This cannot be undone.`}
        variant="danger"
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={() => {
          const user = confirmDelete.user;
          // 1. Close immediately
          setConfirmDelete({ visible: false, user: null });
          if (!user) return;
          // 2. Optimistic remove
          setAllUsers((prev: any[]) => prev.filter((u: any) => u.id !== user.id));
          // 3. Background delete
          UserService.delete(user.id)
            .then(() => showToast(`${user.firstName} ${user.lastName} deleted`, 'success'))
            .catch((err: any) => {
              showToast(err?.message || 'Failed to delete — please try again', 'error');
              loadData(true);
            });
        }}
        onClose={() => setConfirmDelete({ visible: false, user: null })}
      />
      <View>
        <View style={wSt.pageHeader}>
          <View>
            <Text style={[wSt.greeting, { color: COLOR.text }]}>{greeting}, {adminName} , Here is your Overview</Text>
            <Text style={[wSt.greetingSub, { color: COLOR.textMuted }]}>
              {new Date().toLocaleDateString('en', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <TouchableOpacity
              style={[wSt.iconActionBtn, { borderColor: COLOR.border, backgroundColor: COLOR.card }]}
              onPress={toggleTheme}
            >
              <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={18} color={COLOR.text} />
            </TouchableOpacity>

            <PremiumGlowButton
              title="Export"
              onPress={() => ExportService.downloadDailyReport(new Date().toISOString().slice(0, 10))}
              icon="download-outline"
              variant="glass"
              style={{ minWidth: 100, height: 40 }}
              pulse={false}
            />
          </View>
        </View>

        <ExecutiveKPI COLOR={COLOR} role="admin" />{/*stats={stats}*/}
        
        {/* NEW ROW: Performance Leaderboard */}
        <PerformanceLeaderboard stats={stats} router={router} />

        {/* ROW 1: Performance Trend & Critical Alerts */}
        <View style={[wSt.midRow, { gap: 20, marginBottom: 20 }]}>
          {/* Performance Trend Chart */}
          <View style={[wSt.card, { flex: 2, backgroundColor: '#18181b', borderColor: '#27272a', padding: 24 }]}>
            <View style={wSt.cardHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="stats-chart" size={18} color="#a78bfa" />
                <Text style={[wSt.cardTitle, { color: '#fff' }]}>Performance Trend</Text>
              </View>
              <View style={[wSt.pillToggle, { backgroundColor: '#0d1117', borderColor: '#27272a' }]}>
                {(['weekly', 'monthly'] as const).map(p => (
                  <TouchableOpacity
                    key={p}
                    onPress={() => setPeriod(p)}
                    style={[wSt.pillBtn, period === p && { backgroundColor: '#a78bfa30', borderColor: '#a78bfa50', borderWidth: 1 }]}
                  >
                    <Text style={[wSt.pillTxt, { color: period === p ? '#d8b4fe' : '#71717a' }]}>
                      {p === 'weekly' ? 'Weekly' : 'Monthly'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={{ height: 280, marginTop: 20 }}>
              <WebPerformanceChart data={chartData} />
            </View>
          </View>

          {/* Right Column: Alerts & Recent */}
          <View style={{ flex: 1, gap: 20 }}>
            {/* Critical Alerts */}
            <View style={[wSt.card, { flex: 1, backgroundColor: '#18181b', borderColor: '#27272a', padding: 20 }]}>
              <View style={[wSt.cardHeader, { marginBottom: 16 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="warning" size={18} color="#ef4444" />
                  <Text style={[wSt.cardTitle, { color: '#fff' }]}>Critical Alerts</Text>
                </View>
              </View>
              
              <ScrollView showsVerticalScrollIndicator={false}>
                {[
                  { id: 1, type: 'stock', title: 'Out of Stock (Rupture)', desc: 'Coca-Cola Zero at Carrefour Market', time: '10 mins ago', icon: 'cart-outline', color: '#ef4444' },
                  { id: 2, type: 'gps', title: 'GPS Disabled', desc: 'Ahmed T. (Store 402)', time: '25 mins ago', icon: 'location-outline', color: '#f59e0b' },
                ].map((alert, i) => (
                  <TouchableOpacity 
                    key={alert.id} 
                    onPress={() => router.push('/admin/notifications')}
                    style={{
                      backgroundColor: alert.color + '10',
                      borderWidth: 1,
                      borderColor: alert.color + '30',
                      borderLeftWidth: 3,
                      borderLeftColor: alert.color,
                      borderRadius: 12,
                      padding: 12,
                      marginBottom: 12,
                      flexDirection: 'row',
                      gap: 12,
                      alignItems: 'center'
                    } as any}
                  >
                    <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: alert.color + '20', justifyContent: 'center', alignItems: 'center' }}>
                      <Ionicons name={alert.icon as any} size={16} color={alert.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: alert.color, fontSize: 13, fontWeight: '700', marginBottom: 2 }}>{alert.title}</Text>
                      <Text style={{ color: '#d4d4d8', fontSize: 12 }}>{alert.desc}</Text>
                      <Text style={{ color: '#71717a', fontSize: 10, marginTop: 4 }}>Reported {alert.time}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Latest Activities */}
            <View style={[wSt.card, { flex: 1, backgroundColor: '#18181b', borderColor: '#27272a', padding: 20 }]}>
              <View style={[wSt.cardHeader, { marginBottom: 12 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="time" size={18} color="#3b82f6" />
                  <Text style={[wSt.cardTitle, { color: '#fff' }]}>Latest Activities</Text>
                </View>
                <TouchableOpacity onPress={() => router.push('/admin/before-after')}>
                  <Text style={{ fontSize: 12, color: '#3b82f6', fontWeight: '600' }}>View All</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                {allReports.slice(0, 3).map(r => (
                  <TouchableOpacity key={r.id} onPress={() => router.push(`/admin/before-after?id=${r.id}`)}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#ffffff10' }}>
                      <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: r.status === 'approved' ? '#10b98120' : r.status === 'rejected' ? '#ef444420' : '#f59e0b20', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                        <Ionicons
                          name={r.status === 'approved' ? 'checkmark' : r.status === 'rejected' ? 'close' : 'time'}
                          size={16}
                          color={r.status === 'approved' ? '#10b981' : r.status === 'rejected' ? '#ef4444' : '#f59e0b'}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }} numberOfLines={1}>{r.name}</Text>
                        <Text style={{ color: '#a1a1aa', fontSize: 11, marginTop: 2 }}>{r.type} · {getRelativeTime(r.created_at)}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
                {!loading && allReports.length === 0 && (
                  <Text style={{ color: '#71717a', textAlign: 'center', marginTop: 20, fontSize: 12 }}>No recent activities.</Text>
                )}
              </ScrollView>
            </View>
          </View>
        </View>



        <View style={[wSt.midRow, { gap: 20, marginBottom: 20 }]}>
          {/* Live Map */}
          <View style={[wSt.card, { flex: 2, backgroundColor: '#18181b', borderColor: '#27272a', padding: 0, overflow: 'hidden' }]}>
            <View style={{ padding: 24, borderBottomWidth: 1, borderBottomColor: '#27272a', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Ionicons name="map" size={18} color="#34d399" />
              <Text style={[wSt.cardTitle, { color: '#fff', marginBottom: 0 }]}>Live Map (GPS tracking)</Text>
            </View>
            <View style={{ height: 420, backgroundColor: '#0d1117' }}>
              {Platform.OS === 'web' ? (
                <AppMapView
                    scrollEnabled={true}
                    zoomEnabled={true}
                    showStyleSelector={true}
                    showControls={true}
                    clusters={allGms.length > 8}
                    autoFit={false}
                    initialRegion={{
                        latitude:  30.0,
                        longitude: -40.0,
                        latitudeDelta:  100,
                        longitudeDelta: 100,
                        zoom: 1.5,
                    } as any}
                >
                    {userLocation && (
                        <Marker coordinate={{ latitude: userLocation.latitude, longitude: userLocation.longitude }} title="You are here" />
                    )}
                    {allGms.filter((s:any)=>s.latitude&&s.longitude).map((store:any)=>(
                        <Marker key={store.id} coordinate={{ latitude: store.latitude, longitude: store.longitude }} title={store.name} description={`${store.type} · ${store.city}`} pinColor={store.type==='Hypermarket'?'green':'blue'} />
                    ))}
                </AppMapView>
              ) : (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                  <Ionicons name="map" size={48} color="#71717a" />
                  <Text style={{ color: '#71717a', marginTop: 12 }}>Map rendering on mobile...</Text>
                </View>
              )}
            </View>
          </View>

          {/* User Distribution */}
          <View style={[wSt.card, { flex: 1, backgroundColor: '#18181b', borderColor: '#27272a', alignItems: 'center', padding: 24 }]}>
            <View style={[wSt.cardHeader, { marginBottom: 16, width: '100%' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="pie-chart" size={18} color="#f472b6" />
                <Text style={[wSt.cardTitle, { color: '#fff' }]}>User Distribution</Text>
              </View>
            </View>
            <View style={{ width: '100%', maxWidth: 400 }}>
                <DonutChart users={allUsers} COLOR={COLOR} />
            </View>
          </View>
        </View>

        <View style={[wSt.card, { backgroundColor: COLOR.card, borderColor: COLOR.border, padding: 0, overflow: 'hidden' }]}>
          <View style={[wSt.toolbar, { borderBottomColor: COLOR.border }]}>
            <View style={[wSt.searchBox, { backgroundColor: isDark ? '#18181b' : '#f4f4f5', borderColor: COLOR.border }]}>
              <Ionicons name="search" size={15} color={COLOR.textMuted} />
              <TextInput
                style={[wSt.searchInput, { color: COLOR.text, outlineStyle: 'none' } as any]}
                placeholder="Search members..."
                placeholderTextColor={COLOR.textMuted}
                value={searchQuery}
                onChangeText={t => { setSearchQuery(t); setTablePage(1); }}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => { setSearchQuery(''); setTablePage(1); }}>
                  <Ionicons name="close-circle" size={16} color={COLOR.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              {(['All', 'Supervisor', 'Merchandiser']).map(r => (
                <TouchableOpacity
                  key={r}
                  style={[wSt.chip, { borderColor: COLOR.border }, roleFilter === r && { backgroundColor: COLOR.text, borderColor: COLOR.text }]}
                  onPress={() => { setRoleFilter(r); setTablePage(1); }}
                >
                  <Text style={[wSt.chipTxt, { color: roleFilter === r ? (isDark ? COLOR.bg : '#fff') : COLOR.textMuted }]}>{r}</Text>
                </TouchableOpacity>
              ))}
              <View style={{ width: 1, height: 20, backgroundColor: COLOR.border, marginHorizontal: 4 }} />
              {(['All', 'Active', 'Inactive']).map(s => (
                <TouchableOpacity
                  key={s}
                  style={[wSt.chip, { borderColor: COLOR.border }, statusFilter === s && { backgroundColor: COLOR.surface }]}
                  onPress={() => { setStatusFilter(s); setTablePage(1); }}
                >
                  <Text style={[wSt.chipTxt, { color: statusFilter === s ? COLOR.text : COLOR.textMuted }]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={[wSt.tableHeader, { borderBottomColor: COLOR.border, backgroundColor: isDark ? '#ffffff03' : '#00000003' }]}>
            <Text style={[wSt.th, { color: COLOR.textMuted, flex: 2.5 }]}>MEMBER</Text>
            <Text style={[wSt.th, { color: COLOR.textMuted, flex: 1.5 }]}>ADDRESS</Text>
            <Text style={[wSt.th, { color: COLOR.textMuted, flex: 1.5 }]}>PHONE</Text>
            <Text style={[wSt.th, { color: COLOR.textMuted, flex: 1.5 }]}>JOB TITLE</Text>
            <Text style={[wSt.th, { color: COLOR.textMuted, flex: 1.5 }]}>ASSIGNMENT</Text>
            <Text style={[wSt.th, { color: COLOR.textMuted, flex: 1 }]}>STATUS</Text>
            <Text style={[wSt.th, { color: COLOR.textMuted, width: 80, textAlign: 'right' }]}>ACTIONS</Text>
          </View>

          {pageUsers.map((u, i) => (
            <DashboardRow key={u.id ?? i} u={u} COLOR={COLOR} router={router} isDark={isDark} setConfirmDelete={setConfirmDelete} />
          ))}

          {pageUsers.length === 0 && (
            <View style={{ padding: 48, alignItems: 'center' }}>
              <Ionicons name="people-outline" size={40} color={COLOR.textMuted} style={{ marginBottom: 12 }} />
              <Text style={{ color: COLOR.textMuted, fontFamily: Fonts.body }}>No members match your filters.</Text>
            </View>
          )}

          <View style={[wSt.paginator, { borderTopColor: COLOR.border }]}>
            <Text style={{ color: COLOR.textMuted, fontSize: 13, fontFamily: Fonts.body }}>
              {pageUsers.length > 0 ? `${(safePage - 1) * PAGE_SIZE + 1}–${Math.min(safePage * PAGE_SIZE, filteredUsers.length)}` : '0'} of {filteredUsers.length} results
            </Text>
            <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
              <TouchableOpacity
                style={[wSt.btnOutline, { borderColor: COLOR.border, opacity: safePage <= 1 ? 0.4 : 1, paddingVertical: 6, paddingHorizontal: 10 }]}
                disabled={safePage <= 1}
                onPress={() => setTablePage(p => p - 1)}
              >
                <Ionicons name="chevron-back" size={14} color={COLOR.text} />
              </TouchableOpacity>
              
              {Array.from({ length: totalPages }).map((_, i) => {
                const pageNum = i + 1;
                // Show max 5 pages, centered around current page
                if (totalPages > 5 && (pageNum < safePage - 2 || pageNum > safePage + 2)) {
                  if (pageNum === 1 || pageNum === totalPages) return <Text key={pageNum} style={{ color: COLOR.textMuted }}>...</Text>;
                  return null;
                }
                return (
                  <TouchableOpacity
                    key={pageNum}
                    style={[{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 }, safePage === pageNum && { backgroundColor: COLOR.primary + '20' }]}
                    onPress={() => setTablePage(pageNum)}
                  >
                    <Text style={{ color: safePage === pageNum ? COLOR.primary : COLOR.text, fontSize: 13, fontWeight: safePage === pageNum ? '700' : '500' }}>
                      {pageNum}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              <TouchableOpacity
                style={[wSt.btnOutline, { borderColor: COLOR.border, opacity: safePage >= totalPages ? 0.4 : 1, paddingVertical: 6, paddingHorizontal: 10 }]}
                disabled={safePage >= totalPages}
                onPress={() => setTablePage(p => p + 1)}
              >
                <Ionicons name="chevron-forward" size={14} color={COLOR.text} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </AdminWebLayout>
  );
}

const wSt = StyleSheet.create({
  pageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
  greeting: { fontSize: 26, fontFamily: Fonts.heading, marginBottom: 4 },
  greetingSub: { fontSize: 13, fontFamily: Fonts.body },
  iconActionBtn: { width: 38, height: 38, borderRadius: 10, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  btnOutline: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 9, flexDirection: 'row', alignItems: 'center' },
  btnSolid: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 9, flexDirection: 'row', alignItems: 'center' },
  btnTxt: { fontSize: 13, fontFamily: Fonts.headingSemiBold },
  kpiRow: { flexDirection: 'row', gap: 16, marginBottom: 20 },
  statCard: { borderWidth: 1, borderRadius: 16, padding: 20, flex: 1 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  statTitle: { fontSize: 13, fontFamily: Fonts.body },
  iconBox: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  statValue: { fontSize: 30, fontFamily: Fonts.heading, marginBottom: 10 },
  trendBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
  trendTxt: { fontSize: 12, fontFamily: Fonts.secondaryBold },
  midRow: { flexDirection: 'row' },
  card: { borderWidth: 1, borderRadius: 16, padding: 22 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 15, fontFamily: Fonts.headingSemiBold },
  pillToggle: { flexDirection: 'row', borderWidth: 1, borderRadius: 20, overflow: 'hidden', padding: 3 },
  pillBtn: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 16, alignItems: 'center' },
  pillTxt: { fontSize: 12, fontFamily: Fonts.headingSemiBold },
  toolbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  searchBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, width: 240, gap: 8 },
  searchInput: { flex: 1, fontSize: 13, fontFamily: Fonts.body, padding: 0 },
  chip: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  chipTxt: { fontSize: 12, fontFamily: Fonts.headingSemiBold },
  tableHeader: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1 },
  th: { fontSize: 11, fontFamily: Fonts.secondaryBold, textTransform: 'uppercase', letterSpacing: 0.5 },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
  moreBtn: { padding: 6, borderRadius: 8, borderWidth: 1 },
  paginator: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderTopWidth: 1 },
});
