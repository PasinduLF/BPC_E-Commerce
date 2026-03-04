import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Star, Trash2 } from 'lucide-react';
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
        <div className="bg-slate-50 min-h-screen py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                <div className="flex items-center gap-3 mb-8">
                    <Heart className="text-pink-500" size={32} />
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">My Wishlist</h1>
                </div>

                {wishlistItems.length === 0 ? (
                    <div className="text-center py-24 bg-white rounded-2xl border border-slate-100 shadow-sm w-full">
                        <Heart size={48} className="mx-auto text-slate-300 mb-4" />
                        <h3 className="text-xl font-semibold text-slate-700">Your wishlist is empty</h3>
                        <p className="text-slate-500 mt-2">Save items you love here to easily find them later.</p>
                        <Link to="/shop" className="mt-6 inline-block px-6 py-2 bg-pink-500 text-white font-bold rounded-full hover:bg-pink-600 transition-colors">
                            Explore Products
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {wishlistItems.map((product) => (
                            <div key={product._id} className="group relative bg-white border border-slate-100 rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-pink-100 transition-all duration-300 transform hover:-translate-y-1 flex flex-col">
                                <Link to={`/product/${product._id}`} className="block relative">
                                    <div className="aspect-square bg-slate-50 relative p-6 flex flex-col items-center justify-center overflow-hidden">
                                        {product.images && product.images[0] ? (
                                            <img
                                                src={product.images[0].url}
                                                alt={product.name}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="w-32 h-32 rounded-full bg-pink-100 opacity-50 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 group-hover:scale-110 transition-transform duration-500"></div>
                                        )}
                                    </div>
                                </Link>

                                <button
                                    onClick={() => removeFromWishlist(product._id)}
                                    className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-2 rounded-full text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-colors shadow-sm z-10"
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
                                        <Star size={16} fill="currentColor" className="text-slate-200" />
                                    </div>
                                    {product.brand && (
                                        <span className="block text-[10px] font-bold tracking-widest text-pink-500 uppercase mb-1">
                                            {product.brand.name || product.brand}
                                        </span>
                                    )}
                                    <Link to={`/product/${product._id}`}>
                                        <h3 className="text-lg font-semibold text-slate-800 mb-1 hover:text-pink-600 transition-colors line-clamp-1">{product.name}</h3>
                                    </Link>
                                    <div className="mt-auto pt-4 flex flex-col gap-3">
                                        <div className="flex items-center">
                                            {window.Number(product.discountPrice) > 0 && window.Number(product.discountPrice) < window.Number(product.price) ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xl font-bold text-pink-600">{currency}{product.discountPrice.toFixed(2)}</span>
                                                    <span className="text-sm font-semibold text-slate-400 line-through">{currency}{product.price.toFixed(2)}</span>
                                                </div>
                                            ) : (
                                                <span className="text-xl font-bold text-slate-900">{currency}{product.price?.toFixed(2) || '0.00'}</span>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => handleAddToCart(product)}
                                            className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white rounded-xl py-3 font-semibold hover:bg-pink-600 transition-colors"
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
