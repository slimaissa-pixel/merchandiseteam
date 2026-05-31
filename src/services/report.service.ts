import apiClient from './apiClient';

import { createCrudService } from './serviceFactory';

export interface Report {
    id: number;
    name: string;
    notes?: string;
    type: string;
    status: 'pending' | 'approved' | 'rejected';
    rejection_reason?: string;
    visits_planned: number;
    visits_completed: number;
    before_image?: string;
    after_image?: string;
    photo?: string;
    user_id: number;
    merchandiser_name: string;
    gms_id?: number;
    gms?: { id: number; name: string; city: string; address: string };
    visit_id?: number;
    workday_id?: number;
    created_at: string;
    report_metadata?: any;
}

export interface ReportSubmission {
    name: string;
    notes: string;
    photo?: string;
    before_image?: string;
    after_image?: string;
    gms_id?: number;
    visit_id?: number;
    workday_id?: number;
}

export interface EventSubmission {
    name: string;
    notes: string;
    type: string;
    gms_id?: number;
    visit_id?: number;
    workday_id?: number;
    metadata?: any;
    before_image?: string;
    after_image?: string;
    photo?: string;
}

export const ReportService = {
    ...createCrudService<Report>('/api/reports'),

    updateStatus: async (reportId: number, status: string, rejectionReason?: string): Promise<Report | null> => {
        try {
            const params: any = { status };
            if (rejectionReason) params.rejection_reason = rejectionReason;

            const response = await apiClient.patch(`/api/reports/${reportId}/status`, null, { params });
            return response.data;
        } catch (error) {
            console.error('[Reports] UpdateStatus error:', error);
            return null;
        }
    },

    submitShiftSummary: async (data: { 
        name: string, 
        notes: string, 
        visits_planned: number, 
        visits_completed: number,
        workday_id?: number
    }): Promise<Report | null> => {
        try {
            const response = await apiClient.post('/api/reports/', {
                ...data,
                type: 'shift-summary',
                status: 'pending'
            });
            return response.data;
        } catch (error) {
            console.error('[Reports] SubmitShiftSummary error:', error);
            return null;
        }
    },

    submitAnomaly: async (data: ReportSubmission): Promise<Report | null> => {
        try {
            const response = await apiClient.post('/api/reports/', {
                ...data,
                type: 'anomaly',
                status: 'pending'
            });
            return response.data;
        } catch (error) {
            console.error('[Reports] SubmitAnomaly error:', error);
            return null;
        }
    },

    submitEvent: async (data: EventSubmission): Promise<Report | null> => {
        try {
            const response = await apiClient.post('/api/reports/', {
                ...data,
                status: 'pending'
            });
            return response.data;
        } catch (error) {
            console.error('[Reports] SubmitEvent error:', error);
            return null;
        }
    }
};
