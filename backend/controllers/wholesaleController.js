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

module.exports = {
    createWholesalePurchase,
    getWholesalePurchases
};
