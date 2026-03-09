# PAZARLAMA VE E-TİCARET KPI DASHBOARD GELİŞTİRME

**Proje Versiyonu:** 2.0  
**Hazırlayanlar:** Emre YAVŞAN · Mert GÜLSEREN  
**İletişim:** emre.yavsan@sporthink.com.tr · mert.gulseren@sporthink.com.tr

---

## İÇİNDEKİLER

1. [Proje Vizyonu ve İş Hedefi](#1-proje-vizyonu-ve-iş-hedefi)
2. [Teknoloji ve Teknik Mimari](#2-teknoloji-ve-teknik-mimari)
3. [Proje Kapsamı (MVP)](#3-proje-kapsamı-mvp)
4. [Veri Modeli](#4-veri-modeli)
5. [API Uç Noktaları](#5-api-uç-noktaları)
6. [Kullanıcı Arayüzü ve Sayfa Yapısı](#6-kullanıcı-arayüzü-ve-sayfa-yapısı)
7. [Güvenlik ve KVKK Uyumu](#7-güvenlik-ve-kvkk-uyumu)
8. [Başarı Senaryoları](#8-başarı-senaryoları)

---

## 1. Proje Vizyonu ve İş Hedefi

KPI (Key Performance Indicator), bir organizasyonun belirlediği hedeflere ne ölçüde ulaştığını değerlendirmek amacıyla kullanılan ölçülebilir performans göstergeleridir. Dijital pazarlama ve e-ticaret alanında KPI'lar; trafik, reklam performansı, dönüşüm oranı ve satış gibi kritik metrikler üzerinden işletmelerin performansını analiz etmeyi mümkün kılar.

Bu proje, şirketlerin dijital pazarlama ve e-ticaret performansını ölçmek için kullandığı temel ve ileri seviye KPI'ları tek bir merkezde toplayan, gerçek zamanlıya yakın veri akışını simüle eden ve karar alma süreçlerini hızlandıran profesyonel bir dashboard sistemi geliştirmeyi amaçlamaktadır.

Günümüzde ekipler veri odaklı karar almak isterken veriler çoğu zaman farklı platformlara dağılmış durumdadır. Bu durum, analiz süreçlerini zorlaştırmakta ve karar alma hızını düşürmektedir.

Bu proje kapsamında geliştirilecek sistem:

- Google Analytics, Meta Ads, Google Ads ve satış verilerini tek merkezde toplar
- KPI'ları gerçek iş senaryolarına uygun şekilde hesaplar
- Görselleştirme ve filtreleme araçlarıyla karar süreçlerini hızlandırır
- Gerçek sistemlere entegre edilebilecek bir mimari yaklaşım sunar

> **Not:** Proje tamamen dummy veri setleri üzerinden geliştirilecektir.

---

## 2. Teknoloji ve Teknik Mimari

### 2.1 Kullanılan Teknoloji Stack'i

Bu projede aşağıdaki teknoloji stack'i kullanılacaktır:

| Katman | Teknoloji |
|--------|-----------|
| Frontend Framework | React (Vite ile kurulum) |
| Grafik Kütüphanesi | ApexCharts |
| Backend Framework | Node.js + Express.js |
| ORM | Sequelize |
| Veritabanı | MySQL 8 |
| Kimlik Doğrulama | JWT (JSON Web Token) |
| API Dokümantasyonu | Swagger (swagger-ui-express + swagger-jsdoc) |
| State Yönetimi | Zustand |
| API İletişimi | Axios + React Query |
| Stil | Tailwind CSS |

### 2.2 Frontend

**Framework:** React (Vite tabanlı kurulum)

Beklenen standartlar:
- Component bazlı mimari
- Responsive tasarım (mobil uyumlu)
- Lazy loading ile performans optimizasyonu

**Grafik kütüphanesi:** ApexCharts

Desteklenen grafik türleri:
- Line / Area Chart (zaman serisi)
- Bar Chart
- Donut Chart
- Heatmap
- Funnel Chart
- Scatter Chart

### 2.3 Backend

**Framework:** Node.js + Express.js

Zorunlu standartlar:
- REST API mimarisi
- JSON veri formatı
- In-memory veya Redis tabanlı cache yapısı
- Rate limiting (istek sınırlandırma)
- Input sanitization (girdi temizleme)
- Merkezi hata yönetimi (error handling middleware)

**Cache stratejisi:**

Sık kullanılan KPI hesaplama sonuçları `kpi_cache` tablosunda saklanacaktır. Her cache kaydı için TTL (Time To Live) süresi 15 dakika olarak belirlenmiştir. Filtre kombinasyonu değiştiğinde ilgili cache geçersiz sayılır ve yeniden hesaplanır.

### 2.4 Veri Depolama

**Veritabanı:** MySQL 8

Beklenen yapı:
- Normalize edilmiş veri modeli (3NF)
- KPI hesaplamaları için aggregation tabloları (kpi_cache)
- Filtreleme performansı için indexleme (date, channel, platform, campaign_name kolonlarına)
- Tarih bazlı partition önerilir (traffic_data, ads_data, sales_data tablolarında)

### 2.5 Veri Kaynak Simülasyonu

Sistem aşağıdaki veri formatlarını içeri alabilmelidir:
- CSV
- XLSX
- JSON

Import sırasında şu kontroller yapılmalıdır:
- Kolon eşleme (mapping)
- Veri tipi doğrulama
- Zorunlu alan kontrolü
- Duplicate kayıt kontrolü
- Hata satırı raporu

### 2.6 API Yapısı

Sistem REST API mimarisi ile çalışmalıdır. Tüm veri alışverişi JSON formatında yapılmalıdır.

**Standart başarılı response formatı:**
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "total": 150,
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

**Standart hata response formatı:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Açıklayıcı hata mesajı",
    "details": [ ... ]
  }
}
```

**Kullanılan HTTP durum kodları:**

| Kod | Anlam |
|-----|-------|
| 200 | Başarılı |
| 201 | Kayıt oluşturuldu |
| 400 | Geçersiz istek (validation hatası) |
| 401 | Kimlik doğrulama gerekli |
| 403 | Yetkisiz erişim |
| 404 | Kaynak bulunamadı |
| 422 | İşlenemeyen varlık |
| 429 | Çok fazla istek (rate limit) |
| 500 | Sunucu hatası |

**Filtreleme query parametreleri (tüm dashboard ve KPI endpoint'lerinde geçerli):**

```
?start_date=2024-01-01
&end_date=2024-03-31
&channel=meta
&platform=google_ads
&campaign_name=yaz_kampanyasi
&device=mobile
&city=istanbul
&country=TR
```

### 2.7 Kimlik Doğrulama

Sistem JWT Authentication kullanacaktır.

- Token süresi: 24 saat (access token)
- Refresh token süresi: 7 gün
- Token, Authorization header'ında `Bearer {token}` formatında gönderilir
- Yetkisiz erişim denemeleri `audit_logs` tablosuna kaydedilir

### 2.8 API Dokümantasyonu

API uç noktaları Swagger (OpenAPI 3.0) ile dokümante edilecektir.

- Swagger UI erişim adresi: `/api-docs`
- Tüm endpoint'ler request/response şemalarıyla belgelenecektir
- Swagger üzerinden test yapılabilecektir

---

## 3. Proje Kapsamı (MVP)

### 3.1 Veri Import Modülü

Sistem, gerçek veri entegrasyonunu simüle edecek şekilde aşağıdaki kaynaklara uygun veri setlerini içeri aktarabilmelidir.

#### 3.1.1 Desteklenen Veri Kaynakları (Simülasyon)

##### 3.1.1.1 Google Analytics Veri Seti

Aşağıdaki kolonları içeren veri dosyaları yüklenebilmelidir:

| Kolon | Tip | Açıklama |
|-------|-----|----------|
| date | DATE | Veri tarihi (YYYY-MM-DD) |
| source | VARCHAR | Trafik kaynağı (google, facebook, email vb.) |
| medium | VARCHAR | Medium tipi (cpc, organic, referral vb.) |
| channel_group | VARCHAR | Kanal grubu (Paid Search, Organic vb.) |
| sessions | INT | Oturum sayısı |
| users | INT | Tekil kullanıcı sayısı |
| new_users | INT | Yeni kullanıcı sayısı |
| bounce_rate | DECIMAL(5,2) | Hemen çıkma oranı (0-100 arası) |
| avg_session_duration | DECIMAL(10,2) | Ortalama oturum süresi (saniye) |
| pages_per_session | DECIMAL(5,2) | Oturum başına sayfa |
| pages_viewed | INT | Toplam sayfa görüntüleme sayısı |
| conversions | INT | Dönüşüm sayısı |
| revenue | DECIMAL(15,2) | Gelir (TL) |

**Örnek veri satırı:**
```
2024-01-15, google, cpc, Paid Search, 1250, 980, 620, 42.5, 185.3, 3.2, 4000, 87, 15420.50
```

> **Açıklama:** Bu veri seti web sitesi trafik performansını analiz etmek için kullanılacaktır ve KPI hesaplamalarında temel veri kaynağıdır.

##### 3.1.1.2 Meta Ads Veri Seti

| Kolon | Tip | Açıklama |
|-------|-----|----------|
| date | DATE | Veri tarihi (YYYY-MM-DD) |
| campaign_name | VARCHAR | Kampanya adı |
| campaign_id | VARCHAR | Meta kampanya ID'si |
| adset_name | VARCHAR | Reklam seti adı |
| ad_name | VARCHAR | Tekil reklam adı |
| impressions | INT | Gösterim sayısı |
| clicks | INT | Tıklama sayısı |
| reach | INT | Ulaşılan tekil kullanıcı sayısı |
| spend | DECIMAL(15,2) | Harcama (TL) |
| ctr | DECIMAL(5,4) | Tıklama oranı (ham değer) |
| cpc | DECIMAL(10,4) | Tıklama başına maliyet |
| conversions | INT | Dönüşüm sayısı |
| conversion_value | DECIMAL(15,2) | Dönüşüm değeri (TL) |
| currency | VARCHAR(3) | Para birimi (TRY, USD vb.) |

**Örnek veri satırı:**
```
2024-01-15, Yaz_Kampanya_2024, 23456789, Genis_Kitle, Banner_V1, 45000, 1350, 38000, 2700.00, 0.0300, 2.00, 45, 9800.00, TRY
```

> **Açıklama:** Bu veri seti Meta reklam performansını analiz etmek ve ROAS, CPC, CTR, Frequency gibi metrikleri hesaplamak için kullanılacaktır.

##### 3.1.1.3 Google Ads Veri Seti

| Kolon | Tip | Açıklama |
|-------|-----|----------|
| date | DATE | Veri tarihi (YYYY-MM-DD) |
| campaign_name | VARCHAR | Kampanya adı |
| campaign_id | VARCHAR | Google kampanya ID'si |
| ad_group | VARCHAR | Reklam grubu adı |
| impressions | INT | Gösterim sayısı |
| clicks | INT | Tıklama sayısı |
| cost | DECIMAL(15,2) | Harcama (TL) |
| ctr | DECIMAL(5,4) | Tıklama oranı |
| avg_cpc | DECIMAL(10,4) | Ortalama tıklama başına maliyet |
| conversions | INT | Dönüşüm sayısı |
| conversion_value | DECIMAL(15,2) | Dönüşüm değeri (TL) |
| currency | VARCHAR(3) | Para birimi |

**Örnek veri satırı:**
```
2024-01-15, Search_Marka_2024, 987654321, Marka_Kelimeleri, 28000, 2100, 4200.00, 0.0750, 2.00, 63, 14500.00, TRY
```

> **Açıklama:** Bu veri seti Google Ads reklam performansını analiz etmek için kullanılacaktır.

##### 3.1.1.4 Satış Veritabanı Veri Seti (E-Ticaret)

| Kolon | Tip | Açıklama |
|-------|-----|----------|
| order_id | VARCHAR | Sipariş ID (benzersiz) |
| order_date | DATE | Sipariş tarihi (YYYY-MM-DD) |
| customer_id | VARCHAR | Müşteri ID (tekrar satın alma analizi için) |
| city | VARCHAR | Şehir |
| country | VARCHAR | Ülke kodu (TR, US vb.) |
| device | VARCHAR | Cihaz tipi (mobile, desktop, tablet) |
| channel | VARCHAR | Sipariş kanalı (meta, google, organic vb.) |
| product_count | INT | Siparişteki ürün adedi |
| order_revenue | DECIMAL(15,2) | Sipariş tutarı (TL) |
| discount_amount | DECIMAL(15,2) | İndirim tutarı (TL) |
| refund_amount | DECIMAL(15,2) | İade tutarı (TL, iade yoksa 0) |
| order_status | VARCHAR | Sipariş durumu (completed, cancelled, refunded) |
| payment_method | VARCHAR | Ödeme yöntemi (credit_card, bank_transfer vb.) |

**Örnek veri satırı:**
```
ORD-2024-00145, 2024-01-15, CUST-0892, Istanbul, TR, mobile, meta, 3, 1250.00, 125.00, 0.00, completed, credit_card
```

> **Açıklama:** Bu veri seti e-ticaret performansı, dönüşüm oranı, cohort analizi ve kanal bazlı ciro analizleri için kullanılacaktır.

##### 3.1.1.5 Funnel Veri Seti

> **Not:** Orijinal dökümanında funnel analiz sayfası tanımlanmış ancak bu sayfayı besleyecek veri seti eksikti. Aşağıdaki veri seti bu eksikliği gidermek için eklenmiştir.

| Kolon | Tip | Açıklama |
|-------|-----|----------|
| date | DATE | Veri tarihi |
| channel | VARCHAR | Trafik kanalı |
| device | VARCHAR | Cihaz tipi |
| step_name | VARCHAR | Funnel adımı adı |
| step_order | INT | Adım sırası (1'den başlar) |
| session_count | INT | Bu adıma ulaşan oturum sayısı |

**Funnel adımları (step_order sırasıyla):**

| step_order | step_name |
|-----------|-----------|
| 1 | visit (Ziyaret) |
| 2 | product_view (Ürün Görüntüleme) |
| 3 | add_to_cart (Sepete Ekleme) |
| 4 | checkout (Ödeme Adımı) |
| 5 | purchase (Satın Alma) |

**Örnek veri satırı:**
```
2024-01-15, meta, mobile, add_to_cart, 3, 320
```

> **Açıklama:** Bu veri seti funnel analiz sayfasındaki adım bazlı dönüşüm oranlarının hesaplanması için kullanılacaktır.

---

#### 3.1.2 Import Sistem Gereksinimleri

##### 3.1.2.1 Dosya Desteği
- CSV (virgül veya noktalı virgül ayraçlı)
- XLSX (Excel)
- JSON (array formatında)

##### 3.1.2.2 Import Özellikleri
- Veri önizleme ekranı (ilk 20 satır gösterilir)
- Kolon eşleme (mapping) — kullanıcının kaynak kolonlarını sistem kolonlarıyla eşleştirmesi
- Veri tipi doğrulama (tarih formatı, sayısal alan, zorunlu alan)
- Zorunlu alan kontrolü
- Duplicate kayıt kontrolü (aynı tarih + kaynak kombinasyonu)
- Hatalı satır raporu (hangi satır, hangi hata)
- Maksimum dosya boyutu: 50 MB

##### 3.1.2.3 Veri Standartlaştırma

Import sonrası sistem otomatik olarak:
- Kanal isimlerini normalize etmeli (fb → meta, adwords → google_ads)
- Tarih formatlarını standartlaştırmalı (DD/MM/YYYY → YYYY-MM-DD)
- Para birimini normalize etmeli (varsayılan TRY)
- Platform verilerini tek yapıda birleştirmeli

##### 3.1.2.4 Import Sonrası Veri Akışı

Import tamamlandıktan sonra:
1. Veriler ilgili MySQL tablolarına yazılır
2. `import_logs` tablosuna kayıt eklenir
3. KPI hesaplama süreçleri tetiklenir (`kpi_cache` güncellenir)
4. Dashboard otomatik olarak yeni veriyi yansıtır

---

### 3.2 KPI Hesaplama Modülü

#### 3.2.1 Trafik KPI'ları

| KPI | Açıklama | Hesaplama Formülü |
|-----|----------|-------------------|
| Toplam Oturum (Sessions) | Belirlenen tarih aralığında siteye yapılan toplam ziyaret sayısı | `SUM(sessions)` |
| Tekil Kullanıcı (Users) | Belirli dönemde siteyi ziyaret eden benzersiz kullanıcı sayısı | `SUM(users)` |
| Yeni Kullanıcı (New Users) | Daha önce siteyi ziyaret etmemiş kullanıcı sayısı | `SUM(new_users)` |
| Hemen Çıkma Oranı (Bounce Rate) | Tek sayfa görüntüleyip çıkan kullanıcı oranı | `AVG(bounce_rate)` |
| Oturum Başına Sayfa (Pages per Session) | Kullanıcıların site içinde ne kadar gezindiği | `SUM(pages_viewed) ÷ SUM(sessions)` |
| Ortalama Oturum Süresi (Avg. Session Duration) | Kullanıcıların sitede geçirdiği ortalama süre (saniye) | `SUM(avg_session_duration × sessions) ÷ SUM(sessions)` |
| Trafikten Siparişe Dönüşüm (Traffic CVR) | Oturumların siparişe dönüşme oranı | `(SUM(conversions) ÷ SUM(sessions)) × 100` |
| Trafik Büyüme Oranı (Traffic Growth Rate) | Önceki dönemle kıyaslanmış trafik artışı/azalışı | `((Mevcut dönem sessions − Önceki dönem sessions) ÷ Önceki dönem sessions) × 100` |

#### 3.2.2 Reklam KPI'ları

| KPI | Açıklama | Hesaplama Formülü |
|-----|----------|-------------------|
| Toplam Harcama (Ad Spend) | Reklam platformlarına yapılan toplam harcama | `SUM(spend)` |
| Toplam Gösterim (Impressions) | Reklamların kaç kez görüntülendiği | `SUM(impressions)` |
| Toplam Tıklama (Clicks) | Kullanıcıların reklamlara yaptığı toplam tıklama | `SUM(clicks)` |
| Tıklama Oranı (CTR) | Gösterim başına tıklama oranı | `(SUM(clicks) ÷ SUM(impressions)) × 100` |
| Tıklama Başına Maliyet (CPC) | Bir tıklama elde etmek için yapılan ort. harcama | `SUM(spend) ÷ SUM(clicks)` |
| Bin Gösterim Başına Maliyet (CPM) | Marka görünürlüğü maliyet metriği | `(SUM(spend) ÷ SUM(impressions)) × 1000` |
| Reklam Kaynaklı Dönüşüm (Ad Conversions) | Reklamdan gelen sipariş sayısı | `SUM(conversions)` |
| Dönüşüm Başına Maliyet (Cost per Conversion) | Bir sipariş elde etmek için yapılan ort. harcama | `SUM(spend) ÷ SUM(conversions)` |
| Reklam Getirisi (ROAS) | Reklam harcamasına karşı elde edilen gelir | `SUM(conversion_value) ÷ SUM(spend)` |
| Gösterim Frekansı (Frequency) | Kullanıcı başına ortalama reklam gösterim sayısı | `SUM(impressions) ÷ SUM(reach)` |

> **Not:** Frequency hesabı için `reach` kolonunun veri setinde bulunması zorunludur. Bu kolon orijinal dökümanında eksikti.

#### 3.2.3 Satış KPI'ları

| KPI | Açıklama | Hesaplama Formülü |
|-----|----------|-------------------|
| Toplam Ciro (Revenue) | Belirli dönemde elde edilen toplam satış tutarı | `SUM(order_revenue)` |
| Sipariş Sayısı (Orders) | Toplam işlem hacmi | `COUNT(order_id)` (yalnızca status = 'completed') |
| Satılan Ürün Adedi (Items Sold) | Operasyon hacmini ölçmek için | `SUM(product_count)` |
| Ortalama Sepet Tutarı (AOV) | Sipariş başına ortalama harcama | `SUM(order_revenue) ÷ COUNT(order_id)` |
| Kullanıcı Başına Gelir (Revenue per User) | Kullanıcı kalitesini ölçmek için | `SUM(order_revenue) ÷ SUM(users)` |
| Tekrar Satın Alma Oranı (Repeat Purchase Rate) | Müşteri sadakatini ölçmek için | `(Birden fazla sipariş veren müşteri sayısı ÷ Toplam benzersiz müşteri) × 100` |
| İade Oranı (Refund Rate) | Operasyonel kalite ve ürün memnuniyeti | `(SUM(refund_amount) ÷ SUM(order_revenue)) × 100` |
| Ciro Büyüme Oranı (Revenue Growth Rate) | Önceki dönemle karşılaştırmalı performans | `((Mevcut ciro − Önceki ciro) ÷ Önceki ciro) × 100` |

> **Not:** Tekrar Satın Alma Oranı hesabı için `customer_id` kolonunun `sales_data` tablosunda bulunması zorunludur. Bu kolon orijinal dökümanında veri modelinde eksikti.

#### 3.2.4 Pazarlama Performans KPI'ları

| KPI | Açıklama | Hesaplama Formülü |
|-----|----------|-------------------|
| Kanal Bazlı Ciro (Revenue by Channel) | Hangi kanalın daha verimli olduğunu gösterir | Kanal bazlı `SUM(order_revenue)` |
| Kanal Bazlı Dönüşüm Oranı (CVR by Channel) | Trafik kalitesini kanal bazlı analiz eder | `(Kanal bazlı sipariş ÷ Kanal bazlı oturum) × 100` |
| Kampanya Bazlı Gelir (Revenue by Campaign) | Kampanya performansını ölçer | Kampanya bazlı `SUM(conversion_value)` |
| Yeni vs Geri Dönen Gelir (New vs Returning) | Büyüme modelini analiz etmek için | Yeni müşteri cirosunu mevcut müşteri cirosundan ayrı hesaplama |
| Günlük Performans Değişimi (Daily Change) | Gün bazlı dalgalanmaları gösterir | `((Bugünkü değer − Dünkü değer) ÷ Dünkü değer) × 100` |

---

### 3.3 Dashboard Görselleştirme Modülü

Dashboard aşağıdaki bileşenleri içermelidir:

| Bileşen | Kullanım Alanı |
|---------|----------------|
| KPI Kartları | Özet metrikler (ciro, ROAS, sipariş vb.) |
| Zaman Serisi Grafiği | Günlük/haftalık/aylık trend analizi |
| Bar Chart | Kanal / kampanya karşılaştırması |
| Donut Chart | Platform veya cihaz dağılımı |
| Funnel Chart | Ziyaret → Satın alma adımları |
| Heatmap | Gün/saat bazlı yoğunluk analizi |
| Cohort Tablosu | Müşteri retention analizi |
| Scatter Chart | ROAS vs Harcama dağılımı |
| Table View | Detaylı ham veri görünümü |
| Pivot View | Dinamik çapraz tablo analizi |

Dashboard kullanıcı tarafından özelleştirilebilir olmalıdır:
- Kart ve grafiklerin sırası değiştirilebilmeli (drag & drop)
- Layout yapılandırması `saved_views` tablosunda kullanıcı bazlı saklanmalı
- Farklı layout'lar kaydedilip isimlendirilmeli ve tekrar yüklenebilmeli

---

### 3.4 Filtreleme ve Segmentasyon

Filtreleme sistemi profesyonel BI araç mantığında çalışmalıdır.

#### Temel Filtreler

- Tarih aralığı (başlangıç - bitiş tarihi, hızlı seçenekler: Bu Hafta, Bu Ay, Son 30 Gün vb.)
- Kanal (meta, google, organic vb.)
- Platform (Meta Ads, Google Ads)
- Kampanya
- Cihaz (mobile, desktop, tablet)
- Ülke
- Şehir

#### Gelişmiş Filtreler

- Ciro aralığı (min - max)
- Sipariş sayısı aralığı
- ROAS aralığı
- Conversion aralığı
- Özel segment oluşturma (kural tabanlı)

#### 3.4.1 Segmentasyon

- Kanal bazlı
- Kampanya bazlı
- Davranış bazlı (yeni / geri dönen müşteri)
- Sipariş hacmine göre

#### 3.4.2 Filtre Davranışı

- Tüm filtreler global çalışmalı (seçilen filtre tüm grafikleri ve tabloları etkiler)
- Cross-filter desteklemeli (bir grafiğe tıklandığında diğerleri otomatik filtrelenir)
- Aktif filtreler URL parametrelerine yansımalı (sayfa yenilenince filtreler korunur)
- Filtre kombinasyonları kaydedilip tekrar kullanılabilmeli

---

## 4. Veri Modeli

> **Not:** Aşağıdaki veri modeli, orijinal dökümanındaki eksik kolonlar ve tablolar tamamlanarak yeniden oluşturulmuştur. Yeni eklenen kolon ve tablolar `[YENİ]` etiketi ile işaretlenmiştir.

### 4.1 `users` Tablosu `[YENİ]`

> Orijinal dökümanında auth sistemi tanımlanmış ancak kullanıcı tablosu hiç eklenmemişti.

```sql
CREATE TABLE users (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(100)         NOT NULL,
    email         VARCHAR(150)         NOT NULL UNIQUE,
    password_hash VARCHAR(255)         NOT NULL,
    role          ENUM('admin','viewer') NOT NULL DEFAULT 'viewer',
    created_at    DATETIME             NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME             ON UPDATE CURRENT_TIMESTAMP,
    last_login    DATETIME,
    is_active     BOOLEAN              NOT NULL DEFAULT TRUE
);
```

---

### 4.2 `traffic_data` Tablosu

> Orijinal dökümanında `source`, `medium`, `channel_group`, `pages_viewed`, `conversions`, `revenue` kolonları eksikti.

```sql
CREATE TABLE traffic_data (
    id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    date                 DATE          NOT NULL,
    source               VARCHAR(100),                  -- [YENİ] google, facebook, email vb.
    medium               VARCHAR(100),                  -- [YENİ] cpc, organic, referral vb.
    channel_group        VARCHAR(100),                  -- [YENİ] Paid Search, Organic vb.
    channel              VARCHAR(100)  NOT NULL,
    sessions             INT UNSIGNED  NOT NULL DEFAULT 0,
    users                INT UNSIGNED  NOT NULL DEFAULT 0,
    new_users            INT UNSIGNED  NOT NULL DEFAULT 0,
    bounce_rate          DECIMAL(5,2)  NOT NULL DEFAULT 0.00,
    avg_session_duration DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    pages_per_session    DECIMAL(5,2)  NOT NULL DEFAULT 0.00,
    pages_viewed         INT UNSIGNED  NOT NULL DEFAULT 0,  -- [YENİ] Pages per Session hesabı için
    conversions          INT UNSIGNED  NOT NULL DEFAULT 0,  -- [YENİ] Dönüşüm sayısı
    revenue              DECIMAL(15,2) NOT NULL DEFAULT 0.00, -- [YENİ] GA kaynaklı gelir
    import_id            INT UNSIGNED,                    -- hangi import'tan geldiği
    created_at           DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_date (date),
    INDEX idx_channel (channel),
    INDEX idx_source_medium (source, medium),
    INDEX idx_date_channel (date, channel)
);
```

---

### 4.3 `ads_data` Tablosu

> Orijinal dökümanında `ad_name`, `ctr`, `cpc`, `avg_cpc`, `ad_group`, `reach`, `currency`, `platform_id` kolonları eksikti. `reach` olmadan Frequency KPI'sı hesaplanamaz.

```sql
CREATE TABLE ads_data (
    id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    date             DATE           NOT NULL,
    platform         ENUM('meta','google_ads') NOT NULL,
    platform_id      VARCHAR(50),                        -- [YENİ] Meta/Google kampanya ID
    campaign_name    VARCHAR(255)   NOT NULL,
    adset            VARCHAR(255),
    ad_name          VARCHAR(255),                       -- [YENİ] Tekil reklam adı
    ad_group         VARCHAR(255),                       -- [YENİ] Google Ads'e özgü reklam grubu
    impressions      INT UNSIGNED   NOT NULL DEFAULT 0,
    clicks           INT UNSIGNED   NOT NULL DEFAULT 0,
    reach            INT UNSIGNED   NOT NULL DEFAULT 0,  -- [YENİ] Frequency hesabı için zorunlu
    spend            DECIMAL(15,2)  NOT NULL DEFAULT 0.00,
    ctr              DECIMAL(8,6)   NOT NULL DEFAULT 0.000000, -- [YENİ] Ham CTR değeri
    cpc              DECIMAL(10,4)  NOT NULL DEFAULT 0.0000,   -- [YENİ] Ham CPC değeri
    avg_cpc          DECIMAL(10,4)  NOT NULL DEFAULT 0.0000,   -- [YENİ] Google Ads avg_cpc
    conversions      INT UNSIGNED   NOT NULL DEFAULT 0,
    conversion_value DECIMAL(15,2)  NOT NULL DEFAULT 0.00,
    currency         VARCHAR(3)     NOT NULL DEFAULT 'TRY',    -- [YENİ] Para birimi
    import_id        INT UNSIGNED,
    created_at       DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_date (date),
    INDEX idx_platform (platform),
    INDEX idx_campaign (campaign_name),
    INDEX idx_date_platform (date, platform)
);
```

---

### 4.4 `sales_data` Tablosu

> Orijinal dökümanında `customer_id`, `city`, `country`, `order_status`, `payment_method` kolonları eksikti. `customer_id` olmadan Cohort Analizi ve Tekrar Satın Alma Oranı hesaplanamaz. `city` ve `country` olmadan coğrafi filtreler çalışamaz.

```sql
CREATE TABLE sales_data (
    id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id       VARCHAR(100)  NOT NULL UNIQUE,
    order_date     DATE          NOT NULL,
    customer_id    VARCHAR(100)  NOT NULL,               -- [YENİ] Cohort ve Repeat Purchase için zorunlu
    city           VARCHAR(100),                         -- [YENİ] Coğrafi filtre için
    country        VARCHAR(10),                          -- [YENİ] Ülke filtresi için
    device         VARCHAR(50),
    channel        VARCHAR(100)  NOT NULL,
    product_count  INT UNSIGNED  NOT NULL DEFAULT 1,
    order_revenue  DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    refund_amount  DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    order_status   ENUM('completed','cancelled','refunded') NOT NULL DEFAULT 'completed', -- [YENİ]
    payment_method VARCHAR(50),                          -- [YENİ] Ödeme yöntemi
    import_id      INT UNSIGNED,
    created_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_order_date (order_date),
    INDEX idx_customer (customer_id),
    INDEX idx_channel (channel),
    INDEX idx_city (city),
    INDEX idx_country (country),
    INDEX idx_status (order_status)
);
```

---

### 4.5 `campaign_data` Tablosu

> Orijinal dökümanında primary key, `status`, `budget_type`, `objective`, `target_roas`, `currency` kolonları eksikti. `campaign_data` ile `ads_data` arasındaki foreign key ilişkisi de tanımlanmamıştı.

```sql
CREATE TABLE campaign_data (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,  -- [YENİ]
    campaign_name VARCHAR(255)   NOT NULL,
    platform      ENUM('meta','google_ads') NOT NULL,
    platform_id   VARCHAR(50),                              -- [YENİ] Meta/Google kampanya ID
    start_date    DATE           NOT NULL,
    end_date      DATE,
    budget        DECIMAL(15,2)  NOT NULL,
    budget_type   ENUM('daily','lifetime') NOT NULL DEFAULT 'daily', -- [YENİ]
    objective     VARCHAR(100),                             -- [YENİ] CONVERSIONS, AWARENESS vb.
    target_roas   DECIMAL(10,4),                           -- [YENİ] Hedeflenen ROAS değeri
    currency      VARCHAR(3)     NOT NULL DEFAULT 'TRY',   -- [YENİ]
    status        ENUM('active','paused','ended') NOT NULL DEFAULT 'active', -- [YENİ]
    created_at    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME       ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uq_campaign_platform (campaign_name, platform),
    INDEX idx_platform (platform),
    INDEX idx_status (status),
    INDEX idx_dates (start_date, end_date)
);
```

---

### 4.6 `channel_mapping` Tablosu

> Orijinal dökümanında primary key, `platform`, `is_paid`, `created_at` kolonları eksikti. `traffic_data` ile ilişkisi de tanımlanmamıştı.

```sql
CREATE TABLE channel_mapping (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,  -- [YENİ]
    source        VARCHAR(100)  NOT NULL,
    medium        VARCHAR(100)  NOT NULL,
    channel_group VARCHAR(100)  NOT NULL,
    platform      VARCHAR(100),                             -- [YENİ] Meta, Google vb.
    is_paid       BOOLEAN       NOT NULL DEFAULT FALSE,     -- [YENİ] Ücretli/organik ayrımı
    created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP, -- [YENİ]

    UNIQUE KEY uq_source_medium (source, medium)
);
```

**İlişki:** `traffic_data.source` + `traffic_data.medium` → `channel_mapping.source` + `channel_mapping.medium`

---

### 4.7 `funnel_data` Tablosu `[YENİ]`

> Orijinal dökümanında Funnel Analizi sayfası tanımlanmış ve `GET /dashboard/funnel` endpoint'i listelenmiş ancak bu veriyi tutacak tablo hiç oluşturulmamıştı.

```sql
CREATE TABLE funnel_data (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    date          DATE          NOT NULL,
    channel       VARCHAR(100),
    device        VARCHAR(50),
    step_name     VARCHAR(100)  NOT NULL,
    step_order    TINYINT UNSIGNED NOT NULL,
    session_count INT UNSIGNED  NOT NULL DEFAULT 0,
    import_id     INT UNSIGNED,
    created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_date (date),
    INDEX idx_step (step_order),
    INDEX idx_date_channel (date, channel)
);
```

---

### 4.8 `import_logs` Tablosu `[YENİ]`

> Orijinal dökümanında `GET /imports`, `GET /logs/imports` endpoint'leri tanımlanmış ancak bu veriyi tutacak tablo eksikti.

```sql
CREATE TABLE import_logs (
    id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id      INT UNSIGNED  NOT NULL,
    file_name    VARCHAR(255)  NOT NULL,
    file_type    ENUM('csv','xlsx','json') NOT NULL,
    source_type  ENUM('google_analytics','meta_ads','google_ads','sales','funnel') NOT NULL,
    row_count    INT UNSIGNED  NOT NULL DEFAULT 0,
    error_count  INT UNSIGNED  NOT NULL DEFAULT 0,
    status       ENUM('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
    error_detail JSON,                                     -- hatalı satırların detayı
    created_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,

    INDEX idx_user (user_id),
    INDEX idx_status (status),
    INDEX idx_created (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

### 4.9 `kpi_cache` Tablosu `[YENİ]`

> Her API isteğinde KPI'ların sıfırdan hesaplanması performansı ciddi şekilde düşürür. Hesaplanmış sonuçları saklamak için bu tablo zorunludur.

```sql
CREATE TABLE kpi_cache (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    kpi_type        VARCHAR(100)  NOT NULL,               -- 'traffic_summary', 'roas', vb.
    date_start      DATE          NOT NULL,
    date_end        DATE          NOT NULL,
    filters_hash    VARCHAR(64)   NOT NULL,               -- filtre kombinasyonunun MD5 hash'i
    value           JSON          NOT NULL,               -- hesaplanan KPI değeri/değerleri
    calculated_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at      DATETIME      NOT NULL,               -- TTL: 15 dakika sonrası

    UNIQUE KEY uq_kpi_filter (kpi_type, date_start, date_end, filters_hash),
    INDEX idx_expires (expires_at)
);
```

---

### 4.10 `saved_views` Tablosu `[YENİ]`

> Orijinal dökümanında `GET /views`, `POST /views` endpoint'leri ve "drag-drop yerleşim desteği" tanımlanmış ancak layout verisinin nerede saklanacağı belirtilmemişti.

```sql
CREATE TABLE saved_views (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id       INT UNSIGNED  NOT NULL,
    name          VARCHAR(150)  NOT NULL,
    layout_config JSON          NOT NULL,                 -- grafik konumları, boyutları
    filter_config JSON,                                   -- kayıtlı filtre kombinasyonu
    is_default    BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME      ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_user (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

### 4.11 `segments` Tablosu `[YENİ]`

> Orijinal dökümanında `GET /segments`, `POST /segments` endpoint'leri tanımlanmış ancak segment verilerini tutacak tablo eksikti.

```sql
CREATE TABLE segments (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id     INT UNSIGNED  NOT NULL,
    name        VARCHAR(150)  NOT NULL,
    rules_config JSON         NOT NULL,                   -- segment kuralları (kanal, cihaz, ciro aralığı vb.)
    created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME      ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_user (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

### 4.12 `audit_logs` Tablosu `[YENİ]`

> Bölüm 7'de "Audit Log: Sistemde yapılan kritik işlemler loglanmalıdır" gereksinimi belirtilmiş ancak bu veriyi tutacak tablo tanımlanmamıştı.

```sql
CREATE TABLE audit_logs (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id     INT UNSIGNED,
    action      VARCHAR(100)  NOT NULL,                   -- 'import', 'delete', 'login', 'failed_login' vb.
    entity_type VARCHAR(100),                             -- 'import', 'segment', 'view' vb.
    entity_id   VARCHAR(100),
    ip_address  VARCHAR(45),
    user_agent  VARCHAR(500),
    payload     JSON,                                     -- işlem detayları
    created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_user (user_id),
    INDEX idx_action (action),
    INDEX idx_created (created_at)
);
```

---

### 4.13 Tablo İlişkileri (ER Özeti)

```
users (1) ──────────── (N) import_logs
users (1) ──────────── (N) saved_views
users (1) ──────────── (N) segments
users (1) ──────────── (N) audit_logs

import_logs (1) ─────── (N) traffic_data    (import_id FK)
import_logs (1) ─────── (N) ads_data        (import_id FK)
import_logs (1) ─────── (N) sales_data      (import_id FK)
import_logs (1) ─────── (N) funnel_data     (import_id FK)

campaign_data (1) ───── (N) ads_data        (campaign_name + platform)
channel_mapping ──────── traffic_data       (source + medium)
```

---

## 5. API Uç Noktaları

> **Not:** Tüm endpoint'lerde filtre parametreleri query string olarak gönderilir. Kimlik doğrulama gerektiren endpoint'ler `Authorization: Bearer {token}` header'ı bekler.

### 5.1 Auth Endpoint'leri

| Metot | Endpoint | Açıklama |
|-------|----------|----------|
| POST | `/auth/login` | Kullanıcı girişi, JWT token döner |
| POST | `/auth/refresh` | Access token yeniler |
| POST | `/auth/logout` | Token geçersiz kılar |

### 5.2 Import Endpoint'leri

| Metot | Endpoint | Açıklama |
|-------|----------|----------|
| POST | `/imports` | Yeni veri import işlemi başlatır (dosya yükleme) |
| GET | `/imports` | Import geçmişini listeler |
| GET | `/imports/{id}` | Belirli import işleminin detayını getirir |
| GET | `/imports/{id}/preview` | Yüklenen verinin önizlemesini gösterir (ilk 20 satır) |
| POST | `/imports/{id}/map-columns` | Kolon eşleme işlemini kaydeder |
| POST | `/imports/{id}/validate` | Import edilen veriyi doğrular |
| POST | `/imports/{id}/commit` | Doğrulanan veriyi MySQL'e yazar |
| GET | `/imports/{id}/errors` | Hatalı satırları listeler |
| DELETE | `/imports/{id}` | Import verisini geri alır (rollback) |

### 5.3 Mapping Endpoint'leri

| Metot | Endpoint | Açıklama |
|-------|----------|----------|
| GET | `/mappings/channels` | Kanal eşleme listesini getirir |
| POST | `/mappings/channels` | Yeni kanal eşleme ekler |
| PUT | `/mappings/channels/{id}` | Kanal eşlemeyi günceller |
| DELETE | `/mappings/channels/{id}` | Kanal eşlemeyi siler |

### 5.4 Normalizasyon ve KPI Endpoint'leri

| Metot | Endpoint | Açıklama |
|-------|----------|----------|
| POST | `/normalize/run` | Verileri standart formata dönüştürür |
| POST | `/kpi/run` | KPI hesaplama süreçlerini çalıştırır, cache'i günceller |
| GET | `/kpi/summary` | KPI özet metriklerini döndürür |

### 5.5 Dashboard Endpoint'leri

| Metot | Endpoint | Açıklama |
|-------|----------|----------|
| GET | `/dashboard/trend` | Zaman serisi performans verisini getirir |
| GET | `/dashboard/channel-performance` | Kanal bazlı performansı getirir |
| GET | `/dashboard/platform-performance` | Platform bazlı performansı getirir |
| GET | `/dashboard/campaign-performance` | Kampanya bazlı performansı getirir |
| GET | `/dashboard/funnel` | Funnel analiz verisini getirir |
| GET | `/dashboard/cohort` | Cohort analiz verisini getirir |

### 5.6 Filtre ve Görünüm Endpoint'leri

| Metot | Endpoint | Açıklama |
|-------|----------|----------|
| GET | `/filters/options` | Mevcut veriye göre filtre seçeneklerini getirir (kanal listesi, kampanya listesi vb.) |
| POST | `/filters/validate` | Filtre kombinasyonunu doğrular |
| GET | `/views` | Kaydedilmiş dashboard görünümlerini listeler |
| POST | `/views` | Yeni dashboard görünümü kaydeder |
| PUT | `/views/{id}` | Dashboard görünümünü günceller |
| DELETE | `/views/{id}` | Dashboard görünümünü siler |

### 5.7 Segment Endpoint'leri

| Metot | Endpoint | Açıklama |
|-------|----------|----------|
| GET | `/segments` | Segment listesini getirir |
| POST | `/segments` | Yeni segment oluşturur |
| GET | `/segments/{id}` | Segment detayını getirir |
| PUT | `/segments/{id}` | Segmenti günceller |
| DELETE | `/segments/{id}` | Segmenti siler |
| GET | `/segments/{id}/preview` | Segment önizlemesini getirir |
| POST | `/segments/{id}/apply` | Segmenti uygular ve hesaplar |

### 5.8 Export Endpoint'leri

> **Not:** Orijinal dökümanında export endpoint'leri yalnızca JSON formatında tanımlanmıştı. CSV ve XLSX formatı desteği eklendi.

| Metot | Endpoint | Açıklama |
|-------|----------|----------|
| GET | `/export/kpi-summary` | KPI verilerini dışa aktarır |
| GET | `/export/channel-performance` | Kanal performansını dışa aktarır |
| GET | `/export/campaign-performance` | Kampanya performansını dışa aktarır |
| GET | `/export/raw` | Ham veriyi dışa aktarır |

**Export format parametresi:** `?format=json` (varsayılan) veya `?format=csv` veya `?format=xlsx`

### 5.9 Log Endpoint'leri

| Metot | Endpoint | Açıklama |
|-------|----------|----------|
| GET | `/logs/imports` | Import loglarını getirir |
| GET | `/logs/api` | API loglarını getirir |
| GET | `/logs/audit` | Audit loglarını getirir |

---

## 6. Kullanıcı Arayüzü ve Sayfa Yapısı

| Sayfa | İçerik ve Fonksiyonellik |
|-------|--------------------------|
| **Dashboard** | KPI kartları, zaman serisi grafikler, kanal ve platform dağılım grafikleri, kampanya performans özetleri, filtre paneli, drag-drop yerleşim desteği |
| **Kanal Analizi** | Kanal bazlı ciro, sipariş, dönüşüm oranı ve ROAS analizleri, karşılaştırmalı grafikler, detaylı performans tablosu |
| **Kampanya Analizi** | Kampanya bazlı gelir, harcama, dönüşüm ve ROAS analizleri, hedef ROAS ile gerçek ROAS karşılaştırması, kampanya karşılaştırma grafikleri ve sıralama tabloları |
| **Trafik Analizi** | Trafik kaynakları, kullanıcı davranışı metrikleri, bounce rate ve dönüşüm oranı analizleri, kaynak/medium dağılımı |
| **Funnel Analizi** | Ziyaret → Ürün Görüntüleme → Sepete Ekleme → Ödeme → Satın Alma adımlarının görsel analizi, adım bazlı oran hesaplamaları, kanal ve cihaz bazlı karşılaştırma |
| **Cohort Analizi** | Kullanıcıların ilk etkileşim tarihine göre tekrar satın alma ve retention analizleri, cohort heatmap görünümü |
| **Veri Import** | CSV/XLSX/JSON yükleme alanı, veri önizleme, kolon eşleme, validasyon ekranı, import geçmişi ve hata raporu |
| **Segment Yönetimi** | Kurallı segment oluşturma, segment önizleme, segment bazlı performans analizi |
| **Filtre Yönetimi** | Global filtre ayarları, kayıtlı filtre kombinasyonları, hızlı filtreleme seçenekleri |
| **Kaydedilmiş Görünümler** | Kullanıcıların oluşturduğu dashboard layout ve filtre kombinasyonlarının yönetimi |
| **Export ve Raporlama** | KPI, kanal ve kampanya verilerinin CSV/XLSX/JSON olarak dışa aktarımı |
| **Log ve Sistem İzleme** | Import logları, hata logları, audit logları ve sistem işlem geçmişinin görüntülenmesi |
| **Ayarlar** | Dashboard ayarları, kullanıcı tercihleri, kanal eşleme yönetimi, layout sıfırlama seçenekleri |

---

## 7. Güvenlik ve KVKK Uyumu

### 7.1 Kimlik Doğrulama ve Yetkilendirme

- JWT tabanlı kimlik doğrulama (Access + Refresh token)
- Rol bazlı erişim kontrolü: `admin` tüm işlemleri yapabilir, `viewer` yalnızca okuma yapabilir
- Token süresi: Access token 24 saat, Refresh token 7 gün

### 7.2 API Güvenliği

- **Rate Limiting:** Aynı IP adresinden dakikada en fazla 100 istek kabul edilir. Limitin aşılması durumunda `429 Too Many Requests` döner
- **Input Sanitization:** Tüm gelen veriler SQL injection ve XSS saldırılarına karşı temizlenir
- **Dosya Upload Güvenliği:** Yalnızca izin verilen MIME tipleri kabul edilir (text/csv, application/vnd.ms-excel, application/json). Maksimum 50 MB
- **CORS:** Yalnızca tanımlı frontend origin'lerine izin verilir

### 7.3 Veri Güvenliği

- **Veri Maskeleme:** Hassas şirket verileri (müşteri bilgileri vb.) ekranda maskelenebilir olmalı
- **Şifre Güvenliği:** Kullanıcı şifreleri bcrypt ile hashlenerek saklanır, düz metin asla tutulmaz
- **Şifreli Bağlantı:** Veritabanı bağlantısı SSL/TLS üzerinden yapılır

### 7.4 Loglama

- **Audit Log:** Import, silme, kullanıcı girişi, başarısız giriş denemeleri gibi kritik işlemler `audit_logs` tablosuna kaydedilir
- **Hata Loglama:** API hataları ve yetkisiz erişim denemeleri sistem loglarında kayıt altına alınır
- **Import Loglama:** Her import işleminin durumu, satır sayısı ve hataları `import_logs` tablosunda saklanır

---

## 8. Başarı Senaryoları

Sistemin başarılı sayılabilmesi için aşağıdaki senaryoların tamamı gerçekleştirilebilmelidir:

1. **ROAS Düşüşü Tespiti:** Kanal bazlı ROAS düşüşü tarih filtreleri ile tespit edilebilmeli ve hangi kampanyanın performansının düştüğü görselleştirilebilmeli
2. **Kampanya Karşılaştırması:** İki veya daha fazla kampanyanın gelir, harcama ve dönüşüm metrikleri yan yana karşılaştırılabilmeli
3. **Günlük Ciro Trendi:** Seçilen tarih aralığında günlük ciro değişimi zaman serisi grafiğinde okunabilmeli
4. **Import Hata Yönetimi:** Hatalı formatlı veya eksik kolonlu bir dosya yüklendiğinde sistem kullanıcıyı hangi satırda hata olduğuna dair raporla bilgilendirmeli, hatalı satırları atlayarak geçerli satırları import edebilmeli
5. **Cross-Filter Çalışması:** Dashboard'da kanal filtresine tıklandığında tüm grafikler ve KPI kartları o kanala göre otomatik güncellenmeli
6. **Cihaz Bazlı Analiz:** Mobile, desktop ve tablet cihazlarının dönüşüm oranı ve ciro katkısı ayrı ayrı görüntülenebilmeli
7. **Funnel Darboğaz Tespiti:** Hangi funnel adımında en yüksek kullanıcı kaybının yaşandığı oransal olarak görülebilmeli
8. **Cohort Retention:** Belirli bir ayda ilk siparişini veren müşteri grubunun sonraki aylardaki tekrar satın alma oranı cohort tablosunda izlenebilmeli
9. **Dashboard Layout Kaydı:** Kullanıcı drag-drop ile düzenlediği dashboard görünümünü kaydedebilmeli ve sonraki oturumda aynı layout ile devam edebilmeli
10. **Export Doğruluğu:** Filtrelenmiş KPI verisinin CSV/XLSX olarak dışa aktarılması ve dışa aktarılan verinin ekrandaki veriyle birebir eşleşmesi

---

*Proje Sahipleri:*

| Ad Soyad | E-posta | Telefon |
|----------|---------|---------|
| Emre YAVŞAN | emre.yavsan@sporthink.com.tr | 0541 896 59 48 |
| Mert GÜLSEREN | mert.gulseren@sporthink.com.tr | 0539 925 11 94 |
