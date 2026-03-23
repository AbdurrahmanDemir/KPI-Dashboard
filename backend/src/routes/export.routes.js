const express = require('express');
const router = express.Router();
const { exportSummaryPDF, exportSummaryCSV } = require('../controllers/export.controller');
const { authenticate } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Export
 *   description: Rapor Dışa Aktarımı (PDF ve CSV)
 */

/**
 * @swagger
 * /export/pdf:
 *   get:
 *     summary: Dashboard Metriklerini PDF Olarak İndir
 *     tags: [Export]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: PDF Dosyası
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/pdf', authenticate, exportSummaryPDF);

/**
 * @swagger
 * /export/csv:
 *   get:
 *     summary: Dashboard Metriklerini CSV Olarak İndir
 *     tags: [Export]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: CSV Dosyası
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 */
router.get('/csv', authenticate, exportSummaryCSV);

module.exports = router;
