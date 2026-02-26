const mongoose = require('mongoose');

const wholesalePurchaseSchema = new mongoose.Schema({
    adminUser: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    supplierName: {
        type: String,
        required: [true, 'Please add a supplier name'],
        trim: true,
    },
    items: [
        {
            product: {
                type: mongoose.Schema.ObjectId,
                ref: 'Product',
                required: true
            },
            variantId: {
                type: mongoose.Schema.ObjectId, // Optional reference to a specific variant
                required: false
            },
            variantName: {
                type: String, // E.g. "Red - 50ml" for historical context
                required: false
            },
            quantityReceived: {
                type: Number,
                required: true,
                min: 1
            },
            unitCost: {
                type: Number,
                required: true
            },
            itemTotalCost: {
                type: Number,
                required: true
            }
        }
    ],
    totalCost: { // Grand total of the entire purchase invoice
        type: Number,
        required: true
    },
    paymentMethod: {
        type: String,
        required: [true, 'Please select a payment method'],
        enum: ['Cash', 'Bank Transfer']
    },
    purchaseDate: {
        type: Date,
        default: Date.now
    },
    notes: {
        type: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('WholesalePurchase', wholesalePurchaseSchema);
