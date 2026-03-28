const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
    getChannelMappings,
    createChannelMapping,
    updateChannelMapping,
    deleteChannelMapping
} = require('../controllers/mapping.controller');

router.get('/channels', authenticate, getChannelMappings);
router.post('/channels', authenticate, createChannelMapping);
router.put('/channels/:id', authenticate, updateChannelMapping);
router.delete('/channels/:id', authenticate, deleteChannelMapping);

module.exports = router;
