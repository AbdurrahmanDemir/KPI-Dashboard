import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import {
    IconLayoutDashboard,
    IconTarget,
    IconTrendingUp,
    IconChartBar,
    IconChartHistogram,
    IconChartDonut3,
    IconRoute,
    IconTable,
    IconUpload,
    IconFileExport,
    IconUsers,
    IconShieldLock,
    IconSettings,
    IconMenu2,
    IconLogout
} from '@tabler/icons-react';

export default function MainLayout({ children }) {
    const { user, logout } = useAuthStore();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const navItems = [
        { path: '/', label: 'Genel Bakis', icon: IconLayoutDashboard },
        { path: '/marketing', label: 'Pazarlama Analizi', icon: IconTarget },
        { path: '/sales', label: 'Satis Analizi', icon: IconTrendingUp },
        { path: '/channels', label: 'Kanal Analizi', icon: IconChartBar },
        { path: '/campaigns', label: 'Kampanya Analizi', icon: IconChartHistogram },
        { path: '/traffic', label: 'Trafik Analizi', icon: IconChartDonut3 },
        { path: '/funnel', label: 'Funnel Analizi', icon: IconRoute },
        { path: '/cohort', label: 'Cohort Analizi', icon: IconTable },
        { path: '/import', label: 'Veri Yukleme', icon: IconUpload, allowedRoles: ['admin', 'marketing_manager'] },
        { path: '/export', label: 'Raporlama', icon: IconFileExport },
        { path: '/users', label: 'Takim Yonetimi', icon: IconUsers, adminOnly: true },
        { path: '/logs', label: 'Denetim Loglari', icon: IconShieldLock, adminOnly: true },
        { path: '/settings', label: 'Ayarlar', icon: IconSettings, allowedRoles: ['admin', 'marketing_manager'] },
    ];

    const handleLogout = async () => {
        await logout();
        window.location.href = '/login';
    };

    return (
        <div style={{ display: 'flex', height: '100vh', width: '100vw', background: 'var(--color-bg-primary)', overflow: 'hidden' }}>
            <aside style={{ width: sidebarOpen ? '280px' : '0px', transition: 'width 0.3s', background: 'var(--color-bg-secondary)', borderRight: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: 'var(--shadow-card)', zIndex: 100 }}>
                <div style={{ height: '70px', display: 'flex', alignItems: 'center', padding: '0 24px', borderBottom: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                        <span style={{ color: 'var(--color-accent-primary)' }}>KPI</span> DASHBOARD
                    </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '16px 12px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '8px', paddingLeft: '12px', textTransform: 'uppercase' }}>
                        Ana Menu
                    </div>
                    {navItems.map((item) => {
                        if (item.adminOnly && user?.role !== 'admin') return null;
                        if (item.allowedRoles && !item.allowedRoles.includes(user?.role)) return null;
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
                                    fontSize: '14px'
                                }}
                            >
                                <item.icon stroke={1.5} size={20} />
                                {item.label}
                            </Link>
                        );
                    })}
                </div>
            </aside>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <header style={{ height: '70px', background: 'var(--color-bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <IconMenu2 stroke={1.5} size={24} />
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>{user?.name || 'Kullanici'}</span>
                            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>
                                {user?.role === 'admin' ? 'Yonetici' : user?.role === 'marketing_manager' ? 'Pazarlama Yetkilisi' : 'Goruntuleyici'}
                            </span>
                        </div>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e5f3fb', color: 'var(--color-accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                            {user?.name?.charAt(0) || 'U'}
                        </div>
                        <button onClick={handleLogout} style={{ border: 'none', background: 'transparent', color: 'var(--color-accent-danger)', cursor: 'pointer', padding: '6px', display: 'flex' }} title="Cikis Yap">
                            <IconLogout stroke={1.5} size={20} />
                        </button>
                    </div>
                </header>

                <main style={{ flex: 1, overflowY: 'auto' }}>
                    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
