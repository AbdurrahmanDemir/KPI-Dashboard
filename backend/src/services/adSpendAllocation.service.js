const { Op } = require('sequelize');
const SalesData = require('../models/SalesData');

const ALLOCATION_FILTERS = ['city', 'device', 'country', 'product_name'];

const hasAllocationFilters = (filters = {}) =>
    ALLOCATION_FILTERS.some((key) => Boolean(filters[key]));

const buildDateWhere = (filters, field = 'order_date') => {
    const where = {};

    if (filters.start_date && filters.end_date) {
        where[field] = { [Op.between]: [filters.start_date, filters.end_date] };
    } else if (filters.start_date) {
        where[field] = { [Op.gte]: filters.start_date };
    } else if (filters.end_date) {
        where[field] = { [Op.lte]: filters.end_date };
    }

    return where;
};

const normalizeChannel = (value) => {
    const raw = String(value || '').trim().toLowerCase();
    if (!raw) return 'other';
    if (raw.includes('meta') || raw.includes('facebook') || raw.includes('instagram') || raw.includes('paid social')) return 'meta';
    if (raw.includes('google_ads') || raw.includes('adwords') || raw.includes('paid search') || raw === 'google') return 'google_ads';
    if (raw.includes('organic')) return 'organic';
    if (raw.includes('direct') || raw === '(direct)') return 'direct';
    if (raw.includes('email') || raw.includes('crm') || raw.includes('newsletter')) return 'email';
    if (raw.includes('tiktok')) return 'tiktok';
    if (raw.includes('referral')) return 'referral';
    return raw.replace(/\s+/g, '_');
};

const matchesChannel = (rawValue, filterChannel) => {
    if (!filterChannel) return true;
    return normalizeChannel(rawValue) === normalizeChannel(filterChannel);
};

const saleKeys = (row) => {
    const channel = normalizeChannel(row.channel);
    const campaign = row.campaign_name || '';
    const date = String(row.order_date || '');
    return [
        `date_campaign_channel::${date}::${campaign}::${channel}`,
        `campaign_channel::${campaign}::${channel}`,
        `channel::${channel}`,
        'all'
    ];
};

const adKeys = (row) => {
    const channel = normalizeChannel(row.platform);
    const campaign = row.campaign_name || '';
    const date = String(row.date || '');
    return [
        `date_campaign_channel::${date}::${campaign}::${channel}`,
        `campaign_channel::${campaign}::${channel}`,
        `channel::${channel}`,
        'all'
    ];
};

const addToMap = (map, key, revenue, orders) => {
    const current = map.get(key) || { revenue: 0, orders: 0 };
    current.revenue += revenue;
    current.orders += orders;
    map.set(key, current);
};

const buildSalesShareMap = (rows, filters) => {
    const map = new Map();
    const channelFilter = filters.channel || filters.platform;

    for (const row of rows) {
        if (!matchesChannel(row.channel, channelFilter)) continue;
        const revenue = Number(row.order_revenue || 0);
        const orders = 1;
        for (const key of saleKeys(row)) {
            addToMap(map, key, revenue, orders);
        }
    }

    return map;
};

const getSalesRowsForAllocation = async (filters, includeAllocationFilters) => {
    const where = {
        ...buildDateWhere(filters, 'order_date'),
        ...(filters.campaign_name ? { campaign_name: filters.campaign_name } : {}),
        ...(includeAllocationFilters && filters.city ? { city: filters.city } : {}),
        ...(includeAllocationFilters && filters.device ? { device: filters.device } : {}),
        ...(includeAllocationFilters && filters.country ? { country: filters.country } : {}),
        ...(includeAllocationFilters && filters.product_name ? { product_name: filters.product_name } : {}),
        order_status: 'completed'
    };

    return SalesData.findAll({
        where,
        attributes: ['order_date', 'channel', 'campaign_name', 'order_revenue'],
        raw: true
    });
};

const resolveShare = (adRow, filteredMap, baseMap) => {
    for (const key of adKeys(adRow)) {
        const filtered = filteredMap.get(key);
        const base = baseMap.get(key);

        if (!base) continue;

        if (base.revenue > 0) {
            return Math.min(Math.max((filtered?.revenue || 0) / base.revenue, 0), 1);
        }

        if (base.orders > 0) {
            return Math.min(Math.max((filtered?.orders || 0) / base.orders, 0), 1);
        }
    }

    return 0;
};

const allocateAdRowsBySalesShare = async (adRows, filters = {}) => {
    if (!hasAllocationFilters(filters) || adRows.length === 0) return adRows;

    const [filteredSalesRows, baseSalesRows] = await Promise.all([
        getSalesRowsForAllocation(filters, true),
        getSalesRowsForAllocation(filters, false)
    ]);

    const filteredMap = buildSalesShareMap(filteredSalesRows, filters);
    const baseMap = buildSalesShareMap(baseSalesRows, filters);

    return adRows.map((row) => {
        const share = resolveShare(row, filteredMap, baseMap);
        return {
            ...row,
            spend: Number(row.spend || 0) * share,
            impressions: Number(row.impressions || 0) * share,
            clicks: Number(row.clicks || 0) * share,
            reach: Number(row.reach || 0) * share,
            conversions: Number(row.conversions || 0) * share,
            conversion_value: Number(row.conversion_value || 0) * share,
            spend_allocation_factor: share,
            spend_allocation_method: 'Reklam verisinde şehir/cihaz/ürün kırılımı olmadığı için harcama satış payına göre tahmini dağıtıldı.'
        };
    });
};

module.exports = {
    allocateAdRowsBySalesShare,
    hasAllocationFilters
};
