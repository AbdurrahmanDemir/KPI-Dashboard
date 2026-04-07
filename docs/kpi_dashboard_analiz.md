# KPI Dashboard — Proje Analiz Raporu

**Analiz Tarihi:** 2026-03-31  
**Backend:** Node.js + Express + Sequelize  
**Frontend:** React + Vite + Tailwind  

---

## ÖZET SKOR

| Alan | Durum | Notlar |
|------|-------|--------|
| Backend Modeller | ✅ İyi | Dökümanla örtüşüyor, ekstralar var (iyi) |
| Backend API (Routes/Controllers) | ⚠️ Kısmi | Bazı endpoint'ler eksik |
| Backend Servisler | ✅ İyi | KPI hesaplamaları doğru |
| Frontend Sayfalar | ⚠️ Kısmi | Birçok sayfa iskelet düzeyinde |
| Frontend Grafikler | ❌ Eksik | Kritik grafikler hiç yok |
| Import Akışı | ✅ İyi | En olgun modül |
| Drag-Drop / Layout | ❌ Eksik | Dökümanın temel gereksinimi |
| Cross-filter | ❌ Eksik | Dökümanın öncelikli senaryosu |
| URL'e filtre yansıma | ❌ Eksik | Döküman gereksinimi |
| Export | ⚠️ Kısmi | CSV var, XLSX akışı kontrol edilmeli |

---

## 1. 🔴 KRİTİK HATALAR

### 1.1 `MainLayout` Hiçbir Sayfada Wrap Edilmiyor
`App.jsx` incelendiğinde `MainLayout` hiçbir route'ta kullanılmıyor. Sidebar ve header'ın görünmesi `MainLayout`'a bağlıysa **sidebar muhtemelen hiç render edilmiyor** ya da `ProtectedRoute` içinde gizlice wrap ediliyor — kontrol gerekiyor.

```jsx
// App.jsx'de bu kullanım YOK:
<ProtectedRoute><MainLayout><DashboardPage /></MainLayout></ProtectedRoute>
```

### 1.2 `ProtectedRoute` — `requiredRole` vs `allowedRoles` Prop Tutarsızlığı
```jsx
<ProtectedRoute requiredRole="admin">       // /users ve /logs
<ProtectedRoute allowedRoles={['admin'...]}>  // /marketing, /channels, vs.
```
`ProtectedRoute.jsx` her iki prop'u desteklemiyor olabilir → bazı rotalar ya herkese açık ya erişilmez olabilir.

### 1.3 Hatalı Satır Varsa Commit Tamamen Bloklanıyor
`commitImport` şu an hata yoksa commit yapıyor. Ancak:
```js
if (analysis.errors.length > 0) {
    return errorResponse(422, ...); // ❌ Tüm import durduruluyor
}
```
Döküman (Senaryo 4): *"hatalı satırları atlayarak geçerli satırları import edebilmeli"* — bu sağlanmıyor.

### 1.4 React Query v5'te Deprecated Kullanım
```jsx
// DashboardPage.jsx:
disabled={saveViewMutation.isLoading} // ❌ v5'te isPending olmalı
```

### 1.5 Google Ads Spend — Otomatik Micros Dönüşümü Tehlikeli
```js
normalized.spend = (toNumber(normalized.spend) ?? 0) / 1000000;
```
Eğer kullanıcı düz CSV yüklüyorsa (mikros değil) harcama değeri 1.000.000 ile bölünür → sıfıra yakın değerler.

---

## 2. 🟠 ÖNEMLİ EKSİKLİKLER (Döküman gereksinimi karşılanmıyor)

### 2.1 Frontend Grafik Bileşenleri — 4 Kritik Grafik Eksik

| Grafik | Durum |
|--------|-------|
| Line / Area Chart | ✅ TrendChart mevcut |
| Bar Chart | ✅ BarChart mevcut |
| Donut Chart | ✅ DonutChart mevcut |
| **Funnel Chart** | ❌ **YOK** — sadece tablo var |
| **Heatmap** | ❌ **YOK** — hiçbir sayfada yok |
| **Scatter Chart** | ❌ **YOK** — ROAS vs Spend için döküman istiyor |
| **Cohort Heatmap** | ❌ **YOK** — sadece tablo var |

### 2.2 Funnel Analizi Sayfası — Görsel Yok
Döküman: *"adımların görsel analizi, adım bazlı oran hesaplamaları"*  
→ `FunnelAnalysisPage.jsx` yalnızca `DataTable`. ApexCharts funnel/bar chart yok.

### 2.3 Cohort Analizi Sayfası — Heatmap Yok
Döküman: *"cohort heatmap görünümü"*  
→ `CohortAnalysisPage.jsx` yalnızca `DataTable`. Heatmap bileşeni yok.

### 2.4 Drag-Drop Dashboard — Tamamen Eksik
```js
// DashboardPage.jsx — saveViewMutation:
layout_config: { dashboard: 'default', cards: 8 } // ← Gerçek drag-drop verisi değil
```
`react-beautiful-dnd` paketi kurulu ama hiçbir sayfada kullanılmıyor.

### 2.5 URL ↔ Filter Sync Yok
Döküman: *"Aktif filtreler URL parametrelerine yansımalı (sayfa yenilenince filtreler korunur)"*  
→ `filterStore` sadece Zustand memory'de, URL'de parametre yok.

### 2.6 Cross-Filter Yok
Döküman (Senaryo 5): *"kanal filtresine tıklandığında tüm grafikler otomatik güncellenmeli"*  
→ Grafik click event'i `filterStore`'a bağlanmamış.

### 2.7 Segment ve Filtre Yönetimi Sayfaları Yok
`App.jsx`'de `/segments` ve `/filters` route'u tanımlanmamış. Döküman bu sayfaları listeler.

### 2.8 `kpi/trend` Cache'lenmiyor
Summary endpoint MD5 hash + TTL ile cache'leniyor ✅  
Ama `getTrend` her seferinde DB'ye gidiyor — döküman 15dk TTL istiyor.

---

## 3. 🟡 KÜÇÜK SORUNLAR

### 3.1 Türkçe Karakter Sorunları
Birçok sabyfada Türkçe karakterler hatalı:
```
"Kampanya bazli harcama, donusum ve ROAS"   ← CampaignAnalysisPage
"Adim bazli kayiplari"                       ← FunnelAnalysisPage
"Toplanti Notlarina Gore Okuma"              ← MarketingAnalysisPage
"Musteri tekrar satin alma"                  ← CohortAnalysisPage
```

### 3.2 Boş Tablo + Yükleniyor Aynı Anda Görünüyor
```jsx
{isLoading ? <div>Yukleniyor...</div> : null}
<DataTable ... data={data || []} />  // ← data=[] ile zaten render ediliyor
```
Hem spinner hem boş tablo aynı anda ekranda.

### 3.3 Hata Durumu Frontend'de Eksik
`DashboardPage.jsx` → `summaryError` kontrolü var ✅  
Diğer tüm sayfalar → hata state'i yok, kullanıcı boş sayfa görür.

### 3.4 `SalesData`'da `campaign_name` Döküman Veri Setinde Yok
Filter servisi `campaign_name` ile `SalesData`'yı filtreler, model kolona sahip ✅, ama dökümanın satış veri seti şablonunda bu kolon yok → import edilen veriler boş → filtre hiç eşleşmez.

---

## 4. ✅ İYİ YAPILAN KISIMLAR

- **Backend modeller** dökümanın tüm tabloları + ekstralar (`product_name`, `campaign_name`, `attribution_source`, vb.)
- **KPI formülleri** dökümanla birebir: CTR, ROAS, Frequency, CVR, Bounce Rate, Cohort retention, Attribution Gap
- **Import pipeline** (upload → preview → map-columns → validate → commit → delete) eksiksiz ve sağlam
- **JWT auth** + refresh token rotasyonu + logout + audit log yazımı
- **KPI Cache** MD5 hash + TTL 15dk + upsert mantığı
- **Duplicate kontrol** hem dosya içi hem DB düzeyinde
- **Rate limiting** ve **helmet** güvenlik kurulu
- **Swagger** `/api-docs` endpoint'i ayakta

---

## 5. GELİŞTİRME ÖNCELİK SIRASI

| Öncelik | Görev | Tahmini Süre |
|---------|-------|------|
| 🔴 1 | `MainLayout` wrap mantığını doğrula + düzelt | 1 saat |
| 🔴 2 | `ProtectedRoute` prop tutarsızlığını düzelt | 30 dk |
| 🔴 3 | Hatalı satır atlanarak commit (partial import) | 2 saat |
| 🟠 4 | `FunnelChart` bileşeni (ApexCharts) | 3 saat |
| 🟠 5 | `CohortHeatmap` bileşeni (ApexCharts) | 4 saat |
| 🟠 6 | URL ↔ filterStore sync (`useSearchParams`) | 2 saat |
| 🟡 7 | Drag-drop dashboard (react-beautiful-dnd) | 1 gün |
| 🟡 8 | Cross-filter (grafik click → filterStore) | 4 saat |
| 🟡 9 | Scatter Chart (ROAS vs Spend) | 2 saat |
| 🟡 10 | `/segments` ve `/filters` sayfaları | 1 gün |
| 🟢 11 | Türkçe karakter düzeltmeleri | 1 saat |
| 🟢 12 | `isPending` migration (React Query v5) | 30 dk |
| 🟢 13 | `kpi/trend` cache'leme | 1 saat |
| 🟢 14 | Google Ads micros uyarısı/flag | 1 saat |

---

## 6. DÖKÜMAN vs KOD ÖZET TABLOSU

| Döküman Gereksinimi | Durum |
|---------------------|-------|
| Auth (login/refresh/logout) | ✅ Tam |
| Import pipeline (upload→commit) | ✅ Tam |
| KPI summary + cache | ✅ Tam |
| KPI trend | ⚠️ Cache yok |
| Dashboard funnel endpoint | ✅ Tam |
| Dashboard cohort endpoint | ✅ Tam |
| Attribution analysis | ✅ Tam |
| Saved views CRUD | ✅ Tam |
| Segments CRUD | ✅ Backend tam, frontend yok |
| Export (PDF/CSV) | ✅ Var |
| Audit + import logs | ✅ Tam |
| **Funnel grafik** | ❌ Eksik |
| **Cohort heatmap** | ❌ Eksik |
| **Scatter chart** | ❌ Eksik |
| **Heatmap** | ❌ Eksik |
| **Drag-drop layout** | ❌ Eksik |
| **URL filtre sync** | ❌ Eksik |
| **Cross-filter** | ❌ Eksik |
| **Segments sayfası** | ❌ Eksik |
| **Hatalı satır atlayarak commit** | ❌ Eksik |
