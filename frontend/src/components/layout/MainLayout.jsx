import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { 
    IconLayoutDashboard, 
    IconTarget, 
    IconTrendingUp, 
    IconUpload, 
    IconFileExport, 
    IconUsers, 
    IconShieldLock, 
    IconSettings, 
    IconMenu2, 
    IconArrowUpRight,
    IconLogout
} from '@tabler/icons-react';

export default function MainLayout({ children }) {
    const { user, logout } = useAuthStore();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const navItems = [
        { path: '/', label: 'Genel Bakış', icon: IconLayoutDashboard },
        { path: '/marketing', label: 'Pazarlama Analizi', icon: IconTarget },
        { path: '/sales', label: 'Satış Analizi', icon: IconTrendingUp },
        { path: '/import', label: 'Veri Yükleme', icon: IconUpload },
        { path: '/export', label: 'Raporlama', icon: IconFileExport },
        { path: '/users', label: 'Takım Yönetimi', icon: IconUsers, adminOnly: true },
        { path: '/logs', label: 'Denetim Logları', icon: IconShieldLock, adminOnly: true },
        { path: '/settings', label: 'Ayarlar', icon: IconSettings },
    ];

    const handleLogout = async () => {
        await logout();
        window.location.href = '/login';
    };

    return (
        <div style={{ display: 'flex', height: '100vh', width: '100vw', background: 'var(--color-bg-primary)', overflow: 'hidden' }}>
            
            {/* ─── SIDEBAR ──────────────────────────────────────────────────────────── */}
            <aside 
                style={{ 
                    width: sidebarOpen ? '270px' : '0px', 
                    transition: 'width 0.3s', 
                    background: 'var(--color-bg-secondary)', 
                    borderRight: '1px solid var(--color-border)', 
                    display: 'flex', 
                    flexDirection: 'column',
                    overflow: 'hidden',
                    boxShadow: 'var(--shadow-card)',
                    zIndex: 100
                }}
            >
                <div style={{ height: '70px', display: 'flex', alignItems: 'center', padding: '0 24px', borderBottom: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                        <span style={{ color: 'var(--color-accent-primary)' }}>KPI</span> DASHBOARD
                    </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '16px 12px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '8px', paddingLeft: '12px', textTransform: 'uppercase' }}>
                        Ana Menü
                    </div>
                    {navItems.map(item => {
                        if (item.adminOnly && user?.role !== 'admin') return null;

                        const isActive = location.pathname === item.path;

                        return (
                            <Link 
                                key={item.path} 
                                to={item.path}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '10px 16px',
                                    marginBottom: '6px',
                                    borderRadius: '7px',
                                    color: isActive ? '#fff' : 'var(--color-text-secondary)',
                                    background: isActive ? 'var(--color-accent-primary)' : 'transparent',
                                    textDecoration: 'none',
                                    fontWeight: isActive ? 600 : 500,
                                    fontSize: '14px',
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                    boxShadow: isActive ? '0 2px 6px rgba(0, 133, 219, 0.25)' : 'none'
                                }}
                            >
                                <item.icon stroke={1.5} size={20} />
                                {item.label}
                            </Link>
                        )
                    })}
                </div>

                <div style={{ padding: '24px 16px' }}>
                    <div style={{ background: 'var(--color-bg-tertiary)', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '8px' }}>Pro Sürüme Geç!</div>
                        <button style={{ width: '100%', padding: '8px', background: 'var(--color-accent-primary)', color: 'white', border: 'none', borderRadius: '50px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 6px rgba(0, 133, 219, 0.2)' }}>
                            Upgrade to Pro
                        </button>
                    </div>
                </div>
            </aside>

            {/* ─── MAIN CONTENT AREA ──────────────────────────────────────────────── */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                
                {/* ─── HEADER ───────────────────────────────────────────────────────── */}
                <header style={{ height: '70px', background: 'var(--color-bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', zIndex: 90 }}>
                    <button 
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <IconMenu2 stroke={1.5} size={24} />
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <button style={{ padding: '8px 24px', background: 'var(--color-accent-primary)', color: '#fff', borderRadius: '50px', fontSize: '14px', fontWeight: 600, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', marginRight: '8px', boxShadow: '0 2px 6px rgba(0, 133, 219, 0.2)' }}>
                            Upgrade to Pro
                        </button>
                        
                        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>{user?.name || 'Kullanıcı'}</span>
                            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>{user?.role === 'admin' ? 'Yönetici' : 'Görüntüleyici'}</span>
                        </div>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e5f3fb', color: 'var(--color-accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                            {user?.name?.charAt(0) || 'U'}
                        </div>
                        <button onClick={handleLogout} style={{ border: 'none', background: 'transparent', color: 'var(--color-accent-danger)', cursor: 'pointer', padding: '6px', display: 'flex' }} title="Çıkış Yap">
                            <IconLogout stroke={1.5} size={20} />
                        </button>
                    </div>
                </header>

                {/* ─── SCROLLABLE PAGE CONTENT ────────────────────────────────────── */}
                <main style={{ flex: 1, overflowY: 'auto' }}>
                    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                        {children}
                    </div>
                </main>
            </div>

        </div>
    );
}
