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
                    axios.get('http://localhost:5000/api/users', config),
                    axios.get('http://localhost:5000/api/products'),
                    axios.get('http://localhost:5000/api/orders', config)
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
        return <div className="p-8 text-center text-slate-500">Loading dashboard data...</div>;
    }

    return (
        <div className="space-y-6">

            <div>
                <h1 className="text-2xl font-bold text-slate-800">Dashboard Overview</h1>
                <p className="text-slate-500 text-sm mt-1">Welcome back, {userInfo.name}. Here's what's happening with Beauty P&C today.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-4 bg-pink-50 text-pink-600 rounded-xl"><DollarSign size={24} /></div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Total Revenue</p>
                        <p className="text-2xl font-bold text-slate-800">${stats.revenue.toFixed(2)}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-4 bg-emerald-50 text-emerald-600 rounded-xl"><ShoppingCart size={24} /></div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Total Orders</p>
                        <p className="text-2xl font-bold text-slate-800">{stats.orders}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-4 bg-amber-50 text-amber-600 rounded-xl"><Package size={24} /></div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Products Listed</p>
                        <p className="text-2xl font-bold text-slate-800">{stats.products}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-4 bg-indigo-50 text-indigo-600 rounded-xl"><Users size={24} /></div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Registered Users</p>
                        <p className="text-2xl font-bold text-slate-800">{stats.users}</p>
                    </div>
                </div>

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                        <button className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-pink-50 text-slate-700 hover:text-pink-600 rounded-xl transition-colors text-sm font-medium border border-transparent hover:border-pink-100">
                            + Add New Product
                        </button>
                        <button className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-pink-50 text-slate-700 hover:text-pink-600 rounded-xl transition-colors text-sm font-medium border border-transparent hover:border-pink-100">
                            + Log Wholesale Purchase
                        </button>
                        <button className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-pink-50 text-slate-700 hover:text-pink-600 rounded-xl transition-colors text-sm font-medium border border-transparent hover:border-pink-100">
                            + Review Pending Orders
                        </button>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
                    <div className="w-24 h-24 bg-pink-50 rounded-full flex items-center justify-center mb-4">
                        <span className="text-pink-600 font-bold text-3xl">B&C</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">Beauty P&C Analytics</h3>
                    <p className="text-sm text-slate-500 mt-2 max-w-sm">Detailed charts and gross profit mapping will be imported here in the next software update.</p>
                </div>
            </div>

        </div>
    );
};

export default AdminDashboard;
