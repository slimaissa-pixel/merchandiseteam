import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { DARK_COLORS, LIGHT_COLORS } from '@/constants/appColors';
import { useTheme } from '@/context/ThemeContext';
import ElectricBorder from '@/components/ElectricBorder';
import {
    Activity,
    ArrowRight as ArrowRightWeb,
    BarChart3 as BarChart3Web,
    Command,
    Cpu,
    Globe2,
    Lock,
    MapPin,
    Shield as ShieldWeb,
    Sparkles,
    Users as UsersWeb,
} from 'lucide-react';

/* ══════════════════════════════════════════
   WEB — "Aurum" theme constants
   Premium Enterprise Landing Page
══════════════════════════════════════════ */
const COLOR_CONST = {
    bg: '#09090b',
    gold: '#d4a84b'
};

const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=DM+Serif+Display:ital@0;1&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body { -webkit-font-smoothing: antialiased; background-color: ${COLOR_CONST.bg}; }
    body::-webkit-scrollbar { display: none; }
    body { -ms-overflow-style: none; scrollbar-width: none; }

    .gold-text {
        background: linear-gradient(120deg, #d4a84b 0%, #f5d98c 40%, #d4a84b 70%, #b08c3c 100%);
        background-size: 200% auto;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        animation: goldShift 5s linear infinite;
    }
    @keyframes goldShift { to { background-position: 200% center; } }

    .reveal { animation: revealUp 0.9s cubic-bezier(0.16,1,0.3,1) both; }
    @keyframes revealUp {
        from { opacity: 0; transform: translateY(32px); }
        to   { opacity: 1; transform: translateY(0);    }
    }

    .float { animation: floatY 6s ease-in-out infinite; }
    @keyframes floatY { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-14px);} }

    .feat-card { transition: transform 0.4s cubic-bezier(0.16,1,0.3,1), border-color 0.4s ease; }
    .feat-card:hover { transform: translateY(-8px); border-color: rgba(212,168,75,0.3); }

    .icon-wrap { transition: transform 0.5s cubic-bezier(0.16,1,0.3,1); }
    .feat-card:hover .icon-wrap { transform: scale(1.12) rotate(-4deg); }

    .nav-link {
        padding: 8px 20px; font-size: 13px; font-weight: 600;
        color: rgba(255,255,255,0.45); border-radius: 10px; cursor: pointer;
        border: none; background: transparent; transition: color 0.2s, background 0.2s;
        font-family: inherit;
    }
    .nav-link:hover { color: #fff; background: rgba(255,255,255,0.06); }

    .cta-btn {
        position: relative; overflow: hidden; display: inline-flex; align-items: center; gap: 10px;
        padding: 16px 36px; border-radius: 18px; font-weight: 900; font-size: 16px;
        cursor: pointer; border: none; transition: transform 0.25s ease, box-shadow 0.25s ease;
        font-family: inherit;
    }
    .cta-btn:active { transform: scale(0.95) !important; }
    .cta-btn-primary {
        background: linear-gradient(135deg, #d4a84b 0%, #f5d98c 50%, #d4a84b 100%);
        background-size: 200% auto; color: #000;
        box-shadow: 0 12px 40px rgba(212,168,75,0.4); animation: goldShift 4s linear infinite;
    }
    .cta-btn-primary:hover { transform: scale(1.04); box-shadow: 0 20px 50px rgba(212,168,75,0.5); }
    
    .footer-link { color: rgba(255,255,255,0.25); font-size: 13px; font-weight: 500; text-decoration: none; transition: color 0.2s; }
    .footer-link:hover { color: #d4a84b; }

    .social-btn {
        width: 36px; height: 36px; border-radius: 10px; background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.08); display: flex; align-items: center; justify-content: center;
        cursor: pointer; transition: background 0.2s, border 0.2s;
    }
    .social-btn:hover { background: rgba(212,168,75,0.1); border-color: rgba(212,168,75,0.3); }

    .profile-img { width: 100%; height: 100%; object-fit: cover; filter: grayscale(100%) contrast(1.1); transition: filter 0.5s ease; }
    .founder-card:hover .profile-img { filter: grayscale(0%) contrast(1.05); }
`;

function GoldDivider() {
    return (
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, #d4a84b 40%, transparent)' }} />
    );
}

function SectionEyebrow({ children, color }: { children: string, color: string }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ height: 1, width: 40, background: color }} />
            <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.35em', textTransform: 'uppercase', color: color }}>
                {children}
            </span>
        </div>
    );
}

const WEB_FEATURES = [
    { icon: Activity, title: 'Real-Time Telemetry', desc: 'Continuous data synchronization ensures executives see reality as it happens, not hours later.' },
    { icon: MapPin, title: 'Spatial Intelligence', desc: 'Dynamic geographic routing and territory mapping optimized through advanced pathfinding algorithms.' },
    { icon: UsersWeb, title: 'Hierarchy Sync', desc: 'Seamless orchestration between field agents, regional supervisors, and head-office command.' },
    { icon: Cpu, title: 'Algorithmic QA', desc: 'Automated verification of shelf presence, merchandising compliance, and stock thresholds.' },
    { icon: Globe2, title: 'Global Backbone', desc: 'Built on edge-distributed cloud infrastructure ensuring zero-latency operations worldwide.' },
    { icon: Lock, title: 'Fortified Security', desc: 'Enterprise-grade payload encryption protecting highly sensitive commercial intelligence.' },
];

export default function AboutPageWeb() {
    const router = useRouter();
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';
    const COLOR = isDark ? DARK_COLORS : LIGHT_COLORS;
    const [scrollY, setScrollY] = useState(0);

    useEffect(() => {
        const fn = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', fn, { passive: true });
        return () => window.removeEventListener('scroll', fn);
    }, []);

    const navPinned = scrollY > 30;

    const S = {
        page: { fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif", backgroundColor: COLOR.bg, color: isDark ? COLOR.white : '#0f172a', overflowX: 'hidden' as const, minHeight: '100vh' } as any,
        navWrap: { position: 'fixed' as const, top: 0, left: 0, right: 0, zIndex: 100, padding: navPinned ? '16px 24px' : '24px', transition: 'padding 0.6s ease' },
        navInner: { maxWidth: 1200, margin: '0 auto' },
        navBox: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', borderRadius: 24, backgroundColor: isDark ? 'rgba(20,20,25,0.65)' : 'rgba(255,255,255,0.75)', backdropFilter: 'blur(30px) saturate(200%)', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', borderWidth: 1, boxShadow: isDark ? '0 16px 40px rgba(0,0,0,0.4)' : '0 8px 30px rgba(0,0,0,0.08)', transition: 'all 0.6s cubic-bezier(0.16,1,0.3,1)' },
        logo: { display: 'flex', alignItems: 'center', gap: 12 },
        logoBadge: { width: 44, height: 44, borderRadius: 14, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px rgba(212,168,75,0.4)', background: COLOR.bg },
        logoText: { fontWeight: 900, fontSize: 22, letterSpacing: '-0.04em' },
        navLinks: { display: 'flex', gap: 2, alignItems: 'center' },
        navActions: { display: 'flex', alignItems: 'center', gap: 12 },
        navSignIn: { background: 'none', border: 'none', color: COLOR.textMuted, fontWeight: 700, fontSize: 13, cursor: 'pointer', padding: '8px 16px', fontFamily: 'inherit', transition: 'color 0.2s' },

        heroSection: { position: 'relative' as const, minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', paddingTop: 120 },
        heroBg: { position: 'absolute' as const, inset: 0 },
        heroGrid: { position: 'absolute' as const, inset: 0, backgroundImage: isDark ? 'linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px), linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)' : 'linear-gradient(rgba(0,0,0,0.04) 1px,transparent 1px), linear-gradient(90deg,rgba(0,0,0,0.04) 1px,transparent 1px)', backgroundSize: '60px 60px' },
        heroFade: { position: 'absolute' as const, bottom: 0, left: 0, right: 0, height: 200, background: `linear-gradient(to top, ${COLOR.bg}, transparent)` },
        heroContent: { position: 'relative' as const, zIndex: 10, maxWidth: 1000, margin: '0 auto', width: '100%' },

        badge: { display: 'inline-flex', alignItems: 'center', gap: 10, padding: '8px 20px', borderRadius: 100, border: '1px solid rgba(212,168,75,0.3)', backgroundColor: 'rgba(212,168,75,0.08)', fontSize: 11, fontWeight: 900, letterSpacing: '0.25em', textTransform: 'uppercase' as const, color: '#fcd98e' },
        heroH1: { fontWeight: 900, fontSize: 'clamp(3.5rem, 6vw, 5.5rem)', lineHeight: 0.95, letterSpacing: '-0.04em', margin: '24px 0', textAlign: 'center' as const },
        heroItalic: { fontFamily: "'DM Serif Display', Georgia, serif", fontStyle: 'italic', fontWeight: 700 },
        heroP: { color: COLOR.textMuted, fontSize: 20, lineHeight: 1.7, fontWeight: 300, textAlign: 'center' as const, padding: '0 20px' },

        missionSection: { padding: '120px 40px', maxWidth: 1200, margin: '0 auto' },
        missionCard: { padding: '60px 80px', borderRadius: 32, background: 'linear-gradient(145deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))', border: '1px solid rgba(255,255,255,0.08)', position: 'relative' as const, overflow: 'hidden' },

        featSection: { padding: '80px 40px 160px', maxWidth: 1400, margin: '0 auto' },
        featureGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 24, marginTop: 60 },
        featCard: { padding: '40px', borderRadius: 28, background: 'linear-gradient(145deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))', border: '1px solid rgba(255,255,255,0.05)', cursor: 'default' },

        footerWrap: { padding: '40px 20px', background: COLOR.bg },
        footer: { maxWidth: 1400, margin: '0 auto', backgroundColor: 'rgba(20,20,25,0.6)', backdropFilter: 'blur(30px) saturate(180%)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 40, padding: '80px 40px 40px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' },
        footerGrid: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: 60, marginBottom: 64 },
        footerColTitle: { fontSize: 9, fontWeight: 900, letterSpacing: '0.35em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.35)', marginBottom: 24 },
        footerLinks: { display: 'flex', flexDirection: 'column' as const, gap: 14 },
    };

    return (
        <div style={S.page}>
            <style dangerouslySetInnerHTML={{ __html: CSS }} />

            {/* NAV */}
            <nav style={S.navWrap}>
                <div style={S.navInner}>
                    <div style={S.navBox}>
                        <div style={{ ...S.logo, cursor: 'pointer' }} onClick={() => router.push('/')}>
                            <div style={S.logoBadge}>
                                <img src={require('@/assets/images/index.png')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Logo" />
                            </div>
                            <span style={S.logoText}>Field<span className="gold-text">Force</span></span>
                        </div>
                        <div style={S.navLinks}>
                            <button className="nav-link" onClick={() => router.push('/')}>Home</button>
                            <button className="nav-link" onClick={() => router.push('/docs')}>Platform</button>
                            <button className="nav-link" onClick={() => window.scrollTo(0, 0)} style={{ color: '#fff' }}>Our Story</button>
                        </div>
                        <div style={S.navActions}>
                            <button style={S.navSignIn} onClick={toggleTheme}>
                                {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
                            </button>
                            <button style={S.navSignIn} onClick={() => router.push('/login')}>Sign In</button>
                            <button className="cta-btn cta-btn-primary" style={{ padding: '10px 28px', fontSize: 13, borderRadius: 14 }} onClick={() => router.push('/login')}>
                                Dashboard <ArrowRightWeb size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* HERO */}
            <section style={S.heroSection}>
                <div style={S.heroBg}>
                    <div style={{ position: 'absolute', top: '-10%', left: '20%', width: '60%', height: '80%', borderRadius: '50%', backgroundColor: 'rgba(212,168,75,0.08)', filter: 'blur(150px)' }} />
                    <div style={S.heroGrid} />
                    <div style={S.heroFade} />
                </div>
                <div style={S.heroContent}>
                    <div className="reveal" style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                        <div style={S.badge}><Sparkles size={14} color={COLOR.gold} /> The Architectural Vision</div>
                    </div>
                    <h1 className="reveal" style={{ ...S.heroH1, animationDelay: '0.1s' }}>
                        Designing the future of <br />
                        <span className="gold-text" style={S.heroItalic}>Field Intelligence.</span>
                    </h1>
                    <p className="reveal" style={{ ...S.heroP, animationDelay: '0.2s' }}>
                        We didn&apos;t just build another tracking tool. We engineered a holistic
                        command architecture meant to give global enterprises complete, beautiful,
                        and absolute clarity over their physical operations.
                    </p>
                </div>
            </section>

            {/* MISSION */}
            <section style={S.missionSection}>
                <div className="reveal mission-card" style={{ ...S.missionCard, animationDelay: '0.3s' }}>
                    <div style={{ position: 'absolute', top: 0, right: 0, padding: 40, opacity: 0.1 }}>
                        <Command size={250} />
                    </div>
                    <SectionEyebrow color={COLOR.gold}>The Core Mission</SectionEyebrow>
                    <p style={{ color: COLOR.white, fontSize: 32, lineHeight: 1.5, fontWeight: 500, marginTop: 40, maxWidth: 800 }}>
                        &quot;To transform chaotic, disconnected remote activity into a <span className="gold-text">seamlessly synchronized</span> ballet of data and action, empowering field teams and commanders alike.&quot;
                    </p>
                </div>
            </section>

            <GoldDivider />

            {/* CAPABILITIES / PRINCIPLES */}
            <section style={S.featSection}>
                <div className="reveal">
                    <SectionEyebrow color={COLOR.gold}>Engineering Principles</SectionEyebrow>
                </div>
                <div style={S.featureGrid}>
                    {WEB_FEATURES.map((f, i) => (
                        <div key={i} className="feat-card reveal" style={{ ...S.featCard, animationDelay: `${0.1 * i}s` }}>
                            <div className="icon-wrap" style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(212,168,75,0.1)', border: '1px solid rgba(212,168,75,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                                <f.icon size={22} color={COLOR.gold} strokeWidth={2} />
                            </div>
                            <h3 style={{ fontWeight: 800, fontSize: 22, letterSpacing: '-0.02em', marginBottom: 16 }}>{f.title}</h3>
                            <p style={{ color: COLOR.textMuted, lineHeight: 1.7, fontWeight: 400, fontSize: 16 }}>{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            <GoldDivider />

            {/* FOUNDERS */}
            <section id="founders" style={{ padding: '160px 40px', maxWidth: 1400, margin: '0 auto', textAlign: 'center' as const }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
                    <div style={S.badge}><Sparkles size={14} color={COLOR.gold} /> The Visionaries <Sparkles size={14} color={COLOR.gold} /></div>
                </div>
                <h2 className="reveal" style={{ fontWeight: 900, fontSize: 'clamp(3rem, 5vw, 5rem)', letterSpacing: '-0.04em', lineHeight: 1, margin: '0 0 80px' }}>
                    Engineered by <span className="gold-text" style={S.heroItalic}>Founders</span><br />
                    who understand the field.
                </h2>

                <div style={{ display: 'flex', justifyContent: 'center', gap: 60, flexWrap: 'wrap' as const }}>
                    {[
                        { name: 'Aymen', role: 'Co-Founder & CEO', image: require('@/assets/images/founders/Aymen.jpeg') },
                        { name: 'Slim', role: 'Co-Founder & CTO', image: require('@/assets/images/founders/Slim.jpeg') }
                    ].map((founder, i) => (
                        <ElectricBorder key={i} color={COLOR.gold} borderRadius={40} chaos={0.1}>
                        <div className="founder-card reveal" style={{ animationDelay: `${0.2 * i}s`, position: 'relative', width: 340, borderRadius: 40, padding: 12, background: 'linear-gradient(145deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 30px 60px rgba(0,0,0,0.5)' }}>
                            <div style={{ height: 420, borderRadius: 32, overflow: 'hidden', position: 'relative' }}>
                                <img src={founder.image} className="profile-img" alt={founder.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,10,12,0.9) 0%, rgba(10,10,12,0.4) 40%, transparent 100%)' }} />
                                <div style={{ position: 'absolute', bottom: 32, left: 32, right: 32, textAlign: 'left' as const }}>
                                    <h3 style={{ fontSize: 32, fontWeight: 900, color: COLOR.white, marginBottom: 6, letterSpacing: '-0.02em' }}>{founder.name}</h3>
                                    <p style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.25em', textTransform: 'uppercase' as const, color: COLOR.gold }}>{founder.role}</p>
                                </div>
                            </div>
                        </div>
                        </ElectricBorder>
                    ))}
                </div>
            </section>

            {/* FOOTER */}
            <div style={S.footerWrap}>
                <footer style={S.footer}>
                    <div style={S.footerGrid}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ ...S.logoBadge, width: 34, height: 34 }}>
                                    <img src={require('@/assets/images/index.png')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Logo" />
                                </div>
                                <span style={{ fontWeight: 900, fontSize: 18, letterSpacing: '-0.03em' }}>FieldForce</span>
                            </div>
                            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, lineHeight: 1.75, fontWeight: 300, maxWidth: 260 }}>Architectural-grade infrastructure for elite field operations.</p>
                            <div style={{ display: 'flex', gap: 10 }}>
                                {[Globe2, ShieldWeb, BarChart3Web].map((Icon, i) => (
                                    <div key={i} className="social-btn"><Icon size={15} color="rgba(255,255,255,0.3)" /></div>
                                ))}
                            </div>
                        </div>
                        {[{ title: 'Platform',  links: ['Dashboard', 'GPS Engine', 'Reports', 'QA Suite'] },
                          { title: 'Services',  links: ['Enterprise', 'Security', 'API Access', 'Consulting'] },
                          { title: 'Resources', links: ['Docs', 'Whitepapers', 'Status', 'Blog'] },
                          { title: 'Company',   links: ['About', 'Founders', 'Privacy', 'Legal'] }].map(col => (
                            <div key={col.title}>
                                <p style={S.footerColTitle}>{col.title}</p>
                                <div style={S.footerLinks}>
                                    {col.links.map(link => (
                                        <button key={link} className="footer-link" style={{ background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer' }} onClick={() => {}}>
                                            {link}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </footer>
            </div>
        </div>
    );
}
