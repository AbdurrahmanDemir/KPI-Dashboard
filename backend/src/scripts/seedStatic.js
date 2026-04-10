const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { sequelize } = require('../config/database');
const CampaignData = require('../models/CampaignData');
const ChannelMapping = require('../models/ChannelMapping');

const parseCSV = (filePath) => {
    return new Promise((resolve, reject) => {
        const results = [];
        if (!fs.existsSync(filePath)) {
            console.warn(`⚠️ Dosya bulunamadı: ${filePath}`);
            return resolve([]);
        }
        fs.createReadStream(filePath)
            .pipe(csv({
                mapHeaders: ({ header }) => header.replace(/^\uFEFF/g, '').trim()
            }))
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', (err) => reject(err));
    });
};

const mapCampaignData = (raw) => {
    return {
        campaign_name: raw.campaign_name,
        platform: raw.platform === 'google' ? 'google_ads' : raw.platform,
        platform_id: raw.platform_id || null,
        start_date: raw.start_date || null,
        end_date: raw.end_date || null,
        budget: raw.daily_budget ? parseFloat(raw.daily_budget) : (raw.budget ? parseFloat(raw.budget) : 0),
        budget_type: 'daily',
        objective: raw.objective || null,
        target_roas: null,
        currency: 'TRY',
        status: raw.status || 'active',
    };
};

const mapChannelData = (raw) => {
    return {
        source: raw.source || '(direct)',
        medium: raw.medium || '(none)',
        channel_group: raw.channel_group || 'Direct',
        platform: null,
        is_paid: String(raw.medium).toLowerCase().includes('cpc') || String(raw.channel_group).toLowerCase().includes('paid'),
    };
};

const seedStaticBaseData = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Veritabanı bağlantısı başarılı.');

        const dataDir = path.join(__dirname, '../../../docs/dummy-data');
        const campaignsPath = path.join(dataDir, 'campaigns.csv');
        const channelsPath = path.join(dataDir, 'channel_mapping.csv');

        // 1. Kanal Dağılımları (Channel Mappings)
        console.log('\n📥 channel_mapping.csv okunuyor...');
        const rawChannels = await parseCSV(channelsPath);
        if (rawChannels.length > 0) {
            const mappedChannels = rawChannels.map(mapChannelData);
            await ChannelMapping.destroy({ truncate: true }); // Öncekileri temizle
            await ChannelMapping.bulkCreate(mappedChannels, { ignoreDuplicates: true });
            console.log(`✅ ${mappedChannels.length} adet kanal eşleşmesi aktarıldı.`);
        }

        // 2. Kampanyalar (Campaigns)
        console.log('\n📥 campaigns.csv okunuyor...');
        const rawCampaigns = await parseCSV(campaignsPath);
        if (rawCampaigns.length > 0) {
            const mappedCampaigns = rawCampaigns.map(mapCampaignData).filter(c => c.campaign_name);
            await CampaignData.destroy({ truncate: true }); // Öncekileri temizle
            // duplicate key hatası almamak için var olanları atla
            for (let c of mappedCampaigns) {
                try {
                    await CampaignData.findOrCreate({
                        where: { campaign_name: c.campaign_name, platform: c.platform },
                        defaults: c
                    });
                } catch (e) {}
            }
            console.log(`✅ ${mappedCampaigns.length} adet kampanya bilgisi aktarıldı.`);
        }

        console.log('\n🎉 Statik veriler başarıyla eklendi!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Hata oluştu:', err);
        process.exit(1);
    }
};

seedStaticBaseData();
