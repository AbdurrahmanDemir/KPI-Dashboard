const express = require('express');
const router = express.Router();
const { getSummary, getTrend, clearCache } = require('../controllers/kpi.controller');
const { authenticate } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: KPIs
 *   description: KPI ve Dashboard verileri
 */

/**
 * @swagger
 * /kpi/summary:
 *   get:
 *     summary: Tüm KPI özetlerini getirir
 *     tags: [KPIs]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: channel
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: KPI özeti
 */
router.get('/summary', authenticate, getSummary);

/**
 * @swagger
 * /kpi/trend:
 *   get:
 *     summary: Tarih bazlı ciro trendini getirir
 *     tags: [KPIs]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Trend verisi
 */
router.get('/trend', authenticate, getTrend);

/**
 * @swagger
 * /kpi/run:
 *   post:
 *     summary: Cache'i temizle ve KPI'ları yeniden hesaplamaya zorla
 *     tags: [KPIs]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Cache temizlendi
 */
router.post('/run', authenticate, clearCache);

module.exports = router;
