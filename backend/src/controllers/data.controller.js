const { Op } = require('sequelize');
const { successResponse, errorResponse } = require('../utils/response');
const {
    ImportLog,
    TrafficData,
    SalesData,
    FunnelData,
    AdsData,
    CampaignData,
    CustomerData,
    Integration,
} = require('../models');

const MANUAL_SOURCE_LABELS = {
    google_analytics: 'Google Analytics',
    meta_ads: 'Meta Ads Dosya Importu',
    google_ads: 'Google Ads Dosya Importu',
    sales: 'Satis Verisi',
    funnel: 'Funnel Verisi',
    order_items: 'Siparis Kalemleri',
    ga4_items: 'GA4 Urun Etkilesimleri',
    campaigns: 'Kampanya Kayitlari',
    channel_mapping: 'Kanal Eslesmeleri',
    customers: 'Musteri Verisi',
};

const PLATFORM_LABELS = {
    google_ads: 'Google Ads',
    meta_ads: 'Meta Ads',
};

const toNumber = (value) => Number(value || 0);

const ensureManualSourceSummary = (map, sourceType, rowCount, lastImportAt) => {
    if (!rowCount || map.has(sourceType)) return;

    map.set(sourceType, {
        key: sourceType,
        label: MANUAL_SOURCE_LABELS[sourceType] || sourceType,
        import_count: 1,
        completed_count: 1,
        failed_count: 0,
        pending_count: 0,
        row_count: rowCount,
        error_count: 0,
        last_import_at: lastImportAt,
        synthetic: true,
    });
};

const getDatasetStat = async (model, label, where = {}, latestField = 'created_at') => {
    const [records, lastUpdatedAt] = await Promise.all([
        model.count({ where }),
        model.max(latestField, { where }),
    ]);

    return {
        label,
        records,
        last_updated_at: lastUpdatedAt,
    };
};

const getDataSummary = async (req, res) => {
    try {
        const [
            completedImports,
            failedImports,
            processingImports,
            activeIntegrations,
            totalIntegrations,
            lastManualImportAt,
            lastApiSyncAt,
            trafficStats,
            salesStats,
            funnelStats,
            manualAdsStats,
            apiAdsStats,
            campaignStats,
            customerStats,
            manualSourcesRaw,
            integrationsRaw,
        ] = await Promise.all([
            ImportLog.count({ where: { status: 'completed' } }),
            ImportLog.count({ where: { status: 'failed' } }),
            ImportLog.count({ where: { status: { [Op.in]: ['pending', 'mapping', 'processing'] } } }),
            Integration.count({ where: { is_active: true } }),
            Integration.count(),
            ImportLog.max('created_at', { where: { status: 'completed' } }),
            Integration.max('last_sync_at', { where: { last_sync_at: { [Op.ne]: null } } }),
            getDatasetStat(TrafficData, 'Trafik Verisi', {}, 'created_at'),
            getDatasetStat(SalesData, 'Satis Verisi', {}, 'created_at'),
            getDatasetStat(FunnelData, 'Funnel Verisi', {}, 'created_at'),
            getDatasetStat(AdsData, 'Reklam Verisi (Manuel Import)', { import_id: { [Op.ne]: null } }, 'created_at'),
            getDatasetStat(AdsData, 'Reklam Verisi (API / Test)', { import_id: null }, 'created_at'),
            getDatasetStat(CampaignData, 'Kampanya Kayitlari (API)', {}, 'updated_at'),
            getDatasetStat(CustomerData, 'Musteri Verisi', {}, 'created_at'),
            ImportLog.findAll({
                attributes: ['source_type', 'status', 'row_count', 'error_count', 'created_at'],
                order: [['created_at', 'DESC']],
                raw: true,
            }),
            Integration.findAll({
                attributes: ['platform', 'is_active', 'last_sync_at', 'account_id'],
                order: [['platform', 'ASC']],
                raw: true,
            }),
        ]);

        const manualSourcesMap = new Map();
        for (const row of manualSourcesRaw) {
            const current = manualSourcesMap.get(row.source_type) || {
                key: row.source_type,
                label: MANUAL_SOURCE_LABELS[row.source_type] || row.source_type,
                import_count: 0,
                completed_count: 0,
                failed_count: 0,
                pending_count: 0,
                row_count: 0,
                error_count: 0,
                last_import_at: null,
            };

            current.import_count += 1;
            current.row_count += toNumber(row.row_count);
            current.error_count += toNumber(row.error_count);

            if (row.status === 'completed') current.completed_count += 1;
            else if (row.status === 'failed') current.failed_count += 1;
            else current.pending_count += 1;

            if (!current.last_import_at || new Date(row.created_at) > new Date(current.last_import_at)) {
                current.last_import_at = row.created_at;
            }

            manualSourcesMap.set(row.source_type, current);
        }

        ensureManualSourceSummary(manualSourcesMap, 'sales', salesStats.records, salesStats.last_updated_at);
        ensureManualSourceSummary(manualSourcesMap, 'google_analytics', trafficStats.records, trafficStats.last_updated_at);
        ensureManualSourceSummary(manualSourcesMap, 'customers', customerStats.records, customerStats.last_updated_at);
        ensureManualSourceSummary(manualSourcesMap, 'funnel', funnelStats.records, funnelStats.last_updated_at);
        ensureManualSourceSummary(manualSourcesMap, 'google_ads', manualAdsStats.records, manualAdsStats.last_updated_at);

        const apiSources = await Promise.all(
            integrationsRaw.map(async (integration) => {
                const adsWhere = {
                    platform: integration.platform === 'meta_ads' ? 'meta' : 'google_ads',
                    import_id: null,
                };
                const campaignWhere = {
                    platform: integration.platform === 'meta_ads' ? 'meta' : 'google_ads',
                };

                const [ads_records, campaign_records] = await Promise.all([
                    AdsData.count({ where: adsWhere }),
                    CampaignData.count({ where: campaignWhere }),
                ]);

                return {
                    key: integration.platform,
                    label: PLATFORM_LABELS[integration.platform] || integration.platform,
                    is_active: Boolean(integration.is_active),
                    account_id: integration.account_id || null,
                    last_sync_at: integration.last_sync_at,
                    ads_records,
                    campaign_records,
                };
            })
        );

        const datasets = [
            { key: 'traffic', source: 'manual', ...trafficStats },
            { key: 'sales', source: 'manual', ...salesStats },
            { key: 'funnel', source: 'manual', ...funnelStats },
            { key: 'ads_manual', source: 'manual', ...manualAdsStats },
            { key: 'ads_api', source: 'api', ...apiAdsStats },
            { key: 'campaigns_api', source: 'api', ...campaignStats },
            { key: 'customers', source: 'manual', ...customerStats },
        ];

        const manualRecords = datasets
            .filter((item) => item.source === 'manual')
            .reduce((sum, item) => sum + item.records, 0);

        const apiRecords = datasets
            .filter((item) => item.source === 'api')
            .reduce((sum, item) => sum + item.records, 0);

        return successResponse(res, {
            overview: {
                total_records: manualRecords + apiRecords,
                manual_records: manualRecords,
                api_records: apiRecords,
                completed_imports: completedImports,
                failed_imports: failedImports,
                processing_imports: processingImports,
                active_integrations: activeIntegrations,
                total_integrations: totalIntegrations,
                last_manual_import_at: lastManualImportAt,
                last_api_sync_at: lastApiSyncAt,
            },
            datasets,
            manual_sources: Array.from(manualSourcesMap.values()).sort((a, b) => b.row_count - a.row_count),
            api_sources: apiSources,
        });
    } catch (error) {
        console.error('getDataSummary error:', error);
        return errorResponse(res, 500, 'INTERNAL_ERROR', 'Veri ozeti alinirken hata olustu.');
    }
};

module.exports = { getDataSummary };
