const express = require('express');

const asyncHandler = require('../utils/async-handler');
const { ensurePasswordChanged, requireAuth } = require('../middleware/auth.middleware');
const { getDashboardSummaryController } = require('../controllers/dashboard.controller');

const router = express.Router();

router.use(requireAuth, ensurePasswordChanged);
router.get('/summary', asyncHandler(getDashboardSummaryController));

module.exports = router;
