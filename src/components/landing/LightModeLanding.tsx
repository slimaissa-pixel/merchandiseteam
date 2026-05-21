import React from "react";
import { useRouter } from "expo-router";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Globe2,
  Layers,
  LineChart,
  Moon,
  Shield,
  Target,
  Users,
  Zap,
} from "lucide-react";
import { LIGHT_COLORS as COLOR } from "@/constants/appColors";
import {
  AnimatedNumber,
  SectionEyebrow,
  CustomMarqueeLogos,
  ThemeBadge,
  getWebAsset,
  AccentDivider ,
} from "./SharedLandingComps";
import ElectricBorder from "../ElectricBorder";
import { useEffect, useRef } from "react";

interface LightModeLandingProps {
  demoEmail: string;
  setDemoEmail: (email: string) => void;
  isSubmitting: boolean;
  handleDemoRequest: () => Promise<void>;
  navPinned: boolean;
  toggleTheme: () => void;
  scrollTo: (id: string) => void;
  openAuthModal: (view?: "login" | "signup" | "forgot") => void;
}

const CSS = `
    .accent-text {
        background: linear-gradient(120deg, #2563eb 0%, #60a5fa 40%, #2563eb 70%, #1e40af 100%);
        background-size: 200% auto;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        animation: accentShift 5s linear infinite;
    }
    @keyframes accentShift { to { background-position: 200% center; } }

    .reveal { animation: revealUp 0.9s cubic-bezier(0.16,1,0.3,1) both; }
    @keyframes revealUp {
        from { opacity: 0; transform: translateY(32px); }
        to   { opacity: 1; transform: translateY(0);    }
    }

    .float { animation: floatY 6s ease-in-out infinite; }
    @keyframes floatY { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-14px);} }

    .nav-link {
        padding: 8px 20px; font-size: 13px; font-weight: 600;
        color: #64748b; border-radius: 10px; cursor: pointer;
        border: none; background: transparent; transition: color 0.2s, background 0.2s;
        font-family: inherit;
    }
    .nav-link:hover { color: #0f172a; background: rgba(15, 23, 42, 0.05); }

    .cta-btn {
        position: relative; overflow: hidden; display: inline-flex; align-items: center; gap: 10px;
        padding: 16px 40px; border-radius: 100px; font-weight: 900; font-size: 16px;
        cursor: pointer; border: none; transition: transform 0.25s ease, box-shadow 0.25s ease;
        font-family: inherit;
    }
    .cta-btn:active { transform: scale(0.95) !important; }
    .cta-btn-primary {
        background: linear-gradient(135deg, #2563eb 0%, #60a5fa 50%, #2563eb 100%);
        background-size: 200% auto; color: #fff;
        box-shadow: 0 12px 30px rgba(37, 99, 235, 0.25); animation: accentShift 4s linear infinite;
    }
    .cta-btn-primary:hover { transform: scale(1.04); box-shadow: 0 20px 40px rgba(37, 99, 235, 0.35); }
    .cta-btn-secondary:hover { background: rgba(255,255,255,0.10); }
    
    .marquee-track { display: flex; width: max-content; animation: marquee 35s linear infinite; }
    .marquee-track:hover { animation-play-state: paused; }
    @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }

    .sr { opacity: 0; transition: opacity 0.9s cubic-bezier(0.16,1,0.3,1), transform 0.9s cubic-bezier(0.16,1,0.3,1); }
    .sr-up    { transform: translateY(48px); }
    .sr-left  { transform: translateX(-48px); }
    .sr.visible { opacity: 1 !important; transform: none !important; }

    .scroll-grid {
        display: flex; gap: 24px; overflow-x: auto; padding: 40px 10vw 80px;
        scrollbar-width: none; -ms-overflow-style: none; scroll-behavior: smooth;
        width: 100vw; margin-left: calc(-50vw + 50%);
    }
    .scroll-grid::-webkit-scrollbar { display: none; }
    .scroll-grid > div { flex: 0 0 380px; }

    .scroll-nav-btn {
        width: 48px; height: 48px; border-radius: 50%; background: #fff;
        border: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: center;
        cursor: pointer; transition: all 0.3s; color: #0f172a;
        box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }
    .scroll-nav-btn:hover { background: #f8fafc; border-color: #2563eb; color: #2563eb; transform: scale(1.1); }
    .scroll-nav-btn:disabled { opacity: 0.3; cursor: not-allowed; }

    .grid-bg {
        background-color: #f8fafc;
        background-image: linear-gradient(rgba(15, 23, 42, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.04) 1px, transparent 1px);
        background-size: 60px 60px; background-position: center center; position: relative; overflow: hidden;
    }
    .grid-bg::after {
        content: ""; position: absolute; inset: 0;
        background: radial-gradient(circle at center, transparent 0%, #f8fafc 90%);
        pointer-events: none;
    }

    .smart-card {
        background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(20px) saturate(160%);
        border: 1px solid rgba(15, 23, 42, 0.08); border-radius: 20px;
        padding: 32px; display: flex; flex-direction: column; align-items: flex-start;
        text-align: left; transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        height: 100%; position: relative; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
        cursor: pointer; color: #0f172a; overflow: hidden;
    }
    .smart-card:hover {
        background: #fff; border-color: rgba(37, 99, 235, 0.3);
        transform: translateY(-6px);
        box-shadow: 0 20px 40px rgba(15, 23, 42, 0.08);
    }
    .smart-card:hover .icon-bounce { transform: scale(1.1) rotate(4deg); }
    .smart-card h3, .smart-card p { transition: all 0.3s ease; }
    .smart-card:hover h3 { color: #2563eb; }

    .ghost-input {
        background: #f1f5f9; border: 1px solid #e2e8f0; color: #0f172a;
        padding: 16px 24px; border-radius: 18px; font-family: inherit; font-size: 16px;
        flex: 1; outline: none; transition: border-color 0.2s, box-shadow 0.2s;
    }
    .ghost-input:focus { border-color: #2563eb; box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1); background: #fff; }
    .ghost-input::placeholder { color: #94a3b8; }

    .gold-text {
        background: linear-gradient(120deg, #d4a84b 0%, #f5d98c 40%, #d4a84b 70%, #b08c3c 100%);
        background-size: 200% auto;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        animation: accentShift 5s linear infinite;
    }

    .progress-bar {
        height: 100%;
        width: 0;
        border-radius: 3px;
        transition: width 1.5s cubic-bezier(0.16, 1, 0.3, 1);
        width: var(--target-width);
    }

    .footer-link { color: #ffffff; font-size: 13px; font-weight: 500; text-decoration: none; transition: color 0.2s; border: none; background: none; text-align: left; padding: 0; }
    .footer-link:hover { color: #f5d98c; }
    .social-btn { width: 36px; height: 36px; border-radius: 10px; background: #f1f5f9; border: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: center; }

    /* ═══════════════════════════════════════
       SECTION BACKGROUNDS — each unique
    ═══════════════════════════════════════ */

    /* HERO — luminous radial blue halo on pearl white */
    .hero-bg {
        background-color: #f0f4ff;
        background-image:
            radial-gradient(ellipse 80% 60% at 50% -10%, rgba(37,99,235,0.14) 0%, transparent 70%),
            radial-gradient(ellipse 50% 40% at 85% 60%, rgba(96,165,250,0.10) 0%, transparent 60%),
            linear-gradient(180deg, #e8eeff 0%, #f8fafc 60%, #f0f4ff 100%);
    }

    /* LOGOS/MARQUEE — crisp diagonal pinstripe wall */
    .logos-bg {
        background-color: #ffffff;
        background-image:
            repeating-linear-gradient(
                -45deg,
                transparent,
                transparent 18px,
                rgba(37,99,235,0.04) 18px,
                rgba(37,99,235,0.04) 19px
            ),
            linear-gradient(180deg, #fff 0%, #f8faff 100%);
        border-top: 1px solid rgba(37,99,235,0.07);
        border-bottom: 1px solid rgba(37,99,235,0.07);
    }

    /* CAPABILITIES — warm linen with floating dot grid */
    .capabilities-bg {
        background-color: #fafaf9;
        background-image:
            radial-gradient(circle, rgba(15,23,42,0.055) 1px, transparent 1px),
            linear-gradient(160deg, #fffbf0 0%, #f8fafc 50%, #f0f7ff 100%);
        background-size: 28px 28px, 100% 100%;
    }

    /* INTELLIGENCE — mesh gradient with horizontal rule lines */
    .intelligence-bg {
        background-color: #f1f5f9;
        background-image:
            repeating-linear-gradient(
                0deg,
                transparent,
                transparent 48px,
                rgba(37,99,235,0.05) 48px,
                rgba(37,99,235,0.05) 49px
            ),
            linear-gradient(135deg, #e0eaff 0%, #f1f5f9 40%, #e8fff4 100%);
        border-top: 2px solid rgba(37,99,235,0.08);
    }

    /* DEMO CTA — bold diagonal banner stripes, high contrast */
    .demo-bg {
        background-color: #1e3a8a;
        background-image:
            repeating-linear-gradient(
                60deg,
                transparent,
                transparent 40px,
                rgba(255,255,255,0.03) 40px,
                rgba(255,255,255,0.03) 80px
            ),
            linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 40%, #2563eb 70%, #1e40af 100%);
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.15);
    }
    .demo-bg * { color: #fff !important; }
    .demo-bg .ghost-input {
        background: rgba(255,255,255,0.12) !important;
        border-color: rgba(255,255,255,0.25) !important;
        color: #fff !important;
    }
    .demo-bg .ghost-input::placeholder { color: rgba(255,255,255,0.55) !important; }
    .demo-bg .ghost-input:focus { border-color: rgba(255,255,255,0.6) !important; box-shadow: 0 0 0 4px rgba(255,255,255,0.12) !important; }
    .demo-bg .cta-btn-primary { background: #fff !important; color: #1e3a8a !important; box-shadow: 0 12px 30px rgba(0,0,0,0.2) !important; }
    .demo-bg .cta-btn-primary:hover { box-shadow: 0 20px 40px rgba(0,0,0,0.3) !important; }

    /* FOUNDERS — cross-hatch on soft ivory */
    .founders-bg {
        background-color: #fdfcfb;
        background-image:
            repeating-linear-gradient(
                0deg,
                transparent,
                transparent 39px,
                rgba(15,23,42,0.04) 39px,
                rgba(15,23,42,0.04) 40px
            ),
            repeating-linear-gradient(
                90deg,
                transparent,
                transparent 39px,
                rgba(15,23,42,0.04) 39px,
                rgba(15,23,42,0.04) 40px
            ),
            linear-gradient(160deg, #fff9f0 0%, #fdfcfb 50%, #f0f4ff 100%);
        border-top: 2px solid rgba(37,99,235,0.07);
    }

    /* FOOTER — Luxury Professional Wall */
    .footer-wall .footer-link { color: rgba(255,255,255,0.6); }
    .footer-wall .footer-link:hover { color: #d4a84b; }
    .footer-wall .social-btn { background: rgba(255, 255, 255, 0.03); border-color: rgba(255,255,255,0.06); transition: all 0.3s; }
    .footer-wall .social-btn:hover { background: rgba(212,168,75,0.1); border-color: rgba(212,168,75,0.3); transform: translateY(-2px); }
`;


export default function LightModeLanding({
  demoEmail,
  setDemoEmail,
  isSubmitting,
  handleDemoRequest,
  navPinned,
  toggleTheme,
  scrollTo,
  openAuthModal,
}: LightModeLandingProps) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (scrollRef.current) {
      const amt = dir === "left" ? -400 : 400;
      scrollRef.current.scrollBy({ left: amt, behavior: "smooth" });
    }
  };

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      typeof IntersectionObserver === "undefined"
    )
      return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            const delay = parseFloat(el.dataset.delay || "0");
            setTimeout(() => el.classList.add("visible"), delay * 1000);
            obs.unobserve(el);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );
    document.querySelectorAll(".sr").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      typeof IntersectionObserver === "undefined"
    )
      return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => entry.target.classList.add("animated"), 200);
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 },
    );
    document.querySelectorAll(".progress-bar").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const FEATURES = [
        { icon: Target, label: 'Precision GPS', copy: 'Sub-meter geofencing with intelligent battery management, keeping every agent perfectly connected at all times.', ring: COLOR.primary, glow: 'rgba(37,99,235,0.08)' },
        { icon: BarChart3, label: 'Command Analytics', copy: 'Holistic real-time dashboards delivering KPIs, trend forecasts, and executive-level performance summaries.', ring: COLOR.violet, glow: 'rgba(139,92,246,0.12)' },
        { icon: Users, label: 'Team Orchestration', copy: 'Role-stratified access hierarchies with real-time synchronisation across every organisational tier.', ring: COLOR.sky, glow: 'rgba(56,189,248,0.12)' },
        { icon: Zap, label: 'Instant Reporting', copy: 'Timestamped proof-of-presence with photo logs, automated notification chains, and priority escalation protocols.', ring: COLOR.rose, glow: 'rgba(251,113,133,0.12)' },
        { icon: Shield, label: 'Enterprise Security', copy: 'Military-grade AES-256 encryption, ISO-27001 compliance, and private-cloud deployment for sensitive operations.', ring: COLOR.emerald, glow: 'rgba(52,211,153,0.12)' },
        { icon: Layers, label: 'Modular Platform', copy: 'Composable microservice modules that integrate seamlessly into your existing enterprise software ecosystem.', ring: '#fb923c', glow: 'rgba(251,146,60,0.12)' },
  ];

  const METRICS = [
    { value: "120+", label: "Active Staff" },
    { value: "99.9", label: "SLA Uptime" },
    { value: "5.2K+", label: "Daily Reports" },
    { value: "18K+", label: "Data Points" },
  ];

  const PROGRESS = [
    { label: "Shelf Coverage", value: 94, color: COLOR.primary },
    { label: "Team Presence", value: 78, color: COLOR.violet },
    { label: "Report Accuracy", value: 99, color: COLOR.emerald },
    { label: "Route Efficiency", value: 87, color: COLOR.sky },
  ];

  const S = {
        page: { fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif", backgroundColor: COLOR.bg, color: COLOR.text, overflowX: 'hidden' as const, minHeight: '100vh' } as any,
        navWrap: { position: 'fixed' as const, top: 0, left: 0, right: 0, zIndex: 350, padding: navPinned ? '12px 24px' : '24px 24px', transition: 'all 0.6s cubic-bezier(0.16,1,0.3,1)', display: 'flex', justifyContent: 'center' },
        navInner: { width: '100%', maxWidth: navPinned ? 1090 : 1300, transition: 'all 0.6s cubic-bezier(0.16,1,0.3,1)' },
        navBox: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: navPinned ? '16px 0px 16px 20px' : '16px 32px', borderRadius: 100, backgroundColor: navPinned ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.1)', backdropFilter: 'blur(30px) saturate(200%)', border: '1px solid rgba(15,23,42,0.1)', boxShadow: navPinned ? '0 20px 40px rgba(15,23,42,0.1)' : 'none', transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)' },
        logo: { display: 'flex', alignItems: 'center', gap: 12 },
        logoBadge: { width: 36, height: 36, borderRadius: 10, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(37,99,235,0.2)', backgroundColor: COLOR.white },
        logoText: { fontWeight: 900, fontSize: 18, letterSpacing: '-0.04em', color: COLOR.primary },
        navLinks: { display: 'flex', gap: navPinned ? 6 : 6, alignItems: 'center', transition: 'gap 0.6s ease' },
        navActions: { display: 'flex', alignItems: 'center', gap: 12 },
        navSignIn: { backgroundColor: 'transparent', border: 'none', color: COLOR.textSub, fontWeight: 700, fontSize: 13, cursor: 'pointer', padding: '8px 16px', fontFamily: 'inherit', transition: 'color 0.2s' },
        heroSection: { position: 'relative' as const, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
        heroBg: { position: 'absolute' as const, inset: 0 },
        heroGrid: { position: 'absolute' as const, inset: 0, backgroundImage: 'linear-gradient(rgba(15,23,42,0.03) 1px,transparent 1px), linear-gradient(90deg,rgba(15,23,42,0.03) 1px,transparent 1px)', backgroundSize: '60px 60px' },
        heroFade: { position: 'absolute' as const, bottom: 0, left: 0, right: 0, height: 200, backgroundColor: `linear-gradient(to top, ${COLOR.bg}, transparent)` as any },
        heroContent: { position: 'relative' as const, zIndex: 10, maxWidth: 1400, margin: '0 auto', padding: '120px 40px 80px', width: '100%' },
        heroCopy: { maxWidth: 900, margin: '0 auto', textAlign: 'center' as const, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 24 },
        heroH1: { fontWeight: 900, fontSize: 'clamp(3.5rem,7vw,7rem)', lineHeight: 0.95, letterSpacing: '-0.04em', color:COLOR.bgSecondary  , margin: 0 },
        heroItalic: { fontFamily: "'DM Serif Display', Georgia, serif", fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(4.5rem,6vw,8.5rem)', display: 'block', margin: '0px 0' },
        heroP: { color: COLOR.textMuted, fontSize: 18, lineHeight: 1.7, fontWeight: 400, maxWidth: 640 },
        heroCtas: { display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' as const, marginTop: 12 },
        metricsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginTop: 64, maxWidth: 880, margin: '64px auto 0' },
        metricCard: { padding: '24px 20px', borderRadius: 20, backgroundColor: COLOR.white, border: '1px solid #e2e8f0', shadow: '0 4px 12px rgba(0,0,0,0.03)', textAlign: 'center' as const, transition: 'transform 0.3s ease, box-shadow 0.3s ease' } as any,
        featSection: { padding: '160px 0', maxWidth: '100%', margin: '0 auto', overflow: 'hidden' },
        featH2: { fontWeight: 900, fontSize: '4rem', letterSpacing: '-0.04em', lineHeight: 0.95, color: COLOR.surface },
        featHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 60, gap: 40, flexWrap: 'wrap' as const },
        featureGrid: { display: 'flex', flexDirection: 'column' as const, gap: 24 },
        intelSection: { padding: '160px 40px', backgroundColor: COLOR.bgSecondary, position: 'relative' as const, overflow: 'hidden' },
        intelInner: { maxWidth: 1400, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 100, flexWrap: 'wrap' as const },
        deviceWrap: { backgroundColor: 'linear-gradient(135deg, rgba(37,99,235,0.2), rgba(255,255,255,1), rgba(124,58,237,0.1))' as any, padding: 1, borderRadius: 40, boxShadow: '0 30px 60px rgba(15,23,42,0.1)' },
        deviceInner: { background: COLOR.white, borderRadius: 39, padding: 36, minWidth: 360, display: 'flex', flexDirection: 'column' as const, gap: 20, border: '1px solid #e2e8f0' },
        ctaSection: { padding: '180px 40px', position: 'relative' as const, overflow: 'hidden', textAlign: 'center' as const },
        ctaH2: { fontWeight: 900, fontSize: 'clamp(3rem, 6vw, 6.5rem)', letterSpacing: '-0.04em', lineHeight: 0.92, color: COLOR.primary },
        ctaInputRow: { display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' as const, maxWidth: 560, margin: '0 auto' },
        footerWrap: { padding: '40px 20px', background: COLOR.bgSecondary },
        footer: { maxWidth: 1400, margin: '0 auto', borderRadius: 40, padding: '80px 40px 40px', overflow: 'hidden' },
        footerGrid: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: 60, marginBottom: 64 },
        footerColTitle: { fontSize: 9, fontWeight: 900, letterSpacing: '0.35em', textTransform: 'uppercase' as const, color: '#000000', marginBottom: 24 },
        footerLinks: { display: 'flex', flexDirection: 'column' as const, gap: 14 },
        footerBottom: { paddingTop: 32, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
        footerCopy: { fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: COLOR.textMuted },
  };

  return (
    <div style={S.page}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <nav style={S.navWrap}>
        <div style={S.navInner}>
          <div style={S.navBox}>
            <div style={{ ...S.logo, cursor: 'pointer' }} onClick={() => scrollTo('hero')}>
              <div style={S.logoBadge}>
               <img src={getWebAsset(require('@/assets/images/index.png'))} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Logo" />
              </div>
              <span style={S.logoText}>Field<span className="accent-text">Force</span></span>
            </div>
            <div style={S.navLinks}>
              {['Logos', 'Capabilities', 'Intelligence', 'Demo', 'Owners'].map(n => (
                <button key={n} className="nav-link" onClick={() => scrollTo(n === 'Owners' ? 'founders' : n.toLowerCase())}>{n}</button>
              ))}
            </div>
            <div style={S.navActions}>
              <button style={{ ...S.navSignIn, padding: '8px', display: 'flex', alignItems: 'center' }} onClick={toggleTheme} title="Switch Theme">
                <Moon size={20} />
              </button>
              <button style={S.navSignIn} onClick={() => openAuthModal('login')}>Sign In</button>
              <button style={S.navSignIn} onClick={() => openAuthModal('signup')}>Sign Up</button>
              <button className="cta-btn cta-btn-primary" style={{ padding: '10px 28px', fontSize: 13, borderRadius: 14 ,marginRight: navPinned ? 20 : 0 }} onClick={() => scrollTo('demo')}>Request Demo <ArrowRight size={14} /></button>
            </div>
          </div>
        </div>
      </nav>

      <section style={S.heroSection} id="light-hero" className="hero-bg">
        <div style={S.heroBg}>
          <img src={getWebAsset(require('@/assets/images/bgds/light_index.jpeg'))} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }} alt="Hero" />
          <div style={{ position: 'absolute', top: '-5%', left: '-5%', width: '55%', height: '55%', borderRadius: '50%', backgroundColor: 'rgba(37,99,235,0.08)', filter: 'blur(120px)' }} />
          <div style={{ position: 'absolute', bottom: '-5%', right: '-5%', width: '45%', height: '45%', borderRadius: '50%', backgroundColor: 'rgba(124,58,237,0.06)', filter: 'blur(100px)' }} />
          <div style={S.heroGrid} />
          <div style={S.heroFade} />
        </div>
        <div style={S.heroContent}>
          <div style={S.heroCopy}>
            <div className="reveal" style={{ animationDelay: '0.05s', marginTop: 4, marginBottom: 4 }}>
              <ThemeBadge text="Enterprise Field Intelligence" color={COLOR.primary} isDark={false} />
            </div>
            <h1 className="reveal" style={{ ...S.heroH1, animationDelay: '0.15s' }}>
              Mange Field
              <span className="accent-text" style={S.heroItalic}>Operations</span>
              With Precision.
            </h1>
            <p className="reveal" style={{ ...S.heroP, animationDelay: '0.25s' }}>Real-time merchandising coordination, GPS-grade location intelligence, and instant event synthesis powering the world&apos;s most agile field forces.</p>
            <div className="reveal" style={{ ...S.heroCtas, animationDelay: '0.35s' }}>
              <button className="cta-btn cta-btn-primary" onClick={() => openAuthModal('login')}>Launch Platform <ArrowRight size={18} /></button>
              <button className="cta-btn cta-btn-secondary" onClick={() => scrollTo('demo')} style={{ padding: '16px 36px', borderRadius: 18, fontWeight: 900, fontSize: 16, cursor: 'pointer', background: 'rgba(15,23,42,0.05)', color: '#0f172a', border: '1px solid rgba(15,23,42,0.1)' }}>Request Demo</button>
            </div>
          </div>
          <div className="reveal" style={{ ...S.metricsRow, animationDelay: '0.45s' }}>
            {METRICS.map((m, i) => (
              <div key={i} style={S.metricCard}>
                <div className="accent-text" style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-0.04em' }}><AnimatedNumber value={m.value} /></div>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.25em', textTransform: 'uppercase', color: COLOR.textMuted, marginTop: 6 }}>{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <AccentDivider isDark={false} />
      <div id="light-logos" className="logos-bg">
        <CustomMarqueeLogos isDark={false} />
      </div>
      <AccentDivider isDark={false} />

      <section
        id="light-capabilities"
        className="capabilities-bg"
        style={{ position: "relative", overflow: "hidden" }}
      >
        <div
          style={{
            position: "absolute",
            top: "10%",
            right: "-15%",
            width: "40vw",
            height: "40vw",
            borderRadius: "50%",
            backgroundColor: "rgba(37,99,235,0.04)",
            filter: "blur(120px)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
        <div style={{ ...S.featSection, paddingLeft: '10vw', paddingRight: '10vw', justifyContent: 'center', textAlign: 'center', marginBottom: 100, maxWidth: '100%' }}>
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <div className="sr sr-up">
              <SectionEyebrow color={COLOR.primary}>Core Capabilities</SectionEyebrow>
            </div>
            <h2 className="sr sr-up" style={{ ...S.featH2, marginTop: 12, fontSize: 'clamp(2.2rem, 3.5vw, 3.4rem)', lineHeight: 0.9, color: COLOR.primary, letterSpacing: '-0.02em' }} data-delay="0.1">
              Precision.
              <br />
              <span className="accent-text" style={{ ...S.heroItalic, fontSize: 'clamp(3.5rem, 5.5vw, 5rem)', margin: '0 0' }}>Coordination,</span>
              <br />
              <span style={{ opacity: 0.5 }}>Everywhere.</span>
            </h2>
            <div 
              className="sr sr-up"
              style={{ width: 60, height: 2, background: COLOR.primary, margin: '24px auto', opacity: 0.2 }} 
              data-delay="0.2"
            />
            <p className="sr sr-up" style={{ color: COLOR.textMuted, fontSize: 16, lineHeight: 1.6, fontWeight: 400, maxWidth: 500, margin: '0 auto' }} data-delay="0.3">
              Elite infrastructure designed for precision field management, 
              ensuring every operation is synchronized and visible.
            </p>
          </div>
        </div>

        <div className="sr sr-up" data-delay="0.2" style={{ position: 'relative' }}>
          {/* Side Navigation Arrows */}
          <div style={{ position: 'absolute', top: '50%', left: '4vw', transform: 'translateY(-50%)', zIndex: 10 }}>
             <button className="scroll-nav-btn" onClick={() => scroll('left')} style={{ width: 56, height: 56, background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)' }}>
                <ArrowRight size={24} style={{ transform: 'rotate(180deg)' }} />
             </button>
          </div>
          <div style={{ position: 'absolute', top: '50%', right: '4vw', transform: 'translateY(-50%)', zIndex: 10 }}>
             <button className="scroll-nav-btn" onClick={() => scroll('right')} style={{ width: 56, height: 56, background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)' }}>
                <ArrowRight size={24} />
             </button>
          </div>

          <div className="scroll-grid" ref={scrollRef}>
            {FEATURES.map((f, i) => (
              <div key={i} className="smart-card">
                <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: f.glow, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }} className="icon-bounce">
                  <f.icon size={24} color={f.ring} />
                </div>
                <h3 style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em', marginBottom: 12 }}>{f.label}</h3>
                <p style={{ color: COLOR.textMuted, lineHeight: 1.6, fontWeight: 400, fontSize: 13 }}>{f.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="light-intelligence" className="intelligence-bg" style={{ ...S.intelSection, position: "relative", overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            top: "20%",
            right: "-20%",
            width: "45vw",
            height: "45vw",
            borderRadius: "50%",
            backgroundColor: "rgba(37,99,235,0.06)",
            filter: "blur(140px)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
        <div style={S.heroGrid} />
        <div style={S.intelInner}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 40, minWidth: 320 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div className="sr sr-left"><SectionEyebrow color={COLOR.primary}>Operational Intelligence</SectionEyebrow></div>
                            <h2 className="sr sr-left" style={{ ...S.featH2, margin: 0 }} data-delay="0.1">Dynamic<br /><span className="accent-text" style={S.heroItalic}>Performance</span><br />Visibility.</h2>
                            <p className="sr sr-left" style={{ color: COLOR.textMuted, fontSize: 18, lineHeight: 1.7, fontWeight: 400, maxWidth: 420 }} data-delay="0.2">Our reporting engine synthesizes field data into board-level summaries in real-time.</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {[
                "Auto-generated visit logs with photo evidence.",
                "Real-time GPS heatmaps of team movement.",
                "Automated KPI tracking against brand targets.",
                "Instant notification of merchandising anomalies.",
              ].map((line, i) => (
                <div
                  key={i}
                  className="sr sr-left"
                  style={{ display: "flex", alignItems: "center", gap: 14 }}
                  data-delay={`${0.1 + 0.08 * i}`}
                >
                  <CheckCircle2 color={COLOR.primary} size={18} />
                  <p style={{ color: COLOR.text, fontWeight: 600, fontSize: 15 }}>{line}</p>
                </div>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
            <div className="float" style={S.deviceWrap}>
              <div style={S.deviceInner}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 24, borderBottom: '1px solid #f1f5f9' }}>
                                    <div><div style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.3em', textTransform: 'uppercase', color: COLOR.primary }}>Real-time Feed</div><div style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>Operations</div></div>
                </div>
                                <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {PROGRESS.map((p, i) => (
                    <div key={i}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                                                <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', color: COLOR.textMuted }}>{p.label}</span>
                                                <span style={{ fontSize: 11, fontWeight: 900, color: p.color }}>{p.value}%</span>
                      </div>
                                            <div style={{ height: 6, borderRadius: 3, backgroundColor: '#f1f5f9', overflow: 'hidden' }}>
                                                <div className="progress-bar" style={{ background: p.color, '--target-width': `${p.value}%` } as any} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={S.ctaSection} className="demo-bg" id="light-demo">
        <div
          style={{
            position: "absolute",
            bottom: "-20%",
            left: "-10%",
            width: "35vw",
            height: "35vw",
            borderRadius: "50%",
            backgroundColor: "rgba(37,99,235,0.05)",
            filter: "blur(120px)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
        <div style={{ position: "relative", zIndex: 10 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
            <ThemeBadge text="Enterprise Access" color="#d4a84b" isDark={true} />
          </div>
          <h3 style={S.ctaH2}>
            <p className="gold-text" style={{ ...S.heroItalic, fontSize: 'clamp(3rem, 5vw, 5rem)', marginBottom: 20 }}>
              Try Our field operations?
            </p>
          </h3>
          <div style={S.ctaInputRow}>
            <input
              type="email"
              placeholder="Enter your business email"
              className="ghost-input"
              value={demoEmail}
              onChange={(e: any) => setDemoEmail(e.target.value)}
              disabled={isSubmitting}
            />
            <button
              className="cta-btn cta-btn-primary"
              onClick={handleDemoRequest}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Sending…" : "Get Started Now"}
            </button>
          </div>
        </div>
      </section>

            <AccentDivider />
            <section id="light-founders" className="founders-bg" style={{ position: 'relative', padding: '160px 40px', textAlign: 'center' as const }}>
                <div style={{ position: 'relative', zIndex: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
                        <ThemeBadge text="The Visionaries" color={COLOR.primary} isDark={false} />
          </div>
                    <h2 className="reveal" style={{ fontWeight: 900, fontSize: '5rem', letterSpacing: '-0.04em', lineHeight: 1, margin: '0 0 80px', color: COLOR.primary }}>
                        <span className="accent-text" style={S.heroItalic}>Engineered by</span>
          </h2>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 60, flexWrap: 'wrap' as const }}>
                        {([
                            { name: 'Aymen', role: 'Co-Founder & CEO', image: require('@/assets/images/founders/Aymen.jpeg') },
                            { name: 'Slim', role: 'Co-Founder & CTO', image: require('@/assets/images/founders/Slim.jpeg') }
                        ] as const).map((founder, i) => (
                            <ElectricBorder key={i} color={COLOR.primary} borderRadius={40} chaos={0.1}>
                            <div className="reveal" style={{ animationDelay: `${0.2 * i}s`, position: 'relative', width: 340, borderRadius: 40, padding: 12, background: 'linear-gradient(145deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 30px 60px rgba(0,0,0,0.5)' }}>
                                <div style={{ height: 420, borderRadius: 32, overflow: 'hidden', position: 'relative' }}>
                                    <img src={getWebAsset(founder.image)} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'contrast(1.05) saturate(1.1) brightness(0.95)' }} alt={founder.name} />
                                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,10,12,0.9) 0%, rgba(10,10,12,0.4) 40%, transparent 100%)' }} />
                                    <div style={{ position: 'absolute', bottom: 32, left: 32, right: 32, textAlign: 'left' as const }}>
                                        <h3 style={{ fontSize: 32, fontWeight: 900, color: '#fff', marginBottom: 6, letterSpacing: '-0.02em' }}>{founder.name}</h3>
                                        <p style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.25em', textTransform: 'uppercase' as const, color: '#60a5fa' }}>{founder.role}</p>
                  </div>
                </div>
              </div>
              </ElectricBorder>
            ))}
          </div>
        </div>
      </section>

      <div style={S.footerWrap}>
        <footer style={{
          ...S.footer, 
          background: 'linear-gradient(155deg, #212c4aff 0%, #2e406dff 45%, #4d6299ff 75%, #cba866ff 100%)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -4px 30px rgba(212,168,75,0.15), 0 20px 60px rgba(0,0,0,0.5)',
          border: '1px solid rgba(255,255,255,0.05)',
          backdropFilter: 'blur(30px) saturate(180%)'
        }} className="footer-wall">
          <div style={S.footerGrid}>
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <button
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  cursor: "pointer",
                  background: "none",
                  border: "none",
                  padding: 0,
                  textAlign: "left",
                }}
                onClick={() => scrollTo("hero")}
              >
                <div style={S.logoBadge}>
                  <img
                    src={getWebAsset(require("@/assets/images/index.png"))}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                    alt="Logo"
                  />
                </div>
                <span
                  style={{
                    fontWeight: 900,
                    fontSize: 18,
                    letterSpacing: "-0.03em",
                    color: "#fff",
                  }}
                >
                  FieldForce
                </span>
              </button>
              <p
                style={{
                  color: "rgba(255,255,255,0.7)",
                  fontSize: 13,
                  lineHeight: 1.75,
                  fontWeight: 300,
                  maxWidth: 260,
                  margin: 0,
                }}
              >
                Architectural-grade infrastructure for elite field operations.
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                {[Globe2, Shield, LineChart].map((Icon, i) => (
                  <button key={i} className="social-btn" onClick={() => router.push("/not-yet")} style={{ cursor: "pointer" }}>
                    <Icon size={16} color={COLOR.primary} />
                  </button>
                ))}
              </div>
            </div>
            {[
              {
                title: "Platform",
                links: ["Dashboard", "GPS Engine", "Reports", "QA Suite"],
              },
              {
                title: "Services",
                links: ["Enterprise", "Security", "API Access", "Consulting"],
              },
              {
                title: "Resources",
                links: ["Docs", "Whitepapers", "Status", "Blog"],
              },
              {
                title: "Company",
                links: ["About", "Founders", "Privacy", "Legal"],
              },
            ].map((col) => (
              <div key={col.title}>
                <p style={{ ...S.footerColTitle, color: "rgba(255,255,255,0.6)" }}>{col.title}</p>
                <div style={S.footerLinks}>
                  {col.links.map((link) => (
                    <button
                      key={link}
                      className="footer-link"
                      onClick={() => router.push("/not-yet")}
                      style={{ cursor: "pointer" }}
                    >
                      {link}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ ...S.footerBottom, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
            <p style={{ ...S.footerCopy, color: "rgba(255,255,255,0.5)" }}>
              &copy; 2026 FieldForce Global Inc. All rights reserved.
            </p>
            <div style={{ display: "flex", gap: 32 }}>
              <button
                className="footer-link"
                style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer" }}
                onClick={() => router.push("/not-yet")}
              >
                Privacy Policy
              </button>
              <button
                className="footer-link"
                style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer" }}
                onClick={() => router.push("/not-yet")}
              >
                Terms of Service
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
