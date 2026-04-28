const mongoose = require('mongoose');
const slugify = require('../utils/slugify');

const brandSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a brand name'],
        unique: true,
        trim: true,
    },
    slug: {
        type: String,
        unique: true,
        index: true,
    },
    description: String,
    image: String, // Cloudinary URL (Optional)
}, {
    timestamps: true
});

// Auto-generate unique slug from brand name before saving
brandSchema.pre('save', async function () {
    if (!this.isModified('name') && this.slug) return;

    let baseSlug = slugify(this.name);
    if (!baseSlug) baseSlug = 'brand';

    let slug = baseSlug;
    let counter = 1;
    while (true) {
        const existing = await mongoose.model('Brand').findOne({ slug, _id: { $ne: this._id } });
        if (!existing) break;
        slug = `${baseSlug}-${counter}`;
        counter++;
    }
    this.slug = slug;
});

module.exports = mongoose.model('Brand', brandSchema);
