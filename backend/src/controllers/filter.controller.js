const { successResponse, errorResponse } = require('../utils/response');
const { getFilterOptions } = require('../services/dashboard.service');

const getOptions = async (req, res) => {
    try {
        return successResponse(res, await getFilterOptions());
    } catch (err) {
        console.error('[FILTER] Options Error:', err);
        return errorResponse(res, 500, 'INTERNAL_ERROR', 'Filtre secenekleri getirilemedi.');
    }
};

const validateFilters = async (req, res) => {
    try {
        const filters = req.body || {};
        const errors = [];
        if (filters.start_date && filters.end_date && filters.start_date > filters.end_date) {
            errors.push({ field: 'date_range', message: 'Baslangic tarihi bitis tarihinden buyuk olamaz.' });
        }
        if (errors.length > 0) {
            return errorResponse(res, 400, 'VALIDATION_ERROR', 'Filtre kombinasyonu gecersiz.', errors);
        }
        return successResponse(res, { valid: true, filters });
    } catch (err) {
        return errorResponse(res, 500, 'INTERNAL_ERROR', 'Filtreler dogrulanamadi.');
    }
};

module.exports = { getOptions, validateFilters };
