import { AdminWebLayout } from "@/components/admin/WebLayout";
import { ListSkeleton } from "@/components/ui/LoadingSkeleton";
import {
    WebButton,
    WebCard,
    WebChip,
    WebTableHeader,
} from "@/components/ui/WebPrimitives";
import { getFullImageUrl } from "@/constants/api";
import { DARK_COLORS, LIGHT_COLORS } from "@/constants/appColors";
import { useTheme } from "@/context/ThemeContext";
import { Fonts } from "@/hooks/useFonts";
import { useWebTheme } from "@/hooks/useWebTheme";
import { UserService, UserUpdateData } from "@/services/user.service";
import { User } from "@/types/auth";
import { Ionicons } from "@expo/vector-icons";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import AppMapView, { Marker } from "@/components/AppMapView";
import { MAP_DEFAULTS } from "@/config/mainMap";
import { LocationService } from "@/services/location.service";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import React from "react";
import { useToast } from "@/hooks/useToast";
import {
    ActivityIndicator,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Platform,
} from "react-native";

export default function AdminUsersPage() {
  const router = useRouter();
  const { showToast, ToastContainer } = useToast();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const COLOR = isDark ? DARK_COLORS : LIGHT_COLORS;
  const { T } = useWebTheme();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [importMenuOpen, setImportMenuOpen] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [trackingModalVisible, setTrackingModalVisible] = useState(false);
  const [trackingHistory, setTrackingHistory] = useState<{logs: any[], visits: any[], workdays: any[]}>({logs: [], visits: [], workdays: []});
  const [isFetchingTracking, setIsFetchingTracking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ visible: boolean; userId: number | null; userName: string }>({ visible: false, userId: null, userName: '' });
  const [newUser, setNewUser] = useState<{
    email: string;
    first_name: string;
    last_name: string;
    password: string;
    role: string;
    status: string;
    phone: string;
    address: string;
    tags: string;
    supervisor_id?: number;
  }>({
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    role: "merchandiser",
    status: "active",
    phone: "",
    address: "",
    tags: "",
    supervisor_id: undefined,
  });

  const fetchUsers = useCallback(async () => {
    try {
      const data = await UserService.getAll();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      alert("Failed to load users");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleUpdateUser = async () => {
    if (!newUser.email || !newUser.first_name || !newUser.last_name) {
      alert("Please fill all required fields");
      return;
    }

    try {
      setIsSubmitting(true);
      const updateData: UserUpdateData = {
        email: newUser.email,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        role: newUser.role,
        status: newUser.status,
        phone: newUser.phone,
        address: newUser.address,
        tags: newUser.tags,
        supervisor_id: newUser.supervisor_id || null,
      };

      if (newUser.password) {
        updateData.password = newUser.password;
      }

      if (selectedUserId) {
        await UserService.updateById(selectedUserId, updateData);
        alert("User updated successfully");
        closeModal();
        fetchUsers();
      }
    } catch (error: any) {
      alert(error.message || "Failed to update user");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateUser = async () => {
    if (isEditing) {
      await handleUpdateUser();
      return;
    }

    if (
      !newUser.email ||
      !newUser.password ||
      !newUser.first_name ||
      !newUser.last_name
    ) {
      alert("Please fill all fields");
      return;
    }

    try {
      setIsSubmitting(true);
      await UserService.create(newUser);
      alert("User created successfully");
      closeModal();
      fetchUsers();
    } catch (error: any) {
      alert(error.message || "Failed to create user");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openCreateModal = () => {
    setIsEditing(false);
    setSelectedUserId(null);
    setNewUser({
      email: "",
      first_name: "",
      last_name: "",
      password: "",
      role: "",
      status: "active",
      phone: "",
      address: "",
      tags: "",
      supervisor_id: undefined,
    });
    setModalVisible(true);
  };

  const openEditModal = (user: any) => {
    setIsEditing(true);
    setSelectedUserId(user.id);
    setNewUser({
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      password: "",
      role: user.role,
      status: user.status || "active",
      phone: user.phone || "",
      address: user.address || "",
      tags: user.tags || "",
      supervisor_id: user.supervisor_id,
    });
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setIsEditing(false);
    setSelectedUserId(null);
  };

  const openTrackingHistory = async (userId: number) => {
    setTrackingModalVisible(true);
    setIsFetchingTracking(true);
    try {
      const history = await LocationService.getHistory(userId);
      setTrackingHistory(history || {logs: [], visits: [], workdays: []});
    } catch (error) {
      console.error("Error fetching GPS history", error);
    } finally {
      setIsFetchingTracking(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const { edit: editId } = useLocalSearchParams<{ edit: string }>();
  useEffect(() => {
    if (editId && users.length > 0) {
      const userToEdit = users.find((u) => u.id.toString() === editId);
      if (userToEdit) {
        openEditModal(userToEdit);
      }
    }
  }, [editId, users]);

  const handleDeleteUser = async (userId: number, userName: string) => {
    setConfirmDelete({ visible: true, userId, userName });
  };

  const performDelete = async () => {
    const { userId, userName } = confirmDelete;
    if (!userId) return;

    // 1. Close modal immediately
    setConfirmDelete({ visible: false, userId: null, userName: '' });

    // 2. Optimistically remove from UI
    setUsers((prev: any[]) => prev.filter((u: any) => u.id !== userId));

    // 3. Background API call
    UserService.delete(userId)
      .then(() => showToast(`${userName} deleted successfully`, 'success'))
      .catch((err: any) => {
        // Restore user on failure
        showToast(err?.message || 'Failed to delete — please try again', 'error');
        fetchUsers(); // re-fetch to restore state
      });
  };

  const [sortField, setSortField] = useState<"name" | "role">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const filteredUsers = users
    .filter((user: any) => {
      const fullName = `${user.first_name || ""} ${user.last_name || ""}`;
      const isDemo = fullName.startsWith("Demo") || fullName.endsWith("Demo User") || (user.email || "").toLowerCase().includes("demo") || user.status === 'demo';
      
      // Override status for demo users to ensure they only appear in the demo filter
      const effectiveStatus = isDemo ? 'demo' : (user.status || "active");

      if (selectedFilter === "demo") {
        return isDemo;
      }
      if (isDemo) return false;

      const matchesSearch =
        fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.email || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter =
        selectedFilter === "all" ||
        effectiveStatus === selectedFilter;
      return matchesSearch && matchesFilter;
    })
    .sort((a: any, b: any) => {
      let valA, valB;
      if (sortField === "name") {
        valA = `${a.first_name || ""} ${a.last_name || ""}`.toLowerCase();
        valB = `${b.first_name || ""} ${b.last_name || ""}`.toLowerCase();
      } else {
        valA = (a.role || "").toLowerCase();
        valB = (b.role || "").toLowerCase();
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

  const filters = [
    {
      id: "all",
      label: "All",
      count: users.filter((u: any) => {
        const name = `${u.first_name || ""} ${u.last_name || ""}`;
        return !(name.startsWith("Demo") || name.endsWith("Demo User") || (u.email || "").toLowerCase().includes("demo") || u.status === 'demo');
      }).length,
    },
    {
      id: "active",
      label: "Active",
      count: users.filter((u: any) => {
        const name = `${u.first_name || ""} ${u.last_name || ""}`;
        const isDemo = name.startsWith("Demo") || name.endsWith("Demo User") || (u.email || "").toLowerCase().includes("demo") || u.status === 'demo';
        return (u.status || "active") === "active" && !isDemo;
      }).length,
    },
    {
      id: "inactive",
      label: "Inactive",
      count: users.filter((u: any) => {
        const name = `${u.first_name || ""} ${u.last_name || ""}`;
        const isDemo = name.startsWith("Demo") || name.endsWith("Demo User") || (u.email || "").toLowerCase().includes("demo") || u.status === 'demo';
        return u.status === "inactive" && !isDemo;
      }).length,
    },
    {
      id: "pending",
      label: "Pending",
      count: users.filter((u: any) => {
        const name = `${u.first_name || ""} ${u.last_name || ""}`;
        const isDemo = name.startsWith("Demo") || name.endsWith("Demo User") || (u.email || "").toLowerCase().includes("demo") || u.status === 'demo';
        return u.status === "pending" && !isDemo;
      }).length,
    },
    {
      id: "demo",
      label: "Demo Users",
      count: users.filter((u: any) => {
        const name = `${u.first_name || ""} ${u.last_name || ""}`;
        return name.startsWith("Demo") || name.endsWith("Demo User") || (u.email || "").toLowerCase().includes("demo") || u.status === 'demo';
      }).length,
    },
  ];

  const getInitials = (firstName: string, lastName: string) => {
    if (firstName && lastName)
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    if (firstName) return firstName.substring(0, 2).toUpperCase();
    return "??";
  };

  return (
    <AdminWebLayout title="User Management">
      <ToastContainer />
      <ConfirmDialog
        visible={confirmDelete.visible}
        title="Delete Member"
        message={`Are you sure you want to permanently delete ${confirmDelete.userName}? This action cannot be undone.`}
        variant="danger"
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={performDelete}
        onClose={() => setConfirmDelete({ visible: false, userId: null, userName: '' })}
      />
      {/* Search & Header */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
          gap: 12,
        }}
      >
        <View
          style={[
            {
              backgroundColor: T.surface,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: T.border,
              paddingHorizontal: 16,
              paddingVertical: 12,
              flexDirection: "row",
              alignItems: "center",
              flex: 1,
              gap: 10,
            },
          ]}
        >
          <Ionicons name="search" size={20} color={T.textMuted} />
          <TextInput
            style={{ flex: 1, color: T.text, outlineStyle: "none" } as any}
            placeholder="Search by name or email..."
            placeholderTextColor={T.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        {/* Import dropdown */}
        <View style={{ position: "relative" } as any}>
          <TouchableOpacity
            onPress={() => setImportMenuOpen(v => !v)}
            style={{
              flexDirection: "row", alignItems: "center", gap: 8,
              paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10,
              borderWidth: 1, borderColor: T.border, backgroundColor: T.surface,
            }}
          >
            <Ionicons name="cloud-upload-outline" size={16} color={T.text} />
            <Text style={{ color: T.text, fontSize: 14, fontFamily: Fonts.bodySemiBold }}>Import</Text>
            <Ionicons name="chevron-down" size={14} color={T.textMuted} />
          </TouchableOpacity>
          {importMenuOpen && (
            <View style={{
              position: "absolute", top: 44, right: 0, width: 200,
              backgroundColor: T.card, borderRadius: 12,
              borderWidth: 1, borderColor: T.border,
              shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15, shadowRadius: 12, elevation: 8, zIndex: 999,
            } as any}>
              <TouchableOpacity
                onPress={() => { setImportMenuOpen(false); }}
                style={{ flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderBottomWidth: 1, borderBottomColor: T.border }}
              >
                <Ionicons name="mail-outline" size={16} color={T.text} />
                <Text style={{ color: T.text, fontSize: 14, fontFamily: Fonts.bodySemiBold }}>Send invitation</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { setImportMenuOpen(false); openCreateModal(); }}
                style={{ flexDirection: "row", alignItems: "center", gap: 10, padding: 14 }}
              >
                <Ionicons name="server-outline" size={16} color={T.text} />
                <Text style={{ color: T.text, fontSize: 14, fontFamily: Fonts.bodySemiBold }}>Database file</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        <WebButton
          label="Add User"
          onPress={openCreateModal}
          icon={<Ionicons name="person-add" size={18} color="#fff" />}
        />
      </View>

      {/* Filters */}
      <View style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}>
        {filters.map((f) => {
          const isActive = selectedFilter === f.id;
          return (
            <TouchableOpacity
              key={f.id}
              onPress={() => setSelectedFilter(f.id)}
              style={{
                backgroundColor: isActive ? T.primary : T.surface,
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: isActive ? T.primary : T.border,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Text
                style={{
                  color: isActive ? "#fff" : T.textMuted,
                  fontSize: 13,
                  fontFamily: Fonts.bodySemiBold,
                }}
              >
                {f.label}
              </Text>
              <View
                style={{
                  backgroundColor: isActive ? "#ffffff30" : T.borderHover,
                  borderRadius: 10,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                }}
              >
                <Text
                  style={{
                    color: isActive ? "#fff" : T.textMuted,
                    fontSize: 11,
                    fontFamily: Fonts.secondaryBold,
                  }}
                >
                  {f.count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {isLoading ? (
        <ListSkeleton count={8} />
      ) : (
        <WebCard style={{ marginBottom: 40 }} noPadding>
          <UserTable
            users={filteredUsers}
            onEdit={openEditModal}
            onDelete={(u: any) =>
              handleDeleteUser(
                u.id,
                `${u.first_name || u.firstName} ${u.last_name || u.lastName}`,
              )
            }
            onViewGPS={(u: any) => openTrackingHistory(u.id)}
            COLOR={COLOR}
            getInitials={getInitials}
            isDark={isDark}
          />
        </WebCard>
      )}

      {/* ── Add / Edit User — Web Dialog ── */}
      {modalVisible && Platform.OS === 'web' && (
        // @ts-ignore
        <div
          onClick={closeModal}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
            animation: 'um-fadein 0.15s ease',
          } as any}
        >
          <style>{`
            @keyframes um-fadein  { from{opacity:0} to{opacity:1} }
            @keyframes um-slidein { from{opacity:0;transform:scale(0.94) translateY(10px)} to{opacity:1;transform:scale(1) translateY(0)} }
          `}</style>
          {/* @ts-ignore */}
          <div
            onClick={(e: any) => e.stopPropagation()}
            style={{
              width: 520, maxWidth: 'calc(100vw - 32px)',
              maxHeight: 'calc(100vh - 48px)',
              backgroundColor: COLOR.surface,
              border: `1px solid ${COLOR.border}`,
              borderRadius: 24, overflow: 'hidden',
              display: 'flex', flexDirection: 'column',
              boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
              animation: 'um-slidein 0.2s cubic-bezier(0.22,1,0.36,1)',
            } as any}
          >
            {/* Fixed header */}
            {/* @ts-ignore */}
            <div style={{ padding: '22px 28px', borderBottom: `1px solid ${COLOR.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 } as any}>
              {/* @ts-ignore */}
              <p style={{ margin: 0, fontSize: 17, fontWeight: 700, fontFamily: Fonts.heading, color: COLOR.text } as any}>
                {isEditing ? '✏️ Edit User Profile' : '👤 Add New Staff Member'}
              </p>
              <TouchableOpacity onPress={closeModal} style={{ padding: 6 }}>
                <Ionicons name="close" size={22} color={COLOR.textMuted} />
              </TouchableOpacity>
            </div>

            {/* Scrollable body */}
            {/* @ts-ignore */}
            <div style={{ overflowY: 'auto', padding: '24px 28px', flex: 1, display: 'flex', flexDirection: 'column', gap: 18 } as any}>

              {/* Email */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: COLOR.text }]}>Email Address</Text>
                <TextInput style={[styles.input, { color: COLOR.text, borderColor: COLOR.border, backgroundColor: COLOR.bg }]} value={newUser.email} onChangeText={t => setNewUser({ ...newUser, email: t })} placeholder="john@example.com" keyboardType="email-address" autoCapitalize="none" placeholderTextColor={COLOR.textMuted} />
              </View>

              {/* First / Last Name */}
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.label, { color: COLOR.text }]}>First Name</Text>
                  <TextInput style={[styles.input, { color: COLOR.text, borderColor: COLOR.border, backgroundColor: COLOR.bg }]} value={newUser.first_name} onChangeText={t => setNewUser({ ...newUser, first_name: t })} placeholder="John" placeholderTextColor={COLOR.textMuted} />
                </View>
                <View style={{ width: 12 }} />
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.label, { color: COLOR.text }]}>Last Name</Text>
                  <TextInput style={[styles.input, { color: COLOR.text, borderColor: COLOR.border, backgroundColor: COLOR.bg }]} value={newUser.last_name} onChangeText={t => setNewUser({ ...newUser, last_name: t })} placeholder="Doe" placeholderTextColor={COLOR.textMuted} />
                </View>
              </View>

              {/* Password */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: COLOR.text }]}>Temporary Password</Text>
                <TextInput style={[styles.input, { color: COLOR.text, borderColor: COLOR.border, backgroundColor: COLOR.bg }]} value={newUser.password} onChangeText={t => setNewUser({ ...newUser, password: t })} placeholder={isEditing ? '(Leave blank to keep current)' : '******'} secureTextEntry placeholderTextColor={COLOR.textMuted} />
              </View>

              {/* Phone */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: COLOR.text }]}>Phone Number</Text>
                <TextInput style={[styles.input, { color: COLOR.text, borderColor: COLOR.border, backgroundColor: COLOR.bg }]} value={newUser.phone} onChangeText={t => setNewUser({ ...newUser, phone: t })} placeholder="+1 (555) 000-0000" placeholderTextColor={COLOR.textMuted} />
              </View>

              {/* Address */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: COLOR.text }]}>Address</Text>
                <TextInput style={[styles.input, { color: COLOR.text, borderColor: COLOR.border, backgroundColor: COLOR.bg }]} value={newUser.address} onChangeText={t => setNewUser({ ...newUser, address: t })} placeholder="Where exactly in Tunisia?" placeholderTextColor={COLOR.textMuted} />
              </View>

              {/* Role */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: COLOR.text }]}>Assignable Role</Text>
                <View style={styles.roleSelector}>
                  {['admin', 'supervisor', 'merchandiser'].map(r => (
                    <TouchableOpacity key={r} style={[styles.roleOption, newUser.role === r && { backgroundColor: COLOR.primary, borderColor: COLOR.primary }, { borderColor: COLOR.border }]} onPress={() => setNewUser({ ...newUser, role: r })}>
                      <Text style={[styles.roleOptionText, { color: newUser.role === r ? '#fff' : COLOR.textMuted }]}>{r.toUpperCase()}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Supervisor dropdown */}
              {newUser.role === 'merchandiser' && (
                <View style={[styles.inputGroup, { marginTop: 4 }]}>
                  <Text style={[styles.label, { color: COLOR.text }]}>Assign Supervisor</Text>
                  <View style={{ backgroundColor: COLOR.surface, borderWidth: 1, borderColor: COLOR.border, borderRadius: 10, overflow: 'hidden' }}>
                    <select style={{ width: '100%', padding: '14px', backgroundColor: 'transparent', color: COLOR.text, border: 'none', outline: 'none' }} value={newUser.supervisor_id || ''} onChange={e => setNewUser({ ...newUser, supervisor_id: (e.target as any).value ? parseInt((e.target as any).value) : undefined })}>
                      <option value="" style={{ color: '#000' }}>No Supervisor (Unassigned)</option>
                      {users.filter((u: any) => u.role === 'supervisor').map((sup: any) => (
                        <option key={sup.id} value={sup.id} style={{ color: '#000' }}>{sup.first_name} {sup.last_name}</option>
                      ))}
                    </select>
                  </View>
                </View>
              )}
            </div>

            {/* Fixed footer */}
            {/* @ts-ignore */}
            <div style={{ padding: '18px 28px', borderTop: `1px solid ${COLOR.border}`, flexShrink: 0 } as any}>
              <TouchableOpacity style={[styles.submitBtn, { backgroundColor: COLOR.primary }]} onPress={handleCreateUser} disabled={isSubmitting}>
                {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>{isEditing ? 'Save Changes' : 'Confirm Registration'}</Text>}
              </TouchableOpacity>
            </div>
          </div>
        </div>
      )}

      {/* Mobile fallback */}
      {modalVisible && Platform.OS !== 'web' && (
        <Modal animationType="fade" transparent={true} visible={modalVisible} onRequestClose={closeModal}>
          <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }]}>
            <View style={[styles.modalContent, { backgroundColor: COLOR.surface, borderRadius: 24, width: '100%', maxWidth: 500, height: 'auto', padding: 32 }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: COLOR.text }]}>{isEditing ? 'Edit User Profile' : 'Add New Staff Member'}</Text>
                <TouchableOpacity onPress={closeModal}><Ionicons name="close" size={24} color={COLOR.textMuted} /></TouchableOpacity>
              </View>
              <ScrollView style={[styles.modalBody, { paddingHorizontal: 0 }]}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: COLOR.text }]}>Email Address</Text>
                  <TextInput style={[styles.input, { color: COLOR.text, borderColor: COLOR.border, backgroundColor: COLOR.bg }]} value={newUser.email} onChangeText={t => setNewUser({ ...newUser, email: t })} placeholder="john@example.com" keyboardType="email-address" autoCapitalize="none" placeholderTextColor={COLOR.textMuted} />
                </View>
                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={[styles.label, { color: COLOR.text }]}>First Name</Text>
                    <TextInput style={[styles.input, { color: COLOR.text, borderColor: COLOR.border, backgroundColor: COLOR.bg }]} value={newUser.first_name} onChangeText={t => setNewUser({ ...newUser, first_name: t })} placeholder="John" placeholderTextColor={COLOR.textMuted} />
                  </View>
                  <View style={{ width: 12 }} />
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={[styles.label, { color: COLOR.text }]}>Last Name</Text>
                    <TextInput style={[styles.input, { color: COLOR.text, borderColor: COLOR.border, backgroundColor: COLOR.bg }]} value={newUser.last_name} onChangeText={t => setNewUser({ ...newUser, last_name: t })} placeholder="Doe" placeholderTextColor={COLOR.textMuted} />
                  </View>
                </View>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: COLOR.text }]}>Temporary Password</Text>
                  <TextInput style={[styles.input, { color: COLOR.text, borderColor: COLOR.border, backgroundColor: COLOR.bg }]} value={newUser.password} onChangeText={t => setNewUser({ ...newUser, password: t })} placeholder={isEditing ? '(Leave blank to keep current)' : '******'} secureTextEntry placeholderTextColor={COLOR.textMuted} />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: COLOR.text }]}>Phone Number</Text>
                  <TextInput style={[styles.input, { color: COLOR.text, borderColor: COLOR.border, backgroundColor: COLOR.bg }]} value={newUser.phone} onChangeText={t => setNewUser({ ...newUser, phone: t })} placeholder="+1 (555) 000-0000" placeholderTextColor={COLOR.textMuted} />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: COLOR.text }]}>Address</Text>
                  <TextInput style={[styles.input, { color: COLOR.text, borderColor: COLOR.border, backgroundColor: COLOR.bg }]} value={newUser.address} onChangeText={t => setNewUser({ ...newUser, address: t })} placeholder="Where exactly in Tunisia?" placeholderTextColor={COLOR.textMuted} />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: COLOR.text }]}>Assignable Role</Text>
                  <View style={styles.roleSelector}>
                    {['admin', 'supervisor', 'merchandiser'].map(r => (
                      <TouchableOpacity key={r} style={[styles.roleOption, newUser.role === r && { backgroundColor: COLOR.primary, borderColor: COLOR.primary }, { borderColor: COLOR.border }]} onPress={() => setNewUser({ ...newUser, role: r })}>
                        <Text style={[styles.roleOptionText, { color: newUser.role === r ? '#fff' : COLOR.textMuted }]}>{r.toUpperCase()}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </ScrollView>
              <View style={[styles.modalFooter, { padding: 0, borderTopWidth: 0, marginTop: 24 }]}>
                <TouchableOpacity style={[styles.submitBtn, { backgroundColor: COLOR.primary }]} onPress={handleCreateUser} disabled={isSubmitting}>
                  {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>{isEditing ? 'Save Changes' : 'Confirm Registration'}</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Tracking Modal */}
      <Modal visible={trackingModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: COLOR.card, width: '90%', maxWidth: 1000, height: '85%', padding: 0, overflow: 'hidden' }]}>
            <View style={[styles.modalHeader, { padding: 24, borderBottomWidth: 1, borderBottomColor: COLOR.border }]}>
              <View>
                <Text style={[styles.modalTitle, { color: COLOR.text }]}>
                  GPS Tracking History
                </Text>
                <Text style={{ color: COLOR.textMuted, fontSize: 13, marginTop: 4 }}>
                  Today's checkpoints and visits
                </Text>
              </View>
              <TouchableOpacity onPress={() => setTrackingModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLOR.text} />
              </TouchableOpacity>
            </View>
            <View style={{ flex: 1, backgroundColor: COLOR.surface, position: 'relative' }}>
                {isFetchingTracking ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator size="large" color={COLOR.primary} />
                    </View>
                ) : trackingHistory.logs.length === 0 && trackingHistory.visits.length === 0 ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <Ionicons name="map-outline" size={48} color={COLOR.border} />
                        <Text style={{ color: COLOR.textMuted, marginTop: 16 }}>No GPS data found for today.</Text>
                    </View>
                ) : (
                    <AppMapView
                        style={{ width: '100%', height: '100%' }}
                        initialRegion={{
                            latitude: trackingHistory.logs[0]?.latitude || trackingHistory.visits[0]?.start_lat || MAP_DEFAULTS.INITIAL_REGION.latitude,
                            longitude: trackingHistory.logs[0]?.longitude || trackingHistory.visits[0]?.start_lng || MAP_DEFAULTS.INITIAL_REGION.longitude,
                            latitudeDelta: MAP_DEFAULTS.INITIAL_REGION.latitudeDelta,
                            longitudeDelta: MAP_DEFAULTS.INITIAL_REGION.longitudeDelta,
                        }}
                    >
                        {trackingHistory.logs.map((log: any, index: number) => (
                            <Marker
                                key={`log-${index}`}
                                coordinate={{ latitude: log.latitude, longitude: log.longitude }}
                                title={`Time: ${new Date(log.timestamp).toLocaleTimeString()}`}
                                description={`Type: ${log.log_type}`}
                            />
                        ))}
                        {trackingHistory.visits.map((visit: any, index: number) => (
                            <Marker
                                key={`visit-${index}`}
                                coordinate={{ latitude: visit.start_lat, longitude: visit.start_lng }}
                                title={`Visit: ${visit.gms_name}`}
                                description={`Status: ${visit.status}`}
                            />
                        ))}
                    </AppMapView>
                )}
            </View>
          </View>
        </View>
      </Modal>

    </AdminWebLayout>
  );
}

function UserTable({
  users,
  onEdit,
  onDelete,
  onViewGPS,
  COLOR,
  getInitials,
  isDark,
}: any) {
  const { T } = useWebTheme();
  return (
    <View style={{ flex: 1, width: "100%" }}>
        <WebTableHeader
          columns={[
            { label: "Member", flex: 2.5 },
            { label: "Address", flex: 1.5 },
            { label: "Phone", flex: 1.5 },
            { label: "Job Title", flex: 1.5 },
            { label: "Assignment", flex: 1.5 },
            { label: "Status", flex: 1 },
            { label: "Actions", width: 110 },
          ]}
        />

      {users.length === 0 ? (
        <View
          style={{ padding: 60, alignItems: "center", backgroundColor: T.card }}
        >
          <Ionicons name="people-outline" size={48} color={T.borderHover} />
          <Text
            style={{
              color: T.textMuted,
              marginTop: 16,
              fontFamily: Fonts.body,
            }}
          >
            No team members found.
          </Text>
        </View>
      ) : (
        <View style={{ backgroundColor: T.card }}>
          {users.map((user: any, i: number) => (
            <UserTableRow
              key={user.id}
              user={user}
              onEdit={onEdit}
              onDelete={onDelete}
              onViewGPS={onViewGPS}
              COLOR={COLOR}
              getInitials={getInitials}
              isLast={i === users.length - 1}
              isDark={isDark}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const UserTableRow = React.memo(function UserTableRow({ user, onEdit, onDelete, onViewGPS, isLast, COLOR, isDark }: any) {
  const [hovered, setHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { T } = useWebTheme();

  const tags = user.tags
    ? user.tags.split(",").map((t: string) => t.trim()).filter(Boolean)
    : [];
  
  const firstName = user.first_name || user.firstName || "";
  const lastName = user.last_name || user.lastName || "";
  const fullName = `${firstName} ${lastName}`;
  const isDemo = fullName.startsWith("Demo") || fullName.endsWith("Demo User") || (user.email || "").toLowerCase().includes("demo") || user.status === 'demo';
  
  // Inject "Demo Account" tag for demo users
  const demoTag = "Demo Account";
  const displayTags = isDemo ? [demoTag, ...tags.filter((t: string) => t !== "Demo" && t !== "Demo Account")] : tags;

  const getInitials = (f: string, l: string) => (f?.[0] || "") + (l?.[0] || "");

  return (
    <View
      // @ts-ignore
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setMenuOpen(false);
      }}
      style={
        {
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 14,
          paddingHorizontal: 24,
          borderBottomWidth: isLast ? 0 : 1,
          borderBottomColor: COLOR.border,
          backgroundColor: hovered
            ? isDark
              ? "#ffffff06"
              : "#f8fafc"
            : "transparent",
        } as any
      }
    >
      <View
        style={{ flex: 2, flexDirection: "row", alignItems: "center", gap: 12 }}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: COLOR.primary + "25",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {(user.profile_image || user.profileImage) ? (
            <Image
              source={{ uri: getFullImageUrl(user.profile_image || user.profileImage) || "" }}
              style={{ width: "100%", height: "100%" }}
            />
          ) : (
            <Text
              style={{
                color: COLOR.primary,
                fontSize: 13,
                fontFamily: Fonts.headingSemiBold,
              }}
            >
              {getInitials(firstName, lastName)}
            </Text>
          )}
        </View>
        <View>
          <Text
            style={{
              color: COLOR.text,
              fontSize: 14,
              fontFamily: Fonts.bodySemiBold,
            }}
          >
            {firstName} {lastName}
          </Text>
          <Text
            style={{
              color: COLOR.textMuted,
              fontSize: 12,
              fontFamily: Fonts.body,
              marginTop: 2
            }}
          >
            {user.email}
          </Text>
        </View>
      </View>

      {/* Email was merged into Member */}

      {/* Address */}
      <Text
        style={{
          flex: 1.5,
          color: COLOR.textMuted,
          fontSize: 13,
          fontFamily: Fonts.body,
        }}
        numberOfLines={1}
      >
        {user.address || "-"}
      </Text>

      {/* Phone */}
      <Text
        style={{
          flex: 1.5,
          color: COLOR.textMuted,
          fontSize: 13,
          fontFamily: Fonts.body,
        }}
        numberOfLines={1}
      >
        {user.phone || "-"}
      </Text>

      {/* Job Title (role) */}
      <View style={{ flex: 1.5, alignItems: "flex-start" }}>
        <WebChip
          label={user.role}
          colorPreset={
            user.role === "admin"
              ? "danger"
              : user.role === "supervisor"
                ? "warning"
                : "primary"
          }
        />
      </View>

      {/* Assignment (supervisor) */}
      <View style={{ flex: 1.5, paddingRight: 12, zIndex: 99 }}>
        {user.role === 'merchandiser' ? (
          <View style={{ position: 'relative' }}>
            <TouchableOpacity 
              style={{ paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: COLOR.border, borderRadius: 8, backgroundColor: hovered ? COLOR.card : 'transparent', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
              onPress={() => setMenuOpen(!menuOpen)}
            >
              <Text style={{ fontSize: 13, color: user.supervisor_id ? COLOR.text : COLOR.textMuted }}>
                {user.supervisor_id ? `Supervisor #${user.supervisor_id}` : 'Unassigned'}
              </Text>
              <Ionicons name="chevron-down" size={14} color={COLOR.textMuted} />
            </TouchableOpacity>
            {menuOpen && (
              <View style={{ position: 'absolute', top: 40, left: 0, right: 0, backgroundColor: isDark ? '#1f2937' : '#ffffff', borderWidth: 1, borderColor: COLOR.border, borderRadius: 8, zIndex: 1000, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10 }}>
                <TouchableOpacity style={{ padding: 10 }} onPress={() => { setMenuOpen(false); onEdit(user); }}>
                  <Text style={{ color: COLOR.text, fontSize: 13 }}>Assign via Edit...</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          <Text style={{ fontSize: 13, color: COLOR.textMuted, fontStyle: 'italic' }}>N/A</Text>
        )}
      </View>

      {/* Status — Forced to 'demo' for demo users */}
      <View style={{ flex: 1, alignItems: "flex-start" }}>
        <WebChip
          label={isDemo ? "demo" : (user.status || "Active")}
          colorPreset={isDemo ? "default" : (user.status === "active" ? "success" : "default")}
        />
      </View>

      {/* Actions — inline icon buttons, no three-dots */}
      <View
        style={{
          width: 110,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 6,
          paddingRight: 10,
        }}
      >
        <TouchableOpacity
          onPress={() => onEdit(user)}
          style={{ padding: 7, borderRadius: 8, backgroundColor: COLOR.primary + '18' }}
        >
          <Ionicons name="pencil" size={15} color={COLOR.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onViewGPS(user)}
          style={{ padding: 7, borderRadius: 8, backgroundColor: '#22c55e18' }}
        >
          <Ionicons name="location-outline" size={15} color="#22c55e" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onDelete(user)}
          style={{ padding: 7, borderRadius: 8, backgroundColor: COLOR.danger + '18' }}
        >
          <Ionicons name="trash-outline" size={15} color={COLOR.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );
});


const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
  },
  modalContent: {
    paddingTop: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: Fonts.heading,
  },
  modalBody: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontFamily: Fonts.bodySemiBold,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  row: {
    flexDirection: "row",
  },
  roleSelector: {
    flexDirection: "row",
    gap: 8,
  },
  roleOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  roleOptionText: {
    fontSize: 12,
    fontFamily: Fonts.secondaryBold,
    letterSpacing: 1,
  },
  modalFooter: {
    marginTop: 24,
  },
  submitBtn: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  submitBtnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: Fonts.headingSemiBold,
  },
});
