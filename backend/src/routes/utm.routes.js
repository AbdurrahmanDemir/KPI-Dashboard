const express = require('express');
const router = express.Router();
const { authenticate, requireRoles, requireViewer } = require('../middleware/auth');
const {
    getLinks,
    createUtmLink,
    patchLinkStatus,
    getUtmAnalytics,
    simulateUtmActivity,
    trackUtmLink,
    collectUtmEvent,
} = require('../controllers/utm.controller');

router.get('/track/:code', trackUtmLink);
router.post('/track/:code/event', collectUtmEvent);

router.get('/links', authenticate, requireViewer, getLinks);
router.post('/links', authenticate, requireRoles('admin', 'marketing_manager'), createUtmLink);
router.patch('/links/:id', authenticate, requireRoles('admin', 'marketing_manager'), patchLinkStatus);
router.post('/links/:id/simulate', authenticate, requireRoles('admin', 'marketing_manager'), simulateUtmActivity);
router.get('/analytics', authenticate, requireViewer, getUtmAnalytics);

module.exports = router;
