const express = require('express');
const router = express.Router();
const { getLogs } = require('../controllers/log.controller');
const { authenticate, requireAdmin } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Logs
 *   description: Sistem Güvenlik ve İşlem Kayıtları
 */

router.get('/', authenticate, requireAdmin, getLogs);

module.exports = router;
