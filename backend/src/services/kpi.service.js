const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const TrafficData = require('../models/TrafficData');
const AdsData = require('../models/AdsData');
const SalesData = require('../models/SalesData');

/**
 * Filtre oluşturucu
 * @param {Object} filters - start_date, end_date, channel vs.
 */
const buildWhereClause = (filters, dateField = 'date') => {
    const where = {};
    if (filters.start_date && filters.end_date) {
        where[dateField] = { [Op.between]: [filters.start_date, filters.end_date] };
    } else if (filters.start_date) {
        where[dateField] = { [Op.gte]: filters.start_date };
    } else if (filters.end_date) {
        where[dateField] = { [Op.lte]: filters.end_date };
    }

    if (filters.channel) where.channel = filters.channel;
    if (filters.platform) where.platform = filters.platform; // Sadece Ads için
    if (filters.campaign_name) where.campaign_name = filters.campaign_name;
    if (filters.city) where.city = filters.city; // Sadece Satış için

    return where;
};

// ─── 1. TRAFİK KPI'LARI ────────────────────────────────────────────────────────
const getTrafficKPIs = async (filters) => {
    const where = buildWhereClause(filters);
    
    // Ads modelinde channel yok, Traffic modelinde platform yok
    // Bu yüzden filtreler modele özgü temizlenebilir:
    const trafficWhere = { ...where };
    delete trafficWhere.platform;
    delete trafficWhere.campaign_name;
    delete trafficWhere.city;

    const result = await TrafficData.findOne({
        where: trafficWhere,
        attributes: [
            [sequelize.fn('SUM', sequelize.col('sessions')), 'total_sessions'],
            [sequelize.fn('SUM', sequelize.col('users')), 'total_users'],
            [sequelize.fn('SUM', sequelize.col('new_users')), 'total_new_users'],
            [sequelize.fn('AVG', sequelize.col('bounce_rate')), 'avg_bounce_rate'],
            [sequelize.fn('AVG', sequelize.col('avg_session_duration')), 'avg_duration'],
            [sequelize.fn('AVG', sequelize.col('pages_per_session')), 'avg_pages_per_session'],
            [sequelize.fn('SUM', sequelize.col('conversions')), 'total_conversions'],
        ],
        raw: true,
    });

    const sessions = parseInt(result.total_sessions || 0);
    const conversions = parseInt(result.total_conversions || 0);
    const cvr = sessions > 0 ? (conversions / sessions) * 100 : 0;

    return {
        sessions,
        users: parseInt(result.total_users || 0),
        new_users: parseInt(result.total_new_users || 0),
        bounce_rate: parseFloat(result.avg_bounce_rate || 0),
        avg_duration: parseFloat(result.avg_duration || 0),
        pages_per_session: parseFloat(result.avg_pages_per_session || 0),
        cvr: parseFloat(cvr.toFixed(2)),
    };
};

// ─── 2. REKLAM KPI'LARI ────────────────────────────────────────────────────────
const getAdsKPIs = async (filters) => {
    const where = buildWhereClause(filters);
    
    const adsWhere = { ...where };
    delete adsWhere.channel;
    delete adsWhere.city;

    const result = await AdsData.findOne({
        where: adsWhere,
        attributes: [
            [sequelize.fn('SUM', sequelize.col('spend')), 'total_spend'],
            [sequelize.fn('SUM', sequelize.col('impressions')), 'total_impressions'],
            [sequelize.fn('SUM', sequelize.col('clicks')), 'total_clicks'],
            [sequelize.fn('SUM', sequelize.col('reach')), 'total_reach'],
            [sequelize.fn('SUM', sequelize.col('conversions')), 'total_conversions'],
            [sequelize.fn('SUM', sequelize.col('conversion_value')), 'total_conversion_value'],
        ],
        raw: true,
    });

    const spend = parseFloat(result.total_spend || 0);
    const impressions = parseInt(result.total_impressions || 0);
    const clicks = parseInt(result.total_clicks || 0);
    const conversions = parseInt(result.total_conversions || 0);
    const convValue = parseFloat(result.total_conversion_value || 0);
    const reach = parseInt(result.total_reach || 0);

    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const cpc = clicks > 0 ? (spend / clicks) : 0;
    const cpm = impressions > 0 ? (spend / impressions) * 1000 : 0;
    const cost_per_conversion = conversions > 0 ? (spend / conversions) : 0;
    const roas = spend > 0 ? (convValue / spend) : 0;
    const frequency = reach > 0 ? (impressions / reach) : 0;

    return {
        spend,
        impressions,
        clicks,
        ctr: parseFloat(ctr.toFixed(2)),
        cpc: parseFloat(cpc.toFixed(2)),
        cpm: parseFloat(cpm.toFixed(2)),
        conversions,
        cost_per_conversion: parseFloat(cost_per_conversion.toFixed(2)),
        roas: parseFloat(roas.toFixed(2)),
        frequency: parseFloat(frequency.toFixed(2)),
    };
};

// ─── 3. SATIŞ KPI'LARI ─────────────────────────────────────────────────────────
const getSalesKPIs = async (filters) => {
    const where = buildWhereClause(filters, 'order_date');
    
    const salesWhere = { ...where };
    delete salesWhere.platform;
    delete salesWhere.campaign_name;
    // Sadece tamamlanmış siparişleri baz alıyoruz
    salesWhere.order_status = 'completed';

    const result = await SalesData.findOne({
        where: salesWhere,
        attributes: [
            [sequelize.fn('SUM', sequelize.col('order_revenue')), 'total_revenue'],
            [sequelize.fn('COUNT', sequelize.col('id')), 'total_orders'],
            [sequelize.fn('SUM', sequelize.col('product_count')), 'total_items_sold'],
            [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('customer_id'))), 'unique_customers'],
        ],
        raw: true,
    });

    // İadeler (refunded)
    const refundWhere = { ...salesWhere, order_status: 'refunded' };
    const refundResult = await SalesData.findOne({
        where: refundWhere,
        attributes: [
            [sequelize.fn('SUM', sequelize.col('refund_amount')), 'total_refund'],
            [sequelize.fn('COUNT', sequelize.col('id')), 'total_refund_orders'],
        ],
        raw: true,
    });

    const revenue = parseFloat(result.total_revenue || 0);
    const orders = parseInt(result.total_orders || 0);
    const items_sold = parseInt(result.total_items_sold || 0);
    const unique_customers = parseInt(result.unique_customers || 0);
    
    const refund_amount = parseFloat(refundResult.total_refund || 0);
    const refund_orders = parseInt(refundResult.total_refund_orders || 0);

    const aov = orders > 0 ? (revenue / orders) : 0;
    const revenue_per_user = unique_customers > 0 ? (revenue / unique_customers) : 0;
    
    // Basit Repeat Purchase Rate tahmini (sipariş sayısı üzerinden)
    const repeat_purchase_rate = unique_customers > 0 ? ((orders - unique_customers) / unique_customers) * 100 : 0;
    const refund_rate = orders > 0 ? (refund_orders / (orders + refund_orders)) * 100 : 0;

    return {
        revenue,
        orders,
        items_sold,
        aov: parseFloat(aov.toFixed(2)),
        revenue_per_user: parseFloat(revenue_per_user.toFixed(2)),
        repeat_purchase_rate: parseFloat(Math.max(0, repeat_purchase_rate).toFixed(2)),
        refund_rate: parseFloat(refund_rate.toFixed(2)),
        refund_amount,
    };
};

// ─── 4. TREND VERİSİ ──────────────────────────────────────────────────────────
const getTrendData = async (filters) => {
    // Örnek: Ciro trendi
    const where = buildWhereClause(filters, 'order_date');
    const salesWhere = { ...where, order_status: 'completed' };
    delete salesWhere.platform;
    delete salesWhere.campaign_name;

    const trends = await SalesData.findAll({
        where: salesWhere,
        attributes: [
            'order_date',
            [sequelize.fn('SUM', sequelize.col('order_revenue')), 'revenue'],
            [sequelize.fn('COUNT', sequelize.col('id')), 'orders']
        ],
        group: ['order_date'],
        order: [['order_date', 'ASC']],
        raw: true,
    });

    return trends.map(t => ({
        date: t.order_date,
        revenue: parseFloat(t.revenue || 0),
        orders: parseInt(t.orders || 0)
    }));
};

module.exports = {
    getTrafficKPIs,
    getAdsKPIs,
    getSalesKPIs,
    getTrendData
};
