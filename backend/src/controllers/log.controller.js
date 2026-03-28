const AuditLog = require('../models/AuditLog');
const ImportLog = require('../models/ImportLog');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

const getPaging = (req) => {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '50', 10);
    return { page, limit, offset: (page - 1) * limit };
};

const getAuditLogs = async (req, res) => {
    try {
        const { page, limit, offset } = getPaging(req);
        const { count, rows } = await AuditLog.findAndCountAll({
            order: [['created_at', 'DESC']],
            limit,
            offset
        });
        return paginatedResponse(res, rows, page, limit, count);
    } catch (err) {
        return errorResponse(res, 500, 'INTERNAL_ERROR', 'Audit loglari getirilemedi.');
    }
};

const getImportLogs = async (req, res) => {
    try {
        const { page, limit, offset } = getPaging(req);
        const { count, rows } = await ImportLog.findAndCountAll({
            order: [['created_at', 'DESC']],
            limit,
            offset
        });
        return paginatedResponse(res, rows, page, limit, count);
    } catch (err) {
        return errorResponse(res, 500, 'INTERNAL_ERROR', 'Import loglari getirilemedi.');
    }
};

const getApiLogs = async (req, res) => {
    try {
        const { page, limit, offset } = getPaging(req);
        const { count, rows } = await AuditLog.findAndCountAll({
            where: { entity_type: 'api' },
            order: [['created_at', 'DESC']],
            limit,
            offset
        });
        return paginatedResponse(res, rows, page, limit, count);
    } catch (err) {
        return errorResponse(res, 500, 'INTERNAL_ERROR', 'API loglari getirilemedi.');
    }
};

const getLogs = async (req, res) => {
    try {
        const { page, limit, offset } = getPaging(req);
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
        return errorResponse(res, 500, 'INTERNAL_ERROR', 'Loglar getirilemedi.');
    }
};

module.exports = {
    getLogs,
    getImportLogs,
    getApiLogs,
    getAuditLogs
};
