const express = require('express');
const router = express.Router();
const {
    addOrderItems,
    getMyOrders,
    getOrderById,
    updateOrderToPaid,
    updateOrderToDelivered,
    getOrders,
    updateOrderStatus,
    deleteOrder,
    updateOrderAdmin
} = require('../controllers/orderController');
const { protect, admin } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');
const {
    createOrderSchema,
    idParamSchema,
    updateOrderStatusSchema,
    paymentSlipSchema,
} = require('../validation/schemas');

router.route('/').post(protect, validate(createOrderSchema), addOrderItems).get(protect, admin, getOrders);
router.route('/myorders').get(protect, getMyOrders);
router.route('/:id')
    .get(protect, getOrderById)
    .delete(protect, admin, deleteOrder)
    .put(protect, admin, validate(idParamSchema), updateOrderAdmin);
router.route('/:id/pay').put(protect, validate(paymentSlipSchema), updateOrderToPaid);
router.route('/:id/deliver').put(protect, admin, validate(idParamSchema), updateOrderToDelivered);
router.route('/:id/status').put(protect, admin, validate(updateOrderStatusSchema), updateOrderStatus);

module.exports = router;
