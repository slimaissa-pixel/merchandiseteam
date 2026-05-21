import { Camera } from 'expo-camera';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

export function usePermissions() {
    const [locationStatus, setLocationStatus] = useState<PermissionStatus>('undetermined');
    const [notificationStatus, setNotificationStatus] = useState<PermissionStatus>('undetermined');
    const [cameraStatus, setCameraStatus] = useState<PermissionStatus>('undetermined');

    const requestNotificationPermission = useCallback(async () => {
        if (Platform.OS === 'web') return;
        try {
            const result = await Notifications.requestPermissionsAsync();
            const status = ((result as any).status === 'granted' || (result as any).granted ? 'granted' : 'denied') as PermissionStatus;
            setNotificationStatus(status);
        } catch (error) {
            console.error('Error requesting notification permission:', error);
        }
    }, []);

    const requestLocationPermission = useCallback(async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            setLocationStatus(status as PermissionStatus);
            return status === 'granted';
        } catch (error) {
            console.error('Error requesting location permission:', error);
            return false;
        }
    }, []);

    const requestCameraPermission = useCallback(async () => {
        if (Platform.OS === 'web') return false;
        try {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setCameraStatus(status as PermissionStatus);
            return status === 'granted';
        } catch (error) {
            console.error('Error requesting camera permission:', error);
            return false;
        }
    }, []);

    useEffect(() => {
        // Defer notification request to optimize app startup speed and avoid splash screen jank
        const timer = setTimeout(() => {
            requestNotificationPermission();
        }, 2000);
        return () => clearTimeout(timer);
    }, [requestNotificationPermission]);

    return {
        locationStatus,
        notificationStatus,
        cameraStatus,
        requestLocationPermission,
        requestCameraPermission,
        requestNotificationPermission,
    };
}
