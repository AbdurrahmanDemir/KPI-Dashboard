const ChannelMapping = require('../models/ChannelMapping');
const { successResponse, errorResponse } = require('../utils/response');

const getChannelMappings = async (req, res) => {
    try {
        const rows = await ChannelMapping.findAll({ order: [['channel_group', 'ASC'], ['source', 'ASC']] });
        return successResponse(res, rows);
    } catch (err) {
        return errorResponse(res, 500, 'INTERNAL_ERROR', 'Kanal eslemeleri getirilemedi.');
    }
};

const createChannelMapping = async (req, res) => {
    try {
        const { source, medium, channel_group, platform, is_paid } = req.body;
        if (!source || !medium || !channel_group) {
            return errorResponse(res, 400, 'VALIDATION_ERROR', 'source, medium ve channel_group zorunludur.');
        }
        const row = await ChannelMapping.create({ source, medium, channel_group, platform: platform || null, is_paid: Boolean(is_paid) });
        return successResponse(res, row, 201);
    } catch (err) {
        return errorResponse(res, 500, 'INTERNAL_ERROR', 'Kanal eslemesi olusturulamadi.');
    }
};

const updateChannelMapping = async (req, res) => {
    try {
        const row = await ChannelMapping.findByPk(req.params.id);
        if (!row) return errorResponse(res, 404, 'NOT_FOUND', 'Kanal eslemesi bulunamadi.');
        await row.update(req.body);
        return successResponse(res, row);
    } catch (err) {
        return errorResponse(res, 500, 'INTERNAL_ERROR', 'Kanal eslemesi guncellenemedi.');
    }
};

const deleteChannelMapping = async (req, res) => {
    try {
        const row = await ChannelMapping.findByPk(req.params.id);
        if (!row) return errorResponse(res, 404, 'NOT_FOUND', 'Kanal eslemesi bulunamadi.');
        await row.destroy();
        return successResponse(res, { message: 'Kanal eslemesi silindi.' });
    } catch (err) {
        return errorResponse(res, 500, 'INTERNAL_ERROR', 'Kanal eslemesi silinemedi.');
    }
};

module.exports = {
    getChannelMappings,
    createChannelMapping,
    updateChannelMapping,
    deleteChannelMapping
};
