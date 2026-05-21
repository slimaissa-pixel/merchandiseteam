import { useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types/auth';

export function useRoleProtection(allowedRoles: UserRole[]) {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const segments = useSegments();

    useEffect(() => { 
        if (isLoading) return;

        if (!user) {
            // If not logged in, redirect to login
            router.replace('/login');
            return;
        }
        const normalizedRole = (user.role ? user.role.toLowerCase().trim() : 'merchandiser') as UserRole;

        if (!allowedRoles.includes(normalizedRole)) {
            // If logged in but wrong role, redirect to their own dashboard
            if (normalizedRole === 'admin') {
                if (Platform.OS !== 'web') router.replace('/supervisor/dashboard');
                else router.replace('/admin/dashboard');
            }
            else if (normalizedRole === 'supervisor') router.replace('/supervisor/dashboard');
            else if (normalizedRole === 'merchandiser') router.replace('/merchandiser/dashboard');
            else router.replace('/'); // Fallback
        }
    }, [user, isLoading, segments, allowedRoles, router]);

    const normalizedRole = (user?.role ? user.role.toLowerCase().trim() : 'merchandiser') as UserRole;
    return { isAuthorized: user && allowedRoles.includes(normalizedRole), isLoading };
}
