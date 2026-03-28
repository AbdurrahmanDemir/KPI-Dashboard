const express = require('express');
const router = express.Router();
const { getSegments, getSegmentById, createSegment, updateSegment, previewSegment, applySegment, deleteSegment } = require('../controllers/segment.controller');
const { authenticate } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Segments
 *   description: Kullanıcı Filtre Segmentleri Yönetimi
 */

/**
 * @swagger
 * /segments:
 *   get:
 *     summary: Kullanıcının kayıtlı segmentlerini getirir
 *     tags: [Segments]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Segment listesi
 */
router.get('/', authenticate, getSegments);
router.get('/:id', authenticate, getSegmentById);

/**
 * @swagger
 * /segments:
 *   post:
 *     summary: Yeni bir segment kaydeder
 *     tags: [Segments]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               rules_config:
 *                 type: object
 *                 description: Filtre JSON objesi
 *     responses:
 *       201:
 *         description: Oluşturulan segment objesi
 */
router.post('/', authenticate, createSegment);
router.put('/:id', authenticate, updateSegment);
router.get('/:id/preview', authenticate, previewSegment);
router.post('/:id/apply', authenticate, applySegment);

/**
 * @swagger
 * /segments/{id}:
 *   delete:
 *     summary: Segment siler
 *     tags: [Segments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Başarılı silme mesajı
 */
router.delete('/:id', authenticate, deleteSegment);

module.exports = router;
