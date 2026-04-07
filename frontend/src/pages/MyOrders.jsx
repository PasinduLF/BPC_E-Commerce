import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../context/useAuthStore';
import { Package, Clock, CheckCircle, TrendingUp, XCircle, Search } from 'lucide-react';
import { useConfigStore } from '../context/useConfigStore';

const MyOrders = () => {
    const { userInfo } = useAuthStore();
    const { config } = useConfigStore();
    const currency = config?.currencySymbol || '$';
    const navigate = useNavigate();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userInfo) {
            navigate('/login');
            return;
        }

        const fetchMyOrders = async () => {
            try {
                const reqConfig = {
                    headers: {
                        Authorization: `Bearer ${userInfo.token}`,
                    },
                };
                const { data } = await axios.get('http://localhost:5000/api/orders/myorders', reqConfig);
                // Sort by newest first
                setOrders(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
                setLoading(false);
            } catch (error) {
                console.error('Error fetching orders:', error);
                setLoading(false);
            }
        };

        fetchMyOrders();
    }, [userInfo, navigate]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-page">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
            </div>
        );
    }

    return (
        <div className="bg-page min-h-screen py-12 animate-fade-in">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-brand-subtle text-brand rounded-xl">
                        <Package size={28} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold text-primary tracking-tight">My Orders</h1>
                        <p className="text-secondary mt-1">Track, manage, and review your purchases.</p>
                    </div>
                </div>

                {orders.length === 0 ? (
                    <div className="bg-surface rounded-2xl shadow-sm border border-default p-12 text-center animate-slide-up">
                        <div className="w-20 h-20 bg-page rounded-full flex items-center justify-center mx-auto mb-4 border border-default">
                            <Package size={32} className="text-tertiary" />
                        </div>
                        <h2 className="text-xl font-bold text-primary mb-2">No orders yet</h2>
                        <p className="text-secondary mb-6">Looks like you haven't made any purchases with us yet.</p>
                        <Link to="/shop" className="btn-primary px-8 py-3 inline-flex items-center gap-2">
                            <Search size={18} /> Start Shopping
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {orders.map((order) => (
                            <div key={order._id} className="bg-surface rounded-2xl shadow-sm border border-default overflow-hidden hover:border-brand-subtle transition-colors">
                                <div className="p-6 border-b border-default bg-muted/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="grid grid-cols-2 md:flex md:gap-8 gap-4 text-sm">
                                        <div>
                                            <p className="text-secondary mb-1">Order Placed</p>
                                            <p className="font-semibold text-primary">{new Date(order.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-secondary mb-1">Total Amount</p>
                                            <p className="font-bold text-brand">{currency}{order.totalPrice.toFixed(2)}</p>
                                        </div>
                                        <div>
                                            <p className="text-secondary mb-1">Order Status</p>
                                            <p className="font-semibold text-primary">{order.status || 'Pending'}</p>
                                        </div>
                                        <div className="col-span-2 md:col-span-1">
                                            <p className="text-secondary mb-1">Order ID</p>
                                            <p className="font-mono text-primary">#{order._id}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <Link
                                            to={`/order/${order._id}`}
                                            className="px-5 py-2.5 bg-surface border border-default text-primary hover:text-brand hover:border-brand-subtle rounded-xl text-sm font-semibold transition-all shadow-sm flex-1 md:flex-none text-center"
                                        >
                                            View Details
                                        </Link>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="flex flex-wrap gap-4 items-center">
                                            {/* Delivery Status Tag */}
                                            {order.isDelivered ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success-bg text-success text-sm font-medium border border-success-bg">
                                                    <CheckCircle size={16} /> Delivered
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-warning-bg text-warning text-sm font-medium border border-warning-bg">
                                                    <Clock size={16} /> Processing Shipping
                                                </span>
                                            )}

                                            {/* Payment Status Tag */}
                                            {order.isPaid ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-info-bg text-info text-sm font-medium border border-info-bg">
                                                    <CheckCircle size={16} /> Paid ({order.paymentMethod})
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-error-bg text-error text-sm font-medium border border-error-bg">
                                                    <XCircle size={16} /> Unpaid ({order.paymentMethod})
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex -space-x-3 overflow-hidden">
                                            {order.orderItems.map((item, idx) => (
                                                <div key={idx} className="relative z-0 inline-block h-12 w-12 rounded-full border-2 border-surface overflow-hidden bg-muted" title={item.name}>
                                                    {item.image ? (
                                                        <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <span className="flex h-full w-full items-center justify-center text-xs text-tertiary">Img</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {!order.isPaid && order.paymentMethod === 'Bank Transfer' && (
                                        <div className="mt-6 bg-brand-subtle p-4 rounded-xl border border-brand-subtle flex items-start gap-3">
                                            <div className="mt-0.5 text-brand">
                                                <TrendingUp size={18} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-primary">Action Required: Upload Payment Slip</p>
                                                <p className="text-xs text-secondary mt-1">To process your order, please click "View Details" and upload your bank transfer slip.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyOrders;
