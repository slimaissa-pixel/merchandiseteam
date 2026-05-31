import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DARK_COLORS } from '@/constants/appColors';
import { useAuth } from '@/context/AuthContext';
import { Fonts } from '@/hooks/useFonts';
import FloatingLabelInput from '@/components/FloatingLabelInput';
import PremiumGlowButton from '@/components/ui/PremiumGlowButton';
import WebLogin from '@/components/WebLogin';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  
  const COLOR = DARK_COLORS;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleAutoLogin = async (type: 'supervisor' | 'merchandiser') => {
    const demoEmail = type === 'supervisor' ? 'supervisor@sup.com' : 'merch@merch.com';
    try {
      setIsLoading(true);
      await signIn(demoEmail, 'password123', true);
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Invalid credentials!');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    Keyboard.dismiss();
    if (!email || !password) {
      Alert.alert('Error', 'Email or password are incorrect !');
      return;
    }
    try {
      setIsLoading(true);
      await signIn(email, password, rememberMe);
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Invalid sign in !');
    } finally {
      setIsLoading(false);
    }
  };

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const meshAnim1 = useRef(new Animated.Value(0)).current;
  const meshAnim2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start();

    // Floating Mesh Gradient Animations
    Animated.loop(
      Animated.sequence([
        Animated.timing(meshAnim1, { toValue: 1, duration: 8000, useNativeDriver: true }),
        Animated.timing(meshAnim1, { toValue: 0, duration: 8000, useNativeDriver: true })
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(meshAnim2, { toValue: 1, duration: 12000, useNativeDriver: true }),
        Animated.timing(meshAnim2, { toValue: 0, duration: 12000, useNativeDriver: true })
      ])
    ).start();
  }, []);

  const mesh1Style = {
    transform: [
      { translateX: meshAnim1.interpolate({ inputRange: [0, 1], outputRange: [-50, 100] }) },
      { translateY: meshAnim1.interpolate({ inputRange: [0, 1], outputRange: [-50, 150] }) },
      { scale: meshAnim1.interpolate({ inputRange: [0, 1], outputRange: [1, 1.2] }) }
    ]
  };

  const mesh2Style = {
    transform: [
      { translateX: meshAnim2.interpolate({ inputRange: [0, 1], outputRange: [50, -100] }) },
      { translateY: meshAnim2.interpolate({ inputRange: [0, 1], outputRange: [150, -50] }) },
      { scale: meshAnim2.interpolate({ inputRange: [0, 1], outputRange: [1, 1.3] }) }
    ]
  };

  if (Platform.OS === 'web') {
    return (
      <WebLogin
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        rememberMe={rememberMe}
        setRememberMe={setRememberMe}
        handleLogin={handleLogin}
        isLoading={isLoading}
        handleAutoLogin={handleAutoLogin}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Background Mesh Gradient */}
      <View style={StyleSheet.absoluteFill}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#0B0615' }]} />
        <Animated.View style={[styles.meshBlob, { backgroundColor: 'rgba(212,168,75,0.15)', top: '-10%', left: '-20%' }, mesh1Style]} />
        <Animated.View style={[styles.meshBlob, { backgroundColor: 'rgba(139,92,246,0.12)', bottom: '-10%', right: '-20%' }, mesh2Style]} />
        <View style={styles.gridOverlay} />
      </View>

      <StatusBar style="light" />
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

            <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/')}>
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>

            <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
              <View style={styles.logoBadge}>
                <Image source={require('@/assets/images/login.png')} style={styles.logoImage} resizeMode="contain" />
              </View>
              <Text style={styles.title}>System <Text style={{ color: COLOR.gold }}>Access</Text></Text>
              <Text style={styles.subtitle}>Authenticate to access your operational dashboard.</Text>
            </Animated.View>

            <Animated.View style={[styles.formContainer, { opacity: fadeAnim }]}>
              <FloatingLabelInput
                key="login-email"
                label="Enterprise Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                icon="mail-outline"
                variant="dark"
                autoCapitalize="none"
              />
              <View style={{ marginTop: 16 }}>
                <FloatingLabelInput
                  key="login-password"
                  label="Secure Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  icon="lock-closed-outline"
                  variant="dark"
                />
              </View>

              <View style={styles.optionsRow}>
                <View style={styles.rememberContainer}>
                  <Switch
                    value={rememberMe}
                    onValueChange={setRememberMe}
                    trackColor={{ false: 'rgba(255,255,255,0.1)', true: COLOR.gold }}
                    thumbColor={rememberMe ? '#FFF' : '#f4f3f4'}
                  />
                  <Text style={styles.rememberText}>Remember clearance</Text>
                </View>
                <TouchableOpacity onPress={() => router.push('/forgot-password')}>
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>

              <PremiumGlowButton
                title={isLoading ? "Authenticating..." : "Authenticate"}
                onPress={handleLogin}
                icon={isLoading ? undefined : "log-in-outline"}
                disabled={isLoading}
                pulse={!isLoading}
                style={{ width: '100%', marginTop: 8 }}
              />

              <View style={styles.signUpLink}>
                <Text style={styles.signUpText}>
                  No clearance? <Text style={styles.signUpTextAccent} onPress={() => router.push('/signup' as any)}>Issue Request</Text>
                </Text>
              </View>
            </Animated.View>

            {/* Quick Access Demo Buttons */}
            <View style={styles.demoBox}>
              <Text style={styles.demoTitle}>Quick Access — Testing</Text>
              <View style={styles.demoGrid}>
                <TouchableOpacity style={[styles.demoBtn, { borderColor: 'rgba(212,168,75,0.25)' }]} onPress={() => handleAutoLogin('supervisor')} disabled={isLoading}>
                  <Ionicons name="eye-outline" size={16} color={COLOR.gold} />
                  <Text style={[styles.demoBtnText, { color: COLOR.gold }]}>Supervisor</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.demoBtn, { borderColor: 'rgba(56,189,248,0.25)' }]} onPress={() => handleAutoLogin('merchandiser')} disabled={isLoading}>
                  <Ionicons name="briefcase-outline" size={16} color="#38bdf8" />
                  <Text style={[styles.demoBtnText, { color: '#38bdf8' }]}>Merchandiser</Text>
                </TouchableOpacity>
              </View>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0615',
  },
  meshBlob: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    filter: 'blur(80px)' as any,
  },
  gridOverlay: {
    position: 'absolute',
    inset: 0,
    opacity: 0.03,
  },
  scrollContent: {
    paddingHorizontal: 28,
    paddingTop: 10,
    paddingBottom: 60,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoBadge: {
    width: 84,
    height: 84,
    borderRadius: 26,
    backgroundColor: 'rgba(212,168,75,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(212,168,75,0.25)',
    shadowColor: DARK_COLORS.gold,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  logoImage: {
    width: 44,
    height: 44,
  },
  title: {
    fontSize: 32,
    fontFamily: Fonts.heading,
    marginBottom: 8,
    color: '#FFFFFF',
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: Fonts.body,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.6)',
    paddingHorizontal: 20,
  },
  formContainer: {
    width: '100%',
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 24,
    paddingHorizontal: 4,
  },
  rememberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rememberText: {
    marginLeft: 10,
    fontSize: 14,
    fontFamily: Fonts.body,
    color: 'rgba(255,255,255,0.6)',
  },
  forgotText: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 14,
    color: DARK_COLORS.gold,
  },
  signUpLink: {
    alignItems: 'center',
    marginTop: 24,
  },
  signUpText: {
    fontSize: 14,
    fontFamily: Fonts.body,
    color: 'rgba(255,255,255,0.5)',
  },
  signUpTextAccent: {
    color: DARK_COLORS.gold,
    fontFamily: Fonts.headingSemiBold,
  },
  demoBox: {
    marginTop: 40,
    padding: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  demoTitle: {
    fontSize: 12,
    fontFamily: Fonts.headingSemiBold,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  demoGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  demoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  demoBtnText: {
    color: 'rgba(255,255,255,0.7)',
    fontFamily: Fonts.headingSemiBold,
    fontSize: 13,
  }
});
