/**
 * KPI Dashboard — Dummy Veri Üretici
 * Her kaynak için 500+ satır gerçekçi CSV verisi üretir
 *
 * Çalıştırma: node generate-dummy-data.js
 * Çıktı: ../docs/dummy-data/ klasörüne CSV dosyaları
 */

const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'docs', 'dummy-data');

// Klasör yoksa oluştur
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// ─── Yardımcı Fonksiyonlar ────────────────────────────────────────────────────

const rand = (min, max) => Math.random() * (max - min) + min;
const randInt = (min, max) => Math.floor(rand(min, max + 1));
const randItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const round = (n, d = 2) => parseFloat(n.toFixed(d));

/**
 * Tarih aralığı üretir (2024-01-01 ile 2024-12-31 arası)
 */
function getDateRange(startDate, endDate) {
    const dates = [];
    const current = new Date(startDate);
    const end = new Date(endDate);
    while (current <= end) {
        dates.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
    }
    return dates;
}

const dates = getDateRange('2024-01-01', '2024-12-31');

// ─── 1. GOOGLE ANALYTICS VERİSİ ──────────────────────────────────────────────

function generateGoogleAnalytics() {
    const sources = ['google', 'facebook', 'instagram', 'email', 'direct', 'twitter', 'tiktok', 'bing'];
    const mediums = ['cpc', 'organic', 'referral', 'email', 'social', 'none', 'display'];
    const channelGroups = {
        'google/cpc': 'Paid Search',
        'google/organic': 'Organic Search',
        'facebook/social': 'Paid Social',
        'facebook/cpc': 'Paid Social',
        'instagram/social': 'Paid Social',
        'instagram/cpc': 'Paid Social',
        'email/email': 'Email',
        'direct/none': 'Direct',
        'twitter/social': 'Organic Social',
        'tiktok/social': 'Paid Social',
        'tiktok/cpc': 'Paid Social',
        'bing/cpc': 'Paid Search',
    };

    const rows = ['date,source,medium,channel_group,sessions,users,new_users,bounce_rate,avg_session_duration,pages_per_session,pages_viewed,conversions,revenue'];

    // Her gün için birden fazla kaynak/medium kombinasyonu
    for (const date of dates) {
        const combos = [
            ['google', 'cpc'], ['google', 'organic'],
            ['facebook', 'cpc'], ['instagram', 'cpc'],
            ['email', 'email'], ['direct', 'none'],
            ['tiktok', 'cpc'], ['bing', 'cpc'],
        ];

        for (const [source, medium] of combos) {
            // Mevsimsel etki
            const month = parseInt(date.split('-')[1]);
            const seasonFactor = [0.7, 0.75, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 1.2, 1.1, 1.5, 1.8][month - 1];

            const sessions = randInt(400, 3500) * seasonFactor;
            const users = Math.floor(sessions * rand(0.75, 0.92));
            const newUsers = Math.floor(users * rand(0.55, 0.80));
            const bounceRate = round(rand(28, 68));
            const avgDuration = round(rand(60, 320));
            const pagesPerSession = round(rand(1.8, 6.5));
            const pagesViewed = Math.floor(sessions * pagesPerSession);
            const conversions = Math.floor(sessions * rand(0.01, 0.08) * (source === 'google' ? 1.3 : 1));
            const revenue = round(conversions * rand(180, 950));
            const channelGroup = channelGroups[`${source}/${medium}`] || 'Other';

            rows.push(`${date},${source},${medium},${channelGroup},${Math.floor(sessions)},${users},${newUsers},${bounceRate},${avgDuration},${pagesPerSession},${pagesViewed},${conversions},${revenue}`);
        }
    }

    return rows.join('\n');
}

// ─── 2. META ADS VERİSİ ──────────────────────────────────────────────────────

function generateMetaAds() {
    const campaigns = [
        { name: 'RetargetingKampanya_Q1', id: '23456789001' },
        { name: 'GenisKitle_Marka_2024', id: '23456789002' },
        { name: 'DynamicProduct_Katalog', id: '23456789003' },
        { name: 'VideoReklam_Farkindalik', id: '23456789004' },
        { name: 'Sezon_Kampanyasi_Yaz', id: '23456789005' },
        { name: 'Sezon_Kampanyasi_Kis', id: '23456789006' },
        { name: 'Lookalike_Gold_Musteriler', id: '23456789007' },
    ];

    const adsets = ['Genis_Kitle_18-35', 'Retargeting_30gun', 'Benzer_Kitle_1pct', 'Video_Izleyiciler', 'Sepet_Terk', 'Sadakat_Kitlesi'];
    const adNames = ['Banner_V1', 'Banner_V2', 'Video_15sn', 'Carousel_Urunler', 'Story_Format', 'Collection_Format'];

    const rows = ['date,campaign_name,campaign_id,adset_name,ad_name,impressions,clicks,reach,spend,ctr,cpc,conversions,conversion_value,currency'];

    for (const date of dates) {
        const month = parseInt(date.split('-')[1]);
        const seasonFactor = [0.7, 0.75, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 1.2, 1.1, 1.5, 1.9][month - 1];

        // Her gün 3-5 kampanya aktif
        const activeCampaigns = campaigns.slice(0, randInt(3, 5));

        for (const campaign of activeCampaigns) {
            const adset = randItem(adsets);
            const ad = randItem(adNames);

            const impressions = randInt(15000, 120000) * seasonFactor;
            const reach = Math.floor(impressions * rand(0.65, 0.88));
            const clicks = Math.floor(impressions * rand(0.018, 0.055));
            const spend = round(clicks * rand(1.2, 4.5));
            const ctr = round(clicks / impressions, 4);
            const cpc = round(spend / clicks, 4);
            const conversions = Math.floor(clicks * rand(0.025, 0.12));
            const convValue = round(conversions * rand(150, 1100));

            rows.push(`${date},${campaign.name},${campaign.id},${adset},${ad},${Math.floor(impressions)},${clicks},${reach},${spend},${ctr},${cpc},${conversions},${convValue},TRY`);
        }
    }

    return rows.join('\n');
}

// ─── 3. GOOGLE ADS VERİSİ ────────────────────────────────────────────────────

function generateGoogleAds() {
    const campaigns = [
        { name: 'Search_Marka_2024', id: '987654321' },
        { name: 'Search_Genel_Kategori', id: '987654322' },
        { name: 'Shopping_Urun_Feed', id: '987654323' },
        { name: 'Display_Remarketing', id: '987654324' },
        { name: 'YouTube_TrueView', id: '987654325' },
        { name: 'PMAX_Performans', id: '987654326' },
    ];

    const adGroups = ['Marka_Kelimeleri', 'Genel_Kategoriler', 'Rakip_Kelimeleri', 'Uzun_Kuyruk', 'Urun_Kategorisi', 'Remarketing_Listesi'];

    const rows = ['date,campaign_name,campaign_id,ad_group,impressions,clicks,cost,ctr,avg_cpc,conversions,conversion_value,currency'];

    for (const date of dates) {
        const month = parseInt(date.split('-')[1]);
        const seasonFactor = [0.75, 0.8, 0.95, 1.0, 1.05, 1.1, 1.15, 1.2, 1.1, 1.05, 1.4, 1.7][month - 1];

        const activeCampaigns = campaigns.slice(0, randInt(3, 6));

        for (const campaign of activeCampaigns) {
            const adGroup = randItem(adGroups);
            const impressions = randInt(8000, 80000) * seasonFactor;
            const clicks = Math.floor(impressions * rand(0.04, 0.12));
            const cost = round(clicks * rand(1.5, 5.5));
            const ctr = round(clicks / impressions, 4);
            const avgCpc = round(cost / clicks, 4);
            const conversions = Math.floor(clicks * rand(0.03, 0.14));
            const convValue = round(conversions * rand(180, 1200));

            rows.push(`${date},${campaign.name},${campaign.id},${adGroup},${Math.floor(impressions)},${clicks},${cost},${ctr},${avgCpc},${conversions},${convValue},TRY`);
        }
    }

    return rows.join('\n');
}

// ─── 4. SATIŞ VERİSİ (E-TİCARET) ────────────────────────────────────────────

function generateSalesData() {
    const cities = ['Istanbul', 'Ankara', 'Izmir', 'Bursa', 'Antalya', 'Adana', 'Konya', 'Gaziantep', 'Kayseri', 'Mersin'];
    const devices = ['mobile', 'desktop', 'tablet'];
    const deviceWeights = [0.62, 0.32, 0.06];
    const channels = ['meta', 'google', 'organic', 'email', 'direct', 'tiktok', 'bing'];
    const channelWeights = [0.30, 0.28, 0.18, 0.09, 0.08, 0.05, 0.02];
    const statuses = ['completed', 'completed', 'completed', 'completed', 'cancelled', 'refunded'];
    const paymentMethods = ['credit_card', 'credit_card', 'credit_card', 'bank_transfer', 'digital_wallet'];

    const rows = ['order_id,order_date,customer_id,city,country,device,channel,product_count,order_revenue,discount_amount,refund_amount,order_status,payment_method'];

    let orderNum = 1;
    const customerPool = Array.from({ length: 1800 }, (_, i) => `CUST-${String(i + 1).padStart(4, '0')}`);

    for (const date of dates) {
        const month = parseInt(date.split('-')[1]);
        const dayOfWeek = new Date(date).getDay();
        const seasonFactor = [0.7, 0.75, 0.85, 0.9, 1.0, 1.1, 1.2, 1.3, 1.1, 1.0, 1.6, 2.0][month - 1];
        const weekendBoost = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.3 : 1.0;

        const ordersPerDay = Math.floor(rand(8, 22) * seasonFactor * weekendBoost);

        for (let i = 0; i < ordersPerDay; i++) {
            const orderId = `ORD-2024-${String(orderNum).padStart(5, '0')}`;
            const customerId = randItem(customerPool);
            const city = randItem(cities);
            const device = weightedRandom(devices, deviceWeights);
            const channel = weightedRandom(channels, channelWeights);
            const productCount = randInt(1, 7);
            const orderRevenue = round(rand(120, 3500) * (productCount * 0.7 + 0.3));
            const discountPct = rand(0, 0.25);
            const discountAmount = round(orderRevenue * discountPct);
            const status = randItem(statuses);
            const refundAmount = status === 'refunded' ? round(orderRevenue * rand(0.5, 1.0)) : 0;
            const paymentMethod = randItem(paymentMethods);

            rows.push(`${orderId},${date},${customerId},${city},TR,${device},${channel},${productCount},${orderRevenue},${discountAmount},${refundAmount},${status},${paymentMethod}`);
            orderNum++;
        }
    }

    return rows.join('\n');
}

// ─── 5. FUNNEL VERİSİ ────────────────────────────────────────────────────────

function generateFunnelData() {
    const channels = ['meta', 'google', 'organic', 'email', 'direct', 'tiktok'];
    const devices = ['mobile', 'desktop', 'tablet'];
    const steps = [
        { name: 'visit', order: 1 },
        { name: 'product_view', order: 2 },
        { name: 'add_to_cart', order: 3 },
        { name: 'checkout', order: 4 },
        { name: 'purchase', order: 5 },
    ];

    const rows = ['date,channel,device,step_name,step_order,session_count'];

    for (const date of dates) {
        const month = parseInt(date.split('-')[1]);
        const seasonFactor = [0.7, 0.75, 0.9, 0.95, 1.0, 1.1, 1.2, 1.3, 1.1, 1.0, 1.5, 1.9][month - 1];

        for (const channel of channels) {
            for (const device of devices) {
                // Her kanal/cihaz kombinasyonu için gerçekçi funnel dropo
                const visitCount = Math.floor(rand(500, 3000) * seasonFactor *
                    (channel === 'google' ? 1.3 : channel === 'meta' ? 1.2 : 1.0) *
                    (device === 'mobile' ? 1.5 : device === 'desktop' ? 1.0 : 0.4));

                const dropRates = {
                    product_view: rand(0.50, 0.72),
                    add_to_cart: rand(0.25, 0.42),
                    checkout: rand(0.40, 0.65),
                    purchase: rand(0.55, 0.80),
                };

                let currentCount = visitCount;
                for (const step of steps) {
                    rows.push(`${date},${channel},${device},${step.name},${step.order},${currentCount}`);
                    if (step.name !== 'visit' && dropRates[step.name]) {
                        // Sonraki adım için düşür
                    }
                    // Bir sonraki adıma geçişte kayıp
                    if (step.name === 'visit') currentCount = Math.floor(currentCount * dropRates.product_view);
                    else if (step.name === 'product_view') currentCount = Math.floor(currentCount * dropRates.add_to_cart);
                    else if (step.name === 'add_to_cart') currentCount = Math.floor(currentCount * dropRates.checkout);
                    else if (step.name === 'checkout') currentCount = Math.floor(currentCount * dropRates.purchase);
                }
            }
        }
    }

    return rows.join('\n');
}

// ─── Yardımcı: Ağırlıklı Random Seçim ───────────────────────────────────────

function weightedRandom(items, weights) {
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < items.length; i++) {
        r -= weights[i];
        if (r <= 0) return items[i];
    }
    return items[items.length - 1];
}

// ─── Dosyaları Üret ───────────────────────────────────────────────────────────

console.log('📊 Dummy veri üretimi başlıyor...\n');

const datasets = [
    { name: 'google_analytics', generator: generateGoogleAnalytics },
    { name: 'meta_ads', generator: generateMetaAds },
    { name: 'google_ads', generator: generateGoogleAds },
    { name: 'sales_data', generator: generateSalesData },
    { name: 'funnel_data', generator: generateFunnelData },
];

for (const { name, generator } of datasets) {
    process.stdout.write(`  ⏳ ${name}.csv üretiliyor...`);
    const data = generator();
    const filePath = path.join(OUTPUT_DIR, `${name}.csv`);
    fs.writeFileSync(filePath, data, 'utf8');
    const lines = data.split('\n').length - 1;
    const sizeKB = Math.round(fs.statSync(filePath).size / 1024);
    console.log(` ✅  ${lines} satır, ${sizeKB} KB`);
}

console.log('\n✨ Tüm dosyalar başarıyla üretildi:');
console.log(`   📁 ${OUTPUT_DIR}\n`);
