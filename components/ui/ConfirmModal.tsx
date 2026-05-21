import { Ionicons } from '@expo/vector-icons';
import { Animated, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DARK_COLORS, LIGHT_COLORS } from '@/constants/appColors';
import { useTheme } from '@/context/ThemeContext';
import { Fonts } from '@/hooks/useFonts';
import React, { useRef as _useRef, useEffect as _useEffect } from 'react';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  danger = true,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const C = isDark ? DARK_COLORS : LIGHT_COLORS;

  const scale = _useRef(new Animated.Value(0.92)).current;
  const opacity = _useRef(new Animated.Value(0)).current;

  _useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, friction: 7, tension: 50, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start();
    } else {
      scale.setValue(0.92);
      opacity.setValue(0);
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onCancel}>
      <Animated.View style={[s.backdrop, { opacity }]}>
        <Animated.View
          style={[
            s.card,
            {
              backgroundColor: C.card,
              borderColor: C.border,
              transform: [{ scale }],
            },
          ]}
        >
          {/* Icon */}
          <View style={[s.iconWrap, { backgroundColor: danger ? '#ef444418' : C.primary + '18' }]}>
            <Ionicons
              name={danger ? 'trash-outline' : 'alert-circle-outline'}
              size={26}
              color={danger ? '#ef4444' : C.primary}
            />
          </View>

          {/* Text */}
          <Text style={[s.title, { color: C.text }]}>{title}</Text>
          <Text style={[s.message, { color: C.textMuted }]}>{message}</Text>

          {/* Buttons */}
          <View style={s.btnRow}>
            <TouchableOpacity
              style={[s.btn, { backgroundColor: C.surface, borderColor: C.border }]}
              onPress={onCancel}
              activeOpacity={0.75}
            >
              <Text style={[s.btnTxt, { color: C.text }]}>{cancelLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.btn, s.btnDanger, { backgroundColor: danger ? '#ef4444' : C.primary }]}
              onPress={onConfirm}
              activeOpacity={0.8}
            >
              <Ionicons name={danger ? 'trash-outline' : 'checkmark'} size={15} color="#fff" style={{ marginRight: 6 }} />
              <Text style={[s.btnTxt, { color: '#fff' }]}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: 360,
    borderRadius: 20,
    borderWidth: 1,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 20,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontFamily: Fonts.heading,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 13,
    fontFamily: Fonts.body,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  btnDanger: {
    borderWidth: 0,
  },
  btnTxt: {
    fontSize: 14,
    fontFamily: Fonts.headingSemiBold,
  },
});
