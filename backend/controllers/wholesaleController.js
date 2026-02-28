const WholesalePurchase = require('../models/WholesalePurchase');
const Product = require('../models/Product');

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

        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'No items provided in wholesale purchase' });
        }

        // 1. Calculate the grand total cost for this purchase invoice
        const totalCost = items.reduce((acc, item) => acc + (Number(item.quantityReceived) * Number(item.unitCost)), 0);

        // 2. Map items to include individual total cost per line
        const processedItems = items.map(item => ({
            product: item.product,
            variantId: item.variantId || undefined,
            variantName: item.variantName || undefined,
            quantityReceived: Number(item.quantityReceived),
            unitCost: Number(item.unitCost),
            itemTotalCost: Number(item.quantityReceived) * Number(item.unitCost)
        }));

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
