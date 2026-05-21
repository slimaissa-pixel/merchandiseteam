import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { SERVER_IP } from './server-ip';

const getBaseUrl = () => {
    // 1. Web environment
    if (Platform.OS === 'web') {
        // If we are running on localhost in the browser, always use localhost for the backend too
        if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
            console.log('[API] Web detected on localhost, using localhost:8000');
            return 'http://localhost:8000';
        }
        
        if (SERVER_IP && SERVER_IP !== '127.0.0.1' && SERVER_IP !== 'localhost') {
            console.log('[API] Web detected, using SERVER_IP:', SERVER_IP);
            return `http://${SERVER_IP}:8000`;
        }
        return 'http://localhost:8000';
    }

    const hostUri = Constants.expoConfig?.hostUri;
    const ip = hostUri ? hostUri.split(':')[0] : null;

    // 2. Detect if we are using a tunnel (e.g. ngrok, expo-tunnel)
    // If it's a tunnel, the hostUri won't be a local IP, and the backend 
    // won't be reachable at that domain on port 8000.
    const isTunnel = hostUri && (hostUri.includes('exp.direct') || hostUri.includes('expo.dev'));

    // 3. Dynamic Expo IP (Best for physical devices on LAN)
    if (ip && ip !== '127.0.0.1' && ip !== 'localhost' && !isTunnel) {
        const url = `http://${ip}:8000`;
        console.log('[API] Using dynamic hostUri IP:', url);
        return url;
    }

    // 4. Manual SERVER_IP fallback (from server-ip.ts) - CRITICAL for Tunnels
    if (SERVER_IP && SERVER_IP !== '127.0.0.1') {
        console.log('[API] Using manual SERVER_IP fallback:', SERVER_IP);
        return `http://${SERVER_IP}:8000`;
    }

    // 5. Android Emulator fallback
    if (Platform.OS === 'android') {
        console.log('[API] Android environment (likely emulator), using 10.0.2.2:8000');
        return 'http://10.0.2.2:8000';
    }

    // 6. Default Fallback (iOS Simulator / Localhost)
    const fallbackUrl = 'http://127.0.0.1:8000';
    console.log('[API] Using default fallback:', fallbackUrl);
    return fallbackUrl;
};

export const API_BASE_URL = getBaseUrl();
console.log('[API] Final API_BASE_URL:', API_BASE_URL);

export const API_ENDPOINTS = {
    LOGIN: `${API_BASE_URL}/api/auth/token`,
    REGISTER: `${API_BASE_URL}/api/users/`,
    USERS: `${API_BASE_URL}/api/users/`,
    GMS: `${API_BASE_URL}/api/gms/`,
    GMS_NEAREST: `${API_BASE_URL}/api/gms/nearest/`,
    GMS_WITHIN_RADIUS: `${API_BASE_URL}/api/gms/within-radius/`,
    NOTIFICATIONS: `${API_BASE_URL}/api/notifications/`,
    REPORTS: `${API_BASE_URL}/api/reports/`,
};

export const getFullImageUrl = (path?: string | null) => {
    if (!path) return null;
    if (path.startsWith('http') || path.startsWith('data:image')) return path;
    if (path.startsWith('/')) return `${API_BASE_URL}${path}`;
    return `${API_BASE_URL}/${path}`;
};
