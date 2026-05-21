import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_BASE_URL } from '@/constants/api';
import { emitToast, emitUnauthorized } from './eventEmitter';
import { StorageService, StorageKeys } from './storage.service';

type TimedAxiosConfig = AxiosRequestConfig & {
    metadata?: {
        startTime: number;
    };
};

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 120000, // Increased to 120s for slow mobile connections and large uploads
    headers: {
        'Content-Type': 'application/json',
    },
});

let memoryToken: string | null = null;

export const setAuthTokenCache = (token: string | null) => {
    memoryToken = token;
};

// Request interceptor
apiClient.interceptors.request.use(
    async (config) => {
        // Log request start time
        const typedConfig = config as any as TimedAxiosConfig;
        typedConfig.metadata = { startTime: Date.now() };

        // Attempt memory cache first
        if (!memoryToken) {
            memoryToken = await StorageService.getItem(StorageKeys.USER_TOKEN);
        }

        if (memoryToken) {
            if (config.headers.set) {
                config.headers.set('Authorization', `Bearer ${memoryToken}`);
            } else {
                config.headers.Authorization = `Bearer ${memoryToken}`;
            }
            if (__DEV__) {
                console.log(`[API] Header set for ${config.url}: Bearer ${memoryToken.substring(0, 10)}...`);
            }
        } else {
            if (__DEV__) {
                // Some endpoints like /login don't need token
                if (!config.url?.includes('/api/auth/token')) {
                    console.warn(`[API] MISSING TOKEN for ${config.url}`);
                }
            }
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

const logResponseTime = (responseOrError: AxiosResponse | any) => {
    try {
        const cfg = (responseOrError.config || {}) as TimedAxiosConfig;
        const start = cfg.metadata?.startTime;
        if (!start) return;
        const duration = Date.now() - start;
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
            const method = (cfg.method || 'GET').toString().toUpperCase();
            const url = cfg.url || '';
            const status = responseOrError.status || (responseOrError.response ? responseOrError.response.status : 'ERR');
            // Lightweight console timing to help baseline and regressions
            // eslint-disable-next-line no-console
            console.log(`[API] ${method} ${url} - ${status} - ${duration}ms`);
        }
    } catch {
        // Best-effort only; never break requests due to logging
    }
};

// Response interceptor
apiClient.interceptors.response.use(
    (response) => {
        logResponseTime(response);
        return response;
    },
    async (error) => {
        logResponseTime(error);

        const config = error.config;
        
        if (__DEV__) {
            console.error('[API Error Detail]', {
                url: config?.url,
                method: config?.method,
                code: error.code,
                message: error.message,
                status: error.response?.status,
                data: error.response?.data
            });
        }

        // Handle 401 Unauthorized
        if (error.response?.status === 401) {
            if (error.config?.url?.includes('/api/auth/token')) {
                return Promise.reject(error);
            }
            console.log('[API] 401 Unauthorized detected - triggering global logout');
            memoryToken = null;
            emitUnauthorized();
            return Promise.reject(error); // EARLY EXIT
        }

        // Handle 422 Validation Error
        if (error.response?.status === 422) {
            console.error('[API] Validation error:', error.response.data);
            const detail = error.response.data?.detail;
            const message = typeof detail === 'string'
                ? detail
                : (Array.isArray(detail) ? detail[0]?.msg : 'Validation error occurred');
            emitToast(message, 'error');
            return Promise.reject(error); // EARLY EXIT
        }

        // Retry logic for 5xx errors or Network errors (ECONNABORTED / Network Error)
        const isRetryable = error.response?.status >= 500 || error.code === 'ECONNABORTED' || !error.response;
        
        if (isRetryable && config && !config._isRetry) {
            config._isRetry = true;
            const delay = 1500;
            console.log(`[API] Retryable error (${error.code || error.response?.status}) on ${config.url}, retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return apiClient(config);
        }

        // Handle final error states after retry
        if (error.code === 'ECONNABORTED') {
            emitToast('Request timed out. Please check your connection and try again.', 'error');
        } else if (!error.response) {
            const isMutation = ['post', 'put', 'patch', 'delete'].includes(config?.method?.toLowerCase() || '');
            const isAuth = config?.url?.includes('/api/auth');
            const alreadyQueued = config?.headers?.['X-Offline-Request'];
            const isBackground = config?.url?.includes('/api/notifications') || config?.url?.includes('/api/tracking') || config?.url?.includes('/api/users/me');

            if (isMutation && !isAuth && !alreadyQueued && config) {
                try {
                    const { offlineQueue } = require('./offline.queue');
                    let parsedData = config.data;
                    if (typeof parsedData === 'string') {
                        try { parsedData = JSON.parse(parsedData); } catch { /* leave as string */ }
                    }
                    offlineQueue.enqueue(config.url, config.method.toUpperCase(), parsedData);
                    emitToast('Connection lost. Action queued for sync.', 'warning');
                    return Promise.resolve({ data: { _queued: true } });
                } catch (e) {
                    console.error('[API] Failed to queue offline request:', e);
                }
            }

            if (!isBackground) {
                emitToast('Network error. Check your server connection.', 'error');
            }
        } else if (error.response?.status >= 500) {
            emitToast('Server error. Please try again later.', 'error');
        }

        return Promise.reject(error);
    }
);


const originalGet = apiClient.get;
const pendingGetRequests = new Map<string, Promise<any>>();

apiClient.get = function (url: string, config?: AxiosRequestConfig) {
    const key = url + (config?.params ? JSON.stringify(config.params) : '');
    if (pendingGetRequests.has(key)) {
        console.log(`[API] Deduplicating GET request to ${key}`);
        return pendingGetRequests.get(key) as Promise<any>;
    }
    const promise = originalGet.call(this, url, config).finally(() => {
        pendingGetRequests.delete(key);
    });
    pendingGetRequests.set(key, promise);
    return promise;
};

export default apiClient;
