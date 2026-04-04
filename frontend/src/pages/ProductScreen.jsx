import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../context/useCartStore';
import { useWishlistStore } from '../context/useWishlistStore';
import axios from 'axios';
import { Star, Truck, ShieldCheck, ArrowLeft, Minus, Plus, ShoppingBag, Heart, CreditCard } from 'lucide-react';
import { useConfigStore } from '../context/useConfigStore';

const ProductScreen = () => {
    const { config } = useConfigStore();
    const currency = config?.currencySymbol || '$';

    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState({});
    const [loading, setLoading] = useState(true);
    const [qty, setQty] = useState(1);
    const [activeImage, setActiveImage] = useState(0);
    const [selectedVariant, setSelectedVariant] = useState(null);

    const { addToCart, setBuyNowItem } = useCartStore();
    const { isInWishlist, toggleWishlist } = useWishlistStore();

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const { data } = await axios.get(`http://localhost:5000/api/products/${id}`);
                setProduct(data);
                if (data.variants && data.variants.length > 0) {
                    setSelectedVariant(data.variants[0]);
                }
                setLoading(false);
            } catch (error) {
                console.error('Error fetching product:', error);
                setLoading(false);
            }
        };

        fetchProduct();
    }, [id]);

    const basePrice = (product.variants && product.variants.length > 0) ? (selectedVariant?.price || 0) : (product.price || 0);
    const discountPrice = (product.variants && product.variants.length > 0) ? (selectedVariant?.discountPrice || 0) : (product.discountPrice || 0);
    const hasDiscount = discountPrice > 0 && discountPrice < basePrice;

    const displayPrice = hasDiscount ? discountPrice : basePrice;

    const displayStock = (product.variants && product.variants.length > 0) ? (selectedVariant?.stock || 0) : product.stock;

    const addToCartHandler = () => {
        addToCart({
            ...product,
            price: displayPrice, // Save final resolved price
            variant: selectedVariant,
            qty
        });
        navigate('/cart');
    };

    const buyNowHandler = () => {
        setBuyNowItem({
            ...product,
            price: displayPrice,
            variant: selectedVariant,
            qty
        });
        navigate('/shipping'); // Redirect directly to checkout flow
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-page">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
            </div>
        );
    }

    return (
        <div className="bg-page min-h-screen py-8 animate-fade-in">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <Link to="/shop" className="inline-flex items-center gap-2 text-secondary hover:text-brand font-medium transition-colors mb-6">
                    <ChevronLeft size={20} /> Back to Shop
                </Link>

                <div className="bg-surface rounded-[2rem] shadow-sm border border-default overflow-hidden animate-slide-up lg:grid lg:grid-cols-2 lg:gap-8 p-6 lg:p-12">

                    {/* Image Gallery */}
                    <div className="mb-8 lg:mb-0">
                        <div className="aspect-square rounded-2xl bg-muted relative overflow-hidden mb-4 border border-default group">
                            {(selectedVariant && selectedVariant.image) ? (
                                <img
                                    src={selectedVariant.image}
                                    alt={selectedVariant.name}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                            ) : (product.images && product.images[activeImage]) ? (
                                <img
                                    src={product.images[activeImage].url}
                                    alt={product.name}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center bg-brand-subtle/50">
                                    <span className="text-brand font-medium">No Image Available</span>
                                </div>
                            )}
                        </div>

                        {/* Thumbnail Selection */}
                        {product.images && product.images.length > 1 && (
                            <div className="grid grid-cols-4 gap-4">
                                {product.images.map((img, index) => (
                                    <button
                                        key={img.public_id}
                                        onClick={() => setActiveImage(index)}
                                        className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${activeImage === index ? 'border-brand ring-2 ring-brand-subtle' : 'border-transparent hover:border-brand'}`}
                                    >
                                        <img src={img.url} alt="Thumbnail" className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Product Details */}
                    <div className="flex flex-col">
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-bold tracking-wider text-brand uppercase bg-brand-subtle px-3 py-1 rounded-full">
                                    {product.category?.name || 'Cosmetics'}
                                </span>
                                {displayStock > 0 ? (
                                    <span className="flex items-center gap-1 text-sm font-medium text-success bg-success-bg px-3 py-1 rounded-full">
                                        <ShieldCheck size={16} /> In Stock ({displayStock})
                                    </span>
                                ) : (
                                    <span className="text-sm font-medium text-error bg-error-bg px-3 py-1 rounded-full">
                                        Out of Stock
                                    </span>
                                )}
                            </div>

                            {product.brand && (
                                <p className="text-brand font-bold uppercase tracking-widest text-sm mb-2">{product.brand.name}</p>
                            )}

                            <div className="flex justify-between items-start mb-4">
                                <h1 className="text-3xl sm:text-4xl font-extrabold text-primary tracking-tight leading-tight pr-4">
                                    {product.name}
                                </h1>
                                <button
                                    onClick={() => toggleWishlist(product)}
                                    className={`p-3 rounded-full flex-shrink-0 transition-colors shadow-sm border ${isInWishlist(product._id) ? 'bg-brand text-on-brand border-brand hover:brightness-110' : 'bg-surface border-default text-tertiary hover:text-brand hover:border-brand'}`}
                                >
                                    <Heart size={24} className={isInWishlist(product._id) ? 'fill-current' : ''} />
                                </button>
                            </div>

                            <div className="flex items-center gap-4 mb-6">
                                <div className="flex items-center gap-1 text-gold">
                                    <Star size={20} fill="currentColor" />
                                    <Star size={20} fill="currentColor" />
                                    <Star size={20} fill="currentColor" />
                                    <Star size={20} fill="currentColor" />
                                    <Star size={20} fill="currentColor" className="text-muted" />
                                </div>
                                <span className="text-secondary text-sm hover:text-brand cursor-pointer transition-colors border-b border-dashed border-default">
                                    Read 24 Reviews
                                </span>
                            </div>

                            <div className="flex items-center gap-3 mb-6">
                                {hasDiscount ? (
                                    <>
                                        <p className="text-3xl font-bold text-brand">{currency}{discountPrice.toFixed(2)}</p>
                                        <p className="text-xl font-semibold text-tertiary line-through">{currency}{basePrice.toFixed(2)}</p>
                                    </>
                                ) : (
                                    <p className="text-3xl font-bold text-primary">{currency}{basePrice.toFixed(2)}</p>
                                )}
                            </div>

                            {/* Variant Selection */}
                            {product.variants && product.variants.length > 0 && (
                                <div className="mb-8">
                                    <h3 className="text-sm font-bold text-primary uppercase tracking-wider mb-3">
                                        Select Option
                                    </h3>
                                    <div className="flex flex-wrap gap-3">
                                        {product.variants.map((variant) => (
                                            <button
                                                key={variant._id}
                                                onClick={() => {
                                                    setSelectedVariant(variant);
                                                    setQty(1); // Reset qty when changing variant
                                                }}
                                                className={`px-4 py-2 border-2 rounded-xl text-sm font-bold transition-all ${selectedVariant?._id === variant._id
                                                    ? 'border-brand text-brand bg-brand-subtle ring-2 ring-brand-subtle'
                                                    : 'border-default text-secondary bg-surface hover:border-brand'
                                                    } ${variant.stock === 0 ? 'opacity-50 cursor-not-allowed' : ''} flex flex-col items-start gap-1`}
                                                disabled={variant.stock === 0}
                                            >
                                                <span>{variant.name}: {variant.value}</span>
                                                {(variant.discountPrice > 0 && variant.discountPrice < variant.price) ? (
                                                    <div className="flex items-center gap-2 text-xs font-normal">
                                                        <span className="text-brand font-bold">{currency}{variant.discountPrice.toFixed(2)}</span>
                                                        <span className="line-through opacity-70">{currency}{variant.price.toFixed(2)}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs font-normal">{currency}{variant.price?.toFixed(2) || '0.00'}</span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <p className="text-secondary leading-relaxed max-w-2xl mb-8">
                                {product.description}
                            </p>
                        </div>

                        <div className="mt-auto border-t border-default pt-8">

                            {displayStock > 0 ? (
                                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                    <div className="flex items-center border border-default rounded-xl bg-muted p-1 w-full sm:w-32">
                                        <button
                                            onClick={() => setQty(qty > 1 ? qty - 1 : 1)}
                                            disabled={qty === 1}
                                            className="p-3 text-secondary hover:text-brand hover:bg-surface rounded-lg disabled:opacity-50 transition-all flex-1 flex justify-center"
                                        >
                                            <Minus size={18} />
                                        </button>
                                        <span className="w-12 text-center font-bold text-primary text-lg">{qty}</span>
                                        <button
                                            onClick={() => setQty(qty < displayStock ? qty + 1 : qty)}
                                            disabled={qty >= displayStock}
                                            className="p-3 text-secondary hover:text-brand hover:bg-surface rounded-lg disabled:opacity-50 transition-all flex-1 flex justify-center"
                                        >
                                            <Plus size={18} />
                                        </button>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={addToCartHandler}
                                            className="flex-1 bg-surface border-2 border-primary text-primary hover:bg-primary hover:text-surface py-4 rounded-xl flex items-center justify-center gap-3 text-lg font-bold transition-colors group"
                                        >
                                            <ShoppingBag size={22} className="group-hover:-translate-y-1 transition-transform" />
                                            Add to Cart
                                        </button>
                                        <button
                                            onClick={buyNowHandler}
                                            className="flex-1 btn-primary py-4 rounded-xl flex items-center justify-center gap-3 text-lg font-bold group"
                                        >
                                            <CreditCard size={22} className="group-hover:-translate-y-1 transition-transform" />
                                            Buy Now
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="mb-6 p-4 bg-error-bg border border-error rounded-xl text-center text-error font-medium">
                                    This item is currently out of stock.
                                </div>
                            )}

                            {/* Features */}
                            <div className="grid grid-cols-2 gap-4 mt-8">
                                <div className="flex items-center gap-3 text-secondary bg-muted p-4 rounded-xl border border-default">
                                    <Truck size={24} className="text-brand" />
                                    <div className="text-sm font-medium">
                                        <p>Free Delivery</p>
                                        <p className="text-tertiary font-normal">
                                            {config?.freeShippingThreshold > 0
                                                ? `On orders over ${currency}${config.freeShippingThreshold}`
                                                : `Standard shipping applies`}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-secondary bg-muted p-4 rounded-xl border border-default">
                                    <ShieldCheck size={24} className="text-brand" />
                                    <div className="text-sm font-medium">
                                        <p>Authentic Guarantee</p>
                                        <p className="text-tertiary font-normal">100% Genuine Brands</p>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ProductScreen;
