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
    contactEmail: {
        type: String,
        default: 'support@beautypnc.com'
    },
    contactPhone: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('SystemConfig', systemConfigSchema);
