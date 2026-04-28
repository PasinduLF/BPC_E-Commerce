/**
 * Migration Script: Generate slugs for all existing Products, Categories, Brands, and Bundles.
 * 
 * Run once after deploying the slug changes:
 *   node scripts/generateSlugs.js
 * 
 * Safe to re-run — it only updates documents that don't have a slug yet.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Brand = require('../models/Brand');
const Bundle = require('../models/Bundle');

const MONGO_URI = process.env.MONGO_URI;

async function generateSlugs() {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // --- Products ---
    const products = await Product.find({ $or: [{ slug: { $exists: false } }, { slug: null }, { slug: '' }] });
    console.log(`\n📦 Products without slugs: ${products.length}`);
    for (const product of products) {
        await product.save(); // Triggers the pre-save hook which generates the slug
        console.log(`  → ${product.name} → /${product.slug}`);
    }

    // --- Categories ---
    const categories = await Category.find({ $or: [{ slug: { $exists: false } }, { slug: null }, { slug: '' }] });
    console.log(`\n📂 Categories without slugs: ${categories.length}`);
    for (const category of categories) {
        await category.save();
        console.log(`  → ${category.name} → /${category.slug}`);
    }

    // Also update categories that have subcategories without slugs
    const allCategories = await Category.find({});
    for (const category of allCategories) {
        let needsSave = false;
        for (const sub of category.subcategories || []) {
            if (!sub.slug) {
                needsSave = true;
                break;
            }
            for (const nested of sub.nestedSubcategories || []) {
                if (!nested.slug) {
                    needsSave = true;
                    break;
                }
            }
            if (needsSave) break;
        }
        if (needsSave) {
            await category.save();
            console.log(`  → Updated subcategory slugs for: ${category.name}`);
        }
    }

    // --- Brands ---
    const brands = await Brand.find({ $or: [{ slug: { $exists: false } }, { slug: null }, { slug: '' }] });
    console.log(`\n🏷️  Brands without slugs: ${brands.length}`);
    for (const brand of brands) {
        await brand.save();
        console.log(`  → ${brand.name} → /${brand.slug}`);
    }

    // --- Bundles ---
    const bundles = await Bundle.find({ $or: [{ slug: { $exists: false } }, { slug: null }, { slug: '' }] });
    console.log(`\n🎁 Bundles without slugs: ${bundles.length}`);
    for (const bundle of bundles) {
        await bundle.save();
        console.log(`  → ${bundle.name} → /${bundle.slug}`);
    }

    console.log('\n✅ Slug generation complete!');
    await mongoose.disconnect();
    process.exit(0);
}

generateSlugs().catch((err) => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
});
