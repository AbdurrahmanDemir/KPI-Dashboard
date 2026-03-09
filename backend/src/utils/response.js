/**
 * Standart başarı response formatı
 */
const successResponse = (res, data, statusCode = 200, meta = {}) => {
    return res.status(statusCode).json({
        success: true,
        data,
        meta: {
            timestamp: new Date().toISOString(),
            ...meta,
        },
    });
};

/**
 * Standart hata response formatı
 */
const errorResponse = (res, statusCode, code, message, details = []) => {
    return res.status(statusCode).json({
        success: false,
        error: {
            code,
            message,
            details,
        },
    });
};

/**
 * Paginated response formatı
 */
const paginatedResponse = (res, data, page, limit, total) => {
    return res.status(200).json({
        success: true,
        data,
        meta: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / limit),
            timestamp: new Date().toISOString(),
        },
    });
};

module.exports = { successResponse, errorResponse, paginatedResponse };
