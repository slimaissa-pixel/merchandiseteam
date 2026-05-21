import React, { useState, useEffect } from "react";
import { X, Mail, Lock, User, ShieldCheck, ArrowRight, Eye, EyeOff, Key } from "lucide-react";
import { useRouter } from "expo-router";
import { AuthService } from "../../services/auth.service";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../../lib/supabase";
import { getWebAsset } from "./SharedLandingComps";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
    initialView?: 'login' | 'signup' | 'forgot';
    isDark: boolean;
}

export default function AuthModal({ isOpen, onClose, initialView = 'login', isDark }: AuthModalProps) {
    const router = useRouter();
    const { signIn } = useAuth();
    const [view, setView] = useState<'login' | 'signup' | 'forgot'>(initialView);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // Sync view with initialView when modal opens
    useEffect(() => {
        if (isOpen) {
            setView(initialView);
            setError(null);
            setSuccessMsg(null);
        }
    }, [isOpen, initialView]);

    // Handle Escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    if (!isOpen) return null;

    const COLOR = {
        gold: '#d4a84b',
        goldLight: '#f5d98c',
        primary: isDark ? '#d4a84b' : '#2563eb',
        bg: isDark ? 'rgba(15, 15, 20, 0.85)' : 'rgba(255, 255, 255, 0.9)',
        border: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)',
        text: isDark ? '#fff' : '#0f172a',
        textMuted: isDark ? 'rgba(255,255,255,0.4)' : '#64748b',
        inputBg: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(15, 23, 42, 0.03)',
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!email || !password) return setError('Email and password are required');
        
        setIsLoading(true);
        try {
            await signIn(email, password, true);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Invalid credentials');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMsg(null);
        if (!email || !firstName || !lastName || !password) return setError('All fields are required');

        setIsLoading(true);
        try {
            await AuthService.register({
                email,
                first_name: firstName,
                last_name: lastName,
                password,
                is_active: false
            });
            setSuccessMsg("Your email has been registered! We'll send you an email for your credentials soon...");
            setTimeout(() => {
                setView('login');
                setSuccessMsg(null);
            }, 3500);
        } catch (err: any) {
            setError(err.message || 'Registry failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMsg(null);
        if (!email) return setError('Email is required');
        
        setIsLoading(true);
        // Simulator for forgot password
        setTimeout(() => {
            setIsLoading(false);
            setError('Recovery protocol transmitted to your email.');
        }, 1500);
    };

    const handleGoogleSignIn = async () => {
        setError(null);
        setIsLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google'
            });
            if (error) throw error;
            // The OAuth redirection will handle the closing session logic once redirected
        } catch (err: any) {
            setError(err.message || 'Google authentication failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleQuickAccess = async (demoEmail: string) => {
        setError(null);
        setSuccessMsg(null);
        setIsLoading(true);
        try {
            await signIn(demoEmail, 'password123', true);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Quick access login failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-modal-overlay" style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20
        }}>
            <style dangerouslySetInnerHTML={{ __html: `
                .auth-modal-overlay {
                    animation: fadeIn 0.4s ease-out;
                    background: rgba(0, 0, 0, 0.4);
                    backdrop-filter: blur(20px);
                }
                .auth-modal-content {
                    animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1);
                    width: 100%;
                    max-width: 460px;
                    background: ${COLOR.bg};
                    border: 1px solid ${COLOR.border};
                    border-radius: 28px;
                    padding: 36px;
                    position: relative;
                    box-shadow: 0 30px 80px rgba(0,0,0,0.6);
                }
                .auth-close {
                    position: absolute; top: 24px; right: 24px;
                    width: 40px; height: 40px; border-radius: 12px;
                    display: flex; alignItems: center; justifyContent: center;
                    background: ${COLOR.inputBg}; color: ${COLOR.textMuted};
                    border: none; cursor: pointer; transition: all 0.2s;
                }
                .auth-close:hover { background: ${COLOR.border}; color: ${COLOR.text}; transform: rotate(90deg); }
                
                .auth-input-group { margin-bottom: 16px; }
                .auth-input-label { display: block; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: ${COLOR.primary}; margin-bottom: 6px; margin-left: 4px; }
                .auth-input-wrap { position: relative; }
                .auth-input-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: ${COLOR.textMuted}; }
                .auth-input {
                    width: 100%; background: ${COLOR.inputBg}; border: 1px solid ${COLOR.border};
                    border-radius: 12px; padding: 12px 12px 12px 42px; color: ${COLOR.text};
                    font-size: 14px; font-weight: 500; outline: none; transition: all 0.2s;
                }
                .auth-input:focus { border-color: ${COLOR.primary}; background: ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}; }
                
                .auth-cta {
                    width: 100%; padding: 16px; border-radius: 14px; border: none;
                    background: ${isDark ? `linear-gradient(135deg, ${COLOR.gold}, ${COLOR.goldLight})` : COLOR.primary};
                    color: ${isDark ? '#000' : '#fff'}; font-weight: 800; font-size: 15px;
                    cursor: pointer; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                    display: flex; alignItems: center; justifyContent: center; gap: 8px;
                    margin-top: 12px;
                }
                .auth-cta:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(0,0,0,0.2); opacity: 0.9; }
                .auth-cta:active { transform: translateY(0); }
                .auth-cta:disabled { opacity: 0.6; cursor: not-allowed; }

                .auth-google-btn {
                    width: 100%; padding: 14px; border-radius: 14px;
                    background: ${isDark ? 'rgba(255,255,255,0.03)' : '#fff'};
                    border: 1px solid ${COLOR.border}; color: ${COLOR.text};
                    font-size: 14px; font-weight: 700; cursor: pointer;
                    display: flex; alignItems: center; justifyContent: center; gap: 12px;
                    transition: all 0.2s;
                }
                .auth-google-btn:hover { background: ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.02)'}; border-color: ${COLOR.primary}40; }
                .auth-google-btn:disabled { opacity: 0.6; cursor: not-allowed; }

                .quick-access-box { margin-top: 24px; padding-top: 24px; border-top: 1px solid ${COLOR.border}; }
                .quick-access-title { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: ${COLOR.textMuted}; margin-bottom: 12px; text-align: center; }
                .quick-access-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
                .quick-access-btn {
                    padding: 16px 8px; border-radius: 12px;
                    background: ${isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'};
                    border: 1px solid ${COLOR.border}; color: ${COLOR.textMuted}; font-size: 11px; font-weight: 700;
                    cursor: pointer; transition: all 0.2s; text-align: center;
                    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
                }
                .quick-access-btn:hover { background: ${COLOR.primary}15; border-color: ${COLOR.primary}; color: ${COLOR.primary}; transform: translateY(-2px); }
                
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(40px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
            ` }} />

            <div className="auth-modal-content" onClick={e => e.stopPropagation()}>
                <button className="auth-close" onClick={onClose}><X size={20} /></button>

                {/* View Header */}
                <div style={{ marginBottom: 32, textAlign: 'center' }}>
                    <div style={{ 
                        width: 56, height: 56, borderRadius: 16, 
                        background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', 
                        border: `1px solid ${COLOR.border}`,
                        display: 'flex', 
                        alignItems: 'center', justifyContent: 'center', 
                        margin: '0 auto 16px', padding: 10
                    }}>
                        <img 
                            src={getWebAsset(isDark ? require('@/assets/images/logo-light.png') : require('@/assets/images/index.png'))}
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            alt="Brand Logo"
                        />
                    </div>
                    <h2 style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.03em', color: COLOR.text, margin: 0 }}>
                        {view === 'login' && 'Authenticate'}
                        {view === 'signup' && 'Request Access'}
                        {view === 'forgot' && 'Account Recovery'}
                    </h2>
                    <p style={{ color: COLOR.textMuted, fontSize: 13, marginTop: 6 }}>
                        {view === 'login' && 'Enter your credentials to access the platform.'}
                        {view === 'signup' && 'Apply for field clearance and registry entry.'}
                        {view === 'forgot' && 'Initiate credential reset sequence.'}
                    </p>
                </div>

                {error && (
                    <div style={{ 
                        background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', 
                        padding: '12px 16px', borderRadius: 12, color: '#f87171', fontSize: 13, 
                        marginBottom: 24, textAlign: 'center' 
                    }}>
                        {error}
                    </div>
                )}
                
                {successMsg && (
                    <div style={{ 
                        background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)', 
                        padding: '12px 16px', borderRadius: 12, color: '#4ade80', fontSize: 13, 
                        marginBottom: 24, textAlign: 'center' 
                    }}>
                        {successMsg}
                    </div>
                )}

                <form onSubmit={view === 'login' ? handleLogin : view === 'signup' ? handleSignup : handleReset}>
                    {view === 'signup' && (
                        <div style={{ display: 'flex', gap: 12, marginBottom: 4 }}>
                            <div className="auth-input-group" style={{ flex: 1 }}>
                                <span className="auth-input-label">First Name</span>
                                <div className="auth-input-wrap">
                                    <User size={18} className="auth-input-icon" />
                                    <input 
                                        type="text" className="auth-input" placeholder="Aymen" 
                                        value={firstName} onChange={e => setFirstName(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="auth-input-group" style={{ flex: 1 }}>
                                <span className="auth-input-label">Last Name</span>
                                <div className="auth-input-wrap">
                                    <User size={18} className="auth-input-icon" />
                                    <input 
                                        type="text" className="auth-input" placeholder="Dev" 
                                        value={lastName} onChange={e => setLastName(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="auth-input-group">
                        <span 
                            className="auth-input-label" 
                            style={{ cursor: 'cell', display: 'inline-block' }}
                            onClick={() => {
                                setEmail('admin@admin.com');
                                setPassword('password123');
                            }}
                        >
                            Enterprise Email
                        </span>
                        <div className="auth-input-wrap">
                            <Mail size={18} className="auth-input-icon" />
                            <input 
                                type="email" className="auth-input" placeholder="name@enterprise.com" 
                                value={email} onChange={e => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    {view !== 'forgot' && (
                        <div className="auth-input-group">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span className="auth-input-label">Security Key</span>
                                {view === 'login' && (
                                    <span 
                                        onClick={() => setView('forgot')}
                                        style={{ fontSize: 11, fontWeight: 700, color: COLOR.textMuted, cursor: 'pointer' }}
                                    >
                                        Forgot?
                                    </span>
                                )}
                            </div>
                            <div className="auth-input-wrap">
                                <Lock size={18} className="auth-input-icon" />
                                <input 
                                    type={showPassword ? "text" : "password"} className="auth-input" placeholder="••••••••" 
                                    value={password} onChange={e => setPassword(e.target.value)}
                                />
                                <div 
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: COLOR.textMuted }}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </div>
                            </div>
                        </div>
                    )}

                    <button className="auth-cta" type="submit" disabled={isLoading}>
                        {isLoading ? 'Processing Signal...' : (
                            <>
                                {view === 'login' && 'Launch Platform'}
                                {view === 'signup' && 'Submit Registry'}
                                {view === 'forgot' && 'Transmit Protocol'}
                                <ArrowRight size={18} />
                            </>
                        )}
                    </button>
                </form>

                {view !== 'forgot' && (
                    <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '24px 0' }}>
                            <div style={{ flex: 1, height: 1, background: COLOR.border }} />
                            <span style={{ fontSize: 10, fontWeight: 900, color: COLOR.textMuted, letterSpacing: '0.1em' }}>OR</span>
                            <div style={{ flex: 1, height: 1, background: COLOR.border }} />
                        </div>

                        <button 
                            className="auth-google-btn" 
                            onClick={handleGoogleSignIn}
                            disabled={isLoading}
                        >
                            <img 
                                src={getWebAsset(require('@/assets/images/google_logo.png'))} 
                                style={{ width: 18, height: 18, objectFit: 'contain' }} 
                                alt="Google Logo" 
                            />
                            Continue with Google Identity
                        </button>
                        
                        {view === 'login' && (
                            <div className="quick-access-box">
                                <div className="quick-access-title">Fast Access Protocol (Demo)</div>
                                <div className="quick-access-grid">
                                    <button className="quick-access-btn" type="button" onClick={() => handleQuickAccess('admin@admin.com')}>
                                        <ShieldCheck size={20} />
                                        <span>Admin</span>
                                    </button>
                                    <button className="quick-access-btn" type="button" onClick={() => handleQuickAccess('supervisor@sup.com')}>
                                        <User size={20} />
                                        <span>Supervisor</span>
                                    </button>
                                    <button className="quick-access-btn" type="button" onClick={() => handleQuickAccess('merch@merch.com')}>
                                        <ArrowRight size={20} />
                                        <span>Merchandiser</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}

                <div style={{ marginTop: 32, textAlign: 'center', fontSize: 13, color: COLOR.textMuted }}>
                    {view === 'login' && (
                        <>
                            New operative? <span onClick={() => setView('signup')} style={{ color: COLOR.primary, fontWeight: 700, cursor: 'pointer' }}>Apply for access</span>
                        </>
                    )}
                    {view === 'signup' && (
                        <>
                            Registry active? <span onClick={() => setView('login')} style={{ color: COLOR.primary, fontWeight: 700, cursor: 'pointer' }}>Authenticate identity</span>
                        </>
                    )}
                    {view === 'forgot' && (
                        <>
                            Remembered password? <span onClick={() => setView('login')} style={{ color: COLOR.primary, fontWeight: 700, cursor: 'pointer' }}>Back to login</span>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
