import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Platform,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { AuthService } from '@/services/auth.service';
import { NotificationService } from '@/services/notification.service';
import { useToast } from '@/context/ToastContext';
import FloatingLabelInput from '@/components/FloatingLabelInput';
import { DARK_COLORS, LIGHT_COLORS } from '@/constants/appColors';
import { useTheme } from '@/context/ThemeContext';
import PremiumGlowButton from '@/components/ui/PremiumGlowButton';


type UserType = 'supervisor' | 'merchandiser';

const ROLES = [
    { value: 'supervisor' as UserType, icon: '👤', label: 'Supervisor', sub: 'Team lead' },
    { value: 'merchandiser' as UserType, icon: '🛒', label: 'Merchandiser', sub: 'Field agent' },
];

export default function SignupScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const COLOR = isDark ? DARK_COLORS : LIGHT_COLORS;

    const CSS = `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=DM+Serif+Display:ital@0;1&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; -webkit-font-smoothing: antialiased; background-color: ${COLOR.bg}; margin: 0; }
        .gold-text {
            background: linear-gradient(120deg, ${COLOR.gold} 0%, ${COLOR.goldLight} 40%, ${COLOR.gold} 70%, ${isDark ? '#b08c3c' : '#d97706'} 100%);
            background-size: 200% auto; -webkit-background-clip: text; -webkit-text-fill-color: transparent;
            animation: goldShift 5s linear infinite;
        }
        @keyframes goldShift { to { background-position: 200% center; } }
        .cta-btn-primary {
            position: relative; overflow: hidden; display: inline-flex; justify-content: center; align-items: center; gap: 10px;
            padding: 17px 36px; border-radius: 14px; font-weight: 800; font-size: 14px;
            letter-spacing: 0.06em; width: 100%; cursor: pointer; border: none;
            transition: transform 0.25s cubic-bezier(.22,.68,0,1.2), box-shadow 0.25s ease;
            background: linear-gradient(135deg, ${COLOR.gold} 0%, ${COLOR.goldLight} 50%, ${COLOR.gold} 100%);
            background-size: 200% auto; color: ${isDark ? '#000' : '#fff'};
            box-shadow: 0 8px 28px ${isDark ? 'rgba(212,168,75,0.22)' : 'rgba(212,168,75,0.1)'}, 0 2px 6px rgba(0,0,0,0.4);
            animation: goldShift 4s linear infinite; font-family: 'Inter', sans-serif; text-transform: uppercase;
        }
        .cta-btn-primary::before {
            content: ''; position: absolute; inset: 0;
            background: linear-gradient(180deg, rgba(255,255,255,0.14) 0%, transparent 55%); pointer-events: none;
        }
        .cta-btn-primary:hover { transform: translateY(-2px) scale(1.008); box-shadow: 0 16px 44px ${isDark ? 'rgba(212,168,75,0.32)' : 'rgba(212,168,75,0.2)'}; }
        .cta-btn-primary:active { transform: translateY(0) scale(0.99); }
        .ghost-input {
            background: ${isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'};
            border: 1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'};
            border-radius: 14px; padding: 18px 20px; color: ${isDark ? '#fff' : '#000'}; font-size: 15px;
            font-weight: 500; font-family: 'Inter', sans-serif; outline: none; transition: border 0.2s, background 0.2s; width: 100%;
        }
        .ghost-input::placeholder { color: ${isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.35)'}; }
        .ghost-input:focus { border-color: ${isDark ? 'rgba(212,168,75,0.4)' : 'rgba(212,168,75,0.6)'}; background: ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}; }
        .ghost-input.field-error { border-color: rgba(239,68,68,0.5) !important; background: rgba(239,68,68,0.06) !important; }
        .error-msg { display: flex; align-items: center; gap: 5px; font-size: 11px; color: #f87171; font-family: 'Inter', sans-serif; font-weight: 500; margin-top: 5px; }
        .link-text { color: ${COLOR.gold}; cursor: pointer; text-decoration: none; font-weight: 600; transition: color 0.2s; font-family: 'Inter', sans-serif; font-size: 14px; }
        .link-text:hover { color: ${COLOR.goldLight}; }
        .role-card {
            flex: 1; padding: 13px 10px; border-radius: 12px; cursor: pointer;
            border: 1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)'};
            background: ${isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'};
            transition: all 0.22s; text-align: center; font-family: 'Inter', sans-serif; user-select: none;
        }
        .role-card.selected { border-color: rgba(212,168,75,0.5); background: rgba(212,168,75,0.08); }
        .role-card-name { font-size: 12px; font-weight: 700; color: ${isDark ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.75)'}; letter-spacing: 0.01em; }
        .role-card-sub { font-size: 10px; color: ${isDark ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.4)'}; margin-top: 2px; }
        .role-card.selected .role-card-name { color: ${COLOR.gold}; }
        .sec-badge { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; color: ${isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.5)'}; font-family: 'Inter', sans-serif; font-weight: 600; padding: 6px 14px; border-radius: 20px; border: 1px solid rgba(74,222,128,0.2); background: rgba(74,222,128,0.03); margin-bottom: 26px; }
        .sec-dot { width: 6px; height: 6px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 8px rgba(34,197,94,0.6); flex-shrink: 0; animation: secPulse 2s infinite; }
        @keyframes secPulse { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:0.7;transform:scale(1.4);} }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: rgba(212,168,75,0.18); border-radius: 3px; }
    `;

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedRole, setSelectedRole] = useState<UserType>('merchandiser');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [showPassword, setShowPassword] = useState(false);
    const { showToast } = useToast();

    const validate = (): boolean => {
        const e: Record<string, string> = {};
        if (!firstName.trim()) e.firstName = 'First name is required';
        if (!lastName.trim()) e.lastName = 'Last name is required';
        if (!email.trim() || !email.includes('@')) e.email = 'A valid enterprise email is required';
        if (!password || password.length < 6) e.password = 'Password must be at least 6 characters';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const clearError = (field: string) => {
        if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    };

    const handleRegister = async () => {
        if (!validate()) {
            // Visual highlights are sufficient on web per user preference
            if (Platform.OS !== 'web') {
                showToast({ message: 'Validation failed. Please check registry parameters.', type: 'error' });
            }
            return;
        }

        setIsLoading(true);
        showToast({ message: 'Initializing registry sequence...', type: 'info' });

        try {
            const userData = {
                email,
                first_name: firstName,
                last_name: lastName,
                password,
                role: selectedRole,
                is_active: false // Usually signup needs approval
            };

            await AuthService.register(userData);
            
            showToast({ message: 'Registry entry created. Dispatching admin request...', type: 'success' });

            // Send request for admin
            try {
                const adminNotified = await NotificationService.notifyAdmins({
                    title: 'New Member Registry',
                    message: `${firstName} ${lastName} has requested clearance for ${selectedRole.toUpperCase()} access.`,
                    type: 'alert'
                });

                if (adminNotified) {
                    showToast({ message: 'Admin notification confirmed successfully.', type: 'success' });
                } else {
                    showToast({ message: 'Registry logged but admin ping failed. Expect manual delay.', type: 'warning' });
                }
            } catch (notifyError) {
                console.error('Admin notification error:', notifyError);
                showToast({ message: 'Registry active. Notification system timeout.', type: 'warning' });
            }

            showToast({
                message: 'Clearance Granted! Authenticating...',
                type: 'success',
                duration: 2000
            });

            // Automatically login after successful registration
            try {
                await AuthService.login(email, password);
                router.replace(selectedRole === 'supervisor' ? '/supervisor' : '/merchandiser');
            } catch (loginError) {
                // If login fails (e.g., requires manual admin activation), fallback to login screen
                setTimeout(() => {
                    router.replace('/login');
                }, 2000);
            }

        } catch (error: any) {
            showToast({
                message: error.message || 'Registry access denied. Check parameters.',
                type: 'error'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleNavigateLogin = () => {
        router.push('/login');
    };

    const S = {
        container: { display: 'flex', flexDirection: 'row' as const, height: '100vh', fontFamily: "'Inter', sans-serif", color: COLOR.white, backgroundColor: COLOR.bg },
        left: { flex: 1.3, position: 'relative' as const, overflow: 'hidden', display: 'flex', flexDirection: 'column' as const, justifyContent: 'center', alignItems: 'center', borderRight: `1px solid ${COLOR.border}` },
        leftContent: { position: 'relative' as const, zIndex: 10, padding: '40px 60px', textAlign: 'center' as const, width: '100%', maxWidth: 620, display: 'flex' as const, flexDirection: 'column' as const, alignItems: 'center' as const },
        brandRow: { display: 'flex' as const, alignItems: 'center' as const, gap: 14, marginBottom: 40, alignSelf: 'flex-start' as const },
        logoBox: { width: 40, height: 40, borderRadius: 12, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 30px rgba(212,168,75,0.3)', background: COLOR.bg, border: '1px solid rgba(255,255,255,0.1)' },
        bgGlow1: { position: 'absolute' as const, top: '-10%', left: '-10%', width: '60%', height: '60%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,168,75,0.09) 0%, transparent 70%)', filter: 'blur(80px)', zIndex: 0 },
        bgGlow2: { position: 'absolute' as const, bottom: '-10%', right: '-5%', width: '45%', height: '45%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,168,75,0.05) 0%, transparent 70%)', filter: 'blur(60px)', zIndex: 0 },
        bgGrid: { position: 'absolute' as const, inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.016) 1px,transparent 1px), linear-gradient(90deg,rgba(255,255,255,0.016) 1px,transparent 1px)', backgroundSize: '64px 64px', zIndex: 0 },
        h1: { fontWeight: 900, fontSize: '3rem', letterSpacing: '-0.045em', lineHeight: 1.08, marginBottom: 18, color: '#fff' },
        italic: { fontFamily: "'DM Serif Display', Georgia, serif", fontStyle: 'italic' },
        p: { color: COLOR.textSub, fontSize: 16.5, lineHeight: 1.7, fontWeight: 300, maxWidth: 380, margin: '18px auto 0' },
        right: { flex: 1, backgroundColor: COLOR.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 48px', overflowY: 'auto' as const },
        formBox: { width: '100%', maxWidth: 416 },
        formH2: { fontSize: 25, fontWeight: 900, letterSpacing: '-0.035em', marginBottom: 6, color: '#fff' },
        formSub: { color: COLOR.textMuted, fontSize: 13.5, marginBottom: 26, lineHeight: 1.55 },
        inputGrp: { marginBottom: 14 },
        row: { display: 'flex', gap: 12, marginBottom: 14 },
        col: { flex: 1 },
    };

    if (Platform.OS !== 'web') {
        return (
            <View style={{ flex: 1, backgroundColor: COLOR.bg }}>
                {/* Background Decorations */}
                <View style={{ position: 'absolute', top: -50, right: -50, width: 250, height: 250, borderRadius: 125, backgroundColor: 'rgba(212,168,75,0.03)' }} />
                <View style={{ position: 'absolute', bottom: -100, left: -100, width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(212,168,75,0.02)' }} />

                <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
                    <View style={{ marginBottom: 40, marginTop: 40, alignItems: 'center' }}>
                        <View style={{ width: 80, height: 80, borderRadius: 24, backgroundColor: 'rgba(212,168,75,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 20, borderWidth: 1, borderColor: 'rgba(212,168,75,0.2)' }}>
                            <Ionicons name="shield-checkmark" size={40} color={COLOR.gold} />
                        </View>
                        <Text style={{ fontSize: 32, color: '#fff', fontWeight: '900', letterSpacing: -1 }}>Request <Text style={{ color: COLOR.gold }}>Access</Text></Text>
                        <Text style={{ fontSize: 14, color: COLOR.textSub, marginTop: 8, textAlign: 'center' }}>Enter your credentials to join the ecosystem</Text>
                    </View>

                    {/* Role Selector Mobile */}
                    <Text style={{ fontSize: 12, fontWeight: '800', color: COLOR.gold, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12, marginLeft: 4 }}>System Role</Text>
                    <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
                        {ROLES.map((role) => (
                            <TouchableOpacity
                                key={role.value}
                                onPress={() => setSelectedRole(role.value)}
                                style={{
                                    flex: 1,
                                    padding: 16,
                                    borderRadius: 16,
                                    backgroundColor: selectedRole === role.value ? 'rgba(212,168,75,0.12)' : 'rgba(255,255,255,0.03)',
                                    borderWidth: 1,
                                    borderColor: selectedRole === role.value ? COLOR.gold : 'rgba(255,255,255,0.06)',
                                    alignItems: 'center'
                                }}
                            >
                                <Text style={{ fontSize: 24, marginBottom: 4 }}>{role.icon}</Text>
                                <Text style={{ fontSize: 13, fontWeight: '700', color: selectedRole === role.value ? COLOR.gold : '#fff' }}>{role.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={{ gap: 16 }}>
                        <FloatingLabelInput
                            label="First Name"
                            value={firstName}
                            onChangeText={(t) => { setFirstName(t); clearError('firstName'); }}
                            icon="person-outline"
                            variant={isDark ? 'dark' : 'light'}
                            error={errors.firstName}
                        />
                        <FloatingLabelInput
                            label="Last Name"
                            value={lastName}
                            onChangeText={(t) => { setLastName(t); clearError('lastName'); }}
                            icon="person-outline"
                            variant={isDark ? 'dark' : 'light'}
                            error={errors.lastName}
                        />
                        <FloatingLabelInput
                            label="Enterprise Email"
                            value={email}
                            onChangeText={(t) => { setEmail(t); clearError('email'); }}
                            icon="mail-outline"
                            variant={isDark ? 'dark' : 'light'}
                            autoCapitalize="none"
                            error={errors.email}
                        />
                        <FloatingLabelInput
                            label="Strong Password"
                            value={password}
                            onChangeText={(t) => { setPassword(t); clearError('password'); }}
                            secureTextEntry
                            icon="lock-closed-outline"
                            variant={isDark ? 'dark' : 'light'}
                            error={errors.password}
                        />
                    </View>

                    <PremiumGlowButton
                        title={isLoading ? "Requesting Clearance..." : "Submit Clearance Request"}
                        onPress={handleRegister}
                        disabled={isLoading}
                        pulse={!isLoading}
                        style={{ width: '100%', marginTop: 24 }}
                    />

                    <TouchableOpacity onPress={handleNavigateLogin} style={{ marginTop: 32, alignItems: 'center' }}>
                        <Text style={{ color: COLOR.textMuted, fontSize: 14 }}>Already have an account? <Text style={{ color: COLOR.gold, fontWeight: '700' }}>Login here</Text></Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        );
    }

    /* ── Web UI ── */
    return (
        <div style={S.container}>
            <style dangerouslySetInnerHTML={{ __html: CSS }} />

            {/* Left Hero Panel */}
            <div style={S.left}>
                <div style={S.bgGlow1} />
                <div style={S.bgGlow2} />
                <div style={S.bgGrid} />
                <div style={S.leftContent}>
                    <img
                        src={(() => {
                            const a = require('@/assets/images/dark.png');
                            return typeof a === 'string' ? a : (a.uri || a.default || '');
                        })()}
                        alt="FieldForce"
                        className="anim-img"
                        style={{ width: '100%', maxWidth: 80, marginBottom: 44, borderRadius: 24, border: `1px solid ${COLOR.border}` }}
                    />
                    <h1 style={S.h1}>
                        Join the<br />
                        <span className="gold-text" style={S.italic}>FieldForce</span><br />
                        network.
                    </h1>
                    <p style={S.p}>
                        Integrate seamlessly into a real-time framework designed for high-performance merchandising and logistics.
                    </p>
                </div>
            </div>

            {/* Right Form Panel */}
            <div style={S.right}>
                <div style={S.formBox}>

                    {/* Secure badge */}
                    <div className="sec-badge">
                        <div className="sec-dot" />
                        Secure encrypted connection
                    </div>
                    <h2 style={S.formH2}>Request Clearance</h2>
                    <p style={S.formSub}>Register your credentials to access the FieldForce ecosystem.</p>

                    {/* Role Selector */}
                    <div className="role-label">Select your role</div>
                    <div className="role-grid">
                        {ROLES.map(({ value, icon, label, sub }) => (
                            <div
                                key={value}
                                className={`role-card ${selectedRole === value ? 'selected' : ''}`}
                                onClick={() => setSelectedRole(value)}
                            >
                                <div className="role-card-icon">{icon}</div>
                                <div className="role-card-name">{label}</div>
                                <div className="role-card-sub">{sub}</div>
                            </div>
                        ))}
                    </div>

                    {/* Name Row */}
                    <div style={S.row}>
                        <div style={S.col}>
                            <div className={`input-wrap ${errors.firstName ? 'has-error' : ''}`}>
                                <span className="input-icon">👤</span>
                                <input
                                    type="text" placeholder="First Name"
                                    className={`ghost-input ${errors.firstName ? 'field-error' : ''}`}
                                    value={firstName}
                                    onChange={e => { setFirstName(e.target.value); clearError('firstName'); }}
                                />
                            </div>
                            {errors.firstName && <div className="error-msg"><div className="error-dot" />{errors.firstName}</div>}
                        </div>
                        <div style={S.col}>
                            <div className={`input-wrap ${errors.lastName ? 'has-error' : ''}`}>
                                <span className="input-icon">👤</span>
                                <input
                                    type="text" placeholder="Last Name"
                                    className={`ghost-input ${errors.lastName ? 'field-error' : ''}`}
                                    value={lastName}
                                    onChange={e => { setLastName(e.target.value); clearError('lastName'); }}
                                />
                            </div>
                            {errors.lastName && <div className="error-msg"><div className="error-dot" />{errors.lastName}</div>}
                        </div>
                    </div>

                    {/* Email */}
                    <div style={S.inputGrp}>
                        <div className={`input-wrap ${errors.email ? 'has-error' : ''}`}>
                            <span className="input-icon">✉</span>
                            <input
                                type="email" placeholder="Enterprise Email"
                                className={`ghost-input ${errors.email ? 'field-error' : ''}`}
                                value={email}
                                onChange={e => { setEmail(e.target.value); clearError('email'); }}
                            />
                        </div>
                        {errors.email && <div className="error-msg"><div className="error-dot" />{errors.email}</div>}
                    </div>

                    {/* Password */}
                    <div style={S.inputGrp}>
                        <div className={`input-wrap ${errors.password ? 'has-error' : ''}`}>
                            <span className="input-icon">🔒</span>
                            <input
                                type={showPassword ? "text" : "password"} placeholder="Strong Password"
                                className={`ghost-input ${errors.password ? 'field-error' : ''}`}
                                style={{ paddingRight: 40 }}
                                value={password}
                                onChange={e => { setPassword(e.target.value); clearError('password'); }}
                            />
                            <div
                                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center' }}
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} />
                            </div>
                        </div>
                        {errors.password && <div className="error-msg"><div className="error-dot" />{errors.password}</div>}
                    </div>

                    {/* CTA */}
                    <div style={{ padding: '18px 0 10px' }}>
                        <button className="cta-btn-primary" onClick={handleRegister} disabled={isLoading}>
                            {isLoading ? <ActivityIndicator color="#000" /> : <>Acknowledge &amp; Register &nbsp;✦</>}
                        </button>
                    </div>

                    {/* Footer */}
                    <div style={{ textAlign: 'center' as const, marginTop: 26 }}>
                        <span style={{ color: COLOR.textMuted, fontSize: 13 }}>Clearance already active? </span>
                        <span className="link-text" onClick={handleNavigateLogin}>Authenticate →</span>
                    </div>
                </div>
            </div>
        </div>
    );
}