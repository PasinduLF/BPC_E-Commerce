import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Star, ShoppingBag, Filter } from 'lucide-react';
import { useConfigStore } from '../context/useConfigStore';

const Shop = () => {
    const { config } = useConfigStore();
    const currency = config?.currencySymbol || '$';

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const { data } = await axios.get('http://localhost:5000/api/products');
                setProducts(data.products);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching products:', error);
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    return (
        <div className="bg-slate-50 min-h-screen py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Our Collection</h1>
                        <p className="text-slate-500 mt-2">Discover our full range of premium cosmetics.</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white rounded-lg text-slate-600 hover:text-pink-600 hover:border-pink-300 transition-all shadow-sm">
                            <Filter size={18} />
                            <span className="font-medium">Filter</span>
                        </button>

                        <select className="border border-slate-200 bg-white rounded-lg px-4 py-2 text-slate-600 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none shadow-sm cursor-pointer hover:border-pink-300 transition-all">
                            <option>Featured</option>
                            <option>Price: Low to High</option>
                            <option>Price: High to Low</option>
                            <option>Newest Arrivals</option>
                        </select>
                    </div>
                </div>

                {/* Product Grid */}
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {products.map((product) => (
                            <div key={product._id} className="group relative bg-white border border-slate-100 rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-pink-100 transition-all duration-300 transform hover:-translate-y-1">
                                <Link to={`/product/${product._id}`} className="block">
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
                                        <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold text-pink-600">
                                            Top Rated
                                        </div>
                                    </div>
                                </Link>
                                <div className="p-5">
                                    <div className="flex items-center gap-1 text-yellow-400 mb-2">
                                        <Star size={16} fill="currentColor" />
                                        <Star size={16} fill="currentColor" />
                                        <Star size={16} fill="currentColor" />
                                        <Star size={16} fill="currentColor" />
                                        <Star size={16} fill="currentColor" className="text-slate-200" />
                                        <span className="text-slate-400 text-xs ml-1">(12)</span>
                                    </div>
                                    {product.brand && (
                                        <span className="block text-[10px] font-bold tracking-widest text-pink-500 uppercase mb-1">
                                            {product.brand.name}
                                        </span>
                                    )}
                                    <Link to={`/product/${product._id}`}>
                                        <h3 className="text-lg font-semibold text-slate-800 mb-1 hover:text-pink-600 transition-colors line-clamp-1">{product.name}</h3>
                                    </Link>
                                    <p className="text-sm text-slate-500 mb-4 capitalize line-clamp-1">{product.category ? product.category.name : 'Uncategorized'}</p>
                                    <div className="flex items-center justify-between mt-2">
                                        <div className="flex flex-col">
                                            {window.Number(product.discountPrice) > 0 && window.Number(product.discountPrice) < window.Number(product.price) ? (
                                                <>
                                                    <span className="text-xl font-bold text-pink-600">{currency}{product.discountPrice.toFixed(2)}</span>
                                                    <span className="text-sm font-semibold text-slate-400 line-through">{currency}{product.price.toFixed(2)}</span>
                                                </>
                                            ) : (
                                                <span className="text-xl font-bold text-slate-900">{currency}{product.price?.toFixed(2) || '0.00'}</span>
                                            )}
                                        </div>
                                        <button className="bg-pink-50 hover:bg-pink-100 text-pink-600 p-2 rounded-full transition-colors self-end">
                                            <ShoppingBag size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {!loading && products.length === 0 && (
                    <div className="text-center py-24 bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <ShoppingBag size={48} className="mx-auto text-slate-300 mb-4" />
                        <h3 className="text-xl font-semibold text-slate-700">No products found</h3>
                        <p className="text-slate-500 mt-2">Check back later for new arrivals.</p>
                    </div>
                )}

            </div>
        </div>
    );
};

export default Shop;
