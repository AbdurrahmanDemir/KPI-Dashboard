const AuditLog = require('../models/AuditLog');
const { successResponse, errorResponse } = require('../utils/response');

// ─── GET /logs (Admin Only) ────────────────────────────────────────────────────
const getLogs = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const offset = (page - 1) * limit;

        const { count, rows } = await AuditLog.findAndCountAll({
            order: [['created_at', 'DESC']],
            limit,
            offset
        });

        return successResponse(res, {
            total: count,
            page,
            totalPages: Math.ceil(count / limit),
            logs: rows
        });
    } catch (err) {
        console.error('[AUDIT_LOG] Get Error:', err);
        return errorResponse(res, 500, 'INTERNAL_ERROR', 'Loglar getirilemedi.');
    }
};

module.exports = {
    getLogs
};
