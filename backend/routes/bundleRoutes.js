const express = require('express');
const router = express.Router();
const {
    getBundles,
    getBundleById,
    createBundle,
    updateBundle,
    deleteBundle
} = require('../controllers/bundleController');
const { protect, optionalProtect, admin } = require('../middleware/authMiddleware');

router.route('/')
    .get(optionalProtect, getBundles)
    .post(protect, admin, createBundle);

router.route('/:id')
    .get(optionalProtect, getBundleById)
    .put(protect, admin, updateBundle)
    .delete(protect, admin, deleteBundle);

module.exports = router;
