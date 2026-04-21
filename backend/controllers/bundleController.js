const Bundle = require('../models/Bundle');
const Product = require('../models/Product');
const { tallyBundleSoldCounts } = require('../utils/salesCounts');

const normalizeBundleProducts = async (products = []) => {
    if (!Array.isArray(products) || products.length === 0) {
        return { error: 'Bundle must include at least one product.' };
    }

    const normalized = [];

    for (const line of products) {
        const productId = line?.product?._id || line?.product;
        const qty = Number(line?.qty || 0);

        if (!productId) {
            return { error: 'Each bundle line must include a product.' };
        }

        if (!Number.isInteger(qty) || qty <= 0) {
            return { error: 'Each bundle product quantity must be a positive whole number.' };
        }

        const productRecord = await Product.findById(productId).select('name variants');
        if (!productRecord) {
            return { error: 'One or more selected products are no longer available.' };
        }

        let variantId;
        let variantName = '';

        if (line?.variantId) {
            const variant = productRecord.variants.id(line.variantId);
            if (!variant) {
                return { error: `Selected variant for "${productRecord.name}" is no longer available.` };
            }

            variantId = variant._id;
            variantName = `${variant.name}: ${variant.value}`;
        }

        normalized.push({
            product: productRecord._id,
            qty,
            variantId,
            variantName,
        });
    }

    return { normalized };
};

// @desc    Get all active bundles (public)
// @route   GET /api/bundles
// @access  Public
const getBundles = async (req, res) => {
    try {
        const isAdminRequest = req.user?.role === 'admin' && req.query.admin === 'true';
        const filter = isAdminRequest ? {} : { isActive: true };

        const bundles = await Bundle.find(filter)
            .populate({
                path: 'products.product',
                select: 'name images price discountPrice brand stock isActive',
                populate: { path: 'brand', select: 'name' }
            })
            .sort({ isFeatured: -1, createdAt: -1 });

        const soldCounts = await tallyBundleSoldCounts(bundles.map((bundle) => bundle._id));
        const bundlesWithSoldCount = bundles.map((bundle) => {
            const bundleData = bundle.toObject();
            bundleData.soldCount = soldCounts.get(String(bundle._id)) || 0;
            return bundleData;
        });

        res.json(bundlesWithSoldCount);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching bundles' });
    }
};

// @desc    Get single bundle
// @route   GET /api/bundles/:id
// @access  Public
const getBundleById = async (req, res) => {
    try {
        const bundle = await Bundle.findById(req.params.id)
            .populate({
                path: 'products.product',
                select: 'name images price discountPrice brand stock isActive',
                populate: { path: 'brand', select: 'name' }
            });

        if (!bundle) {
            return res.status(404).json({ message: 'Bundle not found' });
        }

        const isAdminRequest = req.user?.role === 'admin' && req.query.admin === 'true';
        if (!bundle.isActive && !isAdminRequest) {
            return res.status(404).json({ message: 'Bundle not found' });
        }

        const soldCounts = await tallyBundleSoldCounts([bundle._id]);
        const bundleData = bundle.toObject();
        bundleData.soldCount = soldCounts.get(String(bundle._id)) || 0;
        res.json(bundleData);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching bundle' });
    }
};

// @desc    Create a bundle
// @route   POST /api/bundles
// @access  Private/Admin
const createBundle = async (req, res) => {
    try {
        const { name, description, image, products, bundlePrice, originalPrice, isActive, isFeatured } = req.body;

        if (!name || !products || products.length === 0 || bundlePrice === undefined) {
            return res.status(400).json({ message: 'Name, at least one product, and bundle price are required.' });
        }

        if (!Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ message: 'Bundle must include at least one product.' });
        }

        const { normalized: normalizedProducts, error: productsError } = await normalizeBundleProducts(products);
        if (productsError) {
            return res.status(400).json({ message: productsError });
        }

        const normalizedBundlePrice = Number(bundlePrice);
        if (Number.isNaN(normalizedBundlePrice) || normalizedBundlePrice < 0) {
            return res.status(400).json({ message: 'Bundle price must be a valid non-negative number.' });
        }

        const normalizedOriginalPrice = Number(originalPrice || 0);
        if (Number.isNaN(normalizedOriginalPrice) || normalizedOriginalPrice < 0) {
            return res.status(400).json({ message: 'Original price must be a valid non-negative number.' });
        }

        const bundle = await Bundle.create({
            name,
            description: description || '',
            image: image || { public_id: '', url: '' },
            products: normalizedProducts,
            bundlePrice: normalizedBundlePrice,
            originalPrice: normalizedOriginalPrice,
            isActive: isActive !== undefined ? isActive : true,
            isFeatured: isFeatured || false
        });

        const populated = await bundle.populate({
            path: 'products.product',
            select: 'name images price discountPrice brand stock',
            populate: { path: 'brand', select: 'name' }
        });

        res.status(201).json(populated);
    } catch (error) {
        res.status(500).json({ message: error.message || 'Server error creating bundle' });
    }
};

// @desc    Update a bundle
// @route   PUT /api/bundles/:id
// @access  Private/Admin
const updateBundle = async (req, res) => {
    try {
        const { name, description, image, products, bundlePrice, originalPrice, isActive, isFeatured } = req.body;

        const bundle = await Bundle.findById(req.params.id);

        if (!bundle) {
            return res.status(404).json({ message: 'Bundle not found' });
        }

        if (products !== undefined) {
            if (!Array.isArray(products) || products.length === 0) {
                return res.status(400).json({ message: 'Bundle must include at least one product.' });
            }
        }

        let normalizedProducts;
        if (products !== undefined) {
            const normalizedResult = await normalizeBundleProducts(products);
            if (normalizedResult.error) {
                return res.status(400).json({ message: normalizedResult.error });
            }
            normalizedProducts = normalizedResult.normalized;
        }

        if (bundlePrice !== undefined && Number(bundlePrice) < 0) {
            return res.status(400).json({ message: 'Bundle price cannot be negative.' });
        }

        if (originalPrice !== undefined && Number(originalPrice) < 0) {
            return res.status(400).json({ message: 'Original price cannot be negative.' });
        }

        bundle.name = name !== undefined ? name : bundle.name;
        bundle.description = description !== undefined ? description : bundle.description;
        bundle.image = image !== undefined ? image : bundle.image;
        bundle.products = normalizedProducts !== undefined ? normalizedProducts : bundle.products;
        bundle.bundlePrice = bundlePrice !== undefined ? Number(bundlePrice) : bundle.bundlePrice;
        bundle.originalPrice = originalPrice !== undefined ? Number(originalPrice) : bundle.originalPrice;
        bundle.isActive = isActive !== undefined ? isActive : bundle.isActive;
        bundle.isFeatured = isFeatured !== undefined ? isFeatured : bundle.isFeatured;

        const updated = await bundle.save();
        const populated = await updated.populate({
            path: 'products.product',
            select: 'name images price discountPrice brand stock',
            populate: { path: 'brand', select: 'name' }
        });

        res.json(populated);
    } catch (error) {
        res.status(500).json({ message: error.message || 'Server error updating bundle' });
    }
};

// @desc    Delete a bundle
// @route   DELETE /api/bundles/:id
// @access  Private/Admin
const deleteBundle = async (req, res) => {
    try {
        const bundle = await Bundle.findById(req.params.id);

        if (!bundle) {
            return res.status(404).json({ message: 'Bundle not found' });
        }

        await Bundle.deleteOne({ _id: bundle._id });
        res.json({ message: 'Bundle removed' });
    } catch (error) {
        res.status(500).json({ message: 'Server error deleting bundle' });
    }
};

module.exports = {
    getBundles,
    getBundleById,
    createBundle,
    updateBundle,
    deleteBundle
};
