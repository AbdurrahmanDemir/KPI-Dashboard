const PDFDocument = require('pdfkit');
const { getTrafficKPIs, getAdsKPIs, getSalesKPIs } = require('../services/kpi.service');
const { successResponse, errorResponse } = require('../utils/response');

// ─── GET /export/pdf ──────────────────────────────────────────────────────────
const exportSummaryPDF = async (req, res) => {
    try {
        const filters = {
            start_date: req.query.start_date,
            end_date: req.query.end_date,
            channel: req.query.channel,
        };

        const [traffic, ads, sales] = await Promise.all([
            getTrafficKPIs(filters),
            getAdsKPIs(filters),
            getSalesKPIs(filters)
        ]);

        // PDF Headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=KPI_Raporu_${new Date().toISOString().split('T')[0]}.pdf`);

        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        doc.pipe(res);

        // Styling
        doc.fontSize(24).font('Helvetica-Bold').fillColor('#1e40af').text('KPI Dashboard - Performans Raporu', { align: 'center' });
        doc.moveDown(1);
        doc.fontSize(12).fillColor('#64748b').text(`Tarih Aralığı: ${filters.start_date || 'Tümü'} - ${filters.end_date || 'Tümü'}`, { align: 'center' });
        doc.moveDown(2);

        // --- Sales Box
        doc.fontSize(16).fillColor('#10b981').text('1. Satis & Finansal Performans', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12).fillColor('#333333');
        doc.text(`- Toplam Ciro: ${sales.revenue} TL`);
        doc.text(`- Siparis Sayisi: ${sales.orders}`);
        doc.text(`- Sepet Ortalamasi (AOV): ${sales.aov} TL`);
        doc.text(`- Iade Orani: %${sales.refund_rate}`);
        doc.moveDown(1.5);

        // --- Marketing Box
        doc.fontSize(16).fillColor('#6366f1').text('2. Reklam & Pazarlama', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12).fillColor('#333333');
        doc.text(`- Toplam Harcama: ${ads.spend} TL`);
        doc.text(`- Tıklama (Clicks): ${ads.clicks}`);
        doc.text(`- Ortalama CPC: ${ads.cpc} TL`);
        doc.text(`- Genel ROAS: ${ads.roas}x`);
        doc.moveDown(1.5);

        // --- Traffic Box
        doc.fontSize(16).fillColor('#f59e0b').text('3. Trafik & Ziyaretci Analizi', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12).fillColor('#333333');
        doc.text(`- Oturum (Sessions): ${traffic.sessions}`);
        doc.text(`- Tekil Kullanici: ${traffic.users}`);
        doc.text(`- Bounce Rate: %${traffic.bounce_rate}`);
        doc.text(`- CVR (Donusum Orani): %${traffic.cvr}`);

        doc.moveDown(3);
        doc.fontSize(10).fillColor('#94a3b8').text('Otomatik olusturulmustur. - KPI Dashboard Sistemi', { align: 'center' });

        doc.end();
    } catch (err) {
        console.error('[EXPORT] PDF Error:', err);
        return errorResponse(res, 500, 'INTERNAL_ERROR', 'PDF raporu oluşturulamadı.');
    }
};

// ─── GET /export/csv ──────────────────────────────────────────────────────────
const exportSummaryCSV = async (req, res) => {
    try {
        const filters = {
            start_date: req.query.start_date,
            end_date: req.query.end_date,
        };

        const [traffic, ads, sales] = await Promise.all([
            getTrafficKPIs(filters),
            getAdsKPIs(filters),
            getSalesKPIs(filters)
        ]);

        const headers = 'Metrik,Deger\n';
        const rows = [
            `Toplam Ciro,${sales.revenue}`,
            `Siparis Sayisi,${sales.orders}`,
            `Sepet Ortalamasi,${sales.aov}`,
            `Iade Orani,${sales.refund_rate}`,
            `Toplam Harcama,${ads.spend}`,
            `Genel ROAS,${ads.roas}`,
            `Toplam Ziyaretci,${traffic.sessions}`
        ].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=KPI_Raporu_${new Date().toISOString().split('T')[0]}.csv`);
        
        return res.send(headers + rows);
    } catch (err) {
        console.error('[EXPORT] CSV Error:', err);
        return errorResponse(res, 500, 'INTERNAL_ERROR', 'CSV raporu oluşturulamadı.');
    }
};

module.exports = {
    exportSummaryPDF,
    exportSummaryCSV
};
