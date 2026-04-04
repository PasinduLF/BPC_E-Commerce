import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../../context/useAuthStore';
import { ShoppingCart, CheckCircle, Clock, XCircle, TrendingUp, Edit, Trash2 } from 'lucide-react';
import { useConfigStore } from '../../context/useConfigStore';

const OrderManage = () => {
    const { userInfo } = useAuthStore();
    const { config } = useConfigStore();
    const currency = config?.currencySymbol || '$';

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    // Edit Modal State
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingOrder, setEditingOrder] = useState(null);
    const [editFormData, setEditFormData] = useState({
        customerName: '',
        customerPhone: '',
        cashGiven: 0,
        paymentMethod: 'Cash'
    });

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
            const configHeader = { headers: { Authorization: `Bearer ${userInfo.token}` } };
            await axios.put(`http://localhost:5000/api/orders/${id}/deliver`, {}, configHeader);
            fetchOrders(); // refresh
        } catch (error) {
            alert('Failed to update delivery status');
        }
    };

    const deleteHandler = async (id) => {
        if (window.confirm('Are you sure you want to delete this order? For POS orders, stock will be refunded.')) {
            try {
                const configHeader = { headers: { Authorization: `Bearer ${userInfo.token}` } };
                await axios.delete(`http://localhost:5000/api/orders/${id}`, configHeader);
                fetchOrders();
            } catch (error) {
                alert(error.response?.data?.message || 'Failed to delete order');
            }
        }
    };

    const openEditModal = (order) => {
        setEditingOrder(order);
        setEditFormData({
            customerName: order.customerName || '',
            customerPhone: order.customerPhone || '',
            cashGiven: order.cashGiven || 0,
            paymentMethod: order.paymentMethod || 'Cash'
        });
        setEditModalOpen(true);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            const configHeader = { headers: { Authorization: `Bearer ${userInfo.token}` } };

            // Recalculate change if cash
            const change = editFormData.paymentMethod === 'Cash'
                ? (Number(editFormData.cashGiven) - editingOrder.itemsPrice)
                : 0;

            await axios.put(`http://localhost:5000/api/orders/${editingOrder._id}`, {
                ...editFormData,
                changeDue: change
            }, configHeader);

            setEditModalOpen(false);
            fetchOrders();
            alert('Order updated successfully');
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to update order');
        }
    };

    return (
        <>
            <div className="space-y-6">

                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-primary">Order Management</h1>
                        <p className="text-secondary text-sm mt-1">Review sales, approve payments, and dispatch items.</p>
                    </div>
                </div>

                <div className="bg-surface rounded-2xl shadow-sm border border-default overflow-hidden text-sm">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-default">
                            <thead className="bg-page">
                                <tr>
                                    <th className="px-6 py-4 text-left font-semibold text-secondary uppercase tracking-wider">ID</th>
                                    <th className="px-6 py-4 text-left font-semibold text-secondary uppercase tracking-wider">Customer</th>
                                    <th className="px-6 py-4 text-left font-semibold text-secondary uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-4 text-right font-semibold text-secondary uppercase tracking-wider">Total Sales</th>
                                    <th className="px-6 py-4 text-right font-semibold text-secondary uppercase tracking-wider">Est. Profit</th>
                                    <th className="px-6 py-4 text-center font-semibold text-secondary uppercase tracking-wider">Payment</th>
                                    <th className="px-6 py-4 text-center font-semibold text-secondary uppercase tracking-wider">Delivery</th>
                                    <th className="px-6 py-4 text-center font-semibold text-secondary uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-surface divide-y divide-default">
                                {loading ? (
                                    <tr><td colSpan="8" className="text-center py-8 text-secondary">Loading orders...</td></tr>
                                ) : orders.length === 0 ? (
                                    <tr><td colSpan="8" className="text-center py-12 text-secondary">No orders found.</td></tr>
                                ) : (
                                    orders.map(order => {
                                        // Calculate profit
                                        const totalCost = order.orderItems.reduce((acc, item) => acc + (item.costPrice * item.qty), 0);
                                        const grossProfit = order.itemsPrice - totalCost;

                                        return (
                                            <tr key={order._id} className="hover:bg-page transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-secondary font-mono text-xs">
                                                    ...{order._id.substring(order._id.length - 6)}
                                                    {order.isPOS && <span className="ml-2 bg-brand-subtle text-brand font-bold px-2 py-0.5 rounded text-[10px]">POS</span>}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="font-medium text-primary">
                                                        {order.isPOS ? (order.customerName || 'Walk-in') : (order.user?.name || 'Unknown')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-secondary">
                                                    {new Date(order.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-primary">
                                                    {currency}{order.totalPrice.toFixed(2)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <span className={`inline-flex items-center gap-1 font-medium ${grossProfit > 0 ? 'text-success' : 'text-tertiary'}`}>
                                                        {grossProfit > 0 && <TrendingUp size={14} />}
                                                        {currency}{grossProfit.toFixed(2)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    {order.isPaid ? (
                                                        <span className="inline-flex items-center justify-center p-1.5 bg-success-bg text-success rounded-lg" title={`Paid on ${new Date(order.paidAt).toLocaleDateString()}`}>
                                                            <CheckCircle size={18} />
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center justify-center p-1.5 bg-error-bg text-error rounded-lg" title="Awaiting Payment">
                                                            <XCircle size={18} />
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    {order.isDelivered ? (
                                                        <span className="inline-flex items-center justify-center p-1.5 bg-success-bg text-success rounded-lg">
                                                            <CheckCircle size={18} />
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center justify-center p-1.5 bg-warning-bg text-warning rounded-lg">
                                                            <Clock size={18} />
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Link to={`/order/${order._id}`} className="text-brand hover:bg-brand-subtle px-2 py-1.5 rounded-lg transition-colors border border-transparent">
                                                            Details
                                                        </Link>

                                                        {!order.isDelivered && (
                                                            <button
                                                                onClick={() => updateDeliveryStatus(order._id, order.isDelivered)}
                                                                className="text-secondary hover:bg-page px-2 py-1.5 rounded-lg transition-colors border border-default"
                                                            >
                                                                Dispatch
                                                            </button>
                                                        )}

                                                        {order.isPOS && (
                                                            <button
                                                                onClick={() => openEditModal(order)}
                                                                className="text-success hover:bg-success-bg p-1.5 rounded-lg transition-colors border border-transparent"
                                                                title="Edit POS Details"
                                                            >
                                                                <Edit size={16} />
                                                            </button>
                                                        )}

                                                        <button
                                                            onClick={() => deleteHandler(order._id)}
                                                            className="text-error hover:bg-error-bg p-1.5 rounded-lg transition-colors border border-transparent"
                                                            title="Delete Order"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
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

            {/* Edit POS Order Modal */}
            {editModalOpen && editingOrder && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up">
                        <div className="px-6 py-4 border-b border-default flex justify-between items-center bg-page">
                            <h3 className="font-bold text-primary flex items-center gap-2">
                                <Edit size={18} className="text-success" /> Edit POS Order
                            </h3>
                            <button onClick={() => setEditModalOpen(false)} className="text-tertiary hover:text-secondary transition-colors">
                                <XCircle size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-primary mb-1">Customer Name</label>
                                <input
                                    type="text"
                                    value={editFormData.customerName}
                                    onChange={(e) => setEditFormData({ ...editFormData, customerName: e.target.value })}
                                    className="w-full px-4 py-2 border border-default rounded-xl input-focus bg-page text-primary outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-primary mb-1">Customer Phone</label>
                                <input
                                    type="text"
                                    value={editFormData.customerPhone}
                                    onChange={(e) => setEditFormData({ ...editFormData, customerPhone: e.target.value })}
                                    className="w-full px-4 py-2 border border-default rounded-xl input-focus bg-page text-primary outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-primary mb-1">Payment Method</label>
                                    <select
                                        value={editFormData.paymentMethod}
                                        onChange={(e) => setEditFormData({ ...editFormData, paymentMethod: e.target.value })}
                                        className="w-full px-4 py-2 border border-default rounded-xl input-focus bg-page text-primary outline-none"
                                    >
                                        <option value="Cash">Cash</option>
                                        <option value="Bank Transfer">Bank Transfer</option>
                                    </select>
                                </div>

                                {editFormData.paymentMethod === 'Cash' && (
                                    <div>
                                        <label className="block text-sm font-medium text-primary mb-1">Cash Given</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2 text-tertiary">{currency}</span>
                                            <input
                                                type="number" step="0.01"
                                                value={editFormData.cashGiven}
                                                onChange={(e) => setEditFormData({ ...editFormData, cashGiven: e.target.value })}
                                                className="w-full pl-8 pr-4 py-2 border border-default rounded-xl input-focus bg-page text-primary outline-none"
                                                required
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 border-t border-default flex justify-end gap-3">
                                <button type="button" onClick={() => setEditModalOpen(false)} className="px-5 py-2.5 text-secondary bg-page hover:bg-surface border border-default rounded-xl font-medium transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary px-5 py-2.5 rounded-xl font-medium shadow-sm">
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default OrderManage;
