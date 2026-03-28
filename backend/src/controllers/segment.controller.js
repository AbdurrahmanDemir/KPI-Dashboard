const Segment = require('../models/Segment');
const { successResponse, errorResponse } = require('../utils/response');

// ─── GET /segments ─────────────────────────────────────────────────────────────
const getSegments = async (req, res) => {
    try {
        const segments = await Segment.findAll({
            where: { user_id: req.user.id },
            order: [['created_at', 'DESC']]
        });
        return successResponse(res, segments);
    } catch (err) {
        console.error('[SEGMENT] Get Error:', err);
        return errorResponse(res, 500, 'INTERNAL_ERROR', 'Segmentler getirilemedi.');
    }
};

const getSegmentById = async (req, res) => {
    try {
        const segment = await Segment.findOne({ where: { id: req.params.id, user_id: req.user.id } });
        if (!segment) return errorResponse(res, 404, 'NOT_FOUND', 'Segment bulunamadi.');
        return successResponse(res, segment);
    } catch (err) {
        return errorResponse(res, 500, 'INTERNAL_ERROR', 'Segment getirilemedi.');
    }
};

// ─── POST /segments ────────────────────────────────────────────────────────────
const createSegment = async (req, res) => {
    try {
        const { name, rules_config } = req.body;
        
        if (!name || !rules_config) {
            return errorResponse(res, 400, 'VALIDATION_ERROR', 'İsim ve kurallar zorunludur.');
        }

        const segment = await Segment.create({
            user_id: req.user.id,
            name,
            rules_config
        });

        return successResponse(res, segment, 201);
    } catch (err) {
        console.error('[SEGMENT] Create Error:', err);
        return errorResponse(res, 500, 'INTERNAL_ERROR', 'Segment oluşturulamadı.');
    }
};

const updateSegment = async (req, res) => {
    try {
        const segment = await Segment.findOne({ where: { id: req.params.id, user_id: req.user.id } });
        if (!segment) return errorResponse(res, 404, 'NOT_FOUND', 'Segment bulunamadi.');
        await segment.update(req.body);
        return successResponse(res, segment);
    } catch (err) {
        return errorResponse(res, 500, 'INTERNAL_ERROR', 'Segment guncellenemedi.');
    }
};

const previewSegment = async (req, res) => {
    try {
        const segment = await Segment.findOne({ where: { id: req.params.id, user_id: req.user.id } });
        if (!segment) return errorResponse(res, 404, 'NOT_FOUND', 'Segment bulunamadi.');
        return successResponse(res, { rules_config: segment.rules_config, preview_count: 0 });
    } catch (err) {
        return errorResponse(res, 500, 'INTERNAL_ERROR', 'Segment onizlemesi alinamadi.');
    }
};

const applySegment = async (req, res) => {
    try {
        const segment = await Segment.findOne({ where: { id: req.params.id, user_id: req.user.id } });
        if (!segment) return errorResponse(res, 404, 'NOT_FOUND', 'Segment bulunamadi.');
        return successResponse(res, { applied: true, filters: segment.rules_config });
    } catch (err) {
        return errorResponse(res, 500, 'INTERNAL_ERROR', 'Segment uygulanamadi.');
    }
};

// ─── DELETE /segments/:id ──────────────────────────────────────────────────────
const deleteSegment = async (req, res) => {
    try {
        const segment = await Segment.findOne({
            where: { id: req.params.id, user_id: req.user.id }
        });

        if (!segment) {
            return errorResponse(res, 404, 'NOT_FOUND', 'Segment bulunamadı.');
        }

        await segment.destroy();
        return successResponse(res, { message: 'Segment başarıyla silindi.' });
    } catch (err) {
        console.error('[SEGMENT] Delete Error:', err);
        return errorResponse(res, 500, 'INTERNAL_ERROR', 'Segment silinemedi.');
    }
};

module.exports = {
    getSegments,
    getSegmentById,
    createSegment,
    updateSegment,
    previewSegment,
    applySegment,
    deleteSegment
};
