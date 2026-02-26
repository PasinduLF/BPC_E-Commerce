const Brand = require('../models/Brand');
const Product = require('../models/Product');

// @desc    Get all brands
// @route   GET /api/brands
// @access  Public
const getBrands = async (req, res) => {
    try {
        const brands = await Brand.find({});
        res.json(brands);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching brands' });
    }
};

// @desc    Create a brand
// @route   POST /api/brands
// @access  Private/Admin
const createBrand = async (req, res) => {
    try {
        const { name, description, image } = req.body;

        const brandExists = await Brand.findOne({ name });

        if (brandExists) {
            res.status(400);
            return res.json({ message: 'Brand already exists' });
        }

        const brand = await Brand.create({
            name,
            description,
            image
        });

        res.status(201).json(brand);
    } catch (error) {
        res.status(500).json({ message: 'Server error creating brand' });
    }
};

// @desc    Update a brand
// @route   PUT /api/brands/:id
// @access  Private/Admin
const updateBrand = async (req, res) => {
    try {
        const { name, description, image } = req.body;

        const brand = await Brand.findById(req.params.id);

        if (brand) {
            brand.name = name || brand.name;
            brand.description = description || brand.description;
            brand.image = image || brand.image;

            const updatedBrand = await brand.save();
            res.json(updatedBrand);
        } else {
            res.status(404).json({ message: 'Brand not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error updating brand' });
    }
};

// @desc    Delete a brand
// @route   DELETE /api/brands/:id
// @access  Private/Admin
const deleteBrand = async (req, res) => {
    try {
        const brand = await Brand.findById(req.params.id);

        if (brand) {
            // Check if any products use this brand
            const productsWithBrand = await Product.find({ brand: brand._id });
            if (productsWithBrand.length > 0) {
                return res.status(400).json({
                    message: `Cannot delete brand. ${productsWithBrand.length} product(s) are currently assigned to it.`
                });
            }

            await Brand.deleteOne({ _id: brand._id });
            res.json({ message: 'Brand removed' });
        } else {
            res.status(404).json({ message: 'Brand not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error deleting brand' });
    }
};

module.exports = {
    getBrands,
    createBrand,
    updateBrand,
    deleteBrand
};
