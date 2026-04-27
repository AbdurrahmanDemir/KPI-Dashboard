const PDFDocument = require('pdfkit');
const xlsx = require('xlsx');
const { Op } = require('sequelize');
const {
    getTrafficKPIs,
    getAdsKPIs,
    getSalesKPIs,
    getTrendData,
    getChannelPerformance,
    getPlatformDistribution,
    getMarketingChannelPerformance,
    getSalesCityPerformance,
    getProductPerformanceSummary,
    getAttributionOverview,
    getSalesAdFormatPerformance
} = require('../services/kpi.service');
const {
    getPlatformPerformance,
    getCampaignPerformance,
    getCampaignProductPerformance,
    getMonthlyBrandSales,
    getMonthlyCampaignSales,
    getProductPerformance,
    getAttributionAnalysis,
    getFunnelPerformance,
    getCohortPerformance
} = require('../services/dashboard.service');
const SalesData = require('../models/SalesData');
const TrafficData = require('../models/TrafficData');
const AdsData = require('../models/AdsData');
const CampaignData = require('../models/CampaignData');
const FunnelData = require('../models/FunnelData');
const ImportLog = require('../models/ImportLog');
const Segment = require('../models/Segment');
const ChannelMapping = require('../models/ChannelMapping');
const Integration = require('../models/Integration');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { successResponse, errorResponse } = require('../utils/response');

const buildFilters = (req) => ({
    start_date: req.query.start_date,
    end_date: req.query.end_date,
    channel: req.query.channel,
    platform: req.query.platform,
    campaign_name: req.query.campaign_name,
    product_name: req.query.product_name,
    city: req.query.city,
    device: req.query.device,
    country: req.query.country,
    min_revenue: req.query.min_revenue,
    max_revenue: req.query.max_revenue,
    min_roas: req.query.min_roas,
    min_orders: req.query.min_orders
});

const buildWhereClause = (filters, config = {}) => {
    const where = {};

    if (config.dateField && (filters.start_date || filters.end_date)) {
        where[config.dateField] = {};
        if (filters.start_date) where[config.dateField][Op.gte] = filters.start_date;
        if (filters.end_date) where[config.dateField][Op.lte] = filters.end_date;
    }

    const mappings = [
        ['channel', 'channel'],
        ['platform', 'platform'],
        ['campaign_name', 'campaign_name'],
        ['product_name', 'product_name'],
        ['city', 'city'],
        ['device', 'device'],
        ['country', 'country'],
    ];

    for (const [filterKey, columnName] of mappings) {
        if (filters[filterKey] && config.columns?.includes(columnName)) {
            where[columnName] = filters[filterKey];
        }
    }

    return where;
};

const asCsv = (rows) => {
    if (!rows.length) return '';
    const headers = Object.keys(rows[0]);
    const csvRows = rows.map((row) => headers.map((header) => {
        const value = row[header] ?? '';
        const escaped = String(value).replace(/"/g, '""');
        return `"${escaped}"`;
    }).join(','));
    return [headers.join(','), ...csvRows].join('\n');
};

const EXCEL_CELL_TEXT_LIMIT = 32767;
const TRUNCATED_SUFFIX = '... [truncated for Excel cell limit]';

const normalizeCellValue = (value) => {
    let normalized = value;

    if (normalized === null || normalized === undefined) {
        normalized = '';
    } else if (normalized instanceof Date) {
        normalized = normalized.toISOString();
    } else if (typeof normalized === 'object') {
        normalized = JSON.stringify(normalized);
    }

    if (typeof normalized === 'string' && normalized.length > EXCEL_CELL_TEXT_LIMIT) {
        return normalized.slice(0, EXCEL_CELL_TEXT_LIMIT - TRUNCATED_SUFFIX.length) + TRUNCATED_SUFFIX;
    }

    return normalized;
};

const toPlainRow = (row) => {
    const source = row?.get ? row.get({ plain: true }) : row;
    return Object.entries(source || {}).reduce((acc, [key, value]) => {
        acc[key] = normalizeCellValue(value);
        return acc;
    }, {});
};

const rowsForSheet = (rows) => {
    const normalized = (rows || []).map(toPlainRow);
    return normalized.length ? normalized : [{ note: 'Veri yok' }];
};

const addWorksheet = (workbook, name, rows) => {
    const worksheet = xlsx.utils.json_to_sheet(rowsForSheet(rows));
    const headers = Object.keys(rowsForSheet(rows)[0] || {});
    worksheet['!cols'] = headers.map((header) => ({ wch: Math.min(Math.max(header.length + 4, 14), 42) }));
    xlsx.utils.book_append_sheet(workbook, worksheet, name.slice(0, 31));
};

const sendWorkbook = (res, filename, workbook) => {
    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}.xlsx`);
    return res.send(buffer);
};

const sendTabularExport = (res, filename, format, rows) => {
    if (format === 'json') {
        return successResponse(res, rows);
    }

    if (format === 'xlsx') {
        const workbook = xlsx.utils.book_new();
        const worksheet = xlsx.utils.json_to_sheet(rows);
        xlsx.utils.book_append_sheet(workbook, worksheet, 'Export');
        const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}.xlsx`);
        return res.send(buffer);
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}.csv`);
    return res.send(asCsv(rows));
};

const buildDetailedWorkbook = async (filters) => {
    const [
        traffic,
        ads,
        sales,
        trend,
        channelPerformance,
        platformDistribution,
        marketingChannels,
        salesByCity,
        productSummary,
        attributionOverview,
        salesAdFormat,
        platformPerformance,
        campaignPerformance,
        campaignProductPerformance,
        monthlyBrandSales,
        monthlyCampaignSales,
        productPerformance,
        attributionAnalysis,
        funnelPerformance,
        cohortPerformance,
        salesRows,
        trafficRows,
        adsRows,
        campaignRows,
        funnelRows,
        importLogs,
        segments,
        channelMappings,
        integrations,
        users,
        auditLogs
    ] = await Promise.all([
        getTrafficKPIs(filters),
        getAdsKPIs(filters),
        getSalesKPIs(filters),
        getTrendData(filters),
        getChannelPerformance(filters),
        getPlatformDistribution(filters),
        getMarketingChannelPerformance(filters),
        getSalesCityPerformance(filters),
        getProductPerformanceSummary(filters),
        getAttributionOverview(filters),
        getSalesAdFormatPerformance(filters),
        getPlatformPerformance(filters),
        getCampaignPerformance(filters),
        getCampaignProductPerformance(filters),
        getMonthlyBrandSales(filters),
        getMonthlyCampaignSales(filters),
        getProductPerformance(filters),
        getAttributionAnalysis(filters),
        getFunnelPerformance(filters),
        getCohortPerformance(filters),
        SalesData.findAll({
            where: buildWhereClause(filters, {
                dateField: 'order_date',
                columns: ['channel', 'campaign_name', 'product_name', 'city', 'device', 'country'],
            }),
            attributes: { exclude: ['raw_payload'] },
            raw: true,
        }),
        TrafficData.findAll({
            where: buildWhereClause(filters, {
                dateField: 'date',
                columns: ['channel', 'campaign_name', 'city', 'device'],
            }),
            attributes: { exclude: ['raw_payload'] },
            raw: true,
        }),
        AdsData.findAll({
            where: buildWhereClause(filters, {
                dateField: 'date',
                columns: ['platform', 'campaign_name'],
            }),
            attributes: { exclude: ['raw_payload'] },
            raw: true,
        }),
        CampaignData.findAll({
            where: buildWhereClause(filters, {
                dateField: 'start_date',
                columns: ['platform', 'campaign_name'],
            }),
            raw: true,
        }),
        FunnelData.findAll({
            where: buildWhereClause(filters, {
                dateField: 'date',
                columns: ['channel', 'device'],
            }),
            raw: true,
        }),
        ImportLog.findAll({ raw: true, order: [['created_at', 'DESC']] }),
        Segment.findAll({ raw: true, order: [['created_at', 'DESC']] }),
        ChannelMapping.findAll({ raw: true, order: [['created_at', 'DESC']] }),
        Integration.findAll({
            attributes: ['id', 'platform', 'account_id', 'is_active', 'last_sync_at', 'created_at', 'updated_at'],
            raw: true,
            order: [['platform', 'ASC']]
        }),
        User.findAll({
            attributes: ['id', 'name', 'email', 'role', 'last_login', 'is_active', 'created_at', 'updated_at'],
            raw: true,
            order: [['created_at', 'DESC']]
        }),
        AuditLog.findAll({ raw: true, order: [['created_at', 'DESC']], limit: 1000 })
    ]);

    const workbook = xlsx.utils.book_new();
    const createdAt = new Date().toISOString();
    const activeFilters = Object.entries(filters)
        .filter(([, value]) => value !== undefined && value !== null && value !== '')
        .map(([key, value]) => ({ filter: key, value }));

    addWorksheet(workbook, 'Rapor Ozeti', [
        { alan: 'Olusturma Zamani', deger: createdAt },
        { alan: 'Baslangic Tarihi', deger: filters.start_date || 'Tum veriler' },
        { alan: 'Bitis Tarihi', deger: filters.end_date || 'Tum veriler' },
        { alan: 'Aktif Filtre Sayisi', deger: activeFilters.length },
        { alan: 'Satis Satiri', deger: salesRows.length },
        { alan: 'Trafik Satiri', deger: trafficRows.length },
        { alan: 'Reklam Satiri', deger: adsRows.length },
    ]);
    addWorksheet(workbook, 'Aktif Filtreler', activeFilters);
    addWorksheet(workbook, 'KPI Ozeti', [
        { grup: 'Satis', ...sales },
        { grup: 'Reklam', ...ads },
        { grup: 'Trafik', ...traffic },
    ]);
    addWorksheet(workbook, 'Trend', trend);
    addWorksheet(workbook, 'Kanal Performansi', channelPerformance);
    addWorksheet(workbook, 'Platform Dagilimi', platformDistribution);
    addWorksheet(workbook, 'Platform Performansi', platformPerformance);
    addWorksheet(workbook, 'Pazarlama Kanallari', marketingChannels);
    addWorksheet(workbook, 'Kampanya Performansi', campaignPerformance);
    addWorksheet(workbook, 'Kampanya Urun Harcama', campaignProductPerformance);
    addWorksheet(workbook, 'Aylik Marka Satis', monthlyBrandSales);
    addWorksheet(workbook, 'Aylik Kampanya Satis', monthlyCampaignSales);
    addWorksheet(workbook, 'Urun Performansi', productPerformance.length ? productPerformance : productSummary);
    addWorksheet(workbook, 'Satis Sehir', salesByCity);
    addWorksheet(workbook, 'Reklam Formati', salesAdFormat);
    addWorksheet(workbook, 'Attribution Ozeti', [
        { kaynak: 'KPI Attribution', ...(attributionOverview.summary || {}) },
        { kaynak: 'Dashboard Attribution', ...(attributionAnalysis.summary || {}) },
    ]);
    addWorksheet(workbook, 'Attribution Detay', attributionAnalysis.rows || attributionOverview.rows || []);
    addWorksheet(workbook, 'Funnel Analizi', funnelPerformance);
    addWorksheet(workbook, 'Cohort Analizi', cohortPerformance);
    addWorksheet(workbook, 'Ham Satis', salesRows);
    addWorksheet(workbook, 'Ham Trafik', trafficRows);
    addWorksheet(workbook, 'Ham Reklam', adsRows);
    addWorksheet(workbook, 'Ham Kampanya', campaignRows);
    addWorksheet(workbook, 'Ham Funnel', funnelRows);
    addWorksheet(workbook, 'Import Loglari', importLogs);
    addWorksheet(workbook, 'Segmentler', segments);
    addWorksheet(workbook, 'Kanal Eslemeleri', channelMappings);
    addWorksheet(workbook, 'Entegrasyonlar', integrations);
    addWorksheet(workbook, 'Kullanicilar', users);
    addWorksheet(workbook, 'Audit Loglari', auditLogs);

    return workbook;
};

const exportSummaryPDF = async (req, res) => {
    try {
        const filters = buildFilters(req);
        const [traffic, ads, sales] = await Promise.all([
            getTrafficKPIs(filters),
            getAdsKPIs(filters),
            getSalesKPIs(filters)
        ]);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=KPI_Raporu_${new Date().toISOString().split('T')[0]}.pdf`);

        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        doc.pipe(res);
        doc.fontSize(24).font('Helvetica-Bold').fillColor('#1e40af').text('KPI Dashboard - Performans Raporu', { align: 'center' });
        doc.moveDown(1);
        doc.fontSize(12).fillColor('#64748b').text(`Tarih Araligi: ${filters.start_date || 'Tumu'} - ${filters.end_date || 'Tumu'}`, { align: 'center' });
        doc.moveDown(2);

        doc.fontSize(16).fillColor('#10b981').text('1. Satis ve Finansal Performans', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12).fillColor('#333333');
        doc.text(`Toplam Ciro: ${sales.revenue} TL`);
        doc.text(`Siparis Sayisi: ${sales.orders}`);
        doc.text(`Sepet Ortalamasi (AOV): ${sales.aov} TL`);
        doc.text(`Iade Orani: %${sales.refund_rate}`);
        doc.moveDown(1.5);

        doc.fontSize(16).fillColor('#6366f1').text('2. Reklam ve Pazarlama', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12).fillColor('#333333');
        doc.text(`Toplam Harcama: ${ads.spend} TL`);
        doc.text(`Tiklama: ${ads.clicks}`);
        doc.text(`Ortalama CPC: ${ads.cpc} TL`);
        doc.text(`Genel ROAS: ${ads.roas}x`);
        doc.moveDown(1.5);

        doc.fontSize(16).fillColor('#f59e0b').text('3. Trafik ve Ziyaretci Analizi', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12).fillColor('#333333');
        doc.text(`Oturum: ${traffic.sessions}`);
        doc.text(`Tekil Kullanici: ${traffic.users}`);
        doc.text(`Bounce Rate: %${traffic.bounce_rate}`);
        doc.text(`CVR: %${traffic.cvr}`);
        doc.moveDown(3);
        doc.fontSize(10).fillColor('#94a3b8').text('Otomatik olusturulmustur. - KPI Dashboard Sistemi', { align: 'center' });
        doc.end();
    } catch (err) {
        console.error('[EXPORT] PDF Error:', err);
        return errorResponse(res, 500, 'INTERNAL_ERROR', 'PDF raporu olusturulamadi.');
    }
};

const exportSummaryCSV = async (req, res) => {
    try {
        const filters = buildFilters(req);
        const [traffic, ads, sales] = await Promise.all([
            getTrafficKPIs(filters),
            getAdsKPIs(filters),
            getSalesKPIs(filters)
        ]);

        const rows = [
            { metrik: 'Toplam Ciro', deger: sales.revenue },
            { metrik: 'Siparis Sayisi', deger: sales.orders },
            { metrik: 'Sepet Ortalamasi', deger: sales.aov },
            { metrik: 'Iade Orani', deger: sales.refund_rate },
            { metrik: 'Toplam Harcama', deger: ads.spend },
            { metrik: 'Genel ROAS', deger: ads.roas },
            { metrik: 'Toplam Ziyaretci', deger: traffic.sessions }
        ];

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=KPI_Raporu_${new Date().toISOString().split('T')[0]}.csv`);
        return res.send(asCsv(rows));
    } catch (err) {
        console.error('[EXPORT] CSV Error:', err);
        return errorResponse(res, 500, 'INTERNAL_ERROR', 'CSV raporu olusturulamadi.');
    }
};

const exportSummaryXLSX = async (req, res) => {
    try {
        const filters = buildFilters(req);
        const workbook = await buildDetailedWorkbook(filters);
        return sendWorkbook(res, `Detayli_KPI_Raporu_${new Date().toISOString().split('T')[0]}`, workbook);
    } catch (err) {
        console.error('[EXPORT] XLSX Error:', err);
        return errorResponse(res, 500, 'INTERNAL_ERROR', 'Excel raporu olusturulamadi.');
    }
};

const exportDetailedWorkbook = async (req, res) => {
    try {
        const workbook = await buildDetailedWorkbook(buildFilters(req));
        return sendWorkbook(res, `Tum_Sayfalar_Detayli_Rapor_${new Date().toISOString().split('T')[0]}`, workbook);
    } catch (err) {
        console.error('[EXPORT] Detailed Workbook Error:', err);
        return errorResponse(res, 500, 'INTERNAL_ERROR', 'Detayli Excel raporu olusturulamadi.');
    }
};

const exportKpiSummary = async (req, res) => {
    try {
        const format = req.query.format || 'json';
        const filters = buildFilters(req);
        const [traffic, ads, sales] = await Promise.all([
            getTrafficKPIs(filters),
            getAdsKPIs(filters),
            getSalesKPIs(filters)
        ]);

        return sendTabularExport(res, 'kpi-summary', format, [{
            ...sales,
            ad_spend: ads.spend,
            roas: ads.roas,
            sessions: traffic.sessions,
            users: traffic.users,
            traffic_cvr: traffic.cvr
        }]);
    } catch (err) {
        return errorResponse(res, 500, 'INTERNAL_ERROR', 'KPI export olusturulamadi.');
    }
};

const exportChannelPerformance = async (req, res) => {
    try {
        const format = req.query.format || 'json';
        const rows = await getChannelPerformance(buildFilters(req));
        return sendTabularExport(res, 'channel-performance', format, rows);
    } catch (err) {
        return errorResponse(res, 500, 'INTERNAL_ERROR', 'Kanal performansi export olusturulamadi.');
    }
};

const exportCampaignPerformance = async (req, res) => {
    try {
        const format = req.query.format || 'json';
        const rows = await getCampaignPerformance(buildFilters(req));
        return sendTabularExport(res, 'campaign-performance', format, rows);
    } catch (err) {
        return errorResponse(res, 500, 'INTERNAL_ERROR', 'Kampanya performansi export olusturulamadi.');
    }
};

const exportRawData = async (req, res) => {
    try {
        const format = req.query.format || 'json';
        const filters = buildFilters(req);

        const [salesRows, trafficRows, adsRows] = await Promise.all([
            SalesData.findAll({
                where: buildWhereClause(filters, {
                    dateField: 'order_date',
                    columns: ['channel', 'campaign_name', 'product_name', 'city', 'device', 'country'],
                }),
                raw: true,
            }),
            TrafficData.findAll({
                where: buildWhereClause(filters, {
                    dateField: 'date',
                    columns: ['channel', 'campaign_name', 'city', 'device'],
                }),
                raw: true,
            }),
            AdsData.findAll({
                where: buildWhereClause(filters, {
                    dateField: 'date',
                    columns: ['platform', 'campaign_name'],
                }),
                raw: true,
            })
        ]);

        const rows = [
            ...salesRows.map((row) => ({ source_table: 'sales_data', ...row })),
            ...trafficRows.map((row) => ({ source_table: 'traffic_data', ...row })),
            ...adsRows.map((row) => ({ source_table: 'ads_data', ...row }))
        ];

        return sendTabularExport(res, 'raw-export', format, rows);
    } catch (err) {
        return errorResponse(res, 500, 'INTERNAL_ERROR', 'Ham veri export olusturulamadi.');
    }
};

module.exports = {
    exportSummaryPDF,
    exportSummaryCSV,
    exportSummaryXLSX,
    exportDetailedWorkbook,
    exportKpiSummary,
    exportChannelPerformance,
    exportCampaignPerformance,
    exportRawData
};
