import apiClient from './apiClient';

export interface VisitLog {
    id: string;
    agent: string;
    store: string;
    status: 'completed' | 'in_progress' | 'canceled' | 'pending';
    start: string;
    end: string;
    duration: string;
    execution: string;
    reports_count: number;
    reason?: string;
}

export const VisitService = {
    getSupervisorLogs: async (params?: { skip?: number; limit?: number }): Promise<VisitLog[]> => {
        try {
            const response = await apiClient.get('/api/tracking/visits', {
                params: {
                    skip: params?.skip ?? 0,
                    limit: params?.limit ?? 50,
                },
            });
            // Map status 'in_progress' to 'pending' for UI consistency if needed
            return (response.data || []).map((v: any) => ({
                ...v,
                status: v.status === 'in_progress' ? 'pending' : v.status
            }));
        } catch (error) {
            console.error('[VisitService] getSupervisorLogs error:', error);
            return [];
        }
    },

    getSupervisorAttendance: async (): Promise<any[]> => {
        try {
            const response = await apiClient.get('/api/tracking/attendance');
            return response.data || [];
        } catch (error) {
            console.error('[VisitService] getSupervisorAttendance error:', error);
            return [];
        }
    },

    getSupervisorPerformance: async (): Promise<any> => {
        try {
            const response = await apiClient.get('/api/tracking/performance');
            return response.data;
        } catch (error) {
            console.error('[VisitService] getSupervisorPerformance error:', error);
            return null;
        }
    },

    getSupervisorExceptions: async (): Promise<any[]> => {
        try {
            const response = await apiClient.get('/api/tracking/exceptions');
            return response.data || [];
        } catch (error) {
            console.error('[VisitService] getSupervisorExceptions error:', error);
            return [];
        }
    }
};
