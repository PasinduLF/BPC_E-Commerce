import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../context/useCartStore';
import { useAuthStore } from '../context/useAuthStore';
import axios from 'axios';
import { CheckCircle, Truck, Wallet, ArrowRight } from 'lucide-react';
import { useConfigStore } from '../context/useConfigStore';

const PlaceOrder = () => {
    const { config } = useConfigStore();
    const currency = config?.currencySymbol || '$';

    const navigate = useNavigate();
    const { cartItems, shippingAddress, paymentMethod, clearCart } = useCartStore();
    const { userInfo } = useAuthStore();

    useEffect(() => {
        if (!shippingAddress.address) {
            navigate('/shipping');
        } else if (!paymentMethod) {
            navigate('/payment');
        }
    }, [paymentMethod, shippingAddress, navigate]);

    // Calculate prices
    const addDecimals = (num) => {
        return (Math.round(num * 100) / 100).toFixed(2);
    };

    const itemsPrice = addDecimals(
        cartItems.reduce((acc, item) => acc + item.price * item.qty, 0)
    );

    // Dynamic config overrides defaults
    const taxRate = config?.taxRate || 0;
    const baseShippingFee = config?.shippingFee || 0;
    const freeShippingThreshold = config?.freeShippingThreshold || 0;

    const shippingPrice = addDecimals(
        (freeShippingThreshold > 0 && itemsPrice > freeShippingThreshold) ? 0 : baseShippingFee
    );
    const taxPrice = addDecimals(Number(((taxRate / 100) * itemsPrice).toFixed(2)));

    const totalPrice = (
        Number(itemsPrice) +
        Number(shippingPrice) +
        Number(taxPrice)
    ).toFixed(2);

    const placeOrderHandler = async () => {
        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${userInfo.token}`,
                },
            };

            const { data } = await axios.post(
                'http://localhost:5000/api/orders',
                {
                    orderItems: cartItems,
                    shippingAddress,
                    paymentMethod,
                    itemsPrice,
                    shippingPrice,
                    taxPrice,
                    totalPrice,
                },
                config
            );

            clearCart();
            navigate(`/order/${data._id}`);

        } catch (error) {
            console.error('Order creation failed', error);
            alert('Order failed to process. Please try again.');
        }
    };

    return (
        <div className="bg-slate-50 min-h-screen py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                <div className="flex justify-center mb-12">
                    <div className="flex items-center gap-4 text-sm font-medium">
                        <span className="text-pink-600 bg-pink-50 px-3 py-1 rounded-full border border-pink-100 line-through decoration-pink-300">1. Shipping</span>
                        <div className="w-8 h-px bg-pink-200"></div>
                        <span className="text-pink-600 bg-pink-50 px-3 py-1 rounded-full border border-pink-100 line-through decoration-pink-300">2. Payment</span>
                        <div className="w-8 h-px bg-pink-200"></div>
                        <span className="text-pink-600 bg-pink-50 px-3 py-1 rounded-full border border-pink-100">3. Order placed</span>
                    </div>
                </div>

                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-8">Review Your Order</h1>

                <div className="lg:grid lg:grid-cols-12 lg:gap-8">

                    <div className="lg:col-span-8 space-y-6">

                        {/* Shipping Summary */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8">
                            <div className="flex items-start gap-4 mb-4">
                                <div className="p-3 bg-pink-50 rounded-xl text-pink-600">
                                    <Truck size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">Shipping</h2>
                                    <p className="mt-2 text-slate-600">
                                        <strong className="font-semibold text-slate-800">Address: </strong>
                                        {shippingAddress.address}, {shippingAddress.city}, {shippingAddress.postalCode}, {shippingAddress.country}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Payment Summary */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8">
                            <div className="flex items-start gap-4 mb-4">
                                <div className="p-3 bg-pink-50 rounded-xl text-pink-600">
                                    <Wallet size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">Payment Method</h2>
                                    <p className="mt-2 text-slate-600">
                                        <strong className="font-semibold text-slate-800">Method: </strong>
                                        {paymentMethod}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Order Items */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 overflow-hidden">
                            <h2 className="text-xl font-bold text-slate-900 mb-6">Order Items</h2>
                            {cartItems.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-slate-500 mb-4">Your cart is empty.</p>
                                    <Link to="/shop" className="text-pink-600 hover:underline">Go back to Shop</Link>
                                </div>
                            ) : (
                                <ul className="divide-y divide-slate-100">
                                    {cartItems.map((item, index) => (
                                        <li key={index} className="py-4 flex items-center gap-4">
                                            <div className="w-16 h-16 bg-slate-50 rounded-lg overflow-hidden flex-shrink-0 border border-slate-100">
                                                {item.images && item.images[0] ? (
                                                    <img src={item.images[0].url} alt={item.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full bg-pink-100 opacity-50"></div>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <Link to={`/product/${item._id}`} className="font-semibold text-slate-800 hover:text-pink-600 transition-colors line-clamp-1">
                                                    {item.name}
                                                </Link>
                                                {item.variant && (
                                                    <p className="text-pink-600 text-[10px] font-bold uppercase tracking-wider mt-1">
                                                        {item.variant.name}: {item.variant.value}
                                                    </p>
                                                )}
                                                <p className="text-slate-500 text-sm mt-1">
                                                    {item.qty} x {currency}{item.price.toFixed(2)} = <span className="font-medium text-slate-700">{currency}{(item.qty * item.price).toFixed(2)}</span>
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
                                    <span className="font-medium text-slate-900">{currency}{itemsPrice}</span>
                                </div>
                                <div className="flex justify-between text-slate-600">
                                    <span>Shipping</span>
                                    <span className="font-medium text-slate-900">{currency}{shippingPrice}</span>
                                </div>
                                <div className="flex justify-between text-slate-600">
                                    <span>Tax ({taxRate}%)</span>
                                    <span className="font-medium text-slate-900">{currency}{taxPrice}</span>
                                </div>
                            </div>

                            <div className="border-t border-slate-100 pt-4 mb-8 flex justify-between items-center">
                                <span className="text-lg font-bold text-slate-900">Total</span>
                                <span className="text-3xl font-bold text-pink-600">{currency}{totalPrice}</span>
                            </div>

                            <button
                                type="button"
                                className="w-full btn-primary py-4 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
                                disabled={cartItems.length === 0}
                                onClick={placeOrderHandler}
                            >
                                Place Order
                                <CheckCircle size={20} className="group-hover:scale-110 transition-transform" />
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default PlaceOrder;
