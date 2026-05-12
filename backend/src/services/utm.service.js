const crypto = require('crypto');
const { Op } = require('sequelize');
const User = require('../models/User');
const UtmLink = require('../models/UtmLink');
const UtmEvent = require('../models/UtmEvent');

const round = (value, digits = 2) => Number(Number(value || 0).toFixed(digits));

const EVENT_TYPES = ['click', 'lead', 'sale'];

const buildTrackingBaseUrl = (req) => `${req.protocol}://${req.get('host')}`;

const normalizeText = (value) => String(value || '').trim();

const parseDays = (value) => {
    if (!value || value === 'all') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 30;
};

const getStartDate = (days) => {
    if (!days) return null;
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (days - 1));
    return date;
};

const getDateKey = (value) => new Date(value).toISOString().slice(0, 10);

const detectDeviceType = (userAgent = '') => {
    const agent = String(userAgent || '').toLowerCase();
    if (agent.includes('tablet') || agent.includes('ipad')) return 'tablet';
    if (agent.includes('mobi') || agent.includes('android')) return 'mobile';
    return 'desktop';
};

const validateDestinationUrl = (value) => {
    let parsed;
    try {
        parsed = new URL(String(value || '').trim());
    } catch {
        throw new Error('Hedef URL gecersiz. Lutfen http:// veya https:// ile tam adres girin.');
    }

    if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error('Sadece http veya https adresleri desteklenir.');
    }

    return parsed.toString();
};

const appendUtmParamsToUrl = (destinationUrl, link) => {
    const url = new URL(destinationUrl);
    const mappings = {
        utm_source: link.utm_source,
        utm_medium: link.utm_medium,
        utm_campaign: link.utm_campaign,
        utm_content: link.utm_content,
        utm_term: link.utm_term,
    };

    Object.entries(mappings).forEach(([key, value]) => {
        if (value) {
            url.searchParams.set(key, value);
        }
    });

    return url.toString();
};

const buildTrackingUrl = (trackingBaseUrl, trackingCode) => `${trackingBaseUrl}/api/utm/track/${trackingCode}`;

const createTrackingCode = async () => {
    for (let index = 0; index < 10; index += 1) {
        const code = crypto.randomBytes(4).toString('hex');
        const existing = await UtmLink.findOne({ where: { tracking_code: code }, attributes: ['id'] });
        if (!existing) return code;
    }

    throw new Error('Takip kodu olusturulamadi. Lutfen tekrar deneyin.');
};

const buildMetricsFromEvents = (events) => {
    return events.reduce((accumulator, event) => {
        const type = event.event_type;
        if (type === 'click') accumulator.clicks += 1;
        if (type === 'lead') accumulator.leads += 1;
        if (type === 'sale') {
            accumulator.sales += 1;
            accumulator.revenue += Number(event.revenue || 0);
        }

        const occurredAt = event.occurred_at ? new Date(event.occurred_at) : null;
        if (occurredAt && (!accumulator.last_activity_at || occurredAt > accumulator.last_activity_at)) {
            accumulator.last_activity_at = occurredAt;
        }

        return accumulator;
    }, {
        clicks: 0,
        leads: 0,
        sales: 0,
        revenue: 0,
        last_activity_at: null,
    });
};

const serializeLink = (link, trackingBaseUrl, metrics = null) => {
    const destination_with_utm = appendUtmParamsToUrl(link.destination_url, link);
    const defaultMetrics = metrics || { clicks: 0, leads: 0, sales: 0, revenue: 0, last_activity_at: null };

    return {
        id: link.id,
        user_id: link.user_id,
        creator_name: link.user?.name || null,
        name: link.name,
        tracking_code: link.tracking_code,
        destination_url: link.destination_url,
        destination_with_utm,
        tracking_url: buildTrackingUrl(trackingBaseUrl, link.tracking_code),
        utm_source: link.utm_source,
        utm_medium: link.utm_medium,
        utm_campaign: link.utm_campaign,
        utm_content: link.utm_content,
        utm_term: link.utm_term,
        notes: link.notes,
        is_active: Boolean(link.is_active),
        created_at: link.created_at,
        updated_at: link.updated_at,
        clicks: defaultMetrics.clicks,
        leads: defaultMetrics.leads,
        sales: defaultMetrics.sales,
        revenue: round(defaultMetrics.revenue),
        lead_rate: round(defaultMetrics.clicks > 0 ? (defaultMetrics.leads / defaultMetrics.clicks) * 100 : 0),
        sale_rate: round(defaultMetrics.clicks > 0 ? (defaultMetrics.sales / defaultMetrics.clicks) * 100 : 0),
        revenue_per_sale: round(defaultMetrics.sales > 0 ? defaultMetrics.revenue / defaultMetrics.sales : 0),
        last_activity_at: defaultMetrics.last_activity_at,
    };
};

const getScopedEvents = async ({ days = null, linkId = null }) => {
    const where = {};
    const startDate = getStartDate(days);

    if (startDate) {
        where.occurred_at = { [Op.gte]: startDate };
    }

    if (linkId) {
        where.utm_link_id = linkId;
    }

    return UtmEvent.findAll({
        where,
        order: [['occurred_at', 'ASC']],
        raw: true,
    });
};

const getScopedLinks = async ({ linkId = null, activeOnly = false }) => {
    const where = {};

    if (linkId) {
        where.id = linkId;
    }

    if (activeOnly) {
        where.is_active = true;
    }

    return UtmLink.findAll({
        where,
        include: [{ model: User, as: 'user', attributes: ['id', 'name'] }],
        order: [['created_at', 'DESC']],
    });
};

const createLink = async (payload, userId, trackingBaseUrl) => {
    const destinationUrl = validateDestinationUrl(payload.destination_url);
    const trackingCode = await createTrackingCode();

    const link = await UtmLink.create({
        user_id: userId,
        name: normalizeText(payload.name),
        tracking_code: trackingCode,
        destination_url: destinationUrl,
        utm_source: normalizeText(payload.utm_source),
        utm_medium: normalizeText(payload.utm_medium),
        utm_campaign: normalizeText(payload.utm_campaign),
        utm_content: normalizeText(payload.utm_content) || null,
        utm_term: normalizeText(payload.utm_term) || null,
        notes: normalizeText(payload.notes) || null,
        is_active: payload.is_active !== false,
    });

    const populatedLink = await UtmLink.findByPk(link.id, {
        include: [{ model: User, as: 'user', attributes: ['id', 'name'] }],
    });

    return serializeLink(populatedLink, trackingBaseUrl);
};

const updateLinkStatus = async (id, isActive, trackingBaseUrl) => {
    const link = await UtmLink.findByPk(id, {
        include: [{ model: User, as: 'user', attributes: ['id', 'name'] }],
    });

    if (!link) {
        throw new Error('UTM linki bulunamadi.');
    }

    await link.update({ is_active: Boolean(isActive) });
    return serializeLink(link, trackingBaseUrl);
};

const listLinks = async (trackingBaseUrl) => {
    const [links, events] = await Promise.all([
        getScopedLinks({}),
        getScopedEvents({}),
    ]);

    const eventsByLinkId = events.reduce((map, event) => {
        map[event.utm_link_id] ||= [];
        map[event.utm_link_id].push(event);
        return map;
    }, {});

    return links.map((link) => {
        const metrics = buildMetricsFromEvents(eventsByLinkId[link.id] || []);
        return serializeLink(link, trackingBaseUrl, metrics);
    });
};

const recordEvent = async (linkId, payload) => {
    return UtmEvent.create({
        utm_link_id: linkId,
        event_type: payload.event_type,
        event_source: payload.event_source,
        revenue: payload.revenue || 0,
        session_key: payload.session_key || null,
        referrer: payload.referrer || null,
        device_type: payload.device_type || null,
        metadata: payload.metadata || null,
        occurred_at: payload.occurred_at || new Date(),
    });
};

const recordTrackingClick = async (trackingCode, requestMeta) => {
    const link = await UtmLink.findOne({ where: { tracking_code: trackingCode, is_active: true } });
    if (!link) {
        throw new Error('UTM linki bulunamadi veya pasif durumda.');
    }

    await recordEvent(link.id, {
        event_type: 'click',
        event_source: 'tracking_redirect',
        referrer: requestMeta.referrer,
        session_key: requestMeta.session_key,
        device_type: requestMeta.device_type,
        metadata: requestMeta.metadata,
    });

    return appendUtmParamsToUrl(link.destination_url, link);
};

const recordPublicEvent = async (trackingCode, payload) => {
    const link = await UtmLink.findOne({ where: { tracking_code: trackingCode, is_active: true } });
    if (!link) {
        throw new Error('UTM linki bulunamadi veya pasif durumda.');
    }

    if (!['lead', 'sale'].includes(payload.event_type)) {
        throw new Error('Sadece lead veya sale etkinligi kaydedilebilir.');
    }

    await recordEvent(link.id, {
        event_type: payload.event_type,
        event_source: 'public_event_api',
        revenue: payload.event_type === 'sale' ? Number(payload.revenue || 0) : 0,
        session_key: payload.session_key || null,
        referrer: payload.referrer || null,
        device_type: payload.device_type || null,
        metadata: payload.metadata || null,
        occurred_at: payload.occurred_at ? new Date(payload.occurred_at) : new Date(),
    });
};

const simulateLinkActivity = async (id, payload) => {
    const link = await UtmLink.findByPk(id);
    if (!link) {
        throw new Error('UTM linki bulunamadi.');
    }

    const clicks = Math.max(0, Number(payload.clicks || 0));
    const leads = Math.max(0, Number(payload.leads || 0));
    const sales = Math.max(0, Number(payload.sales || 0));
    const revenue = Math.max(0, Number(payload.revenue || 0));
    const spreadDays = Math.max(1, Number(payload.spread_days || 7));

    const events = [];
    const pushEvent = (eventType, eventRevenue = 0) => {
        const occurredAt = new Date();
        occurredAt.setDate(occurredAt.getDate() - Math.floor(Math.random() * spreadDays));
        occurredAt.setHours(8 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 60), 0, 0);
        events.push({
            utm_link_id: id,
            event_type: eventType,
            event_source: 'manual_simulation',
            revenue: eventRevenue,
            device_type: ['desktop', 'mobile', 'tablet'][Math.floor(Math.random() * 3)],
            metadata: { simulated: true },
            occurred_at: occurredAt,
        });
    };

    for (let index = 0; index < clicks; index += 1) pushEvent('click');
    for (let index = 0; index < leads; index += 1) pushEvent('lead');
    for (let index = 0; index < sales; index += 1) pushEvent('sale', sales > 0 ? revenue / sales : 0);

    if (events.length > 0) {
        await UtmEvent.bulkCreate(events);
    }

    return {
        clicks,
        leads,
        sales,
        revenue: round(revenue),
        created_events: events.length,
    };
};

const getAnalytics = async ({ trackingBaseUrl, days = null, linkId = null }) => {
    const [links, events] = await Promise.all([
        getScopedLinks({ linkId }),
        getScopedEvents({ days, linkId }),
    ]);

    const linkIds = new Set(links.map((link) => link.id));
    const filteredEvents = events.filter((event) => linkIds.has(event.utm_link_id));
    const linkMetricsMap = {};
    const sourceMediumMap = {};
    const campaignMap = {};
    const trendMap = {};
    const eventMix = { click: 0, lead: 0, sale: 0 };

    filteredEvents.forEach((event) => {
        const link = links.find((item) => item.id === event.utm_link_id);
        if (!link) return;

        linkMetricsMap[link.id] ||= { clicks: 0, leads: 0, sales: 0, revenue: 0, last_activity_at: null };
        const metrics = linkMetricsMap[link.id];
        const occurredAt = event.occurred_at ? new Date(event.occurred_at) : null;
        const dateKey = occurredAt ? getDateKey(occurredAt) : getDateKey(new Date());
        const sourceKey = `${link.utm_source}::${link.utm_medium}`;
        const campaignKey = link.utm_campaign;

        trendMap[dateKey] ||= { date: dateKey, clicks: 0, leads: 0, sales: 0, revenue: 0 };
        sourceMediumMap[sourceKey] ||= {
            source: link.utm_source,
            medium: link.utm_medium,
            clicks: 0,
            leads: 0,
            sales: 0,
            revenue: 0,
        };
        campaignMap[campaignKey] ||= {
            campaign: link.utm_campaign,
            clicks: 0,
            leads: 0,
            sales: 0,
            revenue: 0,
        };

        if (event.event_type === 'click') {
            metrics.clicks += 1;
            trendMap[dateKey].clicks += 1;
            sourceMediumMap[sourceKey].clicks += 1;
            campaignMap[campaignKey].clicks += 1;
            eventMix.click += 1;
        }

        if (event.event_type === 'lead') {
            metrics.leads += 1;
            trendMap[dateKey].leads += 1;
            sourceMediumMap[sourceKey].leads += 1;
            campaignMap[campaignKey].leads += 1;
            eventMix.lead += 1;
        }

        if (event.event_type === 'sale') {
            const eventRevenue = Number(event.revenue || 0);
            metrics.sales += 1;
            metrics.revenue += eventRevenue;
            trendMap[dateKey].sales += 1;
            trendMap[dateKey].revenue += eventRevenue;
            sourceMediumMap[sourceKey].sales += 1;
            sourceMediumMap[sourceKey].revenue += eventRevenue;
            campaignMap[campaignKey].sales += 1;
            campaignMap[campaignKey].revenue += eventRevenue;
            eventMix.sale += 1;
        }

        if (occurredAt && (!metrics.last_activity_at || occurredAt > metrics.last_activity_at)) {
            metrics.last_activity_at = occurredAt;
        }
    });

    const linksWithMetrics = links.map((link) => serializeLink(link, trackingBaseUrl, linkMetricsMap[link.id]));
    const activeLinks = linksWithMetrics.filter((item) => item.is_active).length;

    const summary = linksWithMetrics.reduce((accumulator, link) => {
        accumulator.total_links += 1;
        accumulator.clicks += link.clicks;
        accumulator.leads += link.leads;
        accumulator.sales += link.sales;
        accumulator.revenue += Number(link.revenue || 0);
        return accumulator;
    }, {
        total_links: 0,
        clicks: 0,
        leads: 0,
        sales: 0,
        revenue: 0,
    });

    const normalizedTrend = Object.values(trendMap)
        .sort((a, b) => String(a.date).localeCompare(String(b.date)))
        .map((row) => ({ ...row, revenue: round(row.revenue) }));

    const sourceMediumRows = Object.values(sourceMediumMap)
        .map((row) => ({
            ...row,
            revenue: round(row.revenue),
            lead_rate: round(row.clicks > 0 ? (row.leads / row.clicks) * 100 : 0),
            sale_rate: round(row.clicks > 0 ? (row.sales / row.clicks) * 100 : 0),
        }))
        .sort((a, b) => b.revenue - a.revenue || b.clicks - a.clicks);

    const campaignRows = Object.values(campaignMap)
        .map((row) => ({
            ...row,
            revenue: round(row.revenue),
            lead_rate: round(row.clicks > 0 ? (row.leads / row.clicks) * 100 : 0),
            sale_rate: round(row.clicks > 0 ? (row.sales / row.clicks) * 100 : 0),
        }))
        .sort((a, b) => b.revenue - a.revenue || b.clicks - a.clicks);

    return {
        summary: {
            ...summary,
            active_links: activeLinks,
            revenue: round(summary.revenue),
            lead_rate: round(summary.clicks > 0 ? (summary.leads / summary.clicks) * 100 : 0),
            sale_rate: round(summary.clicks > 0 ? (summary.sales / summary.clicks) * 100 : 0),
        },
        trend: normalizedTrend,
        source_medium_breakdown: sourceMediumRows,
        campaign_breakdown: campaignRows,
        link_breakdown: linksWithMetrics,
        event_mix: [
            { label: 'Tıklama', value: eventMix.click },
            { label: 'Lead', value: eventMix.lead },
            { label: 'Satış', value: eventMix.sale },
        ],
    };
};

module.exports = {
    buildTrackingBaseUrl,
    createLink,
    updateLinkStatus,
    listLinks,
    getAnalytics,
    recordTrackingClick,
    recordPublicEvent,
    simulateLinkActivity,
    detectDeviceType,
};
