import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { API_BASE_URL } from '@/constants/api';
import apiClient from './apiClient';

export const ExportService = {
    downloadDailyReport: async (date: string): Promise<boolean> => {
        try {
            if (Platform.OS === 'web') {
                const response = await apiClient.get('/api/export/daily-report', {
                    params: { target_date: date },
                    responseType: 'blob'
                });
                const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
                const a = document.createElement('a');
                a.href = url;
                a.download = `daily_report_${date}.pdf`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                return true;
            } else {
                const token = await AsyncStorage.getItem('userToken');
                const fileUri = FileSystem.documentDirectory + `daily_report_${date}.pdf`;
                const url = `${API_BASE_URL}/api/export/daily-report?target_date=${date}`;

                const { uri, status } = await FileSystem.downloadAsync(url, fileUri, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {}
                });

                if (status === 200) {
                    await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
                    return true;
                }
                return false;
            }
        } catch (error) {
            console.error('[ExportService] Error downloading report:', error);
            return false;
        }
    }
};
