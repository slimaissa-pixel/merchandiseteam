import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as ExpoLocation from 'expo-location';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import { ButtonStyles, CommonStyles, HeaderStyles, MapOffsets, MapStyles, NavStyles } from '@/constants/designSystem';
import { useTheme } from '@/context/ThemeContext';

// Sample store locations for merchandiser visits
const storeLocations = [
    { id: 1, name: 'Walmart Supercenter', lat: 41.9845, lng: -88.0316, status: 'completed', address: '1244 N Meacham Rd, Schaumburg' },
    { id: 2, name: 'Target - Chicago North', lat: 41.9294, lng: -87.6435, status: 'current', address: '2650 N Clark St, Chicago' },
    { id: 3, name: 'Walgreens Pharmacy', lat: 41.8859, lng: -87.6279, status: 'pending', address: '151 N State St, Chicago' },
    { id: 4, name: 'Costco Wholesale', lat: 41.9097, lng: -87.8326, status: 'pending', address: '1375 N Farnsworth Ave, Aurora' },
    { id: 5, name: 'CVS Pharmacy', lat: 41.8781, lng: -87.6298, status: 'pending', address: '200 W Madison St, Chicago' },
];

// Generate the Leaflet HTML for OpenStreetMap
const generateMapHTML = (isDark: boolean) => {
    const markersJS = storeLocations.map(store => {
        const iconColor = store.status === 'completed' ? '#16a34a' :
            store.status === 'current' ? '#135bec' : '#94a3b8';
        const iconHtml = store.status === 'completed' ? '✓' :
            store.status === 'current' ? '●' : '○';

        const imageUrl = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80';

        return `
      L.marker([${store.lat}, ${store.lng}], {
        icon: L.divIcon({
          className: 'custom-marker',
          html: '<div style="background-color: ${iconColor}; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.3); border: 2px solid white;">${iconHtml}</div>',
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        })
      }).addTo(map)
        .bindPopup('<div style="width: 200px; font-family: system-ui, sans-serif;"><img src="' + imageUrl + '" style="width: 100%; height: 100px; object-fit: cover; border-radius: 8px; margin-bottom: 8px;" /><b style="font-size: 14px; color: #1e293b; display: block; margin-bottom: 4px;">${store.name}</b><span style="color: #64748b; font-size: 12px; display: block; margin-bottom: 4px;">${store.address}</span><span style="color: ${iconColor}; font-weight: bold; text-transform: uppercase; font-size: 10px;">${store.status}</span><div style="margin-top: 12px; display: flex; gap: 8px;"><button onclick=\\'window.ReactNativeWebView.postMessage(JSON.stringify({action: "view_details", id: ${store.id}}))\\' style="flex: 1; padding: 6px; background: #135bec; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 12px;">Details</button><button onclick=\\'window.ReactNativeWebView.postMessage(JSON.stringify({action: "route", id: ${store.id}}))\\' style="flex: 1; padding: 6px; background: #e2e8f0; color: #1e293b; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 12px;">Route</button></div></div>');
    `;
    }).join('\n');

    const tileUrl = isDark
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    const attribution = isDark
        ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        * { margin: 0; padding: 0; }
        html, body, #map { 
          height: 100%; 
          width: 100%; 
          background: ${isDark ? '#1e293b' : '#f6f6f8'};
        }
        .leaflet-popup-content-wrapper {
          background: ${isDark ? '#334155' : '#ffffff'};
          color: ${isDark ? '#f8fafc' : '#0d121b'};
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .leaflet-popup-tip {
          background: ${isDark ? '#334155' : '#ffffff'};
        }
        .custom-marker { background: transparent; border: none; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map', {
          center: [41.9, -87.7],
          zoom: 11,
          zoomControl: true
        });
        
        var tileLayers = {
          relief: L.tileLayer(tileUrl, {
            maxZoom: 20,
            attribution: attribution
          }),
          satellite: L.tileLayer('http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
            maxZoom: 20,
            subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
            attribution: 'Google Maps'
          }),
          traffic: L.tileLayer('http://{s}.google.com/vt/lyrs=m,traffic&x={x}&y={y}&z={z}', {
            maxZoom: 20,
            subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
            attribution: 'Google Maps'
          })
        };

        var currentLayer = tileLayers.relief;
        currentLayer.addTo(map);

        function setMapLayer(type) {
          if (tileLayers[type]) {
            map.removeLayer(currentLayer);
            currentLayer = tileLayers[type];
            currentLayer.addTo(map);
          }
        }
        
        ${markersJS}
        
        // Draw route line between stores
        var routeCoords = [
          ${storeLocations.map(s => `[${s.lat}, ${s.lng}]`).join(',\n          ')}
        ];
        
        L.polyline(routeCoords, {
          color: '#135bec',
          weight: 3,
          opacity: 0.7,
          dashArray: '10, 10'
        }).addTo(map);
        
        var userMarker = null;

        function updateUserLocation(lat, lng) {
          if (userMarker) {
            userMarker.setLatLng([lat, lng]);
          } else {
            userMarker = L.marker([lat, lng], {
              icon: L.divIcon({
                className: 'user-marker',
                html: '<div style="background-color: #507cc1ff; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(59,130,246,0.5);"></div>',
                iconSize: [22, 22],
                iconAnchor: [11, 11]
              })
            }).addTo(map);
          }
          map.setView([lat, lng], 15);
        }

        // Fit bounds to show all markers
        var bounds = L.latLngBounds(routeCoords);
        map.fitBounds(bounds, { padding: [30, 30] });
      </script>
    </body>
    </html>
  `;
};

export default function MerchandiserMap() {
    const router = useRouter();
    const { theme } = useTheme();
    const [isLoading, setIsLoading] = useState(true);
    const [isLocating, setIsLocating] = useState(false);
    const [isLayerMenuVisible, setIsLayerMenuVisible] = useState(false);
    const [currentLayer, setCurrentLayer] = useState<'relief' | 'satellite' | 'traffic'>('relief');
    const [selectedFilter, setSelectedFilter] = useState('all');
    const webViewRef = useRef<WebView>(null);

    const isDark = theme === 'dark';

    const locateUser = async () => {
        try {
            setIsLocating(true);
            const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Location permission is required to find your position.');
                return;
            }

            // Try to get current position with a timeout
            let location;
            try {
                location = await Promise.race([
                    ExpoLocation.getCurrentPositionAsync({ accuracy: ExpoLocation.Accuracy.Balanced }),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Location timeout')), 5000))
                ]) as ExpoLocation.LocationObject;
            } catch (err) {
                console.log('[Location] Timeout or error getting current position, trying last known...');
                location = await ExpoLocation.getLastKnownPositionAsync();
            }

            if (!location) {
                throw new Error('Could not verify current location. Please ensure GPS is enabled.');
            }

            const { latitude, longitude } = location.coords;
            console.log('[Map] User location:', latitude, longitude);

            const jsCode = `updateUserLocation(${latitude}, ${longitude})`;
            webViewRef.current?.injectJavaScript(jsCode);
        } catch (error: any) {
            console.error('Error getting location:', error);
            Alert.alert('Location Error', error.message || 'Could not get your current location.');
        } finally {
            setIsLocating(false);
        }
    };

    const setLayer = (type: 'relief' | 'satellite' | 'traffic') => {
        setCurrentLayer(type);
        setIsLayerMenuVisible(false);
        webViewRef.current?.injectJavaScript(`setMapLayer('${type}')`);
    };

    // Theme colors
    const bgColor = isDark ? '#1e293b' : '#f6f6f8';
    const cardColor = isDark ? '#334155' : '#ffffff';
    const textColor = isDark ? '#f8fafc' : '#0d121b';
    const subTextColor = isDark ? '#94a3b8' : '#4c669a';
    const borderColor = isDark ? '#475569' : '#e5e7eb';

    const filters = [
        { id: 'all', label: 'All', count: storeLocations.length },
        { id: 'pending', label: 'Pending', count: storeLocations.filter(s => s.status === 'pending').length },
        { id: 'current', label: 'Current', count: storeLocations.filter(s => s.status === 'current').length },
        { id: 'completed', label: 'Done', count: storeLocations.filter(s => s.status === 'completed').length },
    ];

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
            <View style={[styles.header, { backgroundColor: bgColor }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={textColor} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: textColor }]}>Route Map</Text>
                <TouchableOpacity style={styles.headerRight}>
                    <Ionicons name="options-outline" size={24} color={textColor} />
                </TouchableOpacity>
            </View>

            <View style={styles.filterContainer}>
                {filters.map((filter) => (
                    <TouchableOpacity
                        key={filter.id}
                        style={[
                            styles.filterButton,
                            {
                                backgroundColor: selectedFilter === filter.id
                                    ? '#135bec'
                                    : isDark ? '#475569' : '#e5e7eb'
                            }
                        ]}
                        onPress={() => setSelectedFilter(filter.id)}
                    >
                        <Text style={[
                            styles.filterText,
                            { color: selectedFilter === filter.id ? '#ffffff' : textColor }
                        ]}>
                            {filter.label}
                        </Text>
                        <View style={[
                            styles.filterBadge,
                            { backgroundColor: selectedFilter === filter.id ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)' }
                        ]}>
                            <Text style={[
                                styles.filterBadgeText,
                                { color: selectedFilter === filter.id ? '#ffffff' : subTextColor }
                            ]}>
                                {filter.count}
                            </Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.mapContainer}>
                {isLoading && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color="#135bec" />
                        <Text style={[styles.loadingText, { color: subTextColor }]}>Loading map...</Text>
                    </View>
                )}
                <WebView
                    ref={webViewRef}
                    source={{ html: generateMapHTML(isDark) }}
                    style={styles.webview}
                    onLoadEnd={() => setIsLoading(false)}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    startInLoadingState={false}
                    scalesPageToFit={true}
                    onMessage={(event) => {
                        try {
                            const data = JSON.parse(event.nativeEvent.data);
                            if (data.action === 'view_details') {
                                const store = storeLocations.find(s => s.id === data.id);
                                if (store) {
                                    Alert.alert('Store Details', `${store.name}\n${store.address}\nStatus: ${store.status}`);
                                }
                            } else if (data.action === 'route') {
                                Alert.alert('Routing', 'Starting navigation to this store...');
                            }
                        } catch (e) {
                            console.log('Error parsing webview message', e);
                        }
                    }}
                />

                {/* Layer Selection Menu */}
                {isLayerMenuVisible && (
                    <View style={[styles.layerMenu, { backgroundColor: cardColor, borderColor }]}>
                        <TouchableOpacity
                            style={[styles.layerOption, currentLayer === 'relief' && styles.activeLayerOption]}
                            onPress={() => setLayer('relief')}
                        >
                            <MaterialIcons name="terrain" size={20} color={currentLayer === 'relief' ? '#fff' : textColor} />
                            <Text style={[styles.layerOptionText, { color: currentLayer === 'relief' ? '#fff' : textColor }]}>Relief</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.layerOption, currentLayer === 'satellite' && styles.activeLayerOption]}
                            onPress={() => setLayer('satellite')}
                        >
                            <MaterialIcons name="satellite" size={20} color={currentLayer === 'satellite' ? '#fff' : textColor} />
                            <Text style={[styles.layerOptionText, { color: currentLayer === 'satellite' ? '#fff' : textColor }]}>Satellite</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.layerOption, currentLayer === 'traffic' && styles.activeLayerOption]}
                            onPress={() => setLayer('traffic')}
                        >
                            <MaterialIcons name="traffic" size={20} color={currentLayer === 'traffic' ? '#fff' : textColor} />
                            <Text style={[styles.layerOptionText, { color: currentLayer === 'traffic' ? '#fff' : textColor }]}>Traffic</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <TouchableOpacity
                    style={[styles.layerButton, { backgroundColor: cardColor }]}
                    onPress={() => setIsLayerMenuVisible(!isLayerMenuVisible)}
                    activeOpacity={0.7}
                >
                    <MaterialIcons name="layers" size={24} color="#135bec" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.locateButton, { backgroundColor: cardColor }]}
                    onPress={locateUser}
                    activeOpacity={0.7}
                    disabled={isLocating}
                >
                    {isLocating ? (
                        <ActivityIndicator size="small" color="#135bec" />
                    ) : (
                        <MaterialIcons name="my-location" size={24} color="#135bec" />
                    )}
                </TouchableOpacity>
            </View>

            <View style={[styles.infoCard, { backgroundColor: cardColor }]}>
                <View style={styles.infoRow}>
                    <View style={styles.infoItem}>
                        <View style={[styles.infoIcon, { backgroundColor: isDark ? '#1e3a5f' : '#e0ecff' }]}>
                            <MaterialIcons name="storefront" size={20} color="#135bec" />
                        </View>
                        <View>
                            <Text style={[styles.infoValue, { color: textColor }]}>5</Text>
                            <Text style={[styles.infoLabel, { color: subTextColor }]}>Total Stores</Text>
                        </View>
                    </View>

                    <View style={styles.infoDivider} />

                    <View style={styles.infoItem}>
                        <View style={[styles.infoIcon, { backgroundColor: isDark ? '#065f46' : '#d1fae5' }]}>
                            <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                        </View>
                        <View>
                            <Text style={[styles.infoValue, { color: textColor }]}>1</Text>
                            <Text style={[styles.infoLabel, { color: subTextColor }]}>Completed</Text>
                        </View>
                    </View>

                    <View style={styles.infoDivider} />

                    <View style={styles.infoItem}>
                        <View style={[styles.infoIcon, { backgroundColor: isDark ? '#4c1d1d' : '#fee2e2' }]}>
                            <Ionicons name="navigate" size={20} color="#ef4444" />
                        </View>
                        <View>
                            <Text style={[styles.infoValue, { color: textColor }]}>12.4 mi</Text>
                            <Text style={[styles.infoLabel, { color: subTextColor }]}>Remaining</Text>
                        </View>
                    </View>
                </View>
            </View>

            <View style={[NavStyles.bottomNav, { backgroundColor: cardColor, borderColor: borderColor }]}>
                <NavItem icon="grid" label="Overview" isDark={isDark} onPress={() => router.push('/merchandiser/dashboard')} />
                <NavItem icon="people" label="Team" isDark={isDark} onPress={() => router.push('/merchandiser/team')} />
                <NavItem icon="storefront" label="GMS" isDark={isDark} onPress={() => router.push('/merchandiser/gms')} />
                <NavItem icon="calendar" label="Journal" isDark={isDark} onPress={() => router.push('/merchandiser/journal')} />
                <NavItem active icon="map" label="Map" isDark={isDark} onPress={() => { }} />
                <NavItem icon="person" label="Profile" isDark={isDark} onPress={() => router.push('/merchandiser/profile')} />
            </View>
        </SafeAreaView>
    );
}

function NavItem({ icon, label, active = false, isDark = false, onPress }: any) {
    const inactiveColor = isDark ? '#64748b' : '#94a3b8';
    return (
        <TouchableOpacity style={styles.navItem} onPress={onPress}>
            <Ionicons
                name={icon as any}
                size={22}
                color={active ? '#135bec' : inactiveColor}
            />
            <Text style={[styles.navText, { color: active ? '#135bec' : inactiveColor }]}>
                {label}
            </Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    safeArea: CommonStyles.safeArea,
    header: HeaderStyles.header,
    backButton: HeaderStyles.iconBtn,
    headerTitle: HeaderStyles.headerTitle,
    headerRight: HeaderStyles.iconBtn,

    filterContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 8,
        marginBottom: 12,
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
    },
    filterText: {
        fontSize: 13,
        fontWeight: '600',
    },
    filterBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
    },
    filterBadgeText: {
        fontSize: 11,
        fontWeight: '700',
    },

    mapContainer: {
        flex: 1,
        marginHorizontal: 16,
        borderRadius: 16,
        overflow: 'hidden',
    },
    webview: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.1)',
        zIndex: 10,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        fontWeight: '500',
    },

    infoCard: {
        marginHorizontal: 16,
        marginVertical: 12,
        padding: 16,
        borderRadius: 16,
    },
    infoRow: CommonStyles.row,
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    infoIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    infoValue: {
        fontSize: 16,
        fontWeight: '700',
    },
    infoLabel: {
        fontSize: 11,
    },
    infoDivider: {
        width: 1,
        height: 40,
        backgroundColor: '#e5e7eb',
    },

    navItem: NavStyles.navItem,
    navText: NavStyles.navText,

    locateButton: {
        ...ButtonStyles.fab,
        bottom: MapOffsets.fabBottomSecondary,
        right: 16,
    },
    layerButton: {
        ...ButtonStyles.fab,
        bottom: MapOffsets.fabBottomPrimary,
        right: 16,
    },
    layerMenu: {
        ...MapStyles.menu,
        bottom: MapOffsets.fabBottomPrimary,
    },
    layerOption: MapStyles.menuOption,
    activeLayerOption: {
        backgroundColor: '#135bec',
    },
    layerOptionText: MapStyles.optionText,
});
