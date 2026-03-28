import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import ProtectedRoute from './components/ui/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import ImportPage from './pages/ImportPage';
import DashboardPage from './pages/DashboardPage';
import MarketingAnalysisPage from './pages/MarketingAnalysisPage';
import SalesAnalysisPage from './pages/SalesAnalysisPage';
import ChannelAnalysisPage from './pages/ChannelAnalysisPage';
import CampaignAnalysisPage from './pages/CampaignAnalysisPage';
import TrafficAnalysisPage from './pages/TrafficAnalysisPage';
import FunnelAnalysisPage from './pages/FunnelAnalysisPage';
import CohortAnalysisPage from './pages/CohortAnalysisPage';
import ExportPage from './pages/ExportPage';
import UsersPage from './pages/UsersPage';
import LogsPage from './pages/LogsPage';
import SettingsPage from './pages/SettingsPage';

function App() {
  const { init } = useAuthStore();

  useEffect(() => {
    init();
  }, [init]);

  return (
    <BrowserRouter>
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
        <Route path="/users" element={<ProtectedRoute requiredRole="admin"><UsersPage /></ProtectedRoute>} />
        <Route path="/logs" element={<ProtectedRoute requiredRole="admin"><LogsPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute allowedRoles={['admin', 'marketing_manager']}><SettingsPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
