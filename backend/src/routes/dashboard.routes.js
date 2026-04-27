const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
    getTrend,
    getChannelPerformance,
    getPlatformPerformance,
    getCampaignPerformance,
    getCampaignProductPerformance,
    getMonthlyBrandSales,
    getMonthlyCampaignSales,
    getProductPerformance,
    getAttributionAnalysis,
    getFunnel,
    getCohort
} = require('../controllers/dashboard.controller');

router.get('/trend', authenticate, getTrend);
router.get('/channel-performance', authenticate, getChannelPerformance);
router.get('/platform-performance', authenticate, getPlatformPerformance);
router.get('/campaign-performance', authenticate, getCampaignPerformance);
router.get('/campaign-product-performance', authenticate, getCampaignProductPerformance);
router.get('/monthly-brand-sales', authenticate, getMonthlyBrandSales);
router.get('/monthly-campaign-sales', authenticate, getMonthlyCampaignSales);
router.get('/product-performance', authenticate, getProductPerformance);
router.get('/attribution-analysis', authenticate, getAttributionAnalysis);
router.get('/funnel', authenticate, getFunnel);
router.get('/cohort', authenticate, getCohort);

module.exports = router;
