const Order = require('../models/Order');
const Product = require('../models/Product');

// @desc    Create a new POS (Point of Sale) physical order
// @route   POST /api/pos
// @access  Private/Admin
const createPOSOrder = async (req, res) => {
    try {
        const {
            orderItems,
            paymentMethod,
            itemsPrice,
            totalPrice,
            customerName,
            customerPhone,
            cashGiven,
            changeDue
        } = req.body;

        if (orderItems && orderItems.length === 0) {
            return res.status(400).json({ message: 'No order items' });
        }

        // Attach costPrice to orderItems from real-time DB data
        // and aggressively deduct stock
        const attachedItems = await Promise.all(orderItems.map(async (item) => {
            const product = await Product.findById(item.product);
            if (product) {
                if (item.variantId && product.variants && product.variants.length > 0) {
                    const variant = product.variants.id(item.variantId);
                    if (variant) {
                        variant.stock -= item.qty;
                        if (variant.stock < 0) variant.stock = 0;
                    }
                } else {
                    product.stock -= item.qty;
                    if (product.stock < 0) product.stock = 0;
                }
                await product.save();
            }

            return {
                ...item,
                costPrice: product ? product.costPrice : 0
            };
        }));

        const order = new Order({
            orderItems: attachedItems,
            shippingAddress: {
                address: 'In-Store POS',
                city: 'Local',
                postalCode: '0000',
                country: 'Local',
                phone: 'N/A'
            },
            paymentMethod: paymentMethod || 'Cash', // default POS logic
            itemsPrice,
            shippingPrice: 0.0,
            totalPrice,
            customerName: customerName || undefined,
            customerPhone: customerPhone || undefined,
            cashGiven: cashGiven || 0,
            changeDue: changeDue || 0,
            isPaid: true, // POS implies immediate settlement
            paidAt: Date.now(),
            isDelivered: true, // Physical walk-out
            deliveredAt: Date.now(),
            isPOS: true,
            status: 'Delivered'
        });

        const createdOrder = await order.save();
        res.status(201).json(createdOrder);

    } catch (error) {
        res.status(500).json({ message: error.message || 'Error processing POS order' });
    }
};

module.exports = {
    createPOSOrder
};
