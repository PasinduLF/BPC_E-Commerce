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
        return <div className="p-8 text-center text-secondary">Calculating financial ledgers...</div>;
    }

    if (!metrics) {
        return (
            <div className="p-8 text-center">
                <div className="text-error font-medium mb-4">Failed to load financial data. You may need to sign in again.</div>
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
                    <h1 className="text-2xl font-bold text-primary">Financial Ledger</h1>
                    <p className="text-secondary text-sm mt-1">Real-time balances across Cash and Bank assets.</p>
                </div>
                <button onClick={fetchBalances} className="btn-primary flex items-center gap-2">
                    <RefreshCcw size={16} /> Sync Balances
                </button>
            </div>

            {/* Core Balances */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Cash Ledger */}
                <div className="bg-surface border border-default rounded-3xl p-8 text-primary relative overflow-hidden shadow-sm">
                    <div className="absolute top-0 right-0 -mt-10 -mr-10 text-success opacity-10">
                        <Wallet size={160} />
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-secondary font-medium flex items-center gap-2 mb-2">
                            <Wallet size={20} className="text-success" /> Actual Cash in Hand
                        </h3>
                        <div className="text-5xl font-extrabold tracking-tight mb-8">
                            ${metrics.cashBalance.toFixed(2)}
                        </div>

                        <div className="bg-success-bg/50 border border-success-bg rounded-2xl p-5 backdrop-blur-sm grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-secondary text-xs font-medium uppercase tracking-wider mb-1 flex items-center gap-1"><TrendingUp size={12} className="text-success" /> Total IN</p>
                                <p className="font-bold text-xl">${metrics.cashIn.toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-secondary text-xs font-medium uppercase tracking-wider mb-1 flex items-center gap-1"><TrendingDown size={12} className="text-error" /> Total OUT</p>
                                <p className="font-bold text-xl">${metrics.cashOut.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bank Ledger */}
                <div className="bg-surface border border-default rounded-3xl p-8 text-primary relative overflow-hidden shadow-sm">
                    <div className="absolute top-0 right-0 -mt-10 -mr-10 text-brand opacity-10">
                        <Landmark size={160} />
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-secondary font-medium flex items-center gap-2 mb-2">
                            <Landmark size={20} className="text-brand" /> Total Bank Balance
                        </h3>
                        <div className="text-5xl font-extrabold tracking-tight mb-8">
                            ${metrics.bankBalance.toFixed(2)}
                        </div>

                        <div className="bg-brand-subtle/50 border border-brand-subtle rounded-2xl p-5 backdrop-blur-sm grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-secondary text-xs font-medium uppercase tracking-wider mb-1 flex items-center gap-1"><TrendingUp size={12} className="text-success" /> Total IN</p>
                                <p className="font-bold text-xl">${metrics.bankIn.toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-secondary text-xs font-medium uppercase tracking-wider mb-1 flex items-center gap-1"><TrendingDown size={12} className="text-error" /> Total OUT</p>
                                <p className="font-bold text-xl">${metrics.bankOut.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* Note on Data Calculation */}
            <div className="bg-surface p-6 rounded-2xl border border-default shadow-sm mt-8">
                <h4 className="text-sm font-bold text-primary mb-2">How this is calculated</h4>
                <p className="text-secondary text-sm leading-relaxed mb-4">
                    The numbers above are generated natively by analyzing every transaction in your system.
                    <strong> Cash IN </strong> represents all physical walk-in POS sales and "Cash on Delivery" orders that have been successfully marked as Paid.
                    <strong> Bank IN </strong> targets all online Bank Transfer orders marked as Paid.
                    The <strong>OUT</strong> values are drawn directly from the Wholesale Inventoy purchase logs based on the payment method you specified during the acquisition.
                </p>
                <div className="p-4 bg-page border border-default rounded-xl flex justify-between items-center text-sm font-medium">
                    <span className="text-primary">Total Available Net Revenue (Cash + Bank balances)</span>
                    <span className="text-xl font-bold text-brand">${metrics.totalNetRevenue.toFixed(2)}</span>
                </div>
            </div>

        </div>
    );
};

export default FinancialDashboard;
