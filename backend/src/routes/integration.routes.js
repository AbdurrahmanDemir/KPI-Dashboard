const express = require('express');
const router = express.Router();
const integrationController = require('../controllers/integration.controller');
const { authenticate, requireRoles } = require('../middleware/auth');

router.use(authenticate);
router.use(requireRoles('admin', 'marketing_manager'));

// GET /api/integrations
router.get('/', integrationController.getIntegrations);

// POST /api/integrations
router.post('/', integrationController.saveIntegration);

// POST /api/integrations/:platform/sync
router.post('/:platform/sync', integrationController.syncIntegration);

module.exports = router;
