import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../context/useAuthStore';
import { Package, Truck, Wallet, CheckCircle, Clock, UploadCloud } from 'lucide-react';

const OrderScreen = () => {
    const { id } = useParams();
    const [order, setOrder] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [slipImage, setSlipImage] = useState('');
    const [uploading, setUploading] = useState(false);
    const [paymentUpdating, setPaymentUpdating] = useState(false);
    const [deliveryUpdating, setDeliveryUpdating] = useState(false);

    const { userInfo } = useAuthStore();

    const safeMoney = (value) => Number(value || 0).toFixed(2);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const config = {
                    headers: {
                        Authorization: `Bearer ${userInfo.token}`,
                    },
                };
                const { data } = await axios.get(`http://localhost:5000/api/orders/${id}`, config);
                setOrder(data);
                setError('');
                setLoading(false);
            } catch (error) {
                console.error('Error fetching order:', error);
                setError(error.response?.data?.message || error.message || 'Failed to load order');
                setLoading(false);
            }
        };

        fetchOrder();
    }, [id, userInfo.token]);

    const uploadFileHandler = async (e) => {
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('image', file);
        setUploading(true);

        try {
            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${userInfo.token}`,
                },
            };

            const { data } = await axios.post('http://localhost:5000/api/upload', formData, config);
            setSlipImage(data.image);

            // Now update the order with the slip
            await axios.put(`http://localhost:5000/api/orders/${id}/pay`, {
                paymentSlipUrl: data.url,
                paymentSlipPublicId: data.public_id
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${userInfo.token}`,
                },
            });

            // refetch order to update UI
            const updatedData = await axios.get(`http://localhost:5000/api/orders/${id}`, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            setOrder(updatedData.data);

            setUploading(false);
        } catch (error) {
            console.error(error);
            setUploading(false);
            alert('Error uploading slip');
        }
    };

    const verifyPaymentHandler = async () => {
        if (paymentUpdating) return;
        setPaymentUpdating(true);
        try {
            const configHeader = { headers: { Authorization: `Bearer ${userInfo.token}` } };
            await axios.put(`http://localhost:5000/api/orders/${id}/status`, { paymentStatus: 'paid' }, configHeader);

            // refetch order
            const updatedData = await axios.get(`http://localhost:5000/api/orders/${id}`, configHeader);
            setOrder(updatedData.data);
            alert('Payment verified successfully!');
        } catch (error) {
            alert('Failed to verify payment');
        } finally {
            setPaymentUpdating(false);
        }
    };

    const toggleDeliveryStatusHandler = async () => {
        if (deliveryUpdating) return;
        setDeliveryUpdating(true);
        try {
            const configHeader = { headers: { Authorization: `Bearer ${userInfo.token}` } };
            await axios.put(`http://localhost:5000/api/orders/${id}/status`, {
                deliveryStatus: order.isDelivered ? 'processing' : 'delivered'
            }, configHeader);

            const updatedData = await axios.get(`http://localhost:5000/api/orders/${id}`, configHeader);
            setOrder(updatedData.data);
        } catch (error) {
            alert('Failed to update delivery status');
        } finally {
            setDeliveryUpdating(false);
        }
    };

    return loading ? (
        <div className="min-h-screen flex justify-center items-center bg-page"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div></div>
    ) : error ? (
        <div className="min-h-screen flex justify-center items-center text-error bg-page">{error}</div>
    ) : (
        <div className="bg-page min-h-screen py-12 animate-fade-in">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
                    <h1 className="text-2xl sm:text-3xl font-black text-primary break-all">
                        Order <span className="text-brand">#{order._id}</span>
                    </h1>
                    <span className="text-xs sm:text-sm font-semibold bg-brand-subtle text-brand px-3 py-1 rounded-full border border-brand-subtle">
                        {order.status || 'Pending'}
                    </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                    <div className="lg:col-span-8 space-y-8 animate-slide-up">

                        {/* Status Indicators */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Delivery Status */}
                            <div className={`p-6 rounded-2xl border flex items-start gap-4 ${order.isDelivered ? 'bg-success-bg border-success-bg' : 'bg-warning-bg border-warning-bg'}`}>
                                <div className={`p-3 rounded-xl ${order.isDelivered ? 'bg-success-bg text-success' : 'bg-warning-bg text-warning'}`}>
                                    {order.isDelivered ? <CheckCircle size={24} /> : <Clock size={24} />}
                                </div>
                                <div>
                                    <h3 className={`text-lg font-bold ${order.isDelivered ? 'text-success' : 'text-warning'}`}>
                                        {order.isDelivered ? 'Delivered' : 'Processing Delivery'}
                                    </h3>
                                    <p className={`text-sm mt-1 ${order.isDelivered ? 'text-secondary' : 'text-secondary'}`}>
                                        {order.isDelivered ? `Delivered on ${new Date(order.deliveredAt).toLocaleDateString()}` : 'We are preparing your order.'}
                                    </p>
                                    {userInfo?.isAdmin && (
                                        <button
                                            onClick={toggleDeliveryStatusHandler}
                                            disabled={deliveryUpdating || paymentUpdating}
                                            className="mt-3 text-xs px-3 py-1.5 rounded-lg border border-default bg-page hover:bg-muted text-primary font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                        >
                                            {deliveryUpdating ? 'Updating...' : (order.isDelivered ? 'Mark Processing' : 'Mark Delivered')}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Payment Status */}
                            <div className={`p-6 rounded-2xl border flex items-start gap-4 ${order.isPaid ? 'bg-success-bg border-success-bg' : 'bg-error-bg border-error-bg'}`}>
                                <div className={`p-3 rounded-xl ${order.isPaid ? 'bg-success-bg text-success' : 'bg-error-bg text-error'}`}>
                                    {order.isPaid ? <CheckCircle size={24} /> : <Clock size={24} />}
                                </div>
                                <div>
                                    <h3 className={`text-lg font-bold ${order.isPaid ? 'text-success' : 'text-error'}`}>
                                        {order.isPaid ? 'Payment Confirmed' : 'Awaiting Payment'}
                                    </h3>
                                    <p className={`text-sm mt-1 ${order.isPaid ? 'text-secondary' : 'text-secondary'}`}>
                                        {order.isPaid ? `Paid on ${new Date(order.paidAt).toLocaleDateString()}` : 'Please complete your payment.'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Application Information */}
                        <div className="bg-surface rounded-2xl shadow-sm border border-default p-6 md:p-8">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="p-3 bg-brand-subtle rounded-xl text-brand">
                                    <Truck size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-primary">Shipping Details</h2>
                                    <div className="mt-4 space-y-2 text-secondary">
                                        <p><strong className="font-semibold text-primary">Name: </strong> {order.user?.name || 'N/A'}</p>
                                        <p><strong className="font-semibold text-primary">Email: </strong> {order.user?.email ? <a href={`mailto:${order.user.email}`} className="text-brand hover:underline">{order.user.email}</a> : 'N/A'}</p>
                                        <p>
                                            <strong className="font-semibold text-primary">Address: </strong>
                                            {order.shippingAddress?.address}, {order.shippingAddress?.city}, {order.shippingAddress?.postalCode}, {order.shippingAddress?.country}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div className="bg-surface rounded-2xl shadow-sm border border-default p-6 md:p-8">
                            <div className="flex items-start gap-4 mb-4">
                                <div className="p-3 bg-brand-subtle rounded-xl text-brand">
                                    <Wallet size={24} />
                                </div>
                                <div className="w-full">
                                    <h2 className="text-xl font-bold text-primary">Payment Information</h2>
                                    <p className="mt-2 text-secondary mb-4">
                                        <strong className="font-semibold text-primary">Method: </strong>
                                        {order.paymentMethod}
                                    </p>

                                    {/* Bank Transfer Slip Upload & Verification */}
                                    {order.paymentMethod === 'Bank Transfer' && (
                                        <div className="bg-page p-6 rounded-xl border border-default mt-6">
                                            <h3 className="text-lg font-semibold text-primary mb-4">Bank Transfer Slip</h3>

                                            {(order.paymentSlip && order.paymentSlip.url) ? (
                                                <div className="mb-4">
                                                    <a href={order.paymentSlip.url} target="_blank" rel="noreferrer" className="block max-w-sm rounded-lg overflow-hidden border border-default hover:border-brand transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-brand">
                                                        <img src={order.paymentSlip.url} alt="Payment Slip" className="w-full h-auto object-cover max-h-64" />
                                                    </a>
                                                    {!order.isPaid && userInfo.isAdmin && (
                                                        <div className="mt-4 flex flex-wrap gap-3">
                                                            <button
                                                                onClick={verifyPaymentHandler}
                                                                disabled={paymentUpdating || deliveryUpdating}
                                                                className="w-full md:w-auto bg-success hover:brightness-95 text-white flex items-center justify-center gap-2 font-bold py-2.5 px-6 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                                            >
                                                                <CheckCircle size={18} /> {paymentUpdating ? 'Verifying...' : 'Verify Payment'}
                                                            </button>
                                                            <button
                                                                onClick={toggleDeliveryStatusHandler}
                                                                disabled={deliveryUpdating || paymentUpdating}
                                                                className="w-full md:w-auto bg-page hover:bg-muted text-primary border border-default flex items-center justify-center gap-2 font-bold py-2.5 px-6 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                                            >
                                                                <Truck size={18} /> {deliveryUpdating ? 'Updating...' : (order.isDelivered ? 'Mark Processing' : 'Mark Delivered')}
                                                            </button>
                                                        </div>
                                                    )}
                                                    {!order.isPaid && !userInfo.isAdmin && (
                                                        <p className="text-sm text-warning mt-4 flex items-center gap-2 bg-warning-bg p-3 rounded border border-warning-bg"><Clock size={16} /> Your slip is awaiting admin verification.</p>
                                                    )}
                                                </div>
                                            ) : (
                                                !order.isPaid && (
                                                    <div>
                                                        <p className="text-sm text-secondary mb-4">Please upload a clear image of your bank transfer slip to confirm payment.</p>

                                                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-default border-dashed rounded-xl cursor-pointer bg-surface hover:bg-page hover:border-brand-subtle transition-all group">
                                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                                <UploadCloud size={28} className="text-tertiary group-hover:text-brand mb-2 transition-colors" />
                                                                <p className="mb-2 text-sm text-secondary"><span className="font-semibold">Click to upload</span></p>
                                                                <p className="text-xs text-tertiary">PNG, JPG or JPEG (MAX. 5MB)</p>
                                                            </div>
                                                            <input type="file" className="hidden" onChange={uploadFileHandler} accept="image/*" />
                                                        </label>
                                                        {uploading && <p className="text-brand text-sm mt-3 font-medium animate-pulse">Uploading securely...</p>}
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Order Items */}
                        <div className="bg-surface rounded-2xl shadow-sm border border-default p-6 md:p-8">
                            <h2 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
                                <Package size={20} className="text-brand" /> Items in Order
                            </h2>
                            {!order.orderItems || order.orderItems.length === 0 ? (
                                <p className="text-secondary">Order is empty</p>
                            ) : (
                                <ul className="divide-y divide-default">
                                    {order.orderItems.map((item, index) => (
                                        <li key={index} className="py-4 flex items-center gap-4">
                                            <div className="w-16 h-16 bg-page rounded-lg overflow-hidden flex-shrink-0 border border-default">
                                                {item.image ? (
                                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full bg-brand-subtle opacity-50 flex items-center justify-center text-xs text-brand">Img</div>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <Link to={`/product/${item.product}`} className="font-semibold text-primary hover:text-brand transition-colors line-clamp-1">
                                                    {item.name}
                                                </Link>
                                                {item.variantName && (
                                                    <p className="text-brand text-[10px] font-bold uppercase tracking-wider mt-1">
                                                        {item.variantName}
                                                    </p>
                                                )}
                                                <p className="text-secondary text-sm mt-1">
                                                    {item.qty || 0} x ${safeMoney(item.price)} = <span className="font-medium text-primary">${safeMoney((item.qty || 0) * (item.price || 0))}</span>
                                                </p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    <div className="lg:col-span-4 animate-slide-up-delayed-1">
                        <div className="bg-surface rounded-3xl p-8 border border-default shadow-sm sticky top-24">
                            <h2 className="text-xl font-bold text-primary mb-6 pb-4 border-b border-default">Order Summary</h2>

                            <div className="space-y-4 mb-6 text-sm">
                                <div className="flex justify-between text-secondary">
                                    <span>Items</span>
                                    <span className="font-medium text-primary">${safeMoney(order.itemsPrice)}</span>
                                </div>
                                <div className="flex justify-between text-secondary">
                                    <span>Shipping</span>
                                    <span className="font-medium text-primary">${safeMoney(order.shippingPrice)}</span>
                                </div>
                                <div className="flex justify-between text-secondary">
                                    <span>Tax</span>
                                    <span className="font-medium text-primary">${safeMoney(order.taxPrice)}</span>
                                </div>
                            </div>

                            <div className="border-t border-default pt-4 mb-8 flex justify-between items-center bg-brand-subtle/50 p-4 rounded-xl">
                                <span className="text-lg font-bold text-primary">Total</span>
                                <span className="text-3xl font-bold text-brand">${safeMoney(order.totalPrice)}</span>
                            </div>

                            {!order.isPaid && order.paymentMethod === 'Cash on Delivery' && (
                                <div className="bg-warning-bg text-warning text-sm p-4 rounded-xl border border-warning-bg mb-4">
                                    Please prepare exact change in cash for delivery.
                                </div>
                            )}

                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default OrderScreen;
