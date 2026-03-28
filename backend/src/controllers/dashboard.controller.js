const { successResponse, errorResponse } = require('../utils/response');
const {
    getTrendData
} = require('../services/kpi.service');
const {
    getChannelPerformance,
    getPlatformPerformance,
    getCampaignPerformance,
    getProductPerformance,
    getAttributionAnalysis,
    getFunnelPerformance,
    getCohortPerformance
} = require('../services/dashboard.service');

const extractFilters = (req) => ({
    start_date: req.query.start_date,
    end_date: req.query.end_date,
    channel: req.query.channel,
    platform: req.query.platform,
    campaign_name: req.query.campaign_name,
    product_name: req.query.product_name,
    city: req.query.city,
    device: req.query.device,
    country: req.query.country
});

const handler = (fn, message) => async (req, res) => {
    try {
        return successResponse(res, await fn(extractFilters(req)));
    } catch (err) {
        console.error(message, err);
        return errorResponse(res, 500, 'INTERNAL_ERROR', 'Dashboard verisi alinirken hata olustu.');
    }
};

module.exports = {
    getTrend: handler(getTrendData, '[DASHBOARD] Trend Error'),
    getChannelPerformance: handler(getChannelPerformance, '[DASHBOARD] Channel Error'),
    getPlatformPerformance: handler(getPlatformPerformance, '[DASHBOARD] Platform Error'),
    getCampaignPerformance: handler(getCampaignPerformance, '[DASHBOARD] Campaign Error'),
    getProductPerformance: handler(getProductPerformance, '[DASHBOARD] Product Error'),
    getAttributionAnalysis: handler(getAttributionAnalysis, '[DASHBOARD] Attribution Error'),
    getFunnel: handler(getFunnelPerformance, '[DASHBOARD] Funnel Error'),
    getCohort: handler(getCohortPerformance, '[DASHBOARD] Cohort Error')
};
