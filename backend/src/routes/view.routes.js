const express = require('express');
const router = express.Router();
const { getViews, getViewById, createView, updateView, deleteView } = require('../controllers/view.controller');
const { authenticate } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Views
 *   description: Kullanıcı Dashboard Görünümleri (Layout/Filtre)
 */

/**
 * @swagger
 * /views:
 *   get:
 *     summary: Kullanıcının kayıtlı dashboard görünümlerini getirir
 *     tags: [Views]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Görünüm listesi
 */
router.get('/', authenticate, getViews);
router.get('/:id', authenticate, getViewById);

/**
 * @swagger
 * /views:
 *   post:
 *     summary: Yeni bir görünüm (Layout) kaydeder
 *     tags: [Views]
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
 *               layout_config:
 *                 type: object
 *               filter_config:
 *                 type: object
 *               is_default:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Oluşturulan görünüm
 */
router.post('/', authenticate, createView);
router.put('/:id', authenticate, updateView);

/**
 * @swagger
 * /views/{id}:
 *   delete:
 *     summary: Görünüm siler
 *     tags: [Views]
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
router.delete('/:id', authenticate, deleteView);

module.exports = router;
