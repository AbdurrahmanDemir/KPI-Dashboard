const Integration = require('../models/Integration');
const integrationService = require('../services/integration.service');

// Tüm entegrasyonları getir
exports.getIntegrations = async (req, res) => {
    try {
        const integrations = await Integration.findAll({
            attributes: { exclude: ['access_token', 'refresh_token', 'client_secret', 'developer_token'] } // hassas bilgileri gizle
        });
        res.json({ success: true, data: integrations });
    } catch (error) {
        console.error('getIntegrations error:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası' });
    }
};

// Entegrasyon kaydet / güncelle
exports.saveIntegration = async (req, res) => {
    try {
        const { platform, client_id, client_secret, developer_token, account_id, access_token, refresh_token, is_active } = req.body;

        if (!platform) {
            return res.status(400).json({ success: false, message: 'Platform zorunludur' });
        }

        let integration = await Integration.findOne({ where: { platform } });

        if (integration) {
            const updatePayload = {
                client_id,
                account_id,
                is_active
            };

            if (client_secret) updatePayload.client_secret = client_secret;
            if (developer_token) updatePayload.developer_token = developer_token;
            if (access_token) updatePayload.access_token = access_token;
            if (refresh_token) updatePayload.refresh_token = refresh_token;

            await integration.update(updatePayload);
        } else {
            integration = await Integration.create({
                platform,
                client_id,
                client_secret,
                developer_token,
                account_id,
                access_token,
                refresh_token,
                is_active
            });
        }

        res.json({ success: true, message: 'Entegrasyon kaydedildi', data: integration });
    } catch (error) {
        console.error('saveIntegration error:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası' });
    }
};

// Veri Senkronizasyonu
exports.syncIntegration = async (req, res) => {
    try {
        const { platform } = req.params;
        const { testMode } = req.body;
        const integration = await Integration.findOne({ where: { platform, is_active: true } });

        // Normal modda iken ayar bulamazsak hata ver, ama test mode'da ayarlara gerek yok
        if (!integration && !testMode) {
            return res.status(404).json({ success: false, message: 'Aktif entegrasyon bulunamadı' });
        }

        let result;
        if (platform === 'meta_ads') {
            result = await integrationService.syncMetaAds(integration, testMode);
        } else if (platform === 'google_ads') {
            result = await integrationService.syncGoogleAds(integration, testMode);
        } else {
            return res.status(400).json({ success: false, message: 'Desteklenmeyen platform' });
        }

        // Son senkronizasyon tarihini güncelle
        if (integration) {
            await integration.update({ last_sync_at: new Date() });
        }

        res.json({ success: true, message: `${platform} için veriler başarıyla senkronize edildi.`, result });
    } catch (error) {
        console.error('syncIntegration error:', error);
        res.status(500).json({ success: false, message: error.message || 'Senkronizasyon hatası' });
    }
};
