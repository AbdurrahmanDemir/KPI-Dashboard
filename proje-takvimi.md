# KPI Dashboard — Proje Takvimi

**Toplam Süre:** 14 Hafta · **Toplam Faz:** 6 Aşama  
**Hazırlayanlar:** Emre YAVŞAN · Mert GÜLSEREN

---

## İÇİNDEKİLER

1. [Faz 1 — Hazırlık & Altyapı Kurulumu](#faz-1--hazırlık--altyapı-kurulumu) *(Hafta 1–2)*
2. [Faz 2 — Auth Sistemi & Veri Import](#faz-2--auth-sistemi--veri-import) *(Hafta 3–5)*
3. [Faz 3 — KPI Hesaplama Motoru](#faz-3--kpi-hesaplama-motoru) *(Hafta 6–7)*
4. [Faz 4 — Dashboard & Görselleştirme](#faz-4--dashboard--görselleştirme) *(Hafta 8–10)*
5. [Faz 5 — Segment, Export & Güvenlik](#faz-5--segment-export--güvenlik) *(Hafta 11–12)*
6. [Faz 6 — Test & Final Teslim](#faz-6--test--final-teslim) *(Hafta 13–14)*

---

## FAZ 1 — Hazırlık & Altyapı Kurulumu

> Projenin temeli burada atılıyor. Tüm ekip aynı ortamda çalışmaya başlamadan geliştirme başlamamalı. Bu faz atlanırsa ilerleyen haftalarda ciddi uyum sorunları çıkar.

---

### Hafta 1 — Ortam & Planlama

- [ ] Node.js, Git, MySQL, VS Code kurulumlarını tüm ekip için tamamla
- [ ] GitHub repository oluştur, branch stratejisini belirle (`main` / `dev` / `feature`)
- [ ] `.env` yapısını ve proje klasör mimarisini belirle (`backend` / `frontend` / `docs`)
- [ ] MySQL Workbench ile veritabanı bağlantısını test et
- [ ] Dummy veri setlerini üret — her kaynak için en az 500 satır (GA, Meta, Google Ads, Satış, Funnel)

**📦 Teslim:** Çalışan geliştirme ortamı + GitHub repo + dummy CSV dosyaları

---

### Hafta 2 — Veri Modeli & ER Diyagramı

- [ ] MySQL Workbench ile ER diyagramını çiz (13 tablo, tüm ilişkiler)
- [ ] Tüm `CREATE TABLE` sorgularını yaz ve çalıştır
- [ ] Index ve foreign key'leri ekle
- [ ] Backend proje iskeletini kur: `npm init`, Express kurulumu, klasör yapısı
- [ ] Sequelize ile MySQL bağlantısını doğrula, model dosyalarını oluştur
- [ ] React (Vite) frontend projesini kur, Tailwind ve temel paketleri ekle

**📦 Teslim:** ER diyagramı + çalışan DB şeması + backend & frontend iskeletleri

---

## FAZ 2 — Auth Sistemi & Veri Import

> Bu faz projenin en teknik kısmı. Auth olmadan diğer endpoint'ler yazılamaz. Import olmadan gösterilecek veri yok. Sırayı bozmadan ilerle.

---

### Hafta 3 — Auth Sistemi

**Backend:**
- [ ] `users` tablosuna seed verisi ekle (admin ve viewer rolleri)
- [ ] `POST /auth/login` — bcrypt ile şifre doğrulama, JWT üretimi
- [ ] `POST /auth/refresh` ve `POST /auth/logout` endpoint'leri
- [ ] JWT middleware: korumalı route'lara `Authorization` header kontrolü
- [ ] Rate limiting middleware ekle (dakikada 100 istek)
- [ ] Swagger kurulumu: `/api-docs` sayfası, auth endpoint'lerini dokümante et

**Frontend:**
- [ ] Login sayfası UI ve API bağlantısı, token localStorage'a kayıt
- [ ] Protected route yapısı — giriş yapılmadan dashboard açılmasın

**📦 Teslim:** Çalışan JWT auth sistemi + login sayfası + korumalı route'lar

---

### Hafta 4 — Import Modülü (Temel)

**Backend:**
- [ ] multer ile dosya upload endpoint'i: `POST /imports` (CSV, XLSX, JSON)
- [ ] csv-parser ile CSV okuma, SheetJS ile XLSX okuma, JSON parse
- [ ] Import sonrası ilk 20 satırı döndüren `GET /imports/{id}/preview`
- [ ] `import_logs` tablosuna kayıt: dosya adı, tip, satır sayısı, status

**Frontend:**
- [ ] Sürükle-bırak dosya yükleme alanı (react-dropzone)
- [ ] Veri önizleme tablosu — yüklenen ilk 20 satırı göster
- [ ] Import geçmişi listesi sayfası

**📦 Teslim:** Dosya yükleme + önizleme ekranı çalışıyor

---

### Hafta 5 — Import Modülü (Gelişmiş)

**Backend:**
- [ ] `POST /imports/{id}/map-columns` — kullanıcının kolon eşleme seçimini kaydet
- [ ] `POST /imports/{id}/validate` — veri tipi, zorunlu alan, duplicate kontrolü
- [ ] `GET /imports/{id}/errors` — hatalı satırları ve hata nedenlerini listele
- [ ] `POST /imports/{id}/commit` — doğrulanan veriyi ilgili MySQL tablosuna yaz
- [ ] `DELETE /imports/{id}` — import rollback, yazılan satırları geri al
- [ ] Veri normalizasyonu: kanal ismi standartlaştırma, tarih format dönüşümü
- [ ] `POST /normalize/run` endpoint'i

**Frontend:**
- [ ] Kolon eşleme arayüzü — kaynak kolon → sistem kolonu dropdown
- [ ] Validasyon sonuç ekranı, hatalı satır raporu
- [ ] `channel_mapping` yönetim sayfası (kanal eşleme CRUD)

**📦 Teslim:** Tam çalışan import süreci: yükle → eşle → doğrula → kaydet

---

## FAZ 3 — KPI Hesaplama Motoru

> Tüm KPI formülleri backend'de SQL aggregation ile hesaplanacak. Bu faz bitmeden frontend'de gösterilecek gerçek veri yok. Her KPI'ı formülüyle birlikte test et.

---

### Hafta 6 — KPI SQL Sorguları

- [ ] **Trafik KPI'ları** SQL sorguları: Sessions, Users, New Users, Bounce Rate, Pages/Session, Avg Duration, CVR, Growth Rate
- [ ] **Reklam KPI'ları** SQL sorguları: Spend, Impressions, Clicks, CTR, CPC, CPM, Conversions, Cost/Conversion, ROAS, Frequency
- [ ] **Satış KPI'ları** SQL sorguları: Revenue, Orders, Items Sold, AOV, Revenue/User, Repeat Purchase Rate, Refund Rate, Growth Rate
- [ ] **Pazarlama KPI'ları**: Revenue by Channel, CVR by Channel, Revenue by Campaign, New vs Returning, Daily Change
- [ ] Tüm sorgulara tarih aralığı filtresi ekle (`start_date` / `end_date` parametreleri)
- [ ] Kanal, platform, kampanya, cihaz, şehir, ülke filtrelerini sorgulara ekle
- [ ] Dummy veriyle her formülü manuel hesaplayıp SQL sonucuyla karşılaştır

**📦 Teslim:** 26 KPI'ın tamamı SQL ile doğru hesaplanıyor

---

### Hafta 7 — KPI API & Cache

**Backend:**
- [ ] `GET /kpi/summary` — tüm KPI özetini tek response'da döndür
- [ ] `GET /dashboard/trend` — tarih bazlı zaman serisi verisi
- [ ] `GET /dashboard/channel-performance`, `/platform-performance`, `/campaign-performance`
- [ ] `GET /dashboard/funnel` — funnel_data tablosundan adım bazlı dönüşüm
- [ ] `GET /dashboard/cohort` — customer_id bazlı retention matrisi
- [ ] `kpi_cache` tablosu: hesaplanan sonuçları sakla, TTL 15 dk, filtre hash'i ile
- [ ] `POST /kpi/run` — cache'i temizle ve yeniden hesapla
- [ ] Swagger'a tüm KPI ve dashboard endpoint'lerini ekle

**Test:**
- [ ] Postman ile tüm endpoint'leri filtre kombinasyonlarıyla test et

**📦 Teslim:** Tam çalışan KPI API + cache sistemi

---

## FAZ 4 — Dashboard & Görselleştirme

> Frontend'in en yoğun fazı. Her grafik türü ayrı bir component olarak geliştirilecek. Grafikler gerçek API verisine bağlanacak — dummy hardcoded veri kullanılmayacak.

---

### Hafta 8 — Temel Dashboard

- [ ] Zustand ile global filtre store'u kur (tarih, kanal, platform, kampanya)
- [ ] React Query ile API veri yönetimi: loading, error, cache state'leri
- [ ] KPI kart bileşeni: değer, değişim yüzdesi, trend ikonu
- [ ] Ana dashboard sayfası: 8 KPI kartı grid düzeni
- [ ] ApexCharts **Zaman Serisi** grafiği (Line/Area): ciro ve oturum trendi
- [ ] ApexCharts **Bar Chart**: kanal bazlı ciro karşılaştırması
- [ ] ApexCharts **Donut Chart**: platform veya cihaz dağılımı
- [ ] Filtre paneli bileşeni: tarih seçici, kanal, platform dropdown'ları
- [ ] Filtreleme değişince tüm bileşenler otomatik güncellensin (Zustand → React Query)

**📦 Teslim:** Gerçek veriyle çalışan temel dashboard

---

### Hafta 9 — Analiz Sayfaları

- [ ] **Kanal Analizi** sayfası: kanal bazlı KPI tablosu + karşılaştırmalı bar chart
- [ ] **Kampanya Analizi** sayfası: hedef ROAS vs gerçek ROAS, harcama vs gelir
- [ ] **Trafik Analizi** sayfası: kaynak/medium dağılımı, bounce rate grafiği
- [ ] **Funnel Analizi** sayfası: ApexCharts Funnel Chart, adım bazlı oran hesaplama
- [ ] **Cohort Analizi** sayfası: retention matrisi heatmap görünümü
- [ ] **Scatter Chart**: ROAS vs Harcama dağılımı (kampanya bazlı)
- [ ] **Table View**: filtreli ham veri tablosu, sıralama ve sayfalama

**📦 Teslim:** Tüm analiz sayfaları çalışıyor

---

### Hafta 10 — Gelişmiş Dashboard Özellikleri

- [ ] **Pivot View** bileşeni: satır/sütun seçilebilir çapraz tablo
- [ ] **Heatmap** bileşeni: gün/saat bazlı performans yoğunluğu
- [ ] **Cross-filter**: bir grafiğe tıklanınca diğerleri filtrelensin
- [ ] **Drag & drop layout**: react-beautiful-dnd ile kart sıralama
- [ ] Layout kaydetme: saved_views API'ye bağla
- [ ] **URL filtre parametreleri**: aktif filtreler URL'ye yansısın
- [ ] Gelişmiş filtreler: ciro aralığı slider, ROAS aralığı
- [ ] **Kaydedilmiş Görünümler** sayfası: görünüm listesi, yükle, sil

**📦 Teslim:** Cross-filter + drag-drop + URL filtresi çalışıyor

---

## FAZ 5 — Segment, Export & Güvenlik

> Kalan özellikler tamamlanıyor: segment yönetimi, veri dışa aktarımı, güvenlik katmanı ve performans optimizasyonu.

---

### Hafta 11 — Segment Yönetimi & Export

**Backend:**
- [ ] Segment CRUD endpoint'leri: `GET` / `POST` / `PUT` / `DELETE /segments`
- [ ] `GET /segments/{id}/preview` ve `POST /segments/{id}/apply`
- [ ] Export endpoint'lerine format parametresi: `?format=csv` veya `?format=xlsx`
- [ ] `GET /export/kpi-summary`, `/channel-performance`, `/campaign-performance`, `/raw`

**Frontend:**
- [ ] Segment oluşturma formu — kural tabanlı (kanal, cihaz, ciro aralığı)
- [ ] Segment önizleme ve segment bazlı KPI görünümü
- [ ] Export & Raporlama sayfası, format seçimi ve indirme
- [ ] Log ve Sistem İzleme sayfası — import logları, audit logları

**📦 Teslim:** Segment yönetimi + CSV/XLSX/JSON export çalışıyor

---

### Hafta 12 — Performans & Güvenlik

**Backend:**
- [ ] Input sanitization middleware: SQL injection ve XSS koruması
- [ ] Dosya upload güvenliği: MIME tipi kontrolü, max 50 MB sınırı
- [ ] Audit log middleware: import, silme, giriş işlemlerini `audit_logs`'a yaz
- [ ] `GET /logs/audit` endpoint'i

**Veritabanı:**
- [ ] MySQL index optimizasyonu — yavaş sorguları `EXPLAIN` ile analiz et

**Frontend:**
- [ ] Lazy loading — ağır grafik bileşenlerini geç yükle
- [ ] Skeleton loading ekranları — veri yüklenirken görsel placeholder
- [ ] Ayarlar sayfası — kullanıcı tercihleri, layout sıfırlama

**Dokümantasyon:**
- [ ] Swagger dokümantasyonunu tamamla — tüm endpoint'ler request/response şemasıyla

**📦 Teslim:** Güvenli + optimize edilmiş sistem

---

## FAZ 6 — Test & Final Teslim

> Son faz. Tüm başarı senaryolarının tek tek geçtiğini doğrula. Dokümantasyonu tamamla. Demo için temiz veri yükle.

---

### Hafta 13 — Test Süreci

- [ ] Her KPI formülünü dummy veriyle manuel hesapla, API çıktısıyla karşılaştır
- [ ] Import modülünü test et: hatalı CSV, eksik kolon, yanlış veri tipi dosyaları
- [ ] Tüm filtre kombinasyonlarının doğru sonuç ürettiğini doğrula
- [ ] Cross-filter çalışmasını test et: her grafik diğerlerini tetikliyor mu?
- [ ] Export sonuçlarını ekrandaki veriyle karşılaştır
- [ ] Auth: yetkisiz erişim denemeleri audit log'a yazılıyor mu?
- [ ] 10 başarı senaryosunu sırayla çalıştır, tümü geçmeli
- [ ] Büyük veri testi: 10.000+ satır import et, performansı ölç
- [ ] Hata düzeltmeleri ve edge case'ler

**📦 Teslim:** Tüm başarı senaryoları geçti, stabil sürüm

---

### Hafta 14 — Dokümantasyon & Demo

- [ ] `README.md`: kurulum adımları, çalıştırma komutu, ortam değişkenleri
- [ ] Kullanım kılavuzu: import nasıl yapılır, filtreler nasıl kullanılır
- [ ] Swagger UI'ın eksiksiz olduğunu kontrol et
- [ ] Demo için tüm tablolara temiz, anlamlı dummy veri yükle
- [ ] Demo senaryosu hazırla: "ROAS düşüşü tespit" akışını göster
- [ ] Kodu temizle: console.log'lar, gereksiz yorum satırları, debug kodları
- [ ] GitHub'a son push: tüm değişiklikler main branch'e merge
- [ ] Final paket teslimi

**📦 Teslim:** ✅ Final proje paketi

---

## Özet Tablo

| Faz | Kapsam | Hafta | Kritik Çıktı |
|-----|--------|-------|--------------|
| Faz 1 | Hazırlık & Altyapı | 1–2 | ER diyagramı + DB şeması + proje iskeletleri |
| Faz 2 | Auth & Import | 3–5 | Tam çalışan import süreci |
| Faz 3 | KPI Motoru | 6–7 | 26 KPI + cache sistemi |
| Faz 4 | Dashboard & Grafikler | 8–10 | Cross-filter + drag-drop dashboard |
| Faz 5 | Segment, Export, Güvenlik | 11–12 | Export + güvenli sistem |
| Faz 6 | Test & Final | 13–14 | Teslim paketi |

---

## Geliştirme Kuralları

- Her hafta başında o haftanın görevleri GitHub issue olarak açılır
- Her görev ayrı bir `feature/` branch'inde geliştirilir, tamamlanınca `dev`'e merge edilir
- `main` branch'e yalnızca test edilmiş, stabil kod merge edilir
- Hafta sonunda o haftanın teslim çıktısı `dev` branch'inde hazır olmalıdır

---

*Proje Sahipleri:*

| Ad Soyad | E-posta | Telefon |
|----------|---------|---------|
| Emre YAVŞAN | emre.yavsan@sporthink.com.tr | 0541 896 59 48 |
| Mert GÜLSEREN | mert.gulseren@sporthink.com.tr | 0539 925 11 94 |
