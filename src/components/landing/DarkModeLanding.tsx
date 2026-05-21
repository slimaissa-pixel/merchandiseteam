import { useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import {
  Activity,
  Users,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Crown,
  Database,
  Globe2,
  Layers,
  LineChart,
  Shield,
  Sun,
  Target,
  Zap,
} from "lucide-react";
import ElectricBorder from '../ElectricBorder';
import { DARK_COLORS as COLOR } from "@/constants/appColors";
import {
  AnimatedNumber,
  SectionEyebrow,
  CustomMarqueeLogos,
  ThemeBadge,
  PublicStats,
  getWebAsset,
  AccentDivider,
} from "./SharedLandingComps";

interface DarkModeLandingProps {
  publicStats: PublicStats | null;
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
        to   { opacity: 1; transform: translateY(0); }
    }

    .space-bg {
        background: #060608;
        position: relative;
        overflow: hidden;
    }
    .space-bg::before {
        content: "";
        position: absolute;
        inset: 0;
        background: 
            radial-gradient(circle at 20% 30%, rgba(56, 189, 248, 0.1) 0%, transparent 40%),
            radial-gradient(circle at 80% 70%, rgba(139, 92, 246, 0.1) 0%, transparent 40%),
            radial-gradient(circle at 50% 50%, rgba(212, 168, 75, 0.05) 0%, transparent 60%);
        filter: blur(80px);
        z-index: 0;
    }
    .space-bg::after {
        content: "";
        position: absolute;
        inset: 0;
        background-image: 
            radial-gradient(1.2px 1.2px at 15% 15%, #fff, transparent),
            radial-gradient(1.5px 1.5px at 25% 65%, #fff, transparent),
            radial-gradient(1.2px 1.2px at 45% 35%, #fff, transparent),
            radial-gradient(1.2px 1.2px at 65% 85%, #fff, transparent),
            radial-gradient(1.5px 1.5px at 85% 45%, #fff, transparent),
            radial-gradient(1.2px 1.2px at 95% 15%, #fff, transparent);
        background-size: 450px 450px;
        opacity: 0.5;
        z-index: 1;
    }

    .stripes-bg {
        background: #060608;
        background-image: repeating-linear-gradient(
            90deg,
            transparent,
            transparent 79px,
            rgba(255, 255, 255, 0.04) 79px,
            rgba(255, 255, 255, 0.04) 80px
        );
        position: relative;
    }
    .stripes-bg::before {
        content: "";
        position: absolute;
        inset: 0;
        background: radial-gradient(circle at 50% 0%, rgba(212, 168, 75, 0.08), transparent 70%);
    }

    .intel-bg {
        background: #040405;
        position: relative;
        overflow: hidden;
    }
    .intel-bg::before {
        content: "";
        position: absolute;
        inset: 0;
        background: radial-gradient(circle at 70% 30%, rgba(139, 92, 246, 0.05), transparent 70%),
                    radial-gradient(circle at 30% 70%, rgba(56, 189, 248, 0.05), transparent 70%);
    }

    .float { animation: floatY 6s ease-in-out infinite; }
    @keyframes floatY { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-14px);} }

    .nav-link {
        padding: 8px 20px; font-size: 13px; font-weight: 600;
        color: rgba(255,255,255,0.45); border-radius: 10px; cursor: pointer;
        border: none; background: transparent; transition: color 0.2s, background 0.2s;
        font-family: inherit;
    }
    .nav-link:hover { color: #fff; background: rgba(255,255,255,0.06); }

    .cta-btn {
        position: relative; overflow: hidden; display: inline-flex; align-items: center; gap: 10px;
        padding: 16px 40px; border-radius: 18px; font-weight: 900; font-size: 16px;
        cursor: pointer; border: none; transition: transform 0.25s ease, box-shadow 0.25s ease;
        font-family: inherit;
    }
    .cta-btn:active { transform: scale(0.95); }
    .cta-btn-primary {
        background: linear-gradient(135deg, #d4a84b 0%, #f5d98c 50%, #d4a84b 100%);
        background-size: 200% auto; color: #000;
        box-shadow: 0 12px 30px rgba(212, 168, 75, 0.25); animation: goldShift 4s linear infinite;
    }
    .cta-btn-primary:hover { transform: scale(1.04); box-shadow: 0 20px 40px rgba(212, 168, 75, 0.35); }
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
        width: 48px; height: 48px; border-radius: 50%; background: #1a1a1f;
        border: 1px solid rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center;
        cursor: pointer; transition: all 0.3s; color: #fff;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }
    .scroll-nav-btn:hover { background: #25252a; border-color: #d4a84b; color: #d4a84b; transform: scale(1.1); }
    .scroll-nav-btn:disabled { opacity: 0.3; cursor: not-allowed; }

    .smart-card {
        background: rgba(20, 20, 25, 0.6); backdrop-filter: blur(24px) saturate(180%);
        border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 20px;
        padding: 32px; display: flex; flex-direction: column; align-items: flex-start;
        text-align: left; transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        height: 100%; position: relative; box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        cursor: pointer; color: #fff; overflow: hidden;
    }
    .smart-card:hover {
        background: #1a1a1f; border-color: rgba(212, 168, 75, 0.4);
        transform: translateY(-6px);
        box-shadow: 0 20px 40px rgba(0,0,0,0.6);
    }
    .smart-card:hover .icon-bounce { transform: scale(1.1) rotate(4deg); }
    .smart-card h3, .smart-card p { transition: all 0.3s ease; }
    .smart-card:hover h3 { color: #d4a84b; }

    .grid-bg {
        background-color: #020203;
        background-image: linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
        background-size: 60px 60px; position: relative; overflow: hidden;
    }
    .grid-bg::after {
        content: ""; position: absolute; inset: 0;
        background: radial-gradient(circle at center, transparent 0%, #020203 85%);
        pointer-events: none;
    }

    .ghost-input {
        background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1);
        border-radius: 16px; padding: 16px 24px; color: #fff; font-size: 15px; outline: none;
        transition: border 0.25s, box-shadow 0.25s; flex: 1;
    }
    .ghost-input:focus { border-color: #d4a84b; box-shadow: 0 0 0 3px rgba(212,168,75,0.15); }
    
    .footer-link { color: rgba(255,255,255,0.3); font-size: 13px; text-decoration: none; transition: color 0.2s; border: none; background: none; text-align: left; padding: 0; }
    .footer-link:hover { color: #d4a84b; }
    .social-btn { width: 36px; height: 36px; border-radius: 10px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); display: flex; align-items: center; justify-content: center; }

    /* FOOTER — Luxury Professional Wall */
    .footer-wall .footer-link { color: rgba(255,255,255,0.6); }
    .footer-wall .footer-link:hover { color: #d4a84b; }
    .footer-wall .social-btn { background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.06); transition: all 0.3s; }
    .footer-wall .social-btn:hover { background: rgba(212,168,75,0.1); border-color: rgba(212,168,75,0.3); transform: translateY(-2px); }
`;

export default function DarkModeLanding({
  publicStats,
  demoEmail,
  setDemoEmail,
  isSubmitting,
  handleDemoRequest,
  navPinned,
  toggleTheme,
  scrollTo,
  openAuthModal,
}: DarkModeLandingProps) {
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
    {
      icon: Target,
      label: "Retail Execution Control",
      copy: "Structured in-store execution workflows ensuring compliance with merchandising standards, audit checkpoints, and operational consistency across all assigned retail locations.",
      ring: COLOR.gold,
      glow: "rgba(212,168,75,0.12)",
    },
    {
      icon: Activity,
      label: "Live GPS Tracking",
      copy: "Ensure physical presence and route compliance with real-time GPS validation, sub-meter accuracy, and adaptive battery protocols that never interrupt field agents.",
      ring: COLOR.rose,
      glow: "rgba(251,113,133,0.12)",
    },
    {
      icon: Users,
      label: "Workforce Orchestration",
      copy: "Centralized supervision of merchandisers and supervisors with role-based permissions, assignment control, and continuous real-time activity tracking.",
      ring: COLOR.sky,
      glow: "rgba(56,189,248,0.12)",
    },
    {
      icon: BarChart3,
      label: "Performance & KPI Analytics",
      copy: "Advanced dashboards providing real-time visibility on field performance, objective tracking, and execution quality across all merchandising teams.",
      ring: COLOR.violet,
      glow: "rgba(139,92,246,0.12)",
    },
    {
      icon: Database,
      label: "Data Intelligence",
      copy: "Transform raw field operations into structured, decision-ready insights. Capture timestamped reports, visual evidence, anomalies, and merchandising events automatically.",
      ring: COLOR.emerald,
      glow: "rgba(52,211,153,0.12)",
    },
    {
      icon: Shield,
      label: "Security & Compliance",
      copy: "AES-256 enterprise-grade encryption, GPS-based presence validation, and monitoring systems ensuring every operational rule is enforced without exception.",
      ring: COLOR.orange,
      glow: "rgba(251,146,60,0.12)",
    },
    {
      icon: Layers,
      label: "Integrated Business Modules",
      copy: "Unified platform covering planning, store management, stock monitoring, event tracking, and reporting — complete operational control in one environment.",
      ring: COLOR.sky,
      glow: "rgba(56,189,248,0.10)",
    },
    {
      icon: Crown,
      label: "Enterprise Command Centre",
      copy: "Executive-level visibility with cross-territory rollups, custom reporting periods, and white-label dashboards tailored to your organisational hierarchy.",
      ring: COLOR.gold,
      glow: "rgba(212,168,75,0.10)",
    },
    {
      icon: Zap,
      label: "Automated Reporting",
      copy: "Transmit structured reports including store visits and merchandising events with timestamped data and visual evidence — zero manual effort required.",
      ring: COLOR.violet,
      glow: "rgba(139,92,246,0.10)",
    },
  ];

  const METRICS = [
    { value: "120+", label: "Active Field Agents" },
    { value: "99.9", label: "System Availability" },
    { value: "5.2K+", label: "Daily Operational Reports" },
    { value: "18K+", label: "Data Points Collected" },
  ];

  const PROGRESS = [
    { label: "Planning Compliance", value: 94, color: COLOR.gold },
    { label: "Field Activity Rate", value: 78, color: COLOR.violet },
    { label: "Report Accuracy", value: 99, color: COLOR.emerald },
    { label: "Route Optimisation", value: 87, color: COLOR.sky },
  ];

  const S = {
    page: {
      fontFamily: "'Inter','SF Pro Display',system-ui,sans-serif",
      backgroundColor: COLOR.bg,
      color: COLOR.white,
      overflowX: "hidden" as const,
      minHeight: "100vh",
    },
    navWrap: {
      position: 'fixed' as const,
      top: 8,
      left: 0,
      right: 0,
      zIndex: 350,
      padding: navPinned ? '0px 30px' : '0px 10px',
      transition: 'all 0.6s cubic-bezier(0.16,1,0.3,1)',
      display: 'flex',
      justifyContent: 'center',
    },
    navInner: { width: '100%', maxWidth: navPinned ? 1090 : 1300, transition: 'all 0.6s cubic-bezier(0.16,1,0.3,1)' },
    navBox: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: navPinned ? '16px 0px 16px 20px' : '16px 32px', borderRadius: 100, backgroundColor: navPinned ? 'rgba(20,20,25,0.85)' : 'rgba(20,20,25,0.1)', backdropFilter: 'blur(30px) saturate(200%)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: navPinned ? '0 20px 40px rgba(0,0,0,0.3)' : 'none', transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)' },
    logo: { display: "flex", alignItems: "center", gap: 12 },
    logoBadge: {
      width: 36,
      height: 36,
      borderRadius: 10,
      overflow: "hidden",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "0 6px 20px rgba(212,168,75,0.4)",
      background: COLOR.bg,
    },
    logoText: { fontWeight: 900, fontSize: 18, letterSpacing: "-0.04em" },
    navLinks: { display: "flex", gap: navPinned ? 6 : 6, alignItems: "center", transition: 'gap 0.6s ease' },
    navActions: { display: "flex", alignItems: "center", gap: 12 },
    navSignIn: {
      background: "none",
      border: "none",
      color: COLOR.textMuted,
      fontWeight: 700,
      fontSize: 13,
      cursor: "pointer",
      padding: "8px 16px",
      fontFamily: "inherit",
      transition: "color 0.2s",
    },
    heroSection: {
      position: "relative" as const,
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    heroBg: { position: "absolute" as const, inset: 0 },
    heroGrid: {
      position: "absolute" as const,
      inset: 0,
      backgroundImage:
        "linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)",
      backgroundSize: "60px 60px",
    },
    heroFade: {
      position: "absolute" as const,
      bottom: 0,
      left: 0,
      right: 0,
      height: 200,
      background: `linear-gradient(to top,${COLOR.bg},transparent)`,
    },
    heroContent: {
      position: "relative" as const,
      zIndex: 10,
      maxWidth: 1400,
      margin: "0 auto",
      padding: "120px 40px 80px",
      width: "100%",
    },
    heroCopy: {
      maxWidth: 900,
      margin: "0 auto",
      textAlign: "center" as const,
      display: "flex",
      flexDirection: "column" as const,
      alignItems: "center",
      gap: 24,
    },
    heroH1: {
      fontWeight: 900,
      fontSize: "clamp(3.5rem,7vw,7rem)",
      lineHeight: 0.9,
      letterSpacing: "-0.04em",
      margin: 0,
    },
    heroItalic: {
      fontFamily: "'DM Serif Display',Georgia,serif",
      fontStyle: "italic",
      fontWeight: 700,
      fontSize: "clamp(4.5rem,8.5vw,8.5rem)",
      display: "block",
      margin: "-16px 0",
    },
    heroItalic2: {
      fontFamily: "'DM Serif Display',Georgia,serif",
      fontStyle: "italic",
      fontWeight: 700,
      fontSize: "clamp(3.5rem,6vw,5.5rem)",
      display: "block",
      margin: "0 0 20px 0",
    },
    heroP: {
      color: COLOR.textMuted,
      fontSize: 18,
      lineHeight: 1.7,
      fontWeight: 300,
      maxWidth: 640,
    },
    heroCtas: {
      display: "flex",
      gap: 16,
      justifyContent: "center",
      flexWrap: "wrap" as const,
      marginTop: 12,
    },
    metricsRow: {
      display: "grid",
      gridTemplateColumns: "repeat(4,1fr)",
      gap: 16,
      marginTop: 64,
      maxWidth: 880,
      margin: "64px auto 0",
    },
    metricCard: {
      padding: "24px 20px" as const,
      borderRadius: 20,
      backgroundColor: "rgba(255,255,255,0.04)",
      borderColor: "rgba(255,255,255,0.07)",
      borderWidth: 1,
      textAlign: "center" as const,
      backdropFilter: "blur(12px)",
      transition: "transform 0.3s ease, box-shadow 0.3s ease",
    },
    featSection: { padding: "160px 0", maxWidth: "100%", margin: "0 auto", overflow: 'hidden' },
    featH2: {
      fontWeight: 900,
      fontSize: "4rem",
      letterSpacing: "-0.04em",
      lineHeight: 0.95,
    },
    featHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-end",
      marginBottom: 60,
      gap: 40,
      flexWrap: "wrap" as const,
    },
    featureGrid: {
      display: "flex",
      flexDirection: "column" as const,
      gap: 24,
    },
    intelSection: {
      padding: "160px 40px",
      background: "#040405",
      position: "relative" as const,
      overflow: "hidden",
    },
    intelInner: {
      maxWidth: 1400,
      margin: "0 auto",
      display: "flex",
      alignItems: "center",
      gap: 100,
      flexWrap: "wrap" as const,
    },
    deviceWrap: {
      background:
        "linear-gradient(135deg,rgba(212,168,75,0.4),rgba(255,255,255,0.05),rgba(139,92,246,0.2))",
      padding: 1,
      borderRadius: 40,
      boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
    },
    deviceInner: {
      background: "#0d0d0f",
      borderRadius: 39,
      padding: 36,
      minWidth: 360,
      display: "flex",
      flexDirection: "column" as const,
      gap: 20,
    },
    ctaSection: {
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column" as const,
      justifyContent: "center",
      alignItems: "center",
      padding: "40px",
      position: "relative" as const,
      overflow: "hidden" as const,
      textAlign: "center" as const,
    },
    ctaH2: {
      fontWeight: 900,
      fontSize: "clamp(3rem,6vw,6.5rem)",
      letterSpacing: "-0.04em",
      lineHeight: 0.92,
    },
    ctaInputRow: {
      display: "flex",
      gap: 12,
      justifyContent: "center",
      flexWrap: "wrap" as const,
      maxWidth: 560,
      margin: "0 auto",
    },
    footerWrap: { padding: "40px 20px", background: COLOR.bg },
    footer: {
      maxWidth: 1400,
      margin: "0 auto",
      backgroundColor: "rgba(20,20,25,0.6)",
      backdropFilter: "blur(30px) saturate(180%)",
      border: "1px solid rgba(255,255,255,0.05)",
      borderRadius: 40,
      padding: "80px 40px 40px",
      overflow: "hidden",
      boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
    },
    footerGrid: {
      display: "grid",
      gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
      gap: 60,
      marginBottom: 64,
    },
    footerColTitle: {
      fontSize: 9,
      fontWeight: 900,
      letterSpacing: "0.35em",
      textTransform: "uppercase" as const,
      color: "rgba(255,255,255,0.35)",
      marginBottom: 24,
    },
    footerLinks: { display: "flex", flexDirection: "column" as const, gap: 14 },
    footerBottom: {
      paddingTop: 32,
      borderTop: "1px solid rgba(255,255,255,0.04)",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
    footerCopy: {
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: "0.2em",
      textTransform: "uppercase" as const,
      color: "rgba(255,255,255,0.15)",
    },
  };

  return (
    <div style={S.page}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <nav style={S.navWrap}>
        <div style={S.navInner}>
          <div style={S.navBox}>
            <div
              style={{ ...S.logo, cursor: "pointer" }}
              onClick={() => scrollTo("hero")}
            >
              <div style={S.logoBadge}>
                <img
                  src={getWebAsset(require("@/assets/images/index.png"))}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  alt="Logo"
                />
              </div>
              <span style={S.logoText}>
                Field<span className="gold-text">Force</span>
              </span>
            </div>
            <div style={S.navLinks}>
              {["Logos", "Capabilities", "Intelligence", "Demo", "Owners"].map(
                (n) => (
                  <button
                    key={n}
                    className="nav-link"
                    onClick={() =>
                      scrollTo(n === "Owners" ? "founders" : n.toLowerCase())
                    }
                  >
                    {n}
                  </button>
                ),
              )}
            </div>
            <div style={S.navActions}>
              <button
                style={{ ...S.navSignIn, padding: "8px", display: "flex", alignItems: "center" }}
                onClick={toggleTheme}
                title="Switch Theme"
              >
                <Sun size={20} />
              </button>
              <button style={S.navSignIn} onClick={() => openAuthModal("login")}>
                Sign In
              </button>
              <button style={S.navSignIn} onClick={() => openAuthModal("signup")}>
                Sign Up
              </button>
              <button
                className="cta-btn cta-btn-primary"
                style={{ padding: "10px 28px", fontSize: 13, borderRadius: 14,marginRight: navPinned ? 20 : 0 }}
                onClick={() => scrollTo("demo")}
              >
                Request Demo <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <section style={S.heroSection} id="dark-hero">
        <div style={S.heroBg}>
          <img
            src={getWebAsset(
              require("@/assets/images/bgds/dark_index.jpeg"),
            )}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.35,
              
            }}
            alt="Hero"
          />
          <div
            style={{
              position: "absolute",
              top: "-5%",
              left: "-5%",
              width: "55%",
              height: "55%",
              borderRadius: "50%",
              backgroundColor: "rgba(180,120,20,0.12)",
              filter: "blur(120px)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "-5%",
              right: "-5%",
              width: "45%",
              height: "45%",
              borderRadius: "50%",
              backgroundColor: "rgba(100,60,200,0.10)",
              filter: "blur(100px)",
            }}
          />
          <div style={S.heroGrid} />
          <div style={S.heroFade} />
        </div>
        <div style={S.heroContent}>
          <div style={S.heroCopy}>
            <div className="reveal" style={{ animationDelay: "0.05s", marginTop: 4, marginBottom: 4 }}>
              <ThemeBadge
                text="Enterprise Field Intelligence"
                color={COLOR.gold}
                isDark={true}
              />
            </div>
            <h1
              className="reveal"
              style={{ ...S.heroH1, animationDelay: "0.15s" }}
            >
              Manage Field
              <span className="gold-text" style={S.heroItalic}>
                Operations
              </span>
              With Precision.
            </h1>
            <p
              className="reveal"
              style={{ ...S.heroP, animationDelay: "0.25s" }}
            >
              Digitalize merchandising operations, optimise workforce execution,
              and gain real-time visibility across your entire retail network —
              all from one platform.
            </p>
            <div
              className="reveal"
              style={{ ...S.heroCtas, animationDelay: "0.35s" }}
            >
              <button
                className="cta-btn cta-btn-primary"
                onClick={() => openAuthModal("login")}
              >
                Launch Platform <ArrowRight size={18} />
              </button>
              <button
                className="cta-btn cta-btn-secondary"
                onClick={() => scrollTo("demo")}
                style={{
                  padding: "16px 36px",
                  borderRadius: 100,
                  fontWeight: 900,
                  fontSize: 16,
                  cursor: "pointer",
                  background: "rgba(255,255,255,0.05)",
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                Request Demo
              </button>
            </div>
          </div>
          <div
            className="reveal"
            style={{ ...S.metricsRow, animationDelay: "0.45s" }}
          >
            {METRICS.map((m, i) => (
              <div key={i} style={S.metricCard}>
                <div
                  className="gold-text"
                  style={{
                    fontSize: 32,
                    fontWeight: 900,
                    letterSpacing: "-0.04em",
                  }}
                >
                  <AnimatedNumber value={m.value} />
                </div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: "0.25em",
                    textTransform: "uppercase",
                    color: COLOR.textMuted,
                    marginTop: 6,
                  }}
                >
                  {m.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <AccentDivider />
      <div id="dark-logos">
        <CustomMarqueeLogos isDark={true} />
      </div>
      <AccentDivider />

      <section style={S.featSection} id="dark-capabilities" className="stripes-bg">
        <div style={{ ...S.featHeader, paddingLeft: '10vw', paddingRight: '10vw', justifyContent: 'center', textAlign: 'center', marginBottom: 100 }}>
          <div style={{ maxWidth: 800 }}>
            <div className="sr sr-up">
              <SectionEyebrow color={COLOR.gold}>Core Capabilities</SectionEyebrow>
            </div>
            <h2 className="sr sr-up" style={{ ...S.featH2, marginTop: 12, fontSize: 'clamp(2.2rem, 3.5vw, 3.4rem)', lineHeight: 0.9, letterSpacing: '-0.02em' }} data-delay="0.1">
              Precision.
              <br />
              <span className="gold-text" style={{ ...S.heroItalic, fontSize: 'clamp(3.5rem, 5.5vw, 5rem)', margin: '0 0' }}>Coordination,</span>
              <br />
              <span style={{ opacity: 0.6 }}>Everywhere.</span>
            </h2>
            <div 
              className="sr sr-up"
              style={{ width: 60, height: 2, background: COLOR.gold, margin: '24px auto', opacity: 0.4 }} 
              data-delay="0.2"
            />
            <p className="sr sr-up" style={{ color: COLOR.textMuted, fontSize: 16, lineHeight: 1.6, fontWeight: 300, maxWidth: 500, margin: '0 auto' }} data-delay="0.3">
              Elite infrastructure designed for precision field management, 
              ensuring every operation is synchronized and visible.
            </p>
          </div>
        </div>

        <div className="sr sr-up" data-delay="0.2" style={{ position: 'relative' }}>
          {/* Side Navigation Arrows */}
          <div style={{ position: 'absolute', top: '50%', left: '4vw', transform: 'translateY(-50%)', zIndex: 10 }}>
             <button className="scroll-nav-btn" onClick={() => scroll('left')} style={{ width: 56, height: 56, background: 'rgba(26,26,31,0.8)', backdropFilter: 'blur(10px)' }}>
                <ArrowRight size={24} style={{ transform: 'rotate(180deg)' }} />
             </button>
          </div>
          <div style={{ position: 'absolute', top: '50%', right: '4vw', transform: 'translateY(-50%)', zIndex: 10 }}>
             <button className="scroll-nav-btn" onClick={() => scroll('right')} style={{ width: 56, height: 56, background: 'rgba(26,26,31,0.8)', backdropFilter: 'blur(10px)' }}>
                <ArrowRight size={24} />
             </button>
          </div>

          <div className="scroll-grid" ref={scrollRef}>
            {FEATURES.map((f, i) => (
              <div key={i} className="smart-card" style={{ minWidth: 320 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: f.glow, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }} className="icon-bounce">
                  <f.icon size={24} color={f.ring} />
                </div>
                <h3 style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em', marginBottom: 12 }}>{f.label}</h3>
                <p style={{ color: "rgba(255,255,255,0.5)", lineHeight: 1.6, fontWeight: 400, fontSize: 13 }}>{f.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="dark-intelligence"
        className="intel-bg"
        style={S.intelSection}
      >
        <div
          style={{
            position: "absolute",
            top: "20%",
            left: "-20%",
            width: "45vw",
            height: "45vw",
            borderRadius: "50%",
            backgroundColor: "rgba(124,58,237,0.06)",
            filter: "blur(140px)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.018) 1px,transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />
        <div style={S.intelInner}>
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: 40,
              minWidth: 320,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div className="sr sr-left">
                <SectionEyebrow color={COLOR.gold}>
                  Intelligence Layer
                </SectionEyebrow>
              </div>
              <h2
                className="sr sr-left"
                style={{ ...S.featH2, lineHeight: 0.95 }}
                data-delay="0.1"
              >
                Operational
                <br />
                <span className="gold-text" style={S.heroItalic}>
                  intelligence,
                </span>
                <br />
                redefined.
              </h2>
              <p
                className="sr sr-left"
                style={{
                  color: COLOR.textMuted,
                  fontSize: 17,
                  lineHeight: 1.7,
                  fontWeight: 300,
                  maxWidth: 380,
                }}
                data-delay="0.2"
              >
                Our core analyses store patterns, team dynamics, and route
                efficiency to surface insights no human eye could catch.
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {[
                "Sub-meter GPS with adaptive battery protocols.",
                "AI-driven route optimisation every 90 seconds.",
                "AES-256 enterprise-grade data encryption.",
                "Real-time sync across all organisational tiers.",
              ].map((line, i) => (
                <div
                  key={i}
                  className="sr sr-left"
                  style={{ display: "flex", alignItems: "flex-start", gap: 14 }}
                  data-delay={`${0.1 + 0.08 * i}`}
                >
                  <CheckCircle2
                    color={COLOR.gold}
                    size={18}
                    style={{ marginTop: 2, flexShrink: 0 }}
                  />
                  <p
                    style={{
                      color: COLOR.textSub,
                      fontWeight: 500,
                      fontSize: 15,
                    }}
                  >
                    {line}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div
            style={{
              flex: 1,
              display: "flex",
              justifyContent: "center",
              position: "relative",
            }}
          >
            <div className="float" style={{ position: "relative" }}>
              <div style={S.deviceWrap}>
                <div style={S.deviceInner}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingBottom: 20,
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 900,
                          letterSpacing: "0.3em",
                          textTransform: "uppercase",
                          color: COLOR.gold,
                        }}
                      >
                        Live Operation
                      </div>
                      <div
                        style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}
                      >
                        Fleet Status
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      marginTop: 8,
                      display: "flex",
                      flexDirection: "column",
                      gap: 16,
                    }}
                  >
                    {PROGRESS.map((p, i) => (
                      <div key={i}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: 8,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 800,
                              letterSpacing: "0.1em",
                              textTransform: "uppercase",
                              color: "rgba(255,255,255,0.5)",
                            }}
                          >
                            {p.label}
                          </span>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 900,
                              color: p.color,
                            }}
                          >
                            {p.value}%
                          </span>
                        </div>
                        <div
                          style={{
                            height: 4,
                            borderRadius: 2,
                            backgroundColor: "rgba(255,255,255,0.03)",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              width: `${p.value}%`,
                              background: p.color,
                              boxShadow: `0 0 10px ${p.color}40`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginTop: 12,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: "0.2em",
                        textTransform: "uppercase",
                        color: "rgba(255,255,255,0.2)",
                      }}
                    >
                      Ops: {publicStats?.teams || "120+"}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: "0.2em",
                        textTransform: "uppercase",
                        color: COLOR.gold,
                      }}
                    >
                      {publicStats?.stores || "48+"} Cities
                    </span>
                  </div>
                </div>
              </div>
              <div
                style={{
                  position: "absolute",
                  top: -30,
                  right: -30,
                  width: 140,
                  height: 140,
                  borderRadius: "50%",
                  backgroundColor: "rgba(212,168,75,0.18)",
                  filter: "blur(50px)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: -30,
                  left: -30,
                  width: 140,
                  height: 140,
                  borderRadius: "50%",
                  backgroundColor: "rgba(139,92,246,0.15)",
                  filter: "blur(50px)",
                }}
              />
            </div>
          </div>
        </div>
      </section>

      <section style={S.ctaSection} className="stripes-bg" id="dark-demo">
        <div
          style={{
            position: "absolute",
            bottom: "-20%",
            right: "-10%",
            width: "35vw",
            height: "35vw",
            borderRadius: "50%",
            backgroundColor: "rgba(37,99,235,0.06)",
            filter: "blur(120px)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(212,168,75,0.08), transparent)",
          }}
        />
        <div
          style={{
            position: "relative",
            zIndex: 10,
            maxWidth: 800,
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 40,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 20,
              width: "100%",
            }}
          >
            <div
              style={{
                flex: 1,
                height: 1,
                background:
                  "linear-gradient(90deg, transparent, rgba(212,168,75,0.4))",
              }}
            />
            <span
              style={{
                fontSize: 10,
                fontWeight: 900,
                letterSpacing: "0.35em",
                textTransform: "uppercase",
                color: COLOR.gold,
                whiteSpace: "nowrap",
              }}
            >
              Begin Your Journey
            </span>
            <div
              style={{
                flex: 1,
                height: 1,
                background:
                  "linear-gradient(90deg, rgba(212,168,75,0.4), transparent)",
              }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
            <ThemeBadge text="Enterprise Access" color={COLOR.gold} isDark={true} />
          </div>
          <h3 style={S.ctaH2}>
            <p className="gold-text" style={S.heroItalic2}>
              Try Our field operations?
            </p>
          </h3>
          <div style={S.ctaInputRow}>
            <input
              type="email"
              placeholder="your@enterprise.com"
              className="ghost-input"
              value={demoEmail}
              onChange={(e: any) => setDemoEmail(e.target.value)}
              disabled={isSubmitting}
            />
            <button
              className="cta-btn cta-btn-primary"
              style={{ flexShrink: 0, opacity: isSubmitting ? 0.7 : 1 }}
              onClick={handleDemoRequest}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Requesting…" : "Request Demo"}
            </button>
          </div>
        </div>
      </section>

      <section
        id="dark-founders"
        className="grid-bg"
        style={{
          position: "relative",
          padding: "160px 40px",
          textAlign: "center" as const,
        }}
      >
        <div style={{ position: "relative", zIndex: 1, maxWidth: 1400, margin: "0 auto", width: "100%" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
            <ThemeBadge
              text="The Visionaries"
              color={COLOR.gold}
              isDark={true}
            />
          </div>
          <h2
            className="reveal"
            style={{
              fontWeight: 900,
              fontSize: "5rem",
              letterSpacing: "-0.04em",
              lineHeight: 1,
              margin: "0 0 80px",
            }}
          >
            {" "}
            <span className="gold-text" style={S.heroItalic}>
              Engineered by
            </span>
          </h2>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 60,
              flexWrap: "wrap" as const,
            }}
          >
            {(
              [
                {
                  name: "Aymen",
                  role: "Co-Founder & CEO",
                  image: require("@/assets/images/founders/Aymen.jpeg"),
                },
                {
                  name: "Slim",
                  role: "Co-Founder & CTO",
                  image: require("@/assets/images/founders/Slim.jpeg"),
                },
              ] as const
            ).map((founder, i) => (
              <ElectricBorder key={i} color={COLOR.gold} borderRadius={40} chaos={0.1}>
              <div
                className="sr sr-up"
                style={{
                  position: "relative",
                  width: 340,
                  borderRadius: 40,
                  padding: 12,
                  background:
                    "linear-gradient(145deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))",
                  border: "1px solid rgba(255,255,255,0.08)",
                  boxShadow: "0 30px 60px rgba(0,0,0,0.5)",
                }}
                data-delay={0.15 * i}
              >
                <div
                  style={{
                    height: 420,
                    borderRadius: 32,
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  <img
                    src={getWebAsset(founder.image)}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      filter: "contrast(1.05) saturate(1.1) brightness(0.95)",
                    }}
                    alt={founder.name}
                  />
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "linear-gradient(to top,rgba(10,10,12,0.9) 0%,rgba(10,10,12,0.4) 40%,transparent 100%)",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      bottom: 32,
                      left: 32,
                      right: 32,
                      textAlign: "left" as const,
                    }}
                  >
                    <h3
                      style={{
                        fontSize: 32,
                        fontWeight: 900,
                        color: "#fff",
                        marginBottom: 6,
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {founder.name}
                    </h3>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 800,
                        letterSpacing: "0.25em",
                        textTransform: "uppercase" as const,
                        color: COLOR.gold,
                      }}
                    >
                      {founder.role}
                    </p>
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
          background: 'linear-gradient(155deg, #030712 0%, #0a1329 45%, #0f1c3d 75%, #2e2411 100%)',
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
                    <Icon size={16} color="#2563eb" />
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
