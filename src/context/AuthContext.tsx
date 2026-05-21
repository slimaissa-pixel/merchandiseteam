import { Platform } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';

import apiClient, { setAuthTokenCache } from '@/services/apiClient';
import { AuthService } from '@/services/auth.service';
import { appEventEmitter, AppEvents } from '@/services/eventEmitter';
import { StorageKeys, StorageService } from '@/services/storage.service';
import { AuthState, User } from '@/types/auth';
import { supabase } from '../../lib/supabase';

const AuthContext = createContext<AuthState>({
    user: null,
    isLoading: true,
    signIn: async () => {},
    signOut: async () => {},
    updateUser: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const segments = useSegments();

    // 🔐 Sign In
    const signIn = async (
        email: string,
        password: string,
        remember = true
    ) => {
        const result = await AuthService.login(email, password);
        if (!result) {
            throw new Error('Invalid credentials or server unavailable.');
        }

        setUser(result);

        if (remember) {
            const token = await StorageService.getItem(StorageKeys.USER_TOKEN);
            if (token) setAuthTokenCache(token);
            await StorageService.setItem(StorageKeys.USER_SESSION, JSON.stringify(result));
        }
    };

    // 🚪 Sign Out
    const signOut = async () => {
        setAuthTokenCache(null);
        await StorageService.removeItem(StorageKeys.USER_SESSION);
        await StorageService.removeItem(StorageKeys.USER_TOKEN);
        await StorageService.removeItem(StorageKeys.REFRESH_TOKEN);
        setUser(null);
        router.replace('/');
    };

    // 🔄 Update Local Session Memory
    const updateUser = async (updatedUser: User) => {
        setUser(updatedUser);
        await StorageService.setItem(StorageKeys.USER_SESSION, JSON.stringify(updatedUser));
    };

    // 🔁 Load session on startup
    useEffect(() => {
        let isMounted = true;
        const loadUser = async () => {
            try {
                const jsonUser = await StorageService.getItem(StorageKeys.USER_SESSION);
                const token = await StorageService.getItem(StorageKeys.USER_TOKEN);

                if (jsonUser && token) {
                    if (AuthService.isTokenExpired(token)) {
                        console.log('[Auth] Token expired locally');
                        await signOut();
                        return;
                    }

                    const storedUser = JSON.parse(jsonUser);
                    setAuthTokenCache(token);
                    if (isMounted) setUser(storedUser);

                    try {
                            const res = await apiClient.get('/api/users/me');
                            const me = res.data;
                            const freshUser = {
                                ...storedUser,
                                firstName: me.first_name ?? storedUser.firstName,
                                lastName: me.last_name ?? storedUser.lastName,
                                email: me.email ?? storedUser.email,
                            };
                            if (isMounted) setUser(freshUser);
                            await StorageService.setItem(StorageKeys.USER_SESSION, JSON.stringify(freshUser));
                        } catch (e) {
                            console.log('[Auth] Background /me refresh failed.');
                        }
                } else {
                    // ✅ No stored session — check if there's an active Supabase OAuth session
                    // (handles Google OAuth redirect with #access_token in URL)
                    try {
                        const { data: { session } } = await supabase.auth.getSession();
                        if (session) {
                            // Let onAuthStateChange handle the full login flow
                            // Just delay setting null so we don't override it
                            console.log('[Auth] Supabase session found on startup — waiting for onAuthStateChange.');
                            return; // don't set user null; onAuthStateChange will set it
                        }
                    } catch (_) {}
                    if (isMounted) setUser(null);
                }
            } catch (e) {
                console.error('[Auth] loadUser fatal error', e);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };
        loadUser();
        return () => { isMounted = false; };
    }, []);

    // 🔐 Handle Supabase OAuth callback (Google Sign-In redirect)
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session) {
                // Check if we already have a stored session (avoid double-firing for normal login)
                const stored = await StorageService.getItem(StorageKeys.USER_TOKEN);
                if (stored === session.access_token) return;

                try {
                    setAuthTokenCache(session.access_token);
                    await StorageService.setItem(StorageKeys.USER_TOKEN, session.access_token);
                    if (session.refresh_token) {
                        await StorageService.setItem(StorageKeys.REFRESH_TOKEN, session.refresh_token);
                    }

                    // Fetch full profile from backend DB
                    const meResponse = await apiClient.get('/api/users/me');
                    const me = meResponse.data;
                    const meta = session.user.user_metadata || {};
                    const googleName = meta.full_name || meta.name || '';
                    const nameParts = googleName.split(' ');
                    
                    const loggedUser: User = {
                        id: me.id?.toString() || '0',
                        email: me.email || session.user.email || '',
                        firstName: me.first_name || meta.given_name || (nameParts.length > 0 ? nameParts[0] : 'User'),
                        lastName: me.last_name || meta.family_name || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : ''),
                        role: (me.role || 'merchandiser').toLowerCase().trim(),
                        phone: me.phone || undefined,
                        status: me.status || undefined,
                        profileZone: me.profile_zone || undefined,
                        profileImage: me.profile_image || session.user.user_metadata?.avatar_url || null,
                        address: me.address || undefined,
                        tags: me.tags || undefined,
                        password: '',
                    };
                    await StorageService.setItem(StorageKeys.USER_SESSION, JSON.stringify(loggedUser));
                    setUser(loggedUser);
                } catch (e) {
                    console.error('[Auth] OAuth onAuthStateChange /me failed:', e);
                    // Fallback: build user from Supabase token metadata
                    const meta = session.user.user_metadata || {};
                    const googleName = meta.full_name || meta.name || '';
                    const nameParts = googleName.split(' ');
                    const fallbackUser: User = {
                        id: session.user.id,
                        email: session.user.email || '',
                        firstName: meta.given_name || (nameParts.length > 0 ? nameParts[0] : 'User'),
                        lastName: meta.family_name || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : ''),
                        role: 'merchandiser',
                        profileImage: meta.avatar_url || null,
                        password: '',
                    };
                    await StorageService.setItem(StorageKeys.USER_SESSION, JSON.stringify(fallbackUser));
                    setUser(fallbackUser);
                }
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
            }
        });
        return () => subscription.unsubscribe();
    }, []);

    // 🧭 Routing + RBAC
    useEffect(() => {
        if (isLoading) return;
        const guestOnlyRoutes = ['login', 'signup', 'forgot-password'];
        const publicRoutes = ['', '+not-found', 'EventsHistory', 'about', 'index','indexMobile','not-yet']; 
        const currentSegment = segments[0] || '';

        const roleRoutes: Record<string, string> = {
            admin: Platform.OS === 'web' ? '/admin/dashboard' : '/supervisor/dashboard',
            supervisor: '/supervisor/dashboard',
            merchandiser: '/merchandiser/dashboard'
        };

        if (!user) {
            const isGuestAllowed = guestOnlyRoutes.includes(currentSegment) || publicRoutes.includes(currentSegment);
            if (!isGuestAllowed) {
                router.replace('/');
            }
        } else {
            const normalizedRole = user.role ? user.role.toLowerCase().trim() : 'merchandiser';
            const dashboardRoute = roleRoutes[normalizedRole] ?? '/';
            const isLandingPage = currentSegment === '' || currentSegment === 'light_index';
            const isAdminOnMobile = normalizedRole === 'admin' && Platform.OS !== 'web' && currentSegment === 'admin';

            if (guestOnlyRoutes.includes(currentSegment) || isLandingPage || isAdminOnMobile) {
                // Only replace if the target is different from current to prevent loops
                const target = dashboardRoute.startsWith('/') ? dashboardRoute.substring(1) : dashboardRoute;
                const current = segments.join('/');
                if (target !== current) {
                    console.log(`[Auth] Redirecting to dashboard: ${dashboardRoute}`);
                    router.replace(dashboardRoute as any);
                }
                return;
            }
        }
    }, [user, segments, isLoading]);

    // 🚨 Unauthorized global handler
    useEffect(() => {
        const handleUnauthorized = () => {
            console.log('[Auth] Global 401 caught → Redirecting to landing page');
            signOut(); 
        };
        appEventEmitter.on(AppEvents.UNAUTHORIZED, handleUnauthorized);
        return () => appEventEmitter.off(AppEvents.UNAUTHORIZED, handleUnauthorized);
    }, []);

    return (
        <AuthContext.Provider value={{ user, isLoading, signIn, signOut, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
}
