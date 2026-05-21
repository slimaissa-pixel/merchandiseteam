/**
 * WebConfirmDialog.tsx
 *
 * A premium web-native confirmation dialog — uses a styled HTML div overlay
 * instead of React Native Modal, giving us proper backdrop-filter blur,
 * CSS keyframe animations, and keyboard ESC support.
 *
 * Used on Platform.OS === 'web' only.
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { DARK_COLORS, LIGHT_COLORS } from '@/constants/appColors';
import { useTheme } from '@/context/ThemeContext';
import { Fonts } from '@/hooks/useFonts';

type Variant = 'danger' | 'warning' | 'info';

export interface WebConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: Variant;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

const VARIANT_MAP: Record<Variant, { color: string; icon: string; bg: string }> = {
  danger:  { color: '#ef4444', icon: 'trash-outline',         bg: '#ef444415' },
  warning: { color: '#f59e0b', icon: 'alert-circle-outline',  bg: '#f59e0b15' },
  info:    { color: '#3b82f6', icon: 'information-circle-outline', bg: '#3b82f615' },
};

export const WebConfirmDialog: React.FC<WebConfirmDialogProps> = ({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
  onConfirm,
  onClose,
}) => {
  if (Platform.OS !== 'web') return null;

  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const C = isDark ? DARK_COLORS : LIGHT_COLORS;
  const v = VARIANT_MAP[variant];
  const cancelRef = useRef<HTMLButtonElement>(null);

  // ESC key to close
  useEffect(() => {
    if (!visible) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    // Focus cancel button for accessibility
    setTimeout(() => cancelRef.current?.focus(), 50);
    return () => document.removeEventListener('keydown', handler);
  }, [visible, onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    if (visible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [visible]);

  if (!visible) return null;

  return (
    // @ts-ignore — web-only div
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        animation: 'wcd-fadein 0.15s ease',
      } as any}
    >
      <style>{`
        @keyframes wcd-fadein  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes wcd-slidein { from { opacity: 0; transform: scale(0.93) translateY(8px) } to { opacity: 1; transform: scale(1) translateY(0) } }
        .wcd-btn { transition: all 0.15s ease; cursor: pointer; outline: none; }
        .wcd-btn:hover { filter: brightness(1.08); }
        .wcd-btn:active { transform: scale(0.97); }
        .wcd-cancel:hover { background: ${isDark ? '#ffffff10' : '#00000008'} !important; }
      `}</style>

      {/* Dialog card — stop click propagation so clicking it doesn't close */}
      {/* @ts-ignore */}
      <div
        onClick={(e: any) => e.stopPropagation()}
        style={{
          width: 400,
          maxWidth: 'calc(100vw - 32px)',
          backgroundColor: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 20,
          padding: 28,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          boxShadow: isDark
            ? '0 24px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)'
            : '0 24px 48px rgba(0,0,0,0.18)',
          animation: 'wcd-slidein 0.2s cubic-bezier(0.22,1,0.36,1)',
        } as any}
      >
        {/* Icon */}
        {/* @ts-ignore */}
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          backgroundColor: v.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 16,
        }}>
          <Ionicons name={v.icon as any} size={26} color={v.color} />
        </div>

        {/* Title */}
        {/* @ts-ignore */}
        <p style={{
          margin: '0 0 8px',
          fontSize: 17,
          fontWeight: 700,
          fontFamily: Fonts.heading,
          color: C.text,
          textAlign: 'center',
        }}>{title}</p>

        {/* Message */}
        {/* @ts-ignore */}
        <p style={{
          margin: '0 0 24px',
          fontSize: 13,
          fontFamily: Fonts.body,
          color: C.textMuted,
          textAlign: 'center',
          lineHeight: '20px',
        }}>{message}</p>

        {/* Buttons */}
        {/* @ts-ignore */}
        <div style={{ display: 'flex', gap: 10, width: '100%' }}>
          {/* Cancel */}
          {/* @ts-ignore */}
          <button
            ref={cancelRef}
            className="wcd-btn wcd-cancel"
            onClick={onClose}
            style={{
              flex: 1,
              padding: '11px 0',
              borderRadius: 12,
              border: `1px solid ${C.border}`,
              backgroundColor: 'transparent',
              color: C.text,
              fontSize: 14,
              fontFamily: Fonts.headingSemiBold,
              fontWeight: 600,
            } as any}
          >
            {cancelLabel}
          </button>

          {/* Confirm */}
          {/* @ts-ignore */}
          <button
            className="wcd-btn"
            onClick={loading ? undefined : onConfirm}
            disabled={loading}
            style={{
              flex: 1,
              padding: '11px 0',
              borderRadius: 12,
              border: 'none',
              backgroundColor: v.color,
              color: '#fff',
              fontSize: 14,
              fontFamily: Fonts.headingSemiBold,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              opacity: loading ? 0.7 : 1,
            } as any}
          >
            {loading ? (
              // Simple spinner
              // @ts-ignore
              <div style={{
                width: 16, height: 16, border: '2px solid #fff4',
                borderTopColor: '#fff', borderRadius: '50%',
                animation: 'spin 0.7s linear infinite',
              }} />
            ) : (
              <Ionicons name={v.icon as any} size={14} color="#fff" />
            )}
            {loading ? 'Deleting...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
