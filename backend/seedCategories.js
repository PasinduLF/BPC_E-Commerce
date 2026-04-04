const mongoose = require('mongoose');
const Category = require('./models/Category');
require('dotenv').config();

const categories = [
  {
    name: "Makeup",
    description: "All makeup products",
    subcategories: [
      { name: "Face", description: "Foundation, Concealer, BB/CC Creams, Primer, Compact Powder" },
      { name: "Eyes", description: "Eyeliner, Mascara, Eyeshadow Palettes, Kajal, Eyebrow Pencils" },
      { name: "Lips", description: "Lipsticks (Matte, Liquid, Gloss), Lip Liners, Lip Balms" },
      { name: "Nails", description: "Nail Polish, Nail Art Tools, Polish Removers" }
    ]
  },
  {
    name: "Skincare",
    description: "Skincare products",
    subcategories: [
      { name: "Cleansers", description: "Face Wash, Scrubs, Makeup Removers, Toners" },
      { name: "Moisturizers", description: "Day/Night Creams, Serums, Face Oils, Sunscreens" },
      { name: "Treatments", description: "Acne Care, Anti-Aging, Eye Creams, Sheet Masks" },
      { name: "Body Care", description: "Body Lotions, Shower Gels, Body Butters" }
    ]
  },
  {
    name: "Haircare",
    description: "Haircare products",
    subcategories: [
      { name: "Wash & Care", description: "Shampoos, Conditioners, Hair Masks" },
      { name: "Treatments", description: "Hair Oils, Anti-Dandruff Solutions, Hair Serums/Tonics" },
      { name: "Styling", description: "Gels, Sprays, Heat Protectors" },
      { name: "Accessories", description: "Combs, Brushes, Hair Ties" }
    ]
  },
  {
    name: "Fragrances",
    description: "Fragrances and perfumes",
    subcategories: [
      { name: "Women’s Perfumes", description: "Eau de Parfum (EDP), Eau de Toilette (EDT)" },
      { name: "Men’s Colognes", description: "Aftershaves, Body Sprays, Deodorants" },
      { name: "Body Mists", description: "Lightweight floral and fruity sprays" },
      { name: "Gift Sets", description: "Combined perfume and lotion packs" }
    ]
  },
  {
    name: "Jewelry",
    description: "Imitation & Fashion Jewelry",
    subcategories: [
      { name: "Necklaces", description: "Pendants, Chokers, Statement Pieces" },
      { name: "Earrings", description: "Studs, Hoops, Jhumkas, Dangles" },
      { name: "Hands & Arms", description: "Bangles, Bracelets, Rings" },
      { name: "Sets", description: "Matching necklace and earring sets for weddings or parties" }
    ]
  },
  {
    name: "Tools & Accessories",
    description: "Tools & Accessories",
    subcategories: [
      { name: "Brushes", description: "Makeup Brush Sets, Blenders, Sponges" },
      { name: "Vanity", description: "Cosmetic Bags, Mirrors, Organizers" }
    ]
  }
];

const seedCategories = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected ✅');

        for (let cat of categories) {
            await Category.findOneAndUpdate(
                { name: cat.name },
                { $set: cat },
                { upsert: true, new: true }
            );
        }

        console.log('Categories seeded successfully! 🎉');
        process.exit();
    } catch (error) {
        console.error('Error seeding categories:');
        console.error(error);
        process.exit(1);
    }
};

seedCategories();
