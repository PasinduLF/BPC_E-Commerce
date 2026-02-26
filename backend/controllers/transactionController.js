const Transaction = require('../models/Transaction');

// @desc    Create a new manual transaction (Income/Expense)
// @route   POST /api/transactions
// @access  Private/Admin
const createTransaction = async (req, res) => {
    try {
        const { type, amount, category, paymentMethod, description, transactionDate } = req.body;

        const transaction = await Transaction.create({
            adminUser: req.user._id,
            type,
            amount,
            category,
            paymentMethod,
            description,
            transactionDate: transactionDate || Date.now()
        });

        res.status(201).json(transaction);
    } catch (error) {
        res.status(500).json({ message: error.message || 'Error saving transaction' });
    }
};

// @desc    Get all manual transactions
// @route   GET /api/transactions
// @access  Private/Admin
const getTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find({})
            .populate('adminUser', 'name')
            .sort({ transactionDate: -1 });

        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching transactions' });
    }
};

// @desc    Delete a transaction
// @route   DELETE /api/transactions/:id
// @access  Private/Admin
const deleteTransaction = async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id);

        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        await transaction.deleteOne();
        res.json({ message: 'Transaction removed' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting transaction' });
    }
};

module.exports = {
    createTransaction,
    getTransactions,
    deleteTransaction
};
