export const SEGMENT_TYPES = [
    {
        key: 'customer',
        label: 'Müşteri',
        description: 'Müşteri davranışı ve sipariş geçmişi odaklı filtreler.',
        fields: ['city', 'country', 'device', 'channel', 'campaign_name', 'product_name', 'min_orders', 'min_revenue'],
    },
    {
        key: 'order',
        label: 'Sipariş',
        description: 'Sipariş, ciro ve kanal bazlı filtreler.',
        fields: ['channel', 'campaign_name', 'product_name', 'city', 'country', 'device', 'min_revenue', 'max_revenue', 'min_orders'],
    },
    {
        key: 'product',
        label: 'Ürün',
        description: 'Ürün ve kategori performansı odaklı filtreler.',
        fields: ['product_name', 'channel', 'campaign_name', 'city', 'country', 'min_revenue', 'min_orders'],
    },
    {
        key: 'campaign',
        label: 'Kampanya',
        description: 'Kampanya ve reklam performansı odaklı filtreler.',
        fields: ['platform', 'channel', 'campaign_name', 'city', 'device', 'country', 'min_roas', 'min_revenue', 'min_orders'],
    },
];

export const RULE_FIELDS = {
    city: { key: 'city', label: 'Şehir', type: 'select', operators: ['equals'], filterKey: 'city' },
    country: { key: 'country', label: 'Ülke', type: 'select', operators: ['equals'], filterKey: 'country' },
    device: { key: 'device', label: 'Cihaz', type: 'select', operators: ['equals'], filterKey: 'device' },
    channel: { key: 'channel', label: 'Kanal', type: 'select', operators: ['equals'], filterKey: 'channel' },
    platform: { key: 'platform', label: 'Platform', type: 'select', operators: ['equals'], filterKey: 'platform' },
    campaign_name: { key: 'campaign_name', label: 'Kampanya', type: 'select', operators: ['equals'], filterKey: 'campaign_name' },
    product_name: { key: 'product_name', label: 'Ürün', type: 'select', operators: ['equals'], filterKey: 'product_name' },
    min_revenue: { key: 'min_revenue', label: 'Toplam Ciro', type: 'number', operators: ['gte', 'lte'], minFilterKey: 'min_revenue', maxFilterKey: 'max_revenue' },
    max_revenue: { key: 'max_revenue', label: 'Maksimum Ciro', type: 'number', operators: ['lte'], maxFilterKey: 'max_revenue' },
    min_roas: { key: 'min_roas', label: 'ROAS', type: 'number', operators: ['gte'], minFilterKey: 'min_roas' },
    min_orders: { key: 'min_orders', label: 'Toplam Sipariş', type: 'number', operators: ['gte'], minFilterKey: 'min_orders' },
};

export const RULE_OPERATORS = {
    equals: { key: 'equals', label: 'Eşittir' },
    gte: { key: 'gte', label: 'Büyük Eşit' },
    lte: { key: 'lte', label: 'Küçük Eşit' },
};

export const createEmptyRule = (fieldKey = 'city') => {
    const field = RULE_FIELDS[fieldKey] || RULE_FIELDS.city;
    return {
        id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
        field: field.key,
        operator: field.operators[0],
        value: '',
    };
};

export const getSegmentTypeMeta = (segmentType) =>
    SEGMENT_TYPES.find((item) => item.key === segmentType) || SEGMENT_TYPES[0];

export const getRuleFieldOptions = (segmentType) =>
    getSegmentTypeMeta(segmentType).fields.map((fieldKey) => RULE_FIELDS[fieldKey]).filter(Boolean);

export const getRuleFieldMeta = (fieldKey) => RULE_FIELDS[fieldKey] || RULE_FIELDS.city;

export const getOperatorMeta = (operatorKey) => RULE_OPERATORS[operatorKey] || RULE_OPERATORS.equals;

export const buildDerivedFiltersFromRules = (rules = [], logicalOperator = 'and') => {
    if (logicalOperator !== 'and') {
        return null;
    }

    const filters = {};

    for (const rule of rules) {
        if (!rule?.field || rule.value === '' || rule.value === null || rule.value === undefined) continue;
        const fieldMeta = getRuleFieldMeta(rule.field);

        if (fieldMeta.filterKey && rule.operator === 'equals') {
            filters[fieldMeta.filterKey] = rule.value;
        }

        if (fieldMeta.minFilterKey && rule.operator === 'gte') {
            filters[fieldMeta.minFilterKey] = String(rule.value);
        }

        if (fieldMeta.maxFilterKey && rule.operator === 'lte') {
            filters[fieldMeta.maxFilterKey] = String(rule.value);
        }
    }

    return filters;
};

export const normalizeSegmentRulesConfig = (segment) => {
    const config = segment?.rules_config || {};

    if (config.segment_type || config.rules || config.derived_filters) {
        return {
            version: 2,
            segment_type: config.segment_type || 'customer',
            description: config.description || '',
            logical_operator: config.logical_operator || 'and',
            rules: config.rules || [],
            derived_filters: config.derived_filters || {},
        };
    }

    return {
        version: 1,
        segment_type: 'customer',
        description: '',
        logical_operator: 'and',
        rules: [],
        derived_filters: config,
    };
};

export const extractAppliedFilters = (rulesConfig = {}) =>
    rulesConfig?.derived_filters || rulesConfig || {};

