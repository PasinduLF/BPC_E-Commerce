const mongoose = require('mongoose');
const slugify = require('../utils/slugify');

const subcategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a subcategory name'],
        trim: true,
    },
    slug: {
        type: String,
    },
    description: String,
    nestedSubcategories: [{
        name: { type: String, required: true },
        slug: { type: String },
        description: String
    }]
});

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a category name'],
        unique: true,
        trim: true,
    },
    slug: {
        type: String,
        unique: true,
        index: true,
    },
    description: String,
    image: String, // Cloudinary URL
    subcategories: [subcategorySchema]
}, {
    timestamps: true
});

// Auto-generate unique slug from category name before saving
categorySchema.pre('save', async function () {
    if (!this.isModified('name') && this.slug) return;

    let baseSlug = slugify(this.name);
    if (!baseSlug) baseSlug = 'category';

    let slug = baseSlug;
    let counter = 1;
    while (true) {
        const existing = await mongoose.model('Category').findOne({ slug, _id: { $ne: this._id } });
        if (!existing) break;
        slug = `${baseSlug}-${counter}`;
        counter++;
    }
    this.slug = slug;

    // Also generate slugs for subcategories and nested subcategories
    if (this.subcategories) {
        for (const sub of this.subcategories) {
            if (!sub.slug || this.isModified(`subcategories`)) {
                sub.slug = slugify(sub.name) || 'subcategory';
            }
            if (sub.nestedSubcategories) {
                for (const nested of sub.nestedSubcategories) {
                    if (!nested.slug) {
                        nested.slug = slugify(nested.name) || 'nested';
                    }
                }
            }
        }
    }
});

module.exports = mongoose.model('Category', categorySchema);
