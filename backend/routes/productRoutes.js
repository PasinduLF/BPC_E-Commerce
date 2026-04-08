const express = require('express');
const router = express.Router();
const {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    createProductReview,
    deleteProductReview,
} = require('../controllers/productController');
const { protect, optionalProtect, admin } = require('../middleware/authMiddleware');

router.route('/').get(optionalProtect, getProducts).post(protect, admin, createProduct);
router.route('/:id/reviews').post(protect, createProductReview);
router.route('/:id/reviews/:reviewId').delete(protect, admin, deleteProductReview);
router
    .route('/:id')
    .get(optionalProtect, getProductById)
    .put(protect, admin, updateProduct)
    .delete(protect, admin, deleteProduct);

module.exports = router;
