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
    createSegment,
    deleteSegment
};
