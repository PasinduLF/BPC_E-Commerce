import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../context/useAuthStore';
import { Users, Package, ShoppingCart, DollarSign } from 'lucide-react';

const AdminDashboard = () => {
    const { userInfo } = useAuthStore();

    const [stats, setStats] = useState({
        users: 0,
        products: 0,
        orders: 0,
        revenue: 0,
    });
    const [loading, setLoading] = useState(true);

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

                setStats({
                    users: usersRes.data.length,
                    products: productsRes.data.products?.length || productsRes.data.length,
                    orders: ordersRes.data.length,
                    revenue: totalRev
                });

                setLoading(false);
            } catch (error) {
                console.error(error);
                setLoading(false);
            }
        };

        fetchStats();
    }, [userInfo.token]);

    if (loading) {
        return <div className="p-8 text-center text-secondary">Loading dashboard data...</div>;
    }

    return (
        <div className="space-y-6">

            <div>
                <h1 className="text-2xl font-bold text-primary">Dashboard Overview</h1>
                <p className="text-secondary text-sm mt-1">Welcome back, {userInfo.name}. Here's what's happening with Beauty P&C today.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

                <div className="bg-surface p-6 rounded-2xl shadow-sm border border-default flex items-center gap-4">
                    <div className="p-4 bg-brand-subtle text-brand rounded-xl"><DollarSign size={24} /></div>
                    <div>
                        <p className="text-sm font-medium text-secondary">Total Revenue</p>
                        <p className="text-2xl font-bold text-primary">${stats.revenue.toFixed(2)}</p>
                    </div>
                </div>

                <div className="bg-surface p-6 rounded-2xl shadow-sm border border-default flex items-center gap-4">
                    <div className="p-4 bg-success-bg text-success rounded-xl"><ShoppingCart size={24} /></div>
                    <div>
                        <p className="text-sm font-medium text-secondary">Total Orders</p>
                        <p className="text-2xl font-bold text-primary">{stats.orders}</p>
                    </div>
                </div>

                <div className="bg-surface p-6 rounded-2xl shadow-sm border border-default flex items-center gap-4">
                    <div className="p-4 bg-warning-bg text-warning rounded-xl"><Package size={24} /></div>
                    <div>
                        <p className="text-sm font-medium text-secondary">Products Listed</p>
                        <p className="text-2xl font-bold text-primary">{stats.products}</p>
                    </div>
                </div>

                <div className="bg-surface p-6 rounded-2xl shadow-sm border border-default flex items-center gap-4">
                    <div className="p-4 bg-page text-primary border border-default rounded-xl"><Users size={24} /></div>
                    <div>
                        <p className="text-sm font-medium text-secondary">Registered Users</p>
                        <p className="text-2xl font-bold text-primary">{stats.users}</p>
                    </div>
                </div>

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                <div className="bg-surface p-6 rounded-2xl shadow-sm border border-default">
                    <h3 className="text-lg font-bold text-primary mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                        <button className="w-full text-left px-4 py-3 bg-page hover:bg-brand-subtle text-primary hover:text-brand rounded-xl transition-colors text-sm font-medium border border-transparent hover:border-brand-subtle">
                            + Add New Product
                        </button>
                        <button className="w-full text-left px-4 py-3 bg-page hover:bg-brand-subtle text-primary hover:text-brand rounded-xl transition-colors text-sm font-medium border border-transparent hover:border-brand-subtle">
                            + Log Wholesale Purchase
                        </button>
                        <button className="w-full text-left px-4 py-3 bg-page hover:bg-brand-subtle text-primary hover:text-brand rounded-xl transition-colors text-sm font-medium border border-transparent hover:border-brand-subtle">
                            + Review Pending Orders
                        </button>
                    </div>
                </div>

                <div className="bg-surface p-6 rounded-2xl shadow-sm border border-default flex flex-col items-center justify-center text-center">
                    <div className="w-24 h-24 bg-brand-subtle rounded-full flex items-center justify-center mb-4">
                        <span className="text-brand font-bold text-3xl">B&C</span>
                    </div>
                    <h3 className="text-lg font-bold text-primary">Beauty P&C Analytics</h3>
                    <p className="text-sm text-secondary mt-2 max-w-sm">Detailed charts and gross profit mapping will be imported here in the next software update.</p>
                </div>
            </div>

        </div>
    );
};

export default AdminDashboard;
