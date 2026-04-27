const express = require('express');
const router = express.Router();
const {
    exportSummaryPDF,
    exportSummaryCSV,
    exportSummaryXLSX,
    exportDetailedWorkbook,
    exportKpiSummary,
    exportChannelPerformance,
    exportCampaignPerformance,
    exportRawData
} = require('../controllers/export.controller');
const { authenticate } = require('../middleware/auth');

router.get('/pdf', authenticate, exportSummaryPDF);
router.get('/csv', authenticate, exportSummaryCSV);
router.get('/xlsx', authenticate, exportSummaryXLSX);
router.get('/detailed-xlsx', authenticate, exportDetailedWorkbook);
router.get('/kpi-summary', authenticate, exportKpiSummary);
router.get('/channel-performance', authenticate, exportChannelPerformance);
router.get('/campaign-performance', authenticate, exportCampaignPerformance);
router.get('/raw', authenticate, exportRawData);

module.exports = router;
