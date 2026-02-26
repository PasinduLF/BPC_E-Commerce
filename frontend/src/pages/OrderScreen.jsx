import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../context/useAuthStore';
import { Package, Truck, Wallet, CheckCircle, Clock, UploadCloud } from 'lucide-react';

const OrderScreen = () => {
    const { id } = useParams();
    const [order, setOrder] = useState({});
    const [loading, setLoading] = useState(true);
    const [slipImage, setSlipImage] = useState('');
    const [uploading, setUploading] = useState(false);

    const { userInfo } = useAuthStore();

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
                setLoading(false);
            } catch (error) {
                console.error('Error fetching order:', error);
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
            await axios.put(`http://localhost:5000/api/orders/${id}/pay`, { slipUrl: data.image }, {
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

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
            </div>
        );
    }

    return (
        <div className="bg-slate-50 min-h-screen py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Order Details</h1>
                        <p className="text-slate-500 mt-2 font-mono text-sm">Order ID: #{order._id}</p>
                    </div>
                </div>

                <div className="lg:grid lg:grid-cols-12 lg:gap-8">

                    <div className="lg:col-span-8 space-y-6">

                        {/* Status Indicators */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Delivery Status */}
                            <div className={`p-6 rounded-2xl border flex items-start gap-4 ${order.isDelivered ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
                                <div className={`p-3 rounded-xl ${order.isDelivered ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                    {order.isDelivered ? <CheckCircle size={24} /> : <Clock size={24} />}
                                </div>
                                <div>
                                    <h3 className={`text-lg font-bold ${order.isDelivered ? 'text-emerald-900' : 'text-amber-900'}`}>
                                        {order.isDelivered ? 'Delivered' : 'Processing Delivery'}
                                    </h3>
                                    <p className={`text-sm mt-1 ${order.isDelivered ? 'text-emerald-700' : 'text-amber-700'}`}>
                                        {order.isDelivered ? `Delivered on ${new Date(order.deliveredAt).toLocaleDateString()}` : 'We are preparing your order.'}
                                    </p>
                                </div>
                            </div>

                            {/* Payment Status */}
                            <div className={`p-6 rounded-2xl border flex items-start gap-4 ${order.isPaid ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                                <div className={`p-3 rounded-xl ${order.isPaid ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                    {order.isPaid ? <CheckCircle size={24} /> : <Clock size={24} />}
                                </div>
                                <div>
                                    <h3 className={`text-lg font-bold ${order.isPaid ? 'text-emerald-900' : 'text-rose-900'}`}>
                                        {order.isPaid ? 'Payment Confirmed' : 'Awaiting Payment'}
                                    </h3>
                                    <p className={`text-sm mt-1 ${order.isPaid ? 'text-emerald-700' : 'text-rose-700'}`}>
                                        {order.isPaid ? `Paid on ${new Date(order.paidAt).toLocaleDateString()}` : 'Please complete your payment.'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Application Information */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="p-3 bg-pink-50 rounded-xl text-pink-600">
                                    <Truck size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">Shipping Details</h2>
                                    <div className="mt-4 space-y-2 text-slate-600">
                                        <p><strong className="font-semibold text-slate-800">Name: </strong> {order.user.name}</p>
                                        <p><strong className="font-semibold text-slate-800">Email: </strong> <a href={`mailto:${order.user.email}`} className="text-pink-600 hover:underline">{order.user.email}</a></p>
                                        <p>
                                            <strong className="font-semibold text-slate-800">Address: </strong>
                                            {order.shippingAddress.address}, {order.shippingAddress.city}, {order.shippingAddress.postalCode}, {order.shippingAddress.country}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8">
                            <div className="flex items-start gap-4 mb-4">
                                <div className="p-3 bg-pink-50 rounded-xl text-pink-600">
                                    <Wallet size={24} />
                                </div>
                                <div className="w-full">
                                    <h2 className="text-xl font-bold text-slate-900">Payment Information</h2>
                                    <p className="mt-2 text-slate-600 mb-4">
                                        <strong className="font-semibold text-slate-800">Method: </strong>
                                        {order.paymentMethod}
                                    </p>

                                    {/* Bank Transfer Slip Upload */}
                                    {!order.isPaid && order.paymentMethod === 'Bank Transfer' && (
                                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mt-6">
                                            <h3 className="text-lg font-semibold text-slate-800 mb-2">Upload Transfer Slip</h3>
                                            <p className="text-sm text-slate-500 mb-4">Please upload a clear image of your bank transfer slip to confirm payment.</p>

                                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-white hover:bg-slate-50 hover:border-pink-300 transition-all group">
                                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                    <UploadCloud size={28} className="text-slate-400 group-hover:text-pink-500 mb-2 transition-colors" />
                                                    <p className="mb-2 text-sm text-slate-500"><span className="font-semibold">Click to upload</span></p>
                                                    <p className="text-xs text-slate-400">PNG, JPG or JPEG (MAX. 5MB)</p>
                                                </div>
                                                <input type="file" className="hidden" onChange={uploadFileHandler} accept="image/*" />
                                            </label>
                                            {uploading && <p className="text-pink-600 text-sm mt-3 font-medium animate-pulse">Uploading securely...</p>}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Order Items */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8">
                            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                                <Package size={20} className="text-pink-500" /> Items in Order
                            </h2>
                            {order.orderItems.length === 0 ? (
                                <p className="text-slate-500">Order is empty</p>
                            ) : (
                                <ul className="divide-y divide-slate-100">
                                    {order.orderItems.map((item, index) => (
                                        <li key={index} className="py-4 flex items-center gap-4">
                                            <div className="w-16 h-16 bg-slate-50 rounded-lg overflow-hidden flex-shrink-0 border border-slate-100">
                                                {item.image ? (
                                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full bg-pink-100 opacity-50 flex items-center justify-center text-xs text-pink-400">Img</div>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <Link to={`/product/${item.product}`} className="font-semibold text-slate-800 hover:text-pink-600 transition-colors line-clamp-1">
                                                    {item.name}
                                                </Link>
                                                {item.variantName && (
                                                    <p className="text-pink-600 text-[10px] font-bold uppercase tracking-wider mt-1">
                                                        {item.variantName}
                                                    </p>
                                                )}
                                                <p className="text-slate-500 text-sm mt-1">
                                                    {item.qty} x ${item.price.toFixed(2)} = <span className="font-medium text-slate-700">${(item.qty * item.price).toFixed(2)}</span>
                                                </p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    <div className="lg:col-span-4 mt-8 lg:mt-0">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sticky top-24">
                            <h2 className="text-xl font-bold text-slate-900 mb-6 pb-4 border-b border-slate-100">Order Summary</h2>

                            <div className="space-y-4 mb-6 text-sm">
                                <div className="flex justify-between text-slate-600">
                                    <span>Items</span>
                                    <span className="font-medium text-slate-900">${order.itemsPrice.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-slate-600">
                                    <span>Shipping</span>
                                    <span className="font-medium text-slate-900">${order.shippingPrice.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-slate-600">
                                    <span>Tax</span>
                                    <span className="font-medium text-slate-900">${order.taxPrice.toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="border-t border-slate-100 pt-4 mb-8 flex justify-between items-center bg-pink-50/50 p-4 rounded-xl">
                                <span className="text-lg font-bold text-slate-900">Total</span>
                                <span className="text-3xl font-bold text-pink-600">${order.totalPrice.toFixed(2)}</span>
                            </div>

                            {!order.isPaid && order.paymentMethod === 'Cash on Delivery' && (
                                <div className="bg-amber-50 text-amber-800 text-sm p-4 rounded-xl border border-amber-200 mb-4">
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
