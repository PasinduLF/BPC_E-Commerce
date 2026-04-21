import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Gift, ShoppingBag, Tag, ArrowRight, Sparkles, CheckCircle2, Heart, CreditCard } from 'lucide-react';
import { useCartStore } from '../context/useCartStore';
import { useConfigStore } from '../context/useConfigStore';
import { toast } from 'sonner';
import Breadcrumbs from '../components/Breadcrumbs';
import { getProductImageUrl } from '../utils/imageUtils';
import { useWishlistStore } from '../context/useWishlistStore';
import { useAuthStore } from '../context/useAuthStore';
import { hasBundleStock } from '../utils/stockUtils';
import { formatSoldCount } from '../utils/salesUtils';

const Bundles = () => {
    const { config } = useConfigStore();
    const currency = config?.currencySymbol || '$';
    const { addBundleToCart, setBuyNowItem, cartItems } = useCartStore();
    const { isInWishlist, toggleWishlist } = useWishlistStore();
    const { userInfo } = useAuthStore();
    const navigate = useNavigate();

    const [bundles, setBundles] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBundles = async () => {
            try {
                const { data } = await axios.get('/api/bundles');
                setBundles(data);
            } catch (error) {
                console.error('Failed to load bundles:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchBundles();
    }, []);

    const isBundleInCart = (bundleId) =>
        cartItems.some((item) => item.cartId === `bundle-${bundleId}`);

    const handleAddBundle = (bundle) => {
        if (!hasBundleStock(bundle, 1)) {
            toast.error('This bundle is out of stock.');
            return;
        }

        if (isBundleInCart(bundle._id)) {
            toast.info(`"${bundle.name}" is already in your cart.`);
            return;
        }
        const ok = addBundleToCart(bundle);
        if (!ok) {
            toast.error('This bundle is out of stock.');
            return;
        }
        toast.success(`"${bundle.name}" added to cart!`);
    };

    const toBundleCartItem = (bundle) => ({
        _id: bundle._id,
        name: bundle.name,
        image: bundle.image?.url || '',
        bundlePrice: Number(bundle.bundlePrice || 0),
        products: bundle.products || [],
        isBundle: true,
        qty: 1,
    });

    const handleBuyNow = (bundle) => {
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

    const handleToggleWishlist = (bundle) => {
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
    };

    const getSavings = (bundle) => {
        const orig = Number(bundle.originalPrice || 0);
        const sale = Number(bundle.bundlePrice || 0);
        return orig > sale ? orig - sale : 0;
    };

    const getSavingsPct = (bundle) => {
        const orig = Number(bundle.originalPrice || 0);
        const saved = getSavings(bundle);
        return orig > 0 && saved > 0 ? Math.round((saved / orig) * 100) : 0;
    };

    return (
        <div className="bg-page min-h-screen py-12 animate-fade-in">
            <div className="max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-6 animate-slide-up">
                <Breadcrumbs />

                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-black text-primary mb-3">
                            Bundle <span className="text-brand">Deals</span>
                        </h1>
                        <p className="text-base sm:text-lg text-secondary font-medium max-w-2xl">
                            Curated product sets at better value, designed to simplify your routine.
                        </p>
                    </div>
                    <Link
                        to="/shop"
                        className="inline-flex items-center gap-2 text-brand font-bold hover:brightness-90 transition-colors"
                    >
                        Explore Individual Products <ArrowRight size={18} />
                    </Link>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="bg-surface border border-default rounded-3xl overflow-hidden">
                                <div className="skeleton aspect-video w-full" />
                                <div className="p-5 space-y-3">
                                    <div className="skeleton h-5 w-2/3 rounded" />
                                    <div className="skeleton h-4 w-full rounded" />
                                    <div className="skeleton h-4 w-4/5 rounded" />
                                    <div className="skeleton h-10 w-full rounded-lg mt-4" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : bundles.length === 0 ? (
                    <div className="text-center py-20 bg-surface rounded-3xl border border-default">
                        <div className="w-16 h-16 bg-brand-subtle rounded-full flex items-center justify-center mx-auto mb-4">
                            <Gift size={28} className="text-brand" />
                        </div>
                        <h3 className="text-lg font-semibold text-primary">No bundle offers yet</h3>
                        <p className="text-secondary mt-1 text-sm max-w-md mx-auto">
                            We're preparing amazing bundle deals for you. Check back soon!
                        </p>
                        <Link to="/shop" className="btn-primary inline-flex items-center gap-2 mt-5">
                            Browse All Products <ArrowRight size={16} />
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-12">
                        {/* Featured Bundles */}
                        {bundles.some(b => b.isFeatured) && (
                            <div>
                                <div className="flex items-center gap-2 mb-6">
                                    <Sparkles size={18} className="text-brand" />
                                    <h2 className="text-xl sm:text-2xl font-bold text-primary">Featured Deals</h2>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {bundles.filter(b => b.isFeatured).map((bundle) => (
                                        <BundleCard
                                            key={bundle._id}
                                            bundle={bundle}
                                            currency={currency}
                                            savings={getSavings(bundle)}
                                            savingsPct={getSavingsPct(bundle)}
                                            inCart={isBundleInCart(bundle._id)}
                                            inWishlist={isInWishlist(bundle._id, true)}
                                            onAddToCart={() => handleAddBundle(bundle)}
                                            onBuyNow={() => handleBuyNow(bundle)}
                                            onToggleWishlist={() => handleToggleWishlist(bundle)}
                                            featured
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* All Bundles */}
                        {bundles.some(b => !b.isFeatured) && (
                            <div>
                                {bundles.some(b => b.isFeatured) && (
                                    <h2 className="text-xl sm:text-2xl font-bold text-primary mb-6">All Bundle Offers</h2>
                                )}
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {bundles.filter(b => !b.isFeatured).map((bundle) => (
                                        <BundleCard
                                            key={bundle._id}
                                            bundle={bundle}
                                            currency={currency}
                                            savings={getSavings(bundle)}
                                            savingsPct={getSavingsPct(bundle)}
                                            inCart={isBundleInCart(bundle._id)}
                                            inWishlist={isInWishlist(bundle._id, true)}
                                            onAddToCart={() => handleAddBundle(bundle)}
                                            onBuyNow={() => handleBuyNow(bundle)}
                                            onToggleWishlist={() => handleToggleWishlist(bundle)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const BundleCard = ({ bundle, currency, savings, savingsPct, inCart, inWishlist, onAddToCart, onBuyNow, onToggleWishlist, featured }) => (
    (() => {
        const isOutOfStock = !hasBundleStock(bundle, 1);

        return (
    <div className={`group bg-surface border rounded-3xl overflow-hidden hover:shadow-lg transition-all duration-200 flex flex-col ${featured ? 'border-brand/30' : 'border-default'}`}>
        {/* Bundle image */}
        <div className="relative aspect-video bg-page overflow-hidden">
            {bundle.image?.url && !bundle.image.url.includes('via.placeholder.com') ? (
                <img
                    src={bundle.image.url}
                    alt={bundle.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-tertiary">
                    <Gift size={34} className="text-brand opacity-40" />
                    <span className="text-sm font-medium text-secondary">Bundle Offer</span>
                </div>
            )}
            {isOutOfStock && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">Out of Stock</span>
                </div>
            )}

            {/* Badges */}
            <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
                {featured && (
                    <span className="inline-flex items-center gap-1 bg-brand text-on-brand text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-sm">
                        <Sparkles size={10} /> Featured
                    </span>
                )}
            </div>
            {savingsPct > 0 && (
                <span className="absolute top-3 right-3 bg-error text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                    -{savingsPct}% OFF
                </span>
            )}

            <button
                type="button"
                onClick={onToggleWishlist}
                className="absolute bottom-3 right-3 bg-surface/90 backdrop-blur-sm p-2 rounded-full text-tertiary hover:text-brand transition-colors shadow-sm"
                title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            >
                <Heart size={16} className={inWishlist ? 'fill-brand text-brand' : ''} />
            </button>
        </div>

        {/* Bundle info */}
        <div className="p-4 sm:p-5 flex flex-col flex-1">
            <h3 className="font-bold text-primary text-base leading-tight group-hover:text-brand transition-colors">
                {bundle.name}
            </h3>
            {Number(bundle.soldCount || 0) > 0 && (
                <p className="text-xs font-semibold text-tertiary mt-1">
                    {formatSoldCount(bundle.soldCount)} sold
                </p>
            )}
            {bundle.description && (
                <p className="text-secondary text-sm mt-1.5 line-clamp-2">
                    {bundle.description}
                </p>
            )}

            {/* Included products */}
            {bundle.products?.length > 0 && (
                <div className="mt-4 space-y-1.5">
                    <p className="text-xs font-semibold text-tertiary uppercase tracking-wider">Includes</p>
                    {bundle.products.map((bp, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                            <CheckCircle2 size={13} className="text-brand flex-shrink-0" />
                            <span className="text-sm text-secondary line-clamp-1">
                                {bp.product?.name || 'Product'}
                                {bp.qty > 1 && <span className="text-tertiary ml-1">×{bp.qty}</span>}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* Price */}
            <div className="mt-4 pt-4 border-t border-default flex items-end justify-between">
                <div>
                    <span className="text-xl sm:text-2xl font-bold text-brand">
                        {currency}{Number(bundle.bundlePrice).toFixed(2)}
                    </span>
                    {Number(bundle.originalPrice) > Number(bundle.bundlePrice) && (
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-tertiary text-sm line-through">
                                {currency}{Number(bundle.originalPrice).toFixed(2)}
                            </span>
                            {savings > 0 && (
                                <span className="text-success text-xs font-semibold">
                                    Save {currency}{savings.toFixed(2)}
                                </span>
                            )}
                        </div>
                    )}
                </div>
                <Tag size={16} className="text-tertiary mb-1" />
            </div>

            {/* CTA */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {inCart ? (
                    <Link
                        to="/cart"
                        className="w-full sm:col-span-2 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-sm bg-success-bg text-success border border-success/30 hover:bg-success hover:text-white transition-colors"
                    >
                        <CheckCircle2 size={16} /> View in Cart
                    </Link>
                ) : (
                    <>
                        <button
                            onClick={onAddToCart}
                            disabled={isOutOfStock}
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-sm btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ShoppingBag size={16} />
                            {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                        </button>
                        <button
                            onClick={onBuyNow}
                            disabled={isOutOfStock}
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-sm border border-default text-primary hover:border-brand hover:text-brand transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <CreditCard size={16} />
                            Buy Now
                        </button>
                    </>
                )}
            </div>
        </div>
    </div>
        );
    })()
);

export default Bundles;
