import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

/**
 * Korumalı Route — Giriş yapılmamışsa login'e yönlendirir
 */
export default function ProtectedRoute({ children, requiredRole = null }) {
    const { isAuthenticated, isLoading, user } = useAuthStore();
    const location = useLocation();

    if (isLoading) {
        return (
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                height: '100vh', background: 'var(--color-bg-primary)',
                flexDirection: 'column', gap: 12,
            }}>
                <div className="spinner" />
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>
                    Oturum kontrol ediliyor...
                </p>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (requiredRole && user?.role !== requiredRole) {
        return <Navigate to="/" replace />;
    }

    return children;
}
