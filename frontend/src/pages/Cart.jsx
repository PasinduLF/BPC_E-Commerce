import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../context/useCartStore';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, ShieldCheck } from 'lucide-react';
import { useConfigStore } from '../context/useConfigStore';
import { useAuthStore } from '../context/useAuthStore';

const Cart = () => {
    const { config } = useConfigStore();
    const currency = config?.currencySymbol || '$';

    const navigate = useNavigate();
    const { cartItems, addToCart, removeFromCart, clearBuyNowItem } = useCartStore();
    const { userInfo } = useAuthStore();

    useEffect(() => {
        // Clearing any pending 'buy now' flow if the user explicitly goes back to their cart
        clearBuyNowItem();
    }, [clearBuyNowItem]);

    const removeItemHandler = (id) => {
        removeFromCart(id);
    };

    const checkoutHandler = () => {
        if (userInfo) {
            navigate('/shipping');
        } else {
            navigate('/login?redirect=/shipping');
        }
    };

    const qtyChangeHandler = (cartId, newQty) => {
        const item = cartItems.find(i => (i.cartId || i._id) === cartId);
        if (!item) return;

        const checkStock = item.variant ? item.variant.stock : item.stock;
        if (newQty > 0 && newQty <= checkStock) {
            addToCart({ ...item, qty: newQty });
        }
    };

    return (
        <div className="bg-page min-h-screen py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-fade-in">
                
            <h1 className="text-2xl sm:text-3xl font-black text-primary tracking-tight mb-8">Shopping Bag</h1>

                {cartItems.length === 0 ? (
                    <div className="bg-surface rounded-2xl shadow-sm border border-default p-12 text-center">
                        <div className="w-20 h-20 bg-brand-subtle rounded-full flex items-center justify-center mx-auto mb-6">
                            <ShoppingBag size={32} className="text-brand" />
                        </div>
                        <h2 className="text-2xl font-semibold text-primary mb-2">Your cart is empty</h2>
                        <p className="text-secondary mb-8 max-w-md mx-auto">Looks like you haven't added any premium cosmetics to your cart yet. Discover your true radiance today!</p>
                        <Link to="/" className="btn-primary inline-flex items-center gap-2">
                            Explore Products <ArrowRight size={18} />
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start animate-slide-up">
                        {/* Cart Items List */}
                        <div className="lg:col-span-8 space-y-6">
                            <div className="bg-surface rounded-2xl shadow-sm border border-default overflow-hidden">
                                <ul className="divide-y divide-default">
                                    {cartItems.map((item) => (
                                        <li key={item.cartId || item._id} className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:gap-6 hover:bg-page/50 transition-colors">
                                            <div className="w-24 h-24 flex-shrink-0 bg-page rounded-xl border border-default overflow-hidden relative group">
                                                {item.image || (item.images && item.images[0]) ? (
                                                    <img src={item.image || item.images[0].url} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                ) : (
                                                    <div className="w-12 h-12 bg-brand-subtle rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-50"></div>
                                                )}
                                            </div>

                                            <div className="flex-1 flex flex-col sm:flex-row sm:justify-between items-start sm:items-center w-full gap-4">

                                                <div className="text-center sm:text-left">
                                                    <div className="flex-1">
                                                        <Link to={`/product/${item._id}`} className="text-lg font-semibold text-primary hover:text-brand transition-colors line-clamp-1">
                                                            {item.name}
                                                        </Link>
                                                        {item.variant && item.variant.name !== 'Default' && (
                                                            <p className="text-brand text-[10px] font-bold uppercase tracking-wider mt-1">
                                                                    {item.variant.name}: {item.variant.value}
                                                            </p>
                                                        )}
                                                        <p className="text-secondary text-sm mt-1">{currency}{item.price.toFixed(2)}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto justify-between sm:justify-start">
                                                    <div className="flex items-center border border-default rounded-lg bg-page">
                                                        <button 
                                                            onClick={() => qtyChangeHandler(item.cartId || item._id, item.qty - 1)} 
                                                            disabled={item.qty <= 1}
                                                            className="p-2 text-secondary hover:text-brand disabled:opacity-50 transition-colors"
                                                        >
                                                            <Minus size={16} />
                                                        </button>
                                                        <span className="w-8 text-center font-medium text-primary">{item.qty}</span>
                                                        <button 
                                                            onClick={() => qtyChangeHandler(item.cartId || item._id, item.qty + 1)} 
                                                            disabled={item.qty >= (item.variant ? item.variant.stock : item.stock)}
                                                            className="p-2 text-secondary hover:text-brand disabled:opacity-50 transition-colors"
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
                        <div className="lg:col-span-4">
                            <div className="bg-surface rounded-2xl shadow-sm border border-default p-6 sticky top-24">
                                <h2 className="text-xl font-bold text-primary mb-6 pb-4 border-b border-default">Order Summary</h2>
                                
                                <div className="space-y-4 mb-8">
                                    <div className="flex justify-between text-secondary">
                                        <span>Subtotal ({cartItems.reduce((acc, item) => acc + item.qty, 0)} items)</span>
                                        <span className="font-medium text-primary">{currency}{cartItems.reduce((acc, item) => acc + item.qty * item.price, 0).toFixed(2)}</span>
                                    </div>
                                    
                                    <div className="flex justify-between text-secondary">
                                        <span>Shipping</span>
                                        <span className="font-medium text-primary">Calculated at checkout</span>
                                    </div>
                                </div>

                                <div className="border-t border-default pt-4 mb-8 flex justify-between items-center">
                                    <span className="text-lg font-bold text-primary">Total</span>
                                    <span className="text-2xl font-bold text-brand">
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
                                <div className="mt-6 flex items-center justify-center gap-2">
                                    <ShieldCheck size={16} className="text-success" />
                                    <p className="text-xs text-tertiary">Secure checkout powered by Beauty P&C</p>
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
