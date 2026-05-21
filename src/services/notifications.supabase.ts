import { supabase } from '../../lib/supabase';
import { StorageKeys, StorageService } from './storage.service';

type NotificationCallback = (data: any) => void;

class NotificationsSocket {
    private channel: any = null;
    private callbacks: Set<NotificationCallback> = new Set();

    async connect() {
        if (this.channel) return;

        try {
            // Get local user info to know which user_id to filter by
            const sessionStr = await StorageService.getItem(StorageKeys.USER_SESSION);
            if (!sessionStr) return;
            const user = JSON.parse(sessionStr);
            const userId = user.id;

            // Subscribe to Postgres changes on the 'notifications' table for this specific user
            this.channel = supabase
                .channel(`notifications-${userId}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'notifications',
                        filter: `user_id=eq.${userId}`
                    },
                    (payload) => {
                        console.log('[NotificationsSocket] Real-time insert received:', payload.new);
                        this.callbacks.forEach(cb => cb(payload.new));
                    }
                )
                .subscribe((status: string) => {
                    if (status === 'SUBSCRIBED') {
                        console.log('[NotificationsSocket] Supabase Real-time Connected');
                    }
                    if (status === 'CLOSED') {
                        console.log('[NotificationsSocket] Supabase Real-time Closed');
                        this.channel = null;
                    }
                });

        } catch (e) {
            console.error('[NotificationsSocket] Connection Setup Error: ', e);
        }
    }

    disconnect() {
        if (this.channel) {
            supabase.removeChannel(this.channel);
            this.channel = null;
        }
    }

    subscribe(callback: NotificationCallback) {
        this.callbacks.add(callback);
        return () => {
            this.callbacks.delete(callback);
        };
    }
}

export const notificationsSocket = new NotificationsSocket();
