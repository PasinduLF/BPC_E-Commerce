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
        let salesRevenue = 0;
        let costOfGoodsSold = 0;

        orders.forEach(order => {
            salesRevenue += order.totalPrice;

            if (order.paymentMethod === 'Cash on Delivery' || order.paymentMethod === 'Cash') {
                cashIn += order.totalPrice;
            } else if (order.paymentMethod === 'Bank Transfer') {
                bankIn += order.totalPrice;
            }

            if (Array.isArray(order.orderItems)) {
                order.orderItems.forEach((item) => {
                    costOfGoodsSold += (Number(item.costPrice) || 0) * (Number(item.qty) || 0);
                });
            }
        });

        // 2. Calculate outgoing expenses from Wholesale Purchases
        const purchases = await WholesalePurchase.find({});

        let cashOut = 0;
        let bankOut = 0;
        let wholesaleExpense = 0;

        purchases.forEach(purchase => {
            wholesaleExpense += purchase.totalCost;

            if (purchase.paymentMethod === 'Cash') {
                cashOut += purchase.totalCost;
            } else if (purchase.paymentMethod === 'Bank Transfer') {
                bankOut += purchase.totalCost;
            }
        });

        // 3. Process Manual Income & Expenses
        const manualTransactions = await Transaction.find({});
        let manualIncome = 0;
        let manualExpense = 0;

        manualTransactions.forEach(t => {
            if (t.type === 'Income') {
                manualIncome += t.amount;
                if (t.paymentMethod === 'Cash') cashIn += t.amount;
                if (t.paymentMethod === 'Bank Transfer') bankIn += t.amount;
            } else if (t.type === 'Expense') {
                manualExpense += t.amount;
                if (t.paymentMethod === 'Cash') cashOut += t.amount;
                if (t.paymentMethod === 'Bank Transfer') bankOut += t.amount;
            }
        });

        // 4. Final Balances
        const cashBalance = cashIn - cashOut;
        const bankBalance = bankIn - bankOut;
        const totalIncome = salesRevenue + manualIncome;
        const totalExpense = wholesaleExpense + manualExpense;
        const grossProfit = salesRevenue - costOfGoodsSold;
        const netProfit = totalIncome - totalExpense;
        const totalAssets = cashBalance + bankBalance;

        res.json({
            cashIn,
            cashOut,
            cashBalance,
            bankIn,
            bankOut,
            bankBalance,
            totalNetRevenue: totalAssets,
            salesRevenue,
            costOfGoodsSold,
            wholesaleExpense,
            manualIncome,
            manualExpense,
            totalIncome,
            totalExpense,
            grossProfit,
            netProfit,
            paidOrdersCount: orders.length,
            manualTransactionsCount: manualTransactions.length
        });

    } catch (error) {
        res.status(500).json({ message: error.message || 'Server Error calculating financial ledger' });
    }
};

module.exports = {
    getFinancialBalances
};
