import { useEffect, useState } from 'react';
import { X, Star, ShoppingBag, Heart, ChevronDown, Minus, Plus } from 'lucide-react';
import Rating from './Rating';
import { useCartStore } from '../context/useCartStore';
import { useWishlistStore } from '../context/useWishlistStore';
import { useConfigStore } from '../context/useConfigStore';
import { Link } from 'react-router-dom';
import { getProductImageUrl } from '../utils/imageUtils';
import { getFirstAvailableVariant, hasProductStock } from '../utils/stockUtils';
import { formatSoldCount } from '../utils/salesUtils';
import { getProductUrl } from '../utils/slugUtils';
import { toast } from 'sonner';

const QuickViewModal = ({ product, onClose, isOpen }) => {
    const { config } = useConfigStore();
    const currency = config?.currencySymbol || '$';
    const { addToCart } = useCartStore();
    const { isInWishlist, toggleWishlist } = useWishlistStore();
    
    const [qty, setQty] = useState(1);
    const [activeImage, setActiveImage] = useState(0);
    const [selectedVariant, setSelectedVariant] = useState(getFirstAvailableVariant(product) || product?.variants?.[0] || null);

    useEffect(() => {
        if (!isOpen || !product) return;
        setQty(1);
        setActiveImage(0);
        setSelectedVariant(getFirstAvailableVariant(product) || product?.variants?.[0] || null);
    }, [isOpen, product]);

    if (!isOpen || !product) return null;

    const basePrice = selectedVariant?.price || product.price || 0;
    const discountPrice = selectedVariant?.discountPrice || product.discountPrice || 0;
    const hasDiscount = discountPrice > 0 && discountPrice < basePrice;
    const displayPrice = hasDiscount ? discountPrice : basePrice;
    const displayStock = selectedVariant?.stock || product.stock || 0;

    const handleAddToCart = () => {
        const ok = addToCart({
            ...product,
            price: displayPrice,
            variant: selectedVariant,
            qty
        });

        if (!ok) {
            toast.error('This product is out of stock.');
            return;
        }

        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>
            
            <div className="relative bg-surface rounded-t-3xl sm:rounded-3xl shadow-2xl border border-default max-w-2xl w-full max-h-[92vh] sm:max-h-[90vh] overflow-y-auto animate-scale-up">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 bg-surface/90 backdrop-blur p-2 rounded-full text-secondary hover:text-brand hover:bg-surface transition-colors"
                >
                    <X size={24} />
                </button>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 p-4 sm:p-6 md:p-8">
                    {/* Image Section */}
                    <div className="flex flex-col gap-4">
                        <div className="aspect-square bg-page rounded-2xl border border-default overflow-hidden flex items-center justify-center relative">
                                <img
                                    src={getProductImageUrl(product, activeImage)}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                />
                                {displayStock === 0 && (
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                        <span className="text-white font-bold text-lg">Out of Stock</span>
                                    </div>
                                )}
                        </div>
                        
                        {/* Image Thumbnails */}
                        {product.images && product.images.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto pb-1">
                                {product.images.slice(0, 4).map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveImage(idx)}
                                        className={`w-14 h-14 sm:w-16 sm:h-16 rounded-lg border-2 overflow-hidden transition-all flex-shrink-0 ${
                                            activeImage === idx ? 'border-brand' : 'border-default'
                                        }`}
                                    >
                                        <img src={getProductImageUrl(product, idx)} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Product Info Section */}
                    <div className="flex flex-col gap-4">
                        {/* Header */}
                        <div>
                            {product.brand && (
                                <span className="text-[10px] font-bold text-brand uppercase tracking-widest block mb-2">
                                    {product.brand.name || product.brand}
                                </span>
                            )}
                            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-primary mb-2 break-words">{product.name}</h2>
                            
                            {/* Rating */}
                            <Rating value={product.rating} text={`(${product.numReviews || 0})`} size={16} className="mb-3" />
                        </div>

                        {/* Price */}
                        <div className="flex items-baseline gap-3">
                            <span className="text-3xl font-bold text-brand">{currency}{displayPrice.toFixed(2)}</span>
                            {hasDiscount && (
                                <span className="text-lg text-tertiary line-through">{currency}{basePrice.toFixed(2)}</span>
                            )}
                        </div>

                        {Number(product.soldCount || 0) > 0 && (
                            <div className="text-sm font-semibold text-tertiary">
                                {formatSoldCount(product.soldCount)} sold
                            </div>
                        )}

                        {/* Stock Status */}
                        <div className={`text-sm font-bold ${displayStock > 0 ? 'text-success' : 'text-error'}`}>
                            {displayStock > 0 ? `${displayStock} in stock` : 'Out of stock'}
                        </div>

                        {/* Variants */}
                        {product.variants && product.variants.length > 0 && (
                            <div className="border-t border-default pt-4">
                                <label className="text-sm font-bold text-primary block mb-2">Variant:</label>
                                <select
                                    value={selectedVariant?._id || ''}
                                    onChange={(e) => {
                                        const variant = product.variants.find(v => v._id === e.target.value);
                                        setSelectedVariant(variant);
                                    }}
                                    className="w-full border border-default rounded-lg px-3 py-2 bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-brand"
                                >
                                    {product.variants.map(v => (
                                        <option key={v._id} value={v._id}>
                                            {v.name}: {v.value} - {currency}{v.price.toFixed(2)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Quantity & Actions */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex items-center border border-default rounded-lg bg-page w-full sm:w-auto justify-between sm:justify-start">
                                <button
                                    onClick={() => setQty(Math.max(1, qty - 1))}
                                    disabled={qty <= 1}
                                    className="p-2 text-secondary hover:text-brand disabled:opacity-50"
                                >
                                    <Minus size={16} />
                                </button>
                                <span className="px-3 py-2 font-bold text-primary">{qty}</span>
                                <button
                                    onClick={() => setQty(Math.min(displayStock, qty + 1))}
                                    disabled={qty >= displayStock}
                                    className="p-2 text-secondary hover:text-brand disabled:opacity-50"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>

                            <button
                                onClick={handleAddToCart}
                                disabled={!hasProductStock(product, qty, selectedVariant)}
                                className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50 min-h-11"
                            >
                                <ShoppingBag size={18} />
                                Add to Cart
                            </button>

                            <button
                                onClick={() => toggleWishlist(product)}
                                className={`p-3 rounded-lg border-2 transition-colors self-center sm:self-auto ${
                                    isInWishlist(product._id)
                                        ? 'bg-brand-subtle border-brand text-brand'
                                        : 'border-default text-secondary hover:border-brand hover:text-brand'
                                }`}
                            >
                                <Heart size={20} fill={isInWishlist(product._id) ? 'currentColor' : 'none'} />
                            </button>
                        </div>

                        {/* View Full Details Link */}
                        <Link
                            to={getProductUrl(product)}
                            onClick={onClose}
                            className="text-center text-sm font-bold text-brand hover:underline mt-2"
                        >
                            View Full Details →
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuickViewModal;
