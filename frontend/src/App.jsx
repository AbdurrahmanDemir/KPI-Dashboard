import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import ProtectedRoute from './components/ui/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import ImportPage from './pages/ImportPage';
import DashboardPage from './pages/DashboardPage';
import MarketingAnalysisPage from './pages/MarketingAnalysisPage';
import SalesAnalysisPage from './pages/SalesAnalysisPage';
import ExportPage from './pages/ExportPage';
import UsersPage from './pages/UsersPage';
import LogsPage from './pages/LogsPage';
import SettingsPage from './pages/SettingsPage';

// Placeholder sayfası — ilerleyen haftalar da gerçek sayfalarla değişecek
const ComingSoon = ({ page }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', height: '100vh',
    background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)',
    fontFamily: 'var(--font-sans)',
  }}>
    <div style={{ fontSize: 48, marginBottom: 16 }}>�</div>
    <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>KPI Dashboard</h1>
    <p style={{ color: 'var(--color-text-secondary)', marginBottom: 4 }}>
      <strong style={{ color: 'var(--color-accent-primary)' }}>{page}</strong> sayfası geliştiriliyor...
    </p>
    <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
      Backend: <code>http://localhost:3001</code> · Swagger: <code>http://localhost:3001/api-docs</code>
    </p>
    <button
      onClick={() => useAuthStore.getState().logout().then(() => window.location.href = '/login')}
      style={{
        marginTop: 24, padding: '8px 20px',
        background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
        borderRadius: 8, color: '#818cf8', cursor: 'pointer', fontSize: 13,
      }}
    >
      Çıkış Yap
    </button>
  </div>
);

function App() {
  const { init } = useAuthStore();

  // Uygulama başladığında token kontrolü yap
  useEffect(() => {
    init();
  }, [init]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public: Login */}
        <Route path="/login" element={<LoginPage />} />

        {/* Korumalı: Dashboard */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Korumalı: Analiz Sayfaları */}
        <Route path="/marketing" element={<ProtectedRoute><MarketingAnalysisPage /></ProtectedRoute>} />
        <Route path="/sales" element={<ProtectedRoute><SalesAnalysisPage /></ProtectedRoute>} />
        
        <Route path="/channels" element={<ProtectedRoute><ComingSoon page="Kanal Analizi" /></ProtectedRoute>} />
        <Route path="/campaigns" element={<ProtectedRoute><ComingSoon page="Kampanya Analizi" /></ProtectedRoute>} />
        <Route path="/traffic" element={<ProtectedRoute><ComingSoon page="Trafik Analizi" /></ProtectedRoute>} />
        <Route path="/funnel" element={<ProtectedRoute><ComingSoon page="Funnel Analizi" /></ProtectedRoute>} />
        <Route path="/cohort" element={<ProtectedRoute><ComingSoon page="Cohort Analizi" /></ProtectedRoute>} />

        {/* Korumalı: Araçlar & Yönetim */}
        <Route path="/import" element={<ProtectedRoute><ImportPage /></ProtectedRoute>} />
        <Route path="/export" element={<ProtectedRoute><ExportPage /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute requiredRole="admin"><UsersPage /></ProtectedRoute>} />
        <Route path="/logs" element={<ProtectedRoute requiredRole="admin"><LogsPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
