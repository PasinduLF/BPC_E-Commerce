import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Star, ShoppingBag, Filter, Heart, ChevronRight } from 'lucide-react';
import Breadcrumbs from '../components/Breadcrumbs';
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
    const [selectedInnerSubcategories, setSelectedInnerSubcategories] = useState([]); // New Level 3
    const [selectedBrands, setSelectedBrands] = useState([]);
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [inStockOnly, setInStockOnly] = useState(false);
    const [sort, setSort] = useState('newest');
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState('');
    const location = useLocation();

    // Sync state with URL when navigating from Navbar
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const category = params.get('category');
        const subcategory = params.get('subcategory');
        const innerSubcategory = params.get('innerSubcategory');
        const search = params.get('search');
        
        if (category) setSelectedCategories([category]);
        else setSelectedCategories([]);

        if (subcategory) setSelectedSubcategories([subcategory]);
        else setSelectedSubcategories([]);

        if (innerSubcategory) setSelectedInnerSubcategories([innerSubcategory]);
        else setSelectedInnerSubcategories([]);
        
        if (search) setSearchKeyword(search);
        else setSearchKeyword('');
    }, [location.search]);

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
                if (searchKeyword) url += `&keyword=${encodeURIComponent(searchKeyword)}`;
                if (selectedCategories.length > 0) url += `&category=${selectedCategories.join(',')}`;
                if (selectedSubcategories.length > 0) url += `&subcategory=${selectedSubcategories.join(',')}`;
                if (selectedInnerSubcategories.length > 0) url += `&innerSubcategory=${selectedInnerSubcategories.join(',')}`;
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
    }, [selectedCategories, selectedSubcategories, selectedInnerSubcategories, selectedBrands, minPrice, maxPrice, inStockOnly, sort, searchKeyword]);

    // Handle Category change
    const handleCategoryChange = (catId) => {
        setSelectedCategories(prev => {
            if (prev.includes(catId)) {
                // Remove category & its descendants
                const categoryObj = categories.find(c => c._id === catId);
                if (categoryObj && categoryObj.subcategories) {
                    const subIdsToRemove = categoryObj.subcategories.map(s => s._id);
                    setSelectedSubcategories(prevSubs => prevSubs.filter(subId => !subIdsToRemove.includes(subId)));
                    // Also clear inner items for good measure
                    setSelectedInnerSubcategories([]); 
                }
                return prev.filter(id => id !== catId);
            } else {
                return [...prev, catId];
            }
        });
    };

    const handleSubcategoryChange = (subId) => {
        setSelectedSubcategories(prev => {
            if (prev.includes(subId)) {
                // Clear level 3 too
                setSelectedInnerSubcategories([]);
                return prev.filter(id => id !== subId);
            } else {
                return [...prev, subId];
            }
        });
    };

    const handleInnerSubcategoryChange = (subId) => {
        setSelectedInnerSubcategories(prev => {
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
        <div className="bg-page min-h-screen py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-primary tracking-tight">
                            {searchKeyword ? `Search Results for "${searchKeyword}"` : 'Our Collection'}
                        </h1>
                        <p className="text-secondary mt-2">
                            {searchKeyword ? 'Find what you are looking for.' : 'Discover our full range of premium cosmetics.'}
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setShowMobileFilters(!showMobileFilters)}
                            className="md:hidden flex items-center gap-2 px-4 py-2 border border-default bg-surface rounded-lg text-secondary hover:text-brand hover:border-brand transition-all shadow-sm"
                        >
                            <Filter size={18} />
                            <span className="font-medium">Filter</span>
                        </button>

                        <select
                            value={sort}
                            onChange={(e) => setSort(e.target.value)}
                            className="border border-default bg-surface rounded-lg px-4 py-2 text-secondary focus:ring-2 focus:ring-brand focus:border-brand outline-none shadow-sm cursor-pointer hover:border-brand transition-all"
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
                        <div className="bg-surface p-5 rounded-2xl border border-default shadow-sm">
                            <h3 className="font-bold text-primary tracking-wide mb-4 flex items-center justify-between pb-3 border-b border-default">
                                Categories
                                {(selectedCategories.length > 0 || selectedSubcategories.length > 0 || selectedInnerSubcategories.length > 0) && (
                                    <button onClick={() => { setSelectedCategories([]); setSelectedSubcategories([]); setSelectedInnerSubcategories([]); }} className="text-[10px] text-brand hover:underline">Clear</button>
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
                                                        className="w-4 h-4 text-brand border-default rounded focus:ring-brand cursor-pointer"
                                                    />
                                                </div>
                                                <span className={`text-sm font-medium transition-colors ${isSelected ? 'text-brand' : 'text-primary group-hover:text-brand'}`}>
                                                    {category.name}
                                                </span>
                                            </label>

                                            {/* Nested Subcategories */}
                                            {isSelected && category.subcategories && category.subcategories.length > 0 && (
                                                <ul className="ml-6 mt-2 space-y-2 border-l-2 border-default pl-4 animate-fade-in-up">
                                                    {category.subcategories.map(sub => {
                                                        const isSubSelected = selectedSubcategories.includes(sub._id);
                                                        return (
                                                            <li key={sub._id} className="flex flex-col">
                                                                <label className="flex items-center gap-3 cursor-pointer group">
                                                                    <div className="relative flex items-center">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={isSubSelected}
                                                                            onChange={() => handleSubcategoryChange(sub._id)}
                                                                            className="w-3.5 h-3.5 text-brand border-default rounded focus:ring-brand cursor-pointer"
                                                                        />
                                                                    </div>
                                                                    <span className={`text-sm transition-colors ${isSubSelected ? 'text-brand font-medium' : 'text-secondary group-hover:text-primary'}`}>
                                                                        {sub.name}
                                                                    </span>
                                                                </label>

                                                                {/* Inner Subcategories (Level 3) */}
                                                                {isSubSelected && sub.nestedSubcategories && sub.nestedSubcategories.length > 0 && (
                                                                    <ul className="ml-4 mt-1.5 space-y-1.5 border-l border-brand/20 pl-4 animate-fade-in">
                                                                        {sub.nestedSubcategories.map((nested, nIdx) => {
                                                                            const isNestedSelected = selectedInnerSubcategories.includes(nested._id);
                                                                            return (
                                                                                <li key={nested._id || nIdx}>
                                                                                    <label className="flex items-center gap-2 cursor-pointer group">
                                                                                        <input
                                                                                            type="checkbox"
                                                                                            checked={isNestedSelected}
                                                                                            onChange={() => handleInnerSubcategoryChange(nested._id)}
                                                                                            className="w-3 h-3 text-brand/70 border-default rounded-sm focus:ring-brand cursor-pointer"
                                                                                        />
                                                                                        <span className={`text-xs transition-colors ${isNestedSelected ? 'text-brand font-bold' : 'text-tertiary group-hover:text-secondary'}`}>
                                                                                            {nested.name}
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
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>

                        {/* Brands */}
                        <div className="bg-surface p-5 rounded-2xl border border-default shadow-sm">
                            <h3 className="font-bold text-primary tracking-wide mb-4 flex items-center justify-between pb-3 border-b border-default">
                                Brands
                                {selectedBrands.length > 0 && (
                                    <button onClick={() => setSelectedBrands([])} className="text-[10px] text-brand hover:underline">Clear</button>
                                )}
                            </h3>
                            <ul className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                                {brands.map(brand => {
                                    const isBrandSelected = selectedBrands.includes(brand._id);
                                    return (
                                        <li key={brand._id}>
                                            <label className={`cursor-pointer transition-colors px-3 py-2 rounded-lg flex items-center gap-3 ${isBrandSelected ? 'bg-primary text-surface font-bold' : 'text-secondary hover:bg-muted'}`}>
                                                <input
                                                    type="checkbox"
                                                    checked={isBrandSelected}
                                                    onChange={() => handleBrandChange(brand._id)}
                                                    className="w-4 h-4 text-brand border-default rounded focus:ring-brand hidden" // Hide checkbox for modern button look
                                                />
                                                {brand.image && (
                                                    <div className="w-6 h-6 rounded bg-surface flex items-center justify-center p-0.5 shrink-0 overflow-hidden">
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
                        <div className="bg-surface p-5 rounded-2xl border border-default shadow-sm">
                            <h3 className="font-bold text-primary tracking-wide mb-4 flex items-center justify-between pb-3 border-b border-default">
                                Price ({currency})
                                {(minPrice || maxPrice) && (
                                    <button onClick={() => { setMinPrice(''); setMaxPrice(''); }} className="text-[10px] text-brand hover:underline">Clear</button>
                                )}
                            </h3>
                            <div className="flex items-center gap-3">
                                <input
                                    type="number"
                                    placeholder="Min"
                                    value={minPrice}
                                    onChange={(e) => setMinPrice(e.target.value)}
                                    className="w-full px-3 py-2 border border-default rounded-lg text-sm bg-surface text-primary focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                                    min="0"
                                />
                                <span className="text-tertiary">-</span>
                                <input
                                    type="number"
                                    placeholder="Max"
                                    value={maxPrice}
                                    onChange={(e) => setMaxPrice(e.target.value)}
                                    className="w-full px-3 py-2 border border-default rounded-lg text-sm bg-surface text-primary focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                                    min="0"
                                />
                            </div>
                        </div>

                        {/* Availability (Stock) */}
                        <div className="bg-surface p-5 rounded-2xl border border-default shadow-sm">
                            <h3 className="font-bold text-primary tracking-wide mb-4 pb-3 border-b border-default">
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
                                    <div className={`block w-10 h-6 rounded-full transition-colors ${inStockOnly ? 'bg-brand' : 'bg-muted group-hover:bg-default'}`}></div>
                                    <div className={`dot absolute left-1 top-1 bg-surface w-4 h-4 rounded-full transition-transform ${inStockOnly ? 'transform translate-x-4' : ''}`}></div>
                                </div>
                                <span className="text-sm font-medium text-primary">In Stock Only</span>
                            </label>
                        </div>
                    </div>

                    {/* Product Grid Area */}
                    <div className="lg:w-3/4 animate-slide-up-delayed-1">
                        <Breadcrumbs 
                            category={categories.find(c => selectedCategories.includes(c._id))}
                            subcategory={categories.find(c => selectedCategories.includes(c._id))?.subcategories?.find(s => selectedSubcategories.includes(s._id))}
                            innerSubcategory={selectedInnerSubcategories.length === 1 ? selectedInnerSubcategories[0] : null}
                        />
                        {loading ? (
                            <div className="flex justify-center items-center h-64">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                                {products.map((product) => (
                                    <div key={product._id} className="group relative bg-surface border border-default rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-brand-subtle/50 transition-all duration-300 transform hover:-translate-y-1 flex flex-col">
                                        <Link to={`/product/${product._id}`} className="block relative">
                                            <div className="aspect-square bg-muted relative p-6 flex flex-col items-center justify-center overflow-hidden">
                                                {product.images && product.images[0] ? (
                                                    <img
                                                        src={product.images[0].url}
                                                        alt={product.name}
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                    />
                                                ) : (
                                                    <div className="w-32 h-32 rounded-full bg-brand-subtle opacity-50 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 group-hover:scale-110 transition-transform duration-500"></div>
                                                )}
                                                <div className="absolute top-4 right-4 bg-surface/80 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold text-brand">
                                                    Top Rated
                                                </div>
                                            </div>
                                        </Link>
                                        <button
                                            onClick={(e) => { e.preventDefault(); toggleWishlist(product); }}
                                            className="absolute top-4 left-4 bg-surface/90 backdrop-blur-sm p-2 rounded-full shadow-sm z-10 transition-colors"
                                            title={isInWishlist(product._id) ? "Remove from Wishlist" : "Add to Wishlist"}
                                        >
                                            <Heart size={16} className={isInWishlist(product._id) ? "fill-brand text-brand" : "text-tertiary hover:text-brand"} />
                                        </button>

                                        <div className="p-5 flex flex-col flex-1">
                                            <div className="flex items-center gap-1 text-gold mb-2">
                                                <Star size={16} fill="currentColor" />
                                                <Star size={16} fill="currentColor" />
                                                <Star size={16} fill="currentColor" />
                                                <Star size={16} fill="currentColor" />
                                                <Star size={16} fill="currentColor" className="text-muted" />
                                                <span className="text-tertiary text-xs ml-1">(12)</span>
                                            </div>
                                            {product.brand && (
                                                <span className="block text-[10px] font-bold tracking-widest text-brand uppercase mb-1">
                                                    {product.brand.name}
                                                </span>
                                            )}
                                            <Link to={`/product/${product._id}`}>
                                                <h3 className="text-lg font-semibold text-primary mb-1 hover:text-brand transition-colors line-clamp-1">{product.name}</h3>
                                            </Link>
                                            <p className="text-sm text-secondary mb-4 capitalize line-clamp-1">{product.category ? product.category.name : 'Uncategorized'}</p>
                                            <div className="flex items-center justify-between mt-auto pt-4">
                                                <div className="flex flex-col">
                                                    {window.Number(product.discountPrice) > 0 && window.Number(product.discountPrice) < window.Number(product.price) ? (
                                                        <>
                                                            <span className="text-xl font-bold text-brand">{currency}{product.discountPrice.toFixed(2)}</span>
                                                            <span className="text-sm font-semibold text-tertiary line-through">{currency}{product.price.toFixed(2)}</span>
                                                        </>
                                                    ) : (
                                                        <span className="text-xl font-bold text-primary">{currency}{product.price?.toFixed(2) || '0.00'}</span>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => addToCart({ ...product, qty: 1 })}
                                                    className="bg-brand-subtle hover:bg-brand text-brand hover:text-on-brand p-2 rounded-full transition-colors self-end"
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
                            <div className="text-center py-24 bg-surface rounded-2xl border border-default shadow-sm w-full">
                                <ShoppingBag size={48} className="mx-auto text-tertiary mb-4" />
                                <h3 className="text-xl font-semibold text-primary">No products found</h3>
                                <p className="text-secondary mt-2">Check back later or try adjusting your filters.</p>
                                {(selectedCategories.length > 0 || selectedBrands.length > 0 || minPrice || maxPrice || inStockOnly) && (
                                    <button
                                        onClick={() => {
                                            setSelectedCategories([]);
                                            setSelectedSubcategories([]);
                                            setSelectedInnerSubcategories([]);
                                            setSelectedBrands([]);
                                            setMinPrice('');
                                            setMaxPrice('');
                                            setInStockOnly(false);
                                        }}
                                        className="mt-6 px-6 py-2 bg-brand-subtle text-brand font-bold rounded-full hover:bg-brand hover:text-on-brand transition-colors"
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
