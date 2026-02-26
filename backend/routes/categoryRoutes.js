const express = require('express');
const router = express.Router();
const {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    addSubcategory
} = require('../controllers/categoryController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/').get(getCategories).post(protect, admin, createCategory);
router
    .route('/:id')
    .put(protect, admin, updateCategory)
    .delete(protect, admin, deleteCategory);
router.route('/:id/subcategories').post(protect, admin, addSubcategory);

module.exports = router;
