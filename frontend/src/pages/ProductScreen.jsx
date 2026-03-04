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
            <div className="flex justify-center items-center h-screen bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
            </div>
        );
    }

    return (
        <div className="bg-slate-50 min-h-screen py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Breadcrumb & Back */}
                <div className="mb-8">
                    <Link to="/shop" className="inline-flex items-center gap-2 text-slate-500 hover:text-pink-600 transition-colors font-medium">
                        <ArrowLeft size={18} />
                        Back to Shop
                    </Link>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden lg:grid lg:grid-cols-2 lg:gap-8 p-6 lg:p-12">

                    {/* Image Gallery */}
                    <div className="mb-8 lg:mb-0">
                        <div className="aspect-square rounded-2xl bg-slate-50 relative overflow-hidden mb-4 border border-slate-100 group">
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
                                <div className="absolute inset-0 flex items-center justify-center bg-pink-50/50">
                                    <span className="text-pink-300 font-medium">No Image Available</span>
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
                                        className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${activeImage === index ? 'border-pink-500 ring-2 ring-pink-200' : 'border-transparent hover:border-pink-300'}`}
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
                                <span className="text-sm font-bold tracking-wider text-pink-600 uppercase bg-pink-50 px-3 py-1 rounded-full">
                                    {product.category?.name || 'Cosmetics'}
                                </span>
                                {displayStock > 0 ? (
                                    <span className="flex items-center gap-1 text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                                        <ShieldCheck size={16} /> In Stock ({displayStock})
                                    </span>
                                ) : (
                                    <span className="text-sm font-medium text-rose-600 bg-rose-50 px-3 py-1 rounded-full">
                                        Out of Stock
                                    </span>
                                )}
                            </div>

                            {product.brand && (
                                <p className="text-pink-500 font-bold uppercase tracking-widest text-sm mb-2">{product.brand.name}</p>
                            )}

                            <div className="flex justify-between items-start mb-4">
                                <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight pr-4">
                                    {product.name}
                                </h1>
                                <button
                                    onClick={() => toggleWishlist(product)}
                                    className={`p-3 rounded-full flex-shrink-0 transition-colors shadow-sm border ${isInWishlist(product._id) ? 'bg-pink-50 border-pink-200 text-pink-500 hover:bg-pink-100' : 'bg-white border-slate-200 text-slate-400 hover:text-pink-500 hover:border-pink-300'}`}
                                >
                                    <Heart size={24} className={isInWishlist(product._id) ? 'fill-current' : ''} />
                                </button>
                            </div>

                            <div className="flex items-center gap-4 mb-6">
                                <div className="flex items-center gap-1 text-yellow-400">
                                    <Star size={20} fill="currentColor" />
                                    <Star size={20} fill="currentColor" />
                                    <Star size={20} fill="currentColor" />
                                    <Star size={20} fill="currentColor" />
                                    <Star size={20} fill="currentColor" className="text-slate-200" />
                                </div>
                                <span className="text-slate-500 text-sm hover:text-pink-600 cursor-pointer transition-colors border-b border-dashed border-slate-300">
                                    Read 24 Reviews
                                </span>
                            </div>

                            <div className="flex items-center gap-3 mb-6">
                                {hasDiscount ? (
                                    <>
                                        <p className="text-3xl font-bold text-pink-600">{currency}{discountPrice.toFixed(2)}</p>
                                        <p className="text-xl font-semibold text-slate-400 line-through">{currency}{basePrice.toFixed(2)}</p>
                                    </>
                                ) : (
                                    <p className="text-3xl font-bold text-slate-900">{currency}{basePrice.toFixed(2)}</p>
                                )}
                            </div>

                            {/* Variant Selection */}
                            {product.variants && product.variants.length > 0 && (
                                <div className="mb-8">
                                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">
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
                                                    ? 'border-pink-500 text-pink-600 bg-pink-50 ring-2 ring-pink-100'
                                                    : 'border-slate-200 text-slate-600 bg-white hover:border-pink-300'
                                                    } ${variant.stock === 0 ? 'opacity-50 cursor-not-allowed' : ''} flex flex-col items-start gap-1`}
                                                disabled={variant.stock === 0}
                                            >
                                                <span>{variant.name}: {variant.value}</span>
                                                {(variant.discountPrice > 0 && variant.discountPrice < variant.price) ? (
                                                    <div className="flex items-center gap-2 text-xs font-normal">
                                                        <span className="text-pink-600 font-bold">{currency}{variant.discountPrice.toFixed(2)}</span>
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

                            <p className="text-slate-600 leading-relaxed max-w-2xl mb-8">
                                {product.description}
                            </p>
                        </div>

                        <div className="mt-auto border-t border-slate-100 pt-8">

                            {displayStock > 0 ? (
                                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                    <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-1 w-full sm:w-32">
                                        <button
                                            onClick={() => setQty(qty > 1 ? qty - 1 : 1)}
                                            disabled={qty === 1}
                                            className="p-3 text-slate-500 hover:text-pink-600 hover:bg-white rounded-lg disabled:opacity-50 transition-all flex-1 flex justify-center"
                                        >
                                            <Minus size={18} />
                                        </button>
                                        <span className="w-12 text-center font-bold text-slate-700 text-lg">{qty}</span>
                                        <button
                                            onClick={() => setQty(qty < displayStock ? qty + 1 : qty)}
                                            disabled={qty >= displayStock}
                                            className="p-3 text-slate-500 hover:text-pink-600 hover:bg-white rounded-lg disabled:opacity-50 transition-all flex-1 flex justify-center"
                                        >
                                            <Plus size={18} />
                                        </button>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={addToCartHandler}
                                            className="flex-1 bg-white border-2 border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white py-4 rounded-xl flex items-center justify-center gap-3 text-lg font-bold transition-colors group"
                                        >
                                            <ShoppingBag size={22} className="group-hover:-translate-y-1 transition-transform" />
                                            Add to Cart
                                        </button>
                                        <button
                                            onClick={buyNowHandler}
                                            className="flex-1 btn-primary py-4 rounded-xl flex items-center justify-center gap-3 text-lg font-bold shadow-md shadow-pink-200 group"
                                        >
                                            <CreditCard size={22} className="group-hover:-translate-y-1 transition-transform" />
                                            Buy Now
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-xl text-center text-rose-600 font-medium">
                                    This item is currently out of stock.
                                </div>
                            )}

                            {/* Features */}
                            <div className="grid grid-cols-2 gap-4 mt-8">
                                <div className="flex items-center gap-3 text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <Truck size={24} className="text-pink-500" />
                                    <div className="text-sm font-medium">
                                        <p>Free Delivery</p>
                                        <p className="text-slate-400 font-normal">
                                            {config?.freeShippingThreshold > 0
                                                ? `On orders over ${currency}${config.freeShippingThreshold}`
                                                : `Standard shipping applies`}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <ShieldCheck size={24} className="text-pink-500" />
                                    <div className="text-sm font-medium">
                                        <p>Authentic Guarantee</p>
                                        <p className="text-slate-400 font-normal">100% Genuine Brands</p>
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
