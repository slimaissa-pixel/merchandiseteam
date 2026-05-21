import React, { useState, useEffect, useRef } from 'react';
import { Alert as RNAlert, Platform } from 'react-native';
import { ConfirmModal } from './ConfirmModal';

interface AlertConfig {
  title: string;
  message?: string;
  buttons?: RNAlertButton[];
}

interface RNAlertButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

// Global queue dispatcher
let globalEnqueue: ((conf: AlertConfig) => void) | null = null;
// Intercept Alert.alert globally (Native + Web)
const alertMethod = RNAlert.alert ? RNAlert.alert.bind(RNAlert) : null;
const originalAlert = alertMethod || (() => {});

(RNAlert as any).alert = (
  title: string,
  message?: string,
  buttons?: RNAlertButton[],
  _options?: any
) => {
  if (globalEnqueue) {
    globalEnqueue({ title, message, buttons });
  } else {
    originalAlert(title, message, buttons);
  }
};

export const GlobalAlert = () => {
  const [queue, setQueue] = useState<AlertConfig[]>([]);
  const [currentConfig, setCurrentConfig] = useState<AlertConfig | null>(null);
  const [visible, setVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    globalEnqueue = (conf) => {
      setQueue((prev) => [...prev, conf]);
    };
    return () => { globalEnqueue = null; };
  }, []);

  // Process queue
  useEffect(() => {
    if (!visible && !isAnimating && queue.length > 0 && !currentConfig) {
      // Pop the next alert from the queue
      const nextAlert = queue[0];
      setCurrentConfig(nextAlert);
      setQueue((prev) => prev.slice(1));
      setVisible(true);
    }
  }, [queue, visible, isAnimating, currentConfig]);

  const advanceQueue = (cb?: () => void) => {
    setVisible(false);
    setIsAnimating(true);
    
    // Wait for fade out animation
    setTimeout(() => {
      setCurrentConfig(null);
      setIsAnimating(false);
      cb?.();
    }, 300);
  };

  const config = currentConfig;
  if (!config) return null;

  const rawButtons: RNAlertButton[] = config.buttons?.length
    ? config.buttons
    : [{ text: 'OK', style: 'default' }];

  // Map to ConfirmModal `buttons` format
  const modalButtons = rawButtons.map((btn) => ({
    text: btn.text || 'D\'accord',
    style: btn.style ?? 'default',
    onPress: () => advanceQueue(btn.onPress),
  }));

  // Detect variant from title
  const t = config.title?.toLowerCase() ?? '';
  let variant: 'info' | 'danger' | 'warning' = 'info';
  if (t.includes('error') || t.includes('fail') || t.includes('cannot') || t.includes('end workday')) {
    variant = 'danger';
  } else if (t.includes('warning') || t.includes('attention')) {
    variant = 'warning';
  }

  return (
    <ConfirmModal
      visible={visible}
      title={config.title}
      message={config.message ?? ''}
      onClose={() => advanceQueue()}
      buttons={modalButtons}
      variant={variant}
    />
  );
};
