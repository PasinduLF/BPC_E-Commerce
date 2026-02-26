const express = require('express');
const router = express.Router();
const {
    createWholesalePurchase,
    getWholesalePurchases
} = require('../controllers/wholesaleController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, admin, createWholesalePurchase)
    .get(protect, admin, getWholesalePurchases);

module.exports = router;
