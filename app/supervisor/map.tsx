import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as ExpoLocation from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View, Platform, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomNav } from '@/components/ui/BottomNav';
import { getColors } from '@/constants/designSystem';
import { SUPERVISOR_NAV_ITEMS } from '@/constants/navigation';
import { ButtonStyles, CommonStyles, HeaderStyles, MapStyles } from '@/constants/designSystem';
import { useTheme } from '@/context/ThemeContext';
import { GMS, GMSService } from '@/services/gms.service';
import { LocationService } from '@/services/location.service';

// Conditional import for WebView to avoid crashes on Web/Desktop
const WebView = (Platform.OS !== 'web' ? require('react-native-webview').WebView : View) as any;

// Generate Premium Leaflet HTML
const generateMapHTML = (
    stores: GMS[],
    team: any[],
    isDark: boolean,
    centerLat?: number,
    centerLng?: number,
    centerZoom?: number,
    highlightName?: string
) => {
    const lat = centerLat || (stores.length > 0 ? stores[0].latitude : 35.84578);
    const lng = centerLng || (stores.length > 0 ? stores[0].longitude : 10.61174);
    const zoom = centerZoom || 13;

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        #map { width: 100%; height: 100vh; background: ${isDark ? '#0f172a' : '#f8fafc'}; }
        
        /* Premium Marker Styles */
        .merch-marker-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .merch-avatar-wrapper {
            position: relative;
            width: 44px;
            height: 44px;
            border-radius: 50%;
            padding: 2px;
            background: linear-gradient(135deg, #3b82f6, #135bec);
            box-shadow: 0 4px 12px rgba(19, 91, 236, 0.4);
            border: 2px solid white;
        }
        
        .merch-avatar {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background-size: cover;
            background-position: center;
            background-color: #e2e8f0;
        }
        
        .status-badge {
            position: absolute;
            bottom: -2px;
            right: -2px;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: white;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            border: 1px solid #e2e8f0;
            z-index: 2;
        }
        
        .status-badge i {
            font-size: 10px;
            color: #1e293b;
        }
        
        .merch-label {
            margin-top: 4px;
            background: rgba(15, 23, 42, 0.85);
            color: white;
            padding: 2px 8px;
            border-radius: 10px;
            font-size: 10px;
            font-weight: 600;
            white-space: nowrap;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .pulse {
            position: absolute;
            top: 0; left: 0; width: 100%; height: 100%;
            border-radius: 50%;
            background: rgba(59, 130, 246, 0.4);
            animation: pulse-animation 2s infinite;
            z-index: -1;
        }
        
        @keyframes pulse-animation {
            0% { transform: scale(1); opacity: 1; }
            100% { transform: scale(2.5); opacity: 0; }
        }
        
        /* Store Markers */
        .store-marker {
            background: #135bec;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        
        /* Popup Styles */
        .leaflet-popup-content-wrapper {
            background: ${isDark ? '#1e293b' : 'white'};
            color: ${isDark ? '#f8fafc' : '#1e293b'};
            border-radius: 16px;
            padding: 0;
            overflow: hidden;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        }
        
        .leaflet-popup-tip {
            background: ${isDark ? '#1e293b' : 'white'};
        }
        
        .custom-popup-content {
            padding: 0;
            width: 220px;
        }
        
        .popup-header {
            height: 80px;
            background-size: cover;
            background-position: center;
            position: relative;
        }
        
        .popup-body {
            padding: 12px;
        }
        
        .popup-title {
            font-weight: 700;
            font-size: 14px;
            margin-bottom: 4px;
            display: block;
        }
        
        .popup-meta {
            font-size: 11px;
            color: ${isDark ? '#94a3b8' : '#64748b'};
            display: flex;
            align-items: center;
            gap: 4px;
            margin-bottom: 8px;
        }
        
        .popup-actions {
            display: flex;
            gap: 8px;
            margin-top: 12px;
        }
        
        .btn-primary {
            flex: 1;
            background: #135bec;
            color: white;
            border: none;
            padding: 8px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 11px;
            cursor: pointer;
            transition: opacity 0.2s;
        }
        
        .btn-secondary {
            flex: 1;
            background: ${isDark ? '#334155' : '#f1f5f9'};
            color: ${isDark ? '#f1f5f9' : '#334155'};
            border: none;
            padding: 8px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 11px;
            cursor: pointer;
        }
        
        .btn-primary:active, .btn-secondary:active { opacity: 0.7; }
        
        /* Dark map overrides */
        .leaflet-container { background: ${isDark ? '#0f172a' : '#f8fafc'} !important; }

        /* Style Selector */
        .map-style-selector {
            position: absolute;
            top: 14px;
            left: 14px;
            z-index: 1000;
        }
        
        .map-style-selector select {
            background: rgba(15, 23, 42, 0.85);
            backdrop-filter: blur(8px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: white;
            padding: 8px 12px;
            border-radius: 10px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            outline: none;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
    </style>
</head>
<body>
    <div id="map"></div>
    <div class="map-style-selector">
        <select id="style-select" onchange="changeStyle(this.value)">
            <option value="default">Default Map</option>
            <option value="dark">Dark Matter</option>
            <option value="satellite">Satellite View</option>
        </select>
    </div>
    <script>
        var isDark = ${isDark};
        var map = L.map('map', {
            zoomControl: false,
            attributionControl: false
        }).setView([${lat}, ${lng}], ${zoom});
        
        var STYLES = {
            default: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
            satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        };

        var currentStyle = isDark ? 'dark' : 'default';
        document.getElementById('style-select').value = currentStyle;
        
        var tileLayer = L.tileLayer(STYLES[currentStyle], { maxZoom: 20 }).addTo(map);

        function changeStyle(style) {
            map.removeLayer(tileLayer);
            tileLayer = L.tileLayer(STYLES[style], { maxZoom: 20 }).addTo(map);
        }

        var stores = ${JSON.stringify(stores)};
        var team = ${JSON.stringify(team)};
        var highlightName = ${JSON.stringify(highlightName || '')};
        
        var teamMarkers = {};

        function getStatusIcon(activity) {
            switch(activity) {
                case 'driving': return 'fa-car';
                case 'walking': return 'fa-walking';
                case 'running': return 'fa-running';
                case 'cycling': return 'fa-bicycle';
                case 'still': return 'fa-person-rays';
                default: return 'fa-location-dot';
            }
        }

        function updateMerchLocation(data) {
            var id = data.user_id;
            var lat = data.latitude;
            var lng = data.longitude;
            var name = data.name || 'Merchandiser';
            var activity = data.activity || 'still';
            var phone = data.phone || '';
            var avatar = data.profile_image || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(name) + '&background=random';
            
            var iconHtml = \`
                <div class="merch-marker-container">
                    <div class="merch-avatar-wrapper">
                        <div class="pulse"></div>
                        <div class="merch-avatar" style="background-image: url('\${avatar}')"></div>
                        <div class="status-badge">
                            <i class="fa-solid \${getStatusIcon(activity)}"></i>
                        </div>
                    </div>
                    <div class="merch-label">\${name}</div>
                </div>
            \`;

            var popupHtml = \`
                <div class="custom-popup-content">
                    <div class="popup-header" style="background-image: url('\${avatar}')"></div>
                    <div class="popup-body">
                        <span class="popup-title">\${name}</span>
                        <div class="popup-meta">
                            <i class="fa-solid fa-clock"></i> Last seen: Just now
                        </div>
                        <div class="popup-meta">
                            <i class="fa-solid fa-bolt"></i> Status: \${activity.charAt(0).toUpperCase() + activity.slice(1)}
                        </div>
                        <div class="popup-actions">
                            <button class="btn-primary" onclick="sendAction({action: 'view_history', id: \${id}})">History</button>
                            <button class="btn-secondary" onclick="sendAction({action: 'call', id: \${id}, phone: '\${phone}'})">Call</button>
                        </div>
                    </div>
                </div>
            \`;

            if (teamMarkers[id]) {
                var marker = teamMarkers[id];
                marker.setLatLng([lat, lng]);
                marker.setIcon(L.divIcon({
                    className: 'custom-div-icon',
                    html: iconHtml,
                    iconSize: [60, 80],
                    iconAnchor: [30, 60]
                }));
                marker.getPopup().setContent(popupHtml);
            } else {
                teamMarkers[id] = L.marker([lat, lng], {
                    icon: L.divIcon({
                        className: 'custom-div-icon',
                        html: iconHtml,
                        iconSize: [60, 80],
                        iconAnchor: [30, 60]
                    })
                }).addTo(map);
                
                teamMarkers[id].bindPopup(popupHtml);
            }
        }

        stores.forEach(function(store) {
            if (!store.latitude || !store.longitude) return;

            var marker = L.marker([store.latitude, store.longitude], {
                icon: L.divIcon({
                    className: 'store-icon',
                    html: '<div class="store-marker"></div>',
                    iconSize: [12, 12],
                    iconAnchor: [6, 6]
                })
            }).addTo(map);
            
            var imageUrl = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80';
            
            var popupContent = \`
                <div class="custom-popup-content">
                    <div class="popup-header" style="background-image: url('\${imageUrl}')"></div>
                    <div class="popup-body">
                        <span class="popup-title">\${store.name}</span>
                        <div class="popup-meta">
                            <i class="fa-solid fa-location-dot"></i> \${store.address || 'Address N/A'}
                        </div>
                        <div class="popup-actions">
                            <button class="btn-primary" onclick="sendAction({action: 'view_details', id: \${store.id}})">Details</button>
                            <button class="btn-secondary" onclick="sendAction({action: 'route', id: \${store.id}})">Route</button>
                        </div>
                    </div>
                </div>
            \`;
            
            marker.bindPopup(popupContent);
            if (store.name === highlightName) marker.openPopup();
        });

        // Add initial team
        team.forEach(function(member) {
            if (member.workday && member.workday.last_lat) {
                updateMerchLocation({
                    user_id: member.merchandiser.id,
                    latitude: member.workday.last_lat,
                    longitude: member.workday.last_lng,
                    name: member.merchandiser.name,
                    activity: member.workday.activity,
                    phone: member.merchandiser.phone,
                    profile_image: member.merchandiser.profile_image
                });
            }
        });

        function sendAction(data) {
            var msg = JSON.stringify(data);
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(msg);
            } else {
                window.parent.postMessage(msg, "*");
            }
        }
        
        // Listen for JS injections
        window.addEventListener('message', function(event) {
            try {
                var data = JSON.parse(event.data);
                if (data.type === 'js') eval(data.code);
            } catch(e) {}
        });
    </script>
</body>
</html>
`;
};

export default function MapPage() {
    const router = useRouter();
    const { theme } = useTheme();
    const params = useLocalSearchParams<{
        lat?: string;
        lng?: string;
        storeName?: string;
        zoom?: string;
    }>();

    const [stores, setStores] = useState<GMS[]>([]);
    const [team, setTeam] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isLocating, setIsLocating] = useState(false);
    const webViewRef = useRef<any>(null);

    const isDark = theme === 'dark';
    const colors = getColors(theme);
    const bgColor = colors.background;
    const cardColor = colors.surface;
    const textColor = colors.text;

    const runJS = (code: string) => {
        if (Platform.OS === 'web') {
            const iframe = document.getElementById('map-iframe') as HTMLIFrameElement;
            if (iframe?.contentWindow) {
                iframe.contentWindow.postMessage(JSON.stringify({ type: 'js', code }), '*');
            }
        } else {
            webViewRef.current?.injectJavaScript(code);
        }
    };

    const handleAction = (data: any) => {
        if (data.action === 'view_details') {
            const store = stores.find(s => s.id === data.id);
            if (store) {
                Alert.alert('Store Details', `${store.name}\n${store.address || ''}\nType: ${store.type || 'N/A'}`);
            }
        } else if (data.action === 'route') {
            Alert.alert('Routing', 'Starting navigation...');
        } else if (data.action === 'view_history') {
            router.push(`/supervisor/visits?userId=${data.id}`);
        } else if (data.action === 'call') {
            if (data.phone) {
                Linking.openURL(`tel:${data.phone}`);
            } else {
                Alert.alert('Error', 'Phone number not available for this user.');
            }
        } else if (data.action === 'error') {
            console.error('[Leaflet Error]', data.message);
        }
    };

    const locateUser = async () => {
        try {
            setIsLocating(true);
            const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
            if (status !== 'granted') return;

            const location = await ExpoLocation.getCurrentPositionAsync({});
            const { latitude, longitude } = location.coords;
            runJS(`map.setView([${latitude}, ${longitude}], 15);`);
        } catch (error) {
            console.error('Error locating:', error);
        } finally {
            setIsLocating(false);
        }
    };

    useEffect(() => {
        loadData();
        
        const handleMessage = (event: MessageEvent) => {
            try {
                const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
                if (data?.action) handleAction(data);
            } catch (e) {}
        };
        
        if (Platform.OS === 'web') window.addEventListener('message', handleMessage);

        const intervalId = setInterval(async () => {
            try {
                const teamData = await LocationService.getTeamLiveStatus();
                teamData.forEach(member => {
                    if (member.workday && member.workday.last_lat) {
                        runJS(`updateMerchLocation({
                            user_id: ${member.merchandiser.id},
                            latitude: ${member.workday.last_lat},
                            longitude: ${member.workday.last_lng},
                            name: "${member.merchandiser.name}",
                            activity: "${member.workday.activity || 'still'}",
                            phone: "${member.merchandiser.phone || ''}",
                            profile_image: "${member.merchandiser.profile_image || ''}"
                        })`);
                    }
                });
            } catch (err) {}
        }, 10000);

        return () => {
            clearInterval(intervalId);
            if (Platform.OS === 'web') window.removeEventListener('message', handleMessage);
        };
    }, []);

    const loadData = async () => {
        try {
            const [storesData, teamData] = await Promise.all([
                GMSService.getAll(),
                LocationService.getTeamLiveStatus()
            ]);
            setStores(storesData);
            setTeam(teamData);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const centerLat = params.lat ? parseFloat(params.lat) : undefined;
    const centerLng = params.lng ? parseFloat(params.lng) : undefined;
    const centerZoom = params.zoom ? parseInt(params.zoom) : (centerLat ? 16 : undefined);
    const storeName = params.storeName || undefined;

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
            <View style={[styles.header, { backgroundColor: cardColor }]}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={textColor} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: textColor }]}>
                    {storeName ? storeName : 'Team Live Tracking'}
                </Text>
                <TouchableOpacity onPress={loadData}>
                    <Ionicons name="refresh" size={24} color="#135bec" />
                </TouchableOpacity>
            </View>

            <View style={styles.mapContainer}>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#135bec" />
                    </View>
                ) : (
                    <>
                        {Platform.OS === 'web' ? (
                            <iframe
                                id="map-iframe"
                                srcDoc={generateMapHTML(stores, team, isDark, centerLat, centerLng, centerZoom, storeName)}
                                style={{ width: '100%', height: '100%', border: 'none' }}
                                title="Supervisor Map"
                            />
                        ) : (
                            <WebView
                                ref={webViewRef}
                                source={{ html: generateMapHTML(stores, team, isDark, centerLat, centerLng, centerZoom, storeName) }}
                                style={styles.map}
                                javaScriptEnabled={true}
                                domStorageEnabled={true}
                                onMessage={(event: { nativeEvent: { data: string; }; }) => {
                                    try {
                                        const data = JSON.parse(event.nativeEvent.data);
                                        handleAction(data);
                                    } catch (e) {}
                                }}
                            />
                        )}

                        <TouchableOpacity
                            style={[styles.locateButton, { backgroundColor: cardColor }]}
                            onPress={locateUser}
                            activeOpacity={0.7}
                            disabled={isLocating}
                        >
                            {isLocating ? <ActivityIndicator size="small" color="#135bec" /> : <MaterialIcons name="my-location" size={24} color="#135bec" />}
                        </TouchableOpacity>
                    </>
                )}
            </View>

            <BottomNav items={SUPERVISOR_NAV_ITEMS} activeRoute="/supervisor/map" />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: CommonStyles.safeArea,
    header: {
        ...HeaderStyles.header,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
    },
    headerTitle: HeaderStyles.headerTitle,
    mapContainer: MapStyles.container,
    map: MapStyles.map,
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    locateButton: {
        ...ButtonStyles.fab,
        bottom: 30,
        right: 16,
    },
});
