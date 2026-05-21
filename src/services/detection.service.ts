import { Platform } from 'react-native';
import apiClient from './apiClient';
import { StorageKeys, StorageService } from './storage.service';

export interface DetectionResult {
    xyxy: [number, number, number, number];
    conf: number;
    class: number;
    class_name: string;
}

export interface DetectionResponse {
    predictions: DetectionResult[];
}

export const DetectionService = {
    detect: async (imageUri: string, visualize: boolean = false): Promise<any | null> => {
        try {
            const formData = new FormData();
            
            // On mobile, imageUri might be a local path. 
            // We need to convert it to a file object for FormData
            const filename = imageUri.split('/').pop() || 'image.jpg';
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : `image`;

            // Handle Web vs Mobile FormData
            if (Platform.OS === 'web') {
                const response = await fetch(imageUri);
                const blob = await response.blob();
                formData.append('file', blob, filename);
            } else {
                // @ts-ignore - React Native FormData expects this format
                formData.append('file', {
                    uri: imageUri,
                    name: filename,
                    type: type,
                });
            }

            // Use fetch instead of apiClient to avoid issues with default 'application/json' headers
            // and ensure React Native handles the FormData boundary correctly.
            const token = await StorageService.getItem(StorageKeys.USER_TOKEN);
            
            // Try existing app detection endpoint first, then fallback to /predict if needed
            const base = apiClient.defaults.baseURL.replace(/\/$/, '');
            const endpoints = [
                `${base}/api/detection/detect${visualize ? '?visualize=true' : ''}`,
                `${base}/predict${visualize ? '?visualize=true' : ''}`
            ];

            let response: Response | null = null;
            let lastError: any = null;
            for (const url of endpoints) {
                try {
                    response = await fetch(url, {
                        method: 'POST',
                        body: formData,
                        headers: {
                            'Authorization': token ? `Bearer ${token}` : '',
                            'Accept': 'application/json',
                        },
                    });
                    if (response && response.ok) break;
                } catch (err) {
                    lastError = err;
                    response = null;
                }
            }

            if (!response) {
                console.error('[Detection] All endpoints failed', lastError);
                return null;
            }
            

            if (!response.ok) {
                const errorText = await response.text();
                console.error('[Detection] Fetch error:', response.status, errorText);
                return null;
            }

            const contentType = response.headers.get('content-type') || '';
            if (contentType.startsWith('image/')) {
                // Backend usually returns JSON with image_base64, but if it returns raw image:
                console.warn('[Detection] Received raw image instead of JSON');
                return null;
            }

            const json = await response.json();
            console.log('[Detection] Raw Response:', JSON.stringify(json).substring(0, 500));

            // If backend already returned `predictions`, pass through
            if (json && json.predictions) {
                if (json.image_base64 && typeof json.image_base64 === 'string' && !json.image_base64.startsWith('data:')) {
                    json.image_base64 = `data:image/jpeg;base64,${json.image_base64}`;
                }
                return json;
            }

            // Normalize pasta-ai response -> legacy shape
            // Expected pasta-ai: { success, model, detections: [{ class, confidence, bbox }], image_base64 }
            if (json && json.detections) {
                const preds = json.detections.map((d: any) => ({
                    xyxy: d.bbox || d.xyxy || [0,0,0,0],
                    conf: d.confidence ?? d.conf ?? 0,
                    class: d.class_id ?? (typeof d.class === 'string' ? -1 : (d.class ?? 0)),
                    class_name: d.name ?? d.class_name ?? (typeof d.class === 'string' ? d.class : `class_${d.class}`),
                }));
                if (json.image_base64 && typeof json.image_base64 === 'string' && !json.image_base64.startsWith('data:')) {
                    json.image_base64 = `data:image/jpeg;base64,${json.image_base64}`;
                }
                return { predictions: preds, image_base64: json.image_base64, raw: json };
            }

            // fallback: return whatever the endpoint gave
            return json;
        } catch (e) {
            console.error('[Detection] Detect:', e);
            return null;
        }
    },
};
