import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);

    const { login } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || '/';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email.trim(), password);
            navigate(from, { replace: true });
        } catch (err) {
            const msg = err?.response?.data?.error?.message || 'Giriş başarısız. Bilgilerinizi kontrol edin.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const fillDemo = (role) => {
        if (role === 'admin') {
            setEmail('admin@kpidashboard.com');
            setPassword('admin123');
        } else {
            setEmail('viewer@kpidashboard.com');
            setPassword('viewer123');
        }
        setError('');
    };

    return (
        <div style={styles.page}>
            {/* Arkaplan gradient ışıkları */}
            <div style={styles.glowTop} />
            <div style={styles.glowBottom} />

            <div style={styles.card}>
                {/* Logo alanı */}
                <div style={styles.logoWrap}>
                    <div style={styles.logoIcon}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                            <path d="M3 3v18h18" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M7 16l4-5 3 3 4-6" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <div>
                        <h1 style={styles.logoTitle}>KPI Dashboard</h1>
                        <p style={styles.logoSub}>Pazarlama & E-Ticaret Analitik Platformu</p>
                    </div>
                </div>

                <h2 style={styles.heading}>Hesabınıza giriş yapın</h2>

                {/* Hata mesajı */}
                {error && (
                    <div style={styles.errorBox}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                            <circle cx="12" cy="12" r="10" stroke="#ef4444" strokeWidth="2" />
                            <path d="M12 8v4M12 16h.01" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.fieldGroup}>
                        <label style={styles.label} htmlFor="email">E-posta</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="ornek@sirket.com"
                            required
                            autoComplete="email"
                            style={styles.input}
                            onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
                        />
                    </div>

                    <div style={styles.fieldGroup}>
                        <label style={styles.label} htmlFor="password">Şifre</label>
                        <div style={styles.passwordWrap}>
                            <input
                                id="password"
                                type={showPass ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                autoComplete="current-password"
                                style={{ ...styles.input, paddingRight: 44 }}
                                onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                                onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPass(!showPass)}
                                style={styles.eyeBtn}
                                aria-label={showPass ? 'Şifreyi gizle' : 'Şifreyi göster'}
                            >
                                {showPass ? '🙈' : '👁️'}
                            </button>
                        </div>
                    </div>

                    <button
                        id="login-submit-btn"
                        type="submit"
                        disabled={loading}
                        style={{
                            ...styles.submitBtn,
                            opacity: loading ? 0.7 : 1,
                            cursor: loading ? 'wait' : 'pointer',
                        }}
                    >
                        {loading ? (
                            <span style={styles.loadingWrap}>
                                <span style={styles.spinner} />
                                Giriş yapılıyor...
                            </span>
                        ) : (
                            'Giriş Yap'
                        )}
                    </button>
                </form>

                {/* Demo hesaplar */}
                <div style={styles.demoSection}>
                    <p style={styles.demoTitle}>Demo Hesaplar</p>
                    <div style={styles.demoRow}>
                        <button
                            id="demo-admin-btn"
                            onClick={() => fillDemo('admin')}
                            style={styles.demoBtn}
                        >
                            <span style={styles.demoBadge('admin')}>Admin</span>
                            admin@kpidashboard.com
                        </button>
                        <button
                            id="demo-viewer-btn"
                            onClick={() => fillDemo('viewer')}
                            style={styles.demoBtn}
                        >
                            <span style={styles.demoBadge('viewer')}>Viewer</span>
                            viewer@kpidashboard.com
                        </button>
                    </div>
                </div>

                <p style={styles.footer}>
                    Sporthink · KPI Dashboard v2.0
                </p>
            </div>
        </div>
    );
}

// ─── Stiller ──────────────────────────────────────────────────────────────────
const styles = {
    page: {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-bg-primary)',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'var(--font-sans)',
        padding: '20px',
    },
    glowTop: {
        position: 'absolute',
        top: -200,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 600,
        height: 600,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
    },
    glowBottom: {
        position: 'absolute',
        bottom: -200,
        right: -100,
        width: 400,
        height: 400,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
    },
    card: {
        width: '100%',
        maxWidth: 440,
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-xl)',
        padding: '40px 36px',
        boxShadow: 'var(--shadow-card)',
        position: 'relative',
        zIndex: 1,
    },
    logoWrap: {
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        marginBottom: 32,
    },
    logoIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))',
        border: '1px solid rgba(99,102,241,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    logoTitle: {
        fontSize: 18,
        fontWeight: 700,
        color: 'var(--color-text-primary)',
        margin: 0,
        lineHeight: 1.2,
    },
    logoSub: {
        fontSize: 11,
        color: 'var(--color-text-muted)',
        margin: '2px 0 0',
    },
    heading: {
        fontSize: 22,
        fontWeight: 700,
        color: 'var(--color-text-primary)',
        margin: '0 0 24px',
    },
    errorBox: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: 'rgba(239,68,68,0.1)',
        border: '1px solid rgba(239,68,68,0.3)',
        borderRadius: 8,
        padding: '10px 14px',
        fontSize: 13,
        color: '#f87171',
        marginBottom: 20,
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
    },
    fieldGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
    },
    label: {
        fontSize: 13,
        fontWeight: 500,
        color: 'var(--color-text-secondary)',
    },
    input: {
        width: '100%',
        padding: '10px 14px',
        background: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
        borderRadius: 8,
        color: 'var(--color-text-primary)',
        fontSize: 14,
        outline: 'none',
        transition: 'border-color 0.2s',
        boxSizing: 'border-box',
    },
    passwordWrap: {
        position: 'relative',
    },
    eyeBtn: {
        position: 'absolute',
        right: 12,
        top: '50%',
        transform: 'translateY(-50%)',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontSize: 16,
        padding: 0,
        lineHeight: 1,
    },
    submitBtn: {
        width: '100%',
        padding: '12px',
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        border: 'none',
        borderRadius: 8,
        color: '#fff',
        fontSize: 15,
        fontWeight: 600,
        cursor: 'pointer',
        marginTop: 4,
        transition: 'opacity 0.2s, transform 0.1s',
        boxShadow: '0 4px 15px rgba(99,102,241,0.35)',
    },
    loadingWrap: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
    },
    spinner: {
        width: 16,
        height: 16,
        border: '2px solid rgba(255,255,255,0.3)',
        borderTopColor: '#fff',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
    },
    demoSection: {
        marginTop: 28,
        paddingTop: 20,
        borderTop: '1px solid var(--color-border)',
    },
    demoTitle: {
        fontSize: 12,
        color: 'var(--color-text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        marginBottom: 10,
    },
    demoRow: {
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
    },
    demoBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
        borderRadius: 8,
        padding: '9px 12px',
        color: 'var(--color-text-secondary)',
        fontSize: 13,
        cursor: 'pointer',
        transition: 'border-color 0.2s',
    },
    demoBadge: (role) => ({
        fontSize: 10,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        padding: '2px 7px',
        borderRadius: 4,
        background: role === 'admin' ? 'rgba(99,102,241,0.2)' : 'rgba(16,185,129,0.15)',
        color: role === 'admin' ? '#818cf8' : '#34d399',
        border: `1px solid ${role === 'admin' ? 'rgba(99,102,241,0.3)' : 'rgba(16,185,129,0.25)'}`,
    }),
    footer: {
        textAlign: 'center',
        fontSize: 11,
        color: 'var(--color-text-muted)',
        marginTop: 24,
        marginBottom: 0,
    },
};
