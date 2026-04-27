const { Op } = require('sequelize');
const TrafficData = require('../models/TrafficData');
const AdsData = require('../models/AdsData');
const SalesData = require('../models/SalesData');

const round = (value, digits = 2) => Number(Number(value || 0).toFixed(digits));

const buildWhereClause = (filters, dateField = 'date') => {
    const where = {};

    if (filters.start_date && filters.end_date) {
        where[dateField] = { [Op.between]: [filters.start_date, filters.end_date] };
    } else if (filters.start_date) {
        where[dateField] = { [Op.gte]: filters.start_date };
    } else if (filters.end_date) {
        where[dateField] = { [Op.lte]: filters.end_date };
    }

    if (filters.platform) where.platform = filters.platform;
    if (filters.campaign_name) where.campaign_name = filters.campaign_name;
    if (filters.product_name) where.product_name = filters.product_name;
    if (filters.city) where.city = filters.city;
    if (filters.device) where.device = filters.device;
    if (filters.country) where.country = filters.country;

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

const toLabel = (channel) => {
    const labels = {
        meta: 'Meta Ads',
        google_ads: 'Google Ads',
        organic: 'Organic',
        direct: 'Direct',
        email: 'Email',
        tiktok: 'TikTok',
        referral: 'Referral',
        other: 'Other'
    };

    return labels[channel] || channel;
};

const matchesChannelFilter = (rawValue, filterChannel) => {
    if (!filterChannel) return true;
    return normalizeChannel(rawValue) === normalizeChannel(filterChannel);
};

const applyAdvancedFilters = (rows, filters) => {
    return rows.filter(row => {
        const roas = row.analytics_roas ?? row.roas ?? row.platform_roas ?? 0;
        const revenue = row.analytics_revenue ?? row.revenue ?? row.total_revenue ?? 0;
        const orders = row.analytics_orders ?? row.orders ?? 0;

        if (filters.min_roas && roas < Number(filters.min_roas)) return false;
        if (filters.min_revenue && revenue < Number(filters.min_revenue)) return false;
        if (filters.max_revenue && revenue > Number(filters.max_revenue)) return false;
        if (filters.min_orders && orders < Number(filters.min_orders)) return false;

        return true;
    });
};

const getTrafficRows = async (filters) => {
    const trafficWhere = buildWhereClause(filters);
    delete trafficWhere.platform;
    delete trafficWhere.country;
    delete trafficWhere.product_name;

    const rows = await TrafficData.findAll({
        where: trafficWhere,
        attributes: [
            'date',
            'channel',
            'campaign_name',
            'sessions',
            'users',
            'new_users',
            'bounce_rate',
            'avg_session_duration',
            'pages_per_session',
            'pages_viewed',
            'conversions'
        ],
        raw: true
    });

    return rows.filter((row) => matchesChannelFilter(row.channel, filters.channel));
};

const getAdsRows = async (filters) => {
    const adsWhere = buildWhereClause(filters);
    delete adsWhere.city;
    delete adsWhere.device;
    delete adsWhere.country;
    delete adsWhere.product_name;

    const rows = await AdsData.findAll({
        where: adsWhere,
        attributes: [
            'date',
            'platform',
            'campaign_name',
            'spend',
            'impressions',
            'clicks',
            'reach',
            'conversions',
            'conversion_value'
        ],
        raw: true
    });

    return rows.filter((row) => matchesChannelFilter(row.platform, filters.channel));
};

const getSalesRows = async (filters, completedOnly = false) => {
    const salesWhere = buildWhereClause(filters, 'order_date');
    delete salesWhere.platform;

    const rows = await SalesData.findAll({
        where: completedOnly ? { ...salesWhere, order_status: 'completed' } : salesWhere,
        attributes: [
            'order_date',
            'channel',
            'campaign_name',
            'city',
            'device',
            'country',
            'product_name',
            'product_category',
            'product_count',
            'order_status',
            'customer_id',
            'order_revenue',
            'refund_amount',
            'attribution_source'
        ],
        raw: true
    });

    return rows.filter((row) => matchesChannelFilter(row.channel, filters.channel));
};

const buildAttributionRows = (trafficRows, adsRows, salesRows, filters) => {
    const grouped = {};

    for (const row of adsRows) {
        const key = normalizeChannel(row.platform);
        grouped[key] ||= {
            id: key,
            channel: toLabel(key),
            spend: 0,
            impressions: 0,
            clicks: 0,
            reach: 0,
            platform_revenue: 0,
            platform_conversions: 0,
            analytics_revenue: 0,
            analytics_orders: 0,
            analytics_sessions: 0
        };

        grouped[key].spend += Number(row.spend || 0);
        grouped[key].impressions += Number(row.impressions || 0);
        grouped[key].clicks += Number(row.clicks || 0);
        grouped[key].reach += Number(row.reach || 0);
        grouped[key].platform_revenue += Number(row.conversion_value || 0);
        grouped[key].platform_conversions += Number(row.conversions || 0);
    }

    for (const row of trafficRows) {
        const key = normalizeChannel(row.channel);
        grouped[key] ||= {
            id: key,
            channel: toLabel(key),
            spend: 0,
            impressions: 0,
            clicks: 0,
            reach: 0,
            platform_revenue: 0,
            platform_conversions: 0,
            analytics_revenue: 0,
            analytics_orders: 0,
            analytics_sessions: 0
        };

        grouped[key].analytics_sessions += Number(row.sessions || 0);
    }

    for (const row of salesRows.filter((item) => item.order_status === 'completed')) {
        const key = normalizeChannel(row.channel);
        grouped[key] ||= {
            id: key,
            channel: toLabel(key),
            spend: 0,
            impressions: 0,
            clicks: 0,
            reach: 0,
            platform_revenue: 0,
            platform_conversions: 0,
            analytics_revenue: 0,
            analytics_orders: 0,
            analytics_sessions: 0
        };

        grouped[key].analytics_revenue += Number(row.order_revenue || 0);
        grouped[key].analytics_orders += 1;
    }

    const rows = Object.values(grouped)
        .map((row) => {
            const ctr = row.impressions > 0 ? (row.clicks / row.impressions) * 100 : 0;
            const analyticsCvr = row.analytics_sessions > 0 ? (row.analytics_orders / row.analytics_sessions) * 100 : 0;
            const platformRoas = row.spend > 0 ? row.platform_revenue / row.spend : 0;
            const analyticsRoas = row.spend > 0 ? row.analytics_revenue / row.spend : 0;
            const attributionGap = row.platform_revenue - row.analytics_revenue;

            let likelyIssue = 'Dengeli';
            if (row.spend > 0 && row.clicks === 0) {
                likelyIssue = 'Teslimat var ama tiklama yok';
            } else if (ctr < 1.2) {
                likelyIssue = 'Ilgi dusuk: kreatif / hedefleme kontrol edilmeli';
            } else if (analyticsCvr < 1) {
                likelyIssue = 'Tiklama var ama satisa donusum zayif';
            } else if (attributionGap > row.analytics_revenue * 0.25) {
                likelyIssue = 'Platform gelir iddiasi analytics kaynagindan yuksek';
            }

            return {
                ...row,
                spend: round(row.spend),
                platform_revenue: round(row.platform_revenue),
                analytics_revenue: round(row.analytics_revenue),
                ctr: round(ctr),
                analytics_cvr: round(analyticsCvr),
                platform_roas: round(platformRoas),
                analytics_roas: round(analyticsRoas),
                attribution_gap: round(attributionGap),
                source_of_truth: filters.channel ? toLabel(normalizeChannel(filters.channel)) : 'Google Analytics',
                likely_issue: likelyIssue
            };
        });

    const filteredRows = applyAdvancedFilters(rows, filters).sort((a, b) => b.analytics_revenue - a.analytics_revenue);

    const totals = filteredRows.reduce((acc, row) => {
        acc.spend += row.spend;
        acc.platform_revenue += row.platform_revenue;
        acc.analytics_revenue += row.analytics_revenue;
        acc.analytics_orders += row.analytics_orders;
        acc.analytics_sessions += row.analytics_sessions;
        return acc;
    }, {
        spend: 0,
        platform_revenue: 0,
        analytics_revenue: 0,
        analytics_orders: 0,
        analytics_sessions: 0
    });

    return {
        rows: filteredRows,
        summary: {
            source_of_truth: 'Google Analytics',
            platform_reported_roas: round(totals.spend > 0 ? totals.platform_revenue / totals.spend : 0),
            analytics_attributed_roas: round(totals.spend > 0 ? totals.analytics_revenue / totals.spend : 0),
            attribution_gap: round(totals.platform_revenue - totals.analytics_revenue),
            analytics_cvr: round(totals.analytics_sessions > 0 ? (totals.analytics_orders / totals.analytics_sessions) * 100 : 0)
        }
    };
};

const getTrafficKPIs = async (filters) => {
    const rows = await getTrafficRows(filters);

    const totals = rows.reduce((acc, row) => {
        const sessions = Number(row.sessions || 0);
        acc.sessions += sessions;
        acc.users += Number(row.users || 0);
        acc.new_users += Number(row.new_users || 0);
        acc.conversions += Number(row.conversions || 0);
        acc.pages_viewed += Number(row.pages_viewed || 0);
        acc.weighted_duration += Number(row.avg_session_duration || 0) * sessions;
        acc.weighted_bounce_rate += Number(row.bounce_rate || 0) * sessions;
        acc.row_count += 1;
        return acc;
    }, {
        sessions: 0,
        users: 0,
        new_users: 0,
        conversions: 0,
        pages_viewed: 0,
        weighted_duration: 0,
        weighted_bounce_rate: 0,
        row_count: 0
    });

    return {
        sessions: totals.sessions,
        users: totals.users,
        new_users: totals.new_users,
        bounce_rate: round(totals.sessions > 0 ? totals.weighted_bounce_rate / totals.sessions : 0),
        avg_duration: round(totals.sessions > 0 ? totals.weighted_duration / totals.sessions : 0),
        pages_per_session: round(totals.sessions > 0 ? totals.pages_viewed / totals.sessions : 0),
        cvr: round(totals.sessions > 0 ? (totals.conversions / totals.sessions) * 100 : 0)
    };
};

const getAdsKPIs = async (filters) => {
    const rows = await getAdsRows(filters);

    const totals = rows.reduce((acc, row) => {
        acc.spend += Number(row.spend || 0);
        acc.impressions += Number(row.impressions || 0);
        acc.clicks += Number(row.clicks || 0);
        acc.reach += Number(row.reach || 0);
        acc.conversions += Number(row.conversions || 0);
        acc.conversion_value += Number(row.conversion_value || 0);
        return acc;
    }, {
        spend: 0,
        impressions: 0,
        clicks: 0,
        reach: 0,
        conversions: 0,
        conversion_value: 0
    });

    return {
        spend: round(totals.spend),
        impressions: totals.impressions,
        clicks: totals.clicks,
        ctr: round(totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0),
        cpc: round(totals.clicks > 0 ? totals.spend / totals.clicks : 0),
        cpm: round(totals.impressions > 0 ? (totals.spend / totals.impressions) * 1000 : 0),
        conversions: totals.conversions,
        cost_per_conversion: round(totals.conversions > 0 ? totals.spend / totals.conversions : 0),
        roas: round(totals.spend > 0 ? totals.conversion_value / totals.spend : 0),
        frequency: round(totals.reach > 0 ? totals.impressions / totals.reach : 0)
    };
};

const getSalesKPIs = async (filters) => {
    const rows = await getSalesRows(filters);
    const completedRows = rows.filter((row) => row.order_status === 'completed');
    const refundedRows = rows.filter((row) => row.order_status === 'refunded');
    const validRevenueRows = rows.filter((row) => row.order_status !== 'cancelled');

    const revenue = completedRows.reduce((sum, row) => sum + Number(row.order_revenue || 0), 0);
    const orders = completedRows.length;
    const itemsSold = completedRows.reduce((sum, row) => sum + Number(row.product_count || 0), 0);
    const uniqueCustomers = new Set(completedRows.map((row) => row.customer_id).filter(Boolean));
    const customerOrderCounts = completedRows.reduce((acc, row) => {
        acc[row.customer_id] = (acc[row.customer_id] || 0) + 1;
        return acc;
    }, {});
    const repeatCustomers = Object.values(customerOrderCounts).filter((count) => count > 1).length;
    const refundAmount = refundedRows.reduce((sum, row) => sum + Number(row.refund_amount || 0), 0);
    const totalRelevantRevenue = validRevenueRows.reduce((sum, row) => sum + Number(row.order_revenue || 0), 0);

    return {
        revenue: round(revenue),
        orders,
        items_sold: itemsSold,
        aov: round(orders > 0 ? revenue / orders : 0),
        revenue_per_user: round(uniqueCustomers.size > 0 ? revenue / uniqueCustomers.size : 0),
        repeat_purchase_rate: round(uniqueCustomers.size > 0 ? (repeatCustomers / uniqueCustomers.size) * 100 : 0),
        refund_rate: round(totalRelevantRevenue > 0 ? (refundAmount / totalRelevantRevenue) * 100 : 0),
        refund_amount: round(refundAmount)
    };
};

const getTrendData = async (filters) => {
    const rows = await getSalesRows(filters, true);

    const grouped = rows.reduce((acc, row) => {
        const key = row.order_date;
        acc[key] ||= { date: key, revenue: 0, orders: 0 };
        acc[key].revenue += Number(row.order_revenue || 0);
        acc[key].orders += 1;
        return acc;
    }, {});

    return Object.values(grouped)
        .sort((a, b) => String(a.date).localeCompare(String(b.date)))
        .map((row) => ({ ...row, revenue: round(row.revenue) }));
};

const getChannelPerformance = async (filters) => {
    const rows = await getSalesRows(filters, true);

    const grouped = rows.reduce((acc, row) => {
        const key = normalizeChannel(row.channel);
        acc[key] ||= { channel: toLabel(key), revenue: 0 };
        acc[key].revenue += Number(row.order_revenue || 0);
        return acc;
    }, {});

    return applyAdvancedFilters(
        Object.values(grouped).map((row) => ({ ...row, revenue: round(row.revenue) })),
        filters
    ).sort((a, b) => b.revenue - a.revenue);
};

const getPlatformDistribution = async (filters) => {
    const rows = await getTrafficRows(filters);

    const grouped = rows.reduce((acc, row) => {
        const key = normalizeChannel(row.channel);
        acc[key] ||= { platform: toLabel(key), sessions: 0 };
        acc[key].sessions += Number(row.sessions || 0);
        return acc;
    }, {});

    return applyAdvancedFilters(Object.values(grouped), filters).sort((a, b) => b.sessions - a.sessions);
};

const getMarketingChannelPerformance = async (filters) => {
    const [adsRows, salesRows] = await Promise.all([getAdsRows(filters), getSalesRows(filters, true)]);
    const grouped = {};

    for (const row of adsRows) {
        const key = normalizeChannel(row.platform);
        grouped[key] ||= { id: key, channel: toLabel(key), spend: 0, impressions: 0, clicks: 0, revenue: 0, analytics_revenue: 0 };
        grouped[key].spend += Number(row.spend || 0);
        grouped[key].impressions += Number(row.impressions || 0);
        grouped[key].clicks += Number(row.clicks || 0);
        grouped[key].revenue += Number(row.conversion_value || 0);
    }

    for (const row of salesRows) {
        const key = normalizeChannel(row.channel);
        grouped[key] ||= { id: key, channel: toLabel(key), spend: 0, impressions: 0, clicks: 0, revenue: 0, analytics_revenue: 0 };
        grouped[key].analytics_revenue += Number(row.order_revenue || 0);
    }

    return applyAdvancedFilters(
        Object.values(grouped).map((row) => ({
            ...row,
            spend: round(row.spend),
            revenue: round(row.revenue),
            analytics_revenue: round(row.analytics_revenue),
            ctr: round(row.impressions > 0 ? (row.clicks / row.impressions) * 100 : 0),
            roas: round(row.spend > 0 ? row.analytics_revenue / row.spend : 0),
            platform_roas: round(row.spend > 0 ? row.revenue / row.spend : 0)
        })),
        filters
    ).sort((a, b) => b.analytics_revenue - a.analytics_revenue);
};

const getSalesCityPerformance = async (filters) => {
    const rows = await getSalesRows(filters);

    const grouped = rows.reduce((acc, row) => {
        const city = row.city || 'Bilinmiyor';
        acc[city] ||= { id: city, city, orders: 0, revenue: 0, refund_amount: 0, total_revenue: 0 };

        if (row.order_status === 'completed') {
            acc[city].orders += 1;
            acc[city].revenue += Number(row.order_revenue || 0);
        }

        if (row.order_status !== 'cancelled') {
            acc[city].total_revenue += Number(row.order_revenue || 0);
        }

        if (row.order_status === 'refunded') {
            acc[city].refund_amount += Number(row.refund_amount || 0);
        }

        return acc;
    }, {});

    return applyAdvancedFilters(
        Object.values(grouped).map((row) => ({
            id: row.id,
            city: row.city,
            orders: row.orders,
            revenue: round(row.revenue),
            refund_rate: round(row.total_revenue > 0 ? (row.refund_amount / row.total_revenue) * 100 : 0)
        })),
        filters
    ).sort((a, b) => b.revenue - a.revenue);
};

const getProductPerformanceSummary = async (filters) => {
    const rows = await getSalesRows(filters, true);

    const grouped = rows.reduce((acc, row) => {
        const key = row.product_name || row.product_category || 'Tanimsiz urun';
        acc[key] ||= {
            id: key,
            product_name: row.product_name || 'Tanimsiz urun',
            product_category: row.product_category || 'Kategorisiz',
            revenue: 0,
            orders: 0,
            items_sold: 0
        };
        acc[key].revenue += Number(row.order_revenue || 0);
        acc[key].orders += 1;
        acc[key].items_sold += Number(row.product_count || 0);
        return acc;
    }, {});

    return applyAdvancedFilters(
        Object.values(grouped).map((row) => ({
            ...row,
            revenue: round(row.revenue),
            aov: round(row.orders > 0 ? row.revenue / row.orders : 0)
        })),
        filters
    )
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);
};

const getAttributionOverview = async (filters) => {
    const [trafficRows, adsRows, salesRows] = await Promise.all([
        getTrafficRows(filters),
        getAdsRows(filters),
        getSalesRows(filters)
    ]);

    return buildAttributionRows(trafficRows, adsRows, salesRows, filters);
};

const getSalesAdFormatPerformance = async (filters) => {
    const rows = await getSalesRows(filters, true);
    
    const grouped = rows.reduce((acc, row) => {
        let format = 'Diğer';
        const channel = (row.channel || '').toLowerCase();
        const campaign = (row.campaign_name || '').toLowerCase();
        
        if (channel.includes('video') || campaign.includes('video')) {
            format = 'Video Reklam';
        } else if (channel.includes('display') || campaign.includes('display') || campaign.includes('gorsel') || campaign.includes('carousel')) {
            format = 'Görsel Reklam (Display)';
        } else if (channel.includes('search') || campaign.includes('search')) {
            format = 'Arama Ağı (Search)';
        } else if (channel.includes('shopping') || campaign.includes('shopping') || campaign.includes('pmax')) {
            format = 'Alışveriş (Shopping)';
        } else if (channel.includes('social') || campaign.includes('meta')) {
            format = 'Sosyal Medya';
        } else if (channel.includes('organic')) {
            format = 'Organik Trafik';
        }

        acc[format] ||= { id: format, format, revenue: 0, orders: 0 };
        acc[format].revenue += Number(row.order_revenue || 0);
        acc[format].orders += 1;
        return acc;
    }, {});

    return applyAdvancedFilters(
        Object.values(grouped).map((row) => ({
            ...row,
            revenue: round(row.revenue)
        })),
        filters
    ).sort((a, b) => b.revenue - a.revenue);
};

module.exports = {
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
};
