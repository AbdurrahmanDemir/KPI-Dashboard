const SavedView = require('../models/SavedView');
const { successResponse, errorResponse } = require('../utils/response');

// ─── GET /views ────────────────────────────────────────────────────────────────
const getViews = async (req, res) => {
    try {
        const views = await SavedView.findAll({
            where: { user_id: req.user.id },
            order: [['is_default', 'DESC'], ['created_at', 'DESC']]
        });
        return successResponse(res, views);
    } catch (err) {
        console.error('[VIEW] Get Error:', err);
        return errorResponse(res, 500, 'INTERNAL_ERROR', 'Görünümler getirilemedi.');
    }
};

const getViewById = async (req, res) => {
    try {
        const view = await SavedView.findOne({ where: { id: req.params.id, user_id: req.user.id } });
        if (!view) return errorResponse(res, 404, 'NOT_FOUND', 'Gorunum bulunamadi.');
        return successResponse(res, view);
    } catch (err) {
        return errorResponse(res, 500, 'INTERNAL_ERROR', 'Gorunum getirilemedi.');
    }
};

// ─── POST /views ───────────────────────────────────────────────────────────────
const createView = async (req, res) => {
    try {
        const { name, layout_config, filter_config, is_default } = req.body;
        
        if (!name || !layout_config) {
            return errorResponse(res, 400, 'VALIDATION_ERROR', 'İsim ve layout ayarları zorunludur.');
        }

        if (is_default) {
            // Varsa diğer varsayılan görünümleri normale çevir
            await SavedView.update({ is_default: false }, { where: { user_id: req.user.id } });
        }

        const view = await SavedView.create({
            user_id: req.user.id,
            name,
            layout_config,
            filter_config: filter_config || {},
            is_default: is_default || false
        });

        return successResponse(res, view, 201);
    } catch (err) {
        console.error('[VIEW] Create Error:', err);
        return errorResponse(res, 500, 'INTERNAL_ERROR', 'Görünüm oluşturulamadı.');
    }
};

const updateView = async (req, res) => {
    try {
        const view = await SavedView.findOne({ where: { id: req.params.id, user_id: req.user.id } });
        if (!view) return errorResponse(res, 404, 'NOT_FOUND', 'Gorunum bulunamadi.');
        if (req.body.is_default) {
            await SavedView.update({ is_default: false }, { where: { user_id: req.user.id } });
        }
        await view.update(req.body);
        return successResponse(res, view);
    } catch (err) {
        return errorResponse(res, 500, 'INTERNAL_ERROR', 'Gorunum guncellenemedi.');
    }
};

// ─── DELETE /views/:id ─────────────────────────────────────────────────────────
const deleteView = async (req, res) => {
    try {
        const view = await SavedView.findOne({
            where: { id: req.params.id, user_id: req.user.id }
        });

        if (!view) {
            return errorResponse(res, 404, 'NOT_FOUND', 'Görünüm bulunamadı.');
        }

        await view.destroy();
        return successResponse(res, { message: 'Görünüm başarıyla silindi.' });
    } catch (err) {
        console.error('[VIEW] Delete Error:', err);
        return errorResponse(res, 500, 'INTERNAL_ERROR', 'Görünüm silinemedi.');
    }
};

module.exports = {
    getViews,
    getViewById,
    createView,
    updateView,
    deleteView
};
