import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../context/useAuthStore';
import { useConfigStore } from '../../context/useConfigStore';
import { Users, Package, ShoppingCart, DollarSign, TrendingUp, TrendingDown, AlertTriangle, Target, Clock3 } from 'lucide-react';

const AdminDashboard = () => {
    const { userInfo } = useAuthStore();
    const { config } = useConfigStore();
    const currency = config?.currencySymbol || '$';

    const [stats, setStats] = useState({
        users: 0,
        products: 0,
        orders: 0,
        revenue: 0,
    });
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [period, setPeriod] = useState('week');
    const [revenueTarget, setRevenueTarget] = useState(5000);
    const [loading, setLoading] = useState(true);

    const DAY_MS = 24 * 60 * 60 * 1000;

    const isWithinDays = (dateValue, days) => {
        const date = new Date(dateValue);
        if (Number.isNaN(date.getTime())) return false;
        return (Date.now() - date.getTime()) / DAY_MS <= days;
    };

    const getDelta = (current, previous) => {
        if (!previous) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
    };

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };

                // In a real app, you'd likely create a specific /api/admin/stats endpoint
                // For now, we fetch everything to calculate aggregate data on client (or simulate)
                const [usersRes, productsRes, ordersRes] = await Promise.all([
                    axios.get('/api/users', config),
                    axios.get('/api/products'),
                    axios.get('/api/orders', config)
                ]);

                const totalRev = ordersRes.data.reduce((acc, order) => order.isPaid ? acc + order.totalPrice : acc, 0);
                const allProducts = productsRes.data.products?.length ? productsRes.data.products : (productsRes.data || []);

                setStats({
                    users: usersRes.data.length,
                    products: allProducts.length,
                    orders: ordersRes.data.length,
                    revenue: totalRev
                });
                setOrders(ordersRes.data || []);
                setProducts(allProducts);

                setLoading(false);
            } catch (error) {
                console.error(error);
                setLoading(false);
            }
        };

        fetchStats();
    }, [userInfo.token]);

    const periodDays = period === 'month' ? 30 : 7;

    const analytics = useMemo(() => {
        const currentOrders = orders.filter((order) => isWithinDays(order.createdAt, periodDays));
        const previousOrders = orders.filter((order) => {
            const date = new Date(order.createdAt);
            if (Number.isNaN(date.getTime())) return false;
            const age = (Date.now() - date.getTime()) / DAY_MS;
            return age > periodDays && age <= periodDays * 2;
        });

        const currentRevenue = currentOrders.reduce((acc, order) => acc + (order.isPaid ? Number(order.totalPrice || 0) : 0), 0);
        const previousRevenue = previousOrders.reduce((acc, order) => acc + (order.isPaid ? Number(order.totalPrice || 0) : 0), 0);
        const currentOrderCount = currentOrders.length;
        const previousOrderCount = previousOrders.length;

        const currentByProduct = new Map();
        const previousByProduct = new Map();
        const currentByBrand = new Map();
        const previousByBrand = new Map();

        const brandNameByProductId = new Map(
            products.map((product) => [String(product._id), product.brand?.name || 'Unbranded'])
        );

        const processOrders = (sourceOrders, productMap, brandMap) => {
            sourceOrders.forEach((order) => {
                (order.orderItems || []).forEach((item) => {
                    const qty = Number(item.qty || 0);
                    const productName = item.name || 'Unnamed Product';
                    productMap.set(productName, (productMap.get(productName) || 0) + qty);

                    const brandName = brandNameByProductId.get(String(item.product)) || 'Unbranded';
                    brandMap.set(brandName, (brandMap.get(brandName) || 0) + qty);
                });
            });
        };

        processOrders(currentOrders, currentByProduct, currentByBrand);
        processOrders(previousOrders, previousByProduct, previousByBrand);

        const topProducts = Array.from(currentByProduct.entries())
            .map(([name, qty]) => ({
                name,
                qty,
                delta: getDelta(qty, previousByProduct.get(name) || 0),
            }))
            .sort((a, b) => b.qty - a.qty)
            .slice(0, 5);

        const topBrands = Array.from(currentByBrand.entries())
            .map(([name, qty]) => ({
                name,
                qty,
                delta: getDelta(qty, previousByBrand.get(name) || 0),
            }))
            .sort((a, b) => b.qty - a.qty)
            .slice(0, 5);

        const pendingOrders = orders.filter((order) => !order.isDelivered).length;
        const lowStockProducts = products
            .filter((product) => Number(product.stock || 0) <= 5)
            .sort((a, b) => Number(a.stock || 0) - Number(b.stock || 0))
            .slice(0, 8);

        const elapsedDays = period === 'month' ? new Date().getDate() : Math.min(new Date().getDay() + 1, 7);
        const projection = elapsedDays > 0 ? (currentRevenue / elapsedDays) * periodDays : currentRevenue;

        return {
            currentRevenue,
            previousRevenue,
            revenueDelta: getDelta(currentRevenue, previousRevenue),
            currentOrderCount,
            previousOrderCount,
            orderDelta: getDelta(currentOrderCount, previousOrderCount),
            pendingOrders,
            topProducts,
            topBrands,
            lowStockProducts,
            projection,
        };
    }, [orders, periodDays, products]);

    if (loading) {
        return <div className="p-8 text-center text-secondary">Loading dashboard data...</div>;
    }

    return (
        <div className="space-y-6">

            <div>
                <h1 className="text-2xl font-bold text-primary">Dashboard Overview</h1>
                <p className="text-secondary text-sm mt-1">Welcome back, {userInfo.name}. Here's what's happening with Beauty P&C today.</p>
            </div>

            <div className="flex flex-wrap items-center gap-3 bg-surface rounded-2xl border border-default p-4">
                <div className="text-sm font-semibold text-primary">Compare Period</div>
                <button
                    type="button"
                    onClick={() => setPeriod('week')}
                    className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${period === 'week' ? 'bg-brand-subtle border-brand text-brand' : 'bg-page border-default text-secondary hover:text-brand hover:border-brand'}`}
                >
                    Week over Week
                </button>
                <button
                    type="button"
                    onClick={() => setPeriod('month')}
                    className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${period === 'month' ? 'bg-brand-subtle border-brand text-brand' : 'bg-page border-default text-secondary hover:text-brand hover:border-brand'}`}
                >
                    Month over Month
                </button>
                <div className="ml-auto flex items-center gap-2">
                    <label className="text-sm text-secondary">Revenue Target</label>
                    <input
                        type="number"
                        min="0"
                        value={revenueTarget}
                        onChange={(e) => setRevenueTarget(Number(e.target.value) || 0)}
                        className="w-32 px-3 py-1.5 border border-default rounded-lg bg-page text-primary"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

                <div className="bg-surface p-6 rounded-2xl shadow-sm border border-default flex items-center gap-4">
                    <div className="p-4 bg-brand-subtle text-brand rounded-xl"><DollarSign size={24} /></div>
                    <div>
                        <p className="text-sm font-medium text-secondary">Revenue ({periodDays}d)</p>
                        <p className="text-2xl font-bold text-primary">{currency}{analytics.currentRevenue.toFixed(2)}</p>
                        <p className={`text-xs mt-1 inline-flex items-center gap-1 ${analytics.revenueDelta >= 0 ? 'text-success' : 'text-error'}`}>
                            {analytics.revenueDelta >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            {Math.abs(analytics.revenueDelta).toFixed(1)}% vs previous
                        </p>
                    </div>
                </div>

                <div className="bg-surface p-6 rounded-2xl shadow-sm border border-default flex items-center gap-4">
                    <div className="p-4 bg-success-bg text-success rounded-xl"><ShoppingCart size={24} /></div>
                    <div>
                        <p className="text-sm font-medium text-secondary">Orders ({periodDays}d)</p>
                        <p className="text-2xl font-bold text-primary">{analytics.currentOrderCount}</p>
                        <p className={`text-xs mt-1 inline-flex items-center gap-1 ${analytics.orderDelta >= 0 ? 'text-success' : 'text-error'}`}>
                            {analytics.orderDelta >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            {Math.abs(analytics.orderDelta).toFixed(1)}% vs previous
                        </p>
                    </div>
                </div>

                <div className="bg-surface p-6 rounded-2xl shadow-sm border border-default flex items-center gap-4">
                    <div className="p-4 bg-warning-bg text-warning rounded-xl"><Package size={24} /></div>
                    <div>
                        <p className="text-sm font-medium text-secondary">Products Listed</p>
                        <p className="text-2xl font-bold text-primary">{stats.products}</p>
                        <p className="text-xs text-warning mt-1 inline-flex items-center gap-1">
                            <AlertTriangle size={12} />
                            {analytics.lowStockProducts.length} low stock alerts
                        </p>
                    </div>
                </div>

                <div className="bg-surface p-6 rounded-2xl shadow-sm border border-default flex items-center gap-4">
                    <div className="p-4 bg-page text-primary border border-default rounded-xl"><Users size={24} /></div>
                    <div>
                        <p className="text-sm font-medium text-secondary">Pending Orders</p>
                        <p className="text-2xl font-bold text-primary">{analytics.pendingOrders}</p>
                        <p className="text-xs text-tertiary mt-1">{stats.users} registered users</p>
                    </div>
                </div>

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                <div className="bg-surface p-6 rounded-2xl shadow-sm border border-default">
                    <h3 className="text-lg font-bold text-primary mb-4">Top Selling Products</h3>
                    <div className="space-y-3">
                        {analytics.topProducts.length === 0 ? (
                            <p className="text-sm text-secondary">No sales in selected period.</p>
                        ) : analytics.topProducts.map((item) => (
                            <div key={item.name} className="flex items-center justify-between bg-page rounded-xl px-4 py-3 border border-default">
                                <div>
                                    <p className="text-sm font-semibold text-primary line-clamp-1">{item.name}</p>
                                    <p className="text-xs text-tertiary">{item.qty} units sold</p>
                                </div>
                                <span className={`text-xs font-bold ${item.delta >= 0 ? 'text-success' : 'text-error'}`}>
                                    {item.delta >= 0 ? '+' : ''}{item.delta.toFixed(1)}%
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-surface p-6 rounded-2xl shadow-sm border border-default">
                    <h3 className="text-lg font-bold text-primary mb-4">Revenue Target & Forecast</h3>
                    <div className="space-y-4">
                        <div className="bg-page rounded-xl p-4 border border-default">
                            <div className="flex items-center justify-between text-sm mb-2">
                                <span className="text-secondary inline-flex items-center gap-1"><Target size={14} /> Target</span>
                                <span className="font-semibold text-primary">{currency}{Number(revenueTarget || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm mb-2">
                                <span className="text-secondary">Current</span>
                                <span className="font-semibold text-primary">{currency}{analytics.currentRevenue.toFixed(2)}</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-brand"
                                    style={{ width: `${Math.min((analytics.currentRevenue / Math.max(Number(revenueTarget || 1), 1)) * 100, 100)}%` }}
                                />
                            </div>
                        </div>

                        <div className="bg-page rounded-xl p-4 border border-default flex items-center justify-between">
                            <div>
                                <p className="text-sm text-secondary inline-flex items-center gap-1"><Clock3 size={14} /> Forecast ({periodDays}d)</p>
                                <p className="text-lg font-bold text-primary">{currency}{analytics.projection.toFixed(2)}</p>
                            </div>
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${analytics.projection >= Number(revenueTarget || 0) ? 'bg-success-bg text-success' : 'bg-warning-bg text-warning'}`}>
                                {analytics.projection >= Number(revenueTarget || 0) ? 'On Track' : 'At Risk'}
                            </span>
                        </div>

                        <div>
                            <h4 className="text-sm font-semibold text-primary mb-2">Top Brands Trend</h4>
                            <div className="space-y-2">
                                {analytics.topBrands.length === 0 ? (
                                    <p className="text-sm text-secondary">No brand movement in selected period.</p>
                                ) : analytics.topBrands.map((brand) => (
                                    <div key={brand.name} className="flex items-center justify-between text-sm bg-page rounded-lg px-3 py-2 border border-default">
                                        <span className="text-primary font-medium">{brand.name}</span>
                                        <span className={brand.delta >= 0 ? 'text-success font-semibold' : 'text-error font-semibold'}>
                                            {brand.delta >= 0 ? '+' : ''}{brand.delta.toFixed(1)}%
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-surface p-6 rounded-2xl shadow-sm border border-default">
                <h3 className="text-lg font-bold text-primary mb-4">Low Stock Alerts</h3>
                {analytics.lowStockProducts.length === 0 ? (
                    <p className="text-sm text-secondary">No low stock products right now.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        {analytics.lowStockProducts.map((product) => (
                            <div key={product._id} className="bg-page rounded-xl border border-default p-3">
                                <p className="text-sm font-semibold text-primary line-clamp-1">{product.name}</p>
                                <p className="text-xs text-tertiary mt-1">Stock: {Number(product.stock || 0)}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

        </div>
    );
};

export default AdminDashboard;
