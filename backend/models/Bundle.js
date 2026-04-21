const mongoose = require('mongoose');

const bundleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a bundle name'],
        trim: true,
    },
    description: {
        type: String,
        default: ''
    },
    image: {
        public_id: { type: String, default: '' },
        url: { type: String, default: '' } // Cloudinary URL
    },
    products: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
                required: true
            },
            variantId: {
                type: mongoose.Schema.Types.ObjectId,
                required: false,
            },
            variantName: {
                type: String,
                default: '',
            },
            qty: {
                type: Number,
                required: true,
                default: 1,
                min: 1
            }
        }
    ],
    bundlePrice: {
        type: Number,
        required: [true, 'Please add a bundle price'],
        min: 0
    },
    originalPrice: {
        type: Number,
        default: 0 // Admin-set or auto-calculated sum of individual prices
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isFeatured: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Bundle', bundleSchema);
