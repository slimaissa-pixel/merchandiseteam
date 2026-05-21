import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import apiClient from './apiClient';

export interface LocationPoint {
    latitude: number;
    longitude: number;
    timestamp: number;
    type: 'start' | 'end' | 'checkpoint';
}

export interface WorkdaySession {
    id: string;
    startTime: number;
    endTime: number | null;
    startLocation: LocationPoint;
    endLocation: LocationPoint | null;
    status: 'active' | 'completed';
    completedGmsIds?: number[];
    activity?: string;
    battery_level?: number;
}

export interface VisitSession {
    id: string;
    gmsId: number;
    startTime: number;
    status: 'in_progress' | 'completed';
    proof_before?: boolean;
    proof_after?: boolean;
}

const ACTIVE_WORKDAY_ID = 'active_workday_id';
const ACTIVE_VISIT_ID = 'active_visit_id';

export const LocationService = {
    requestPermissions: async (): Promise<boolean> => {
        try {
            const { status: foreground } = await Location.requestForegroundPermissionsAsync();
            if (foreground !== 'granted') {
                console.log('[GPS] Foreground permission denied');
                return false;
            }
            return true;
        } catch (error) {
            console.error('[GPS] Permission error:', error);
            return false;
        }
    },
    getCurrentLocation: async (): Promise<any | null> => {
        try {
            const hasPermission = await LocationService.requestPermissions();
            if (!hasPermission) return null;

            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });

            // Mock location detection (Anti-Cheat)
            const isMock = location.mocked || false;

            return {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                speed: location.coords.speed,
                heading: location.coords.heading,
                accuracy: location.coords.accuracy,
                altitude: location.coords.altitude,
                timestamp: location.timestamp,
                isMock: isMock,
                type: 'checkpoint',
            };
        } catch (error) {
            console.error('[GPS] Location error:', error);
            return null;
        }
    },
    startWorkday: async (): Promise<WorkdaySession | null> => {
        try {
            const location = await LocationService.getCurrentLocation();
            if (!location) return null;

            const response = await apiClient.post('/api/tracking/workday/start', {
                start_lat: location.latitude,
                start_lng: location.longitude
            });

            const dbWorkday = response.data;
            if (dbWorkday && dbWorkday.id) {
                await AsyncStorage.setItem(ACTIVE_WORKDAY_ID, dbWorkday.id.toString());
            }

            return {
                id: dbWorkday.id ? dbWorkday.id.toString() : "",
                startTime: new Date(dbWorkday.start_time).getTime(),
                endTime: null,
                startLocation: { ...location, type: 'start' },
                endLocation: null,
                status: 'active',
            };
        } catch (error: any) {
            const msg = error.response?.data?.detail || error.message;
            console.error('[GPS] Start workday error:', msg);
            throw new Error(msg);
        }
    },
    endWorkday: async (): Promise<boolean> => {
        try {
            const location = await LocationService.getCurrentLocation();
            if (!location) return false;

            await apiClient.post('/api/tracking/workday/end', {
                end_lat: location.latitude,
                end_lng: location.longitude
            });

            await AsyncStorage.removeItem(ACTIVE_WORKDAY_ID);
            await AsyncStorage.removeItem(ACTIVE_VISIT_ID);
            return true;
        } catch (error: any) {
            const msg = error.response?.data?.detail || error.message;
            console.error('[GPS] End workday error:', msg);
            throw new Error(msg);
        }
    },
    startVisit: async (gmsId: number): Promise<VisitSession | null> => {
        try {
            const workdayId = await AsyncStorage.getItem(ACTIVE_WORKDAY_ID);
            if (!workdayId) throw new Error("No active workday");

            const location = await LocationService.getCurrentLocation();
            if (!location) return null;

            const response = await apiClient.post('/api/tracking/visit/start', {
                workday_id: parseInt(workdayId),
                gms_id: gmsId,
                start_lat: location.latitude,
                start_lng: location.longitude
            });

            const dbVisit = response.data;
            if (dbVisit && dbVisit.id) {
                await AsyncStorage.setItem(ACTIVE_VISIT_ID, dbVisit.id.toString());
            }

            return {
                id: dbVisit.id ? dbVisit.id.toString() : "",
                gmsId: dbVisit.gms_id,
                startTime: new Date(dbVisit.start_time).getTime(),
                status: 'in_progress'
            };
        } catch (error: any) {
            const msg = error.response?.data?.detail || error.message;
            console.error('[Visit] Start error:', msg);
            throw new Error(msg);
        }
    },
    endVisit: async (): Promise<boolean> => {
        try {
            const visitId = await AsyncStorage.getItem(ACTIVE_VISIT_ID);
            if (!visitId) return false;

            const location = await LocationService.getCurrentLocation();

            await apiClient.post('/api/tracking/visit/end', {
                visit_id: parseInt(visitId),
                end_lat: location?.latitude ?? 0,
                end_lng: location?.longitude ?? 0,
                status: 'completed'
            });

            await AsyncStorage.removeItem(ACTIVE_VISIT_ID);
            return true;
        } catch (error: any) {
            console.error('[Visit] End error:', error);
            const msg = error.response?.data?.detail || "Cannot end visit until Before/After proof is completed.";
            throw new Error(msg);
        }
    },
    addCheckpoint: async (): Promise<boolean> => {
        try {
            const workdayId = await AsyncStorage.getItem(ACTIVE_WORKDAY_ID);
            if (!workdayId) return false;

            const location = await LocationService.getCurrentLocation();
            if (!location) return false;

            const logEntry = {
                workday_id: parseInt(workdayId),
                latitude: location.latitude,
                longitude: location.longitude,
                speed: location.speed,
                heading: location.heading,
                accuracy: location.accuracy,
                altitude: location.altitude,
                activity: location.activity || 'still',
                log_type: 'checkpoint',
                timestamp: location.timestamp
            };

            try {
                await apiClient.post('/api/tracking/logs/sync', [logEntry]);
                // If successful, also try syncing any previously queued logs
                LocationService.syncQueuedLogs();
            } catch (e) {
                console.log('[GPS] Sync failed, queueing log locally...');
                const stored = await AsyncStorage.getItem('queued_gps_logs');
                const queue = stored ? JSON.parse(stored) : [];
                queue.push(logEntry);
                await AsyncStorage.setItem('queued_gps_logs', JSON.stringify(queue));
            }

            // Also ping heartbeat on manual checkpoint
            await LocationService.sendHeartbeat();

            return true;
        } catch (error: any) {
            console.error('[GPS] Checkpoint error:', error.response?.data?.detail || error.message);
            return false;
        }
    },
    syncQueuedLogs: async (): Promise<void> => {
        try {
            const stored = await AsyncStorage.getItem('queued_gps_logs');
            if (!stored) return;

            const queue = JSON.parse(stored);
            if (queue.length === 0) return;

            console.log(`[GPS] Syncing ${queue.length} queued logs...`);
            await apiClient.post('/api/tracking/logs/sync', queue);
            await AsyncStorage.removeItem('queued_gps_logs');
            console.log('[GPS] Queue synced successfully');
        } catch (error) {
            console.error('[GPS] Queue sync error:', error);
        }
    },
    sendHeartbeat: async (): Promise<void> => {
        try {
            const workdayId = await AsyncStorage.getItem(ACTIVE_WORKDAY_ID);
            if (!workdayId) return;

            const location = await LocationService.getCurrentLocation();
            if (!location) return;

            // Get battery level (Battery Optimization & Intelligence)
            const PowerService = await import('expo-battery');
            const batteryLevel = await PowerService.getBatteryLevelAsync();

            // Simple activity detection based on speed
            let activity = 'still';
            if (location.speed !== null && location.speed !== undefined) {
                const speedKmh = location.speed * 3.6;
                if (speedKmh > 30) activity = 'driving';
                else if (speedKmh > 10) activity = 'running';
                else if (speedKmh > 1.5) activity = 'walking';
            }

            await apiClient.post('/api/tracking/heartbeat', {
                latitude: location.latitude,
                longitude: location.longitude,
                speed: location.speed,
                activity: activity,
                battery_level: batteryLevel,
                is_mock: location.isMock
            });
        } catch (error) {
            console.error('[GPS] Heartbeat error:', error);
        }
    },
    getActiveSession: async (): Promise<{ workday: WorkdaySession | null, visit: VisitSession | null }> => {
        try {
            const response = await apiClient.get('/api/tracking/active-session');
            const { workday, visit } = response.data;

            if (workday && workday.id) {
                await AsyncStorage.setItem(ACTIVE_WORKDAY_ID, workday.id.toString());
            } else {
                await AsyncStorage.removeItem(ACTIVE_WORKDAY_ID);
            }

            if (visit && visit.id) {
                await AsyncStorage.setItem(ACTIVE_VISIT_ID, visit.id.toString());
            } else {
                await AsyncStorage.removeItem(ACTIVE_VISIT_ID);
            }

            return {
                workday: workday ? {
                    id: workday.id ? workday.id.toString() : "",
                    startTime: new Date(workday.start_time).getTime(),
                    endTime: null,
                    startLocation: { latitude: workday.start_lat, longitude: workday.start_lng, type: 'start', timestamp: 0 },
                    endLocation: null,
                    status: 'active',
                    completedGmsIds: workday.completed_gms_ids || [],
                } : null,
                visit: visit ? {
                    id: visit.id ? visit.id.toString() : "",
                    gmsId: visit.gms_id,
                    startTime: new Date(visit.start_time).getTime(),
                    status: 'in_progress',
                    proof_before: !!visit.proof_before,
                    proof_after: !!visit.proof_after
                } : null
            };
        } catch (error) {
            return { workday: null, visit: null };
        }
    },

    getSessionDuration: (session: WorkdaySession | VisitSession): number => {
        const start = 'startTime' in session ? session.startTime : (session as any).start_time;
        return Math.round((Date.now() - new Date(start).getTime()) / 60000);
    },

    formatDuration: (minutes: number): string => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours === 0) return `${mins}m`;
        return `${hours}h ${mins}m`;
    },
    getTeamLiveStatus: async (): Promise<any[]> => {
        try {
            const response = await apiClient.get('/api/tracking/team/live');
            return response.data;
        } catch (error) {
            console.error('[GPS] Team live status error:', error);
            return [];
        }
    },
    getHistory: async (userId: number, date?: string): Promise<any> => {
        try {
            const params = date ? `?date=${date}` : '';
            const response = await apiClient.get(`/api/tracking/history/${userId}${params}`);
            return response.data;
        } catch (error) {
            console.error('[GPS] History fetch error:', error);
            return { logs: [], visits: [], workdays: [] };
        }
    },
};
