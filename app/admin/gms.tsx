import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as ExpoLocation from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { AdminWebLayout } from '@/components/admin/WebLayout';
import AppMapView, { Marker } from '@/components/AppMapView';
import { DARK_COLORS, LIGHT_COLORS } from '@/constants/appColors';
import { useTheme } from '@/context/ThemeContext';
import { Fonts } from '@/hooks/useFonts';
import { GMS, GMSService } from '@/services/gms.service';
import { UserService } from '@/services/user.service';
import { User } from '@/types/auth';
import { useWebTheme } from '@/hooks/useWebTheme';
import { WebCard, WebChip, WebButton } from '@/components/ui/WebPrimitives';

import { MAP_DEFAULTS } from '@/config/mainMap';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/hooks/useToast';

export default function GSMPage() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const COLOR = isDark ? DARK_COLORS : LIGHT_COLORS;
    const { T } = useWebTheme();
    const { showToast, ToastContainer } = useToast();

    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

    const [stores, setStores] = useState<GMS[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isLocating, setIsLocating] = useState(false);
    const [userLocation, setUserLocation] = useState<{ latitude: number, longitude: number } | null>(null);
    const [mapType, setMapType] = useState<any>('terrain');
    const [isLayerMenuVisible, setIsLayerMenuVisible] = useState(false);
    const [tempLocation, setTempLocation] = useState({ latitude: 36.575, longitude: 10.05 });

    const mapRef = useRef<any>(null);

    const [modalVisible, setModalVisible] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedGMSId, setSelectedGMSId] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newGMS, setNewGMS] = useState<Partial<GMS>>({
        name: '',
        address: '',
        latitude: 36.575,
        longitude: 10.05,
        city: 'Tunisia',
        type: 'Supermarket',
        supervisor_id: undefined
    });

    const [isAssignModalVisible, setIsAssignModalVisible] = useState(false);
    const [selectedStore, setSelectedStore] = useState<GMS | null>(null);
    const [selectedMerchandiserId, setSelectedMerchandiserId] = useState<number | null>(null);
    const [merchandisers, setMerchandisers] = useState<User[]>([]);
    const [supervisors, setSupervisors] = useState<User[]>([]);
    const [isUsersLoading, setIsUsersLoading] = useState(false);
    const [confirmGMS, setConfirmGMS] = useState<{ visible: boolean; store: GMS | null }>({ visible: false, store: null });
    
    // Store Details Drawer
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [detailedStore, setDetailedStore] = useState<GMS | null>(null);

    const openDetailsDrawer = (store: GMS) => {
        setDetailedStore(store);
        setIsDrawerOpen(true);
    };

    const fetchStores = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await GMSService.getAll();
            setStores(Array.isArray(data) ? data : []);
        } catch (err: any) {
            console.error('Fetch stores error:', err);
            setError(err.message || 'Failed to connect to the database.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { 
        fetchStores(); 
        fetchUsers();
    }, [fetchStores]);

    const handleSaveGMS = async () => {
        if (!newGMS.name || !newGMS.city) {
            alert('Please provide a store name and city.');
            return;
        }

        setIsSubmitting(true);
        try {
            const storeData = { ...newGMS, ...tempLocation } as GMS;
            if (isEditing && selectedGMSId) {
                await GMSService.update(selectedGMSId, storeData);
                alert('Store updated successfully.');
            } else {
                await GMSService.create(storeData);
                alert('Store added successfully.');
            }
            setModalVisible(false);
            setIsEditing(false);
            setSelectedGMSId(null);
            setNewGMS({
                name: '',
                address: '',
                latitude: 36.575,
                longitude: 10.05,
                city: 'Tunisia',
                type: 'Supermarket',
                supervisor_id: undefined
            });
            fetchStores();
        } catch (err: any) {
            alert(err.message || 'Failed to save point of sale.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const openEditModal = (store: GMS) => {
        setIsEditing(true);
        setSelectedGMSId(store.id);
        setNewGMS({
            name: store.name,
            address: store.address || '',
            latitude: store.latitude || 36.575,
            longitude: store.longitude || 10.05,
            city: store.city || 'Tunisia',
            type: store.type || 'Supermarket',
            supervisor_id: store.supervisor_id
        });
        setTempLocation({ latitude: store.latitude || 36.575, longitude: store.longitude || 10.05 });
        setModalVisible(true);
    };

    const openCreateModal = () => {
        setIsEditing(false);
        setSelectedGMSId(null);
        setNewGMS({
            name: '',
            address: '',
            latitude: 36.575,
            longitude: 10.05,
            city: 'Tunisia',
            type: 'Supermarket',
            supervisor_id: undefined
        });
        setTempLocation({ latitude: 36.575, longitude: 10.05 });
        setModalVisible(true);
    };

    const fetchUsers = async () => {
        setIsUsersLoading(true);
        try {
            const allUsers = await UserService.getAll();
            setMerchandisers(allUsers.filter(u => u.role === 'merchandiser'));
            setSupervisors(allUsers.filter(u => u.role === 'supervisor'));
        } catch (err) {
            console.error('Fetch users error:', err);
        } finally {
            setIsUsersLoading(false);
        }
    };

    const openAssignModal = (store: GMS) => {
        setSelectedStore(store);
        setIsAssignModalVisible(true);
        fetchUsers();
    };

    const handleAssignMerchandiser = async () => {
        if (!selectedStore || !selectedMerchandiserId) return;
        setIsSubmitting(true);
        try {
            await GMSService.assignMerchandiser({ gms_id: selectedStore.id, user_id: selectedMerchandiserId });
            alert('Merchandiser assigned successfully.');
            setIsAssignModalVisible(false);
            setSelectedMerchandiserId(null);
            fetchStores();
        } catch (error: any) {
            alert('Failed to assign merchandiser: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteGMS = (store: GMS) => {
        setConfirmGMS({ visible: true, store });
    };

    const performDeleteGMS = async () => {
        const store = confirmGMS.store;
        if (!store) return;

        // 1. Close modal immediately
        setConfirmGMS({ visible: false, store: null });

        // 2. Optimistically remove from UI
        setStores(prev => prev.filter(s => s.id !== store.id));

        // 3. Background API call
        GMSService.delete(store.id)
            .then(() => showToast(`"${store.name}" deleted`, 'success'))
            .catch((err: any) => {
                showToast(err?.message || 'Failed to delete store', 'error');
                fetchStores(); // restore
            });
    };

    const locateUser = async () => {
        if (Platform.OS !== 'web') return; 
        setIsLocating(true);
        try {
            const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
            if (status !== 'granted') throw new Error('Permission denied');

            const location = await ExpoLocation.getCurrentPositionAsync({});
            const { latitude, longitude } = location.coords;
            setUserLocation({ latitude, longitude });

            mapRef.current?.animateToRegion({
                latitude,
                longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            }, 1000);
        } catch (error: any) {
            alert('Could not get your current location.');
        } finally {
            setIsLocating(false);
        }
    };

    const handleMapPress = async (loc: { latitude: number, longitude: number }) => {
        setTempLocation(loc);
        setNewGMS({
            name: '',
            latitude: loc.latitude,
            longitude: loc.longitude,
            address: 'Fetching address...',
            city: 'Tunisia',
            type: 'Supermarket',
            supervisor_id: undefined
        });
        setIsEditing(false);
        setSelectedGMSId(null);
        setModalVisible(true);

        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${loc.latitude}&lon=${loc.longitude}&zoom=18&addressdetails=1`);
            const data = await response.json();
            
            if (data && data.display_name) {
                setNewGMS(prev => ({
                    ...prev,
                    address: data.display_name,
                    city: data.address.city || data.address.town || data.address.village || data.address.state || 'Tunisia'
                }));
            }
        } catch (error) {
            console.error('Reverse geocoding error:', error);
            setNewGMS(prev => ({ ...prev, address: '' }));
        }
    };

    const filteredStores = stores.filter(store => 
        store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (store.address || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <>
        <AdminWebLayout title="Store Management">
            <ToastContainer />
            <ConfirmDialog
                visible={confirmGMS.visible}
                title="Delete Store"
                message={`Are you sure you want to permanently delete "${confirmGMS.store?.name}"? This cannot be undone.`}
                variant="danger"
                confirmLabel="Delete"
                cancelLabel="Cancel"
                onConfirm={performDeleteGMS}
                onClose={() => setConfirmGMS({ visible: false, store: null })}
            />
            {/* Header / Stats */}
            <View style={{ flexDirection: 'row', gap: 20, marginBottom: 24 }}>
                <WebCard style={{ flex: 1, padding: 20 }}>
                    <Text style={{ color: COLOR.textMuted, fontSize: 12, fontFamily: Fonts.bodyBold, letterSpacing: 1 }}>TOTAL STORES</Text>
                    <Text style={{ color: COLOR.text, fontSize: 24, fontFamily: Fonts.headingSemiBold, marginTop: 4 }}>{stores.length}</Text>
                </WebCard>
                <WebCard style={{ flex: 1, padding: 20 }}>
                    <Text style={{ color: COLOR.textMuted, fontSize: 12, fontFamily: Fonts.bodyBold, letterSpacing: 1 }}>HYPERMARKETS</Text>
                    <Text style={{ color: COLOR.success, fontSize: 24, fontFamily: Fonts.headingSemiBold, marginTop: 4 }}>{stores.filter(s => s.type === 'Hypermarket').length}</Text>
                </WebCard>
                <WebCard style={{ flex: 1, padding: 20 }}>
                    <Text style={{ color: COLOR.textMuted, fontSize: 12, fontFamily: Fonts.bodyBold, letterSpacing: 1 }}>SUPERMARKETS</Text>
                    <Text style={{ color: COLOR.primary, fontSize: 24, fontFamily: Fonts.headingSemiBold, marginTop: 4 }}>{stores.filter(s => s.type === 'Supermarket').length}</Text>
                </WebCard>
            </View>

            {/* Toolbar */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <View style={[{ backgroundColor: T.surface, borderRadius: 12, borderWidth: 1, borderColor: T.border, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', width: 320, gap: 10 }]}>
                    <Ionicons name="search" size={20} color={T.textMuted} />
                    <TextInput
                        style={{ flex: 1, color: T.text, outlineStyle: 'none' } as any}
                        placeholder="Search stores by name..."
                        placeholderTextColor={T.textMuted}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                <View style={{ flexDirection: 'row', gap: 12 }}>
                    <WebButton 
                        label="Add Store" 
                        onPress={openCreateModal} 
                        icon={<Ionicons name="add-circle" size={18} color="#fff" />} 
                    />
                </View>
            </View>

            {isLoading ? (
                <ActivityIndicator color={COLOR.primary} size="large" style={{ marginTop: 100 }} />
            ) : (
                <View style={{ gap: 24, paddingBottom: 40 }}>
                    {/* Map View (Top) */}
                    <WebCard noPadding style={{ height: 400, overflow: 'hidden' }}>
                        <AppMapView
                            ref={mapRef}
                            style={{ height: '100%', width: '100%' }}
                            initialRegion={MAP_DEFAULTS.INITIAL_REGION}
                            showStyleSelector={true}
                            showControls={true}
                            showPlacePicker={true}
                            clusters={filteredStores.length > 8}
                            onMapPress={handleMapPress}
                        >
                            {filteredStores.map(store => (
                                <Marker
                                    key={store.id}
                                    coordinate={{ latitude: store.latitude, longitude: store.longitude }}
                                    title={store.name}
                                    description={store.address}
                                    pinColor={store.type === 'Hypermarket' ? 'green' : 'blue'}
                                />
                            ))}
                        </AppMapView>
                    </WebCard>

                    {/* Stores List (Cards) */}
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 20 }}>
                        {filteredStores.map(store => (
                            <WebCard key={store.id} style={{ width: '32%' } as any}>
                                <TouchableOpacity onPress={() => openDetailsDrawer(store)} style={{ flexDirection: 'row', gap: 16, alignItems: 'center', marginBottom: 16 }}>
                                    <View style={{ backgroundColor: COLOR.primary + '15', width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                                        <MaterialIcons name="storefront" size={24} color={COLOR.primary} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ color: COLOR.text, fontSize: 16, fontFamily: Fonts.headingSemiBold }} numberOfLines={1}>{store.name}</Text>
                                        <WebChip label={store.type || 'STORE'} colorPreset={store.type === 'Hypermarket' ? 'success' : 'primary'} />
                                    </View>
                                </TouchableOpacity>
                                <View style={{ gap: 8, marginBottom: 20 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <Ionicons name="location-outline" size={14} color={COLOR.textMuted} />
                                        <Text style={{ color: COLOR.textMuted, fontSize: 13, fontFamily: Fonts.body }} numberOfLines={1}>{store.address || 'No address'}</Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <Ionicons name="business-outline" size={14} color={COLOR.textMuted} />
                                        <Text style={{ color: COLOR.textMuted, fontSize: 13, fontFamily: Fonts.body }}>{store.city || 'Tunisia'}</Text>
                                    </View>
                                </View>
                                <View style={{ flexDirection: 'row', gap: 10 }}>
                                    <TouchableOpacity 
                                        style={{ flex: 1, backgroundColor: COLOR.primary + '10', paddingVertical: 10, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 }}
                                        onPress={() => openAssignModal(store)}
                                    >
                                        <Ionicons name="person-add" size={16} color={COLOR.primary} />
                                        <Text style={{ color: COLOR.primary, fontSize: 13, fontFamily: Fonts.bodySemiBold }}>Assign</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        style={{ width: 40, height: 40, backgroundColor: COLOR.primary + '10', borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}
                                        onPress={() => openEditModal(store)}
                                    >
                                        <Ionicons name="pencil" size={18} color={COLOR.primary} />
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        style={{ width: 40, height: 40, backgroundColor: COLOR.danger + '10', borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}
                                        onPress={() => handleDeleteGMS(store)}
                                    >
                                        <Ionicons name="trash-outline" size={18} color={COLOR.danger} />
                                    </TouchableOpacity>
                                </View>
                            </WebCard>
                        ))}
                    </View>
                </View>
            )}

            {/* ── Add / Edit Store — Web Dialog ── */}
            {modalVisible && Platform.OS === 'web' && (
                // @ts-ignore
                <div
                    onClick={() => setModalVisible(false)}
                    style={{
                        position: 'fixed', inset: 0, zIndex: 9999,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backgroundColor: 'rgba(0,0,0,0.55)',
                        backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
                        animation: 'wm-fadein 0.15s ease',
                    } as any}
                >
                    <style>{`
                        @keyframes wm-fadein  { from{opacity:0} to{opacity:1} }
                        @keyframes wm-slidein { from{opacity:0;transform:scale(0.94) translateY(10px)} to{opacity:1;transform:scale(1) translateY(0)} }
                    `}</style>
                    {/* @ts-ignore */}
                    <div
                        onClick={(e: any) => e.stopPropagation()}
                        style={{
                            width: 520, maxWidth: 'calc(100vw - 32px)',
                            maxHeight: 'calc(100vh - 48px)',
                            backgroundColor: COLOR.card,
                            border: `1px solid ${COLOR.border}`,
                            borderRadius: 20, overflow: 'hidden',
                            display: 'flex', flexDirection: 'column',
                            boxShadow: '0 24px 48px rgba(0,0,0,0.3)',
                            animation: 'wm-slidein 0.2s cubic-bezier(0.22,1,0.36,1)',
                        } as any}
                    >
                        {/* Header */}
                        {/* @ts-ignore */}
                        <div style={{ padding: '24px 28px', borderBottom: `1px solid ${COLOR.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 } as any}>
                            {/* @ts-ignore */}
                            <p style={{ margin: 0, fontSize: 18, fontWeight: 700, fontFamily: Fonts.heading, color: COLOR.text } as any}>
                                {isEditing ? '✏️ Edit Store' : '🏪 Add New Store'}
                            </p>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={{ padding: 6 }}>
                                <Ionicons name="close" size={22} color={COLOR.textMuted} />
                            </TouchableOpacity>
                        </div>

                        {/* Scrollable body */}
                        {/* @ts-ignore */}
                        <div style={{ overflowY: 'auto', padding: '24px 28px', flex: 1, display: 'flex', flexDirection: 'column', gap: 18 } as any}>

                            {/* Store Name */}
                            <View>
                                <Text style={{ color: COLOR.textMuted, fontSize: 13, marginBottom: 8, fontFamily: Fonts.body }}>Store Name *</Text>
                                <TextInput
                                    style={{ backgroundColor: COLOR.surface, borderWidth: 1, borderColor: COLOR.border, borderRadius: 10, padding: 14, color: COLOR.text, outlineStyle: 'none' } as any}
                                    value={newGMS.name}
                                    onChangeText={t => setNewGMS({ ...newGMS, name: t })}
                                    placeholder="e.g. Carrefour Marsa"
                                    placeholderTextColor={COLOR.textMuted}
                                />
                            </View>

                            {/* Type */}
                            <View>
                                <Text style={{ color: COLOR.textMuted, fontSize: 13, marginBottom: 8, fontFamily: Fonts.body }}>Type</Text>
                                <View style={{ flexDirection: 'row', gap: 10 }}>
                                    {['Hypermarket', 'Supermarket', 'Convenience'].map(type => (
                                        <TouchableOpacity
                                            key={type}
                                            onPress={() => setNewGMS({ ...newGMS, type })}
                                            style={{ flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: newGMS.type === type ? COLOR.primary : COLOR.border, backgroundColor: newGMS.type === type ? COLOR.primary + '12' : COLOR.surface, alignItems: 'center' }}
                                        >
                                            <Text style={{ color: newGMS.type === type ? COLOR.primary : COLOR.text, fontSize: 13, fontFamily: Fonts.bodySemiBold }}>{type}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* City */}
                            <View>
                                <Text style={{ color: COLOR.textMuted, fontSize: 13, marginBottom: 8, fontFamily: Fonts.body }}>City</Text>
                                <TextInput
                                    style={{ backgroundColor: COLOR.surface, borderWidth: 1, borderColor: COLOR.border, borderRadius: 10, padding: 14, color: COLOR.text, outlineStyle: 'none' } as any}
                                    value={newGMS.city}
                                    onChangeText={t => setNewGMS({ ...newGMS, city: t })}
                                    placeholder="e.g. Tunis"
                                    placeholderTextColor={COLOR.textMuted}
                                />
                            </View>

                            {/* Address */}
                            <View>
                                <Text style={{ color: COLOR.textMuted, fontSize: 13, marginBottom: 8, fontFamily: Fonts.body }}>Address</Text>
                                <TextInput
                                    style={{ backgroundColor: COLOR.surface, borderWidth: 1, borderColor: COLOR.border, borderRadius: 10, padding: 14, color: COLOR.text, outlineStyle: 'none', minHeight: 72 } as any}
                                    value={newGMS.address}
                                    onChangeText={t => setNewGMS({ ...newGMS, address: t })}
                                    placeholder="Full address details"
                                    placeholderTextColor={COLOR.textMuted}
                                    multiline
                                    numberOfLines={3}
                                />
                            </View>

                            {/* Supervisor */}
                            <View>
                                <Text style={{ color: COLOR.textMuted, fontSize: 13, marginBottom: 8, fontFamily: Fonts.body }}>Supervisor</Text>
                                <View style={{ backgroundColor: COLOR.surface, borderWidth: 1, borderColor: COLOR.border, borderRadius: 10, overflow: 'hidden' }}>
                                    <select
                                        style={{ width: '100%', padding: '14px', backgroundColor: 'transparent', color: COLOR.text, border: 'none', outline: 'none' }}
                                        value={newGMS.supervisor_id || ''}
                                        onChange={e => setNewGMS({ ...newGMS, supervisor_id: (e.target as any).value ? parseInt((e.target as any).value) : undefined })}
                                    >
                                        <option value="" style={{ color: '#000' }}>No Supervisor (Unassigned)</option>
                                        {supervisors.map(sup => (
                                            <option key={sup.id} value={sup.id} style={{ color: '#000' }}>
                                                {(sup as any).first_name || sup.firstName} {(sup as any).last_name || sup.lastName}
                                            </option>
                                        ))}
                                    </select>
                                </View>
                            </View>
                        </div>

                        {/* Footer */}
                        {/* @ts-ignore */}
                        <div style={{ padding: '18px 28px', borderTop: `1px solid ${COLOR.border}`, display: 'flex', justifyContent: 'flex-end', gap: 10, flexShrink: 0 } as any}>
                            <WebButton label="Cancel" variant="outline" onPress={() => setModalVisible(false)} />
                            <WebButton label={isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Store'} onPress={handleSaveGMS} disabled={isSubmitting} />
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile fallback */}
            {modalVisible && Platform.OS !== 'web' && (
                <Modal transparent animationType="fade">
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
                        <WebCard style={{ width: 500, padding: 30, maxHeight: '90%' }}>
                            <Text style={{ color: COLOR.text, fontSize: 20, fontFamily: Fonts.headingSemiBold, marginBottom: 20 }}>
                                {isEditing ? 'Edit Store' : 'Add New Store'}
                            </Text>
                            <ScrollView style={{ flex: 1, marginBottom: 20 }} showsVerticalScrollIndicator={false}>
                                <View style={{ gap: 16 }}>
                                    <View>
                                        <Text style={{ color: COLOR.textMuted, fontSize: 13, marginBottom: 8, fontFamily: Fonts.body }}>Store Name</Text>
                                        <TextInput style={{ backgroundColor: COLOR.surface, borderWidth: 1, borderColor: COLOR.border, borderRadius: 10, padding: 14, color: COLOR.text } as any} value={newGMS.name} onChangeText={t => setNewGMS({ ...newGMS, name: t })} placeholder="e.g. Carrefour Marsa" placeholderTextColor={COLOR.textMuted} />
                                    </View>
                                    <View>
                                        <Text style={{ color: COLOR.textMuted, fontSize: 13, marginBottom: 8, fontFamily: Fonts.body }}>City</Text>
                                        <TextInput style={{ backgroundColor: COLOR.surface, borderWidth: 1, borderColor: COLOR.border, borderRadius: 10, padding: 14, color: COLOR.text } as any} value={newGMS.city} onChangeText={t => setNewGMS({ ...newGMS, city: t })} placeholder="e.g. Tunis" placeholderTextColor={COLOR.textMuted} />
                                    </View>
                                </View>
                            </ScrollView>
                            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
                                <WebButton label="Cancel" variant="outline" onPress={() => setModalVisible(false)} />
                                <WebButton label={isSubmitting ? 'Saving...' : 'Save'} onPress={handleSaveGMS} disabled={isSubmitting} />
                            </View>
                        </WebCard>
                    </View>
                </Modal>
            )}

            {/* ── Assign Merchandiser — Web Dialog ── */}
            {isAssignModalVisible && selectedStore && Platform.OS === 'web' && (
                // @ts-ignore
                <div
                    onClick={() => setIsAssignModalVisible(false)}
                    style={{
                        position: 'fixed', inset: 0, zIndex: 9999,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backgroundColor: 'rgba(0,0,0,0.55)',
                        backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
                        animation: 'wm-fadein 0.15s ease',
                    } as any}
                >
                    {/* @ts-ignore */}
                    <div
                        onClick={(e: any) => e.stopPropagation()}
                        style={{
                            width: 440, maxWidth: 'calc(100vw - 32px)',
                            backgroundColor: COLOR.card,
                            border: `1px solid ${COLOR.border}`,
                            borderRadius: 20, overflow: 'hidden',
                            display: 'flex', flexDirection: 'column',
                            boxShadow: '0 24px 48px rgba(0,0,0,0.3)',
                            animation: 'wm-slidein 0.2s cubic-bezier(0.22,1,0.36,1)',
                        } as any}
                    >
                        {/* @ts-ignore */}
                        <div style={{ padding: '24px 28px', borderBottom: `1px solid ${COLOR.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' } as any}>
                            {/* @ts-ignore */}
                            <div>
                                {/* @ts-ignore */}
                                <p style={{ margin: 0, fontSize: 18, fontWeight: 700, fontFamily: Fonts.heading, color: COLOR.text }}>Assign Merchandiser</p>
                                {/* @ts-ignore */}
                                <p style={{ margin: '4px 0 0', fontSize: 13, color: COLOR.textMuted, fontFamily: Fonts.body }}>Covering: {selectedStore.name}</p>
                            </div>
                            <TouchableOpacity onPress={() => setIsAssignModalVisible(false)} style={{ padding: 6 }}>
                                <Ionicons name="close" size={22} color={COLOR.textMuted} />
                            </TouchableOpacity>
                        </div>

                        {/* @ts-ignore */}
                        <div style={{ padding: '24px 28px', overflowY: 'auto' } as any}>
                            <Text style={{ color: COLOR.textMuted, fontSize: 13, marginBottom: 8, fontFamily: Fonts.body }}>Merchandiser</Text>
                            <View style={{ backgroundColor: COLOR.surface, borderWidth: 1, borderColor: COLOR.border, borderRadius: 10, overflow: 'hidden', marginBottom: 8 }}>
                                <select
                                    style={{ width: '100%', padding: '14px', backgroundColor: 'transparent', color: COLOR.text, border: 'none', outline: 'none' }}
                                    value={selectedMerchandiserId || ''}
                                    onChange={e => setSelectedMerchandiserId((e.target as any).value ? parseInt((e.target as any).value) : null)}
                                >
                                    <option value="" style={{ color: '#000' }}>Choose Merchandiser...</option>
                                    {merchandisers.map(merch => (
                                        <option key={merch.id} value={merch.id} style={{ color: '#000' }}>
                                            {(merch as any).first_name || merch.firstName} {(merch as any).last_name || merch.lastName}
                                        </option>
                                    ))}
                                </select>
                            </View>
                        </div>

                        {/* @ts-ignore */}
                        <div style={{ padding: '18px 28px', borderTop: `1px solid ${COLOR.border}`, display: 'flex', justifyContent: 'flex-end', gap: 10 } as any}>
                            <WebButton label="Cancel" variant="outline" onPress={() => setIsAssignModalVisible(false)} />
                            <WebButton label={isSubmitting ? 'Assigning...' : 'Assign'} onPress={handleAssignMerchandiser} disabled={isSubmitting || !selectedMerchandiserId} />
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile fallback */}
            {isAssignModalVisible && selectedStore && Platform.OS !== 'web' && (
                <Modal transparent animationType="fade">
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
                        <WebCard style={{ width: 400, padding: 30 }}>
                            <Text style={{ color: COLOR.text, fontSize: 18, fontFamily: Fonts.headingSemiBold, marginBottom: 20 }}>Assign Merchandiser</Text>
                            <Text style={{ color: COLOR.textMuted, fontSize: 14, marginBottom: 20, fontFamily: Fonts.body }}>Select a merchandiser to cover {selectedStore.name}.</Text>
                            <View style={{ marginBottom: 24 }}>
                                <Text style={{ color: COLOR.textMuted, fontSize: 13, marginBottom: 8, fontFamily: Fonts.body }}>Merchandiser</Text>
                                <View style={{ backgroundColor: COLOR.surface, borderWidth: 1, borderColor: COLOR.border, borderRadius: 10, overflow: 'hidden' }}>
                                    <select style={{ width: '100%', padding: '14px', backgroundColor: 'transparent', color: COLOR.text, border: 'none', outline: 'none' }} value={selectedMerchandiserId || ''} onChange={e => setSelectedMerchandiserId((e.target as any).value ? parseInt((e.target as any).value) : null)}>
                                        <option value="" style={{ color: '#000' }}>Choose Merchandiser...</option>
                                        {merchandisers.map(merch => (<option key={merch.id} value={merch.id} style={{ color: '#000' }}>{(merch as any).first_name || merch.firstName} {(merch as any).last_name || merch.lastName}</option>))}
                                    </select>
                                </View>
                            </View>
                            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
                                <WebButton label="Cancel" variant="outline" onPress={() => setIsAssignModalVisible(false)} />
                                <WebButton label={isSubmitting ? 'Assigning...' : 'Assign'} onPress={handleAssignMerchandiser} disabled={isSubmitting || !selectedMerchandiserId} />
                            </View>
                        </WebCard>
                    </View>
                </Modal>
            )}
        </AdminWebLayout>
        
        {/* Store Details Drawer */}
        <Modal visible={isDrawerOpen} transparent animationType="slide">
            <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <TouchableOpacity style={{ flex: 1 }} onPress={() => setIsDrawerOpen(false)} />
                <View style={{ width: 450, height: '100%', backgroundColor: COLOR.surface, padding: 30, borderLeftWidth: 1, borderColor: COLOR.border, shadowColor: '#000', shadowOffset: { width: -5, height: 0 }, shadowOpacity: 0.1, shadowRadius: 20 }}>
                    {detailedStore && (
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
                                <Text style={{ color: COLOR.text, fontSize: 24, fontFamily: Fonts.headingXBold }}>{detailedStore.name}</Text>
                                <TouchableOpacity onPress={() => setIsDrawerOpen(false)}>
                                    <Ionicons name="close" size={28} color={COLOR.textMuted} />
                                </TouchableOpacity>
                            </View>
                            
                            <Text style={{ color: COLOR.textMuted, fontSize: 14, fontFamily: Fonts.bodyBold, letterSpacing: 1, marginBottom: 12 }}>INFO</Text>
                            <WebCard style={{ marginBottom: 24 }}>
                                <View style={{ gap: 12 }}>
                                    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                                        <Ionicons name="business" size={20} color={COLOR.primary} />
                                        <Text style={{ color: COLOR.text, fontSize: 14, fontFamily: Fonts.bodySemiBold }}>{detailedStore.type || 'Supermarket'}</Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                                        <Ionicons name="location" size={20} color={COLOR.primary} />
                                        <Text style={{ color: COLOR.text, fontSize: 14, fontFamily: Fonts.bodySemiBold }}>{detailedStore.address || 'No specific address'} - {detailedStore.city}</Text>
                                    </View>
                                </View>
                            </WebCard>

                            <Text style={{ color: COLOR.textMuted, fontSize: 14, fontFamily: Fonts.bodyBold, letterSpacing: 1, marginBottom: 12 }}>ASSIGNED USERS</Text>
                            <WebCard style={{ marginBottom: 24 }}>
                                {merchandisers.length > 0 ? (
                                    merchandisers.slice(0, 2).map((m, i) => (
                                        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderBottomWidth: i === 0 ? 1 : 0, borderBottomColor: COLOR.border }}>
                                            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: COLOR.primary + '20', alignItems: 'center', justifyContent: 'center' }}>
                                                <Text style={{ color: COLOR.primary, fontFamily: Fonts.bodyBold }}>{(m.firstName || 'M')[0]}</Text>
                                            </View>
                                            <View>
                                                <Text style={{ color: COLOR.text, fontSize: 14, fontFamily: Fonts.bodySemiBold }}>{m.firstName} {m.lastName}</Text>
                                                <Text style={{ color: COLOR.textMuted, fontSize: 12, fontFamily: Fonts.body }}>Merchandiser</Text>
                                            </View>
                                        </View>
                                    ))
                                ) : (
                                    <Text style={{ color: COLOR.textMuted, fontSize: 14, fontFamily: Fonts.body }}>No users assigned yet.</Text>
                                )}
                            </WebCard>

                            <Text style={{ color: COLOR.textMuted, fontSize: 14, fontFamily: Fonts.bodyBold, letterSpacing: 1, marginBottom: 12 }}>ARTICLES LIST</Text>
                            <WebCard style={{ padding: 0 }}>
                                {['Coca Cola 1.5L', 'Fanta Orange 1L', 'Sprite 1.5L', 'Schweppes 1L', 'Oasis 2L'].map((article, i) => (
                                    <View key={i} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: i < 4 ? 1 : 0, borderBottomColor: COLOR.border }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                            <Ionicons name="pricetag-outline" size={18} color={COLOR.textMuted} />
                                            <Text style={{ color: COLOR.text, fontSize: 14, fontFamily: Fonts.bodySemiBold }}>{article}</Text>
                                        </View>
                                        <Ionicons name="chevron-forward" size={16} color={COLOR.border} />
                                    </View>
                                ))}
                            </WebCard>
                        </ScrollView>
                    )}
                </View>
            </View>
        </Modal>
        </>
    );
}

const styles = StyleSheet.create({});
