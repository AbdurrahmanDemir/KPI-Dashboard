const jwt = require('jsonwebtoken');
const { errorResponse } = require('../utils/response');

/**
 * JWT authentication middleware
 * Korumali route'lara erisim icin Authorization: Bearer {token} header'i gerektirir
 */
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return errorResponse(
            res,
            401,
            'MISSING_TOKEN',
            "Bu endpoint icin kimlik dogrulama gereklidir. Authorization: Bearer {token} header'i gonderin."
        );
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return errorResponse(res, 401, 'TOKEN_EXPIRED', 'Access token suresi dolmus. Refresh token ile yenileyin.');
        }

        return errorResponse(res, 401, 'INVALID_TOKEN', 'Gecersiz token.');
    }
};

const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return errorResponse(res, 403, 'FORBIDDEN', 'Bu islem icin admin yetkisi gereklidir.');
    }

    next();
};

const requireRoles = (...roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
        return errorResponse(res, 403, 'FORBIDDEN', 'Bu alana erisim yetkiniz bulunmamaktadir.');
    }

    next();
};

const requireViewer = (req, res, next) => {
    if (!req.user || !['admin', 'marketing_manager', 'viewer'].includes(req.user.role)) {
        return errorResponse(res, 403, 'FORBIDDEN', 'Bu alana erisim yetkiniz bulunmamaktadir.');
    }

    next();
};

module.exports = { authenticate, requireAdmin, requireRoles, requireViewer };
