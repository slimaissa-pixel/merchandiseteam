import apiClient from './apiClient';

export interface AdminStats {
    users: number;
    stores: number;
    total_reports: number;
    pending_reports: number;
}

export interface KPIStats {
    time_range: string;
    visit_completion_pct: number;
    avg_time_spent: string;
    events_count: number;
    active_merchandisers: number;
    active_supervisors: number;
    stores_visited: number;
    anomalies_count: number;
    stock_alerts_count: number;
    performance_ranking: {
        user_id: number;
        name: string;
        score: number;
        visits: number;
        reports: number;
    }[];
}

export interface SupervisorStats {
    assigned_stores: number;
    active_teams: number;
    visited_today: number;
    pending_reports: number;
}

export interface MerchandiserStats {
    stores_assigned: number;
    reports_done: number;
    target_hit: string;
}

export interface PublicStats {
    teams: string;
    stores: string;
    reports: string;
    data_points: string;
}

export const StatsService = {
    getPublicStats: async (): Promise<PublicStats | null> => {
        try {
            const response = await apiClient.get('/api/stats/public');
            return response.data;
        } catch (error) {
            console.error('[StatsService] Public stats error:', error);
            return null;
        }
    },
    getAdminStats: async (): Promise<AdminStats | null> => {
        try {
            const response = await apiClient.get('/api/stats/admin');
            return response.data;
        } catch (error) {
            console.error('[StatsService] Admin error:', error);
            return null;
        }
    },
    getSupervisorStats: async (): Promise<SupervisorStats | null> => {
        try {
            const response = await apiClient.get('/api/stats/supervisor');
            return response.data;
        } catch (error) {
            console.error('[StatsService] Supervisor error:', error);
            return null;
        }
    },
    getMerchandiserStats: async (): Promise<MerchandiserStats | null> => {
        try {
            const response = await apiClient.get('/api/stats/merchandiser');
            return response.data;
        } catch (error) {
            console.error('[StatsService] Merchandiser error:', error);
            return null;
        }
    },
    getKPIStats: async (timeRange: 'today' | 'week' | 'month' = 'today'): Promise<KPIStats | null> => {
        try {
            const response = await apiClient.get(`/api/stats/kpi?time_range=${timeRange}`);
            return response.data;
        } catch (error) {
            console.error('[StatsService] KPI error:', error);
            return null;
        }
    },
    getTeamStatus: async (): Promise<any[]> => {
        try {
            const response = await apiClient.get('/api/stats/team-status');
            return response.data || [];
        } catch (error) {
            console.error('[StatsService] Team status error:', error);
            return [];
        }
    }
};
