import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Star, Trash2, ArrowRight, Trash } from 'lucide-react';
import { useWishlistStore } from '../context/useWishlistStore';
import { useCartStore } from '../context/useCartStore';
import { useConfigStore } from '../context/useConfigStore';
import { useState } from 'react';

const Wishlist = () => {
    const { wishlistItems, removeFromWishlist, clearWishlist } = useWishlistStore();
    const { addToCart } = useCartStore();
    const { config } = useConfigStore();
    const currency = config?.currencySymbol || '$';
    const [showClearConfirm, setShowClearConfirm] = useState(false);

    const handleAddToCart = (product) => {
        addToCart({ ...product, qty: 1 });
    };

    const handleAddAllToCart = () => {
        wishlistItems.forEach(product => {
            addToCart({ ...product, qty: 1 });
        });
    };

    const handleClearWishlist = () => {
        clearWishlist();
        setShowClearConfirm(false);
    };

    return (
        <div className="bg-page min-h-screen py-12 animate-fade-in">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-black text-primary tracking-tight">Your Wishlist</h1>
                </div>

                {wishlistItems.length === 0 ? (
                    <div className="bg-surface rounded-3xl shadow-sm border border-default p-12 text-center">
                        <Heart className="mx-auto h-16 w-16 text-muted mb-4" />
                        <h2 className="text-2xl font-bold text-primary mb-2">Your wishlist is empty</h2>
                        <p className="text-secondary mb-8">Save items you love to review them later.</p>
                        <Link to="/shop" className="btn-primary inline-flex items-center gap-2">
                            <ArrowRight size={20} /> Browse Products
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-8 animate-slide-up">
                        {/* Bulk Actions */}
                        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between bg-surface rounded-2xl border border-default p-4 sm:p-6">
                            <div className="flex items-center gap-3">
                                <Heart size={20} className="text-brand" />
                                <span className="font-semibold text-primary">{wishlistItems.length} item{wishlistItems.length !== 1 ? 's' : ''} in wishlist</span>
                            </div>
                            <div className="flex gap-3 w-full sm:w-auto">
                                <button
                                    onClick={handleAddAllToCart}
                                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-brand text-on-brand rounded-lg font-semibold hover:shadow-lg transition-all"
                                >
                                    <ShoppingBag size={18} />
                                    Add All to Cart
                                </button>
                                <button
                                    onClick={() => setShowClearConfirm(true)}
                                    className="flex-1 sm:flex-none px-4 py-2 border border-error text-error rounded-lg font-semibold hover:bg-error-bg transition-all"
                                >
                                    <Trash size={18} className="inline mr-2" />
                                    Clear
                                </button>
                            </div>
                        </div>

                        {/* Clear Confirmation Dialog */}
                        {showClearConfirm && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                                <div className="bg-surface rounded-2xl border border-default p-6 max-w-sm">
                                    <h3 className="text-lg font-bold text-primary mb-2">Clear Wishlist?</h3>
                                    <p className="text-secondary mb-6">This action cannot be undone. Are you sure you want to remove all items from your wishlist?</p>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setShowClearConfirm(false)}
                                            className="flex-1 px-4 py-2 border border-default rounded-lg font-semibold hover:bg-subtle transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleClearWishlist}
                                            className="flex-1 px-4 py-2 bg-error text-on-brand rounded-lg font-semibold hover:shadow-lg transition-all"
                                        >
                                            Clear All
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Product Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
                        {wishlistItems.map((product) => (
                            <div key={product._id} className="group relative bg-surface border border-default rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-brand-subtle transition-all duration-300 transform hover:-translate-y-1 flex flex-col">
                                <Link to={`/product/${product._id}`} className="block relative">
                                    <div className="aspect-square bg-page relative p-6 flex flex-col items-center justify-center overflow-hidden">
                                        {product.images && product.images[0] ? (
                                            <img
                                                src={product.images[0].url}
                                                alt={product.name}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="w-32 h-32 rounded-full bg-brand-subtle opacity-50 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 group-hover:scale-110 transition-transform duration-500"></div>
                                        )}
                                    </div>
                                </Link>

                                <button
                                    onClick={() => removeFromWishlist(product._id)}
                                    className="absolute top-4 right-4 bg-surface/90 backdrop-blur-sm p-2 rounded-full text-error hover:bg-error-bg transition-colors shadow-sm z-10"
                                    title="Remove from Wishlist"
                                >
                                    <Trash2 size={16} />
                                </button>

                                <div className="p-5 flex flex-col flex-1">
                                    <div className="flex items-center gap-1 text-yellow-400 mb-2">
                                        <Star size={16} fill="currentColor" />
                                        <Star size={16} fill="currentColor" />
                                        <Star size={16} fill="currentColor" />
                                        <Star size={16} fill="currentColor" />
                                        <Star size={16} fill="currentColor" className="text-default" />
                                    </div>
                                    {product.brand && (
                                        <span className="block text-[10px] font-bold tracking-widest text-brand uppercase mb-1">
                                            {product.brand.name || product.brand}
                                        </span>
                                    )}
                                    <Link to={`/product/${product._id}`}>
                                        <h3 className="text-lg font-semibold text-primary mb-1 hover:text-brand transition-colors leading-snug break-words">{product.name}</h3>
                                    </Link>
                                    <div className="mt-auto pt-4 flex flex-col gap-3">
                                        <div className="flex items-center">
                                            {window.Number(product.discountPrice) > 0 && window.Number(product.discountPrice) < window.Number(product.price) ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xl font-bold text-brand">{currency}{product.discountPrice.toFixed(2)}</span>
                                                    <span className="text-sm font-semibold text-tertiary line-through">{currency}{product.price.toFixed(2)}</span>
                                                </div>
                                            ) : (
                                                <span className="text-xl font-bold text-primary">{currency}{product.price?.toFixed(2) || '0.00'}</span>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => handleAddToCart(product)}
                                            className="w-full flex items-center justify-center gap-2 btn-primary rounded-xl py-3 font-semibold transition-colors"
                                        >
                                            <ShoppingBag size={18} />
                                            Move to Cart
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Wishlist;
