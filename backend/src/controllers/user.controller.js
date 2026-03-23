const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/response');

// ─── GET /users (Admin Only) ───────────────────────────────────────────────────
const getUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: ['id', 'name', 'email', 'role', 'is_active', 'last_login', 'created_at'],
            order: [['created_at', 'DESC']]
        });
        return successResponse(res, users);
    } catch (err) {
        return errorResponse(res, 500, 'INTERNAL_ERROR', 'Kullanıcılar getirilemedi.');
    }
};

// ─── POST /users (Admin Only - Yeni Kullanıcı) ─────────────────────────────────
const createUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        
        const existing = await User.findOne({ where: { email } });
        if (existing) {
            return errorResponse(res, 400, 'USER_EXISTS', 'Bu e-posta kullanımda.');
        }

        const user = await User.create({ name, email, password_hash: password, role: role || 'viewer' });
        
        // Şifreyi dönerken gizle
        user.password_hash = undefined;
        return successResponse(res, user, 201);
    } catch (err) {
        return errorResponse(res, 500, 'INTERNAL_ERROR', 'Kullanıcı oluşturulamadı.');
    }
};

// ─── PUT /users/:id/role (Admin Only) ──────────────────────────────────────────
const changeRole = async (req, res) => {
    try {
        const { role, is_active } = req.body;
        const user = await User.findByPk(req.params.id);
        
        if (!user) return errorResponse(res, 404, 'NOT_FOUND', 'Kullanıcı bulunamadı.');

        if (role) user.role = role;
        if (typeof is_active !== 'undefined') user.is_active = is_active;
        
        await user.save();
        return successResponse(res, { message: 'Kullanıcı güncellendi.', id: user.id, role: user.role, is_active: user.is_active });
    } catch (err) {
        return errorResponse(res, 500, 'INTERNAL_ERROR', 'Yetki güncellenemedi.');
    }
};

// ─── PUT /users/me/password (Açık - Herkes Kendi Şifresini Değişir) ────────────
const changePassword = async (req, res) => {
    try {
        const { old_password, new_password } = req.body;
        const user = await User.findByPk(req.user.id);
        
        if (!user) return errorResponse(res, 404, 'NOT_FOUND', 'Kullanıcı bulunamadı.');

        const isMatch = await user.validatePassword(old_password);
        if (!isMatch) {
            return errorResponse(res, 401, 'INVALID_PASSWORD', 'Mevcut şifre hatalı.');
        }

        user.password_hash = new_password; // Hook sayesinde hash'lenecek
        await user.save();

        return successResponse(res, { message: 'Şifreniz başarıyla güncellendi.' });
    } catch (err) {
        return errorResponse(res, 500, 'INTERNAL_ERROR', 'Şifre güncellenemedi.');
    }
};

module.exports = {
    getUsers,
    createUser,
    changeRole,
    changePassword
};
