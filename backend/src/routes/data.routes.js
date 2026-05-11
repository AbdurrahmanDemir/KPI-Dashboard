const express = require('express');
const router = express.Router();

const { getDataSummary } = require('../controllers/data.controller');
const { authenticate, requireRoles } = require('../middleware/auth');

router.get('/summary', authenticate, requireRoles('admin', 'marketing_manager'), getDataSummary);

module.exports = router;
