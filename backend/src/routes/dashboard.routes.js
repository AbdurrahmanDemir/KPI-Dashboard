const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
    getTrend,
    getChannelPerformance,
    getPlatformPerformance,
    getCampaignPerformance,
    getProductPerformance,
    getAttributionAnalysis,
    getFunnel,
    getCohort
} = require('../controllers/dashboard.controller');

router.get('/trend', authenticate, getTrend);
router.get('/channel-performance', authenticate, getChannelPerformance);
router.get('/platform-performance', authenticate, getPlatformPerformance);
router.get('/campaign-performance', authenticate, getCampaignPerformance);
router.get('/product-performance', authenticate, getProductPerformance);
router.get('/attribution-analysis', authenticate, getAttributionAnalysis);
router.get('/funnel', authenticate, getFunnel);
router.get('/cohort', authenticate, getCohort);

module.exports = router;
