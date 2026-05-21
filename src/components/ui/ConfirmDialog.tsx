/**
 * ConfirmDialog.tsx
 *
 * Unified adapter — auto-picks the right confirmation UI:
 *   • Web  → WebConfirmDialog (HTML div, backdrop blur, CSS animations, ESC key)
 *   • Mobile → ConfirmModal (React Native Modal, spring animation)
 *
 * Usage (identical on both platforms):
 *   <ConfirmDialog
 *     visible={confirmDelete.visible}
 *     title="Delete Member"
 *     message="Are you sure? This cannot be undone."
 *     variant="danger"
 *     confirmLabel="Delete"
 *     onConfirm={handleDelete}
 *     onClose={() => setConfirmDelete({ visible: false })}
 *   />
 */
import React from 'react';
import { Platform } from 'react-native';
import { ConfirmModal } from './ConfirmModal';
import { WebConfirmDialog, WebConfirmDialogProps } from './WebConfirmDialog';

export type ConfirmDialogProps = WebConfirmDialogProps;

export const ConfirmDialog: React.FC<ConfirmDialogProps> = (props) => {
  if (Platform.OS === 'web') {
    return <WebConfirmDialog {...props} />;
  }
  // Mobile: map to ConfirmModal's prop API
  return (
    <ConfirmModal
      visible={props.visible}
      title={props.title}
      message={props.message}
      variant={props.variant ?? 'danger'}
      confirmLabel={props.confirmLabel ?? 'Confirm'}
      cancelLabel={props.cancelLabel ?? 'Cancel'}
      loading={props.loading}
      onConfirm={props.onConfirm}
      onClose={props.onClose}
    />
  );
};
