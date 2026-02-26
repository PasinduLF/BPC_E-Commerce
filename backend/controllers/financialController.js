const Order = require('../models/Order');
const WholesalePurchase = require('../models/WholesalePurchase');
const Transaction = require('../models/Transaction');

// @desc    Get financial ledger balances (Cash vs Bank)
// @route   GET /api/financials/balances
// @access  Private/Admin
const getFinancialBalances = async (req, res) => {
    try {
        // 1. Calculate incoming revenue from Paid Orders
        const orders = await Order.find({ isPaid: true });

        let cashIn = 0;
        let bankIn = 0;

        orders.forEach(order => {
            if (order.paymentMethod === 'Cash on Delivery' || order.paymentMethod === 'Cash') {
                cashIn += order.totalPrice;
            } else if (order.paymentMethod === 'Bank Transfer') {
                bankIn += order.totalPrice;
            }
        });

        // 2. Calculate outgoing expenses from Wholesale Purchases
        const purchases = await WholesalePurchase.find({});

        let cashOut = 0;
        let bankOut = 0;

        purchases.forEach(purchase => {
            if (purchase.paymentMethod === 'Cash') {
                cashOut += purchase.totalCost;
            } else if (purchase.paymentMethod === 'Bank Transfer') {
                bankOut += purchase.totalCost;
            }
        });

        // 3. Process Manual Income & Expenses
        const manualTransactions = await Transaction.find({});

        manualTransactions.forEach(t => {
            if (t.type === 'Income') {
                if (t.paymentMethod === 'Cash') cashIn += t.amount;
                if (t.paymentMethod === 'Bank Transfer') bankIn += t.amount;
            } else if (t.type === 'Expense') {
                if (t.paymentMethod === 'Cash') cashOut += t.amount;
                if (t.paymentMethod === 'Bank Transfer') bankOut += t.amount;
            }
        });

        // 4. Final Balances
        const cashBalance = cashIn - cashOut;
        const bankBalance = bankIn - bankOut;

        res.json({
            cashIn,
            cashOut,
            cashBalance,
            bankIn,
            bankOut,
            bankBalance,
            totalNetRevenue: cashBalance + bankBalance
        });

    } catch (error) {
        res.status(500).json({ message: error.message || 'Server Error calculating financial ledger' });
    }
};

module.exports = {
    getFinancialBalances
};
