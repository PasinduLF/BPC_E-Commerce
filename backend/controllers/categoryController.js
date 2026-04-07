const Category = require('../models/Category');

// @desc    Fetch all categories
// @route   GET /api/categories
// @access  Public
const getCategories = async (req, res) => {
    const categories = await Category.find({});
    res.json(categories);
};

// @desc    Create a category
// @route   POST /api/categories
// @access  Private/Admin
const createCategory = async (req, res) => {
    const { name, description, image } = req.body;

    const categoryExists = await Category.findOne({ name });
    if (categoryExists) {
        res.status(400);
        throw new Error('Category already exists');
    }

    const category = new Category({
        name,
        description,
        image,
        subcategories: []
    });

    const createdCategory = await category.save();
    res.status(201).json(createdCategory);
};

// @desc    Update a category
// @route   PUT /api/categories/:id
// @access  Private/Admin
const updateCategory = async (req, res) => {
    const { name, description, image } = req.body;

    const category = await Category.findById(req.params.id);

    if (category) {
        category.name = name || category.name;
        category.description = description || category.description;
        category.image = image || category.image;

        const updatedCategory = await category.save();
        res.json(updatedCategory);
    } else {
        res.status(404);
        throw new Error('Category not found');
    }
};

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
const deleteCategory = async (req, res) => {
    const category = await Category.findById(req.params.id);

    if (category) {
        await Category.deleteOne({ _id: category._id });
        res.json({ message: 'Category removed' });
    } else {
        res.status(404);
        throw new Error('Category not found');
    }
};

// @desc    Add subcategory to a category
// @route   POST /api/categories/:id/subcategories
// @access  Private/Admin
const addSubcategory = async (req, res) => {
    const { name, description } = req.body;

    const category = await Category.findById(req.params.id);

    if (category) {
        const subcategoryExists = category.subcategories.find(
            (s) => s.name === name
        );

        if (subcategoryExists) {
            res.status(400);
            throw new Error('Subcategory already exists in this category');
        }

        category.subcategories.push({ name, description });

        const updatedCategory = await category.save();
        res.status(201).json(updatedCategory);
    } else {
        res.status(404);
        throw new Error('Category not found');
    }
};

// @desc    Update subcategory
// @route   PUT /api/categories/:id/subcategories/:subId
// @access  Private/Admin
const updateSubcategory = async (req, res) => {
    const { name, description } = req.body;
    const category = await Category.findById(req.params.id);

    if (category) {
        const subcategory = category.subcategories.id(req.params.subId);
        if (subcategory) {
            subcategory.name = name || subcategory.name;
            subcategory.description = description || subcategory.description;
            await category.save();
            res.json(category);
        } else {
            res.status(404);
            throw new Error('Subcategory not found');
        }
    } else {
        res.status(404);
        throw new Error('Category not found');
    }
};

// @desc    Delete subcategory
// @route   DELETE /api/categories/:id/subcategories/:subId
// @access  Private/Admin
const deleteSubcategory = async (req, res) => {
    const category = await Category.findById(req.params.id);

    if (category) {
        category.subcategories.pull(req.params.subId);
        await category.save();
        res.json({ message: 'Subcategory removed' });
    } else {
        res.status(404);
        throw new Error('Category not found');
    }
};

// @desc    Add nested subcategory
// @route   POST /api/categories/:id/subcategories/:subId/nested
// @access  Private/Admin
const addNestedSubcategory = async (req, res) => {
    const { name, description } = req.body;
    const category = await Category.findById(req.params.id);

    if (category) {
        const subcategory = category.subcategories.id(req.params.subId);
        if (!subcategory) {
            res.status(404);
            throw new Error('Subcategory not found');
        }

        const nestedExists = subcategory.nestedSubcategories.find(n => n.name === name);
        if (nestedExists) {
            res.status(400);
            throw new Error('Nested subcategory already exists');
        }

        subcategory.nestedSubcategories.push({ name, description });
        await category.save();
        res.status(201).json(category);
    } else {
        res.status(404);
        throw new Error('Category not found');
    }
};

// @desc    Delete nested subcategory
// @route   DELETE /api/categories/:id/subcategories/:subId/nested/:nestedId
// @access  Private/Admin
const deleteNestedSubcategory = async (req, res) => {
    const category = await Category.findById(req.params.id);

    if (category) {
        const subcategory = category.subcategories.id(req.params.subId);
        if (!subcategory) {
            res.status(404);
            throw new Error('Subcategory not found');
        }

        subcategory.nestedSubcategories.pull(req.params.nestedId);
        await category.save();
        res.json(category);
    } else {
        res.status(404);
        throw new Error('Category not found');
    }
};

module.exports = {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    addSubcategory,
    updateSubcategory,
    deleteSubcategory,
    addNestedSubcategory,
    deleteNestedSubcategory
};
