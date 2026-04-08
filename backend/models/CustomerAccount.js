const mongoose = require('mongoose');

const customerLedgerSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['sale', 'credit-used', 'credit-added', 'outstanding-added', 'payment-received', 'outstanding-cleared'],
        required: true,
    },
    amount: {
        type: Number,
        required: true,
        min: 0,
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
    },
    note: {
        type: String,
        default: '',
    },
    paymentMethod: {
        type: String,
        default: '',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
}, { _id: false });

const customerAccountSchema = new mongoose.Schema({
    customerName: {
        type: String,
        required: true,
        trim: true,
    },
    customerPhone: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    creditBalance: {
        type: Number,
        default: 0,
        min: 0,
    },
    outstandingBalance: {
        type: Number,
        default: 0,
        min: 0,
    },
    ledger: [customerLedgerSchema],
}, {
    timestamps: true,
});

module.exports = mongoose.model('CustomerAccount', customerAccountSchema);
