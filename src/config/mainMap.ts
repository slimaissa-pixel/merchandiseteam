export const MAP_DEFAULTS = {
    INITIAL_REGION: {
        latitude: 36.575,
        longitude: 10.05,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
    },
    IFRAME_URL: "https://www.openstreetmap.org/export/embed.html?bbox=8.5,33.0,11.5,37.5&layer=mapnik",
    COLORS: {
        user: '#3b82f6',
        success: '#10b981',
        default: '#6366f1',
        warning: '#f59e0b',
        danger: '#ef4444'
    }
};

export const WEB_MAP_STYLES = {
    satellite: {
        version: 8,
        sources: {
            'satellite': {
                type: 'raster',
                tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
                tileSize: 256
            }
        },
        layers: [{ id: 'satellite', type: 'raster', source: 'satellite' }]
    },
    voyager: {
        version: 8,
        sources: {
            'voyager': {
                type: 'raster',
                tiles: ['https://basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png'],
                tileSize: 256,
                attribution: '&copy; OpenStreetMap & CARTO'
            }
        },
        layers: [{ id: 'voyager', type: 'raster', source: 'voyager' }]
    },
    darkMatter: {
        version: 8,
        sources: {
            'dark-matter': {
                type: 'raster',
                tiles: ['https://basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png'],
                tileSize: 256,
                attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
            }
        },
        layers: [{ id: 'dark-matter', type: 'raster', source: 'dark-matter' }]
    }
};

export const NATIVE_MAP_STYLES = {
    standard: [],
    dark: [
        {
            "elementType": "geometry",
            "stylers": [
                {
                    "color": "#242f3e"
                }
            ]
        },
        {
            "elementType": "labels.text.fill",
            "stylers": [
                {
                    "color": "#746855"
                }
            ]
        },
        {
            "elementType": "labels.text.stroke",
            "stylers": [
                {
                    "color": "#242f3e"
                }
            ]
        },
        {
            "featureType": "administrative.locality",
            "elementType": "labels.text.fill",
            "stylers": [
                {
                    "color": "#d59563"
                }
            ]
        },
        {
            "featureType": "poi",
            "elementType": "labels.text.fill",
            "stylers": [
                {
                    "color": "#d59563"
                }
            ]
        },
        {
            "featureType": "poi.park",
            "elementType": "geometry",
            "stylers": [
                {
                    "color": "#263c3f"
                }
            ]
        },
        {
            "featureType": "poi.park",
            "elementType": "labels.text.fill",
            "stylers": [
                {
                    "color": "#6b9a76"
                }
            ]
        },
        {
            "featureType": "road",
            "elementType": "geometry",
            "stylers": [
                {
                    "color": "#38414e"
                }
            ]
        },
        {
            "featureType": "road",
            "elementType": "geometry.stroke",
            "stylers": [
                {
                    "color": "#212a37"
                }
            ]
        },
        {
            "featureType": "road",
            "elementType": "labels.text.fill",
            "stylers": [
                {
                    "color": "#9ca5b3"
                }
            ]
        },
        {
            "featureType": "road.highway",
            "elementType": "geometry",
            "stylers": [
                {
                    "color": "#746855"
                }
            ]
        },
        {
            "featureType": "road.highway",
            "elementType": "geometry.stroke",
            "stylers": [
                {
                    "color": "#1f2835"
                }
            ]
        },
        {
            "featureType": "road.highway",
            "elementType": "labels.text.fill",
            "stylers": [
                {
                    "color": "#f3d19c"
                }
            ]
        },
        {
            "featureType": "transit",
            "elementType": "geometry",
            "stylers": [
                {
                    "color": "#2f3948"
                }
            ]
        },
        {
            "featureType": "transit.station",
            "elementType": "labels.text.fill",
            "stylers": [
                {
                    "color": "#d59563"
                }
            ]
        },
        {
            "featureType": "water",
            "elementType": "geometry",
            "stylers": [
                {
                    "color": "#17263c"
                }
            ]
        },
        {
            "featureType": "water",
            "elementType": "labels.text.fill",
            "stylers": [
                {
                    "color": "#515c6d"
                }
            ]
        },
        {
            "featureType": "water",
            "elementType": "labels.text.stroke",
            "stylers": [
                {
                    "color": "#17263c"
                }
            ]
        }
    ]
};

export const ICONS = {
    user: `<div style="position: relative; display: flex; justify-content: center; align-items: center; width: 100%; height: 100%;">
        <div style="position: absolute; width: 100%; height: 100%; background-color: #06b6d4; border-radius: 50%; opacity: 0.4; animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;"></div>
        <div style="width: 14px; height: 14px; background-color: #06b6d4; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px rgba(6, 182, 212, 0.8);"></div>
        <style>
            @keyframes pulse {
                0% { transform: scale(1); opacity: 0.8; }
                50% { transform: scale(2.5); opacity: 0; }
                100% { transform: scale(1); opacity: 0; }
            }
        </style>
    </div>`,
    store: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`
};
