import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Star, ShoppingBag, Filter, Heart, ChevronRight, ChevronLeft, XCircle, Eye } from 'lucide-react';
import Breadcrumbs from '../components/Breadcrumbs';
import QuickViewModal from '../components/QuickViewModal';
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
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [pageSize, setPageSize] = useState(12);
    const [quickViewProduct, setQuickViewProduct] = useState(null);
    const [showQuickView, setShowQuickView] = useState(false);

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
    const [filtersReady, setFiltersReady] = useState(false);
    const requestSequence = useRef(0);
    const location = useLocation();
    const navigate = useNavigate();

    // Sync state with URL when navigating from Navbar
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const category = params.get('category');
        const subcategory = params.get('subcategory');
        const innerSubcategory = params.get('innerSubcategory');
        const brand = params.get('brand');
        const search = params.get('search');
        const pageFromUrl = Number(params.get('page'));
        const pageSizeFromUrl = Number(params.get('pageSize'));
        
        if (category) setSelectedCategories([category]);
        else setSelectedCategories([]);

        if (subcategory) setSelectedSubcategories([subcategory]);
        else setSelectedSubcategories([]);

        if (innerSubcategory) setSelectedInnerSubcategories([innerSubcategory]);
        else setSelectedInnerSubcategories([]);

        if (brand) setSelectedBrands([brand]);
        else setSelectedBrands([]);
        
        if (search) setSearchKeyword(search);
        else setSearchKeyword('');

        if (pageFromUrl > 0) setPage(pageFromUrl);
        else setPage(1);

        if ([12, 24, 48].includes(pageSizeFromUrl)) {
            setPageSize(pageSizeFromUrl);
        } else {
            setPageSize(12);
        }

        setFiltersReady(true);
    }, [location.search]);

    useEffect(() => {
        if (!filtersReady) {
            return;
        }

        const params = new URLSearchParams(location.search);
        params.set('page', String(page));
        params.set('pageSize', String(pageSize));
        const nextSearch = params.toString();
        const currentSearch = location.search.replace(/^\?/, '');

        if (nextSearch !== currentSearch) {
            navigate(`/shop?${nextSearch}`, { replace: true });
        }
    }, [page, pageSize, filtersReady, location.search, navigate]);

    useEffect(() => {
        const fetchFilters = async () => {
            try {
                const [categoryRes, brandRes] = await Promise.all([
                    axios.get('/api/categories'),
                    axios.get('/api/brands')
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
        if (!filtersReady) {
            return;
        }

        const fetchProducts = async () => {
            const currentRequest = ++requestSequence.current;
            try {
                setLoading(true);
                let url = `/api/products?sort=${sort}&pageNumber=${page}&pageSize=${pageSize}`;
                if (searchKeyword) url += `&keyword=${encodeURIComponent(searchKeyword)}`;
                if (selectedCategories.length > 0) url += `&category=${selectedCategories.join(',')}`;
                if (selectedSubcategories.length > 0) url += `&subcategory=${selectedSubcategories.join(',')}`;
                if (selectedInnerSubcategories.length > 0) url += `&innerSubcategory=${selectedInnerSubcategories.join(',')}`;
                if (selectedBrands.length > 0) url += `&brand=${selectedBrands.join(',')}`;
                if (minPrice) url += `&minPrice=${minPrice}`;
                if (maxPrice) url += `&maxPrice=${maxPrice}`;
                if (inStockOnly) url += `&inStock=true`;

                const { data } = await axios.get(url);
                if (currentRequest !== requestSequence.current) {
                    return;
                }
                setProducts(data.products);
                setPages(data.pages || 1);
                setLoading(false);
            } catch (error) {
                if (currentRequest !== requestSequence.current) {
                    return;
                }
                console.error('Error fetching products:', error);
                setPages(1);
                setLoading(false);
            }
        };

        fetchProducts();
    }, [selectedCategories, selectedSubcategories, selectedInnerSubcategories, selectedBrands, minPrice, maxPrice, inStockOnly, sort, searchKeyword, filtersReady, page, pageSize]);

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

    const renderStars = (value, size = 16) => {
        const filled = Math.round(Number(value || 0));
        return Array.from({ length: 5 }).map((_, idx) => (
            <Star
                key={idx}
                size={size}
                fill={idx < filled ? 'currentColor' : 'none'}
                className={idx < filled ? 'text-gold' : 'text-muted'}
            />
        ));
    };

    const activeFilterCount = selectedCategories.length
        + selectedSubcategories.length
        + selectedInnerSubcategories.length
        + selectedBrands.length
        + (minPrice ? 1 : 0)
        + (maxPrice ? 1 : 0)
        + (inStockOnly ? 1 : 0);

    const categoryNameById = Object.fromEntries(categories.map((c) => [c._id, c.name]));
    const subcategoryNameById = Object.fromEntries(
        categories.flatMap((c) => (c.subcategories || []).map((s) => [s._id, s.name]))
    );
    const innerSubcategoryNameById = Object.fromEntries(
        categories.flatMap((c) =>
            (c.subcategories || []).flatMap((s) =>
                (s.nestedSubcategories || []).map((n) => [n._id, n.name])
            )
        )
    );
    const brandNameById = Object.fromEntries(brands.map((b) => [b._id, b.name]));

    const clearAllFilters = () => {
        setSelectedCategories([]);
        setSelectedSubcategories([]);
        setSelectedInnerSubcategories([]);
        setSelectedBrands([]);
        setMinPrice('');
        setMaxPrice('');
        setInStockOnly(false);
    };

    useEffect(() => {
        setPage(1);
    }, [selectedCategories, selectedSubcategories, selectedInnerSubcategories, selectedBrands, minPrice, maxPrice, inStockOnly, sort, searchKeyword]);

    useEffect(() => {
        if (page > pages) {
            setPage(Math.max(1, pages));
        }
    }, [page, pages]);

    const getPageItems = () => {
        if (pages <= 7) {
            return Array.from({ length: pages }, (_, i) => i + 1);
        }

        if (page <= 4) {
            return [1, 2, 3, 4, 5, 'ellipsis-end', pages];
        }

        if (page >= pages - 3) {
            return [1, 'ellipsis-start', pages - 4, pages - 3, pages - 2, pages - 1, pages];
        }

        return [1, 'ellipsis-start', page - 1, page, page + 1, 'ellipsis-end', pages];
    };

    const activeFilterChips = [
        ...selectedCategories.map((id) => ({ key: `cat-${id}`, label: `Category: ${categoryNameById[id] || 'Unknown'}`, onRemove: () => handleCategoryChange(id) })),
        ...selectedSubcategories.map((id) => ({ key: `sub-${id}`, label: `Subcategory: ${subcategoryNameById[id] || 'Unknown'}`, onRemove: () => handleSubcategoryChange(id) })),
        ...selectedInnerSubcategories.map((id) => ({ key: `inner-${id}`, label: `Inner: ${innerSubcategoryNameById[id] || 'Unknown'}`, onRemove: () => handleInnerSubcategoryChange(id) })),
        ...selectedBrands.map((id) => ({ key: `brand-${id}`, label: `Brand: ${brandNameById[id] || 'Unknown'}`, onRemove: () => handleBrandChange(id) })),
        ...(minPrice ? [{ key: 'min-price', label: `Min ${currency}${minPrice}`, onRemove: () => setMinPrice('') }] : []),
        ...(maxPrice ? [{ key: 'max-price', label: `Max ${currency}${maxPrice}`, onRemove: () => setMaxPrice('') }] : []),
        ...(inStockOnly ? [{ key: 'in-stock', label: 'In Stock Only', onRemove: () => setInStockOnly(false) }] : []),
    ];

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
                            className="lg:hidden flex items-center gap-2 px-4 py-2 border border-default bg-surface rounded-lg text-secondary hover:text-brand hover:border-brand transition-all shadow-sm"
                        >
                            <Filter size={18} />
                            <span className="font-medium">Filter{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}</span>
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

                        <select
                            value={pageSize}
                            onChange={(e) => {
                                setPage(1);
                                setPageSize(Number(e.target.value));
                            }}
                            className="border border-default bg-surface rounded-lg px-4 py-2 text-secondary focus:ring-2 focus:ring-brand focus:border-brand outline-none shadow-sm cursor-pointer hover:border-brand transition-all"
                        >
                            <option value={12}>12 / page</option>
                            <option value={24}>24 / page</option>
                            <option value={48}>48 / page</option>
                        </select>
                    </div>
                </div>

                {activeFilterChips.length > 0 && (
                    <div className="mb-6 flex flex-wrap items-center gap-2">
                        {activeFilterChips.map((chip) => (
                            <button
                                key={chip.key}
                                type="button"
                                onClick={chip.onRemove}
                                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-full bg-brand-subtle text-brand hover:bg-brand hover:text-on-brand transition-colors"
                            >
                                <span>{chip.label}</span>
                                <XCircle size={14} />
                            </button>
                        ))}
                        <button
                            type="button"
                            onClick={clearAllFilters}
                            className="px-3 py-1.5 text-xs font-semibold rounded-full border border-default text-secondary hover:text-brand hover:border-brand transition-colors"
                        >
                            Clear All
                        </button>
                    </div>
                )}

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Filters Sidebar */}
                    <div className={`lg:w-72 flex-shrink-0 space-y-8 sticky top-8 max-h-[calc(100vh-5rem)] overflow-y-auto ${showMobileFilters ? 'block' : 'hidden lg:block'}`}>
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
                    <div className="lg:flex-1 animate-slide-up-delayed-1">
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
                            <div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-8">
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
                                                {Number(product.rating || 0) >= 4 && (
                                                    <div className="absolute top-4 right-4 bg-surface/80 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold text-brand">
                                                        Top Rated
                                                    </div>
                                                )}
                                            </div>
                                        </Link>
                                        <button
                                            onClick={(e) => { e.preventDefault(); toggleWishlist(product); }}
                                            className="absolute top-4 left-4 bg-surface/90 backdrop-blur-sm p-2 rounded-full shadow-sm z-10 transition-colors"
                                            title={isInWishlist(product._id) ? "Remove from Wishlist" : "Add to Wishlist"}
                                        >
                                            <Heart size={16} className={isInWishlist(product._id) ? "fill-brand text-brand" : "text-tertiary hover:text-brand"} />
                                        </button>

                                        <button
                                            onClick={() => { setQuickViewProduct(product); setShowQuickView(true); }}
                                            className="absolute top-4 right-4 bg-surface/90 backdrop-blur-sm p-2 rounded-full shadow-sm z-10 hover:bg-brand hover:text-on-brand transition-colors"
                                            title="Quick View"
                                        >
                                            <Eye size={16} />
                                        </button>

                                        <div className="p-5 flex flex-col flex-1">
                                            <div className="flex items-center gap-1 text-gold mb-2">
                                                {renderStars(product.rating, 16)}
                                                <span className="text-tertiary text-xs ml-1">({product.numReviews || 0})</span>
                                            </div>
                                            {product.brand && (
                                                <span className="block text-[10px] font-bold tracking-widest text-brand uppercase mb-1">
                                                    {product.brand.name}
                                                </span>
                                            )}
                                            <Link to={`/product/${product._id}`}>
                                                <h3 className="text-lg font-semibold text-primary mb-1 hover:text-brand transition-colors leading-snug break-words">{product.name}</h3>
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
                                        onClick={clearAllFilters}
                                        className="mt-6 px-6 py-2 bg-brand-subtle text-brand font-bold rounded-full hover:bg-brand hover:text-on-brand transition-colors"
                                    >
                                        Clear All Filters
                                    </button>
                                )}
                            </div>
                        )}

                        {!loading && products.length > 0 && pages > 1 && (
                            <div className="mt-10 flex items-center justify-center gap-2 flex-wrap">
                                <button
                                    type="button"
                                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                                    disabled={page === 1}
                                    className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-default bg-surface text-secondary hover:text-brand hover:border-brand transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft size={16} />
                                    Prev
                                </button>

                                {getPageItems().map((item, idx) => {
                                    if (typeof item !== 'number') {
                                        return (
                                            <span key={`ellipsis-${idx}`} className="px-2 text-tertiary">...</span>
                                        );
                                    }

                                    return (
                                        <button
                                            key={item}
                                            type="button"
                                            onClick={() => setPage(item)}
                                            className={`min-w-10 px-3 py-2 rounded-lg border transition-colors ${page === item
                                                ? 'bg-brand text-on-brand border-brand'
                                                : 'bg-surface text-secondary border-default hover:text-brand hover:border-brand'
                                                }`}
                                        >
                                            {item}
                                        </button>
                                    );
                                })}

                                <button
                                    type="button"
                                    onClick={() => setPage((prev) => Math.min(prev + 1, pages))}
                                    disabled={page === pages}
                                    className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-default bg-surface text-secondary hover:text-brand hover:border-brand transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick View Modal */}
                <QuickViewModal 
                    product={quickViewProduct} 
                    onClose={() => setShowQuickView(false)} 
                    isOpen={showQuickView}
                />

            </div>
        </div>
    );
};

export default Shop;
