const Order = require('../models/Order');
const Product = require('../models/Product');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const addOrderItems = async (req, res) => {
    const {
        orderItems,
        shippingAddress,
        paymentMethod,
        itemsPrice,
        shippingPrice,
        totalPrice,
    } = req.body;

    if (orderItems && orderItems.length === 0) {
        res.status(400);
        throw new Error('No order items');
    } else {
        const order = new Order({
            orderItems: orderItems.map((x) => ({
                name: x.name,
                qty: x.qty,
                image: x.image || (x.images && x.images.length > 0 ? x.images[0].url : 'placeholder'),
                price: x.price,
                costPrice: x.costPrice || 0,
                product: x._id,
                variantId: (x.variant && x.variant._id) ? x.variant._id : undefined,
                variantName: x.variant ? `${x.variant.name}: ${x.variant.value}` : undefined,
            })),
            user: req.user._id,
            shippingAddress,
            paymentMethod,
            itemsPrice,
            shippingPrice,
            totalPrice,
        });

        const createdOrder = await order.save();

        // Deduct stock for each item depending on if it's a variant or base product
        for (const item of createdOrder.orderItems) {
            const productRecord = await Product.findById(item.product);
            if (productRecord) {
                if (item.variantId && productRecord.variants && productRecord.variants.length > 0) {
                    const variant = productRecord.variants.id(item.variantId);
                    if (variant) {
                        variant.stock -= item.qty;
                        if (variant.stock < 0) variant.stock = 0;
                    }
                } else {
                    productRecord.stock -= item.qty;
                    if (productRecord.stock < 0) productRecord.stock = 0;
                }
                await productRecord.save();
            }
        }

        res.status(201).json(createdOrder);
    }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = async (req, res) => {
    const orders = await Order.find({ user: req.user._id });
    res.json(orders);
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
    const order = await Order.findById(req.params.id).populate(
        'user',
        'name email'
    );

    if (order) {
        res.json(order);
    } else {
        res.status(404);
        throw new Error('Order not found');
    }
};

// @desc    Update order payment slip
// @route   PUT /api/orders/:id/pay
// @access  Private
const updateOrderToPaid = async (req, res) => {
    const order = await Order.findById(req.params.id);
    const { paymentSlipUrl, paymentSlipPublicId } = req.body;

    if (order) {
        order.paymentSlip = {
            url: paymentSlipUrl,
            public_id: paymentSlipPublicId
        };
        order.status = 'Processing';

        const updatedOrder = await order.save();
        res.json(updatedOrder);
    } else {
        res.status(404);
        throw new Error('Order not found');
    }
};

// @desc    Update order to delivered/verified
// @route   PUT /api/orders/:id/deliver
// @access  Private/Admin
const updateOrderToDelivered = async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (order) {
        order.isDelivered = true;
        order.deliveredAt = Date.now();
        order.status = 'Delivered';
        order.isPaid = true; // Assuming delivery means payment was verified for COD or Bank Transfer

        const updatedOrder = await order.save();
        res.json(updatedOrder);
    } else {
        res.status(404);
        throw new Error('Order not found');
    }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = async (req, res) => {
    const orders = await Order.find({}).populate('user', 'id name');
    res.json(orders);
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (order) {
        order.status = req.body.status || order.status;

        if (req.body.status === 'Payment Verified' || req.body.status === 'Delivered') {
            order.isPaid = true;
            if (!order.paidAt) order.paidAt = Date.now();
        }

        if (req.body.status === 'Delivered') {
            order.isDelivered = true;
            order.deliveredAt = Date.now();
        }

        const updatedOrder = await order.save();
        res.json(updatedOrder);
    } else {
        res.status(404);
        throw new Error('Order not found');
    }
};

module.exports = {
    addOrderItems,
    getMyOrders,
    getOrderById,
    updateOrderToPaid,
    updateOrderToDelivered,
    getOrders,
    updateOrderStatus
};
