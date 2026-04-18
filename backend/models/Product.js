const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        required: true
    },
    user: {
        type: mongoose.Schema.ObjectId,
        required: true,
        ref: 'User'
    }
}, {
    timestamps: true
});

const productSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: [true, 'Please add a product name'],
        trim: true,
    },
    sku: {
        type: String,
        trim: true,
        unique: true,
        sparse: true,
    },
    description: {
        type: String,
        required: [true, 'Please add a description']
    },
    descriptionSections: {
        details: { type: String, default: '' },
        benefits: { type: String, default: '' },
        howToUse: { type: String, default: '' },
        ingredients: { type: String, default: '' },
        specifications: { type: String, default: '' },
        shippingInformation: { type: String, default: '' }
    },
    price: {
        type: Number,
        required: [true, 'Please add a selling price']
    },
    discountPrice: {
        type: Number,
        default: 0
    },
    costPrice: {
        type: Number,
        default: 0,
        required: [true, 'Please add a wholesale cost price']
    },
    images: [
        {
            public_id: { type: String, required: true },
            url: { type: String, required: true } // Cloudinary URLs
        }
    ],
    category: {
        type: mongoose.Schema.ObjectId,
        ref: 'Category',
        required: true
    },
    subcategory: {
        type: mongoose.Schema.ObjectId, // Will point to a Subcategory within the Category
        required: false
    },
    innerSubcategory: {
        type: mongoose.Schema.ObjectId, // Will point to a NestedSubcategory within the Subcategory
        required: false
    },
    brand: {
        type: mongoose.Schema.ObjectId,
        ref: 'Brand',
        required: false
    },
    stock: {
        type: Number,
        required: [true, 'Please add a stock count'],
        default: 0
    },
    variants: [
        {
            name: { type: String, required: true }, // e.g., 'Shade', 'Size'
            value: { type: String, required: true }, // e.g., 'Red', '100ml'
            price: { type: Number, required: true }, // Retail price for variant
            discountPrice: { type: Number, default: 0 }, // Discounted price
            costPrice: { type: Number, default: 0 }, // Base unit cost
            stock: { type: Number, required: true, default: 0 },
            image: { type: String } // Variant specific image URL
        }
    ],
    isFeatured: {
        type: Boolean,
        default: false
    },
    reviews: [reviewSchema],
    rating: {
        type: Number,
        required: true,
        default: 0
    },
    numReviews: {
        type: Number,
        required: true,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Product', productSchema);
