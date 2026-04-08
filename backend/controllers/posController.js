const Order = require('../models/Order');
const Product = require('../models/Product');

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

        const attachedItems = [];
        const stockUpdates = [];

        for (const item of orderItems) {
            if (!item.product) {
                throw createHttpError(400, `Invalid POS item: missing product reference for ${item.name || 'item'}`);
            }

            const qty = Number(item.qty);
            if (!Number.isInteger(qty) || qty <= 0) {
                throw createHttpError(400, `Invalid quantity for ${item.name || 'item'}`);
            }

            const product = await Product.findById(item.product);
            if (!product) {
                throw createHttpError(404, `Product not found for POS item: ${item.name || item.product}`);
            }

            let resolvedPrice = getEffectiveUnitPrice(product.price, product.discountPrice);
            let resolvedCostPrice = Number(product.costPrice || 0);
            let resolvedVariantId;
            let resolvedVariantName;
            let resolvedImage = item.image || product.images?.[0]?.url || 'POS_ITEM';
            let availableStock = Number(product.stock || 0);

            if (item.variantId) {
                const variant = product.variants.id(item.variantId);
                if (!variant) {
                    throw createHttpError(400, `Selected variant is no longer available for ${product.name}`);
                }

                availableStock = Number(variant.stock || 0);
                resolvedPrice = getEffectiveUnitPrice(variant.price, variant.discountPrice);
                resolvedCostPrice = Number(variant.costPrice ?? product.costPrice ?? 0);
                resolvedVariantId = variant._id;
                resolvedVariantName = `${variant.name}: ${variant.value}`;
                resolvedImage = variant.image || resolvedImage;
            }

            if (availableStock < qty) {
                throw createHttpError(400, `Insufficient stock for ${product.name}`);
            }

            attachedItems.push({
                name: item.name || product.name,
                qty,
                image: resolvedImage,
                price: resolvedPrice,
                product: product._id,
                variantId: resolvedVariantId,
                variantName: resolvedVariantName,
                costPrice: resolvedCostPrice,
            });

            stockUpdates.push({
                productId: product._id,
                variantId: resolvedVariantId,
                qty,
            });
        }

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
                    throw createHttpError(409, 'Inventory changed while processing POS order. Please refresh and try again.');
                }

                appliedStockUpdates.push(update);
            }

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

    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message || 'Error processing POS order' });
    }
};

module.exports = {
    createPOSOrder
};
