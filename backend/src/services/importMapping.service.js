const SOURCE_FIELDS = {
    sales: [
        'order_id',
        'order_date',
        'customer_id',
        'city',
        'country',
        'device',
        'channel',
        'source',
        'medium',
        'campaign_name',
        'product_name',
        'product_category',
        'product_sku',
        'product_count',
        'order_revenue',
        'shipping_cost',
        'discount_amount',
        'refund_amount',
        'net_revenue',
        'order_status',
        'payment_method'
    ],
    google_analytics: [
        'date',
        'source',
        'medium',
        'campaign_name',
        'channel_group',
        'channel',
        'device',
        'city',
        'sessions',
        'users',
        'new_users',
        'bounce_rate',
        'avg_session_duration',
        'pages_per_session',
        'pages_viewed',
        'conversions',
        'revenue'
    ],
    meta_ads: [
        'date',
        'campaign_name',
        'platform_id',
        'adset',
        'ad_name',
        'impressions',
        'clicks',
        'reach',
        'spend',
        'ctr',
        'cpc',
        'conversions',
        'conversion_value',
        'currency'
    ],
    google_ads: [
        'date',
        'campaign_name',
        'platform_id',
        'ad_group',
        'ad_name',
        'impressions',
        'clicks',
        'reach',
        'spend',
        'ctr',
        'cpc',
        'conversions',
        'conversion_value',
        'currency'
    ],
    funnel: ['date', 'channel', 'device', 'step_name', 'step_order', 'session_count']
};

const FIELD_ALIASES = {
    sales: {
        order_id: ['order_id', 'id', 'siparis_id', 'order number'],
        order_date: ['order_date', 'date', 'created_at', 'orderdatetime', 'order date'],
        customer_id: ['customer_id', 'customer.id', 'musteri_id'],
        city: ['city', 'sehir'],
        country: ['country', 'ulke'],
        device: ['device', 'devicecategory', 'segments.device'],
        channel: ['channel', 'sessiondefaultchannelgroup', 'defaultchannelgroup'],
        source: ['source', 'sessionsource'],
        medium: ['medium', 'sessionmedium'],
        campaign_name: ['campaign_name', 'sessioncampaignname', 'campaign.name', 'campaign'],
        product_name: ['product_name', 'item_name', 'product', 'urun_adi', 'product title'],
        product_category: ['product_category', 'item_category', 'category', 'urun_kategori'],
        product_sku: ['product_sku', 'sku', 'item_id', 'product_id'],
        product_count: ['product_count', 'quantity', 'items'],
        order_revenue: ['order_revenue', 'revenue', 'gross_revenue', 'total'],
        shipping_cost: ['shipping_cost', 'cargo', 'shipping'],
        discount_amount: ['discount_amount', 'discount'],
        refund_amount: ['refund_amount', 'refund'],
        net_revenue: ['net_revenue', 'net'],
        order_status: ['order_status', 'status'],
        payment_method: ['payment_method', 'payment']
    },
    google_analytics: {
        date: ['date', 'segments.date', 'day'],
        source: ['source', 'sessionsource', 'sourceplatform'],
        medium: ['medium', 'sessionmedium'],
        campaign_name: ['campaign_name', 'sessioncampaignname', 'campaign'],
        channel_group: ['channel_group', 'sessiondefaultchannelgroup', 'defaultchannelgroup'],
        channel: ['channel', 'sessiondefaultchannelgroup'],
        device: ['device', 'devicecategory'],
        city: ['city'],
        sessions: ['sessions'],
        users: ['users', 'totalusers'],
        new_users: ['new_users', 'newusers'],
        bounce_rate: ['bounce_rate', 'bouncerate'],
        avg_session_duration: ['avg_session_duration', 'averagesessionduration', 'avg_duration'],
        pages_per_session: ['pages_per_session', 'screenpageviewspersession'],
        pages_viewed: ['pages_viewed', 'screenpageviews', 'pageviews'],
        conversions: ['conversions', 'transactions', 'engagedsessions'],
        revenue: ['revenue', 'purchaserevenue']
    },
    meta_ads: {
        date: ['date', 'date_start', 'date_stop'],
        campaign_name: ['campaign_name', 'campaign.name'],
        platform_id: ['platform_id', 'campaign_id', 'campaign.id', 'account_id'],
        adset: ['adset', 'adset_name', 'ad_set_name'],
        ad_name: ['ad_name', 'adname'],
        impressions: ['impressions'],
        clicks: ['clicks', 'inline_link_clicks', 'actions:link_click'],
        reach: ['reach'],
        spend: ['spend'],
        ctr: ['ctr', 'inline_link_click_ctr'],
        cpc: ['cpc'],
        conversions: ['conversions', 'actions:offsite_conversion.fb_pixel_purchase'],
        conversion_value: ['conversion_value', 'action_values:offsite_conversion.fb_pixel_purchase'],
        currency: ['currency']
    },
    google_ads: {
        date: ['date', 'segments.date'],
        campaign_name: ['campaign_name', 'campaign.name'],
        platform_id: ['platform_id', 'campaign.id', 'customer.id'],
        ad_group: ['ad_group', 'ad_group.name'],
        ad_name: ['ad_name', 'segments.product_title', 'ad_group_criterion.keyword.text'],
        impressions: ['impressions', 'metrics.impressions'],
        clicks: ['clicks', 'metrics.clicks'],
        reach: ['reach'],
        spend: ['spend', 'metrics.cost_micros'],
        ctr: ['ctr', 'metrics.ctr'],
        cpc: ['cpc', 'metrics.average_cpc'],
        conversions: ['conversions', 'metrics.conversions'],
        conversion_value: ['conversion_value', 'metrics.conversions_value'],
        currency: ['currency']
    },
    funnel: {
        date: ['date'],
        channel: ['channel', 'sessiondefaultchannelgroup'],
        device: ['device', 'devicecategory'],
        step_name: ['step_name', 'step'],
        step_order: ['step_order', 'order'],
        session_count: ['session_count', 'user_count', 'users']
    }
};

const REQUIRED_FIELDS = {
    sales: ['order_id', 'order_date', 'customer_id', 'channel', 'order_revenue'],
    google_analytics: ['date', 'channel_group', 'sessions', 'users'],
    meta_ads: ['date', 'campaign_name', 'impressions', 'clicks', 'spend'],
    google_ads: ['date', 'campaign_name', 'impressions', 'clicks', 'spend'],
    funnel: ['date', 'channel', 'step_name', 'step_order', 'session_count']
};

const normalizeKey = (value = '') =>
    String(value)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');

const getSourceFields = (sourceType) => SOURCE_FIELDS[sourceType] || [];
const getRequiredFields = (sourceType) => REQUIRED_FIELDS[sourceType] || [];

const suggestMapping = (sourceType, headers = []) => {
    const aliases = FIELD_ALIASES[sourceType] || {};
    const normalizedHeaders = headers.map((header) => ({
        original: header,
        normalized: normalizeKey(header)
    }));
    const usedHeaders = new Set();
    const mapping = {};

    for (const targetField of getSourceFields(sourceType)) {
        const candidates = [targetField, ...(aliases[targetField] || [])].map(normalizeKey);
        const match = normalizedHeaders.find(
            (header) => !usedHeaders.has(header.original) && candidates.includes(header.normalized)
        );

        if (match) {
            mapping[match.original] = targetField;
            usedHeaders.add(match.original);
        }
    }

    return mapping;
};

module.exports = {
    getSourceFields,
    getRequiredFields,
    suggestMapping
};
