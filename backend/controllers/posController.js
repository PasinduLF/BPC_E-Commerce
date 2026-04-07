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
            customerName,
            customerPhone,
            cashGiven,
            discountType,
            discountValue
        } = req.body;

        if (orderItems && orderItems.length === 0) {
            return res.status(400).json({ message: 'No order items' });
        }

        // Attach costPrice to orderItems from real-time DB data
        // and aggressively deduct stock
        const attachedItems = await Promise.all(orderItems.map(async (item) => {
            if (!item.product) {
                throw new Error(`Invalid POS item: missing product reference for ${item.name || 'item'}`);
            }

            const product = await Product.findById(item.product);
            if (!product) {
                throw new Error(`Product not found for POS item: ${item.name || item.product}`);
            }

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
                name: item.name || product.name,
                qty: item.qty,
                image: item.image || 'POS_ITEM',
                price: item.price,
                product: item.product,
                variantId: item.variantId,
                variantName: item.variantName,
                costPrice: product.costPrice || 0
            };
        }));

        const subtotal = attachedItems.reduce((sum, item) => sum + (Number(item.price) * Number(item.qty)), 0);
        const normalizedDiscountType = ['percentage', 'fixed'].includes(discountType) ? discountType : 'none';
        const normalizedDiscountValue = Math.max(Number(discountValue) || 0, 0);

        let discountAmount = 0;
        if (normalizedDiscountType === 'percentage') {
            discountAmount = subtotal * (normalizedDiscountValue / 100);
        } else if (normalizedDiscountType === 'fixed') {
            discountAmount = normalizedDiscountValue;
        }
        if (discountAmount > subtotal) discountAmount = subtotal;

        const netTotal = Number((subtotal - discountAmount).toFixed(2));
        const tenderedCash = Math.max(Number(cashGiven) || 0, 0);

        if ((paymentMethod || 'Cash') === 'Cash' && tenderedCash < netTotal) {
            return res.status(400).json({ message: 'Insufficient cash amount for this discounted total' });
        }

        const finalChangeDue = (paymentMethod || 'Cash') === 'Cash'
            ? Number((tenderedCash - netTotal).toFixed(2))
            : 0;

        const order = new Order({
            orderItems: attachedItems,
            shippingAddress: {
                name: customerName || 'Walk-in Customer',
                address: 'In-Store POS',
                city: 'Local',
                postalCode: '0000',
                country: 'Local',
                phone: customerPhone || 'N/A'
            },
            paymentMethod: paymentMethod || 'Cash', // default POS logic
            itemsPrice: Number(subtotal.toFixed(2)),
            shippingPrice: 0.0,
            totalPrice: netTotal,
            discountType: normalizedDiscountType,
            discountValue: normalizedDiscountValue,
            discountAmount: Number(discountAmount.toFixed(2)),
            customerName: customerName || undefined,
            customerPhone: customerPhone || undefined,
            cashGiven: tenderedCash,
            changeDue: finalChangeDue,
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
