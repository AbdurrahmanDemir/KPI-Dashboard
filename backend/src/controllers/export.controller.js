const PDFDocument = require('pdfkit');
const xlsx = require('xlsx');
const { Op } = require('sequelize');
const { getTrafficKPIs, getAdsKPIs, getSalesKPIs, getChannelPerformance } = require('../services/kpi.service');
const { getCampaignPerformance } = require('../services/dashboard.service');
const SalesData = require('../models/SalesData');
const TrafficData = require('../models/TrafficData');
const AdsData = require('../models/AdsData');
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
    country: req.query.country
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

        return sendTabularExport(res, `KPI_Raporu_${new Date().toISOString().split('T')[0]}`, 'xlsx', rows);
    } catch (err) {
        console.error('[EXPORT] XLSX Error:', err);
        return errorResponse(res, 500, 'INTERNAL_ERROR', 'Excel raporu olusturulamadi.');
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
    exportKpiSummary,
    exportChannelPerformance,
    exportCampaignPerformance,
    exportRawData
};
