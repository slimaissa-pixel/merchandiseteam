import { User } from '@/types/auth';
import apiClient, { setAuthTokenCache } from './apiClient';
import { StorageKeys, StorageService } from './storage.service';
import { supabase } from '../../lib/supabase';

// JWT Helper Functions
interface JWTPayload {
    id?: string;
    email?: string;
    role?: string;
    first_name?: string;
    last_name?: string;
    exp?: number;
    [key: string]: any;
}

const base64Decode = (str: string) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let output = '';
    str = str.replace(/=+$/, '');
    if (str.length % 4 === 1) throw new Error("'atob' failed: The string to be decoded is not correctly encoded.");
    for (let bc = 0, bs = 0, buffer, i = 0;
        buffer = str.charAt(i++);
        ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer,
            bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0
    ) {
        buffer = chars.indexOf(buffer);
    }
    return output;
};

const base64Encode = (str: string) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let output = '';
    let i = 0;
    while (i < str.length) {
        const c1 = str.charCodeAt(i++);
        const c2 = i < str.length ? str.charCodeAt(i++) : NaN;
        const c3 = i < str.length ? str.charCodeAt(i++) : NaN;

        const e1 = c1 >> 2;
        const e2 = ((c1 & 3) << 4) | (isNaN(c2) ? 0 : c2 >> 4);
        const e3 = isNaN(c2) ? 64 : ((c2 & 15) << 2) | (isNaN(c3) ? 0 : c3 >> 6);
        const e4 = isNaN(c3) ? 64 : c3 & 63;

        output += chars.charAt(e1) + chars.charAt(e2) + chars.charAt(e3) + chars.charAt(e4);
    }
    return output;
};

const decodeJWT = (token: string): JWTPayload | null => {
    try {
        if (!token || !token.includes('.')) return null;
        const payloadBase64 = token.split('.')[1];
        if (!payloadBase64) return null;
        const base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
        const paddedBase64 = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
        return JSON.parse(base64Decode(paddedBase64));
    } catch (error) {
        console.error('Failed to decode JWT:', error);
        return null;
    }
};

export const AuthService = {
    // Check if token is expired
    isTokenExpired: (token: string): boolean => {
        try {
            const payload = decodeJWT(token);
            if (!payload || !payload.exp) return true;

            const expirationTime = payload.exp * 1000;
            const currentTime = Date.now();
            const bufferTime = 30 * 1000; // 30 seconds (reduced from 5m to avoid premature logout)

            return expirationTime - currentTime < bufferTime;
        } catch (error) {
            return true;
        }
    },

    // Get token expiration time
    getTokenExpiration: (token: string): Date | null => {
        try {
            const payload = decodeJWT(token);
            if (!payload || !payload.exp) return null;
            return new Date(payload.exp * 1000);
        } catch (error) {
            return null;
        }
    },

    login: async (email: string, password: string): Promise<User | null> => {
        try {
            const demoRoles: Record<string, string> = {
                'admin': 'admin',
                'supervisor': 'supervisor',
                'merch': 'merchandiser',
                'adel': 'merchandiser'
            };
            const demoDomains: Record<string, string> = {
                'admin': 'admin.com',
                'supervisor': 'sup.com',
                'merch': 'merch.com',
                'adel': 'merch.com'
            };
            const rawRole = email.split('@')[0].toLowerCase();
            const isDemoAccount = !!demoRoles[rawRole];
            const normalizedEmail = email.includes('@') ? email : `${rawRole}@${demoDomains[rawRole] || 'demo.com'}`;

            console.log(`[Auth] Attempting login for: ${normalizedEmail} (Demo: ${isDemoAccount})`);

            let accessToken: string;
            let refreshToken: string | null = null;

            try {
                // Try Custom Backend Auth First
                const requestBody = `username=${encodeURIComponent(normalizedEmail)}&password=${encodeURIComponent(password)}`;
                const response = await apiClient.post('/api/auth/token', requestBody, {
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                });
                accessToken = response.data.access_token;
            } catch (error: any) {
                // Fallback for Demo Accounts
                if (isDemoAccount) {
                    console.log(`[Auth] Backend auth failed for demo account. Bypassing...`);
                    const payload: JWTPayload = { 
                        id: '0',
                        email: normalizedEmail, 
                        role: demoRoles[rawRole], 
                        first_name: 'Demo', 
                        last_name: rawRole, 
                        exp: Math.floor(Date.now() / 1000) + 86400 
                    };
                    const payloadBase64 = base64Encode(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
                    accessToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${payloadBase64}.fakesig`;
                } else {
                    throw error;
                }
            }

            const payload = decodeJWT(accessToken);
            if (!payload) throw new Error('Failed to decode backend token');

            // Save token first so apiClient can use it for the next request
            setAuthTokenCache(accessToken);
            await StorageService.setItem(StorageKeys.USER_TOKEN, accessToken);
            if (refreshToken) {
                await StorageService.setItem(StorageKeys.REFRESH_TOKEN, refreshToken);
            }

            // Fetch full profile from DB (includes profileImage, phone, profileZone…)
            try {
                const meResponse = await apiClient.get('/api/users/me');
                const me = meResponse.data;
                console.log(`[Auth] Backend profile fetched for ${me.email}`);
                const user: User = {
                    id: me.id?.toString() || payload.id || '0',
                    email: me.email || normalizedEmail,
                    firstName: me.first_name || payload.first_name || 'User',
                    lastName: me.last_name || payload.last_name || '',
                    role: (me.role || payload.role || 'merchandiser').toLowerCase().trim(),
                    phone: me.phone || undefined,
                    status: me.status || undefined,
                    profileZone: me.profile_zone || undefined,
                    profileImage: me.profile_image || null,
                    address: me.address || undefined,
                    tags: me.tags || undefined,
                    password: '',
                };
                return user;
            } catch {
                // Fallback to JWT-only data if /me call fails
                const rawRole = (payload.role || 'merchandiser') as string;
                const role = (rawRole === 'merch' ? 'merchandiser' : rawRole) as any;
                const user: User = {
                    id: payload.id || '0',
                    email: normalizedEmail,
                    firstName: payload.first_name || 'User',
                    lastName: payload.last_name || '',
                    role: role,
                    password: '',
                };
                return user;
            }
        } catch (error: any) {
            console.error('[Auth] Login error:', error);
            const detail = error.response?.data?.detail;
            const message = typeof detail === 'string' 
                ? detail 
                : (typeof detail === 'object' && detail?.message)
                    ? detail.message
                    : (error.message || 'Login failed');
            throw new Error(message);
        }
    },

    register: async (userData: any): Promise<any> => {
        try {
            const response = await apiClient.post('/api/users/', userData);
            return response.data;
        } catch (error: any) {
            console.error('[Auth] Registration error:', error);
            const message = error.response?.data?.detail || error.message || 'Registration failed';
            throw new Error(message);
        }
    }
};
