const mongoose = require('mongoose');
const slugify = require('../utils/slugify');

const bundleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a bundle name'],
        trim: true,
    },
    slug: {
        type: String,
        unique: true,
        index: true,
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

// Auto-generate unique slug from bundle name before saving
bundleSchema.pre('save', async function () {
    if (!this.isModified('name') && this.slug) return;

    let baseSlug = slugify(this.name);
    if (!baseSlug) baseSlug = 'bundle';

    let slug = baseSlug;
    let counter = 1;
    while (true) {
        const existing = await mongoose.model('Bundle').findOne({ slug, _id: { $ne: this._id } });
        if (!existing) break;
        slug = `${baseSlug}-${counter}`;
        counter++;
    }
    this.slug = slug;
});

module.exports = mongoose.model('Bundle', bundleSchema);
