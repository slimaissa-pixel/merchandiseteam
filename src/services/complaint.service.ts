import apiClient from './apiClient';

export interface Complaint {
    id: number;
    type: string;
    description: string;
    photo_url?: string;
    status: 'open' | 'in_review' | 'resolved';
    admin_response?: string;
    user_id: number;
    requester_name: string;
    requester_role?: string;
    gms_id?: number;
    created_at: string;
}

export const ComplaintService = {
    getAll: async (status?: string): Promise<Complaint[]> => {
        try {
            const params: any = {};
            if (status) params.status = status;
            const res = await apiClient.get('/api/complaints/', { params });
            return res.data;
        } catch (e) {
            console.error('[Complaints] GetAll:', e);
            return [];
        }
    },

    create: async (data: { type: string; description: string; photo_url?: string; gms_id?: number }): Promise<Complaint | null> => {
        try {
            const res = await apiClient.post('/api/complaints/', data);
            return res.data;
        } catch (e) {
            console.error('[Complaints] Create:', e);
            return null;
        }
    },

    resolve: async (id: number, status: 'in_review' | 'resolved' | 'rejected', admin_response?: string): Promise<Complaint | null> => {
        try {
            const res = await apiClient.patch(`/api/complaints/${id}/resolve`, { status, admin_response });
            return res.data;
        } catch (e) {
            console.error('[Complaints] Resolve:', e);
            return null;
        }
    },
};
