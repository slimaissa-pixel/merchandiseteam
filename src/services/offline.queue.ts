import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus, Platform } from 'react-native';
import apiClient from './apiClient';

const QUEUE_STORAGE_KEY = 'offline_request_queue';

interface QueuedRequest {
    id: string;
    url: string;
    method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    data: any;
    timestamp: number;
    retries: number;
}

/** Lightweight connectivity check — avoids @react-native-community/netinfo dependency */
const isOnline = async (): Promise<boolean> => {
    if (Platform.OS === 'web') {
        return navigator.onLine;
    }
    try {
        // Ping a small known-reliable endpoint; 5 s timeout
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 5000);
        const res = await fetch('https://www.google.com/generate_204', {
            method: 'HEAD',
            signal: ctrl.signal,
        });
        clearTimeout(timer);
        return res.status === 204 || res.ok;
    } catch {
        return false;
    }
};

class OfflineQueue {
    private queue: QueuedRequest[] = [];
    private isProcessing: boolean = false;

    constructor() {
        this.loadQueue();
        this.setupConnectivityListener();
    }

    private async loadQueue() {
        try {
            const stored = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
            if (stored) {
                this.queue = JSON.parse(stored);
            }
        } catch (e) {
            console.error('[OfflineQueue] Load error:', e);
        }
    }

    private async saveQueue() {
        try {
            await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(this.queue));
        } catch (e) {
            console.error('[OfflineQueue] Save error:', e);
        }
    }

    /** Re-try queue whenever the app comes back to the foreground */
    private setupConnectivityListener() {
        AppState.addEventListener('change', (nextState: AppStateStatus) => {
            if (nextState === 'active') {
                isOnline().then(online => {
                    if (online) this.processQueue();
                });
            }
        });
    }

    async enqueue(url: string, method: QueuedRequest['method'], data: any) {
        const request: QueuedRequest = {
            id: Math.random().toString(36).substring(7),
            url,
            method,
            data,
            timestamp: Date.now(),
            retries: 0,
        };

        this.queue.push(request);
        await this.saveQueue();
        console.log(`[OfflineQueue] Request enqueued: ${method} ${url}`);

        // Try processing immediately if online
        const online = await isOnline();
        if (online) {
            this.processQueue();
        }
    }

    async processQueue() {
        if (this.isProcessing || this.queue.length === 0) return;

        this.isProcessing = true;
        console.log(`[OfflineQueue] Processing ${this.queue.length} requests...`);

        const remainingQueue: QueuedRequest[] = [];

        for (const request of this.queue) {
            try {
                await apiClient({
                    url: request.url,
                    method: request.method,
                    data: request.data,
                    headers: { 'X-Offline-Request': 'true' },
                });
                console.log(`[OfflineQueue] Success: ${request.method} ${request.url}`);
            } catch (error: any) {
                console.error(`[OfflineQueue] Failed: ${request.method} ${request.url}`, error);

                // 4xx errors (except 429) are bad requests — don't retry
                if (
                    error.response &&
                    error.response.status >= 400 &&
                    error.response.status < 500 &&
                    error.response.status !== 429
                ) {
                    continue;
                }

                if (request.retries < 5) {
                    remainingQueue.push({ ...request, retries: request.retries + 1 });
                }
            }
        }

        this.queue = remainingQueue;
        await this.saveQueue();
        this.isProcessing = false;
    }

    getQueueLength() {
        return this.queue.length;
    }
}

export const offlineQueue = new OfflineQueue();
