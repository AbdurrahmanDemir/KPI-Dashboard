const { Op, fn, col } = require('sequelize');
const { SalesData, AdsData } = require('../models');

const extractAppliedFilters = (rulesConfig = {}) => {
    if (rulesConfig && typeof rulesConfig === 'object' && rulesConfig.derived_filters) {
        return rulesConfig.derived_filters || {};
    }

    return rulesConfig || {};
};

const normalizeSegmentConfig = (segment) => {
    const config = segment?.rules_config || {};

    if (config.segment_type || config.rules || config.derived_filters) {
        return {
            version: 2,
            segment_type: config.segment_type || 'customer',
            description: config.description || '',
            logical_operator: config.logical_operator || 'and',
            rules: config.rules || [],
            derived_filters: extractAppliedFilters(config),
        };
    }

    return {
        version: 1,
        segment_type: 'customer',
        description: '',
        logical_operator: 'and',
        rules: [],
        derived_filters: extractAppliedFilters(config),
    };
};

const buildSalesWhere = (filters = {}) => ({
    ...(filters.city ? { city: filters.city } : {}),
    ...(filters.country ? { country: filters.country } : {}),
    ...(filters.device ? { device: filters.device } : {}),
    ...(filters.channel ? { channel: filters.channel } : {}),
    ...(filters.campaign_name ? { campaign_name: filters.campaign_name } : {}),
    ...(filters.product_name ? { product_name: filters.product_name } : {}),
    order_status: 'completed',
});

const buildAdsWhere = (filters = {}) => ({
    ...(filters.platform ? { platform: filters.platform } : {}),
    ...(filters.campaign_name ? { campaign_name: filters.campaign_name } : {}),
});

const getSegmentPreviewCount = async (segment) => {
    const config = normalizeSegmentConfig(segment);
    const filters = config.derived_filters || {};

    if (config.logical_operator && config.logical_operator !== 'and') {
        return null;
    }

    if (config.segment_type === 'campaign') {
        return AdsData.count({ where: buildAdsWhere(filters), distinct: true, col: 'campaign_name' });
    }

    if (config.segment_type === 'product') {
        return SalesData.count({ where: buildSalesWhere(filters), distinct: true, col: 'product_name' });
    }

    if (config.segment_type === 'customer') {
        const rows = await SalesData.findAll({
            where: buildSalesWhere(filters),
            attributes: ['customer_id', [fn('COUNT', fn('DISTINCT', col('order_id'))), 'order_count'], [fn('SUM', col('order_revenue')), 'revenue_sum']],
            group: ['customer_id'],
            raw: true,
        });

        return rows.filter((row) => {
            if (filters.min_orders && Number(row.order_count || 0) < Number(filters.min_orders)) return false;
            if (filters.min_revenue && Number(row.revenue_sum || 0) < Number(filters.min_revenue)) return false;
            if (filters.max_revenue && Number(row.revenue_sum || 0) > Number(filters.max_revenue)) return false;
            return true;
        }).length;
    }

    if (config.segment_type === 'order') {
        const rows = await SalesData.findAll({
            where: buildSalesWhere(filters),
            attributes: ['order_id', [fn('SUM', col('order_revenue')), 'order_revenue_sum']],
            group: ['order_id'],
            raw: true,
        });

        return rows.filter((row) => {
            if (filters.min_revenue && Number(row.order_revenue_sum || 0) < Number(filters.min_revenue)) return false;
            if (filters.max_revenue && Number(row.order_revenue_sum || 0) > Number(filters.max_revenue)) return false;
            return true;
        }).length;
    }

    return null;
};

module.exports = {
    extractAppliedFilters,
    normalizeSegmentConfig,
    getSegmentPreviewCount,
};
