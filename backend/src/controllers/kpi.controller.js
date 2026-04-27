const {
    getTrafficKPIs,
    getAdsKPIs,
    getSalesKPIs,
    getTrendData,
    getChannelPerformance,
    getPlatformDistribution,
    getMarketingChannelPerformance,
    getSalesCityPerformance,
    getProductPerformanceSummary,
    getAttributionOverview,
    getSalesAdFormatPerformance
} = require('../services/kpi.service');
const { successResponse, errorResponse } = require('../utils/response');
const crypto = require('crypto');
const KpiCache = require('../models/KpiCache');
const { Op } = require('sequelize');
const KPI_CACHE_SCHEMA_VERSION = 'v2';

// ─── GET /kpi/summary ──────────────────────────────────────────────────────────
const getSummary = async (req, res) => {
    try {
        const filters = {
            start_date: req.query.start_date,
            end_date: req.query.end_date,
            channel: req.query.channel,
            platform: req.query.platform,
            campaign_name: req.query.campaign_name,
            product_name: req.query.product_name,
            city: req.query.city,
            device: req.query.device,
            country: req.query.country,
            min_revenue: req.query.min_revenue,
            max_revenue: req.query.max_revenue,
            min_roas: req.query.min_roas,
            min_orders: req.query.min_orders,
        };

        // 1. Filtreleri standartlaştır ve Hash üret
        const filterStr = JSON.stringify({
            version: KPI_CACHE_SCHEMA_VERSION,
            filters
        });
        const filtersHash = crypto.createHash('md5').update(filterStr).digest('hex');
        
        const kpiType = 'summary';
        const dateStart = filters.start_date || '2000-01-01';
        const dateEnd = filters.end_date || '2099-12-31';

        // 2. Cache kontrolü (Süresi dolmamışları getir)
        const cached = await KpiCache.findOne({
            where: {
                kpi_type: kpiType,
                date_start: dateStart,
                date_end: dateEnd,
                filters_hash: filtersHash,
                expires_at: { [Op.gt]: new Date() }
            }
        });

        if (cached) {
            return successResponse(res, cached.value);
        }

        // 3. Cache'de yoksa veya süresi dolmuşsa hesapla
        const [traffic, ads, sales, channelPerformance, platformDistribution, marketingChannels, salesByCity, productPerformance, attributionAnalysis, salesAdFormatPerformance] = await Promise.all([
            getTrafficKPIs(filters),
            getAdsKPIs(filters),
            getSalesKPIs(filters),
            getChannelPerformance(filters),
            getPlatformDistribution(filters),
            getMarketingChannelPerformance(filters),
            getSalesCityPerformance(filters),
            getProductPerformanceSummary(filters),
            getAttributionOverview(filters),
            getSalesAdFormatPerformance(filters)
        ]);

        const resultData = {
            traffic,
            ads,
            sales,
            breakdowns: {
                channel_performance: channelPerformance,
                platform_distribution: platformDistribution,
                marketing_channels: marketingChannels,
                sales_by_city: salesByCity,
                product_performance: productPerformance,
                sales_by_ad_format: salesAdFormatPerformance
            },
            attribution: attributionAnalysis
        };

        // 4. Yeni sonucu Cache tablosuna kaydet (Varsa güncelle - UPSERT mantığı için)
        const ttlMinutes = parseInt(process.env.KPI_CACHE_TTL_MINUTES || 15);
        const expiresAt = new Date(Date.now() + ttlMinutes * 60000);

        // Önceki expire olmuş aynı key varsa silebiliriz veya create yerine upsert kullanabiliriz
        const existingCache = await KpiCache.findOne({
            where: { kpi_type: kpiType, date_start: dateStart, date_end: dateEnd, filters_hash: filtersHash }
        });

        if (existingCache) {
            await existingCache.update({ value: resultData, expires_at: expiresAt, calculated_at: new Date() });
        } else {
            await KpiCache.create({
                kpi_type: kpiType,
                date_start: dateStart,
                date_end: dateEnd,
                filters_hash: filtersHash,
                value: resultData,
                expires_at: expiresAt
            });
        }

        return successResponse(res, resultData);
    } catch (err) {
        console.error('[KPI] Summary Error:', err);
        return errorResponse(res, 500, 'INTERNAL_ERROR', 'KPI özeti hesaplanırken hata oluştu.');
    }
};

// ─── GET /kpi/trend ────────────────────────────────────────────────────────────
const getTrend = async (req, res) => {
    try {
        const filters = {
            start_date: req.query.start_date,
            end_date: req.query.end_date,
            channel: req.query.channel,
            platform: req.query.platform,
            campaign_name: req.query.campaign_name,
            product_name: req.query.product_name,
            city: req.query.city,
            device: req.query.device,
            country: req.query.country,
            min_revenue: req.query.min_revenue,
            max_revenue: req.query.max_revenue,
            min_roas: req.query.min_roas,
            min_orders: req.query.min_orders,
        };

        // Cache kontrolü
        const filterStr = JSON.stringify({ version: KPI_CACHE_SCHEMA_VERSION, filters });
        const filtersHash = crypto.createHash('md5').update(filterStr).digest('hex');
        const kpiType = 'trend';
        const dateStart = filters.start_date || '2000-01-01';
        const dateEnd = filters.end_date || '2099-12-31';

        const cached = await KpiCache.findOne({
            where: { kpi_type: kpiType, date_start: dateStart, date_end: dateEnd, filters_hash: filtersHash, expires_at: { [Op.gt]: new Date() } }
        });

        if (cached) return successResponse(res, cached.value);

        const trend = await getTrendData(filters);

        const ttlMinutes = parseInt(process.env.KPI_CACHE_TTL_MINUTES || 15);
        const expiresAt = new Date(Date.now() + ttlMinutes * 60000);
        const existing = await KpiCache.findOne({ where: { kpi_type: kpiType, date_start: dateStart, date_end: dateEnd, filters_hash: filtersHash } });
        if (existing) {
            await existing.update({ value: trend, expires_at: expiresAt, calculated_at: new Date() });
        } else {
            await KpiCache.create({ kpi_type: kpiType, date_start: dateStart, date_end: dateEnd, filters_hash: filtersHash, value: trend, expires_at: expiresAt });
        }

        return successResponse(res, trend);
    } catch (err) {
        console.error('[KPI] Trend Error:', err);
        return errorResponse(res, 500, 'INTERNAL_ERROR', 'Trend verisi alınırken hata oluştu.');
    }
};

// ─── POST /kpi/run ─────────────────────────────────────────────────────────────
const clearCache = async (req, res) => {
    try {
        await KpiCache.destroy({ where: {} });
        return successResponse(res, { message: 'Tüm KPI önbelleği (cache) temizlendi ve hesaplamaya hazır.' });
    } catch (err) {
        return errorResponse(res, 500, 'INTERNAL_ERROR', 'Önbellek temizlenirken hata oluştu.');
    }
};

module.exports = {
    getSummary,
    getTrend,
    clearCache
};
