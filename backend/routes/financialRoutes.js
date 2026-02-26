const express = require('express');
const router = express.Router();
const { getFinancialBalances } = require('../controllers/financialController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/balances', protect, admin, getFinancialBalances);

module.exports = router;
