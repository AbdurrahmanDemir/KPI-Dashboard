import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import PageGuide from '../ui/PageGuide';
import {
    IconLayoutDashboard,
    IconTarget,
    IconTrendingUp,
    IconChartBar,
    IconChartHistogram,
    IconChartDonut3,
    IconTable,
    IconUpload,
    IconFileExport,
    IconUsers,
    IconShieldLock,
    IconSettings,
    IconMenu2,
    IconLogout,
    IconFilter,
    IconDatabase,
    IconListDetails,
    IconChevronDown,
} from '@tabler/icons-react';

export default function MainLayout({ children }) {
    const { user, logout } = useAuthStore();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [openGroups, setOpenGroups] = useState({
        analysis: true,
        data: true,
        operations: true,
        management: false,
    });

    const navItems = [
        { path: '/', label: 'Genel Bakış', icon: IconLayoutDashboard },
        {
            key: 'analysis',
            label: 'Analizler',
            icon: IconChartBar,
            children: [
                { path: '/marketing', label: 'Pazarlama Analizi', icon: IconTarget },
                { path: '/sales', label: 'Satış Analizi', icon: IconTrendingUp },
                { path: '/channels', label: 'Kanal Analizi', icon: IconChartBar },
                { path: '/campaigns', label: 'Kampanya Analizi', icon: IconChartHistogram },
                { path: '/traffic', label: 'Trafik Analizi', icon: IconChartDonut3 },
                { path: '/cohort', label: 'Cohort Analizi', icon: IconTable },
            ],
        },
        {
            key: 'data',
            label: 'Veri',
            icon: IconDatabase,
            allowedRoles: ['admin', 'marketing_manager'],
            children: [
                { path: '/data/overview', label: 'Veri Özeti', icon: IconListDetails },
                { path: '/data/import', label: 'Veri Yükleme', icon: IconUpload },
                { path: '/data/integrations', label: 'API Entegrasyonları', icon: IconSettings },
            ],
        },
        {
            key: 'operations',
            label: 'Operasyon',
            icon: IconFileExport,
            children: [
                { path: '/segments', label: 'Segment Yönetimi', icon: IconFilter, allowedRoles: ['admin', 'marketing_manager'] },
                { path: '/export', label: 'Raporlama', icon: IconFileExport },
            ],
        },
        {
            key: 'management',
            label: 'Yönetim',
            icon: IconUsers,
            children: [
                { path: '/users', label: 'Takım Yönetimi', icon: IconUsers, adminOnly: true },
                { path: '/logs', label: 'Denetim Logları', icon: IconShieldLock, adminOnly: true },
                { path: '/settings', label: 'Ayarlar', icon: IconSettings, allowedRoles: ['admin', 'marketing_manager'] },
            ],
        },
    ];

    useEffect(() => {
        const nextOpenGroups = {};

        for (const item of navItems) {
            if (!item.children) continue;
            const isGroupActive = item.children.some((child) => location.pathname === child.path);
            if (isGroupActive) {
                nextOpenGroups[item.key] = true;
            }
        }

        if (Object.keys(nextOpenGroups).length > 0) {
            setOpenGroups((prev) => ({ ...prev, ...nextOpenGroups }));
        }
    }, [location.pathname]);

    const canAccessItem = (item) => {
        if (item.adminOnly && user?.role !== 'admin') return false;
        if (item.allowedRoles && !item.allowedRoles.includes(user?.role)) return false;
        return true;
    };

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
                        Ana Menü
                    </div>

                    {navItems.map((item) => {
                        if (!canAccessItem(item)) return null;

                        if (item.children) {
                            const visibleChildren = item.children.filter(canAccessItem);
                            const isGroupActive = visibleChildren.some((child) => location.pathname === child.path || location.pathname.startsWith(`${child.path}/`));
                            const isOpen = openGroups[item.key];

                            return (
                                <div key={item.key} style={{ marginBottom: '8px' }}>
                                    <button
                                        onClick={() => setOpenGroups((prev) => ({ ...prev, [item.key]: !prev[item.key] }))}
                                        style={{
                                            width: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            gap: '12px',
                                            padding: '10px 16px',
                                            borderRadius: '7px',
                                            border: 'none',
                                            cursor: 'pointer',
                                            background: isGroupActive ? 'rgba(30, 64, 175, 0.10)' : 'transparent',
                                            color: isGroupActive ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)',
                                            fontWeight: isGroupActive ? 700 : 500,
                                            fontSize: '14px'
                                        }}
                                    >
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <item.icon stroke={1.5} size={20} />
                                            {item.label}
                                        </span>
                                        <IconChevronDown
                                            stroke={1.5}
                                            size={18}
                                            style={{ transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }}
                                        />
                                    </button>

                                    {isOpen && (
                                        <div style={{ marginTop: '6px', paddingLeft: '14px', borderLeft: '1px solid var(--color-border)' }}>
                                            {visibleChildren.map((child) => {
                                                const isActive = location.pathname === child.path || location.pathname.startsWith(`${child.path}/`);
                                                return (
                                                    <Link
                                                        key={child.path}
                                                        to={child.path}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '10px',
                                                            padding: '9px 14px',
                                                            margin: '4px 0 0 10px',
                                                            borderRadius: '7px',
                                                            color: isActive ? '#fff' : 'var(--color-text-secondary)',
                                                            background: isActive ? 'var(--color-accent-primary)' : 'transparent',
                                                            textDecoration: 'none',
                                                            fontWeight: isActive ? 600 : 500,
                                                            fontSize: '13px'
                                                        }}
                                                    >
                                                        <child.icon stroke={1.5} size={18} />
                                                        {child.label}
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        }

                        const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);

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
                            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>{user?.name || 'Kullanıcı'}</span>
                            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>
                                {user?.role === 'admin' ? 'Yönetici' : user?.role === 'marketing_manager' ? 'Pazarlama Yetkilisi' : 'Görüntüleyici'}
                            </span>
                        </div>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e5f3fb', color: 'var(--color-accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                            {user?.name?.charAt(0) || 'U'}
                        </div>
                        <button onClick={handleLogout} style={{ border: 'none', background: 'transparent', color: 'var(--color-accent-danger)', cursor: 'pointer', padding: '6px', display: 'flex' }} title="Çıkış Yap">
                            <IconLogout stroke={1.5} size={20} />
                        </button>
                    </div>
                </header>

                <main style={{ flex: 1, overflowY: 'auto' }}>
                    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                        {children}
                    </div>
                </main>
                <PageGuide />
            </div>
        </div>
    );
}


