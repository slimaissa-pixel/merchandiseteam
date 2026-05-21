import '../web-polyfill';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import { Stack } from 'expo-router/stack';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { ToastProvider } from '@/context/ToastContext';

import { useAppFonts } from '@/hooks/useFonts';
import { NotificationProvider } from '@/context/NotificationContext';
import { GlobalAlert } from '@/components/ui/GlobalAlert';
import { OfflineBanner } from '@/components/ui/OfflineBanner';

// Configure notification behavior — native only (web has no NativeEventEmitter)
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}


// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { fontsLoaded: appFontsLoaded } = useAppFonts();
  const [iconsLoaded, iconError] = useFonts({
    ...Ionicons.font,
  });

  const allLoaded = appFontsLoaded && iconsLoaded;

  useEffect(() => {
    if (allLoaded) {
      SplashScreen.hideAsync();
    }
  }, [allLoaded]);

  if (!allLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NotificationProvider>
          <ThemeProvider>
            <ToastProvider>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="login" />
                <Stack.Screen name="signup" />
                <Stack.Screen name="merchandiser" />
                <Stack.Screen name="supervisor" />
                <Stack.Screen name="admin" />
              </Stack>
              <StatusBar style="auto" />
              <GlobalAlert />
              <OfflineBanner />
            </ToastProvider>
          </ThemeProvider>
        </NotificationProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
