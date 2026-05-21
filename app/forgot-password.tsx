import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import FloatingLabelInput from '@/components/FloatingLabelInput';
import { DARK_COLORS, LIGHT_COLORS } from '@/constants/appColors';
import { useTheme } from '@/context/ThemeContext';
import PremiumGlowButton from '@/components/ui/PremiumGlowButton';



export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const COLOR = isDark ? DARK_COLORS : LIGHT_COLORS;

  const CSS = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=DM+Serif+Display:ital@0;1&display=swap');

      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      body { -webkit-font-smoothing: antialiased; background-color: ${COLOR.bg}; margin: 0; }

      .gold-text {
          background: linear-gradient(120deg, ${COLOR.gold} 0%, ${COLOR.goldLight} 40%, ${COLOR.gold} 70%, ${isDark ? '#b08c3c' : '#d97706'} 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: goldShift 5s linear infinite;
      }
      @keyframes goldShift { to { background-position: 200% center; } }

      .cta-btn-primary {
          position: relative; overflow: hidden; display: inline-flex; justify-content: center; alignItems: center; gap: 10px;
          padding: 16px 36px; border-radius: 14px; font-weight: 800; font-size: 16px; width: 100%;
          cursor: pointer; border: none; transition: transform 0.2s ease, box-shadow 0.2s ease;
          background: linear-gradient(135deg, ${COLOR.gold} 0%, ${COLOR.goldLight} 50%, ${COLOR.gold} 100%);
          background-size: 200% auto; color: ${isDark ? '#000' : '#fff'};
          box-shadow: 0 12px 30px ${isDark ? 'rgba(212,168,75,0.3)' : 'rgba(212,168,75,0.1)'}; animation: goldShift 4s linear infinite;
          font-family: 'Inter', sans-serif;
      }
      .cta-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 16px 40px ${isDark ? 'rgba(212,168,75,0.4)' : 'rgba(212,168,75,0.2)'}; }
      .cta-btn-primary:active { transform: translateY(0); }

      .ghost-input {
          background: ${isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'}; border: 1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'};
          border-radius: 14px; padding: 18px 20px; color: ${isDark ? '#fff' : '#000'}; font-size: 15px;
          font-weight: 500; font-family: 'Inter', sans-serif; outline: none; transition: border 0.2s, background 0.2s;
          width: 100%;
      }
      .ghost-input::placeholder { color: ${isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.4)'}; }
      .ghost-input:focus { border-color: ${isDark ? 'rgba(212,168,75,0.4)' : 'rgba(212,168,75,0.6)'}; background: ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}; }

      .link-text {
          color: ${COLOR.gold}; cursor: pointer; text-decoration: none; font-weight: 600; transition: color 0.2s; font-family: 'Inter', sans-serif; font-size: 14px;
      }
      .link-text:hover { color: ${COLOR.goldLight}; }
  `;

  const [isLoading, setIsLoading] = useState(false);

  const handleReset = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid enterprise email');
      return;
    }

    setIsLoading(true);
    try {
      const apiClient = (await import('@/services/apiClient')).default;
      await apiClient.post('/api/auth/forgot-password', { email });
      Alert.alert(
        'Recovery Transmitted',
        'If that email is registered, you will receive a reset link within minutes.',
        [{ text: 'Acknowledge', onPress: () => router.back() }]
      );
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.detail || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const S = {
    container: { display: 'flex', flexDirection: 'row' as const, height: '100vh', fontFamily: "'Inter', sans-serif", color: COLOR.white, backgroundColor: COLOR.bg },

    /* Left Hero Panel */
    left: { flex: 1.3, position: 'relative' as const, overflow: 'hidden', display: 'flex', flexDirection: 'column' as const, justifyContent: 'center', alignItems: 'center', borderRight: `1px solid ${COLOR.border}` },
    bgTop: { position: 'absolute' as const, top: '-20%', left: '-20%', width: '80%', height: '80%', borderRadius: '50%', backgroundColor: 'rgba(212,168,75,0.08)', filter: 'blur(120px)', zIndex: 0 },
    bgGrid: { position: 'absolute' as const, inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px), linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)', backgroundSize: '60px 60px', zIndex: 0 },
    leftContent: { position: 'relative' as const, zIndex: 10, padding: 40, textAlign: 'center' as const, width: '100%', maxWidth: 600 },

    iconBox: { width: 80, height: 80, borderRadius: 24, background: 'linear-gradient(135deg, #d4a84b, #b08c3c)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 30px rgba(212,168,75,0.4)', margin: '0 auto 40px' },

    h1: { fontWeight: 900, fontSize: 'clamp(2.5rem, 4vw, 3.5rem)', letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: 20 },
    italic: { fontFamily: "'DM Serif Display', Georgia, serif", fontStyle: 'italic', fontWeight: 700 },
    p: { color: COLOR.textSub, fontSize: 18, lineHeight: 1.6, fontWeight: 300, marginBottom: 60 },

    /* Right Form Panel */
    right: { flex: 1, backgroundColor: COLOR.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, overflowY: 'auto' as const },
    formBox: { width: '100%', maxWidth: 440 },

    formH2: { fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 8 },
    formSub: { color: COLOR.textMuted, fontSize: 15, marginBottom: 40, lineHeight: 1.6 },

    inputGrp: { marginBottom: 32 },
  };

  if (Platform.OS !== 'web') {
    return (
      <View style={{ flex: 1, backgroundColor: COLOR.bg }}>
        {/* Background Glow Decorations */}
        <View style={{
          position: 'absolute', top: -80, right: -80, width: 300, height: 300,
          borderRadius: 150, backgroundColor: 'rgba(212,168,75,0.06)',
        }} />
        <View style={{
          position: 'absolute', bottom: -120, left: -100, width: 350, height: 350,
          borderRadius: 175, backgroundColor: 'rgba(212,168,75,0.04)',
        }} />

        <ScrollView
          contentContainerStyle={{ padding: 28, paddingBottom: 60, flexGrow: 1, justifyContent: 'center' }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Icon Header */}
          <View style={{ marginBottom: 44, marginTop: 20, alignItems: 'center' }}>
            <View style={{
              width: 84, height: 84, borderRadius: 26,
              backgroundColor: 'rgba(212,168,75,0.12)',
              alignItems: 'center', justifyContent: 'center',
              marginBottom: 22,
              borderWidth: 1, borderColor: 'rgba(212,168,75,0.25)',
              shadowColor: COLOR.gold, shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.25, shadowRadius: 20, elevation: 8,
            }}>
              <Ionicons name="key" size={40} color={COLOR.gold} />
            </View>
            <Text style={{ fontSize: 30, color: isDark ? '#fff' : '#000', fontWeight: '900', letterSpacing: -0.8 }}>
              Recover <Text style={{ color: COLOR.gold }}>Access</Text>
            </Text>
            <Text style={{ color: COLOR.textMuted, textAlign: 'center', marginTop: 10, fontSize: 14, lineHeight: 20 }}>
              Enter your enterprise email to receive{'\n'}clearance reset instructions.
            </Text>
          </View>

          {/* Input */}
          <FloatingLabelInput
            label="Enterprise Email"
            value={email}
            onChangeText={setEmail}
            icon="mail-outline"
            variant={isDark ? 'dark' : 'light'}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {/* CTA Button */}
          <PremiumGlowButton
            title={isLoading ? "Transmitting..." : "Transmit Recovery Protocol"}
            onPress={handleReset}
            disabled={isLoading}
            pulse={!isLoading}
            style={{ width: '100%', marginTop: 24 }}
          />

          {/* Divider */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 28 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.05)' }} />
            <Text style={{ color: 'rgba(255,255,255,0.2)', marginHorizontal: 14, fontSize: 10, fontWeight: '800' }}>OR</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.05)' }} />
          </View>

          {/* Back to Login */}
          <TouchableOpacity onPress={() => router.back()} style={{ alignItems: 'center' }}>
            <Text style={{ color: COLOR.textMuted, fontSize: 14 }}>
              Remember your clearance code?{' '}
              <Text style={{ color: COLOR.gold, fontWeight: '700' }}>Login here</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <div style={S.container}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* Left Info Panel */}
      <div style={S.left}>
        <div style={S.bgTop} />
        <div style={S.bgGrid} />
        <div style={S.leftContent}>

          <div className="reveal" style={S.iconBox}>
            <Ionicons name="key" size={36} color="#000" />
          </div>

          <h1 className="reveal" style={{ ...S.h1, animationDelay: '0.1s' }}>
            Secure<br />
            <span className="gold-text" style={S.italic}>Recovery.</span>
          </h1>
          <p className="reveal" style={{ ...S.p, animationDelay: '0.2s' }}>
            If you have lost access to the FieldForce matrix, initiate a secure transmission here. We will verify your clearances and send recovery protocols.
          </p>
        </div>
      </div>

      {/* Right Form Panel */}
      <div style={S.right}>
        <div className="reveal" style={{ ...S.formBox, animationDelay: '0.3s' }}>
          <h2 style={S.formH2}>Reset Credentials</h2>
          <p style={S.formSub}>Enter your registered enterprise email address below to receive password recovery instructions.</p>

          <div style={S.inputGrp}>
            <input type="email" placeholder="Enterprise Email" className="ghost-input" value={email} onChange={e => setEmail(e.target.value)} />
          </div>

          <button className="cta-btn-primary" onClick={handleReset} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color="#000" /> : 'Transmit Recovery Request'}
          </button>

          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <span style={{ color: COLOR.textMuted, fontSize: 14 }}>Remember your clearance code? </span>
            <span className="link-text" onClick={() => router.back()}>Back to Login</span>
          </div>
        </div>
      </div>

    </div>
  );
}
