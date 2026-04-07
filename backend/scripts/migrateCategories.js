const mongoose = require('mongoose');
const Category = require('../models/Category');
require('dotenv').config({ path: 'C:/Users/pasin/Documents/Project/BPC E-Commerce/backend/.env' });

const migrateCategories = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/beauty-pc');
        console.log('MongoDB Connected for migration ✅');

        const categories = await Category.find({});

        for (let cat of categories) {
            let catChanged = false;
            for (let sub of cat.subcategories) {
                // If nestedSubcategories is empty and description looks like a list
                if (sub.nestedSubcategories.length === 0 && sub.description && sub.description.includes(',')) {
                    const items = sub.description.split(',').map(item => ({
                        name: item.trim(),
                        description: ''
                    }));
                    
                    if (items.length > 0) {
                        sub.nestedSubcategories = items;
                        catChanged = true;
                        console.log(`Migrated subcategory: ${sub.name} in ${cat.name}`);
                    }
                }
            }
            if (catChanged) {
                await cat.save();
            }
        }

        console.log('Migration completed successfully! 🎉');
        process.exit();
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrateCategories();
