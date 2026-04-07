const express = require('express');
const router = express.Router();
const {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    addSubcategory,
    updateSubcategory,
    deleteSubcategory,
    addNestedSubcategory,
    deleteNestedSubcategory
} = require('../controllers/categoryController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/').get(getCategories).post(protect, admin, createCategory);
router
    .route('/:id')
    .put(protect, admin, updateCategory)
    .delete(protect, admin, deleteCategory);
router.route('/:id/subcategories').post(protect, admin, addSubcategory);
router.route('/:id/subcategories/:subId')
    .put(protect, admin, updateSubcategory)
    .delete(protect, admin, deleteSubcategory);
router.route('/:id/subcategories/:subId/nested').post(protect, admin, addNestedSubcategory);
router.route('/:id/subcategories/:subId/nested/:nestedId').delete(protect, admin, deleteNestedSubcategory);

module.exports = router;
