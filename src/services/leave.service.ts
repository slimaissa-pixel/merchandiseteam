import apiClient from './apiClient';

export interface LeaveRequest {
    id: number;
    leave_type: string;
    start_date: string;
    end_date: string;
    reason?: string;
    status: 'pending' | 'approved' | 'rejected';
    admin_comment?: string;
    user_id: number;
    requester_name: string;
    requester_role: string;
    created_at: string;
}

export const LeaveService = {
    getAll: async (status?: string): Promise<LeaveRequest[]> => {
        try {
            const params: any = {};
            if (status) params.status = status;
            const res = await apiClient.get('/api/leave-requests/', { params });
            return res.data;
        } catch (e) {
            console.error('[Leave] GetAll:', e);
            return [];
        }
    },

    create: async (data: { leave_type: string; start_date: string; end_date: string; reason?: string }): Promise<LeaveRequest | null> => {
        try {
            const res = await apiClient.post('/api/leave-requests/', data);
            return res.data;
        } catch (e) {
            console.error('[Leave] Create:', e);
            return null;
        }
    },

    review: async (id: number, status: 'approved' | 'rejected', admin_comment?: string): Promise<LeaveRequest | null> => {
        try {
            const res = await apiClient.patch(`/api/leave-requests/${id}/review`, { status, admin_comment });
            return res.data;
        } catch (e) {
            console.error('[Leave] Review:', e);
            return null;
        }
    },

    getActiveLeave: async (): Promise<LeaveRequest | null> => {
        try {
            const res = await apiClient.get('/api/leave-requests/active');
            return res.data || null;
        } catch (e) {
            console.error('[Leave] GetActive:', e);
            return null;
        }
    },
};
