const express = require('express');
const router = express.Router();
const { createPOSOrder, getCustomerAccountByPhone, recordCustomerPayment, getAllCustomerAccounts } = require('../controllers/posController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/', protect, admin, createPOSOrder);
router.get('/customer-account', protect, admin, getCustomerAccountByPhone);
router.get('/customer-accounts', protect, admin, getAllCustomerAccounts);
router.post('/customer-account/payment', protect, admin, recordCustomerPayment);

module.exports = router;
