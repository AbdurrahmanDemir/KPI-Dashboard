const axios = require('axios');
const { GoogleAdsApi } = require('google-ads-api');
const { AdsData, CampaignData } = require('../models');

class IntegrationService {
    async syncMetaAds(integration, isTestMode = false) {
        try {
            let data = [];

            // TEST MODU
            if (isTestMode || (integration && integration.access_token === 'TEST_TOKEN')) {
                console.log('Meta Ads: Test Modu Aktif. Sahte veriler üretiliyor...');
                for (let i = 0; i < 5; i++) {
                    data.push({
                        date_start: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
                        campaign_id: `test_meta_camp_${i}`,
                        campaign_name: `Meta Test Kampanyası ${i}`,
                        adset_name: 'Test Adset',
                        ad_name: 'Test Ad',
                        impressions: Math.floor(Math.random() * 10000) + 1000,
                        clicks: Math.floor(Math.random() * 500) + 50,
                        reach: Math.floor(Math.random() * 8000) + 800,
                        spend: (Math.random() * 500 + 50).toFixed(2),
                        cpc: (Math.random() * 2 + 0.5).toFixed(2),
                        ctr: (Math.random() * 5 + 1).toFixed(2),
                        actions: [{ action_type: 'purchase', value: Math.floor(Math.random() * 10).toString() }],
                        action_values: [{ action_type: 'purchase', value: (Math.random() * 1000 + 100).toFixed(2) }]
                    });
                }
            } else {
                const { account_id, access_token } = integration || {};
                if (!account_id || !access_token) {
                    throw new Error('Meta Ads için account_id ve access_token gereklidir.');
                }
                
                // Gerçek Meta Graph API isteği
                const response = await axios.get(`https://graph.facebook.com/v19.0/act_${account_id}/insights`, {
                    params: {
                        access_token,
                        fields: 'campaign_name,campaign_id,adset_name,ad_name,impressions,clicks,reach,spend,cpc,ctr,actions,action_values,date_start',
                        time_preset: 'last_30d',
                        level: 'ad'
                    }
                });
                data = response.data.data;
            }

            if (!data || data.length === 0) return { success: true, message: 'Senkronize edilecek veri bulunamadı.' };

            const adsToInsert = [];
            const campaignsToInsert = [];

            for (const item of data) {
                // Actions içinden purchase veya conversion verilerini çıkar (basit implementasyon)
                let conversions = 0;
                let conversion_value = 0.0;

                if (item.actions) {
                    const purchaseAction = item.actions.find(a => a.action_type === 'purchase');
                    if (purchaseAction) conversions = parseInt(purchaseAction.value);
                }
                
                if (item.action_values) {
                    const purchaseValue = item.action_values.find(a => a.action_type === 'purchase');
                    if (purchaseValue) conversion_value = parseFloat(purchaseValue.value);
                }

                adsToInsert.push({
                    date: item.date_start,
                    platform: 'meta',
                    platform_id: item.campaign_id,
                    campaign_name: item.campaign_name || 'Unknown Campaign',
                    adset: item.adset_name || null,
                    ad_name: item.ad_name || null,
                    impressions: parseInt(item.impressions) || 0,
                    clicks: parseInt(item.clicks) || 0,
                    reach: parseInt(item.reach) || 0,
                    spend: parseFloat(item.spend) || 0.0,
                    ctr: parseFloat(item.ctr) || 0.0,
                    cpc: parseFloat(item.cpc) || 0.0,
                    conversions,
                    conversion_value,
                    currency: 'TRY'
                });

                campaignsToInsert.push({
                    campaign_name: item.campaign_name || 'Unknown Campaign',
                    platform: 'meta',
                    platform_id: item.campaign_id,
                    start_date: item.date_start,
                    budget: 0, // Insights API bütçe vermez, Campaign node'undan alınmalı
                    status: 'active'
                });
            }

            // AdsData Bulk Upsert
            await AdsData.bulkCreate(adsToInsert, {
                updateOnDuplicate: ['impressions', 'clicks', 'reach', 'spend', 'ctr', 'cpc', 'conversions', 'conversion_value']
            });

            // CampaignData Bulk Upsert (unique name + platform)
            const uniqueCampaigns = [...new Map(campaignsToInsert.map(item => [item.campaign_name, item])).values()];
            for (const camp of uniqueCampaigns) {
                await CampaignData.upsert(camp);
            }

            return { success: true, count: adsToInsert.length };
        } catch (error) {
            console.error('Meta Ads Sync Error:', error.response?.data || error.message);
            throw error;
        }
    }

    async syncGoogleAds(integration, isTestMode = false) {
        try {
            let report = [];

            // TEST MODU
            if (isTestMode || (integration && (integration.refresh_token === 'TEST_TOKEN' || integration.developer_token === 'TEST_TOKEN'))) {
                console.log('Google Ads: Test Modu Aktif. Sahte veriler üretiliyor...');
                for (let i = 0; i < 5; i++) {
                    report.push({
                        campaign: { id: `test_google_camp_${i}`, name: `Google Test Kampanyası ${i}` },
                        ad_group: { name: 'Test Ad Group' },
                        segments: { date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0] },
                        metrics: {
                            impressions: Math.floor(Math.random() * 15000) + 2000,
                            clicks: Math.floor(Math.random() * 800) + 100,
                            cost_micros: Math.floor(Math.random() * 500000000) + 50000000, // 50-500 TL (micro format)
                            average_cpc: Math.floor(Math.random() * 2000000) + 500000,
                            ctr: (Math.random() * 8 + 2).toFixed(2),
                            conversions: Math.floor(Math.random() * 20),
                            conversions_value: Math.floor(Math.random() * 2000) + 200
                        }
                    });
                }
            } else {
                const { client_id, client_secret, developer_token, refresh_token, account_id } = integration || {};
                
                if (!client_id || !client_secret || !developer_token || !refresh_token || !account_id) {
                    throw new Error('Google Ads için tüm kimlik bilgileri gereklidir.');
                }

                const client = new GoogleAdsApi({
                    client_id,
                    client_secret,
                    developer_token
                });

                // Google Ads hesabına bağlan
                const customer = client.Customer({
                    customer_id: account_id.replace(/-/g, ''), // 123-456-7890 -> 1234567890 formatına dönüştür
                    refresh_token
                });

                // GAQL Sorgusu
                report = await customer.query(`
                    SELECT 
                        campaign.id,
                        campaign.name, 
                        ad_group.name, 
                        segments.date,
                        metrics.impressions, 
                        metrics.clicks, 
                        metrics.cost_micros, 
                        metrics.average_cpc, 
                        metrics.ctr, 
                        metrics.conversions, 
                        metrics.conversions_value
                    FROM ad_group
                    WHERE segments.date DURING LAST_30_DAYS
                `);
            }

            const adsToInsert = [];
            const campaignsToInsert = [];

            for (const row of report) {
                const spend = (row.metrics.cost_micros / 1000000) || 0.0;
                
                adsToInsert.push({
                    date: row.segments.date,
                    platform: 'google_ads',
                    platform_id: row.campaign.id.toString(),
                    campaign_name: row.campaign.name,
                    ad_group: row.ad_group.name,
                    impressions: row.metrics.impressions || 0,
                    clicks: row.metrics.clicks || 0,
                    reach: 0, // Google Ads report'ta reach her zaman gelmeyebilir
                    spend,
                    ctr: row.metrics.ctr || 0.0,
                    cpc: (row.metrics.average_cpc / 1000000) || 0.0,
                    conversions: row.metrics.conversions || 0,
                    conversion_value: row.metrics.conversions_value || 0.0,
                    currency: 'TRY'
                });

                campaignsToInsert.push({
                    campaign_name: row.campaign.name,
                    platform: 'google_ads',
                    platform_id: row.campaign.id.toString(),
                    start_date: row.segments.date,
                    budget: 0,
                    status: 'active'
                });
            }

            if (adsToInsert.length > 0) {
                await AdsData.bulkCreate(adsToInsert, {
                    updateOnDuplicate: ['impressions', 'clicks', 'spend', 'ctr', 'cpc', 'conversions', 'conversion_value']
                });

                const uniqueCampaigns = [...new Map(campaignsToInsert.map(item => [item.campaign_name, item])).values()];
                for (const camp of uniqueCampaigns) {
                    await CampaignData.upsert(camp);
                }
            }

            return { success: true, count: adsToInsert.length };
        } catch (error) {
            console.error('Google Ads Sync Error:', error.message);
            throw error;
        }
    }
}

module.exports = new IntegrationService();
