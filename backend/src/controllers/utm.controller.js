const { successResponse, errorResponse } = require('../utils/response');
const {
    buildTrackingBaseUrl,
    createLink,
    updateLinkStatus,
    listLinks,
    getAnalytics,
    recordTrackingClick,
    recordPublicEvent,
    simulateLinkActivity,
    detectDeviceType,
} = require('../services/utm.service');

const handleError = (res, err, fallbackMessage, statusCode = 500) => {
    return errorResponse(res, statusCode, 'UTM_ERROR', err.message || fallbackMessage);
};

const getLinks = async (req, res) => {
    try {
        const trackingBaseUrl = buildTrackingBaseUrl(req);
        const data = await listLinks(trackingBaseUrl);
        return successResponse(res, data);
    } catch (err) {
        console.error('[UTM] Link list error:', err);
        return handleError(res, err, 'UTM linkleri alinirken hata olustu.');
    }
};

const createUtmLink = async (req, res) => {
    try {
        const requiredFields = ['name', 'destination_url', 'utm_source', 'utm_medium', 'utm_campaign'];
        const missingField = requiredFields.find((field) => !String(req.body?.[field] || '').trim());

        if (missingField) {
            return errorResponse(res, 400, 'VALIDATION_ERROR', `Zorunlu alan eksik: ${missingField}`);
        }

        const trackingBaseUrl = buildTrackingBaseUrl(req);
        const data = await createLink(req.body, req.user.id, trackingBaseUrl);
        return successResponse(res, data, 201);
    } catch (err) {
        console.error('[UTM] Create link error:', err);
        return handleError(res, err, 'UTM linki olusturulurken hata olustu.', 400);
    }
};

const patchLinkStatus = async (req, res) => {
    try {
        if (typeof req.body?.is_active !== 'boolean') {
            return errorResponse(res, 400, 'VALIDATION_ERROR', 'is_active alani true veya false olmalidir.');
        }

        const trackingBaseUrl = buildTrackingBaseUrl(req);
        const data = await updateLinkStatus(req.params.id, req.body.is_active, trackingBaseUrl);
        return successResponse(res, data);
    } catch (err) {
        console.error('[UTM] Update link error:', err);
        return handleError(res, err, 'UTM link durumu guncellenemedi.', 400);
    }
};

const getUtmAnalytics = async (req, res) => {
    try {
        const trackingBaseUrl = buildTrackingBaseUrl(req);
        const data = await getAnalytics({
            trackingBaseUrl,
            days: req.query.days,
            linkId: req.query.link_id ? Number(req.query.link_id) : null,
        });
        return successResponse(res, data);
    } catch (err) {
        console.error('[UTM] Analytics error:', err);
        return handleError(res, err, 'UTM analizi alinirken hata olustu.');
    }
};

const simulateUtmActivity = async (req, res) => {
    try {
        const data = await simulateLinkActivity(req.params.id, req.body || {});
        return successResponse(res, data);
    } catch (err) {
        console.error('[UTM] Simulation error:', err);
        return handleError(res, err, 'Test verisi olusturulamadi.', 400);
    }
};

const trackUtmLink = async (req, res) => {
    try {
        const userAgent = req.get('User-Agent') || '';
        const redirectUrl = await recordTrackingClick(req.params.code, {
            referrer: req.get('Referer') || null,
            session_key: req.query.session_key || null,
            device_type: detectDeviceType(userAgent),
            metadata: {
                user_agent: userAgent.substring(0, 500),
                query: req.query || {},
            },
        });

        return res.redirect(302, redirectUrl);
    } catch (err) {
        return handleError(res, err, 'UTM yonlendirmesi yapilamadi.', 404);
    }
};

const collectUtmEvent = async (req, res) => {
    try {
        if (!req.body?.event_type) {
            return errorResponse(res, 400, 'VALIDATION_ERROR', 'event_type alani zorunludur.');
        }

        await recordPublicEvent(req.params.code, {
            event_type: req.body.event_type,
            revenue: req.body.revenue,
            session_key: req.body.session_key,
            referrer: req.get('Referer') || req.body.referrer || null,
            device_type: req.body.device_type || detectDeviceType(req.get('User-Agent') || ''),
            metadata: req.body.metadata || null,
            occurred_at: req.body.occurred_at,
        });

        return successResponse(res, { recorded: true });
    } catch (err) {
        console.error('[UTM] Event collect error:', err);
        return handleError(res, err, 'UTM etkinligi kaydedilemedi.', 400);
    }
};

module.exports = {
    getLinks,
    createUtmLink,
    patchLinkStatus,
    getUtmAnalytics,
    simulateUtmActivity,
    trackUtmLink,
    collectUtmEvent,
};
