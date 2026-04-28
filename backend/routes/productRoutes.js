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
const validate = require('../middleware/validateMiddleware');
const { searchLimiter } = require('../middleware/rateLimitMiddleware');
const { productSchema } = require('../validation/schemas');

router.route('/').get(searchLimiter, optionalProtect, getProducts).post(protect, admin, validate(productSchema), createProduct);
router.route('/:id/reviews').post(protect, createProductReview);
router.route('/:id/reviews/:reviewId').delete(protect, admin, deleteProductReview);
router
    .route('/:id')
    .get(optionalProtect, getProductById)
    .put(protect, admin, validate(productSchema), updateProduct)
    .delete(protect, admin, deleteProduct);

module.exports = router;
