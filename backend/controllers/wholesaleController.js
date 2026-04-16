const WholesalePurchase = require('../models/WholesalePurchase');
const Product = require('../models/Product');
const mongoose = require('mongoose');

// @desc    Create a new wholesale purchase record
// @route   POST /api/wholesale
// @access  Private/Admin
const createWholesalePurchase = async (req, res) => {
    try {
        const {
            supplierName,
            items, // Now expecting an array of items
            paymentMethod,
            notes
        } = req.body;

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: 'No items provided in wholesale purchase' });
        }

        if (!String(supplierName || '').trim()) {
            return res.status(400).json({ message: 'Supplier name is required' });
        }

        // 1. Calculate the grand total cost for this purchase invoice
        const totalCost = items.reduce((acc, item) => acc + (Number(item.quantityReceived) * Number(item.unitCost)), 0);
        if (!Number.isFinite(totalCost) || totalCost <= 0) {
            return res.status(400).json({ message: 'Invoice total must be greater than zero' });
        }

        // 2. Map items to include individual total cost per line
        const processedItems = items.map((item, index) => {
            const quantityReceived = Number(item.quantityReceived);
            const unitCost = Number(item.unitCost);
            const customProductName = String(item.customProductName || '').trim();
            const normalizedProductId = String(item.product || '').trim();

            if (!Number.isInteger(quantityReceived) || quantityReceived <= 0) {
                const error = new Error(`Item ${index + 1}: quantity must be a whole number greater than 0`);
                error.statusCode = 400;
                throw error;
            }

            if (!Number.isFinite(unitCost) || unitCost < 0) {
                const error = new Error(`Item ${index + 1}: unit cost must be a valid non-negative number`);
                error.statusCode = 400;
                throw error;
            }

            if (!normalizedProductId && !customProductName) {
                const error = new Error(`Item ${index + 1}: include either a catalog product or a custom product name`);
                error.statusCode = 400;
                throw error;
            }

            if (normalizedProductId && !mongoose.Types.ObjectId.isValid(normalizedProductId)) {
                const error = new Error(`Item ${index + 1}: invalid product reference`);
                error.statusCode = 400;
                throw error;
            }

            return {
                product: normalizedProductId || undefined,
                customProductName: customProductName || undefined,
                variantId: item.variantId || undefined,
                variantName: item.variantName || undefined,
                quantityReceived,
                unitCost,
                itemTotalCost: quantityReceived * unitCost
            };
        });

        // 3. Create the purchase record
        const purchase = await WholesalePurchase.create({
            adminUser: req.user._id,
            supplierName,
            items: processedItems,
            totalCost,
            paymentMethod,
            notes
        });

        // 4. Update the Product's stock and cost price for EVERY incoming item
        for (const item of processedItems) {
            if (!item.product) {
                continue;
            }

            const productRecord = await Product.findById(item.product);
            if (!productRecord) continue; // Skip if product somehow got deleted

            if (item.variantId) {
                // Find the specific variant
                const variant = productRecord.variants.id(item.variantId);
                if (variant) {
                    variant.stock += item.quantityReceived;
                    // Optionally update variant cost price if desired, but for now we update base cost or handle it. 
                    // Let's update variant specific costPrice if it exists
                    variant.costPrice = item.unitCost;
                }
            } else {
                // Update Base Stock
                productRecord.stock += item.quantityReceived;
            }

            // Using Weighted Average Cost strategy could be complex for manual adjustments, 
            // so we simply update the current cost price to the most recent one.
            // If it's a base product without variants, or just tracking cost generally.
            productRecord.costPrice = item.unitCost;

            await productRecord.save();
        }

        res.status(201).json(purchase);

    } catch (error) {
        console.error('Wholesale create error:', error);
        if (error.statusCode) {
            return res.status(error.statusCode).json({ message: error.message });
        }

        if (error.name === 'ValidationError' || error.name === 'CastError') {
            return res.status(400).json({ message: error.message });
        }

        res.status(500).json({ message: error.message || 'Server Error updating wholesale stock' });
    }
};

// @desc    Get all wholesale purchases
// @route   GET /api/wholesale
// @access  Private/Admin
const getWholesalePurchases = async (req, res) => {
    try {
        const purchases = await WholesalePurchase.find({})
            .populate('items.product', 'name price')
            .populate('adminUser', 'name')
            .sort({ purchaseDate: -1 });

        res.json(purchases);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching wholesale records' });
    }
};

// @desc    Get single wholesale purchase by ID
// @route   GET /api/wholesale/:id
// @access  Private/Admin
const getWholesalePurchaseById = async (req, res) => {
    try {
        const purchase = await WholesalePurchase.findById(req.params.id)
            .populate('items.product', 'name price image images')
            .populate('adminUser', 'name');

        if (!purchase) {
            return res.status(404).json({ message: 'Wholesale purchase not found' });
        }

        res.json(purchase);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching wholesale record details' });
    }
};

// @desc    Delete a wholesale purchase (Revert stock)
// @route   DELETE /api/wholesale/:id
// @access  Private/Admin
const deleteWholesalePurchase = async (req, res) => {
    try {
        const purchase = await WholesalePurchase.findById(req.params.id);

        if (!purchase) {
            return res.status(404).json({ message: 'Wholesale purchase not found' });
        }

        // Revert the stock additions
        for (const item of purchase.items) {
            if (!item.product) {
                continue;
            }

            const productRecord = await Product.findById(item.product);
            if (!productRecord) continue;

            if (item.variantId) {
                const variant = productRecord.variants.id(item.variantId);
                if (variant) {
                    variant.stock -= item.quantityReceived;
                    if (variant.stock < 0) variant.stock = 0;
                }
            } else {
                productRecord.stock -= item.quantityReceived;
                if (productRecord.stock < 0) productRecord.stock = 0;
            }

            await productRecord.save();
        }

        await purchase.deleteOne();
        res.json({ message: 'Wholesale purchase removed and stock reverted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting wholesale record' });
    }
};

// @desc    Update a wholesale purchase
// @route   PUT /api/wholesale/:id
// @access  Private/Admin
const updateWholesalePurchase = async (req, res) => {
    try {
        const purchase = await WholesalePurchase.findById(req.params.id);

        if (!purchase) {
            return res.status(404).json({ message: 'Wholesale purchase not found' });
        }

        const { supplierName, paymentMethod, notes } = req.body;

        purchase.supplierName = supplierName || purchase.supplierName;
        purchase.paymentMethod = paymentMethod || purchase.paymentMethod;
        purchase.notes = notes !== undefined ? notes : purchase.notes;

        const updatedPurchase = await purchase.save();
        res.json(updatedPurchase);

    } catch (error) {
        res.status(500).json({ message: 'Error updating wholesale record' });
    }
};

module.exports = {
    createWholesalePurchase,
    getWholesalePurchases,
    getWholesalePurchaseById,
    deleteWholesalePurchase,
    updateWholesalePurchase
};
