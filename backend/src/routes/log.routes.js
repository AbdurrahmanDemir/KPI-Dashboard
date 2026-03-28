const express = require('express');
const router = express.Router();
const { getLogs, getImportLogs, getApiLogs, getAuditLogs } = require('../controllers/log.controller');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.get('/', authenticate, requireAdmin, getLogs);
router.get('/imports', authenticate, requireAdmin, getImportLogs);
router.get('/api', authenticate, requireAdmin, getApiLogs);
router.get('/audit', authenticate, requireAdmin, getAuditLogs);

module.exports = router;
