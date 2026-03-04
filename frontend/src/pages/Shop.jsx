import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Star, ShoppingBag, Filter, Heart } from 'lucide-react';
import { useConfigStore } from '../context/useConfigStore';
import { useWishlistStore } from '../context/useWishlistStore';
import { useCartStore } from '../context/useCartStore';

const Shop = () => {
    const { config } = useConfigStore();
    const currency = config?.currencySymbol || '$';

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);

    const { isInWishlist, toggleWishlist } = useWishlistStore();
    const { addToCart } = useCartStore();

    // Filter states
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedSubcategories, setSelectedSubcategories] = useState([]);
    const [selectedBrands, setSelectedBrands] = useState([]);
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [inStockOnly, setInStockOnly] = useState(false);
    const [sort, setSort] = useState('newest');
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    useEffect(() => {
        const fetchFilters = async () => {
            try {
                const [categoryRes, brandRes] = await Promise.all([
                    axios.get('http://localhost:5000/api/categories'),
                    axios.get('http://localhost:5000/api/brands')
                ]);
                setCategories(categoryRes.data);
                setBrands(brandRes.data);
            } catch (error) {
                console.error('Error fetching filter data:', error);
            }
        };
        fetchFilters();
    }, []);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                let url = `http://localhost:5000/api/products?sort=${sort}`;
                if (selectedCategories.length > 0) url += `&category=${selectedCategories.join(',')}`;
                if (selectedSubcategories.length > 0) url += `&subcategory=${selectedSubcategories.join(',')}`;
                if (selectedBrands.length > 0) url += `&brand=${selectedBrands.join(',')}`;
                if (minPrice) url += `&minPrice=${minPrice}`;
                if (maxPrice) url += `&maxPrice=${maxPrice}`;
                if (inStockOnly) url += `&inStock=true`;

                const { data } = await axios.get(url);
                setProducts(data.products);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching products:', error);
                setLoading(false);
            }
        };

        fetchProducts();
    }, [selectedCategories, selectedSubcategories, selectedBrands, minPrice, maxPrice, inStockOnly, sort]);

    // Handle Category change
    const handleCategoryChange = (catId) => {
        setSelectedCategories(prev => {
            if (prev.includes(catId)) {
                // Remove category
                const newCategories = prev.filter(id => id !== catId);
                // Also remove any subcategories belonging to this category
                const categoryObj = categories.find(c => c._id === catId);
                if (categoryObj && categoryObj.subcategories) {
                    const subIdsToRemove = categoryObj.subcategories.map(s => s._id);
                    setSelectedSubcategories(prevSubs => prevSubs.filter(subId => !subIdsToRemove.includes(subId)));
                }
                return newCategories;
            } else {
                return [...prev, catId];
            }
        });
    };

    // Handle Subcategory change
    const handleSubcategoryChange = (subId) => {
        setSelectedSubcategories(prev => {
            if (prev.includes(subId)) {
                return prev.filter(id => id !== subId);
            } else {
                return [...prev, subId];
            }
        });
    };

    // Handle Brand change
    const handleBrandChange = (brandId) => {
        setSelectedBrands(prev => {
            if (prev.includes(brandId)) {
                return prev.filter(id => id !== brandId);
            } else {
                return [...prev, brandId];
            }
        });
    };

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
                        <button
                            onClick={() => setShowMobileFilters(!showMobileFilters)}
                            className="md:hidden flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white rounded-lg text-slate-600 hover:text-pink-600 hover:border-pink-300 transition-all shadow-sm"
                        >
                            <Filter size={18} />
                            <span className="font-medium">Filter</span>
                        </button>

                        <select
                            value={sort}
                            onChange={(e) => setSort(e.target.value)}
                            className="border border-slate-200 bg-white rounded-lg px-4 py-2 text-slate-600 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none shadow-sm cursor-pointer hover:border-pink-300 transition-all"
                        >
                            <option value="newest">Newest Arrivals</option>
                            <option value="priceAsc">Price: Low to High</option>
                            <option value="priceDesc">Price: High to Low</option>
                        </select>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-8">
                    {/* Filters Sidebar */}
                    <div className={`md:w-64 flex-shrink-0 space-y-8 ${showMobileFilters ? 'block' : 'hidden md:block'}`}>
                        {/* Categories & Subcategories */}
                        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                            <h3 className="font-bold text-slate-800 tracking-wide mb-4 flex items-center justify-between pb-3 border-b border-slate-50">
                                Categories
                                {(selectedCategories.length > 0 || selectedSubcategories.length > 0) && (
                                    <button onClick={() => { setSelectedCategories([]); setSelectedSubcategories([]); }} className="text-[10px] text-pink-500 hover:underline">Clear</button>
                                )}
                            </h3>
                            <ul className="space-y-4">
                                {categories.map(category => {
                                    const isSelected = selectedCategories.includes(category._id);
                                    return (
                                        <li key={category._id} className="flex flex-col">
                                            <label className="flex items-center gap-3 cursor-pointer group mb-1">
                                                <div className="relative flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => handleCategoryChange(category._id)}
                                                        className="w-4 h-4 text-pink-600 border-slate-300 rounded focus:ring-pink-500 cursor-pointer"
                                                    />
                                                </div>
                                                <span className={`text-sm font-medium transition-colors ${isSelected ? 'text-pink-600' : 'text-slate-700 group-hover:text-pink-600'}`}>
                                                    {category.name}
                                                </span>
                                            </label>

                                            {/* Nested Subcategories */}
                                            {isSelected && category.subcategories && category.subcategories.length > 0 && (
                                                <ul className="ml-6 mt-2 space-y-2 border-l-2 border-slate-100 pl-4 animate-fade-in-up">
                                                    {category.subcategories.map(sub => {
                                                        const isSubSelected = selectedSubcategories.includes(sub._id);
                                                        return (
                                                            <li key={sub._id}>
                                                                <label className="flex items-center gap-3 cursor-pointer group">
                                                                    <div className="relative flex items-center">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={isSubSelected}
                                                                            onChange={() => handleSubcategoryChange(sub._id)}
                                                                            className="w-3.5 h-3.5 text-pink-500 border-slate-300 rounded focus:ring-pink-500 cursor-pointer"
                                                                        />
                                                                    </div>
                                                                    <span className={`text-sm transition-colors ${isSubSelected ? 'text-pink-600 font-medium' : 'text-slate-500 group-hover:text-slate-700'}`}>
                                                                        {sub.name}
                                                                    </span>
                                                                </label>
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>

                        {/* Brands */}
                        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                            <h3 className="font-bold text-slate-800 tracking-wide mb-4 flex items-center justify-between pb-3 border-b border-slate-50">
                                Brands
                                {selectedBrands.length > 0 && (
                                    <button onClick={() => setSelectedBrands([])} className="text-[10px] text-pink-500 hover:underline">Clear</button>
                                )}
                            </h3>
                            <ul className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                                {brands.map(brand => {
                                    const isBrandSelected = selectedBrands.includes(brand._id);
                                    return (
                                        <li key={brand._id}>
                                            <label className={`cursor-pointer transition-colors px-3 py-2 rounded-lg flex items-center gap-3 ${isBrandSelected ? 'bg-slate-900 text-white font-bold' : 'text-slate-600 hover:bg-slate-50'}`}>
                                                <input
                                                    type="checkbox"
                                                    checked={isBrandSelected}
                                                    onChange={() => handleBrandChange(brand._id)}
                                                    className="w-4 h-4 text-pink-600 border-slate-300 rounded focus:ring-pink-500 hidden" // Hide checkbox for modern button look
                                                />
                                                {brand.image && (
                                                    <div className="w-6 h-6 rounded bg-white flex items-center justify-center p-0.5 shrink-0 overflow-hidden">
                                                        <img src={brand.image} alt={brand.name} className="w-full h-full object-contain" />
                                                    </div>
                                                )}
                                                <span className="text-sm">{brand.name}</span>
                                            </label>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>

                        {/* Price Range */}
                        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                            <h3 className="font-bold text-slate-800 tracking-wide mb-4 flex items-center justify-between pb-3 border-b border-slate-50">
                                Price ({currency})
                                {(minPrice || maxPrice) && (
                                    <button onClick={() => { setMinPrice(''); setMaxPrice(''); }} className="text-[10px] text-pink-500 hover:underline">Clear</button>
                                )}
                            </h3>
                            <div className="flex items-center gap-3">
                                <input
                                    type="number"
                                    placeholder="Min"
                                    value={minPrice}
                                    onChange={(e) => setMinPrice(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                                    min="0"
                                />
                                <span className="text-slate-400">-</span>
                                <input
                                    type="number"
                                    placeholder="Max"
                                    value={maxPrice}
                                    onChange={(e) => setMaxPrice(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                                    min="0"
                                />
                            </div>
                        </div>

                        {/* Availability (Stock) */}
                        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                            <h3 className="font-bold text-slate-800 tracking-wide mb-4 pb-3 border-b border-slate-50">
                                Availability
                            </h3>
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className="relative flex items-center">
                                    <input
                                        type="checkbox"
                                        className="sr-only"
                                        checked={inStockOnly}
                                        onChange={(e) => setInStockOnly(e.target.checked)}
                                    />
                                    <div className={`block w-10 h-6 rounded-full transition-colors ${inStockOnly ? 'bg-pink-500' : 'bg-slate-200 group-hover:bg-slate-300'}`}></div>
                                    <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${inStockOnly ? 'transform translate-x-4' : ''}`}></div>
                                </div>
                                <span className="text-sm font-medium text-slate-700">In Stock Only</span>
                            </label>
                        </div>
                    </div>

                    {/* Product Grid Area */}
                    <div className="flex-1">
                        {loading ? (
                            <div className="flex justify-center items-center h-64">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                                {products.map((product) => (
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
                                                <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold text-pink-600">
                                                    Top Rated
                                                </div>
                                            </div>
                                        </Link>
                                        <button
                                            onClick={(e) => { e.preventDefault(); toggleWishlist(product); }}
                                            className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-sm z-10 transition-colors"
                                            title={isInWishlist(product._id) ? "Remove from Wishlist" : "Add to Wishlist"}
                                        >
                                            <Heart size={16} className={isInWishlist(product._id) ? "fill-pink-500 text-pink-500" : "text-slate-400 hover:text-pink-500"} />
                                        </button>

                                        <div className="p-5 flex flex-col flex-1">
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
                                            <div className="flex items-center justify-between mt-auto pt-4">
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
                                                <button
                                                    onClick={() => addToCart({ ...product, qty: 1 })}
                                                    className="bg-pink-50 hover:bg-pink-100 text-pink-600 p-2 rounded-full transition-colors self-end"
                                                >
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
                            <div className="text-center py-24 bg-white rounded-2xl border border-slate-100 shadow-sm w-full">
                                <ShoppingBag size={48} className="mx-auto text-slate-300 mb-4" />
                                <h3 className="text-xl font-semibold text-slate-700">No products found</h3>
                                <p className="text-slate-500 mt-2">Check back later or try adjusting your filters.</p>
                                {(selectedCategories.length > 0 || selectedBrands.length > 0 || minPrice || maxPrice || inStockOnly) && (
                                    <button
                                        onClick={() => {
                                            setSelectedCategories([]);
                                            setSelectedSubcategories([]);
                                            setSelectedBrands([]);
                                            setMinPrice('');
                                            setMaxPrice('');
                                            setInStockOnly(false);
                                        }}
                                        className="mt-6 px-6 py-2 bg-pink-100 text-pink-700 font-bold rounded-full hover:bg-pink-200 transition-colors"
                                    >
                                        Clear All Filters
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Shop;
