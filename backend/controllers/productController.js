const Product = require('../models/Product');

// @desc    Fetch all products with filtering, sorting, pagination
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
    const pageSize = 12;
    const page = Number(req.query.pageNumber) || 1;

    const keyword = req.query.keyword
        ? {
            name: {
                $regex: req.query.keyword,
                $options: 'i',
            },
        }
        : {};

    const categoryFilter = req.query.category ? { category: req.query.category } : {};

    const activeFilter = req.query.admin === 'true' ? {} : { isActive: { $ne: false } };

    const count = await Product.countDocuments({ ...keyword, ...categoryFilter, ...activeFilter });
    const products = await Product.find({ ...keyword, ...categoryFilter, ...activeFilter })
        .populate('category', 'name')
        .populate('subcategory', 'name') // Add subcategory population
        .populate('brand', 'name') // Add brand population
        .limit(pageSize)
        .skip(pageSize * (page - 1));

    res.json({ products, page, pages: Math.ceil(count / pageSize) });
};

// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
    const product = await Product.findById(req.params.id)
        .populate('category', 'name subcategories')
        .populate('brand', 'name image') // Add brand population
        .populate('user', 'name');

    if (product) {
        res.json(product);
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res) => {
    try {
        const {
            name,
            price,
            discountPrice,
            costPrice,
            description,
            images,
            category,
            subcategory,
            brand, // Accept brand field
            stock,
            variants, // Accept variants
            isFeatured
        } = req.body;

        const product = new Product({
            user: req.user._id,
            name: name || 'Sample name',
            price: price || 0,
            discountPrice: discountPrice || 0,
            costPrice: costPrice || 0,
            description: description || 'Sample description',
            images: images && images.length > 0 ? images : [{ public_id: 'sample', url: '/images/sample.jpg' }],
            category: category || null,
            subcategory: subcategory || undefined,
            brand: brand || undefined, // Save brand field
            stock: stock || 0,
            variants: variants || [], // Default to empty array
            isFeatured: isFeatured || false
        });

        const createdProduct = await product.save();
        res.status(201).json(createdProduct);
    } catch (error) {
        res.status(500).json({ message: error.message || 'Error creating product' });
    }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
    const {
        name,
        price,
        discountPrice,
        costPrice,
        description,
        images,
        category,
        subcategory,
        brand, // Add brand
        stock,
        variants, // Accept variants
        isFeatured,
        isActive
    } = req.body;

    const product = await Product.findById(req.params.id);

    if (product) {
        product.name = name || product.name;
        product.price = price !== undefined ? price : product.price;
        product.discountPrice = discountPrice !== undefined ? discountPrice : product.discountPrice;
        product.costPrice = costPrice !== undefined ? costPrice : product.costPrice;
        product.description = description || product.description;
        product.images = images || product.images;
        product.category = category || product.category;
        product.subcategory = subcategory || product.subcategory;
        product.brand = brand !== undefined ? brand : product.brand; // Save brand update
        product.stock = stock !== undefined ? stock : product.stock;
        product.variants = variants !== undefined ? variants : product.variants; // Save variants update
        product.isFeatured = isFeatured !== undefined ? isFeatured : product.isFeatured;
        product.isActive = isActive !== undefined ? isActive : product.isActive;

        const updatedProduct = await product.save();
        res.json(updatedProduct);
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (product) {
        // Note: Here we'd also delete images from Cloudinary potentially
        await Product.deleteOne({ _id: product._id });
        res.json({ message: 'Product removed' });
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
};

module.exports = {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
};
