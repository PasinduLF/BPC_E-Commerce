const Order = require('../models/Order');
const WholesalePurchase = require('../models/WholesalePurchase');
const Transaction = require('../models/Transaction');
const CustomerAccount = require('../models/CustomerAccount');

const buildDateFilter = (req) => {
    const createdAt = {};
    if (req.query.startDate) {
        const start = new Date(req.query.startDate);
        if (!Number.isNaN(start.getTime())) createdAt.$gte = start;
    }
    if (req.query.endDate) {
        const end = new Date(req.query.endDate);
        if (!Number.isNaN(end.getTime())) {
            end.setHours(23, 59, 59, 999);
            createdAt.$lte = end;
        }
    }
    return Object.keys(createdAt).length > 0 ? { createdAt } : {};
};

// @desc    Get financial ledger balances (Cash vs Bank)
// @route   GET /api/financials/balances
// @access  Private/Admin
const getFinancialBalances = async (req, res) => {
    try {
        const dateFilter = buildDateFilter(req);
        const limit = Math.min(Math.max(Number(req.query.limit) || 1000, 1), 5000);
        // 1. Calculate incoming revenue from Paid Orders
        const orders = await Order.find({ isPaid: true, ...dateFilter }).limit(limit);
        const creditOrders = await Order.find({
            isPOS: true,
            isPaid: false,
            ...dateFilter,
            $or: [
                { paymentMethod: 'Credit' },
                { outstandingAddedAmount: { $gt: 0 } },
                { appliedCreditAmount: { $gt: 0 } },
            ],
        }).limit(limit);

        let cashIn = 0;
        let bankIn = 0;
        let salesRevenue = 0;
        let costOfGoodsSold = 0;
        let creditSalesRevenue = 0;
        let creditSalesCost = 0;
        let creditOrdersCount = 0;
        let customerPaymentReceived = 0;
        let customerPaymentCount = 0;
        let totalCustomerCreditBalance = 0;
        let totalCustomerOutstandingBalance = 0;

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

        creditOrders.forEach(order => {
            creditOrdersCount += 1;
            creditSalesRevenue += Number(order.totalPrice || 0);

            if (Array.isArray(order.orderItems)) {
                order.orderItems.forEach((item) => {
                    creditSalesCost += (Number(item.costPrice) || 0) * (Number(item.qty) || 0);
                });
            }
        });

        const customerAccounts = await CustomerAccount.find({}).select('creditBalance outstandingBalance ledger');
        customerAccounts.forEach((account) => {
            totalCustomerCreditBalance += Number(account.creditBalance || 0);
            totalCustomerOutstandingBalance += Number(account.outstandingBalance || 0);

            if (!Array.isArray(account.ledger)) {
                return;
            }

            account.ledger.forEach((entry) => {
                if (entry.type === 'payment-received') {
                    const amount = Number(entry.amount || 0);
                    customerPaymentReceived += amount;
                    customerPaymentCount += 1;

                    if (entry.paymentMethod === 'Cash') {
                        cashIn += amount;
                    } else if (entry.paymentMethod === 'Bank Transfer') {
                        bankIn += amount;
                    }
                }
            });
        });

        // 2. Calculate outgoing expenses from Wholesale Purchases
        const purchases = await WholesalePurchase.find(dateFilter).limit(limit);

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
        const manualTransactions = await Transaction.find(dateFilter).limit(limit);
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
        const totalIncome = salesRevenue + creditSalesRevenue + manualIncome;
        const totalExpense = wholesaleExpense + manualExpense;
        const grossProfit = (salesRevenue + creditSalesRevenue) - (costOfGoodsSold + creditSalesCost);
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
            creditSalesRevenue,
            creditSalesCost,
            creditOrdersCount,
            customerPaymentReceived,
            customerPaymentCount,
            totalCustomerCreditBalance,
            totalCustomerOutstandingBalance,
            totalIncome,
            totalExpense,
            grossProfit,
            netProfit,
            paidOrdersCount: orders.length,
            manualTransactionsCount: manualTransactions.length,
            limit,
            dateFilter: {
                startDate: req.query.startDate || null,
                endDate: req.query.endDate || null,
            },
        });

    } catch (error) {
        res.status(500).json({ message: error.message || 'Server Error calculating financial ledger' });
    }
};

module.exports = {
    getFinancialBalances
};
