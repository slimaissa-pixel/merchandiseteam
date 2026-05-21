/**
 * useToast — lightweight web-only toast hook.
 *
 * Usage:
 *   const { showToast, ToastContainer } = useToast();
 *   showToast('Deleted successfully', 'success');
 *   showToast('Failed to delete', 'error');
 *
 *   // In JSX:
 *   <ToastContainer />
 */
import React, { useCallback, useRef, useState } from 'react';
import { Platform } from 'react-native';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

const ICONS: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
};

const COLORS: Record<ToastType, { bg: string; border: string; icon: string }> = {
  success: { bg: '#052e16', border: '#16a34a', icon: '#4ade80' },
  error:   { bg: '#2d0a0a', border: '#dc2626', icon: '#f87171' },
  info:    { bg: '#0c1a2e', border: '#3b82f6', icon: '#60a5fa' },
};

let _id = 0;

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  const showToast = useCallback((message: string, type: ToastType = 'info', duration = 3500) => {
    if (Platform.OS !== 'web') return;
    const id = ++_id;
    setToasts(prev => [...prev, { id, message, type }]);
    timers.current[id] = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
      delete timers.current[id];
    }, duration);
  }, []);

  const dismiss = useCallback((id: number) => {
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const ToastContainer = useCallback((): React.ReactElement | null => {
    if (Platform.OS !== 'web' || toasts.length === 0) return null;
    return (
      // @ts-ignore
      <div
        style={{
          position: 'fixed',
          bottom: 28,
          right: 28,
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          pointerEvents: 'none',
        } as React.CSSProperties}
      >
        <style>{`
          @keyframes toast-in {
            from { opacity: 0; transform: translateY(12px) scale(0.95); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
          }
        `}</style>

        {toasts.map(t => {
          const c = COLORS[t.type];
          return (
            // @ts-ignore
            <div
              key={t.id}
              onClick={() => dismiss(t.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 16px',
                borderRadius: 12,
                border: `1px solid ${c.border}`,
                backgroundColor: c.bg,
                boxShadow: `0 8px 24px rgba(0,0,0,0.4), 0 0 0 1px ${c.border}22`,
                minWidth: 260,
                maxWidth: 360,
                pointerEvents: 'auto',
                animation: 'toast-in 0.2s cubic-bezier(0.22,1,0.36,1)',
                cursor: 'default',
              } as React.CSSProperties}
            >
              {/* Icon badge */}
              {/* @ts-ignore */}
              <div
                style={{
                  width: 22, height: 22, borderRadius: 11,
                  backgroundColor: c.icon + '22',
                  border: `1px solid ${c.icon}44`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  fontSize: 12, color: c.icon, fontWeight: 700,
                } as React.CSSProperties}
              >
                {ICONS[t.type]}
              </div>

              {/* Message */}
              {/* @ts-ignore */}
              <span
                style={{
                  fontSize: 13, color: '#e2e8f0', fontWeight: 500,
                  lineHeight: '18px', flex: 1,
                } as React.CSSProperties}
              >
                {t.message}
              </span>

              {/* Dismiss × */}
              {/* @ts-ignore */}
              <span
                style={{
                  fontSize: 16, color: '#64748b', cursor: 'pointer', paddingLeft: 4,
                } as React.CSSProperties}
              >
                ×
              </span>
            </div>
          );
        })}
      </div>
    );
  }, [toasts, dismiss]);

  return { showToast, ToastContainer };
}
