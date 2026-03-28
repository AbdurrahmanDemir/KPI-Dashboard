const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { getOptions, validateFilters } = require('../controllers/filter.controller');

router.get('/options', authenticate, getOptions);
router.post('/validate', authenticate, validateFilters);

module.exports = router;
