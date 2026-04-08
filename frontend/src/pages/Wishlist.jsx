import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Star, Trash2, ArrowRight } from 'lucide-react';
import { useWishlistStore } from '../context/useWishlistStore';
import { useCartStore } from '../context/useCartStore';
import { useConfigStore } from '../context/useConfigStore';

const Wishlist = () => {
    const { wishlistItems, removeFromWishlist } = useWishlistStore();
    const { addToCart } = useCartStore();
    const { config } = useConfigStore();
    const currency = config?.currencySymbol || '$';

    const handleAddToCart = (product) => {
        addToCart({ ...product, qty: 1 });
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
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8 animate-slide-up">
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
                )}
            </div>
        </div>
    );
};

export default Wishlist;
