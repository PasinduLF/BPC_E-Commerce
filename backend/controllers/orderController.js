const Order = require('../models/Order');
const Product = require('../models/Product');
const SystemConfig = require('../models/SystemConfig');

const ORDER_PAYMENT_METHODS = ['Cash on Delivery', 'Bank Transfer', 'Cash'];

const toObjectIdString = (value) => String(value || '');

const getEffectiveUnitPrice = (price, discountPrice) => {
    const basePrice = Number(price || 0);
    const discounted = Number(discountPrice || 0);
    return discounted > 0 && discounted < basePrice ? discounted : basePrice;
};

const createHttpError = (statusCode, message) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const deriveOrderStatus = (order) => {
    if (order.isDelivered) return 'Delivered';
    if (order.fulfillmentType === 'pickup' && order.isReadyForPickup) return 'Ready for Pickup';
    if (order.isPaid) return 'Payment Verified';
    if (order.paymentMethod === 'Bank Transfer' && order.paymentSlip?.url) return 'Processing';
    return 'Pending';
};

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const addOrderItems = async (req, res) => {
    try {
        const {
            orderItems,
            shippingAddress,
            paymentMethod,
            paymentSlip,
            shippingPrice,
            fulfillmentType,
        } = req.body;

        if (!Array.isArray(orderItems) || orderItems.length === 0) {
            res.status(400);
            return res.json({ message: 'No order items' });
        } else {
            const normalizedFulfillmentType = fulfillmentType === 'pickup' ? 'pickup' : 'delivery';
            const normalizedShippingAddress = {
                name: shippingAddress?.name || req.user?.name || 'Customer',
                address: shippingAddress?.address,
                city: shippingAddress?.city,
                postalCode: shippingAddress?.postalCode,
                country: shippingAddress?.country,
                phone: shippingAddress?.phone,
            };

            let pickupStoreSnapshot = undefined;

            if (normalizedFulfillmentType === 'pickup') {
                const systemConfig = await SystemConfig.findOne();
                const pickupStore = systemConfig?.pickupStore || {};

                if (!pickupStore.storeName || !pickupStore.address || !pickupStore.city) {
                    return res.status(400).json({
                        message: 'Pickup is currently unavailable. Please contact support.',
                    });
                }

                pickupStoreSnapshot = {
                    storeName: pickupStore.storeName,
                    address: pickupStore.address,
                    city: pickupStore.city,
                    phone: pickupStore.phone || '',
                    openingHours: pickupStore.openingHours || '',
                    notes: pickupStore.notes || '',
                };

                normalizedShippingAddress.address = pickupStore.address;
                normalizedShippingAddress.city = pickupStore.city;
                normalizedShippingAddress.postalCode = normalizedShippingAddress.postalCode || 'N/A';
                normalizedShippingAddress.country = normalizedShippingAddress.country || 'N/A';
            }

            if (
                !normalizedShippingAddress.name ||
                !normalizedShippingAddress.address ||
                !normalizedShippingAddress.city ||
                !normalizedShippingAddress.postalCode ||
                !normalizedShippingAddress.country ||
                !normalizedShippingAddress.phone
            ) {
                return res.status(400).json({
                    message: 'Shipping name, phone, and full address are required',
                });
            }

            const normalizedPaymentMethod = ORDER_PAYMENT_METHODS.includes(paymentMethod)
                ? paymentMethod
                : 'Cash on Delivery';

            if (normalizedFulfillmentType === 'pickup' && normalizedPaymentMethod !== 'Bank Transfer') {
                return res.status(400).json({
                    message: 'Pickup orders require Bank Transfer payment method',
                });
            }

            const preparedOrderItems = [];
            const stockUpdates = [];
            let computedItemsPrice = 0;

            for (const item of orderItems) {
                const qty = Number(item.qty);
                if (!Number.isInteger(qty) || qty <= 0) {
                    throw createHttpError(400, 'Each order item quantity must be a positive whole number');
                }

                const productId = item.product || item._id;
                if (!productId) {
                    throw createHttpError(400, 'Each order item must include a product reference');
                }

                const productRecord = await Product.findById(productId);
                if (!productRecord) {
                    throw createHttpError(404, 'One or more products are no longer available');
                }

                const requestedVariantId = item.variantId || item.variant?._id;
                let resolvedName = item.name || productRecord.name;
                let resolvedImage = item.image || (productRecord.images && productRecord.images.length > 0 ? productRecord.images[0].url : 'placeholder');
                let resolvedPrice = getEffectiveUnitPrice(productRecord.price, productRecord.discountPrice);
                let resolvedCostPrice = Number(productRecord.costPrice || 0);
                let availableStock = Number(productRecord.stock || 0);
                let resolvedVariantId;
                let resolvedVariantName;

                if (requestedVariantId) {
                    const variant = productRecord.variants.id(requestedVariantId);
                    if (!variant) {
                        throw createHttpError(400, `Selected variant is no longer available for ${productRecord.name}`);
                    }

                    availableStock = Number(variant.stock || 0);
                    resolvedPrice = getEffectiveUnitPrice(variant.price, variant.discountPrice);
                    resolvedCostPrice = Number(variant.costPrice ?? productRecord.costPrice ?? 0);
                    resolvedVariantId = variant._id;
                    resolvedVariantName = `${variant.name}: ${variant.value}`;
                    resolvedImage = variant.image || resolvedImage;
                }

                if (availableStock < qty) {
                    throw createHttpError(400, `Insufficient stock for ${resolvedName}`);
                }

                preparedOrderItems.push({
                    name: resolvedName,
                    qty,
                    image: resolvedImage,
                    price: resolvedPrice,
                    costPrice: resolvedCostPrice,
                    product: productRecord._id,
                    variantId: resolvedVariantId,
                    variantName: resolvedVariantName,
                });

                computedItemsPrice += resolvedPrice * qty;

                stockUpdates.push({
                    productId: productRecord._id,
                    variantId: resolvedVariantId,
                    qty,
                });
            }

            const normalizedShippingPrice = normalizedFulfillmentType === 'pickup'
                ? 0
                : Math.max(Number(shippingPrice) || 0, 0);
            const normalizedItemsPrice = Number(computedItemsPrice.toFixed(2));
            const normalizedTotalPrice = Number((normalizedItemsPrice + normalizedShippingPrice).toFixed(2));

            const appliedStockUpdates = [];
            try {
                for (const update of stockUpdates) {
                    let result;
                    if (update.variantId) {
                        result = await Product.updateOne(
                            {
                                _id: update.productId,
                                'variants._id': update.variantId,
                                'variants.stock': { $gte: update.qty },
                            },
                            {
                                $inc: { 'variants.$.stock': -update.qty },
                            }
                        );
                    } else {
                        result = await Product.updateOne(
                            {
                                _id: update.productId,
                                stock: { $gte: update.qty },
                            },
                            {
                                $inc: { stock: -update.qty },
                            }
                        );
                    }

                    if (result.modifiedCount !== 1) {
                        throw createHttpError(409, 'Inventory changed while placing order. Please review your cart and try again.');
                    }

                    appliedStockUpdates.push(update);
                }

                const order = new Order({
                    orderItems: preparedOrderItems,
                    user: req.user._id,
                    shippingAddress: normalizedShippingAddress,
                    paymentMethod: normalizedPaymentMethod,
                    fulfillmentType: normalizedFulfillmentType,
                    pickupStore: pickupStoreSnapshot,
                    paymentSlip,
                    itemsPrice: normalizedItemsPrice,
                    shippingPrice: normalizedShippingPrice,
                    totalPrice: normalizedTotalPrice,
                });

                const createdOrder = await order.save();
                return res.status(201).json(createdOrder);
            } catch (error) {
                if (appliedStockUpdates.length > 0) {
                    for (const rollback of appliedStockUpdates) {
                        if (rollback.variantId) {
                            await Product.updateOne(
                                {
                                    _id: rollback.productId,
                                    'variants._id': rollback.variantId,
                                },
                                {
                                    $inc: { 'variants.$.stock': rollback.qty },
                                }
                            );
                        } else {
                            await Product.updateOne(
                                { _id: rollback.productId },
                                { $inc: { stock: rollback.qty } }
                            );
                        }
                    }
                }

                throw error;
            }
        }
    } catch (error) {
        console.error('Order creation error:', error);
        res.status(error.statusCode || 500).json({ message: error.message || 'Error occurred while creating order' });
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

    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    const isAdmin = req.user?.role === 'admin';
    const isOwner = order.user && toObjectIdString(order.user._id || order.user) === toObjectIdString(req.user._id);

    if (!isAdmin && !isOwner) {
        return res.status(403).json({ message: 'Not authorized to view this order' });
    }

    res.json(order);
};

// @desc    Update order payment slip
// @route   PUT /api/orders/:id/pay
// @access  Private
const updateOrderToPaid = async (req, res) => {
    const order = await Order.findById(req.params.id);
    const { paymentSlipUrl, paymentSlipPublicId } = req.body;

    if (order) {
        const isAdmin = req.user?.role === 'admin';
        const isOwner = order.user && toObjectIdString(order.user) === toObjectIdString(req.user._id);

        if (!isAdmin && !isOwner) {
            return res.status(403).json({ message: 'Not authorized to update this order payment' });
        }

        if (!isAdmin && !order.user) {
            return res.status(403).json({ message: 'Only admin can update payment for POS orders' });
        }

        order.paymentSlip = {
            url: paymentSlipUrl,
            public_id: paymentSlipPublicId
        };
        order.status = 'Processing';

        const updatedOrder = await order.save({ validateBeforeSave: false });
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
        if (order.fulfillmentType === 'pickup' && !order.isReadyForPickup) {
            return res.status(400).json({ message: 'Pickup order is not ready yet' });
        }
        order.isDelivered = true;
        order.deliveredAt = Date.now();
        if (order.fulfillmentType === 'pickup') {
            order.pickedUpAt = Date.now();
        }
        order.status = 'Delivered';

        const updatedOrder = await order.save({ validateBeforeSave: false });
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
        const { status, paymentStatus, deliveryStatus } = req.body;
        const { isReadyForPickup } = req.body;
        const isPickupOrder = order.fulfillmentType === 'pickup';

        if (paymentStatus === 'paid') {
            order.isPaid = true;
            if (!order.paidAt) order.paidAt = Date.now();
        } else if (paymentStatus === 'unpaid') {
            order.isPaid = false;
            order.paidAt = undefined;
        }

        if (isPickupOrder && typeof isReadyForPickup === 'boolean') {
            order.isReadyForPickup = isReadyForPickup;
            if (isReadyForPickup) {
                if (!order.readyForPickupAt) order.readyForPickupAt = Date.now();
                if (!order.isDelivered) {
                    order.status = 'Ready for Pickup';
                }
            } else {
                order.readyForPickupAt = undefined;
                if (!order.isDelivered) {
                    order.status = order.isPaid ? 'Payment Verified' : 'Processing';
                }
            }
        }

        if (deliveryStatus === 'delivered') {
            if (isPickupOrder && !order.isReadyForPickup) {
                return res.status(400).json({ message: 'Pickup order is not ready yet' });
            }
            order.isDelivered = true;
            if (!order.deliveredAt) order.deliveredAt = Date.now();
            if (isPickupOrder) {
                order.pickedUpAt = Date.now();
            }
        } else if (deliveryStatus === 'processing') {
            order.isDelivered = false;
            order.deliveredAt = undefined;
            if (isPickupOrder) {
                order.pickedUpAt = undefined;
            }
        }

        if (status) {
            order.status = status;
        }

        if (status === 'Payment Verified' || status === 'Delivered') {
            order.isPaid = true;
            if (!order.paidAt) order.paidAt = Date.now();
        }

        if (status === 'Pending') {
            order.isPaid = false;
            order.isDelivered = false;
            order.paidAt = undefined;
            order.deliveredAt = undefined;
            if (isPickupOrder) {
                order.isReadyForPickup = false;
                order.readyForPickupAt = undefined;
                order.pickedUpAt = undefined;
            }
        }

        if (status === 'Delivered') {
            order.isDelivered = true;
            order.deliveredAt = Date.now();
        }

        if (!status) {
            order.status = deriveOrderStatus(order);
        }

        const updatedOrder = await order.save({ validateBeforeSave: false });
        res.json(updatedOrder);
    } else {
        res.status(404);
        throw new Error('Order not found');
    }
};

// @desc    Delete order
// @route   DELETE /api/orders/:id
// @access  Private/Admin
const deleteOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Refund stock for POS orders (or any delivered orders we want to reverse)
        if (order.isPOS) {
            for (const item of order.orderItems) {
                const productRecord = await Product.findById(item.product);
                if (productRecord) {
                    if (item.variantId && productRecord.variants && productRecord.variants.length > 0) {
                        const variant = productRecord.variants.id(item.variantId);
                        if (variant) variant.stock += item.qty;
                    } else {
                        productRecord.stock += item.qty;
                    }
                    await productRecord.save();
                }
            }
        }

        await order.deleteOne();
        res.json({ message: 'Order removed, stock refunded' });
    } catch (error) {
        res.status(500).json({ message: error.message || 'Error deleting order' });
    }
};

// @desc    Admin update order details (e.g. POS Customer Info)
// @route   PUT /api/orders/:id
// @access  Private/Admin
const updateOrderAdmin = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        order.customerName = req.body.customerName !== undefined ? req.body.customerName : order.customerName;
        order.customerPhone = req.body.customerPhone !== undefined ? req.body.customerPhone : order.customerPhone;
        order.cashGiven = req.body.cashGiven !== undefined ? Number(req.body.cashGiven) : order.cashGiven;
        order.changeDue = req.body.changeDue !== undefined ? Number(req.body.changeDue) : order.changeDue;

        // Allow updating payment method if we made a mistake
        if (req.body.paymentMethod) {
            if (order.fulfillmentType === 'pickup' && req.body.paymentMethod !== 'Bank Transfer') {
                return res.status(400).json({ message: 'Pickup orders must use Bank Transfer payment method' });
            }
            order.paymentMethod = req.body.paymentMethod;
        }

        const updatedOrder = await order.save();
        res.json(updatedOrder);

    } catch (error) {
        res.status(500).json({ message: 'Error updating order details' });
    }
};

module.exports = {
    addOrderItems,
    getMyOrders,
    getOrderById,
    updateOrderToPaid,
    updateOrderToDelivered,
    getOrders,
    updateOrderStatus,
    deleteOrder,
    updateOrderAdmin
};
