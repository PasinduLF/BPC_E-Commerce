import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../context/useAuthStore';
import { Wallet, Landmark, TrendingUp, TrendingDown, RefreshCcw } from 'lucide-react';
import { useConfigStore } from '../../context/useConfigStore';

const FinancialDashboard = () => {
    const { userInfo } = useAuthStore();
    const { config } = useConfigStore();
    const currency = config?.currencySymbol || '$';
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);

    const money = (value) => `${currency}${Number(value || 0).toFixed(2)}`;

    const fetchBalances = async () => {
        try {
            setLoading(true);
            const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
            const { data } = await axios.get('/api/financials/balances', config);
            setMetrics(data);
            setLoading(false);
        } catch (error) {
            console.error('Failed to load ledger', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        queueMicrotask(fetchBalances);
    }, [userInfo.token]);

    if (loading) {
        return (
            <div className="space-y-6 max-w-5xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                    <div className="space-y-2">
                        <div className="skeleton h-8 w-56" />
                        <div className="skeleton h-4 w-80" />
                    </div>
                    <div className="skeleton h-10 w-36" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, idx) => (
                        <div key={`financial-summary-skeleton-${idx}`} className="bg-surface border border-default rounded-2xl p-5 space-y-3">
                            <div className="skeleton h-3 w-28" />
                            <div className="skeleton h-8 w-32" />
                            <div className="skeleton h-3 w-24" />
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Array.from({ length: 2 }).map((_, idx) => (
                        <div key={`financial-panel-skeleton-${idx}`} className="bg-surface border border-default rounded-3xl p-8 space-y-3">
                            <div className="skeleton h-6 w-40" />
                            <div className="skeleton h-10 w-48" />
                            <div className="skeleton h-4 w-full" />
                            <div className="skeleton h-4 w-5/6" />
                        </div>
                    ))}
                </div>
            </div>
        );
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
                    <p className="text-secondary text-sm mt-1">Monitor income, expenses, gross profit, and net profit in real time.</p>
                </div>
                <button onClick={fetchBalances} className="btn-primary flex items-center gap-2">
                    <RefreshCcw size={16} /> Sync Balances
                </button>
            </div>

            {/* Profitability Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="bg-surface border border-default rounded-2xl p-5">
                    <p className="text-xs font-bold uppercase tracking-wider text-tertiary">Total Income</p>
                    <p className="text-2xl font-extrabold text-success mt-2">{money(metrics.totalIncome)}</p>
                    <p className="text-xs text-secondary mt-2">Sales + manual income</p>
                </div>
                <div className="bg-surface border border-default rounded-2xl p-5">
                    <p className="text-xs font-bold uppercase tracking-wider text-tertiary">Total Expense</p>
                    <p className="text-2xl font-extrabold text-error mt-2">{money(metrics.totalExpense)}</p>
                    <p className="text-xs text-secondary mt-2">Wholesale + manual expenses</p>
                </div>
                <div className="bg-surface border border-default rounded-2xl p-5">
                    <p className="text-xs font-bold uppercase tracking-wider text-tertiary">Gross Profit</p>
                    <p className={`text-2xl font-extrabold mt-2 ${metrics.grossProfit >= 0 ? 'text-success' : 'text-error'}`}>{money(metrics.grossProfit)}</p>
                    <p className="text-xs text-secondary mt-2">Sales minus COGS</p>
                </div>
                <div className="bg-surface border border-default rounded-2xl p-5">
                    <p className="text-xs font-bold uppercase tracking-wider text-tertiary">Net Profit</p>
                    <p className={`text-2xl font-extrabold mt-2 ${metrics.netProfit >= 0 ? 'text-success' : 'text-error'}`}>{money(metrics.netProfit)}</p>
                    <p className="text-xs text-secondary mt-2">Income minus all expenses</p>
                </div>
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
                        <div className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-8 break-words">
                            {money(metrics.cashBalance)}
                        </div>

                        <div className="bg-success-bg/50 border border-success-bg rounded-2xl p-5 backdrop-blur-sm grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-secondary text-xs font-medium uppercase tracking-wider mb-1 flex items-center gap-1"><TrendingUp size={12} className="text-success" /> Total IN</p>
                                <p className="font-bold text-xl">{money(metrics.cashIn)}</p>
                            </div>
                            <div>
                                <p className="text-secondary text-xs font-medium uppercase tracking-wider mb-1 flex items-center gap-1"><TrendingDown size={12} className="text-error" /> Total OUT</p>
                                <p className="font-bold text-xl">{money(metrics.cashOut)}</p>
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
                        <div className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-8 break-words">
                            {money(metrics.bankBalance)}
                        </div>

                        <div className="bg-brand-subtle/50 border border-brand-subtle rounded-2xl p-5 backdrop-blur-sm grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-secondary text-xs font-medium uppercase tracking-wider mb-1 flex items-center gap-1"><TrendingUp size={12} className="text-success" /> Total IN</p>
                                <p className="font-bold text-xl">{money(metrics.bankIn)}</p>
                            </div>
                            <div>
                                <p className="text-secondary text-xs font-medium uppercase tracking-wider mb-1 flex items-center gap-1"><TrendingDown size={12} className="text-error" /> Total OUT</p>
                                <p className="font-bold text-xl">{money(metrics.bankOut)}</p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* Credit Ledger */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="bg-surface border border-default rounded-2xl p-5">
                    <p className="text-xs font-bold uppercase tracking-wider text-tertiary">Credit Sales</p>
                    <p className="text-2xl font-extrabold text-warning mt-2">{money(metrics.creditSalesRevenue)}</p>
                    <p className="text-xs text-secondary mt-2">Unpaid POS orders</p>
                </div>
                <div className="bg-surface border border-default rounded-2xl p-5">
                    <p className="text-xs font-bold uppercase tracking-wider text-tertiary">Customer Payments</p>
                    <p className="text-2xl font-extrabold text-success mt-2">{money(metrics.customerPaymentReceived)}</p>
                    <p className="text-xs text-secondary mt-2">Payments recorded in the credit dashboard</p>
                </div>
                <div className="bg-surface border border-default rounded-2xl p-5">
                    <p className="text-xs font-bold uppercase tracking-wider text-tertiary">Accounts Receivable</p>
                    <p className="text-2xl font-extrabold text-error mt-2">{money(metrics.totalCustomerOutstandingBalance)}</p>
                    <p className="text-xs text-secondary mt-2">Customer dues still owed</p>
                </div>
                <div className="bg-surface border border-default rounded-2xl p-5">
                    <p className="text-xs font-bold uppercase tracking-wider text-tertiary">Customer Credit</p>
                    <p className="text-2xl font-extrabold text-brand mt-2">{money(metrics.totalCustomerCreditBalance)}</p>
                    <p className="text-xs text-secondary mt-2">Credit available for future orders</p>
                </div>
            </div>

            {/* Note on Data Calculation */}
            <div className="bg-surface p-6 rounded-2xl border border-default shadow-sm mt-8">
                <h4 className="text-sm font-bold text-primary mb-2">How this is calculated</h4>
                <p className="text-secondary text-sm leading-relaxed mb-4">
                    The numbers above are generated by analyzing paid orders, wholesale purchases, and manual transactions.
                    <strong> Cash IN </strong> represents all physical walk-in POS sales and "Cash on Delivery" orders that have been successfully marked as Paid.
                    <strong> Bank IN </strong> targets all online Bank Transfer orders marked as Paid.
                    The <strong>OUT</strong> values are drawn from wholesale purchases and manual expenses. Gross profit uses product cost prices from paid order items.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-4 bg-page border border-default rounded-xl flex justify-between items-center text-sm font-medium">
                        <span className="text-primary">Total Available Assets (Cash + Bank)</span>
                        <span className="text-xl font-bold text-brand">{money(metrics.totalNetRevenue)}</span>
                    </div>
                    <div className="p-4 bg-page border border-default rounded-xl flex justify-between items-center text-sm font-medium">
                        <span className="text-primary">COGS (paid + credit orders)</span>
                        <span className="text-xl font-bold text-primary">{money(metrics.costOfGoodsSold)}</span>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default FinancialDashboard;
