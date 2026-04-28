const express = require('express');
const router = express.Router();
const { getFinancialBalances } = require('../controllers/financialController');
const { protect, admin } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');
const { financialQuerySchema } = require('../validation/schemas');

router.get('/balances', protect, admin, validate(financialQuerySchema), getFinancialBalances);

module.exports = router;
