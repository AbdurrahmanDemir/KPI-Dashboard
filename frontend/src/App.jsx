import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Sayfalar hafta 8'de eklenecek — şimdilik placeholder
const ComingSoon = ({ page }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', height: '100vh',
    background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)',
    fontFamily: 'var(--font-sans)',
  }}>
    <div style={{ fontSize: 48, marginBottom: 16 }}>🚀</div>
    <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>KPI Dashboard</h1>
    <p style={{ color: 'var(--color-text-secondary)', marginBottom: 4 }}>
      <strong style={{ color: 'var(--color-accent-primary)' }}>{page}</strong> sayfası hazırlanıyor...
    </p>
    <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
      Backend: <code>http://localhost:3001</code> · Swagger: <code>http://localhost:3001/api-docs</code>
    </p>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth */}
        <Route path="/login" element={<ComingSoon page="Login" />} />

        {/* Dashboard */}
        <Route path="/" element={<ComingSoon page="Dashboard" />} />
        <Route path="/dashboard" element={<Navigate to="/" replace />} />

        {/* Analiz Sayfaları */}
        <Route path="/channels" element={<ComingSoon page="Kanal Analizi" />} />
        <Route path="/campaigns" element={<ComingSoon page="Kampanya Analizi" />} />
        <Route path="/traffic" element={<ComingSoon page="Trafik Analizi" />} />
        <Route path="/funnel" element={<ComingSoon page="Funnel Analizi" />} />
        <Route path="/cohort" element={<ComingSoon page="Cohort Analizi" />} />

        {/* Araçlar */}
        <Route path="/import" element={<ComingSoon page="Veri Import" />} />
        <Route path="/segments" element={<ComingSoon page="Segment Yönetimi" />} />
        <Route path="/filters" element={<ComingSoon page="Filtre Yönetimi" />} />
        <Route path="/views" element={<ComingSoon page="Kaydedilmiş Görünümler" />} />
        <Route path="/export" element={<ComingSoon page="Export & Raporlama" />} />
        <Route path="/logs" element={<ComingSoon page="Log & Sistem İzleme" />} />
        <Route path="/settings" element={<ComingSoon page="Ayarlar" />} />

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
