import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const StorageKeys = {
    USER_TOKEN: 'userToken',
    REFRESH_TOKEN: 'refreshToken',
    USER_SESSION: 'user_session',
} as const;

export const StorageService = {
    async setItem(key: string, value: string): Promise<void> {
        try {
            if (Platform.OS === 'web') {
                sessionStorage.setItem(key, value);
            } else {
                await SecureStore.setItemAsync(key, value);
            }
        } catch (error) {
            console.error(`[StorageService] Error setting item ${key}:`, error);
        }
    },

    async getItem(key: string): Promise<string | null> {
        try {
            if (Platform.OS === 'web') {
                return sessionStorage.getItem(key);
            } else {
                return await SecureStore.getItemAsync(key);
            }
        } catch (error) {
            console.error(`[StorageService] Error getting item ${key}:`, error);
            return null;
        }
    },

    async removeItem(key: string): Promise<void> {
        try {
            if (Platform.OS === 'web') {
                sessionStorage.removeItem(key);
            } else {
                await SecureStore.deleteItemAsync(key);
            }
        } catch (error) {
            console.error(`[StorageService] Error removing item ${key}:`, error);
        }
    },

    async clearAll(): Promise<void> {
        try {
            const keys = Object.values(StorageKeys);
            if (Platform.OS === 'web') {
                keys.forEach(key => sessionStorage.removeItem(key));
            } else {
                await Promise.all(keys.map(key => SecureStore.deleteItemAsync(key)));
            }
        } catch (error) {
            console.error('[StorageService] Error clearing all storage:', error);
        }
    }
};
