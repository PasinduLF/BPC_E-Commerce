const mongoose = require('mongoose');
const Counter = require('./Counter');

const orderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        unique: true,
        sparse: true,
        immutable: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: false, // Optional for POS / walk-in customers
        ref: 'User'
    },
    orderItems: [
        {
            name: { type: String, required: true },
            qty: { type: Number, required: true },
            image: { type: String, required: true },
            price: { type: Number, required: true },
            costPrice: { type: Number, required: true, default: 0 },
            variantId: { type: mongoose.Schema.ObjectId, required: false },
            variantName: { type: String, required: false },
            product: {
                type: mongoose.Schema.ObjectId,
                required: true,
                ref: 'Product'
            }
        }
    ],
    shippingAddress: {
        name: { type: String, required: true },
        address: { type: String, required: true },
        city: { type: String, required: true },
        postalCode: { type: String, required: true },
        country: { type: String, required: true },
        phone: { type: String, required: true }
    },
    paymentMethod: {
        type: String,
        required: true,
        enum: ['Cash on Delivery', 'Bank Transfer', 'Cash', 'Credit'] // 'Cash'/'Credit' used for POS physical sales
    },
    fulfillmentType: {
        type: String,
        enum: ['delivery', 'pickup'],
        default: 'delivery'
    },
    pickupStore: {
        storeName: { type: String, default: '' },
        address: { type: String, default: '' },
        city: { type: String, default: '' },
        phone: { type: String, default: '' },
        openingHours: { type: String, default: '' },
        notes: { type: String, default: '' }
    },
    isReadyForPickup: {
        type: Boolean,
        default: false
    },
    readyForPickupAt: {
        type: Date
    },
    pickedUpAt: {
        type: Date
    },
    paymentSlip: {
        public_id: { type: String },
        url: { type: String } // Cloudinary URL for bank slips
    },
    itemsPrice: {
        type: Number,
        required: true,
        default: 0.0
    },
    shippingPrice: {
        type: Number,
        required: true,
        default: 0.0
    },
    totalPrice: {
        type: Number,
        required: true,
        default: 0.0
    },
    discountType: {
        type: String,
        enum: ['none', 'percentage', 'fixed'],
        default: 'none'
    },
    discountValue: {
        type: Number,
        required: false,
        default: 0
    },
    discountAmount: {
        type: Number,
        required: false,
        default: 0
    },
    isPaid: {
        type: Boolean,
        required: true,
        default: false
    },
    paidAt: {
        type: Date
    },
    isDelivered: {
        type: Boolean,
        required: true,
        default: false
    },
    deliveredAt: {
        type: Date
    },
    isPOS: {
        type: Boolean,
        default: false // Set to true if order was created physically by admin
    },
    customerName: {
        type: String, // Optional string for POS instead of a linked User account
        required: false
    },
    customerPhone: {
        type: String, // Optional phone for POS
        required: false
    },
    cashGiven: {
        type: Number, // Amount of cash handed by customer
        required: false,
        default: 0
    },
    changeDue: {
        type: Number, // Amount of cash returned to customer
        required: false,
        default: 0
    },
    paidNowAmount: {
        type: Number,
        required: false,
        default: 0
    },
    appliedCreditAmount: {
        type: Number,
        required: false,
        default: 0
    },
    outstandingAddedAmount: {
        type: Number,
        required: false,
        default: 0
    },
    creditAddedAmount: {
        type: Number,
        required: false,
        default: 0
    },
    status: {
        type: String,
        enum: ['Pending', 'Processing', 'Payment Verified', 'Ready for Pickup', 'Shipped', 'Delivered', 'Cancelled'],
        default: 'Pending'
    }
}, {
    timestamps: true
});

orderSchema.pre('validate', async function () {
    if (!this.isNew || this.orderNumber) {
        return;
    }

    try {
        const counter = await Counter.findByIdAndUpdate(
            { _id: 'orderNumber' },
            { $inc: { seq: 1 } },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        if (!counter) {
            throw new Error('Counter initialization failed');
        }
        
        const seq = counter.seq || 0;
        if (typeof seq !== 'number' || seq <= 0) {
            throw new Error(`Invalid counter sequence: ${seq}`);
        }

        this.orderNumber = `ORD-${String(seq).padStart(6, '0')}`;
    } catch (error) {
        console.error('Order pre-validate hook error:', error.message);
        throw error;
    }
});

module.exports = mongoose.model('Order', orderSchema);
