

type Listener = (...args: any[]) => void;

class EventEmitter {
    private listeners: Record<string, Listener[]> = {};

    on(event: string, listener: Listener) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(listener);
    }

    off(event: string, listener: Listener) {
        if (!this.listeners[event]) return;
        this.listeners[event] = this.listeners[event].filter(l => l !== listener);
    }

    emit(event: string, ...args: any[]) {
        if (!this.listeners[event]) return;
        this.listeners[event].forEach(l => l(...args));
    }
}

export enum AppEvents {
    UNAUTHORIZED = 'UNAUTHORIZED',
    SHOW_TOAST = 'SHOW_TOAST',
}

export const appEventEmitter = new EventEmitter();

export const emitToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    appEventEmitter.emit(AppEvents.SHOW_TOAST, { message, type });
};

export const emitUnauthorized = () => {
    appEventEmitter.emit(AppEvents.UNAUTHORIZED);
};
