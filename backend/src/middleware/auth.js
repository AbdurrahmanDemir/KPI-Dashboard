const jwt = require('jsonwebtoken');
const { errorResponse } = require('../utils/response');

/**
 * JWT authentication middleware
 * Korumalı route'lara erişim için Authorization: Bearer {token} header'ı gerektirir
 */
const authenticate = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return errorResponse(
            res,
            401,
            'MISSING_TOKEN',
            'Bu endpoint için kimlik doğrulama gereklidir. Authorization: Bearer {token} header\'ı gönderin.'
        );
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return errorResponse(res, 401, 'TOKEN_EXPIRED', 'Access token süresi dolmuş. Refresh token ile yenileyin.');
        }
        return errorResponse(res, 401, 'INVALID_TOKEN', 'Geçersiz token.');
    }
};

/**
 * Admin rol kontrolü — sadece admin kullanıcılar belirli işlemleri yapabilir
 */
const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return errorResponse(res, 403, 'FORBIDDEN', 'Bu işlem için admin yetkisi gereklidir.');
    }
    next();
};

/**
 * Viewer veya Admin
 */
const requireViewer = (req, res, next) => {
    if (!req.user || !['admin', 'viewer'].includes(req.user.role)) {
        return errorResponse(res, 403, 'FORBIDDEN', 'Bu alana erişim yetkiniz bulunmamaktadır.');
    }
    next();
};

module.exports = { authenticate, requireAdmin, requireViewer };
