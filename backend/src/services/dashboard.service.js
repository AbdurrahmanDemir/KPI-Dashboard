const { Op } = require('sequelize');
const FunnelData = require('../models/FunnelData');
const TrafficData = require('../models/TrafficData');
const AdsData = require('../models/AdsData');
const SalesData = require('../models/SalesData');

const round = (value, digits = 2) => Number(Number(value || 0).toFixed(digits));

const buildDateWhere = (filters, field = 'date') => {
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
    if (raw.includes('email')) return 'email';
    if (raw.includes('tiktok')) return 'tiktok';
    return raw.replace(/\s+/g, '_');
};

const matchesChannel = (rawValue, filterChannel) => {
    if (!filterChannel) return true;
    return normalizeChannel(rawValue) === normalizeChannel(filterChannel);
};

const labelForChannel = (channel) => {
    const labels = {
        meta: 'Meta Ads',
        google_ads: 'Google Ads',
        organic: 'Organic',
        direct: 'Direct',
        email: 'Email',
        tiktok: 'TikTok',
        other: 'Other'
    };
    return labels[channel] || channel;
};

const getChannelPerformance = async (filters) => {
    const rows = await SalesData.findAll({
        where: {
            ...buildDateWhere(filters, 'order_date'),
            ...(filters.city ? { city: filters.city } : {}),
            ...(filters.device ? { device: filters.device } : {}),
            ...(filters.country ? { country: filters.country } : {}),
            ...(filters.campaign_name ? { campaign_name: filters.campaign_name } : {}),
            ...(filters.product_name ? { product_name: filters.product_name } : {}),
            order_status: 'completed'
        },
        attributes: ['channel', 'campaign_name', 'product_name', 'order_revenue'],
        raw: true
    });

    const grouped = rows.reduce((acc, row) => {
        if (!matchesChannel(row.channel, filters.channel)) return acc;
        const key = normalizeChannel(row.channel);
        acc[key] ||= { channel: labelForChannel(key), revenue: 0 };
        acc[key].revenue += Number(row.order_revenue || 0);
        return acc;
    }, {});

    return Object.values(grouped).map((row) => ({ ...row, revenue: round(row.revenue) })).sort((a, b) => b.revenue - a.revenue);
};

const getPlatformPerformance = async (filters) => {
    const rows = await AdsData.findAll({
        where: buildDateWhere(filters),
        attributes: ['platform', 'spend', 'impressions', 'clicks', 'conversions', 'conversion_value', 'campaign_name'],
        raw: true
    });

    const grouped = rows.reduce((acc, row) => {
        if (filters.platform && row.platform !== filters.platform) return acc;
        if (!matchesChannel(row.platform, filters.channel)) return acc;
        const key = row.platform || 'other';
        acc[key] ||= { platform: labelForChannel(key), spend: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0 };
        acc[key].spend += Number(row.spend || 0);
        acc[key].impressions += Number(row.impressions || 0);
        acc[key].clicks += Number(row.clicks || 0);
        acc[key].conversions += Number(row.conversions || 0);
        acc[key].revenue += Number(row.conversion_value || 0);
        return acc;
    }, {});

    return Object.values(grouped).map((row) => ({
        ...row,
        spend: round(row.spend),
        revenue: round(row.revenue),
        ctr: round(row.impressions > 0 ? (row.clicks / row.impressions) * 100 : 0),
        roas: round(row.spend > 0 ? row.revenue / row.spend : 0)
    })).sort((a, b) => b.revenue - a.revenue);
};

const getCampaignPerformance = async (filters) => {
    const [adRows, salesRows, trafficRows] = await Promise.all([
        AdsData.findAll({
            where: {
                ...buildDateWhere(filters),
                ...(filters.platform ? { platform: filters.platform } : {}),
                ...(filters.campaign_name ? { campaign_name: filters.campaign_name } : {})
            },
            attributes: ['campaign_name', 'platform', 'spend', 'impressions', 'clicks', 'conversions', 'conversion_value'],
            raw: true
        }),
        SalesData.findAll({
            where: {
                ...buildDateWhere(filters, 'order_date'),
                ...(filters.campaign_name ? { campaign_name: filters.campaign_name } : {}),
                ...(filters.product_name ? { product_name: filters.product_name } : {}),
                order_status: 'completed'
            },
            attributes: ['campaign_name', 'channel', 'order_revenue'],
            raw: true
        }),
        TrafficData.findAll({
            where: {
                ...buildDateWhere(filters),
                ...(filters.campaign_name ? { campaign_name: filters.campaign_name } : {})
            },
            attributes: ['campaign_name', 'channel', 'sessions', 'conversions'],
            raw: true
        })
    ]);

    const grouped = {};

    for (const row of adRows) {
        if (!matchesChannel(row.platform, filters.channel)) continue;
        const key = `${row.platform}::${row.campaign_name}`;
        grouped[key] ||= {
            campaign_name: row.campaign_name,
            platform: labelForChannel(row.platform),
            spend: 0,
            impressions: 0,
            clicks: 0,
            conversions: 0,
            platform_revenue: 0,
            analytics_revenue: 0,
            sessions: 0,
            analytics_conversions: 0
        };
        grouped[key].spend += Number(row.spend || 0);
        grouped[key].impressions += Number(row.impressions || 0);
        grouped[key].clicks += Number(row.clicks || 0);
        grouped[key].conversions += Number(row.conversions || 0);
        grouped[key].platform_revenue += Number(row.conversion_value || 0);
    }

    for (const row of salesRows) {
        if (!matchesChannel(row.channel, filters.channel)) continue;
        const channel = normalizeChannel(row.channel);
        const key = `${channel}::${row.campaign_name}`;
        grouped[key] ||= {
            campaign_name: row.campaign_name,
            platform: labelForChannel(channel),
            spend: 0,
            impressions: 0,
            clicks: 0,
            conversions: 0,
            platform_revenue: 0,
            analytics_revenue: 0,
            sessions: 0,
            analytics_conversions: 0
        };
        grouped[key].analytics_revenue += Number(row.order_revenue || 0);
        grouped[key].analytics_conversions += 1;
    }

    for (const row of trafficRows) {
        if (!matchesChannel(row.channel, filters.channel)) continue;
        const channel = normalizeChannel(row.channel);
        const key = `${channel}::${row.campaign_name}`;
        grouped[key] ||= {
            campaign_name: row.campaign_name,
            platform: labelForChannel(channel),
            spend: 0,
            impressions: 0,
            clicks: 0,
            conversions: 0,
            platform_revenue: 0,
            analytics_revenue: 0,
            sessions: 0,
            analytics_conversions: 0
        };
        grouped[key].sessions += Number(row.sessions || 0);
    }

    return Object.values(grouped).map((row) => {
        const ctr = row.impressions > 0 ? (row.clicks / row.impressions) * 100 : 0;
        const analyticsCvr = row.sessions > 0 ? (row.analytics_conversions / row.sessions) * 100 : 0;
        const platformRoas = row.spend > 0 ? row.platform_revenue / row.spend : 0;
        const analyticsRoas = row.spend > 0 ? row.analytics_revenue / row.spend : 0;

        return {
            ...row,
            spend: round(row.spend),
            platform_revenue: round(row.platform_revenue),
            analytics_revenue: round(row.analytics_revenue),
            ctr: round(ctr),
            analytics_cvr: round(analyticsCvr),
            platform_roas: round(platformRoas),
            analytics_roas: round(analyticsRoas)
        };
    }).sort((a, b) => b.analytics_revenue - a.analytics_revenue);
};

const getProductPerformance = async (filters) => {
    const rows = await SalesData.findAll({
        where: {
            ...buildDateWhere(filters, 'order_date'),
            ...(filters.campaign_name ? { campaign_name: filters.campaign_name } : {}),
            ...(filters.product_name ? { product_name: filters.product_name } : {}),
            ...(filters.city ? { city: filters.city } : {}),
            ...(filters.device ? { device: filters.device } : {}),
            ...(filters.country ? { country: filters.country } : {}),
            order_status: 'completed'
        },
        attributes: ['product_name', 'product_category', 'channel', 'product_count', 'order_revenue'],
        raw: true
    });

    const grouped = rows.reduce((acc, row) => {
        if (!matchesChannel(row.channel, filters.channel)) return acc;
        const key = row.product_name || row.product_category || 'Tanimsiz urun';
        acc[key] ||= {
            product_name: row.product_name || 'Tanimsiz urun',
            product_category: row.product_category || 'Kategorisiz',
            revenue: 0,
            items_sold: 0,
            orders: 0
        };
        acc[key].revenue += Number(row.order_revenue || 0);
        acc[key].items_sold += Number(row.product_count || 0);
        acc[key].orders += 1;
        return acc;
    }, {});

    return Object.values(grouped)
        .map((row) => ({
            ...row,
            revenue: round(row.revenue),
            aov: round(row.orders > 0 ? row.revenue / row.orders : 0)
        }))
        .sort((a, b) => b.revenue - a.revenue);
};

const getAttributionAnalysis = async (filters) => {
    const [trafficRows, adRows, salesRows] = await Promise.all([
        TrafficData.findAll({
            where: {
                ...buildDateWhere(filters),
                ...(filters.campaign_name ? { campaign_name: filters.campaign_name } : {})
            },
            attributes: ['channel', 'sessions', 'conversions'],
            raw: true
        }),
        AdsData.findAll({
            where: {
                ...buildDateWhere(filters),
                ...(filters.platform ? { platform: filters.platform } : {}),
                ...(filters.campaign_name ? { campaign_name: filters.campaign_name } : {})
            },
            attributes: ['platform', 'spend', 'impressions', 'clicks', 'conversion_value'],
            raw: true
        }),
        SalesData.findAll({
            where: {
                ...buildDateWhere(filters, 'order_date'),
                ...(filters.campaign_name ? { campaign_name: filters.campaign_name } : {}),
                ...(filters.product_name ? { product_name: filters.product_name } : {}),
                order_status: 'completed'
            },
            attributes: ['channel', 'order_revenue'],
            raw: true
        })
    ]);

    const grouped = {};

    for (const row of adRows) {
        if (!matchesChannel(row.platform, filters.channel)) continue;
        const key = normalizeChannel(row.platform);
        grouped[key] ||= { channel: labelForChannel(key), spend: 0, impressions: 0, clicks: 0, platform_revenue: 0, analytics_revenue: 0, sessions: 0, orders: 0 };
        grouped[key].spend += Number(row.spend || 0);
        grouped[key].impressions += Number(row.impressions || 0);
        grouped[key].clicks += Number(row.clicks || 0);
        grouped[key].platform_revenue += Number(row.conversion_value || 0);
    }

    for (const row of trafficRows) {
        if (!matchesChannel(row.channel, filters.channel)) continue;
        const key = normalizeChannel(row.channel);
        grouped[key] ||= { channel: labelForChannel(key), spend: 0, impressions: 0, clicks: 0, platform_revenue: 0, analytics_revenue: 0, sessions: 0, orders: 0 };
        grouped[key].sessions += Number(row.sessions || 0);
    }

    for (const row of salesRows) {
        if (!matchesChannel(row.channel, filters.channel)) continue;
        const key = normalizeChannel(row.channel);
        grouped[key] ||= { channel: labelForChannel(key), spend: 0, impressions: 0, clicks: 0, platform_revenue: 0, analytics_revenue: 0, sessions: 0, orders: 0 };
        grouped[key].analytics_revenue += Number(row.order_revenue || 0);
        grouped[key].orders += 1;
    }

    const rows = Object.values(grouped).map((row) => {
        const ctr = row.impressions > 0 ? (row.clicks / row.impressions) * 100 : 0;
        const cvr = row.sessions > 0 ? (row.orders / row.sessions) * 100 : 0;
        const analyticsRoas = row.spend > 0 ? row.analytics_revenue / row.spend : 0;
        const platformRoas = row.spend > 0 ? row.platform_revenue / row.spend : 0;

        let diagnosis = 'Attribution dengeli';
        if (ctr < 1.2) diagnosis = 'Ust huni zayif: kreatif veya hedefleme kontrol edilmeli';
        else if (cvr < 1) diagnosis = 'Alt huni zayif: urun, teklif veya landing page kontrol edilmeli';
        else if (row.platform_revenue > row.analytics_revenue * 1.25) diagnosis = 'Platform revenue analytics kaynagini asiyor';

        return {
            ...row,
            spend: round(row.spend),
            analytics_revenue: round(row.analytics_revenue),
            platform_revenue: round(row.platform_revenue),
            analytics_roas: round(analyticsRoas),
            platform_roas: round(platformRoas),
            ctr: round(ctr),
            cvr: round(cvr),
            attribution_gap: round(row.platform_revenue - row.analytics_revenue),
            diagnosis
        };
    }).sort((a, b) => b.analytics_revenue - a.analytics_revenue);

    return {
        summary: {
            source_of_truth: 'Google Analytics',
            total_analytics_revenue: round(rows.reduce((sum, row) => sum + row.analytics_revenue, 0)),
            total_platform_revenue: round(rows.reduce((sum, row) => sum + row.platform_revenue, 0)),
            total_gap: round(rows.reduce((sum, row) => sum + row.attribution_gap, 0))
        },
        rows
    };
};

const getFunnelPerformance = async (filters) => {
    const rows = await FunnelData.findAll({
        where: {
            ...buildDateWhere(filters),
            ...(filters.device ? { device: filters.device } : {})
        },
        attributes: ['channel', 'device', 'step_name', 'step_order', 'session_count'],
        raw: true,
        order: [['step_order', 'ASC']]
    });

    const filteredRows = rows.filter((row) => matchesChannel(row.channel, filters.channel));
    const grouped = filteredRows.reduce((acc, row) => {
        const step = row.step_name;
        acc[step] ||= { step_name: step, step_order: row.step_order, session_count: 0 };
        acc[step].session_count += Number(row.session_count || 0);
        return acc;
    }, {});

    const ordered = Object.values(grouped).sort((a, b) => a.step_order - b.step_order);
    const first = ordered[0]?.session_count || 0;
    return ordered.map((row, index) => ({
        ...row,
        conversion_rate: round(first > 0 ? (row.session_count / first) * 100 : 0),
        dropoff_rate: index === 0 ? 0 : round(ordered[index - 1].session_count > 0 ? ((ordered[index - 1].session_count - row.session_count) / ordered[index - 1].session_count) * 100 : 0)
    }));
};

const getCohortPerformance = async (filters) => {
    const rows = await SalesData.findAll({
        where: {
            ...buildDateWhere(filters, 'order_date'),
            ...(filters.city ? { city: filters.city } : {}),
            ...(filters.device ? { device: filters.device } : {}),
            ...(filters.country ? { country: filters.country } : {}),
            ...(filters.campaign_name ? { campaign_name: filters.campaign_name } : {}),
            ...(filters.product_name ? { product_name: filters.product_name } : {}),
            order_status: 'completed'
        },
        attributes: ['customer_id', 'order_date', 'channel'],
        raw: true,
        order: [['order_date', 'ASC']]
    });

    const filteredRows = rows.filter((row) => matchesChannel(row.channel, filters.channel));
    const firstPurchaseByCustomer = new Map();
    for (const row of filteredRows) {
        if (!firstPurchaseByCustomer.has(row.customer_id)) {
            firstPurchaseByCustomer.set(row.customer_id, String(row.order_date).slice(0, 7));
        }
    }

    const grouped = {};
    for (const row of filteredRows) {
        const cohort = firstPurchaseByCustomer.get(row.customer_id);
        const orderMonth = String(row.order_date).slice(0, 7);
        const monthsSince = Math.max(0, (Number(orderMonth.slice(0, 4)) - Number(cohort.slice(0, 4))) * 12 + (Number(orderMonth.slice(5, 7)) - Number(cohort.slice(5, 7))));
        const key = `${cohort}::${monthsSince}`;
        grouped[key] ||= { cohort_month: cohort, month_offset: monthsSince, customers: new Set(), orders: 0 };
        grouped[key].customers.add(row.customer_id);
        grouped[key].orders += 1;
    }

    const cohortSizes = {};
    Object.values(grouped).forEach((row) => {
        if (row.month_offset === 0) {
            cohortSizes[row.cohort_month] = row.customers.size;
        }
    });

    return Object.values(grouped)
        .map((row) => ({
            cohort_month: row.cohort_month,
            month_offset: row.month_offset,
            customers: row.customers.size,
            orders: row.orders,
            retention_rate: round((row.customers.size / (cohortSizes[row.cohort_month] || row.customers.size || 1)) * 100)
        }))
        .sort((a, b) => a.cohort_month.localeCompare(b.cohort_month) || a.month_offset - b.month_offset);
};

const getFilterOptions = async () => {
    const [trafficChannels, salesChannels, adsPlatforms, adCampaigns, salesCampaigns, products, cities, devices, countries] = await Promise.all([
        TrafficData.findAll({ attributes: ['channel'], group: ['channel'], raw: true }),
        SalesData.findAll({ attributes: ['channel'], group: ['channel'], raw: true }),
        AdsData.findAll({ attributes: ['platform'], group: ['platform'], raw: true }),
        AdsData.findAll({ attributes: ['campaign_name'], group: ['campaign_name'], raw: true }),
        SalesData.findAll({ attributes: ['campaign_name'], group: ['campaign_name'], raw: true }),
        SalesData.findAll({ attributes: ['product_name'], group: ['product_name'], raw: true }),
        SalesData.findAll({ attributes: ['city'], group: ['city'], raw: true }),
        SalesData.findAll({ attributes: ['device'], group: ['device'], raw: true }),
        SalesData.findAll({ attributes: ['country'], group: ['country'], raw: true })
    ]);

    const channelSet = new Set([...trafficChannels, ...salesChannels].map((row) => normalizeChannel(row.channel)).filter(Boolean));

    return {
        channels: Array.from(channelSet).map((channel) => ({ value: channel, label: labelForChannel(channel) })),
        platforms: adsPlatforms.map((row) => ({ value: row.platform, label: labelForChannel(row.platform) })),
        campaigns: Array.from(new Set([...adCampaigns, ...salesCampaigns].map((row) => row.campaign_name).filter(Boolean))).sort(),
        products: products.map((row) => row.product_name).filter(Boolean).sort(),
        cities: cities.map((row) => row.city).filter(Boolean).sort(),
        devices: devices.map((row) => row.device).filter(Boolean).sort(),
        countries: countries.map((row) => row.country).filter(Boolean).sort()
    };
};

module.exports = {
    getChannelPerformance,
    getPlatformPerformance,
    getCampaignPerformance,
    getProductPerformance,
    getAttributionAnalysis,
    getFunnelPerformance,
    getCohortPerformance,
    getFilterOptions
};
