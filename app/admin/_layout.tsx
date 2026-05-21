import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, Platform, View } from 'react-native';
import { useRoleProtection } from '@/hooks/useRoleProtection';

export default function AdminLayout() {
    const { isAuthorized, isLoading } = useRoleProtection(['admin']);

    if (isLoading || !isAuthorized) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#7a2117ff" />
            </View>
        );
    }

    // 📱 Mobile Guard: Admin is desktop-only. On mobile, redirect to Supervisor dashboard.
    if (Platform.OS !== 'web') {
        return <Redirect href="/supervisor/dashboard" />;
    }

    return (
        <Stack
            screenOptions={{
                headerShown: false,
                animation: 'fade',
                animationDuration: 50,
            }}
        >
            <Stack.Screen name="dashboard" />
            <Stack.Screen name="profile" />
            <Stack.Screen name="before-after" />
            <Stack.Screen name="users" />
            <Stack.Screen name="leave" />
            <Stack.Screen name="planning" />
            <Stack.Screen name="events" />
            <Stack.Screen name="notifications" />
            <Stack.Screen name="gms" />
            <Stack.Screen name="documents" />
            <Stack.Screen name="articles" />
            <Stack.Screen name="complaints" />
            <Stack.Screen name="visits" />
            <Stack.Screen name="privacy" />
            <Stack.Screen name="help" />
        </Stack>
    );
}
