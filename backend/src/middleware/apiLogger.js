const jwt = require('jsonwebtoken');
const AuditLog = require('../models/AuditLog');

const resolveUserId = (req) => {
    if (req.user?.id) return req.user.id;

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

    try {
        const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_ACCESS_SECRET);
        return decoded.id || null;
    } catch (_) {
        return null;
    }
};

const apiLogger = (req, res, next) => {
    if (!req.path.startsWith('/api')) {
        return next();
    }

    const startedAt = Date.now();

    res.on('finish', async () => {
        try {
            await AuditLog.create({
                user_id: resolveUserId(req),
                action: 'api_request',
                entity_type: 'api',
                entity_id: `${req.method} ${req.originalUrl}`.slice(0, 100),
                ip_address: req.ip || req.connection?.remoteAddress,
                user_agent: req.get('User-Agent')?.substring(0, 500),
                payload: {
                    method: req.method,
                    path: req.originalUrl,
                    status_code: res.statusCode,
                    duration_ms: Date.now() - startedAt,
                },
            });
        } catch (_) {
            // Request logging should not break the request lifecycle.
        }
    });

    next();
};

module.exports = apiLogger;
