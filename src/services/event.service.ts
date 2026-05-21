import apiClient from './apiClient';

export interface EventPayload {
    [key: string]: any;
}

export interface SystemEvent {
    id: number;
    type: string;
    status: 'pending' | 'approved' | 'rejected';
    payload: EventPayload;
    user_id: number;
    merchandiser_name: string;
    gms_id?: number;
    visit_id?: number;
    created_at: string;
    updated_at: string;
}

export interface EventCreateData {
    type: string;
    status?: string;
    payload: EventPayload;
    gms_id?: number;
    visit_id?: number;
}

export const EventService = {
    getAll: async (): Promise<SystemEvent[]> => {
        try {
            const response = await apiClient.get('/api/events/');
            return response.data;
        } catch (error) {
            console.error('[EventService] getAll error:', error);
            throw error;
        }
    },

    create: async (data: EventCreateData): Promise<SystemEvent> => {
        try {
            const response = await apiClient.post('/api/events/', data);
            return response.data;
        } catch (error) {
            console.error('[EventService] create error:', error);
            throw error;
        }
    },

    updateStatus: async (id: number, status: string): Promise<SystemEvent> => {
        try {
            const response = await apiClient.patch(`/api/events/${id}/status`, null, {
                params: { status }
            });
            return response.data;
        } catch (error) {
            console.error('[EventService] updateStatus error:', error);
            throw error;
        }
    }
};
