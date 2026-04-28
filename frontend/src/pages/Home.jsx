import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Star, ShoppingBag, Heart, ShieldCheck, Truck, CreditCard, Mail, Sparkles, Award } from 'lucide-react';
import SEO from '../components/SEO';
import { getProductUrl, getShopUrl } from '../utils/slugUtils';
import axios from 'axios';
import { useConfigStore } from '../context/useConfigStore';
import { useWishlistStore } from '../context/useWishlistStore';
import { useCartStore } from '../context/useCartStore';
import { getProductImageUrl } from '../utils/imageUtils';
import { useAuthStore } from '../context/useAuthStore';
import { getFirstAvailableVariant, hasBundleStock, hasProductStock } from '../utils/stockUtils';
import { formatSoldCount } from '../utils/salesUtils';
import { toast } from 'sonner';

const Home = () => {
    const { config } = useConfigStore();
    const currency = config?.currencySymbol || '$';
    const navigate = useNavigate();
    
    const [trendingProducts, setTrendingProducts] = useState([]);
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [email, setEmail] = useState('');
    const [subscribed, setSubscribed] = useState(false);
    const [featuredBundles, setFeaturedBundles] = useState([]);

    const { isInWishlist, toggleWishlist } = useWishlistStore();
    const { addToCart, addBundleToCart, setBuyNowItem } = useCartStore();
    const { userInfo } = useAuthStore();

    const toBundleCartItem = (bundle) => ({
        _id: bundle._id,
        name: bundle.name,
        image: bundle.image?.url || '',
        bundlePrice: Number(bundle.bundlePrice || 0),
        products: bundle.products || [],
        isBundle: true,
        qty: 1,
    });

    const handleBundleBuyNow = (bundle) => {
        if (!hasBundleStock(bundle, 1)) {
            toast.error('This bundle is out of stock.');
            return;
        }

        const ok = setBuyNowItem(toBundleCartItem(bundle));
        if (!ok) {
            toast.error('This bundle is out of stock.');
            return;
        }

        if (userInfo) {
            navigate('/shipping');
        } else {
            navigate('/login?redirect=/shipping');
        }
    };

    const getBrandImageSrc = (brand) => {
        if (!brand?.image) return '';
        const img = typeof brand.image === 'string' ? brand.image : brand.image?.url;
        if (!img || img.includes('via.placeholder.com')) return '';
        return img;
    };

    const logoBrands = brands.filter((brand) => getBrandImageSrc(brand));
    const marqueeBrands = logoBrands.length > 0 ? [...logoBrands, ...logoBrands] : [];

    useEffect(() => {
        const fetchHomeData = async () => {
            try {
                // Fetch New Arrivals (Trending)
                const trendingRes = await axios.get('/api/products?sort=newest');
                setTrendingProducts(trendingRes.data.products.slice(0, 5));

                // Fetch Featured Products
                const featuredRes = await axios.get('/api/products?isFeatured=true');
                setFeaturedProducts(featuredRes.data.products.slice(0, 5));

                // Fetch Categories
                const catRes = await axios.get('/api/categories');
                setCategories(catRes.data.slice(0, 6)); // Top 6

                // Fetch Brands
                const brandRes = await axios.get('/api/brands');
                setBrands(brandRes.data);

                // Fetch Featured Bundles
                const bundleRes = await axios.get('/api/bundles');
                const activeFeatured = bundleRes.data.filter(b => b.isActive && b.isFeatured).slice(0, 4);
                setFeaturedBundles(activeFeatured);
            } catch (error) {
                console.error("Failed to load home data:", error);
            }
        };
        fetchHomeData();
    }, []);

    // Intersection Observer for Scroll Animations
    useEffect(() => {
        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.15
        };

        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        // Disconnect and reconnect observer when data changes to catch newly rendered elements
        const elements = document.querySelectorAll('.scroll-reveal');
        elements.forEach(el => observer.observe(el));

        return () => observer.disconnect();
    }, [categories, featuredProducts, trendingProducts, featuredBundles, brands]);

    const handleSubscribe = (e) => {
        e.preventDefault();
        if(email) {
            setSubscribed(true);
            setTimeout(() => setSubscribed(false), 3000);
            setEmail('');
        }
    };

    const ProductCard = ({ product, badgeName, badgeColor }) => (
        (() => {
            const defaultVariant = getFirstAvailableVariant(product);
            const canAdd = hasProductStock(product, 1, defaultVariant);

            return (
        <div key={product._id} className="group relative bg-surface border border-default rounded-3xl overflow-hidden hover:shadow-2xl hover:shadow-brand-subtle/50 transition-all duration-300 transform hover:-translate-y-1 flex flex-col">
            <Link to={getProductUrl(product)} className="block relative">
                <div className="aspect-square bg-muted relative p-6 flex flex-col items-center justify-center overflow-hidden">
                    <img
                        src={getProductImageUrl(product)}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
                    />
                    {!canAdd && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <span className="text-white font-bold text-lg">Out of Stock</span>
                        </div>
                    )}
                    {badgeName && (
                        <div className={`absolute top-4 right-4 bg-surface/90 backdrop-blur-sm px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${badgeColor}`}>
                            {badgeName}
                        </div>
                    )}
                </div>
            </Link>

            <button
                onClick={(e) => { e.preventDefault(); toggleWishlist(product); }}
                className="absolute top-4 left-4 bg-surface/90 backdrop-blur-sm p-2.5 rounded-full shadow-sm z-10 transition-colors hover:bg-brand-subtle"
                title={isInWishlist(product._id) ? "Remove from Wishlist" : "Add to Wishlist"}
            >
                <Heart size={16} className={isInWishlist(product._id) ? "fill-brand text-brand" : "text-tertiary hover:text-brand"} />
            </button>

            <div className="p-6 flex flex-col flex-1">
                <div className="flex items-center gap-1 text-gold mb-3">
                    <Star size={16} fill="currentColor" />
                    <Star size={16} fill="currentColor" />
                    <Star size={16} fill="currentColor" />
                    <Star size={16} fill="currentColor" />
                    <Star size={16} fill="currentColor" className="text-muted" />
                </div>
                {Number(product.soldCount || 0) > 0 && (
                    <p className="text-xs font-semibold text-tertiary mb-2">
                        {formatSoldCount(product.soldCount)} sold
                    </p>
                )}
                {product.brand && (
                    <span className="block text-[11px] font-bold tracking-widest text-brand uppercase mb-1.5">
                        {product.brand.name || product.brand}
                    </span>
                )}
                <Link to={getProductUrl(product)}>
                    <h3 className="text-xl font-bold text-primary mb-1 hover:text-brand transition-colors leading-snug break-words">{product.name}</h3>
                </Link>
                <p className="text-base font-medium text-secondary mb-4 capitalize line-clamp-1">{product.category ? product.category.name : 'Uncategorized'}</p>

                <div className="flex items-center justify-between mt-auto pt-4 border-t border-default">
                    <div className="flex flex-col">
                        {window.Number(product.discountPrice) > 0 && window.Number(product.discountPrice) < window.Number(product.price) ? (
                            <>
                                <span className="text-2xl font-black text-brand">{currency}{product.discountPrice.toFixed(2)}</span>
                                <span className="text-base font-semibold text-tertiary line-through">{currency}{product.price.toFixed(2)}</span>
                            </>
                        ) : (
                            <span className="text-2xl font-black text-primary">{currency}{product.price?.toFixed(2) || '0.00'}</span>
                        )}
                    </div>
                    <button
                        onClick={() => {
                            const ok = addToCart({ ...product, variant: defaultVariant || undefined, qty: 1 });
                            if (!ok) {
                                toast.error('This product is out of stock.');
                            }
                        }}
                        disabled={!canAdd}
                        className="bg-primary hover:bg-brand text-surface p-4 rounded-full transition-colors self-end shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ShoppingBag size={22} />
                    </button>
                </div>
            </div>
        </div>
            );
        })()
    );

    const BundleCard = ({ bundle }) => (
        (() => {
            const canBuyBundle = hasBundleStock(bundle, 1);

            return (
        <div key={bundle._id} className="group relative bg-surface border border-brand-subtle rounded-3xl overflow-hidden hover:shadow-2xl hover:shadow-brand-subtle/50 transition-all duration-500 transform hover:-translate-y-2 flex flex-col">
            <Link to="/bundles" className="block relative">
                <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                    <img
                        src={bundle.image?.url || getProductImageUrl({})}
                        alt={bundle.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-in-out"
                    />
                    {!canBuyBundle && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <span className="text-white font-bold text-lg">Out of Stock</span>
                        </div>
                    )}
                    <div className="absolute top-4 left-4 bg-brand text-on-brand px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                        Special Bundle
                    </div>
                </div>
            </Link>

            <button
                onClick={(e) => {
                    e.preventDefault();
                    toggleWishlist({
                        _id: bundle._id,
                        name: bundle.name,
                        image: bundle.image || { url: '' },
                        price: Number(bundle.bundlePrice || 0),
                        bundlePrice: Number(bundle.bundlePrice || 0),
                        originalPrice: Number(bundle.originalPrice || 0),
                        isBundle: true,
                        products: bundle.products || [],
                        bundleProducts: bundle.products || [],
                    });
                }}
                className="absolute top-4 left-4 bg-surface/90 backdrop-blur-sm p-2.5 rounded-full shadow-sm z-10 transition-colors hover:bg-brand-subtle"
                title={isInWishlist(bundle._id, true) ? 'Remove from Wishlist' : 'Add to Wishlist'}
            >
                <Heart size={16} className={isInWishlist(bundle._id, true) ? 'fill-brand text-brand' : 'text-tertiary hover:text-brand'} />
            </button>

            <div className="p-6 flex flex-col flex-1">
                <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={16} className="text-brand animate-pulse" />
                    <span className="text-[11px] font-black tracking-[0.2em] text-brand uppercase">Exclusive Deal</span>
                </div>
                {Number(bundle.soldCount || 0) > 0 && (
                    <p className="text-xs font-semibold text-tertiary mb-2">
                        {formatSoldCount(bundle.soldCount)} bundles sold
                    </p>
                )}
                
                <h3 className="text-xl font-bold text-primary mb-2 group-hover:text-brand transition-colors line-clamp-1">{bundle.name}</h3>
                <p className="text-sm text-secondary mb-6 line-clamp-2 leading-relaxed">
                    {bundle.description}
                </p>

                <div className="mt-auto space-y-4">
                    <div className="flex flex-col">
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-brand">{currency}{bundle.bundlePrice.toFixed(2)}</span>
                            {bundle.originalPrice > bundle.bundlePrice && (
                                <span className="text-base font-semibold text-tertiary line-through">{currency}{bundle.originalPrice.toFixed(2)}</span>
                            )}
                        </div>
                        {bundle.originalPrice > bundle.bundlePrice && (
                            <span className="text-[10px] font-bold text-success uppercase tracking-wider">
                                Save {currency}{(bundle.originalPrice - bundle.bundlePrice).toFixed(2)}
                            </span>
                        )}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <button
                            onClick={() => {
                                const ok = addBundleToCart(bundle);
                                if (!ok) {
                                    toast.error('This bundle is out of stock.');
                                }
                            }}
                            disabled={!canBuyBundle}
                            className="w-full bg-primary hover:bg-brand text-surface font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-primary/10 flex items-center justify-center gap-2 group-hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ShoppingBag size={18} />
                            {canBuyBundle ? 'Add to Cart' : 'Out of Stock'}
                        </button>
                        <button
                            onClick={() => handleBundleBuyNow(bundle)}
                            disabled={!canBuyBundle}
                            className="w-full border border-default text-primary hover:text-brand hover:border-brand py-3.5 rounded-2xl transition-all font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <CreditCard size={18} />
                            Buy Now
                        </button>
                    </div>
                </div>
            </div>
        </div>
            );
        })()
    );

    return (
        <div className="flex flex-col min-h-screen">
            <SEO
                title="Home"
                description="Shop premium beauty and cosmetics at Beauty P&C. Explore skincare, makeup, haircare, best sellers, new arrivals, and exclusive bundle deals with fast delivery and 100% authentic products."
                canonical="/"
                keywords="beauty products, cosmetics, skincare, makeup, haircare, premium beauty, beauty store online, Beauty P&C"
                structuredData={{
                    '@context': 'https://schema.org',
                    '@type': 'WebPage',
                    name: 'Beauty P&C – Premium Beauty & Cosmetics',
                    description: 'Shop premium beauty and cosmetics at Beauty P&C. Explore skincare, makeup, haircare, best sellers, new arrivals, and exclusive bundle deals.',
                    url: 'https://beautypandc.com/',
                    breadcrumb: {
                        '@type': 'BreadcrumbList',
                        itemListElement: [{
                            '@type': 'ListItem',
                            position: 1,
                            name: 'Home',
                            item: 'https://beautypandc.com/'
                        }]
                    }
                }}
            />

            {/* Hero Section */}
            <header className="relative bg-surface overflow-hidden border-b border-default animate-fade-in pt-12 pb-24 sm:pt-24 lg:pb-32">
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-[300px] h-[300px] sm:w-[600px] sm:h-[600px] rounded-full bg-gradient-to-tr from-brand-subtle to-brand opacity-30 blur-3xl mix-blend-multiply"></div>
                    <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-[220px] h-[220px] sm:w-[400px] sm:h-[400px] rounded-full bg-gradient-to-tr from-brand to-brand-subtle opacity-20 blur-3xl mix-blend-multiply"></div>
                </div>

                <div className="relative max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-6 text-center sm:text-left z-10">
                    <div className="lg:grid lg:grid-cols-2 lg:gap-12 items-center">
                        <div className="mb-12 lg:mb-0">
                            {config?.storefrontAppearance?.heroHighlight && (
                                <span className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-surface border border-brand-subtle text-brand text-sm font-bold tracking-widest mb-6 shadow-sm">
                                    <Sparkles size={14} />
                                    {config.storefrontAppearance.heroHighlight}
                                </span>
                            )}
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-primary tracking-tight leading-[1.05] mb-6 whitespace-pre-line">
                                {config?.storefrontAppearance?.heroTitle ? (
                                    config.storefrontAppearance.heroTitle.split('\n').map((line, i, arr) => (
                                        <span key={i}>
                                            {i === arr.length - 1 ? (
                                                <span className="text-brand">
                                                    {line}
                                                </span>
                                            ) : (
                                                <>{line}<br className="hidden sm:block" /></>
                                            )}
                                        </span>
                                    ))
                                ) : (
                                    <>
                                        Discover Your <br className="hidden sm:block" />
                                        <span className="text-brand">
                                            True Radiance
                                        </span>
                                    </>
                                )}
                            </h1>
                            <p className="mt-4 text-base sm:text-lg lg:text-xl text-secondary max-w-3xl mx-auto sm:mx-0 mb-10 leading-relaxed font-medium">
                                {config?.storefrontAppearance?.heroSubtitle || 'Premium cosmetics curated for your skin. Experience the perfect blend of natural ingredients and modern beauty science.'}
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center sm:justify-start">
                                <Link to="/shop" className="btn-primary flex items-center justify-center gap-2 text-xl px-10 py-5 shadow-xl">
                                    Shop Collection <ArrowRight size={22} />
                                </Link>
                                <Link to="/categories" className="bg-surface text-secondary hover:text-brand border-2 border-default font-bold py-5 px-10 rounded-full hover:border-brand transition-all shadow-sm flex items-center justify-center text-xl">
                                    Explore Categories
                                </Link>
                            </div>
                        </div>

                        <div className="hidden lg:block relative">
                            <div className="relative rounded-[2rem] overflow-hidden shadow-2xl shadow-primary/10 aspect-[4/4] bg-gradient-to-br from-brand-subtle to-surface flex items-center justify-center group transform rotate-3 hover:rotate-0 transition-transform duration-500 border-8 border-surface">
                                {config?.storefrontAppearance?.heroImage?.url ? (
                                    <img 
                                        src={config.storefrontAppearance.heroImage.url} 
                                        alt={config?.storefrontAppearance?.heroTitle || 'Beauty P&C Hero Showcase'} 
                                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                                    />
                                ) : (
                                    <>
                                        <div className="absolute inset-0 bg-brand/5 mix-blend-multiply"></div>
                                        <div className="text-center text-brand font-medium z-10">
                                            <span className="block text-4xl mb-4">✨</span>
                                            Hero Product Showcase
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Shop by Category */}
            {categories.length > 0 && (
                <section aria-label="Shop by Category" className="py-16 bg-page border-b border-default scroll-reveal">
                    <div className="max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-6">
                        <div className="flex items-end justify-between mb-12">
                            <div>
                                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-primary mb-3">Shop by Category</h2>
                                <p className="text-secondary font-medium">Explore our wide selection of beauty products</p>
                            </div>
                            <Link to="/categories" className="hidden sm:flex text-brand font-bold hover:brightness-90 items-center gap-1 transition-colors">
                                View All <ArrowRight size={18} />
                            </Link>
                        </div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
                            {categories.map((cat) => (
                                <Link key={cat._id} to={getShopUrl({ category: cat })} className="group relative rounded-3xl overflow-hidden aspect-[4/5] bg-muted flex flex-col justify-end">
                                    {cat.image && (
                                        <img src={typeof cat.image === 'string' ? cat.image : cat.image.url} alt={`${cat.name} - Beauty products category`} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="relative z-10 p-5 w-full text-center">
                                        <h3 className="text-surface font-bold text-lg leading-tight mb-1 group-hover:-translate-y-1 transition-transform">{cat.name}</h3>
                                        <span className="text-brand text-xs font-bold tracking-wider uppercase opacity-0 group-hover:opacity-100 group-hover:-translate-y-1 transition-all">Explore</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                        <Link to="/categories" className="sm:hidden mt-8 text-center w-full block text-brand font-bold hover:bg-brand-subtle py-3 rounded-xl transition-colors">
                            View All Categories
                        </Link>
                    </div>
                </section>
            )}

            {/* Featured / Best Sellers */}
            {featuredProducts.length > 0 && (
                <section className="py-24 bg-page border-y border-default scroll-reveal delay-100">
                    <div className="max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-6">
                        <div className="text-center mb-16">
                            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-primary mb-4">Best Sellers</h2>
                            <div className="w-16 h-1.5 bg-brand mx-auto rounded-full mb-4"></div>
                            <p className="text-secondary font-medium max-w-2xl mx-auto">Our most loved and highly rated products by customers like you.</p>
                        </div>

                        <div className="grid grid-cols-2 xl:grid-cols-5 gap-4 sm:gap-8">
                            {featuredProducts.map((product) => (
                                <ProductCard key={`featured-${product._id}`} product={product} badgeName="Best Seller" badgeColor="text-error" />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Featured Bundles */}
            {featuredBundles.length > 0 && (
                <section className="py-24 bg-surface relative overflow-hidden scroll-reveal">
                    <div className="absolute -right-40 top-40 w-96 h-96 bg-brand-subtle rounded-full blur-3xl opacity-50 z-0"></div>
                    <div className="max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-6 relative z-10">
                        <div className="flex items-end justify-between mb-12">
                            <div>
                                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-primary mb-3">Bundle Deals</h2>
                                <p className="text-secondary font-medium">Get our expert-curated beauty sets at unbeatable prices. Perfection in a package.</p>
                            </div>
                            <Link to="/bundles" className="hidden sm:flex text-brand font-bold hover:brightness-90 items-center gap-1 border border-brand-subtle rounded-full px-5 py-2 hover:bg-brand-subtle transition-colors">
                                View All <ArrowRight size={18} />
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-8">
                            {featuredBundles.map((bundle) => (
                                <BundleCard key={`home-bundle-${bundle._id}`} bundle={bundle} />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* New Arrivals */}
            {trendingProducts.length > 0 && (
                <section className="py-24 bg-surface relative overflow-hidden scroll-reveal">
                    <div className="absolute -left-40 top-40 w-96 h-96 bg-brand-subtle rounded-full blur-3xl opacity-50 z-0"></div>
                    <div className="max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-6 relative z-10">
                        <div className="flex items-end justify-between mb-12">
                            <div>
                                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-primary mb-3">New Arrivals</h2>
                                <p className="text-secondary font-medium">Be the first to try our latest additions</p>
                            </div>
                            <Link to="/shop?sort=newest" className="hidden sm:flex text-brand font-bold hover:brightness-90 items-center gap-1 border border-brand-subtle rounded-full px-5 py-2 hover:bg-brand-subtle transition-colors">
                                Shop New <ArrowRight size={18} />
                            </Link>
                        </div>

                        <div className="grid grid-cols-2 xl:grid-cols-5 gap-4 sm:gap-8">
                            {trendingProducts.map((product) => (
                                <ProductCard key={`new-${product._id}`} product={product} badgeName="New" badgeColor="text-brand" />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Value Proposition (Brand Values) */}
            <section className="bg-primary py-20 lg:py-24 text-surface relative scroll-reveal delay-100">
                <div className="absolute inset-0 opacity-5 pattern-dots text-surface"></div>
                <div className="max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-6 relative z-10">
                    <div className="text-center mb-16">
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-4 text-surface">Why Choose Beauty P&C</h2>
                        <p className="text-surface/70 font-medium max-w-2xl mx-auto">We are committed to providing you with the best experience and highest quality products.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-8">
                        <div className="text-center group">
                            <div className="w-16 h-16 bg-surface/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-brand group-hover:bg-brand group-hover:text-on-brand transition-all transform group-hover:-translate-y-2">
                                <Award size={32} />
                            </div>
                            <h4 className="text-lg font-bold mb-3 text-surface">Premium Quality</h4>
                            <p className="text-surface/70 text-sm leading-relaxed">Sourced from the finest natural ingredients, meticulously tested for your safety and satisfaction.</p>
                        </div>
                        <div className="text-center group">
                            <div className="w-16 h-16 bg-surface/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-brand group-hover:bg-brand group-hover:text-on-brand transition-all transform group-hover:-translate-y-2">
                                <Truck size={32} />
                            </div>
                            <h4 className="text-lg font-bold mb-3 text-surface">Fast Delivery</h4>
                            <p className="text-surface/70 text-sm leading-relaxed">Swift and reliable shipping nationwide. {config?.freeShippingThreshold > 0 ? `Free on orders over ${currency}${config.freeShippingThreshold}.` : 'Standard rates apply.'}</p>
                        </div>
                        <div className="text-center group">
                            <div className="w-16 h-16 bg-surface/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-brand group-hover:bg-brand group-hover:text-on-brand transition-all transform group-hover:-translate-y-2">
                                <ShieldCheck size={32} />
                            </div>
                            <h4 className="text-lg font-bold mb-3 text-surface">Verified Authentic</h4>
                            <p className="text-surface/70 text-sm leading-relaxed">We guarantee 100% authenticity on all our products directly sourced from the manufacturers.</p>
                        </div>
                        <div className="text-center group">
                            <div className="w-16 h-16 bg-surface/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-brand group-hover:bg-brand group-hover:text-on-brand transition-all transform group-hover:-translate-y-2">
                                <CreditCard size={32} />
                            </div>
                            <h4 className="text-lg font-bold mb-3 text-surface">Secure Checkout</h4>
                            <p className="text-surface/70 text-sm leading-relaxed">Your data is safe with us. We use industry-standard encryption for all transactions.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Our Brands Section */}
            {logoBrands.length > 0 && (
                <section aria-label="Our Trusted Brands" className="py-16 bg-surface border-b border-default scroll-reveal overflow-hidden w-full">
                    <div className="w-full px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-primary mb-4">Our Trusted Brands</h2>
                            <p className="text-secondary font-medium">Discover the world's most luxurious beauty brands in one place.</p>
                        </div>
                        
                        <div className="brands-marquee opacity-75 hover:opacity-100 transition-opacity w-full">
                            <div className="brands-marquee-track">
                                {marqueeBrands.map((brand, index) => (
                                    <Link
                                        key={`${brand._id}-${index}`}
                                        to={getShopUrl({ brand: brand })}
                                        className="group relative block w-28 h-16 sm:w-36 sm:h-20 lg:w-44 lg:h-24 flex-shrink-0"
                                        aria-label={brand.name}
                                        title={brand.name}
                                    >
                                        <div className="w-full h-full rounded-2xl border border-default bg-white flex items-center justify-center p-3 shadow-sm">
                                            <img
                                                src={getBrandImageSrc(brand)}
                                                alt={brand.name}
                                                className="w-full h-full object-contain filter grayscale group-hover:grayscale-0 transition-all duration-300"
                                            />
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Newsletter Section */}
            <section aria-label="Newsletter Subscription" className="bg-brand text-on-brand py-20 relative overflow-hidden scroll-reveal">
                <div className="absolute right-0 top-0 w-64 h-64 bg-brand-subtle rounded-full blur-[100px] opacity-40"></div>
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-surface rounded-3xl shadow-xl shadow-brand-subtle/50 flex items-center justify-center mx-auto mb-8 border border-brand-subtle rotate-3">
                        <Mail size={32} className="text-brand -rotate-3" />
                    </div>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-primary mb-4">Join Our Beauty Club</h2>
                    <p className="text-secondary text-lg mb-10 max-w-2xl mx-auto">Subscribe to our newsletter and get 10% off your first purchase. Plus, be the first to know about new arrivals and exclusive sales!</p>
                    
                    {subscribed ? (
                        <div className="bg-success-bg border border-success text-success py-4 px-6 rounded-2xl font-bold inline-flex items-center gap-2 animate-fade-in-up">
                            <ShieldCheck size={20} /> Thank you for subscribing!
                        </div>
                    ) : (
                        <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
                            <input 
                                type="email" 
                                required 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email address" 
                                className="flex-1 px-6 py-4 rounded-full border border-default bg-surface shadow-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent text-primary font-medium"
                            />
                            <button type="submit" className="bg-primary hover:bg-brand text-surface font-bold py-4 px-8 rounded-full transition-colors shadow-lg shadow-brand-subtle/50 whitespace-nowrap">
                                Subscribe Now
                            </button>
                        </form>
                    )}
                </div>
            </section>

        </div>
    );
};

export default Home;
