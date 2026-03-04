import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../context/useCartStore';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag } from 'lucide-react';
import { useConfigStore } from '../context/useConfigStore';

const Cart = () => {
    const { config } = useConfigStore();
    const currency = config?.currencySymbol || '$';

    const navigate = useNavigate();
    const { cartItems, addToCart, removeFromCart, clearBuyNowItem } = useCartStore();

    useEffect(() => {
        // Clearing any pending 'buy now' flow if the user explicitly goes back to their cart
        clearBuyNowItem();
    }, [clearBuyNowItem]);

    const updateQuantity = (item, newQty) => {
        const checkStock = item.variant ? item.variant.stock : item.stock;
        if (newQty > 0 && newQty <= checkStock) {
            addToCart({ ...item, qty: newQty });
        }
    };

    const removeItemHandler = (id) => {
        removeFromCart(id);
    };

    const checkoutHandler = () => {
        navigate('/login?redirect=/shipping');
    };

    return (
        <div className="bg-slate-50 min-h-screen py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-8">Shopping Cart</h1>

                {cartItems.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
                        <div className="w-20 h-20 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <ShoppingBag size={32} className="text-pink-500" />
                        </div>
                        <h2 className="text-2xl font-semibold text-slate-800 mb-2">Your cart is empty</h2>
                        <p className="text-slate-500 mb-8 max-w-md mx-auto">Looks like you haven't added any premium cosmetics to your cart yet. Discover your true radiance today!</p>
                        <Link to="/shop" className="btn-primary inline-flex items-center gap-2">
                            Start Shopping <ArrowRight size={18} />
                        </Link>
                    </div>
                ) : (
                    <div className="lg:grid lg:grid-cols-12 lg:gap-12">

                        {/* Cart Items List */}
                        <div className="lg:col-span-8">
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                                <ul className="divide-y divide-slate-100">
                                    {cartItems.map((item) => (
                                        <li key={item.cartId || item._id} className="p-6 flex flex-col sm:flex-row gap-6 items-center">
                                            <div className="w-24 h-24 flex-shrink-0 bg-slate-50 rounded-xl border border-slate-100 overflow-hidden relative group">
                                                {item.images && item.images[0] ? (
                                                    <img src={item.images[0].url} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                                ) : (
                                                    <div className="w-12 h-12 bg-pink-100 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-50"></div>
                                                )}
                                            </div>

                                            <div className="flex-1 flex flex-col sm:flex-row sm:justify-between items-center w-full gap-4">

                                                <div className="text-center sm:text-left">
                                                    <Link to={`/product/${item._id}`} className="text-lg font-semibold text-slate-800 hover:text-pink-600 transition-colors line-clamp-1">
                                                        {item.name}
                                                    </Link>
                                                    {item.variant && (
                                                        <p className="text-pink-600 text-[10px] font-bold uppercase tracking-wider mt-1">
                                                            {item.variant.name}: {item.variant.value}
                                                        </p>
                                                    )}
                                                    <p className="text-slate-500 text-sm mt-1">{currency}{item.price.toFixed(2)}</p>
                                                </div>

                                                <div className="flex items-center gap-6">
                                                    <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50">
                                                        <button
                                                            onClick={() => updateQuantity(item, item.qty - 1)}
                                                            disabled={item.qty === 1}
                                                            className="p-2 text-slate-500 hover:text-pink-600 disabled:opacity-50 transition-colors"
                                                        >
                                                            <Minus size={16} />
                                                        </button>
                                                        <span className="w-8 text-center font-medium text-slate-700">{item.qty}</span>
                                                        <button
                                                            onClick={() => updateQuantity(item, item.qty + 1)}
                                                            disabled={item.qty === (item.variant ? item.variant.stock : item.stock)}
                                                            className="p-2 text-slate-500 hover:text-pink-600 disabled:opacity-50 transition-colors"
                                                        >
                                                            <Plus size={16} />
                                                        </button>
                                                    </div>

                                                    <button
                                                        onClick={() => removeItemHandler(item.cartId || item._id)}
                                                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 size={20} />
                                                    </button>
                                                </div>

                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Order Summary */}
                        <div className="lg:col-span-4 mt-8 lg:mt-0">
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sticky top-24">
                                <h2 className="text-xl font-bold text-slate-900 mb-6 pb-4 border-b border-slate-100">Order Summary</h2>

                                <div className="space-y-4 mb-6">
                                    <div className="flex justify-between text-slate-600">
                                        <span>Subtotal ({cartItems.reduce((acc, item) => acc + item.qty, 0)} items)</span>
                                        <span className="font-medium text-slate-900">
                                            {currency}{cartItems.reduce((acc, item) => acc + item.qty * item.price, 0).toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-slate-600">
                                        <span>Shipping Estimate</span>
                                        <span className="font-medium text-slate-900">Calculated at checkout</span>
                                    </div>
                                </div>

                                <div className="border-t border-slate-100 pt-4 mb-8 flex justify-between items-center">
                                    <span className="text-lg font-bold text-slate-900">Total</span>
                                    <span className="text-2xl font-bold text-pink-600">
                                        {currency}{cartItems.reduce((acc, item) => acc + item.qty * item.price, 0).toFixed(2)}
                                    </span>
                                </div>

                                <button
                                    onClick={checkoutHandler}
                                    disabled={cartItems.length === 0}
                                    className="w-full btn-primary py-3 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    Proceed to Checkout
                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </button>

                                <div className="mt-4 text-center">
                                    <p className="text-xs text-slate-400">Secure checkout powered by Beauty P&C</p>
                                </div>
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
};

export default Cart;
