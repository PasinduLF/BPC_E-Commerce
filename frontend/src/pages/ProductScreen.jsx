import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../context/useCartStore';
import { useAuthStore } from '../context/useAuthStore';
import { useWishlistStore } from '../context/useWishlistStore';
import axios from 'axios';
import { Star, Truck, ShieldCheck, Minus, Plus, ShoppingBag, Heart, CreditCard, ChevronDown, Trash2 } from 'lucide-react';
import { useConfigStore } from '../context/useConfigStore';
import Breadcrumbs from '../components/Breadcrumbs';
import { getProductImageUrl } from '../utils/imageUtils';
import { formatSoldCount } from '../utils/salesUtils';
import { toast } from 'sonner';

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
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState('');
    const [reviewSubmitting, setReviewSubmitting] = useState(false);
    const [reviewError, setReviewError] = useState('');
    const [reviewSuccess, setReviewSuccess] = useState('');
    const [deletingReviewId, setDeletingReviewId] = useState('');
    const [openDescriptionSection, setOpenDescriptionSection] = useState('details');

    const { addToCart, setBuyNowItem } = useCartStore();
    const { userInfo } = useAuthStore();
    const { isInWishlist, toggleWishlist } = useWishlistStore();

    const fetchProduct = async () => {
        try {
            const { data } = await axios.get(`/api/products/${id}`);
            setProduct(data);
            if (data.variants && data.variants.length > 0) {
                setSelectedVariant((prev) => {
                    if (prev && data.variants.some((v) => v._id === prev._id)) {
                        return data.variants.find((v) => v._id === prev._id);
                    }
                    return data.variants[0];
                });
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching product:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProduct();
    }, [id]);

    const basePrice = (product.variants && product.variants.length > 0) ? (selectedVariant?.price || 0) : (product.price || 0);
    const discountPrice = (product.variants && product.variants.length > 0) ? (selectedVariant?.discountPrice || 0) : (product.discountPrice || 0);
    const hasDiscount = discountPrice > 0 && discountPrice < basePrice;

    const displayPrice = hasDiscount ? discountPrice : basePrice;

    const displayStock = (product.variants && product.variants.length > 0) ? (selectedVariant?.stock || 0) : product.stock;

    const addToCartHandler = () => {
        const ok = addToCart({
            ...product,
            price: displayPrice, // Save final resolved price
            variant: selectedVariant,
            qty
        });
        if (!ok) {
            toast.error('This product is out of stock.');
            return;
        }
        navigate('/cart');
    };

    const buyNowHandler = () => {
        const ok = setBuyNowItem({
            ...product,
            price: displayPrice,
            variant: selectedVariant,
            qty
        });
        if (!ok) {
            toast.error('This product is out of stock.');
            return;
        }
        if (userInfo) {
            navigate('/shipping');
        } else {
            navigate('/login?redirect=/shipping');
        }
    };

    const submitReviewHandler = async (e) => {
        e.preventDefault();

        if (!userInfo) {
            navigate(`/login?redirect=/product/${id}`);
            return;
        }

        setReviewSubmitting(true);
        setReviewError('');
        setReviewSuccess('');

        try {
            const reqConfig = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${userInfo.token}`,
                },
            };

            await axios.post(`/api/products/${id}/reviews`, {
                rating: reviewRating,
                comment: reviewComment,
            }, reqConfig);

            setReviewSuccess('Thanks! Your review has been submitted.');
            setReviewComment('');
            setReviewRating(5);
            await fetchProduct();
        } catch (error) {
            setReviewError(error.response?.data?.message || 'Failed to submit review');
        } finally {
            setReviewSubmitting(false);
        }
    };

    const deleteReviewHandler = async (reviewId) => {
        if (!userInfo || userInfo.role !== 'admin') return;
        if (!window.confirm('Remove this review?')) return;

        setDeletingReviewId(reviewId);
        setReviewError('');
        setReviewSuccess('');
        try {
            const reqConfig = {
                headers: {
                    Authorization: `Bearer ${userInfo.token}`,
                },
            };

            await axios.delete(`/api/products/${id}/reviews/${reviewId}`, reqConfig);
            setReviewSuccess('Review removed successfully.');
            await fetchProduct();
        } catch (error) {
            setReviewError(error.response?.data?.message || 'Failed to remove review');
        } finally {
            setDeletingReviewId('');
        }
    };

    const renderStars = (value, size = 18) => {
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

    const formatDescription = (text = '') => {
        return String(text)
            .replace(/\r\n/g, '\n')
            .replace(/\s*---\s*/g, '\n\n')
            .replace(/^#{1,6}\s*/gm, '')
            .replace(/\*\*/g, '')
            .trim();
    };

    const sectionMeta = [
        { key: 'details', label: 'Details' },
        { key: 'benefits', label: 'Key Benefits' },
        { key: 'howToUse', label: 'How to Use' },
        { key: 'ingredients', label: 'Core Ingredients' },
        { key: 'specifications', label: 'Specifications' },
        { key: 'shippingInformation', label: 'Shipping information' },
    ];

    const descriptionPanels = sectionMeta
        .map(({ key, label }) => ({
            key,
            label,
            content: formatDescription(product?.descriptionSections?.[key] || ''),
        }))
        .filter((section) => section.content.length > 0);

    if (loading) {
        return (
            <div className="bg-page min-h-screen py-8 animate-fade-in">
                <div className="max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-6">
                    <div className="skeleton h-4 w-64 mb-6" />
                    <div className="bg-surface rounded-[2rem] shadow-sm border border-default overflow-hidden lg:grid lg:grid-cols-2 lg:gap-8 p-6 lg:p-12">
                        <div className="mb-8 lg:mb-0">
                            <div className="skeleton aspect-square w-full rounded-2xl mb-4" />
                            <div className="grid grid-cols-4 gap-4">
                                <div className="skeleton aspect-square w-full rounded-xl" />
                                <div className="skeleton aspect-square w-full rounded-xl" />
                                <div className="skeleton aspect-square w-full rounded-xl" />
                                <div className="skeleton aspect-square w-full rounded-xl" />
                            </div>
                        </div>

                        <div className="flex flex-col gap-4">
                            <div className="flex justify-between items-center">
                                <div className="skeleton h-7 w-32 rounded-full" />
                                <div className="skeleton h-7 w-28 rounded-full" />
                            </div>
                            <div className="skeleton h-4 w-24" />
                            <div className="skeleton h-10 w-11/12" />
                            <div className="skeleton h-5 w-48" />
                            <div className="skeleton h-4 w-full" />
                            <div className="skeleton h-4 w-5/6" />
                            <div className="skeleton h-10 w-36" />
                            <div className="skeleton h-24 w-full rounded-2xl" />
                            <div className="skeleton h-12 w-full rounded-xl" />
                            <div className="grid grid-cols-2 gap-3">
                                <div className="skeleton h-12 w-full rounded-xl" />
                                <div className="skeleton h-12 w-full rounded-xl" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-page min-h-screen py-8 animate-fade-in">
            <div className="max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-6">
                <Breadcrumbs 
                    category={product.category}
                    subcategory={product.subcategory}
                    innerSubcategory={product.innerSubcategory}
                    productName={product.name}
                />

                <div className="bg-surface rounded-[2rem] shadow-sm border border-default overflow-hidden animate-slide-up lg:grid lg:grid-cols-2 lg:gap-10 p-6 lg:p-14">

                    {/* Image Gallery */}
                    <div className="mb-8 lg:mb-0">
                        <div className="aspect-square rounded-2xl bg-muted relative overflow-hidden mb-4 border border-default group">
                            {(selectedVariant && selectedVariant.image && !selectedVariant.image.includes('via.placeholder.com')) ? (
                                <img
                                    src={selectedVariant.image}
                                    alt={selectedVariant.name}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                            ) : (
                                <img
                                    src={getProductImageUrl(product, activeImage)}
                                    alt={product.name}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                            )}
                            {displayStock === 0 && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                    <span className="text-white font-bold text-lg">Out of Stock</span>
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
                                        <img src={getProductImageUrl(product, index)} alt="Thumbnail" className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Product Details */}
                    <div className="flex flex-col">
                        <div className="mb-6">
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
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

                            <div className="flex justify-between items-start gap-3 mb-4">
                                <h1 className="text-3xl sm:text-4xl font-extrabold text-primary tracking-tight leading-tight pr-4">
                                    {product.name}
                                </h1>
                                <button
                                    onClick={() => toggleWishlist(product)}
                                    className={`p-3 rounded-full flex-shrink-0 transition-colors shadow-sm border ${isInWishlist(product._id) ? 'bg-brand text-on-brand border-brand hover:brightness-110' : 'bg-surface border-default text-tertiary hover:text-brand hover:border-brand'}`}
                                >
                                    <Heart size={22} className={isInWishlist(product._id) ? 'fill-current' : ''} />
                                </button>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-6">
                                <div className="flex items-center gap-1 text-gold">
                                    {renderStars(product.rating, 22)}
                                </div>
                                <span className="text-secondary text-sm hover:text-brand cursor-pointer transition-colors border-b border-dashed border-default">
                                    {product.numReviews || 0} Reviews
                                </span>
                                {Number(product.soldCount || 0) > 0 && (
                                    <span className="text-sm font-semibold text-tertiary">
                                        {formatSoldCount(product.soldCount)} sold
                                    </span>
                                )}
                            </div>

                            <p className="text-lg text-secondary leading-relaxed mb-6 max-w-2xl">
                                {formatDescription(product.description)}
                            </p>

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

                        </div>

                        <div className="mt-auto border-t border-default pt-8">

                            {displayStock > 0 ? (
                                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                    <div className="flex items-center border border-default rounded-xl bg-muted p-1 w-full sm:w-32">
                                        <button
                                            onClick={() => setQty(qty > 1 ? qty - 1 : 1)}
                                            disabled={qty === 1}
                                            className="p-3 text-primary hover:text-brand hover:bg-surface rounded-lg disabled:opacity-50 transition-all flex-1 flex justify-center"
                                        >
                                            <Minus size={18} className="text-primary" />
                                        </button>
                                        <span className="w-12 text-center font-bold text-primary text-base">{qty}</span>
                                        <button
                                            onClick={() => setQty(qty < displayStock ? qty + 1 : qty)}
                                            disabled={qty >= displayStock}
                                            className="p-3 text-primary hover:text-brand hover:bg-surface rounded-lg disabled:opacity-50 transition-all flex-1 flex justify-center"
                                        >
                                            <Plus size={18} className="text-primary" />
                                        </button>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-2 w-full">
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                                <div className="flex items-center gap-3 text-secondary bg-muted p-3 rounded-xl border border-default">
                                    <Truck size={20} className="text-brand" />
                                    <div className="text-sm font-medium">
                                        <p>Free Delivery</p>
                                        <p className="text-tertiary font-normal">
                                            {config?.freeShippingThreshold > 0
                                                ? `On orders over ${currency}${config.freeShippingThreshold}`
                                                : `Standard shipping applies`}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-secondary bg-muted p-3 rounded-xl border border-default">
                                    <ShieldCheck size={20} className="text-brand" />
                                    <div className="text-sm font-medium">
                                        <p>Authentic Guarantee</p>
                                        <p className="text-tertiary font-normal">100% Genuine Brands</p>
                                    </div>
                                </div>
                            </div>

                            {descriptionPanels.length > 0 && (
                                <div className="mt-8 border-t border-default pt-4">
                                    {descriptionPanels.map((section) => {
                                        const isOpen = openDescriptionSection === section.key;
                                        return (
                                            <div key={section.key} className="border-b border-default">
                                                <button
                                                    type="button"
                                                    onClick={() => setOpenDescriptionSection(isOpen ? '' : section.key)}
                                                    className="w-full py-4 flex items-center justify-between text-left"
                                                >
                                                    <span className="text-primary font-medium text-xl">{section.label}</span>
                                                    <ChevronDown
                                                        size={18}
                                                        className={`text-tertiary transition-transform ${isOpen ? 'rotate-180' : ''}`}
                                                    />
                                                </button>
                                                {isOpen && (
                                                    <div className="pb-4 text-secondary leading-relaxed whitespace-pre-line text-sm">
                                                        {section.content}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                        </div>
                    </div>

                </div>

                <div className="mt-8 bg-surface rounded-[2rem] shadow-sm border border-default p-6 lg:p-10 animate-slide-up-delayed-1">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-5">
                            <h2 className="text-2xl font-extrabold text-primary mb-3">Customer Reviews</h2>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="flex items-center gap-1">
                                    {renderStars(product.rating, 18)}
                                </div>
                                <span className="font-semibold text-primary">{Number(product.rating || 0).toFixed(1)} / 5</span>
                            </div>
                            <p className="text-secondary text-sm">Based on {product.numReviews || 0} verified customer reviews.</p>

                            <div className="mt-6 space-y-4 max-h-[360px] overflow-y-auto pr-2">
                                {!product.reviews || product.reviews.length === 0 ? (
                                    <p className="text-secondary text-sm">No reviews yet. Be the first to review this product.</p>
                                ) : (
                                    product.reviews.slice().reverse().map((review) => (
                                        <div key={review._id} className="border border-default rounded-xl p-4 bg-page">
                                            <div className="flex items-center justify-between gap-3">
                                                <p className="font-semibold text-primary">{review.name}</p>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs text-tertiary">{new Date(review.createdAt).toLocaleDateString()}</span>
                                                    {userInfo?.role === 'admin' && (
                                                        <button
                                                            type="button"
                                                            onClick={() => deleteReviewHandler(review._id)}
                                                            disabled={deletingReviewId === review._id}
                                                            className="text-error hover:bg-error-bg border border-transparent hover:border-error-bg rounded-lg p-1.5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                                            title="Remove review"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 mt-2">
                                                {renderStars(review.rating, 14)}
                                            </div>
                                            <p className="text-secondary text-sm mt-3 leading-relaxed">{review.comment}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="lg:col-span-7 border-t lg:border-t-0 lg:border-l border-default pt-6 lg:pt-0 lg:pl-8">
                            <h3 className="text-xl font-bold text-primary mb-4">Write a Review</h3>
                            {!userInfo ? (
                                <p className="text-secondary text-sm">
                                    Please <Link to={`/login?redirect=/product/${id}`} className="text-brand font-semibold hover:underline">sign in</Link> to write a review.
                                </p>
                            ) : (
                                <form onSubmit={submitReviewHandler} className="space-y-4">
                                    {reviewError && <p className="text-sm text-error bg-error-bg border border-error-bg rounded-lg p-3">{reviewError}</p>}
                                    {reviewSuccess && <p className="text-sm text-success bg-success-bg border border-success-bg rounded-lg p-3">{reviewSuccess}</p>}

                                    <div>
                                        <label className="block text-sm font-semibold text-primary mb-2">Rating</label>
                                        <select
                                            value={reviewRating}
                                            onChange={(e) => setReviewRating(Number(e.target.value))}
                                            className="w-full sm:w-56 px-4 py-2 border border-default rounded-xl bg-page text-primary input-focus"
                                        >
                                            <option value={5}>5 - Excellent</option>
                                            <option value={4}>4 - Very Good</option>
                                            <option value={3}>3 - Good</option>
                                            <option value={2}>2 - Fair</option>
                                            <option value={1}>1 - Poor</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-primary mb-2">Comment</label>
                                        <textarea
                                            rows={5}
                                            required
                                            value={reviewComment}
                                            onChange={(e) => setReviewComment(e.target.value)}
                                            className="w-full px-4 py-3 border border-default rounded-xl bg-page text-primary input-focus"
                                            placeholder="Share your experience with this product"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={reviewSubmitting}
                                        className="btn-primary px-6 py-3 rounded-xl disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductScreen;
