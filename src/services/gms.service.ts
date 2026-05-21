import apiClient from './apiClient';

export interface GMS {
    id: number;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    city: string;
    type: string;
    distance_km?: number;
    supervisor_id?: number;
}

export interface Assignment {
    id: number;
    user_id: number;
    gms_id: number;
    scheduled_date?: string;
    status: 'scheduled' | 'completed' | 'cancelled';
    notes?: string;
    assigned_at: string;
    user?: { first_name: string; last_name: string; id: number; profile_image?: string };
    gms?: { name: string; address: string; id: number };
    check_in?: string;
    check_out?: string;
    duration_minutes?: number;
    rule_id?: number;
}

export const GMSService = {
    getAll: async (params?: { skip?: number; limit?: number }): Promise<GMS[]> => {
        try {
            const response = await apiClient.get('/api/gms/', {
                params: {
                    skip: params?.skip ?? 0,
                    limit: params?.limit ?? 50,
                },
            });
            return response.data;
        } catch (error) {
            console.error('[GMS] GetAll error:', error);
            return [];
        }
    },
    assignMerchandiser: async (data: { 
        gms_id: number, 
        user_id: number, 
        scheduled_date?: string, 
        notes?: string 
    }): Promise<boolean> => {
        try {
            const response = await apiClient.post('/api/gms/assign', data);
            return response.status === 200 || response.status === 201;
        } catch (error) {
            console.error('[GMS] Assign error:', error);
            return false;
        }
    },

    assignRecurringMerchandiser: async (data: {
        gms_id: number;
        user_id: number;
        start_date: string;
        end_date: string;
        days_of_week: number[];
        notes?: string;
    }): Promise<{ success: boolean; rule_id?: number; assignments_created?: number; skipped_for_leave?: number }> => {
        try {
            const response = await apiClient.post('/api/gms/assign/recurring', data);
            return response.data;
        } catch (error) {
            console.error('[GMS] Assign recurring error:', error);
            return { success: false };
        }
    },

    getAllAssignments: async (): Promise<Assignment[]> => {
        try {
            const response = await apiClient.get('/api/gms/assignments/');
            return response.data;
        } catch (error) {
            console.error('[GMS] GetAllAssignments error:', error);
            return [];
        }
    },

    deleteAssignment: async (id: number, mode: 'single' | 'future' | 'all' = 'single'): Promise<boolean> => {
        try {
            const response = await apiClient.delete(`/api/gms/assignments/${id}?mode=${mode}`);
            return response.status === 200 || response.status === 204;
        } catch (error) {
            console.error('[GMS] Delete Assignment error:', error);
            return false;
        }
    },

    updateAssignment: async (id: number, data: Partial<Assignment>): Promise<boolean> => {
        try {
            const response = await apiClient.put(`/api/gms/assignments/${id}`, data);
            return response.status === 200;
        } catch (error) {
            console.error('[GMS] Update Assignment error:', error);
            return false;
        }
    },

    pauseAssignment: async (id: number): Promise<boolean> => {
        try {
            const response = await apiClient.patch(`/api/gms/assignments/${id}/pause`);
            return response.status === 200;
        } catch (error) {
            console.error('[GMS] Pause Assignment error:', error);
            return false;
        }
    },

    resumeAssignment: async (id: number): Promise<boolean> => {
        try {
            const response = await apiClient.patch(`/api/gms/assignments/${id}/resume`);
            return response.status === 200;
        } catch (error) {
            console.error('[GMS] Resume Assignment error:', error);
            return false;
        }
    },

    bulkDeleteAssignments: async (ids: number[]): Promise<boolean> => {
        try {
            const response = await apiClient.post('/api/gms/assignments/bulk-delete', { ids });
            return response.status === 200;
        } catch (error) {
            console.error('[GMS] Bulk Delete Assignments error:', error);
            return false;
        }
    },

    create: async (store: Partial<GMS>): Promise<GMS | null> => {
        try {
            const response = await apiClient.post('/api/gms/', store);
            return response.data;
        } catch (error) {
            console.error('[GMS] Create error:', error);
            return null;
        }
    },

    delete: async (gmsId: number): Promise<boolean> => {
        try {
            const response = await apiClient.delete(`/api/gms/${gmsId}/`);
            return response.status === 200 || response.status === 204;
        } catch (error) {
            console.error('[GMS] Delete error:', error);
            throw error;
        }
    },

    update: async (gmsId: number, store: Partial<GMS>): Promise<GMS | null> => {
        try {
            const response = await apiClient.put(`/api/gms/${gmsId}/`, store);
            return response.data;
        } catch (error) {
            console.error('[GMS] Update error:', error);
            return null;
        }
    }
};
