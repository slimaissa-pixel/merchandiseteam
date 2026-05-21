import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { API_BASE_URL } from '@/constants/api';
import { useTheme } from '@/context/ThemeContext';
import DarkModeLanding from '@/components/landing/DarkModeLanding';
import LightModeLanding from '@/components/landing/LightModeLanding';
import AuthModal from '@/components/landing/AuthModal';
import { PublicStats, ToastOverlay } from '@/components/landing/SharedLandingComps';

export default function UniversalLandingPage() {
    const router = useRouter();
    const { theme, toggleTheme, setThemeManual } = useTheme();

    /* ── State ── */
    const [publicStats, setPublicStats] = useState<PublicStats | null>(null);
    const [demoEmail, setDemoEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [navPinned, setNavPinned] = useState(false);
    const [toast, setToast] = useState<{
        message: string; type: 'success' | 'error'; isHiding?: boolean;
    } | null>(null);

    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [authInitialView, setAuthInitialView] = useState<'login' | 'signup' | 'forgot'>('login');

    const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const toastHideRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    /* ── Toast helpers ── */
    const showToast = (message: string, type: 'success' | 'error') => {
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        if (toastHideRef.current) clearTimeout(toastHideRef.current);
        setToast({ message, type, isHiding: false });
        toastHideRef.current = setTimeout(() => {
            setToast(prev => prev ? { ...prev, isHiding: true } : null);
        }, 6500);
        toastTimerRef.current = setTimeout(() => setToast(null), 7000);
    };

    const dismissToast = () => {
        setToast(prev => prev ? { ...prev, isHiding: true } : null);
        setTimeout(() => setToast(null), 500);
    };

    /* ── Public stats ── */
    useEffect(() => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 5000);
        fetch(`${API_BASE_URL}/api/stats/public`, { signal: controller.signal })
            .then(r => r.ok ? r.json() : null)
            .then(data => { if (data) setPublicStats(data); })
            .catch(() => { })
            .finally(() => clearTimeout(timer));
    }, []);

    /* ── Scroll tracking for nav pin ── */
    useEffect(() => {
        const getScroller = (): Element | null => {
            const all = Array.from(document.querySelectorAll('*'));
            for (const el of all) {
                const { overflowY, overflow } = window.getComputedStyle(el);
                if ((overflowY === 'auto' || overflowY === 'scroll' || overflow === 'auto' || overflow === 'scroll')
                    && (el as HTMLElement).scrollHeight > window.innerHeight + 50) {
                    return el;
                }
            }
            return null;
        };

        let capturedScroller: Element | null = null;
        const containerHandler = (e: Event) => setNavPinned((e.currentTarget as HTMLElement).scrollTop > 30);
        const windowHandler = () => setNavPinned(window.scrollY > 30);

        const timeout = setTimeout(() => {
            capturedScroller = getScroller();
            if (capturedScroller) {
                capturedScroller.addEventListener('scroll', containerHandler as EventListener, { passive: true });
            } else {
                window.addEventListener('scroll', windowHandler, { passive: true });
            }
        }, 100);

        return () => {
            clearTimeout(timeout);
            if (capturedScroller) capturedScroller.removeEventListener('scroll', containerHandler as EventListener);
            else window.removeEventListener('scroll', windowHandler);
            setNavPinned(false);
        };
    }, []);

    /* ── Scroll-reveal observer ── */
    useEffect(() => {
        if (typeof IntersectionObserver === 'undefined') return;
        const obs = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target as HTMLElement;
                    const delay = parseFloat(el.dataset.delay || '0');
                    setTimeout(() => el.classList.add('visible'), delay * 1000);
                    obs.unobserve(el);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
        
        const timer = setTimeout(() => {
            document.querySelectorAll('.sr').forEach(el => obs.observe(el));
        }, 100);
        
        return () => {
            clearTimeout(timer);
            obs.disconnect();
        };
    }, [theme]);

    /* ── Progress bar observer ── */
    useEffect(() => {
        if (typeof IntersectionObserver === 'undefined') return;
        const obs = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setTimeout(() => entry.target.classList.add('animated'), 200);
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.3 });
        
        const timer = setTimeout(() => {
            document.querySelectorAll('.progress-bar').forEach(el => obs.observe(el));
        }, 150);

        return () => {
            clearTimeout(timer);
            obs.disconnect();
        };
    }, [theme]);

    /* ── Demo request ── */
    const handleDemoRequest = async () => {
        if (!demoEmail || !demoEmail.includes('@')) {
            showToast('Please enter a valid enterprise email address.', 'error');
            return;
        }
        setIsSubmitting(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/demo-request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: demoEmail }),
            });
            const data = await res.json();
            if (res.ok) {
                showToast(data.message || 'Request sent! We\'ll email you once approved.', 'success');
                setDemoEmail('');
            } else {
                showToast(data.detail || data.error || 'Failed to request demo.', 'error');
            }
        } catch {
            showToast('Network timeout. Please check your connection and try again.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const openAuthModal = (view: 'login' | 'signup' | 'forgot' = 'login') => {
        setAuthInitialView(view);
        setIsAuthModalOpen(true);
    };

    const closeAuthModal = () => setIsAuthModalOpen(false);

    const scrollTo = (id: string) => {
        if (typeof document === 'undefined') return;
        const prefix = theme === 'light' ? 'light-' : 'dark-';
        const el = document.getElementById(prefix + id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: id === 'logos' ? 'center' : 'start' });
    };

    const commonProps = {
        publicStats,
        demoEmail,
        setDemoEmail,
        isSubmitting,
        handleDemoRequest,
        navPinned,
        toggleTheme,
        scrollTo,
        openAuthModal,
    };

    return (
        <div style={{ display: 'contents' }}>
            {theme === 'light' ? (
                <LightModeLanding {...commonProps} />
            ) : (
                <DarkModeLanding {...commonProps} />
            )}
            
            <ToastOverlay 
                toast={toast} 
                dismissToast={dismissToast} 
                isDark={theme === 'dark'} 
            />

            <AuthModal 
                isOpen={isAuthModalOpen} 
                onClose={closeAuthModal} 
                initialView={authInitialView}
                isDark={theme === 'dark'}
            />
        </div>
    );
}