import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Star, ShoppingBag, Heart } from 'lucide-react';
import { useCartStore } from '../context/useCartStore';
import { useWishlistStore } from '../context/useWishlistStore';
import { useConfigStore } from '../context/useConfigStore';

const ProductRecommendations = ({ title = 'Recommended For You', excludeProductIds = [], limit = 8 }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { config } = useConfigStore();
    const currency = config?.currencySymbol || '$';
    const { addToCart } = useCartStore();
    const { isInWishlist, toggleWishlist } = useWishlistStore();

    useEffect(() => {
        const fetchRecommendations = async () => {
            try {
                // Fetch best-selling or top-rated products
                const { data } = await axios.get(`/api/products?sort=newest&pageSize=${limit}`);
                const filtered = data.products.filter(p => !excludeProductIds.includes(p._id));
                setProducts(filtered.slice(0, limit));
            } catch (error) {
                console.error('Error fetching recommendations:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchRecommendations();
    }, [limit, excludeProductIds]);

    if (loading) {
        return (
            <div className="space-y-4">
                <h3 className="text-2xl font-bold text-primary">{title}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-page rounded-2xl h-80"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (products.length === 0) {
        return null;
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-2xl font-bold text-primary mb-2">{title}</h3>
                <p className="text-secondary">Discover products you might love</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
                {products.map((product) => (
                    <div
                        key={product._id}
                        className="group relative bg-surface border border-default rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-brand-subtle/50 transition-all duration-300 transform hover:-translate-y-1 flex flex-col"
                    >
                        <Link to={`/product/${product._id}`} className="block relative">
                            <div className="aspect-square bg-page relative p-4 sm:p-6 flex flex-col items-center justify-center overflow-hidden">
                                {product.images && product.images[0] ? (
                                    <img
                                        src={product.images[0].url}
                                        alt={product.name}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-brand-subtle opacity-50"></div>
                                )}
                                {product.stock === 0 && (
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                        <span className="text-white font-bold text-lg">Out of Stock</span>
                                    </div>
                                )}
                            </div>
                        </Link>

                        <button
                            onClick={() => toggleWishlist(product._id)}
                            className={`absolute top-4 right-4 p-2 rounded-full transition-all shadow-sm z-10 ${
                                isInWishlist(product._id)
                                    ? 'bg-brand text-on-brand'
                                    : 'bg-surface/80 backdrop-blur-sm text-secondary hover:text-brand'
                            }`}
                        >
                            <Heart size={18} fill={isInWishlist(product._id) ? 'currentColor' : 'none'} />
                        </button>

                        <div className="p-4 flex flex-col flex-1">
                            {product.brand && (
                                <span className="block text-[10px] font-bold tracking-widest text-brand uppercase mb-1">
                                    {product.brand.name || product.brand}
                                </span>
                            )}
                            <Link to={`/product/${product._id}`}>
                                <h4 className="text-sm font-semibold text-primary hover:text-brand transition-colors line-clamp-2 mb-2">
                                    {product.name}
                                </h4>
                            </Link>

                            <div className="flex items-center gap-1 text-yellow-400 mb-3">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        size={12}
                                        fill={i < Math.round(product.rating || 0) ? 'currentColor' : 'none'}
                                    />
                                ))}
                                <span className="text-xs text-secondary ml-1">({product.numReviews || 0})</span>
                            </div>

                            <div className="mt-auto pt-3 flex items-center justify-between">
                                <div>
                                    <span className="text-sm font-bold text-brand">{currency}{product.discountPrice?.toFixed(2) || product.price?.toFixed(2)}</span>
                                    {product.discountPrice && product.discountPrice < product.price && (
                                        <span className="text-xs text-tertiary line-through ml-2">{currency}{product.price?.toFixed(2)}</span>
                                    )}
                                </div>
                                <button
                                    onClick={() => addToCart({ ...product, qty: 1 })}
                                    disabled={product.stock === 0}
                                    className="p-2 rounded-lg bg-brand-subtle text-brand hover:bg-brand hover:text-on-brand transition-all disabled:opacity-50"
                                >
                                    <ShoppingBag size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProductRecommendations;
