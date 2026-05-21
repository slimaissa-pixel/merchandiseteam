import { X, Zap, CheckCircle2, Sparkles, MoveRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

export function AccentDivider({ isDark = true }: { isDark?: boolean }) {
    const color = isDark ? '#d4a84b' : '#2563eb';
    return (
        <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${color} 40%, transparent)` }} />
    );
}

/**
 * Standardizes asset resolution for web. 
 * Expo's require() on web can return an object {uri, default} or a string.
 */
export function getWebAsset(asset: any): string {
    if (!asset) return '';
    return typeof asset === 'string' ? asset : (asset.uri || asset.default || asset);
}

export interface PublicStats {
    teams: string;
    stores: string;
    reports: string;
    data_points: string;
}

export function AnimatedNumber({ value }: { value: string | number }) {
    const valStr = String(value);
    const match = valStr.match(/(\d+\.?\d*)/);
    const numericPart = match ? parseFloat(match[0]) : 0;
    const suffix = valStr.replace(String(numericPart), '');
    const decimalPlaces = match?.[1].includes('.') ? match[1].split('.')[1].length : 0;

    const [count, setCount] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const elementRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (Platform.OS !== 'web') {
            setIsVisible(true);
            return;
        }

        if (typeof IntersectionObserver === 'undefined') {
            setIsVisible(true);
            return;
        }

        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setIsVisible(true);
                observer.disconnect();
            }
        }, { threshold: 0.2 });

        if (elementRef.current) observer.observe(elementRef.current);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!isVisible) return;

        let startTime: number | null = null;
        const duration = 2400;

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);

            const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            const current = ease * numericPart;

            setCount(current);
            if (progress < 1) requestAnimationFrame(animate);
        };

        requestAnimationFrame(animate);
    }, [isVisible, numericPart]);

    return (
        <div ref={elementRef}>
            {count.toFixed(decimalPlaces)}
            {suffix}
        </div>
    );
}

export function SectionEyebrow({ children, color }: { children: string, color: string }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ height: 1, width: 40, background: color }} />
            <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.35em', textTransform: 'uppercase', color: color }}>
                {children}
            </span>
        </div>
    );
}

export const LOGO_DISPLAY_WIDTH = 120;
export const LOGO_COORDS = [
    { x: 90, y: 130, w: 319, h: 210 }, // Delice
    { x: 465, y: 165, w: 280, h: 165 }, // Vitalait
    { x: 790, y: 145, w: 250, h: 200 }, // Boga
    { x: 1080, y: 155, w: 285, h: 175 }, // Apla
    { x: 125, y: 405, w: 290, h: 170 }, // Samba
    { x: 475, y: 395, w: 285, h: 185 }, // Randa
    { x: 795, y: 385, w: 250, h: 200 }, // Triki
    { x: 1075, y: 400, w: 300, h: 185 }, // Diari
    { x: 135, y: 705, w: 275, h: 210 }, // Saida
    { x: 455, y: 730, w: 310, h: 145 }, // Biscri
    { x: 1090, y: 715, w: 285, h: 175 }, // Olio
];

export function CustomMarqueeLogos({ isDark }: { isDark: boolean }) {
    const bgUrl = getWebAsset(require('@/assets/images/Marques_Transparent.png'));

    return (
        <section style={{ 
            padding: '20px 0', 
            background: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(15,23,42,0.02)', 
            borderTop: isDark ? 'none' : '1px solid #f1f5f9',
            borderBottom: isDark ? 'none' : '1px solid #f1f5f9',
            overflow: 'hidden' 
        }}>
            <div className="marquee-track" style={{ gap: 60, padding: '10px 0' }}>
                {[...Array(2)].flatMap((_, j) =>
                    LOGO_COORDS.map((coord, i) => {
                        const scale = LOGO_DISPLAY_WIDTH / coord.w;
                        const targetHeight = coord.h * scale;
                        return (
                            <div key={`${j}-${i}`} style={{
                                width: LOGO_DISPLAY_WIDTH,
                                height: 80,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <div className="sprite-box" style={{
                                    width: LOGO_DISPLAY_WIDTH,
                                    height: targetHeight,
                                    backgroundImage: `url(${bgUrl})`,
                                    backgroundSize: `${1536 * scale}px ${1024 * scale}px`,
                                    backgroundPosition: `-${coord.x * scale}px -${coord.y * scale}px`,
                                    filter: isDark ? 'grayscale(100%) opacity(0.5)' : 'grayscale(100%) opacity(0.7)',
                                    transition: 'filter 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.4s ease',
                                    cursor: 'pointer'
                                }}
                                onMouseEnter={(e) => { 
                                    e.currentTarget.style.filter = 'grayscale(0%) opacity(1)';
                                    e.currentTarget.style.transform = 'scale(1.05)';
                                }}
                                onMouseLeave={(e) => { 
                                    e.currentTarget.style.filter = isDark ? 'grayscale(100%) opacity(0.5)' : 'grayscale(100%) opacity(0.7)';
                                    e.currentTarget.style.transform = 'scale(1)';
                                }}
                                />
                            </div>
                        );
                    })
                )}
            </div>
        </section>
    );
}

export function ThemeBadge({ text, color, isDark }: { text: string, color: string, isDark: boolean }) {
    return (
        <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: 12, 
            padding: '6px 24px', 
            borderRadius: 100, 
            borderColor: isDark ? `${color}60` : `${color}40`, 
            borderStyle: 'solid',
            borderWidth: 1, 
            backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(161, 188, 207, 0.8)', 
            fontSize: 10, 
            fontWeight: 800, 
            letterSpacing: '0.3em', 
            textTransform: 'uppercase', 
            color: color,
            backdropFilter: 'blur(10px)',
        }}>
            <Sparkles size={12} color={color} /> {text} <Sparkles size={12} color={color} />
        </div>
    );
}

export function ToastOverlay({ toast, dismissToast, isDark }: { 
    toast: { message: string, type: 'success' | 'error', isHiding?: boolean } | null, 
    dismissToast: () => void,
    isDark: boolean
}) {
    if (!toast) return null;

    const gold = '#d4a84b';
    const primary = '#2563eb';
    const error = '#f43f5e';
    const accent = isDark ? gold : primary;

    return (
        <div className="toast-overlay">
            <style dangerouslySetInnerHTML={{ __html: `
                .toast-overlay {
                    position: fixed; bottom: 40px; right: 40px; z-index: 10000;
                    display: flex; flex-direction: column; gap: 12px; pointer-events: none;
                }
                .toast-card {
                    pointer-events: auto;
                    background: ${isDark ? 'rgba(15,15,18,0.88)' : 'rgba(255, 255, 255, 0.85)'};
                    border: 1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15, 23, 42, 0.12)'};
                    border-radius: 20px; padding: 18px 24px;
                    backdrop-filter: blur(24px) saturate(200%);
                    box-shadow: ${isDark ? '0 24px 60px rgba(0,0,0,0.6)' : '0 24px 60px rgba(15, 23, 42, 0.08)'};
                    display: flex; align-items: center; gap: 18px; max-width: 420px;
                    position: relative; overflow: hidden;
                    animation: toastEnter 0.6s cubic-bezier(0.16,1,0.3,1) forwards;
                }
                .toast-card.hiding { animation: toastExit 0.5s cubic-bezier(0.7,0,0.84,0) forwards; }
                .toast-card.success { border-left: 4px solid ${accent}; }
                .toast-card.error   { border-left: 4px solid ${error}; }
                .toast-content { flex: 1; display: flex; flex-direction: column; gap: 2px; }
                .toast-title   { font-size: 14px; font-weight: 700; color: ${isDark ? '#fff' : '#0f172a'}; margin: 0; }
                .toast-message { font-size: 13px; font-weight: 400; color: ${isDark ? 'rgba(255,255,255,0.5)' : '#64748b'}; margin: 0; line-height: 1.5; }
                .toast-close {
                    color: ${isDark ? 'rgba(255,255,255,0.3)' : '#94a3b8'}; cursor: pointer; padding: 4px;
                    border-radius: 8px; transition: all 0.2s; display: flex;
                    align-items: center; justify-content: center;
                }
                .toast-close:hover { background: ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15, 23, 42, 0.05)'}; color: ${isDark ? '#fff' : '#0f172a'}; }
                .toast-progress {
                    position: absolute; bottom: 0; left: 0; height: 3px;
                    background: linear-gradient(90deg, transparent, ${accent});
                    width: 100%; transform-origin: left;
                    animation: toastProgress 7s linear forwards;
                }
                .error .toast-progress { background: linear-gradient(90deg, transparent, ${error}); }
                @keyframes toastEnter { from { opacity:0; transform:translateX(100px) scale(0.9); } to { opacity:1; transform:translateX(0) scale(1); } }
                @keyframes toastExit { from { opacity:1; transform:translateX(0) scale(1); } to { opacity:0; transform:translateX(20px) scale(0.95); filter:blur(4px); } }
                @keyframes toastProgress { from{transform:scaleX(1);} to{transform:scaleX(0);} }
            ` }} />
            <div className={`toast-card ${toast.type}${toast.isHiding ? ' hiding' : ''}`}>
                <div className="toast-progress" />
                <div className="toast-icon-wrap">
                    {toast.type === 'success'
                        ? <CheckCircle2 color={accent} size={20} strokeWidth={2.5} />
                        : <Zap color={error} size={20} strokeWidth={2.5} />
                    }
                </div>
                <div className="toast-content">
                    <p className="toast-title">{toast.type === 'success' ? 'Success' : 'Attention'}</p>
                    <p className="toast-message">{toast.message}</p>
                </div>
                <button className="toast-close" onClick={dismissToast}><X size={16} /></button>
            </div>
        </div>
    );
}
