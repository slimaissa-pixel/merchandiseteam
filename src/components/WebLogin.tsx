import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
    ActivityIndicator,
    Pressable,
    View
} from 'react-native';
import { DARK_COLORS } from '@/constants/appColors';

const MODULES = [
    { title: 'User & Roles', icon: 'people', color: '#d4a84b', items: ['Add, edit, and remove users', 'Role-based permissions'] },
    { title: 'GPS Tracking', icon: 'location', color: '#8b5cf6', items: ['Real-time field visibility', 'Map visualization'] },
    { title: 'Store Mgmt', icon: 'storefront', color: '#34d399', items: ['Manage stores + GPS data', 'Interactive map search'] },
    { title: 'Planning', icon: 'calendar', color: '#38bdf8', items: ['Monthly plans and itineraries', 'Track compliance'] },
    { title: 'Products', icon: 'cube', color: '#fb7185', items: ['Product catalog with images', 'Stock alert management'] },
    { title: 'Analytics', icon: 'bar-chart', color: '#f59e0b', items: ['Set monthly objectives', 'KPI dashboards'] },
];

interface WebLoginProps {
    email: string; setEmail: (t: string) => void;
    password: string; setPassword: (t: string) => void;
    rememberMe: boolean; setRememberMe: (v: boolean) => void;
    handleLogin: () => void; handleGoogleSignIn: () => void; isLoading: boolean;
    handleAutoLogin: (type: 'supervisor' | 'merchandiser') => void;
}

export default function WebLogin({
    email, setEmail, password, setPassword,
    rememberMe, setRememberMe,
    handleLogin, handleGoogleSignIn, isLoading,
    handleAutoLogin
}: WebLoginProps) {
    const router = useRouter();
    const COLOR = DARK_COLORS;

    const CSS = `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=DM+Serif+Display:ital@0;1&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { -webkit-font-smoothing: antialiased; background-color: #0B0615; margin: 0; }
        .accent-text {
            background: linear-gradient(120deg, ${COLOR.gold} 0%, ${COLOR.goldLight} 40%, ${COLOR.gold} 70%, #b08c3c 100%);
            background-size: 200% auto; -webkit-background-clip: text; -webkit-text-fill-color: transparent;
            animation: accentShift 5s linear infinite;
        }
        @keyframes accentShift { to { background-position: 200% center; } }
        
        .cta-btn-primary {
            position: relative; overflow: hidden; display: inline-flex; justify-content: center; align-items: center; gap: 10px;
            padding: 16px 36px; border-radius: 14px; font-weight: 800; font-size: 16px; width: 100%;
            cursor: pointer; border: none; transition: transform 0.2s ease, box-shadow 0.2s ease;
            background: linear-gradient(135deg, ${COLOR.gold} 0%, ${COLOR.goldLight} 50%, ${COLOR.gold} 100%);
            background-size: 200% auto; color: #000;
            box-shadow: 0 12px 30px rgba(212,168,75,0.3);
            animation: accentShift 4s linear infinite; font-family: 'Inter', sans-serif;
        }
        .cta-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 16px 40px rgba(212,168,75,0.4); }
        .cta-btn-primary:active { transform: translateY(0); }
        
        .ghost-input {
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 14px; padding: 18px 20px; color: #fff; font-size: 15px;
            font-weight: 500; font-family: 'Inter', sans-serif; outline: none; transition: border 0.2s, background 0.2s; width: 100%;
        }
        .ghost-input::placeholder { color: rgba(255,255,255,0.25); }
        .ghost-input:focus { border-color: rgba(212,168,75,0.4); background: rgba(255,255,255,0.05); }
        
        .switch-lbl { font-family: 'Inter', sans-serif; font-size: 14px; color: rgba(255,255,255,0.6); cursor: pointer; user-select: none; }
        .link-text { color: ${COLOR.gold}; cursor: pointer; text-decoration: none; font-weight: 600; transition: color 0.2s; font-family: 'Inter', sans-serif; font-size: 14px; }
        .link-text:hover { color: ${COLOR.goldLight}; }
        
        .google-btn {
            display: flex; align-items: center; justify-content: center; gap: 12px; padding: 16px; border-radius: 14px;
            background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
            cursor: pointer; transition: background 0.2s; font-family: 'Inter', sans-serif; font-weight: 600;
            color: #fff; font-size: 15px; width: 100%;
        }
        .google-btn:hover { background: rgba(255,255,255,0.08); }
        
        .module-card {
            background: linear-gradient(145deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01));
            border: 1px solid rgba(255,255,255,0.06);
            border-radius: 16px; padding: 16px; flex: 1; min-width: 220px; margin: 6px;
        }

        .mesh-blob-1 { position: absolute; width: 600px; height: 600px; background: rgba(212,168,75,0.08); border-radius: 50%; filter: blur(120px); top: -20%; left: -10%; animation: float1 10s infinite alternate ease-in-out; }
        .mesh-blob-2 { position: absolute; width: 500px; height: 500px; background: rgba(139,92,246,0.06); border-radius: 50%; filter: blur(100px); bottom: -10%; right: -10%; animation: float2 12s infinite alternate ease-in-out; }
        @keyframes float1 { from { transform: translate(0, 0) scale(1); } to { transform: translate(50px, 100px) scale(1.1); } }
        @keyframes float2 { from { transform: translate(0, 0) scale(1); } to { transform: translate(-80px, -50px) scale(1.2); } }
        
        .demo-box { display: flex; gap: 10px; margin-top: 40px; }
        .demo-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px; border-radius: 12px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); color: rgba(255,255,255,0.7); font-weight: 600; font-family: 'Inter', sans-serif; cursor: pointer; transition: background 0.2s; }
        .demo-btn:hover { background: rgba(255,255,255,0.08); }
    `;

    const S = {
        container: { display: 'flex', flexDirection: 'row' as const, height: '100vh', fontFamily: "'Inter', sans-serif", color: '#fff', backgroundColor: '#0B0615' },
        left: { flex: 1.3, position: 'relative' as const, overflow: 'hidden' },
        bgGrid: { position: 'absolute' as const, inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px), linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)', backgroundSize: '60px 60px', zIndex: 0 },
        leftContent: { position: 'relative' as const, zIndex: 10, padding: '60px 80px', height: '100%', overflowY: 'auto' as const },

        brandRow: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 60, cursor: 'pointer' },
        logoBox: { width: 44, height: 44, borderRadius: 14, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px rgba(212,168,75,0.4)', backgroundColor: 'rgba(212,168,75,0.1)', border: '1px solid rgba(212,168,75,0.25)' },

        h1: { fontWeight: 900, fontSize: '3.5rem', letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: 20 },
        italic: { fontFamily: "'DM Serif Display', Georgia, serif", fontStyle: 'italic', fontWeight: 700 },
        p: { color: 'rgba(255,255,255,0.6)', fontSize: 18, lineHeight: 1.6, fontWeight: 300, maxWidth: 480, marginBottom: 60 },

        moduleGrid: { display: 'flex', flexWrap: 'wrap' as const, margin: -6 },

        /* Right Form Panel */
        right: { flex: 1, backgroundColor: 'rgba(20,15,30,0.5)', backdropFilter: 'blur(40px)', borderLeft: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, zIndex: 10 },
        formBox: { width: '100%', maxWidth: 420 },

        formH2: { fontSize: 32, fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 8 },
        formSub: { color: 'rgba(255,255,255,0.5)', fontSize: 15, marginBottom: 40 },

        inputGrp: { marginBottom: 20 },

        optionsRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '24px 0 32px' },
        cbWrapper: { display: 'flex', alignItems: 'center', gap: 10 },
        checkbox: { width: 18, height: 18, borderRadius: 6, border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(0,0,0,0.2)', cursor: 'pointer', accentColor: COLOR.gold },

        divider: { display: 'flex', alignItems: 'center', gap: 16, margin: '32px 0' },
        line: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
        divText: { fontSize: 11, fontWeight: 800, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)' },
    };

    return (
        <div style={S.container}>
            <style dangerouslySetInnerHTML={{ __html: CSS }} />

            {/* Left Info Panel with Mesh Gradient */}
            <div style={S.left}>
                <div className="mesh-blob-1" />
                <div className="mesh-blob-2" />
                <div style={S.bgGrid} />
                <div style={S.leftContent}>
                    <div style={S.brandRow} onClick={() => router.push("/")}>
                        <div style={S.logoBox}>
                            <img src={(() => {
                                const a = require('@/assets/images/login.png');
                                return typeof a === 'string' ? a : (a.uri || a.default || '');
                            })()} style={{ width: '70%', height: '70%', objectFit: 'contain' }} alt="Logo" />
                        </div>
                        <div>
                            <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.02em' }}>FieldForce</div>
                            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: COLOR.gold, marginTop: 4 }}>Enterprise Setup</div>
                        </div>
                    </div>
                    <h1 style={S.h1}>
                        Command your<br />
                        <span className="accent-text" style={S.italic}>operations.</span>
                    </h1>
                    <p style={S.p}>
                        Access the architectural-grade infrastructure designed specifically for elite merchandising and field sales execution.
                    </p>

                    <div style={S.moduleGrid}>
                        {MODULES.map((m, i) => (
                            <div key={i} className="module-card">
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                                    <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: m.color + '20', justifyContent: 'center', alignItems: 'center' }}>
                                        <Ionicons name={m.icon as any} size={18} color={m.color} />
                                    </View>
                                    <div style={{ fontWeight: 700, fontSize: 15 }}>{m.title}</div>
                                </div>
                                <ul style={{ margin: 0, paddingLeft: 24, color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 1.8 }}>
                                    {m.items.map((item, j) => <li key={j}>{item}</li>)}
                                </ul>
                            </div>
                        ))}
                    </div>

                </div>
            </div>

            {/* Right Login Form */}
            <div style={S.right}>
                <div style={S.formBox}>
                    <h2 style={S.formH2}>Welcome Back</h2>
                    <p style={S.formSub}>Authenticate to access your operational dashboard.</p>

                    <div style={S.inputGrp}>
                        <input type="email" placeholder="Enterprise Email" className="ghost-input" value={email} onChange={e => setEmail(e.target.value)} />
                    </div>
                    <div style={S.inputGrp}>
                        <input type="password" placeholder="Secure Password" className="ghost-input" value={password} onChange={e => setPassword(e.target.value)} />
                    </div>

                    <div style={S.optionsRow}>
                        <label style={S.cbWrapper}>
                            <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} style={S.checkbox} />
                            <span className="switch-lbl">Remember me</span>
                        </label>
                        <span className="link-text" onClick={() => router.push('/forgot-password')}>Forgot Password?</span>
                    </div>

                    <button className="cta-btn-primary" onClick={handleLogin} disabled={isLoading}>
                        {isLoading ? <ActivityIndicator color="#000" /> : 'Authenticate System'}
                    </button>

                    <div style={S.divider}>
                        <div style={S.line} />
                        <div style={S.divText}>OR</div>
                        <div style={S.line} />
                    </div>

                    <button className="google-btn" onClick={handleGoogleSignIn} disabled={isLoading}>
                        <img src={(() => {
                            const a = require('@/assets/images/google_logo.png');
                            return typeof a === 'string' ? a : (a.uri || a.default || '');
                        })()} style={{ width: 18, height: 18 }} alt="Google" />
                        Continue with Enterprise SSO
                    </button>

                    <div style={{ textAlign: 'center', marginTop: 32 }}>
                        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Don&apos;t have clearance? </span>
                        <span className="link-text" onClick={() => router.push('/signup')}>Issue Request</span>
                    </div>

                    {/* Quick Access Demo Buttons for Web */}
                    <div className="demo-box">
                        <button className="demo-btn" onClick={() => handleAutoLogin('supervisor')} disabled={isLoading}>
                            <Ionicons name="eye-outline" size={16} color={COLOR.gold} /> Supervisor
                        </button>
                        <button className="demo-btn" onClick={() => handleAutoLogin('merchandiser')} disabled={isLoading}>
                            <Ionicons name="briefcase-outline" size={16} color="#38bdf8" /> Merchandiser
                        </button>
                    </div>

                </div>
            </div>

        </div>
    );
}
