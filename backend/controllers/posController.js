const Order = require('../models/Order');
const Product = require('../models/Product');
const CustomerAccount = require('../models/CustomerAccount');
const mongoose = require('mongoose');

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

const normalizePhone = (value = '') => String(value).replace(/\s+/g, '').trim();

// @desc    Create a new POS (Point of Sale) physical order
// @route   POST /api/pos
// @access  Private/Admin
const createPOSOrder = async (req, res) => {
    console.log('=== POS Order Request Started ===');
    console.log('Body keys:', Object.keys(req.body));
    
    try {
        const {
            orderItems,
            paymentMethod,
            customerName,
            customerPhone,
            cashGiven,
            discountType,
            discountValue,
            applyCreditAmount,
            note,
        } = req.body;

        if (orderItems && orderItems.length === 0) {
            return res.status(400).json({ message: 'No order items' });
        }

        const attachedItems = [];
        const stockUpdates = [];

        for (const item of orderItems) {
            const qty = Number(item.qty);
            if (!Number.isInteger(qty) || qty <= 0) {
                throw createHttpError(400, `Invalid quantity for ${item.name || 'item'}`);
            }

            // Custom item path (no product reference) for manual walk-in sales.
            if (!item.product) {
                const customName = String(item.name || '').trim();
                const customPrice = Number(item.price);
                const customCostPrice = Math.max(Number(item.costPrice ?? item.price ?? 0), 0);

                if (!customName) {
                    throw createHttpError(400, 'Custom POS item name is required');
                }

                if (!Number.isFinite(customPrice) || customPrice < 0) {
                    throw createHttpError(400, `Invalid custom POS price for ${customName}`);
                }

                attachedItems.push({
                    name: customName,
                    qty,
                    image: String(item.image || ''),
                    price: customPrice,
                    product: undefined,
                    variantId: undefined,
                    variantName: undefined,
                    costPrice: customCostPrice,
                });

                continue;
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
        console.log('Subtotal calculated:', subtotal);
        console.log('AttachedItems count:', attachedItems.length);
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
        const normalizedPaymentMethod = ['Cash', 'Bank Transfer', 'Credit'].includes(paymentMethod) ? paymentMethod : 'Cash';
        const normalizedCustomerName = String(customerName || '').trim();
        const normalizedCustomerPhone = normalizePhone(customerPhone || '');
        const paidNowRaw = Math.max(Number(cashGiven) || 0, 0);

        const wantsCreditFlow = normalizedPaymentMethod === 'Credit' || paidNowRaw !== netTotal || Number(applyCreditAmount || 0) > 0;
        if (wantsCreditFlow && (!normalizedCustomerName || !normalizedCustomerPhone)) {
            return res.status(400).json({ message: 'Customer name and phone are required for credit and advance-balance operations' });
        }

        let customerAccount = null;
        if (normalizedCustomerPhone) {
            customerAccount = await CustomerAccount.findOne({ customerPhone: normalizedCustomerPhone });
        }

        const currentCredit = Number(customerAccount?.creditBalance || 0);
        const requestedCreditUse = Math.max(Number(applyCreditAmount) || 0, 0);
        const creditUsed = Math.min(requestedCreditUse, currentCredit, netTotal);

        const dueAfterCredit = Number((netTotal - creditUsed).toFixed(2));

        let paidNowAmount = paidNowRaw;
        if (normalizedPaymentMethod === 'Bank Transfer' && normalizedPaymentMethod !== 'Credit') {
            paidNowAmount = dueAfterCredit;
        }
        if (normalizedPaymentMethod === 'Credit') {
            paidNowAmount = paidNowRaw;
        }

        if (paidNowAmount < 0) paidNowAmount = 0;

        const delta = Number((paidNowAmount - dueAfterCredit).toFixed(2));
        const outstandingAddedAmount = delta < 0 ? Math.abs(delta) : 0;
        const creditAddedAmount = delta > 0 ? delta : 0;
        const isFullyPaid = outstandingAddedAmount === 0;

        if (normalizedPaymentMethod === 'Cash' && !wantsCreditFlow && paidNowAmount < dueAfterCredit) {
            return res.status(400).json({ message: 'Insufficient cash amount for this total' });
        }

        const finalChangeDue = 0;

        const session = await mongoose.startSession();
        let createdOrder;

        try {
            await session.withTransaction(async () => {
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
                            },
                            { session }
                        );
                    } else {
                        result = await Product.updateOne(
                            {
                                _id: update.productId,
                                stock: { $gte: update.qty },
                            },
                            {
                                $inc: { stock: -update.qty },
                            },
                            { session }
                        );
                    }

                    if (result.modifiedCount !== 1) {
                        throw createHttpError(409, 'Inventory changed while processing POS order. Please refresh and try again.');
                    }
                }

                const order = new Order({
                    orderItems: attachedItems,
                    shippingAddress: {
                        name: normalizedCustomerName || 'Walk-in Customer',
                        address: 'In-Store POS',
                        city: 'Local',
                        postalCode: '0000',
                        country: 'Local',
                        phone: normalizedCustomerPhone || 'N/A'
                    },
                    paymentMethod: normalizedPaymentMethod,
                    itemsPrice: Number(subtotal.toFixed(2)),
                    shippingPrice: 0.0,
                    totalPrice: netTotal,
                    discountType: normalizedDiscountType,
                    discountValue: normalizedDiscountValue,
                    discountAmount: Number(discountAmount.toFixed(2)),
                    customerName: normalizedCustomerName || undefined,
                    customerPhone: normalizedCustomerPhone || undefined,
                    cashGiven: paidNowAmount,
                    changeDue: finalChangeDue,
                    paidNowAmount,
                    appliedCreditAmount: Number(creditUsed.toFixed(2)),
                    outstandingAddedAmount: Number(outstandingAddedAmount.toFixed(2)),
                    creditAddedAmount: Number(creditAddedAmount.toFixed(2)),
                    isPaid: isFullyPaid,
                    paidAt: isFullyPaid ? Date.now() : undefined,
                    isDelivered: true,
                    deliveredAt: Date.now(),
                    isPOS: true,
                    status: isFullyPaid ? 'Delivered' : 'Processing'
                });

                createdOrder = await order.save({ session });

                if (wantsCreditFlow && normalizedCustomerPhone) {
                    if (!customerAccount) {
                        [customerAccount] = await CustomerAccount.create([{
                            customerName: normalizedCustomerName,
                            customerPhone: normalizedCustomerPhone,
                            creditBalance: 0,
                            outstandingBalance: 0,
                            ledger: [],
                        }], { session });
                    } else {
                        if (normalizedCustomerName) customerAccount.customerName = normalizedCustomerName;
                    }

                    customerAccount.ledger.push({
                        type: 'sale',
                        amount: Number(netTotal.toFixed(2)),
                        order: createdOrder._id,
                        note: note || 'POS sale',
                        paymentMethod: normalizedPaymentMethod,
                    });

                    if (creditUsed > 0) {
                        customerAccount.creditBalance = Number((customerAccount.creditBalance - creditUsed).toFixed(2));
                        if (customerAccount.creditBalance < 0) customerAccount.creditBalance = 0;
                        customerAccount.ledger.push({
                            type: 'credit-used',
                            amount: Number(creditUsed.toFixed(2)),
                            order: createdOrder._id,
                            note: 'Applied existing customer credit to POS order',
                        });
                    }

                    if (outstandingAddedAmount > 0) {
                        customerAccount.outstandingBalance = Number((customerAccount.outstandingBalance + outstandingAddedAmount).toFixed(2));
                        customerAccount.ledger.push({
                            type: 'outstanding-added',
                            amount: Number(outstandingAddedAmount.toFixed(2)),
                            order: createdOrder._id,
                            note: 'Outstanding amount recorded from POS order',
                        });
                    }

                    if (creditAddedAmount > 0) {
                        customerAccount.creditBalance = Number((customerAccount.creditBalance + creditAddedAmount).toFixed(2));
                        customerAccount.ledger.push({
                            type: 'credit-added',
                            amount: Number(creditAddedAmount.toFixed(2)),
                            order: createdOrder._id,
                            note: 'Advance amount added to customer credit balance',
                        });
                    }

                    await customerAccount.save({ session });
                }
            });
        } finally {
            await session.endSession();
        }

        const orderResponse = createdOrder.toObject();
        if (customerAccount) {
            orderResponse.customerAccount = {
                customerName: customerAccount.customerName,
                customerPhone: customerAccount.customerPhone,
                creditBalance: Number(customerAccount.creditBalance || 0),
                outstandingBalance: Number(customerAccount.outstandingBalance || 0),
            };
        }

        res.status(201).json(orderResponse);

    } catch (error) {
        console.error('POS Order Error:', {
            message: error.message,
            name: error.name,
            errors: error.errors,
            statusCode: error.statusCode,
            stack: error.stack
        });
        res.status(error.statusCode || 500).json({ 
            message: error.message || 'Error processing POS order',
            errors: error.errors,
            details: process.env.NODE_ENV !== 'production' ? error.message : undefined
        });
    }
};

// @desc    Get customer credit account by phone
// @route   GET /api/pos/customer-account
// @access  Private/Admin
const getCustomerAccountByPhone = async (req, res) => {
    const normalizedPhone = normalizePhone(req.query.phone || '');
    if (!normalizedPhone) {
        return res.status(400).json({ message: 'Phone is required' });
    }

    const account = await CustomerAccount.findOne({ customerPhone: normalizedPhone });
    if (!account) {
        return res.json(null);
    }

    res.json(account);
};

// @desc    Record a customer payment against outstanding balance
// @route   POST /api/pos/customer-account/payment
// @access  Private/Admin
const recordCustomerPayment = async (req, res) => {
    const normalizedPhone = normalizePhone(req.body.customerPhone || '');
    const normalizedName = String(req.body.customerName || '').trim();
    const paymentAmount = Math.max(Number(req.body.amount) || 0, 0);
    const paymentMethod = String(req.body.paymentMethod || 'Cash').trim();
    const note = String(req.body.note || '').trim();

    if (!normalizedPhone || !normalizedName) {
        return res.status(400).json({ message: 'Customer name and phone are required' });
    }

    if (paymentAmount <= 0) {
        return res.status(400).json({ message: 'Payment amount must be greater than zero' });
    }

    let account = await CustomerAccount.findOne({ customerPhone: normalizedPhone });
    if (!account) {
        account = new CustomerAccount({
            customerName: normalizedName,
            customerPhone: normalizedPhone,
            creditBalance: 0,
            outstandingBalance: 0,
            ledger: [],
        });
    }

    account.customerName = normalizedName;

    const outstandingBefore = Number(account.outstandingBalance || 0);
    const settledAmount = Math.min(outstandingBefore, paymentAmount);
    const extraAsCredit = Number((paymentAmount - settledAmount).toFixed(2));

    if (settledAmount > 0) {
        account.outstandingBalance = Number((account.outstandingBalance - settledAmount).toFixed(2));
        if (account.outstandingBalance < 0) account.outstandingBalance = 0;
        account.ledger.push({
            type: 'outstanding-cleared',
            amount: Number(settledAmount.toFixed(2)),
            note: note || 'Customer payment against outstanding balance',
            paymentMethod,
        });
    }

    if (extraAsCredit > 0) {
        account.creditBalance = Number((account.creditBalance + extraAsCredit).toFixed(2));
        account.ledger.push({
            type: 'credit-added',
            amount: extraAsCredit,
            note: note || 'Extra payment added to customer credit balance',
            paymentMethod,
        });
    }

    account.ledger.push({
        type: 'payment-received',
        amount: Number(paymentAmount.toFixed(2)),
        note: note || 'Customer payment recorded',
        paymentMethod,
    });

    await account.save();
    res.json(account);
};

// @desc    Get all customer credit accounts with optional search
// @route   GET /api/pos/customer-accounts
// @access  Private/Admin
const getAllCustomerAccounts = async (req, res) => {
    try {
        const search = String(req.query.search || '').toLowerCase().trim();
        const sortBy = String(req.query.sortBy || 'createdAt');
        const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

        let query = {};
        if (search) {
            // Search by phone or name
            query = {
                $or: [
                    { customerPhone: { $regex: search, $options: 'i' } },
                    { customerName: { $regex: search, $options: 'i' } },
                ],
            };
        }

        const sort = {};
        if (sortBy === 'createdAt' || sortBy === 'updatedAt' || sortBy === 'creditBalance' || sortBy === 'outstandingBalance') {
            sort[sortBy] = sortOrder;
        } else {
            sort.createdAt = -1;
        }

        const accounts = await CustomerAccount.find(query).sort(sort);
        res.json(accounts);
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message || 'Error fetching customer accounts' });
    }
};

module.exports = {
    createPOSOrder,
    getCustomerAccountByPhone,
    recordCustomerPayment,
    getAllCustomerAccounts,
};
