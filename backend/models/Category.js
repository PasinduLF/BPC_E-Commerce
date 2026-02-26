const mongoose = require('mongoose');

const subcategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a subcategory name'],
        trim: true,
    },
    description: String,
});

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a category name'],
        unique: true,
        trim: true,
    },
    description: String,
    image: String, // Cloudinary URL
    subcategories: [subcategorySchema]
}, {
    timestamps: true
});

module.exports = mongoose.model('Category', categorySchema);
