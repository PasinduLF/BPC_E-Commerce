import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../../context/useAuthStore';
import { ShoppingCart, CheckCircle, Clock, XCircle, TrendingUp } from 'lucide-react';

const OrderManage = () => {
    const { userInfo } = useAuthStore();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
            const { data } = await axios.get('http://localhost:5000/api/orders', config);
            setOrders(data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [userInfo.token]);

    const updateDeliveryStatus = async (id, currentStatus) => {
        if (currentStatus) return; // already delivered

        try {
            const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
            await axios.put(`http://localhost:5000/api/orders/${id}/deliver`, {}, config);
            fetchOrders(); // refresh
        } catch (error) {
            alert('Failed to update delivery status');
        }
    };

    return (
        <div className="space-y-6">

            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Order Management</h1>
                    <p className="text-slate-500 text-sm mt-1">Review sales, approve payments, and dispatch items.</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden text-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-4 text-left font-semibold text-slate-600 uppercase tracking-wider">ID</th>
                                <th className="px-6 py-4 text-left font-semibold text-slate-600 uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-4 text-left font-semibold text-slate-600 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-right font-semibold text-slate-600 uppercase tracking-wider">Total Sales</th>
                                <th className="px-6 py-4 text-right font-semibold text-slate-600 uppercase tracking-wider">Est. Profit</th>
                                <th className="px-6 py-4 text-center font-semibold text-slate-600 uppercase tracking-wider">Payment</th>
                                <th className="px-6 py-4 text-center font-semibold text-slate-600 uppercase tracking-wider">Delivery</th>
                                <th className="px-6 py-4 text-center font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan="8" className="text-center py-8 text-slate-500">Loading orders...</td></tr>
                            ) : orders.length === 0 ? (
                                <tr><td colSpan="8" className="text-center py-12 text-slate-500">No orders found.</td></tr>
                            ) : (
                                orders.map(order => {
                                    // Calculate profit
                                    const totalCost = order.orderItems.reduce((acc, item) => acc + (item.costPrice * item.qty), 0);
                                    const grossProfit = order.itemsPrice - totalCost;

                                    return (
                                        <tr key={order._id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-slate-500 font-mono text-xs">
                                                ...{order._id.substring(order._id.length - 6)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-medium text-slate-900">{order.user && order.user.name}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                                                {new Date(order.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-slate-900">
                                                ${order.totalPrice.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <span className={`inline-flex items-center gap-1 font-medium ${grossProfit > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                    {grossProfit > 0 && <TrendingUp size={14} />}
                                                    ${grossProfit.toFixed(2)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {order.isPaid ? (
                                                    <span className="inline-flex items-center justify-center p-1.5 bg-emerald-100 text-emerald-600 rounded-lg" title={`Paid on ${new Date(order.paidAt).toLocaleDateString()}`}>
                                                        <CheckCircle size={18} />
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center justify-center p-1.5 bg-rose-100 text-rose-600 rounded-lg" title="Awaiting Payment">
                                                        <XCircle size={18} />
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {order.isDelivered ? (
                                                    <span className="inline-flex items-center justify-center p-1.5 bg-emerald-100 text-emerald-600 rounded-lg">
                                                        <CheckCircle size={18} />
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center justify-center p-1.5 bg-amber-100 text-amber-600 rounded-lg">
                                                        <Clock size={18} />
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                                <Link to={`/order/${order._id}`} className="text-pink-600 hover:text-pink-900 bg-pink-50 px-3 py-1.5 rounded-lg transition-colors">
                                                    Details
                                                </Link>

                                                {!order.isDelivered && (
                                                    <button
                                                        onClick={() => updateDeliveryStatus(order._id, order.isDelivered)}
                                                        className="ml-2 text-slate-600 hover:text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg transition-colors border border-slate-200"
                                                    >
                                                        Mark Dispatched
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
};

export default OrderManage;
