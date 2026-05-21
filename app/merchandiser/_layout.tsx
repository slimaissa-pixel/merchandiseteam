import { Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useRoleProtection } from '@/hooks/useRoleProtection';

export default function MerchandiserLayout() {
    const { isAuthorized, isLoading } = useRoleProtection(['merchandiser']);

    if (isLoading || !isAuthorized) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#27ae60" />
            </View>
        );
    }

    return (
        <Stack
            screenOptions={{
                headerShown: false,
                animation: 'none',
                animationDuration: 0,
            }}
        >
            <Stack.Screen name="dashboard" />
            <Stack.Screen name="supervisor" />
            <Stack.Screen name="planning" />
            <Stack.Screen name="objectives" />
            <Stack.Screen name="journal" />
            <Stack.Screen name="profile" />
            <Stack.Screen name="visits" />
            <Stack.Screen name="reports" />
            <Stack.Screen name="leave" />
            <Stack.Screen name="events" />
            <Stack.Screen name="notifications" />
            <Stack.Screen name="gms" />
            <Stack.Screen name="documents" />
            <Stack.Screen name="map" />
            <Stack.Screen name="complaints" />
            <Stack.Screen name="articles" />
            <Stack.Screen name="privacy" />
            <Stack.Screen name="help" />
        </Stack>
    );
}
