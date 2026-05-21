import { Stack, useRouter } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DARK_COLORS } from '@/constants/appColors';

export default function NotYetScreen() {
    const router = useRouter();
    const COLOR = DARK_COLORS;

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: 'Coming Soon', headerShown: false }} />
            <Ionicons name="construct-outline" size={80} color={COLOR.gold} />
            <Text style={styles.title}>Coming Soon</Text>
            <Text style={styles.subtitle}>This feature is being prepared for the FieldForce mobile network.</Text>
            <TouchableOpacity style={styles.button} onPress={() => router.replace('/')}>
                <Text style={styles.buttonText}>Return to Command</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0B0615',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
    },
    title: {
        color: '#fff',
        fontSize: 28,
        fontWeight: '900',
        marginTop: 24,
    },
    subtitle: {
        color: '#94a3b8',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 12,
        marginBottom: 40,
        lineHeight: 24,
    },
    button: {
        backgroundColor: '#d4a84b',
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 16,
    },
    buttonText: {
        color: '#000',
        fontWeight: '900',
        fontSize: 16,
    },
});
