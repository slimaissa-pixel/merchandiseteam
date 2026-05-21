import * as FileSystem from 'expo-file-system/legacy';
import { Alert, Platform, Share } from 'react-native';
import { getFullImageUrl } from '@/constants/api';

export class DocumentService {
    /**
     * Downloads a file and opens the share/save sheet
     */
    static async downloadAndShare(url: string, fileName: string) {
        try {
            // Ensure the filename has an extension if it doesn't already
            const fileUri = FileSystem.cacheDirectory + fileName;
            
            // Resolve relative URLs to absolute URLs
            const absoluteUrl = getFullImageUrl(url) || url;

            // Download the file
            const downloadRes = await FileSystem.downloadAsync(absoluteUrl, fileUri);

            if (downloadRes.status !== 200) {
                throw new Error(`Failed to download file: ${downloadRes.status}`);
            }

            // Share the file
            if (Platform.OS === 'android' || Platform.OS === 'ios') {
                await Share.share({
                    url: downloadRes.uri,
                    title: fileName,
                });
            } else {
                // Fallback for web if needed
                Alert.alert('Download Complete', `File saved to ${downloadRes.uri}`);
            }

            return true;
        } catch (error: any) {
            console.error('Error downloading document:', error);
            Alert.alert('Download Error', error.message || 'An unexpected error occurred while downloading.');
            return false;
        }
    }
}
