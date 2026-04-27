import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import { useEffect } from 'react';
import ProtectedRoute from './components/ui/ProtectedRoute';
import LoginPage from './pages/LoginPage';

// Lazy loading ile performans optimizasyonu
const ImportPage = lazy(() => import('./pages/ImportPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const MarketingAnalysisPage = lazy(() => import('./pages/MarketingAnalysisPage'));
const SalesAnalysisPage = lazy(() => import('./pages/SalesAnalysisPage'));
const ChannelAnalysisPage = lazy(() => import('./pages/ChannelAnalysisPage'));
const CampaignAnalysisPage = lazy(() => import('./pages/CampaignAnalysisPage'));
const TrafficAnalysisPage = lazy(() => import('./pages/TrafficAnalysisPage'));
const FunnelAnalysisPage = lazy(() => import('./pages/FunnelAnalysisPage'));
const CohortAnalysisPage = lazy(() => import('./pages/CohortAnalysisPage'));
const ExportPage = lazy(() => import('./pages/ExportPage'));
const UsersPage = lazy(() => import('./pages/UsersPage'));
const LogsPage = lazy(() => import('./pages/LogsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const SegmentsPage = lazy(() => import('./pages/SegmentsPage'));
const IntegrationsPage = lazy(() => import('./pages/IntegrationsPage'));

const PageLoader = () => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '60vh', color: 'var(--color-text-muted)', fontSize: '14px',
    flexDirection: 'column', gap: '12px'
  }}>
    <div className="spinner" />
    Sayfa yükleniyor...
  </div>
);

function App() {
  const { init } = useAuthStore();

  useEffect(() => {
    init();
  }, [init]);

  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/marketing" element={<ProtectedRoute allowedRoles={['admin', 'marketing_manager', 'viewer']}><MarketingAnalysisPage /></ProtectedRoute>} />
          <Route path="/sales" element={<ProtectedRoute><SalesAnalysisPage /></ProtectedRoute>} />
          <Route path="/channels" element={<ProtectedRoute allowedRoles={['admin', 'marketing_manager', 'viewer']}><ChannelAnalysisPage /></ProtectedRoute>} />
          <Route path="/campaigns" element={<ProtectedRoute allowedRoles={['admin', 'marketing_manager', 'viewer']}><CampaignAnalysisPage /></ProtectedRoute>} />
          <Route path="/traffic" element={<ProtectedRoute><TrafficAnalysisPage /></ProtectedRoute>} />
          <Route path="/funnel" element={<ProtectedRoute><FunnelAnalysisPage /></ProtectedRoute>} />
          <Route path="/cohort" element={<ProtectedRoute><CohortAnalysisPage /></ProtectedRoute>} />
          <Route path="/import" element={<ProtectedRoute allowedRoles={['admin', 'marketing_manager']}><ImportPage /></ProtectedRoute>} />
          <Route path="/export" element={<ProtectedRoute><ExportPage /></ProtectedRoute>} />
          <Route path="/segments" element={<ProtectedRoute allowedRoles={['admin', 'marketing_manager']}><SegmentsPage /></ProtectedRoute>} />
          <Route path="/integrations" element={<ProtectedRoute allowedRoles={['admin', 'marketing_manager']}><IntegrationsPage /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute requiredRole="admin"><UsersPage /></ProtectedRoute>} />
          <Route path="/logs" element={<ProtectedRoute requiredRole="admin"><LogsPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute allowedRoles={['admin', 'marketing_manager']}><SettingsPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
