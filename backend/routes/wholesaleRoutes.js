const express = require('express');
const router = express.Router();
const {
    createWholesalePurchase,
    getWholesalePurchases,
    getWholesalePurchaseById,
    deleteWholesalePurchase,
    updateWholesalePurchase
} = require('../controllers/wholesaleController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, admin, createWholesalePurchase)
    .get(protect, admin, getWholesalePurchases);

router.route('/:id')
    .get(protect, admin, getWholesalePurchaseById)
    .put(protect, admin, updateWholesalePurchase)
    .delete(protect, admin, deleteWholesalePurchase);

module.exports = router;
