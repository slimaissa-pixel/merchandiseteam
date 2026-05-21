import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import apiClient from './apiClient';
import { API_BASE_URL } from '@/constants/api';

export const SupabaseService = {
  /**
   * Uploads a local file URI to the backend and returns the public URL.
   * Kept the SupabaseService name for compatibility with existing imports.
   */
  uploadImage: async (fileUri: string, prefix: string = 'uploads'): Promise<string> => {
    try {
      const ext = fileUri.split('.').pop() || 'jpg';
      const fileName = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
      let contentType = `image/${ext === 'png' ? 'png' : 'jpeg'}`;

      const formData = new FormData();

      if (Platform.OS === 'web') {
          const res = await fetch(fileUri);
          const blob = await res.blob();
          formData.append('file', blob, fileName);
      } else {
          formData.append('file', {
            uri: fileUri,
            name: fileName,
            type: contentType,
          } as any);
      }

      const response = await apiClient.post('/api/upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // backend returns both "url" (full) and "path" (relative)
      return response.data.url;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  },
};
