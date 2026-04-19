import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../context/useAuthStore';
import { useConfigStore } from '../../context/useConfigStore';
import { Search, TrendingUp, TrendingDown, PhoneOff, User, DollarSign, Eye as EyeIcon, X, Wallet } from 'lucide-react';
import { toast } from 'sonner';

const CustomerCreditDashboard = () => {
    const { userInfo } = useAuthStore();
    const { config } = useConfigStore();
    const currency = config?.currencySymbol || '$';
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [showLedgerModal, setShowLedgerModal] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [paymentNote, setPaymentNote] = useState('');
    const [savingPayment, setSavingPayment] = useState(false);
    const [paymentMessage, setPaymentMessage] = useState('');

    const fetchCustomers = async () => {
        try {
            setLoading(true);
            const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
            const params = {
                search: searchTerm,
                sortBy,
                sortOrder: sortOrder === 'desc' ? 'desc' : 'asc',
            };
            const { data } = await axios.get('/api/pos/customer-accounts', { ...config, params });
            setCustomers(data || []);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching customers:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, [userInfo.token]);

    const handleSearch = (value) => {
        setSearchTerm(value);
    };

    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
        } else {
            setSortBy(field);
            setSortOrder('desc');
        }
    };

    useEffect(() => {
        if (searchTerm || sortBy !== 'createdAt' || sortOrder !== 'desc') {
            const timer = setTimeout(() => {
                fetchCustomers();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [searchTerm, sortBy, sortOrder]);

    const viewCustomerDetails = (customer) => {
        setSelectedCustomer(customer);
        setPaymentAmount(Number(customer.outstandingBalance || 0) > 0 ? Number(customer.outstandingBalance || 0).toFixed(2) : '');
        setPaymentMethod('Cash');
        setPaymentNote('');
        setPaymentMessage('');
        setShowLedgerModal(true);
    };

    const recordCustomerPayment = async () => {
        if (!selectedCustomer) {
            return;
        }

        const amount = Math.max(Number(paymentAmount) || 0, 0);
        if (amount <= 0) {
            toast.error('Enter a payment amount greater than zero.');
            return;
        }

        setSavingPayment(true);
        setPaymentMessage('');
        try {
            const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
            const { data } = await axios.post('/api/pos/customer-account/payment', {
                customerName: selectedCustomer.customerName,
                customerPhone: selectedCustomer.customerPhone,
                amount,
                paymentMethod,
                note: paymentNote,
            }, config);

            setSelectedCustomer(data);
            setPaymentAmount(Number(data.outstandingBalance || 0) > 0 ? Number(data.outstandingBalance || 0).toFixed(2) : '');
            setPaymentMessage('Payment recorded successfully.');
            toast.success('Payment recorded successfully.');
            await fetchCustomers();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to record payment');
        } finally {
            setSavingPayment(false);
        }
    };

    const formatCurrency = (amount) => {
        return `${currency}${Number(amount || 0).toFixed(2)}`;
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-PH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getLedgerTypeLabel = (type) => {
        const labels = {
            'sale': 'Sale',
            'credit-used': 'Credit Used',
            'credit-added': 'Credit Added',
            'outstanding-added': 'Outstanding Added',
            'payment-received': 'Payment Received',
            'outstanding-cleared': 'Outstanding Cleared',
        };
        return labels[type] || type;
    };

    const getLedgerTypeColor = (type) => {
        const colors = {
            'sale': 'text-primary bg-blue-100',
            'credit-used': 'text-orange-600 bg-orange-100',
            'credit-added': 'text-green-600 bg-green-100',
            'outstanding-added': 'text-red-600 bg-red-100',
            'payment-received': 'text-green-600 bg-green-100',
            'outstanding-cleared': 'text-green-600 bg-green-100',
        };
        return colors[type] || 'text-secondary bg-gray-100';
    };

    const totalCreditBalance = customers.reduce((sum, c) => sum + Number(c.creditBalance || 0), 0);
    const totalOutstandingBalance = customers.reduce((sum, c) => sum + Number(c.outstandingBalance || 0), 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-primary">Customer Credit Dashboard</h1>
                    <p className="text-secondary text-sm mt-1">Manage customer credit accounts and payment records.</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-surface rounded-2xl shadow-sm border border-default p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-secondary text-sm mb-1">Active Customers</p>
                            <p className="text-2xl font-bold text-primary">{customers.length}</p>
                        </div>
                        <User className="w-8 h-8 text-tertiary opacity-50" />
                    </div>
                </div>

                <div className="bg-surface rounded-2xl shadow-sm border border-default p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-secondary text-sm mb-1">Customer Credit (Store Owes)</p>
                            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalCreditBalance)}</p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-green-500 opacity-50" />
                    </div>
                </div>

                <div className="bg-surface rounded-2xl shadow-sm border border-default p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-secondary text-sm mb-1">Outstanding (Customer Owes)</p>
                            <p className="text-2xl font-bold text-red-600">{formatCurrency(totalOutstandingBalance)}</p>
                        </div>
                        <TrendingDown className="w-8 h-8 text-red-500 opacity-50" />
                    </div>
                </div>
            </div>

            {/* Search and Sort */}
            <div className="bg-surface rounded-2xl shadow-sm border border-default p-4">
                <div className="flex gap-4 flex-col md:flex-row md:items-center">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-3 w-5 h-5 text-tertiary" />
                        <input
                            type="text"
                            placeholder="Search by phone or name..."
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-default bg-page text-primary placeholder-tertiary focus:outline-none focus:border-brand"
                        />
                    </div>
                    <select
                        value={sortBy}
                        onChange={(e) => handleSort(e.target.value)}
                        className="px-4 py-2 rounded-lg border border-default bg-page text-primary focus:outline-none focus:border-brand"
                    >
                        <option value="createdAt">Sort by Date</option>
                        <option value="creditBalance">Sort by Credit Balance</option>
                        <option value="outstandingBalance">Sort by Outstanding Balance</option>
                        <option value="customerName">Sort by Name</option>
                    </select>
                    {sortBy !== 'createdAt' && (
                        <button
                            onClick={() => { setSortBy('createdAt'); setSortOrder('desc'); }}
                            className="px-4 py-2 rounded-lg bg-page text-tertiary hover:bg-brand hover:text-white transition-colors"
                        >
                            Clear Sort
                        </button>
                    )}
                </div>
            </div>

            {/* Customers Table */}
            <div className="bg-surface rounded-2xl shadow-sm border border-default overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-default text-sm">
                        <thead className="bg-page">
                            <tr>
                                <th className="px-6 py-4 text-left font-semibold text-secondary uppercase tracking-wider">Name</th>
                                <th className="px-6 py-4 text-left font-semibold text-secondary uppercase tracking-wider">Phone</th>
                                <th className="px-6 py-4 text-right font-semibold text-secondary uppercase tracking-wider">Credit Balance</th>
                                <th className="px-6 py-4 text-right font-semibold text-secondary uppercase tracking-wider">Outstanding</th>
                                <th className="px-6 py-4 text-center font-semibold text-secondary uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-surface divide-y divide-default">
                            {loading ? (
                                Array.from({ length: 6 }).map((_, idx) => (
                                    <tr key={`credit-customer-skeleton-${idx}`}>
                                        <td className="px-6 py-4"><div className="skeleton h-8 w-40" /></td>
                                        <td className="px-6 py-4"><div className="skeleton h-4 w-32" /></td>
                                        <td className="px-6 py-4"><div className="skeleton h-4 w-24 ml-auto" /></td>
                                        <td className="px-6 py-4"><div className="skeleton h-4 w-24 ml-auto" /></td>
                                        <td className="px-6 py-4"><div className="skeleton h-8 w-24 mx-auto" /></td>
                                    </tr>
                                ))
                            ) : customers.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-12 text-secondary">No customer credit accounts found.</td>
                                </tr>
                            ) : (
                                customers.map(customer => (
                                    <tr key={customer._id} className="hover:bg-page transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold bg-brand">
                                                    {customer.customerName.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="font-medium text-primary">{customer.customerName}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-secondary">
                                            <div className="flex items-center gap-2">
                                                <PhoneOff className="w-4 h-4 opacity-50" />
                                                {customer.customerPhone}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {Number(customer.creditBalance || 0) > 0 ? (
                                                <span className="text-green-600 font-semibold">{formatCurrency(customer.creditBalance)}</span>
                                            ) : (
                                                <span className="text-tertiary">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {Number(customer.outstandingBalance || 0) > 0 ? (
                                                <span className="text-red-600 font-semibold">{formatCurrency(customer.outstandingBalance)}</span>
                                            ) : (
                                                <span className="text-tertiary">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => viewCustomerDetails(customer)}
                                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand text-white hover:bg-opacity-90 transition-colors"
                                            >
                                                <EyeIcon className="w-4 h-4" />
                                                <span>View</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Ledger Modal */}
            {showLedgerModal && selectedCustomer && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-surface rounded-2xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-default">
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-page border-b border-default p-6 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold text-primary">{selectedCustomer.customerName}</h2>
                                <p className="text-secondary text-sm mt-1">{selectedCustomer.customerPhone}</p>
                            </div>
                            <button
                                onClick={() => setShowLedgerModal(false)}
                                className="p-2 hover:bg-surface rounded-lg transition-colors"
                            >
                                <X className="w-6 h-6 text-secondary" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 space-y-6">
                            {/* Balance Summary */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                                    <p className="text-secondary text-sm">Credit Balance (Store Owes)</p>
                                    <p className="text-2xl font-bold text-green-600 mt-1">
                                        {formatCurrency(selectedCustomer.creditBalance)}
                                    </p>
                                </div>
                                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                                    <p className="text-secondary text-sm">Outstanding Balance (Customer Owes)</p>
                                    <p className="text-2xl font-bold text-red-600 mt-1">
                                        {formatCurrency(selectedCustomer.outstandingBalance)}
                                    </p>
                                </div>
                            </div>

                            {/* Payment Collection */}
                            <div className="bg-page rounded-xl border border-default p-4 space-y-4">
                                <div className="flex items-center gap-2">
                                    <Wallet className="w-4 h-4 text-brand" />
                                    <h3 className="text-lg font-semibold text-primary">Record Customer Payment</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1">Amount</label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={paymentAmount}
                                            onChange={(e) => setPaymentAmount(e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg border border-default bg-surface text-primary focus:outline-none focus:border-brand"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1">Method</label>
                                        <select
                                            value={paymentMethod}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg border border-default bg-surface text-primary focus:outline-none focus:border-brand"
                                        >
                                            <option value="Cash">Cash</option>
                                            <option value="Bank Transfer">Bank Transfer</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1">Quick Fill</label>
                                        <button
                                            type="button"
                                            onClick={() => setPaymentAmount(Number(selectedCustomer.outstandingBalance || 0).toFixed(2))}
                                            className="w-full px-3 py-2 rounded-lg border border-default bg-surface hover:bg-brand hover:text-white transition-colors text-sm"
                                        >
                                            Pay Full Due
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1">Note</label>
                                    <input
                                        type="text"
                                        value={paymentNote}
                                        onChange={(e) => setPaymentNote(e.target.value)}
                                        placeholder="Optional note"
                                        className="w-full px-3 py-2 rounded-lg border border-default bg-surface text-primary focus:outline-none focus:border-brand"
                                    />
                                </div>

                                <div className="flex items-center gap-3 flex-wrap">
                                    <button
                                        type="button"
                                        onClick={recordCustomerPayment}
                                        disabled={savingPayment}
                                        className="px-4 py-2 rounded-lg bg-brand text-white hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {savingPayment ? 'Saving...' : 'Record Payment'}
                                    </button>
                                    {paymentMessage && <span className="text-sm text-success">{paymentMessage}</span>}
                                </div>
                            </div>

                            {/* Full Ledger */}
                            <div>
                                <h3 className="text-lg font-semibold text-primary mb-4">Transaction Ledger</h3>
                                {selectedCustomer.ledger && selectedCustomer.ledger.length > 0 ? (
                                    <div className="space-y-2">
                                        {selectedCustomer.ledger.map((entry, idx) => (
                                            <div key={idx} className="bg-page rounded-lg p-4 border border-default hover:border-brand transition-colors">
                                                <div className="flex justify-between items-start gap-4">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className={`text-xs font-semibold px-2 py-1 rounded ${getLedgerTypeColor(entry.type)}`}>
                                                                {getLedgerTypeLabel(entry.type)}
                                                            </span>
                                                            {entry.paymentMethod && (
                                                                <span className="text-xs text-tertiary bg-tertiary bg-opacity-10 px-2 py-1 rounded">
                                                                    {entry.paymentMethod}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {entry.note && (
                                                            <p className="text-secondary text-sm">{entry.note}</p>
                                                        )}
                                                        <div className="flex gap-4 mt-2 text-xs text-tertiary">
                                                            <span>{formatDate(entry.createdAt)}</span>
                                                            {entry.order && (
                                                                <span className="text-tertiary">Order: {entry.order}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="text-right font-semibold text-primary whitespace-nowrap">
                                                        {formatCurrency(entry.amount)}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-tertiary">
                                        <DollarSign className="w-12 h-12 mx-auto opacity-20 mb-2" />
                                        <p>No transactions yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="border-t border-default p-6 flex justify-end gap-3">
                            <button
                                onClick={() => setShowLedgerModal(false)}
                                className="px-4 py-2 rounded-lg bg-page text-secondary hover:bg-brand hover:text-white transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerCreditDashboard;
