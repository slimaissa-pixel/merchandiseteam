import { Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useRoleProtection } from '@/hooks/useRoleProtection';

export default function SupervisorLayout() {
    const { isAuthorized, isLoading } = useRoleProtection(['supervisor', 'admin']);

    if (isLoading || !isAuthorized) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#f39c12" />
            </View>
        );
    }

    return (
        <Stack
            screenOptions={{
                headerShown: false,
                animation: 'fade',
                animationDuration: 50,
            }}>

            <Stack.Screen name="index" />
            <Stack.Screen name="dashboard" />
            <Stack.Screen name="team" />
            <Stack.Screen name="planning" />
            <Stack.Screen name="profile" />
            <Stack.Screen name="reports" />
            <Stack.Screen name="gms" />
            <Stack.Screen name="map" />
            <Stack.Screen name="documents" />
            <Stack.Screen name="notifications" />
            <Stack.Screen name="leave" />
            <Stack.Screen name="articles" />
            <Stack.Screen name="complaints" />
            <Stack.Screen name="objectives" />
            <Stack.Screen name="events" />
            <Stack.Screen name="visits" />
            <Stack.Screen name="privacy" />
            <Stack.Screen name="help" />
            <Stack.Screen name="exceptions" />
            <Stack.Screen name="visit_logs" />
            <Stack.Screen name="performance" />
        </Stack>
    );
}
