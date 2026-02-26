import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../context/useAuthStore';
import { Plus, Trash2, ArrowUpRight, ArrowDownRight, RefreshCcw } from 'lucide-react';

const INCOME_CATEGORIES = ['Investments', 'Loan', 'Gift', 'Misc Sales', 'Other'];
const EXPENSE_CATEGORIES = ['Utilities', 'Marketing', 'Transport', 'Packaging and Labeling', 'Loan', 'Personal', 'Other'];

const IncomeExpenseManage = () => {
    const { userInfo } = useAuthStore();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Form State
    const [showForm, setShowForm] = useState(false);
    const [type, setType] = useState('Income');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [description, setDescription] = useState('');

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
            const { data } = await axios.get('http://localhost:5000/api/transactions', config);
            setTransactions(data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, [userInfo.token]);

    const submitHandler = async (e) => {
        e.preventDefault();
        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${userInfo.token}`,
                },
            };

            await axios.post(
                'http://localhost:5000/api/transactions',
                {
                    type,
                    amount: Number(amount),
                    category,
                    paymentMethod,
                    description
                },
                config
            );

            // Reset form
            setShowForm(false);
            setType('Income');
            setAmount('');
            setCategory('');
            setPaymentMethod('Cash');
            setDescription('');
            fetchTransactions();

        } catch (error) {
            alert(error.response?.data?.message || 'Failed to add transaction');
        }
    };

    const deleteHandler = async (id) => {
        if (window.confirm('Are you sure you want to delete this transaction record?')) {
            try {
                const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
                await axios.delete(`http://localhost:5000/api/transactions/${id}`, config);
                fetchTransactions();
            } catch (error) {
                alert(error.response?.data?.message || 'Failed to delete transaction');
            }
        }
    };

    const totalIncome = transactions.filter(t => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0);

    return (
        <div className="space-y-6 max-w-6xl mx-auto">

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Other Income & Expense</h1>
                    <p className="text-slate-500 text-sm mt-1">Log miscellaneous cash flow outside of standard orders and wholesale.</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={fetchTransactions} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
                        <RefreshCcw size={20} />
                    </button>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="btn-primary flex items-center gap-2"
                    >
                        {showForm ? 'Cancel Entry' : <><Plus size={18} /> Add Record</>}
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100 flex items-center gap-4">
                    <div className="p-3 bg-white text-emerald-600 rounded-xl shadow-sm"><ArrowUpRight size={24} /></div>
                    <div>
                        <p className="text-sm font-bold text-emerald-800 uppercase tracking-widest">Total Misc Income</p>
                        <p className="text-3xl font-black text-emerald-600">${totalIncome.toFixed(2)}</p>
                    </div>
                </div>
                <div className="bg-rose-50 rounded-2xl p-6 border border-rose-100 flex items-center gap-4">
                    <div className="p-3 bg-white text-rose-600 rounded-xl shadow-sm"><ArrowDownRight size={24} /></div>
                    <div>
                        <p className="text-sm font-bold text-rose-800 uppercase tracking-widest">Total Misc Expense</p>
                        <p className="text-3xl font-black text-rose-600">${totalExpense.toFixed(2)}</p>
                    </div>
                </div>
            </div>

            {/* Entry Form */}
            {showForm && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8 animate-fade-in-up">
                    <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
                        Record Transaction
                    </h2>

                    <form onSubmit={submitHandler} className="space-y-5 max-w-3xl">

                        {/* Transaction Type Toggle */}
                        <div className="flex gap-4 p-1.5 bg-slate-100 rounded-xl w-fit">
                            <button
                                type="button"
                                onClick={() => { setType('Income'); setCategory(''); }}
                                className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${type === 'Income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Income
                            </button>
                            <button
                                type="button"
                                onClick={() => { setType('Expense'); setCategory(''); }}
                                className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${type === 'Expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Expense
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Amount ($)</label>
                                <input
                                    type="number" required step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none text-slate-900 font-medium"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Category</label>
                                <select
                                    required value={category} onChange={(e) => setCategory(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none bg-white text-slate-700"
                                >
                                    <option value="">-- Select Category --</option>
                                    {type === 'Income'
                                        ? INCOME_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)
                                        : EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)
                                    }
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Payment Method</label>
                                <select
                                    required value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none bg-white text-slate-700"
                                >
                                    <option value="Cash">Cash (Physical Register)</option>
                                    <option value="Bank Transfer">Bank Transfer (Digital)</option>
                                </select>
                                <p className="text-[10px] text-slate-500 mt-1">This will affect the Financial Ledger balance directly.</p>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-slate-700 mb-1">Description (Optional)</label>
                                <input
                                    type="text" value={description} onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Details or reference ID..."
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none text-slate-700"
                                />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex justify-end">
                            <button type="submit" className={`px-8 py-2.5 text-white font-bold rounded-lg transition-all shadow-md ${type === 'Income' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}>
                                Save {type} Record
                            </button>
                        </div>

                    </form>
                </div>
            )}

            {/* History Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden text-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-4 text-left font-semibold text-slate-600 uppercase tracking-wider text-xs">Date</th>
                                <th className="px-6 py-4 text-left font-semibold text-slate-600 uppercase tracking-wider text-xs">Type & Category</th>
                                <th className="px-6 py-4 text-left font-semibold text-slate-600 uppercase tracking-wider text-xs">Description</th>
                                <th className="px-6 py-4 text-left font-semibold text-slate-600 uppercase tracking-wider text-xs">Method</th>
                                <th className="px-6 py-4 text-right font-semibold text-slate-600 uppercase tracking-wider text-xs">Amount</th>
                                <th className="px-6 py-4 text-center font-semibold text-slate-600 uppercase tracking-wider text-xs">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan="6" className="text-center py-8 text-slate-500">Loading records...</td></tr>
                            ) : transactions.length === 0 ? (
                                <tr><td colSpan="6" className="text-center py-12 text-slate-500">No transactions recorded yet.</td></tr>
                            ) : (
                                transactions.map(t => (
                                    <tr key={t._id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                                            {new Date(t.transactionDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {t.type === 'Income' ? (
                                                    <span className="p-1 bg-emerald-50 text-emerald-600 rounded"><ArrowUpRight size={14} /></span>
                                                ) : (
                                                    <span className="p-1 bg-rose-50 text-rose-600 rounded"><ArrowDownRight size={14} /></span>
                                                )}
                                                <span className="font-bold text-slate-800">{t.category}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {t.description || <span className="text-slate-300 italic">No description</span>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${t.paymentMethod === 'Cash' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {t.paymentMethod}
                                            </span>
                                        </td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-right font-black ${t.type === 'Income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {t.type === 'Income' ? '+' : '-'}${t.amount.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <button
                                                onClick={() => deleteHandler(t._id)}
                                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                title="Delete Record"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
};

export default IncomeExpenseManage;
