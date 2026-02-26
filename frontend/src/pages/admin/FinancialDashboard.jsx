import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../context/useAuthStore';
import { Wallet, Landmark, TrendingUp, TrendingDown, RefreshCcw } from 'lucide-react';

const FinancialDashboard = () => {
    const { userInfo } = useAuthStore();
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchBalances = async () => {
        try {
            setLoading(true);
            const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
            const { data } = await axios.get('http://localhost:5000/api/financials/balances', config);
            setMetrics(data);
            setLoading(false);
        } catch (error) {
            console.error('Failed to load ledger', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBalances();
    }, [userInfo.token]);

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Calculating financial ledgers...</div>;
    }

    if (!metrics) {
        return (
            <div className="p-8 text-center">
                <div className="text-red-500 font-medium mb-4">Failed to load financial data. You may need to sign in again.</div>
                <button onClick={fetchBalances} className="btn-primary flex items-center gap-2 mx-auto">
                    <RefreshCcw size={16} /> Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">

            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Financial Ledger</h1>
                    <p className="text-slate-500 text-sm mt-1">Real-time balances across Cash and Bank assets.</p>
                </div>
                <button onClick={fetchBalances} className="btn-primary bg-slate-800 hover:bg-slate-900 flex items-center gap-2">
                    <RefreshCcw size={16} /> Sync Balances
                </button>
            </div>

            {/* Core Balances */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Cash Ledger */}
                <div className="bg-emerald-600 rounded-3xl p-8 text-white relative overflow-hidden shadow-lg shadow-emerald-200">
                    <div className="absolute top-0 right-0 -mt-10 -mr-10 text-emerald-500 opacity-20">
                        <Wallet size={160} />
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-emerald-100 font-medium flex items-center gap-2 mb-2">
                            <Wallet size={20} /> Actual Cash in Hand
                        </h3>
                        <div className="text-5xl font-extrabold tracking-tight mb-8">
                            ${metrics.cashBalance.toFixed(2)}
                        </div>

                        <div className="bg-emerald-800/40 rounded-2xl p-5 backdrop-blur-sm grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-emerald-200 text-xs font-medium uppercase tracking-wider mb-1 flex items-center gap-1"><TrendingUp size={12} /> Total IN</p>
                                <p className="font-bold text-xl">${metrics.cashIn.toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-emerald-200 text-xs font-medium uppercase tracking-wider mb-1 flex items-center gap-1"><TrendingDown size={12} /> Total OUT</p>
                                <p className="font-bold text-xl">${metrics.cashOut.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bank Ledger */}
                <div className="bg-blue-600 rounded-3xl p-8 text-white relative overflow-hidden shadow-lg shadow-blue-200">
                    <div className="absolute top-0 right-0 -mt-10 -mr-10 text-blue-500 opacity-20">
                        <Landmark size={160} />
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-blue-100 font-medium flex items-center gap-2 mb-2">
                            <Landmark size={20} /> Total Bank Balance
                        </h3>
                        <div className="text-5xl font-extrabold tracking-tight mb-8">
                            ${metrics.bankBalance.toFixed(2)}
                        </div>

                        <div className="bg-blue-800/40 rounded-2xl p-5 backdrop-blur-sm grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-blue-200 text-xs font-medium uppercase tracking-wider mb-1 flex items-center gap-1"><TrendingUp size={12} /> Total IN</p>
                                <p className="font-bold text-xl">${metrics.bankIn.toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-blue-200 text-xs font-medium uppercase tracking-wider mb-1 flex items-center gap-1"><TrendingDown size={12} /> Total OUT</p>
                                <p className="font-bold text-xl">${metrics.bankOut.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* Note on Data Calculation */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm mt-8">
                <h4 className="text-sm font-bold text-slate-800 mb-2">How this is calculated</h4>
                <p className="text-slate-500 text-sm leading-relaxed mb-4">
                    The numbers above are generated natively by analyzing every transaction in your system.
                    <strong> Cash IN </strong> represents all physical walk-in POS sales and "Cash on Delivery" orders that have been successfully marked as Paid.
                    <strong> Bank IN </strong> targets all online Bank Transfer orders marked as Paid.
                    The <strong>OUT</strong> values are drawn directly from the Wholesale Inventoy purchase logs based on the payment method you specified during the acquisition.
                </p>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center text-sm font-medium">
                    <span className="text-slate-600">Total Available Net Revenue (Cash + Bank balances)</span>
                    <span className="text-xl font-bold text-pink-600">${metrics.totalNetRevenue.toFixed(2)}</span>
                </div>
            </div>

        </div>
    );
};

export default FinancialDashboard;
