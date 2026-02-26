const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    adminUser: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        required: [true, 'Please specify transaction type'],
        enum: ['Income', 'Expense']
    },
    amount: {
        type: Number,
        required: [true, 'Please add the transaction amount'],
        min: [0, 'Amount must be a positive number']
    },
    category: {
        type: String,
        required: [true, 'Please select a category']
    },
    paymentMethod: {
        type: String,
        required: [true, 'Please specify payment method'],
        enum: ['Cash', 'Bank Transfer']
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    transactionDate: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Transaction', transactionSchema);
