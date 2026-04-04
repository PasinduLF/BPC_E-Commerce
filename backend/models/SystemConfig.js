const mongoose = require('mongoose');

const systemConfigSchema = new mongoose.Schema({
    businessName: {
        type: String,
        required: true,
        default: 'Beauty P&C'
    },
    currencySymbol: {
        type: String,
        required: true,
        default: '$'
    },
    taxRate: {
        type: Number,
        required: true,
        default: 0
    },
    shippingFee: {
        type: Number,
        required: true,
        default: 0
    },
    freeShippingThreshold: {
        type: Number,
        required: true,
        default: 0
    },
    codDeliveryCharge: {
        type: Number,
        default: 0
    },
    bankDetails: [
        {
            bankName: { type: String, required: true },
            accountName: { type: String, required: true },
            accountNumber: { type: String, required: true },
            branch: { type: String, required: true }
        }
    ],
    contactEmail: {
        type: String,
        default: 'support@beautypnc.com'
    },
    contactPhone: {
        type: String,
        default: ''
    },
    storefrontAppearance: {
        heroTitle: {
            type: String,
            default: 'Discover Your \n True Radiance'
        },
        heroSubtitle: {
            type: String,
            default: 'Premium cosmetics curated for your skin. Experience the perfect blend of natural ingredients and modern beauty science.'
        },
        heroHighlight: {
            type: String,
            default: 'NEW COLLECTION'
        },
        heroImage: {
            url: { type: String, default: '' },
            public_id: { type: String, default: '' }
        }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('SystemConfig', systemConfigSchema);
