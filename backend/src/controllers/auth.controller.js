const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { successResponse, errorResponse } = require('../utils/response');

// ─── Token üretici ────────────────────────────────────────────────────────────
const generateTokens = (user) => {
    const payload = { id: user.id, email: user.email, role: user.role };

    const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
        expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '24h',
    });

    const refreshToken = jwt.sign(
        { id: user.id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    return { accessToken, refreshToken };
};

// ─── Audit log yardımcısı ─────────────────────────────────────────────────────
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
        // Audit log hatası ana akışı durdurmamalı
    }
};

// ─── POST /auth/login ─────────────────────────────────────────────────────────
/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Kullanıcı girişi
 *     description: E-posta ve şifre ile giriş yapar, JWT access + refresh token döner
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@kpidashboard.com
 *               password:
 *                 type: string
 *                 example: admin123
 *     responses:
 *       200:
 *         description: Giriş başarılı
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         access_token:
 *                           type: string
 *                         refresh_token:
 *                           type: string
 *                         user:
 *                           type: object
 *       400:
 *         description: Eksik alan
 *       401:
 *         description: Hatalı e-posta veya şifre
 *       403:
 *         description: Hesap devre dışı
 */
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return errorResponse(res, 400, 'MISSING_FIELDS', 'E-posta ve şifre zorunludur.');
        }

        const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });

        if (!user) {
            await logAction(req, 'failed_login', null, { email, reason: 'user_not_found' });
            return errorResponse(res, 401, 'INVALID_CREDENTIALS', 'E-posta veya şifre hatalı.');
        }

        if (!user.is_active) {
            return errorResponse(res, 403, 'ACCOUNT_DISABLED', 'Hesabınız devre dışı. Yöneticiyle iletişime geçin.');
        }

        const isValid = await user.validatePassword(password);
        if (!isValid) {
            await logAction(req, 'failed_login', user.id, { email, reason: 'wrong_password' });
            return errorResponse(res, 401, 'INVALID_CREDENTIALS', 'E-posta veya şifre hatalı.');
        }

        // Son giriş tarihini güncelle
        await user.update({ last_login: new Date() });

        const { accessToken, refreshToken } = generateTokens(user);

        await logAction(req, 'login', user.id, { email });

        return successResponse(res, {
            access_token: accessToken,
            refresh_token: refreshToken,
            expires_in: 86400, // 24 saat (saniye)
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (err) {
        console.error('[AUTH] Login hatası:', err);
        return errorResponse(res, 500, 'INTERNAL_ERROR', 'Giriş sırasında hata oluştu.');
    }
};

// ─── POST /auth/refresh ───────────────────────────────────────────────────────
/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Access token yenile
 *     description: Refresh token kullanarak yeni access token üretir
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refresh_token]
 *             properties:
 *               refresh_token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token yenilendi
 *       401:
 *         description: Refresh token geçersiz veya süresi dolmuş
 */
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
            return errorResponse(res, 401, 'INVALID_REFRESH_TOKEN', 'Refresh token geçersiz veya süresi dolmuş.');
        }

        const user = await User.findByPk(decoded.id);
        if (!user || !user.is_active) {
            return errorResponse(res, 401, 'USER_NOT_FOUND', 'Kullanıcı bulunamadı veya devre dışı.');
        }

        const { accessToken } = generateTokens(user);

        return successResponse(res, {
            access_token: accessToken,
            expires_in: 86400,
        });
    } catch (err) {
        return errorResponse(res, 500, 'INTERNAL_ERROR', 'Token yenileme sırasında hata oluştu.');
    }
};

// ─── POST /auth/logout ────────────────────────────────────────────────────────
/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Çıkış yap
 *     description: Kullanıcı çıkışı — client tarafı token temizleme + audit log
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Çıkış başarılı
 */
const logout = async (req, res) => {
    try {
        if (req.user) {
            await logAction(req, 'logout', req.user.id, {});
        }
        return successResponse(res, { message: 'Çıkış başarılı.' });
    } catch (err) {
        return errorResponse(res, 500, 'INTERNAL_ERROR', 'Çıkış sırasında hata oluştu.');
    }
};

// ─── GET /auth/me ─────────────────────────────────────────────────────────────
/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Mevcut kullanıcı bilgisi
 *     description: JWT token'dan kullanıcı profilini döner
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Kullanıcı bilgisi
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
const me = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        if (!user) {
            return errorResponse(res, 404, 'NOT_FOUND', 'Kullanıcı bulunamadı.');
        }
        return successResponse(res, user);
    } catch (err) {
        return errorResponse(res, 500, 'INTERNAL_ERROR', 'Kullanıcı bilgisi alınamadı.');
    }
};

module.exports = { login, refresh, logout, me };
