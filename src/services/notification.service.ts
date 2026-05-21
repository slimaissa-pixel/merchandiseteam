import apiClient from './apiClient';

export interface Notification {
    id: number;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'alert' | 'new_gms' | 'report' | 'demo';
    icon?: string;
    is_read: boolean;
    created_at: string;
    user_id: number;
    action_link?: string;
}

export const NotificationService = {
    getNotifications: async (): Promise<Notification[]> => {
        try {
            const response = await apiClient.get('/api/notifications/');
            return response.data;
        } catch (error) {
            console.error('Fetch notifications error:', error);
            return [];
        }
    },

    getNotificationDetail: async (id: number): Promise<Notification | null> => {
        try {
            const response = await apiClient.get(`/api/notifications/${id}`);
            return response.data;
        } catch (error) {
            console.error('Fetch notification detail error:', error);
            return null;
        }
    },

    markAsRead: async (id: number): Promise<Notification | null> => {
        try {
            const response = await apiClient.patch(`/api/notifications/${id}/read`);
            return response.data;
        } catch (error) {
            console.error('Mark as read error:', error);
            return null;
        }
    },

    markAsUnread: async (id: number): Promise<Notification | null> => {
        try {
            const response = await apiClient.patch(`/api/notifications/${id}/unread`);
            return response.data;
        } catch (error) {
            console.error('Mark as unread error:', error);
            return null;
        }
    },

    markAllAsRead: async (): Promise<boolean> => {
        try {
            const response = await apiClient.post('/api/notifications/read-all');
            return response.status === 200;
        } catch (error) {
            console.error('Mark all as read error:', error);
            return false;
        }
    },

    notifyAdmins: async (data: Omit<Notification, 'id' | 'is_read' | 'created_at' | 'user_id'>): Promise<boolean> => {
        try {
            // Reverting to POST body as the backend expects NotificationBase as the JSON body
            const response = await apiClient.post('/api/notifications/notify-admins', data);
            return response.status === 200 || response.status === 201;
        } catch (error) {
            console.error('Notify admins error:', error);
            return false;
        }
    },

    sendNotification: async (data: Omit<Notification, 'id' | 'is_read' | 'created_at'>): Promise<boolean> => {
        try {
            const response = await apiClient.post('/api/notifications/send', data);
            return response.status === 200 || response.status === 201;
        } catch (error) {
            console.error('Send notification error:', error);
            return false;
        }
    },

    deleteNotification: async (id: number): Promise<boolean> => {
        try {
            const response = await apiClient.delete(`/api/notifications/${id}`);
            return response.status === 200;
        } catch (error) {
            console.error('Delete notification error:', error);
            return false;
        }
    }
};
