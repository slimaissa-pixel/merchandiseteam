import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import FloatingLabelInput from '@/components/FloatingLabelInput';
import { DARK_COLORS, LIGHT_COLORS } from '@/constants/appColors';
import { useTheme } from '@/context/ThemeContext';
import PremiumGlowButton from '@/components/ui/PremiumGlowButton';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token: string }>();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const COLOR = isDark ? DARK_COLORS : LIGHT_COLORS;

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleReset = async () => {
    if (!token) {
      Alert.alert('Error', 'Invalid or missing reset token.');
      return;
    }
    if (!password || password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const apiClient = (await import('@/services/apiClient')).default;
      await apiClient.post('/api/auth/reset-password', {
        token,
        new_password: password,
      });
      Alert.alert(
        'Password Reset',
        'Your password has been successfully reset. You can now log in.',
        [{ text: 'Go to Login', onPress: () => router.replace('/login') }]
      );
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Reset failed. The link may have expired.';
      Alert.alert('Error', msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (Platform.OS !== 'web') {
    return (
      <View style={{ flex: 1, backgroundColor: COLOR.bg }}>
        <View style={{
          position: 'absolute', top: -80, right: -80, width: 300, height: 300,
          borderRadius: 150, backgroundColor: 'rgba(212,168,75,0.06)',
        }} />
        <ScrollView
          contentContainerStyle={{ padding: 28, paddingBottom: 60, flexGrow: 1, justifyContent: 'center' }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ marginBottom: 44, marginTop: 20, alignItems: 'center' }}>
            <View style={{
              width: 84, height: 84, borderRadius: 26,
              backgroundColor: 'rgba(212,168,75,0.12)',
              alignItems: 'center', justifyContent: 'center',
              marginBottom: 22,
              borderWidth: 1, borderColor: 'rgba(212,168,75,0.25)',
            }}>
              <Ionicons name="lock-closed" size={40} color={COLOR.gold} />
            </View>
            <Text style={{ fontSize: 28, color: isDark ? '#fff' : '#000', fontWeight: '900', letterSpacing: -0.8 }}>
              Set New <Text style={{ color: COLOR.gold }}>Password</Text>
            </Text>
            <Text style={{ color: COLOR.textMuted, textAlign: 'center', marginTop: 10, fontSize: 14, lineHeight: 20 }}>
              Enter your new password below.
            </Text>
          </View>

          <FloatingLabelInput
            label="New Password"
            value={password}
            onChangeText={setPassword}
            icon="lock-closed-outline"
            variant={isDark ? 'dark' : 'light'}
            secureTextEntry
          />
          <View style={{ marginTop: 16 }}>
            <FloatingLabelInput
              label="Confirm Password"
              value={confirm}
              onChangeText={setConfirm}
              icon="lock-closed-outline"
              variant={isDark ? 'dark' : 'light'}
              secureTextEntry
            />
          </View>

          <PremiumGlowButton
            title={isLoading ? "Resetting..." : "Reset Password"}
            onPress={handleReset}
            disabled={isLoading}
            pulse={!isLoading}
            style={{ width: '100%', marginTop: 28 }}
          />

          <TouchableOpacity onPress={() => router.replace('/login')} style={{ alignItems: 'center', marginTop: 24 }}>
            <Text style={{ color: COLOR.textMuted, fontSize: 14 }}>
              Back to{' '}
              <Text style={{ color: COLOR.gold, fontWeight: '700' }}>Login</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: COLOR.bg, alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 440, padding: 40 }}>
        <h2 style={{ color: isDark ? '#fff' : '#000', fontWeight: 900, marginBottom: 8 }}>
          Set New Password
        </h2>
        <p style={{ color: COLOR.textMuted, marginBottom: 32 }}>
          Enter your new password. It must be at least 8 characters.
        </p>
        <input
          type="password"
          placeholder="New Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{
            width: '100%', padding: '16px 20px', marginBottom: 16, borderRadius: 14,
            background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'}`,
            color: isDark ? '#fff' : '#000', fontSize: 15, boxSizing: 'border-box',
          }}
        />
        <input
          type="password"
          placeholder="Confirm Password"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          style={{
            width: '100%', padding: '16px 20px', marginBottom: 32, borderRadius: 14,
            background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'}`,
            color: isDark ? '#fff' : '#000', fontSize: 15, boxSizing: 'border-box',
          }}
        />
        <button
          onClick={handleReset}
          disabled={isLoading}
          style={{
            width: '100%', padding: '16px', borderRadius: 14, border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg, #d4a84b, #f0c060)',
            color: '#000', fontWeight: 800, fontSize: 16,
            opacity: isLoading ? 0.7 : 1,
          }}
        >
          {isLoading ? 'Resetting...' : 'Reset Password'}
        </button>
      </div>
    </div>
  );
}
