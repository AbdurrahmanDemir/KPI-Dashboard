const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const RefreshToken = require('../models/RefreshToken');
const { successResponse, errorResponse } = require('../utils/response');

const getRefreshExpiryDate = () => {
    const days = parseInt(String(process.env.JWT_REFRESH_EXPIRES_IN || '7d').replace(/\D/g, '') || '7', 10);
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
};

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const generateTokens = (user) => {
    const payload = { id: user.id, email: user.email, role: user.role };

    const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
        expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '24h',
    });

    const refreshToken = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    return { accessToken, refreshToken };
};

const persistRefreshToken = async (userId, refreshToken) => {
    await RefreshToken.create({
        user_id: userId,
        token_hash: hashToken(refreshToken),
        expires_at: getRefreshExpiryDate()
    });
};

const revokeRefreshToken = async (refreshToken) => {
    if (!refreshToken) return;
    await RefreshToken.update(
        { revoked_at: new Date() },
        { where: { token_hash: hashToken(refreshToken), revoked_at: null } }
    );
};

const logAction = async (req, action, userId = null, payload = {}) => {
    try {
        await AuditLog.create({
            user_id: userId,
            action,
            entity_type: 'auth',
            ip_address: req.ip || req.connection?.remoteAddress,
            user_agent: req.get('User-Agent')?.substring(0, 500),
            payload,
        });
    } catch (_) {
        // Audit log hatasi ana akisi durdurmamali.
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return errorResponse(res, 400, 'MISSING_FIELDS', 'E-posta ve sifre zorunludur.');
        }

        const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });

        if (!user) {
            await logAction(req, 'failed_login', null, { email, reason: 'user_not_found' });
            return errorResponse(res, 401, 'INVALID_CREDENTIALS', 'E-posta veya sifre hatali.');
        }

        if (!user.is_active) {
            return errorResponse(res, 403, 'ACCOUNT_DISABLED', 'Hesabiniz devre disi. Yoneticiyle iletisime gecin.');
        }

        const isValid = await user.validatePassword(password);
        if (!isValid) {
            await logAction(req, 'failed_login', user.id, { email, reason: 'wrong_password' });
            return errorResponse(res, 401, 'INVALID_CREDENTIALS', 'E-posta veya sifre hatali.');
        }

        await user.update({ last_login: new Date() });

        const { accessToken, refreshToken } = generateTokens(user);
        await persistRefreshToken(user.id, refreshToken);
        await logAction(req, 'login', user.id, { email });

        return successResponse(res, {
            access_token: accessToken,
            refresh_token: refreshToken,
            expires_in: 86400,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (err) {
        console.error('[AUTH] Login hatasi:', err);
        return errorResponse(res, 500, 'INTERNAL_ERROR', 'Giris sirasinda hata olustu.');
    }
};

const refresh = async (req, res) => {
    try {
        const { refresh_token } = req.body;

        if (!refresh_token) {
            return errorResponse(res, 401, 'MISSING_TOKEN', 'Refresh token zorunludur.');
        }

        let decoded;
        try {
            decoded = jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET);
        } catch {
            return errorResponse(res, 401, 'INVALID_REFRESH_TOKEN', 'Refresh token gecersiz veya suresi dolmus.');
        }

        const storedToken = await RefreshToken.findOne({
            where: {
                token_hash: hashToken(refresh_token),
                revoked_at: null
            }
        });

        if (!storedToken || new Date(storedToken.expires_at) <= new Date()) {
            return errorResponse(res, 401, 'INVALID_REFRESH_TOKEN', 'Refresh token geri alinmis veya suresi dolmus.');
        }

        const user = await User.findByPk(decoded.id);
        if (!user || !user.is_active) {
            return errorResponse(res, 401, 'USER_NOT_FOUND', 'Kullanici bulunamadi veya devre disi.');
        }

        await storedToken.update({ revoked_at: new Date(), last_used_at: new Date() });

        const { accessToken, refreshToken } = generateTokens(user);
        await persistRefreshToken(user.id, refreshToken);
        await logAction(req, 'refresh', user.id, {});

        return successResponse(res, {
            access_token: accessToken,
            refresh_token: refreshToken,
            expires_in: 86400,
        });
    } catch (err) {
        return errorResponse(res, 500, 'INTERNAL_ERROR', 'Token yenileme sirasinda hata olustu.');
    }
};

const logout = async (req, res) => {
    try {
        const refreshToken = req.body?.refresh_token || null;
        if (refreshToken) {
            await revokeRefreshToken(refreshToken);
        }

        if (req.user) {
            await logAction(req, 'logout', req.user.id, { refresh_token_revoked: Boolean(refreshToken) });
        }

        return successResponse(res, { message: 'Cikis basarili.' });
    } catch (err) {
        return errorResponse(res, 500, 'INTERNAL_ERROR', 'Cikis sirasinda hata olustu.');
    }
};

const me = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        if (!user) {
            return errorResponse(res, 404, 'NOT_FOUND', 'Kullanici bulunamadi.');
        }
        return successResponse(res, user);
    } catch (err) {
        return errorResponse(res, 500, 'INTERNAL_ERROR', 'Kullanici bilgisi alinamadi.');
    }
};

module.exports = { login, refresh, logout, me };
