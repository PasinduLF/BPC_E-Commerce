const express = require('express');
const router = express.Router();
const { createPOSOrder, getCustomerAccountByPhone, recordCustomerPayment, getAllCustomerAccounts } = require('../controllers/posController');
const { protect, admin } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');
const { createPosOrderSchema, customerPaymentSchema } = require('../validation/schemas');

router.post('/', protect, admin, validate(createPosOrderSchema), createPOSOrder);
router.get('/customer-account', protect, admin, getCustomerAccountByPhone);
router.get('/customer-accounts', protect, admin, getAllCustomerAccounts);
router.post('/customer-account/payment', protect, admin, validate(customerPaymentSchema), recordCustomerPayment);

module.exports = router;
