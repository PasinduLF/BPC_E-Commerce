import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../context/useCartStore';
import { useAuthStore } from '../context/useAuthStore';
import axios from 'axios';
import { CheckCircle, Truck, Wallet, ArrowRight, Building, Upload, FileImage, Loader2 } from 'lucide-react';
import { useConfigStore } from '../context/useConfigStore';
import { getProductImageUrl } from '../utils/imageUtils';
import { getProductUrl } from '../utils/slugUtils';
import { notify } from '../utils/notify';

const PlaceOrder = () => {
    const { config } = useConfigStore();
    const currency = config?.currencySymbol || '$';

    const navigate = useNavigate();
    const { cartItems, shippingAddress, paymentMethod, clearCart, buyNowItem, clearBuyNowItem } = useCartStore();
    const { userInfo } = useAuthStore();
    const isPickupOrder = shippingAddress?.fulfillmentType === 'pickup';

    const [uploading, setUploading] = useState(false);
    const [placingOrder, setPlacingOrder] = useState(false);
    const [paymentSlip, setPaymentSlip] = useState(null);

    const normalizedShippingAddress = {
        name: shippingAddress?.name || userInfo?.name || '',
        phone: shippingAddress?.phone || userInfo?.phone || '',
        address: isPickupOrder ? (config?.pickupStore?.address || shippingAddress?.address || 'Store Pickup') : (shippingAddress?.address || ''),
        city: isPickupOrder ? (config?.pickupStore?.city || shippingAddress?.city || 'N/A') : (shippingAddress?.city || ''),
        postalCode: isPickupOrder ? (shippingAddress?.postalCode || 'N/A') : (shippingAddress?.postalCode || ''),
        country: isPickupOrder ? (shippingAddress?.country || 'N/A') : (shippingAddress?.country || ''),
    };

    const hasRequiredShipping = Boolean(
        normalizedShippingAddress.name &&
        normalizedShippingAddress.phone &&
        normalizedShippingAddress.address &&
        normalizedShippingAddress.city &&
        normalizedShippingAddress.postalCode &&
        normalizedShippingAddress.country
    );

    const hasValidPickupPayment = !isPickupOrder || paymentMethod === 'Bank Transfer';

    useEffect(() => {
        if (!hasRequiredShipping) {
            navigate('/shipping');
        } else if (!paymentMethod) {
            navigate('/payment');
        } else if (!hasValidPickupPayment) {
            navigate('/payment');
        }
    }, [paymentMethod, hasRequiredShipping, hasValidPickupPayment, navigate]);

    const checkoutItems = buyNowItem ? [buyNowItem] : cartItems;

    // Calculate prices
    const addDecimals = (num) => {
        return (Math.round(num * 100) / 100).toFixed(2);
    };

    const itemsPrice = addDecimals(
        checkoutItems.reduce((acc, item) => acc + item.price * item.qty, 0)
    );

    // Dynamic config overrides defaults
    const taxRate = config?.taxRate || 0;
    const baseShippingFee = config?.shippingFee || 0;
    const freeShippingThreshold = config?.freeShippingThreshold || 0;
    const codDeliveryCharge = config?.codDeliveryCharge || 0;

    let calculatedShipping = 0;
    if (isPickupOrder) {
        calculatedShipping = 0;
    } else if (paymentMethod === 'Cash on Delivery' && codDeliveryCharge > 0) {
        calculatedShipping = codDeliveryCharge;
    } else {
        calculatedShipping = (freeShippingThreshold > 0 && itemsPrice > freeShippingThreshold) ? 0 : baseShippingFee;
    }

    const shippingPrice = addDecimals(calculatedShipping);
    const taxPrice = addDecimals(Number(((taxRate / 100) * itemsPrice).toFixed(2)));

    const totalPrice = (
        Number(itemsPrice) +
        Number(shippingPrice) +
        Number(taxPrice)
    ).toFixed(2);

    const placeOrderHandler = async () => {
        if (placingOrder) return;

        if (!hasRequiredShipping) {
            notify({ type: 'error', title: 'Shipping details incomplete', description: 'Please check your shipping information.' });
            navigate('/shipping');
            return;
        }

        if (!hasValidPickupPayment) {
            notify({ type: 'error', title: 'Invalid payment method', description: 'Pickup orders require Bank Transfer payment.' });
            navigate('/payment');
            return;
        }

        setPlacingOrder(true);
        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${userInfo.token}`,
                },
            };

            const { data } = await axios.post(
                '/api/orders',
                {
                    orderItems: checkoutItems,
                    shippingAddress: normalizedShippingAddress,
                    paymentMethod,
                    fulfillmentType: isPickupOrder ? 'pickup' : 'delivery',
                    paymentSlip: paymentMethod === 'Bank Transfer' ? paymentSlip : undefined,
                    itemsPrice,
                    shippingPrice,
                    taxPrice,
                    totalPrice,
                },
                config
            );

            if (buyNowItem) {
                clearBuyNowItem();
            } else {
                clearCart();
            }
            navigate(`/order/${data._id}`);

        } catch (error) {
            console.error('Order creation failed', error);
            const message = error?.response?.data?.message || 'Order failed to process. Please try again.';
            notify({ type: 'error', title: 'Order failed', description: message });
        } finally {
            setPlacingOrder(false);
        }
    };

    const uploadFileHandler = async (e) => {
        if (placingOrder) return;
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('image', file);
        setUploading(true);

        try {
            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            };
            const { data } = await axios.post('/api/upload', formData, config);
            setPaymentSlip({
                url: data.url,
                public_id: data.public_id,
            });
            setUploading(false);
        } catch (error) {
            console.error(error);
            setUploading(false);
            notify({ type: 'error', title: 'Upload failed', description: 'Failed to upload payment slip. Please try again.' });
        }
    };

    return (
        <div className="bg-page min-h-screen py-10 sm:py-12 animate-fade-in">
            <div className="max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-6">

                {/* Checkout Steps - Simplified visual */}
                <div className="flex justify-center mb-8 sm:mb-12 animate-slide-up">
                    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-[11px] sm:text-sm font-medium">
                        <span className="text-brand bg-brand-subtle px-3 py-1 rounded-full border border-brand-subtle line-through decoration-brand-subtle">1. Shipping</span>
                        <div className="hidden sm:block w-8 h-px bg-brand-subtle"></div>
                        <span className="text-brand bg-brand-subtle px-3 py-1 rounded-full border border-brand-subtle line-through decoration-brand-subtle">2. Payment</span>
                        <div className="hidden sm:block w-8 h-px bg-brand-subtle"></div>
                        <span className="text-brand bg-brand-subtle px-3 py-1 rounded-full border border-brand-subtle">3. Order placed</span>
                    </div>
                </div>

                <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-primary tracking-tight mb-6 sm:mb-8 animate-slide-up-delayed-1">Review Your Order</h1>

                <div className="lg:grid lg:grid-cols-12 lg:gap-8">

                    <div className="lg:col-span-8 space-y-6 animate-slide-up">

                        {/* Shipping / Pickup Summary */}
                        <div className="bg-surface rounded-2xl shadow-sm border border-default p-4 sm:p-6 md:p-8">
                            <div className="flex flex-col sm:flex-row items-start gap-4 mb-4">
                                <div className="p-3 bg-brand-subtle rounded-xl text-brand">
                                    <Truck size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-primary">{isPickupOrder ? 'Pickup' : 'Shipping'}</h2>
                                    <p className="mt-2 text-secondary">
                                        <strong className="font-semibold text-primary">Name: </strong>
                                        {shippingAddress.name}
                                    </p>
                                    {!isPickupOrder ? (
                                        <p className="mt-2 text-secondary">
                                            <strong className="font-semibold text-primary">Address: </strong>
                                            {shippingAddress.address}, {shippingAddress.city}, {shippingAddress.postalCode}, {shippingAddress.country}
                                        </p>
                                    ) : (
                                        <>
                                            <p className="mt-2 text-secondary">
                                                <strong className="font-semibold text-primary">Pickup Store: </strong>
                                                {config?.pickupStore?.storeName || 'Store Pickup'}
                                            </p>
                                            <p className="mt-2 text-secondary">
                                                <strong className="font-semibold text-primary">Store Address: </strong>
                                                {config?.pickupStore?.address || 'N/A'}, {config?.pickupStore?.city || ''}
                                            </p>
                                            {config?.pickupStore?.openingHours && (
                                                <p className="mt-2 text-secondary">
                                                    <strong className="font-semibold text-primary">Store Hours: </strong>
                                                    {config.pickupStore.openingHours}
                                                </p>
                                            )}
                                        </>
                                    )}
                                    <p className="mt-2 text-secondary">
                                        <strong className="font-semibold text-primary">Phone: </strong>
                                        {shippingAddress.phone}
                                    </p>
                                    {isPickupOrder && (
                                        <p className="mt-3 text-sm text-warning bg-warning-bg border border-warning-bg rounded-lg px-3 py-2">
                                            You can collect this order only after admin marks it as ready for pickup.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Payment Summary */}
                        <div className="bg-surface rounded-2xl shadow-sm border border-default p-4 sm:p-6 md:p-8">
                            <div className="flex flex-col sm:flex-row items-start gap-4 mb-4">
                                <div className="p-3 bg-brand-subtle rounded-xl text-brand">
                                    <Wallet size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-primary">Payment Method</h2>
                                    <p className="mt-2 text-secondary">
                                        <strong className="font-semibold text-primary">Method: </strong>
                                        {paymentMethod}
                                    </p>
                                </div>
                            </div>

                            {paymentMethod === 'Bank Transfer' && (
                                <div className="mt-6 border-t border-default pt-6">
                                    <div className="bg-muted rounded-xl p-5 border border-default mb-6">
                                        <div className="flex items-center gap-2 text-primary font-bold mb-3">
                                            <Building size={18} />
                                            <span>Bank Transfer Details</span>
                                        </div>
                                        {Array.isArray(config?.bankDetails) && config.bankDetails.length > 0 ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                                                {config.bankDetails.map((bank, index) => (
                                                    <div key={index} className="bg-surface p-4 rounded-xl border border-default shadow-sm text-sm">
                                                        <div className="font-bold text-primary mb-2 pb-2 border-b border-default flex items-center justify-between">
                                                            <span>{bank.bankName}</span>
                                                            <span className="text-xs bg-brand-subtle text-brand px-2 py-0.5 rounded-md">{bank.branch}</span>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-secondary"><span className="text-tertiary text-xs">A/C Name:</span> <span className="font-medium text-primary">{bank.accountName}</span></p>
                                                            <p className="text-secondary"><span className="text-tertiary text-xs">A/C No:</span> <span className="font-mono font-bold text-primary tracking-wider">{bank.accountNumber}</span></p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-secondary text-sm whitespace-pre-wrap leading-relaxed">
                                                {typeof config?.bankDetails === 'string' && config.bankDetails ? config.bankDetails : "Please contact support for bank details."}
                                            </div>
                                        )}
                                    </div>

                                    <div className="bg-page p-4 sm:p-6 rounded-xl border border-default border-dashed text-center">
                                        {!paymentSlip ? (
                                            <>
                                                <Upload className="mx-auto text-tertiary mb-3" size={32} />
                                                <h3 className="font-semibold text-primary mb-1">Upload Payment Slip</h3>
                                                <p className="text-sm text-secondary mb-4">Please attach a photo or screenshot of your transaction receipt to complete your order.</p>
                                                <label className="btn-primary py-2 px-6 cursor-pointer inline-flex items-center gap-2">
                                                    {uploading ? (
                                                        <Loader2 size={16} className="animate-spin" />
                                                    ) : (
                                                        <span>Select File</span>
                                                    )}
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        onChange={uploadFileHandler}
                                                        accept="image/*"
                                                        disabled={uploading || placingOrder}
                                                    />
                                                </label>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center">
                                                <div className="w-16 h-16 bg-success-bg text-success rounded-full flex items-center justify-center mb-3">
                                                    <FileImage size={28} />
                                                </div>
                                                <h3 className="font-semibold text-success mb-1 flex items-center gap-2">
                                                    <CheckCircle size={16} /> Slip Uploaded Successfully
                                                </h3>
                                                <button
                                                    type="button"
                                                    disabled={placingOrder}
                                                    className="text-sm text-brand hover:brightness-90 mt-2 hover:underline disabled:opacity-60 disabled:cursor-not-allowed"
                                                    onClick={() => setPaymentSlip(null)}
                                                >
                                                    Upload different file
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Order Items */}
                        <div className="bg-surface rounded-2xl shadow-sm border border-default p-4 sm:p-6 md:p-8 overflow-hidden">
                            <h2 className="text-xl font-bold text-primary mb-6">Order Items</h2>
                            {checkoutItems.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-secondary mb-4">Your cart is empty.</p>
                                    <Link to="/shop" className="text-brand hover:underline">Go back to Shop</Link>
                                </div>
                            ) : (
                                <ul className="divide-y divide-default">
                                    {checkoutItems.map((item, index) => (
                                        <li key={index} className="py-4 flex items-start sm:items-center gap-4">
                                            <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0 border border-default">
                                                <img 
                                                    src={item.image && !item.image.includes('via.placeholder.com') ? item.image : getProductImageUrl(item)} 
                                                    alt={item.name} 
                                                    className="w-full h-full object-cover" 
                                                />
                                            </div>
                                            <div className="flex-1">
                                                {item.isBundle ? (
                                                    <Link to="/bundles" className="font-semibold text-primary hover:text-brand transition-colors line-clamp-1">
                                                        {item.name}
                                                    </Link>
                                                ) : (
                                                    <Link to={getProductUrl(item)} className="font-semibold text-primary hover:text-brand transition-colors line-clamp-1">
                                                        {item.name}
                                                    </Link>
                                                )}
                                                {item.variant && (
                                                    <p className="text-brand text-[10px] font-bold uppercase tracking-wider mt-1">
                                                        {item.variant.name}: {item.variant.value}
                                                    </p>
                                                )}
                                                {item.isBundle && Array.isArray(item.bundleProducts) && item.bundleProducts.length > 0 && (
                                                    <div className="mt-2 space-y-1">
                                                        {item.bundleProducts.slice(0, 3).map((bp, bpIdx) => (
                                                            <p key={bpIdx} className="text-[11px] text-secondary leading-tight">
                                                                {bp.qty} x {bp.name}{bp.variantName ? ` (${bp.variantName})` : ''}
                                                            </p>
                                                        ))}
                                                        {item.bundleProducts.length > 3 && (
                                                            <p className="text-[11px] text-tertiary">+{item.bundleProducts.length - 3} more item(s)</p>
                                                        )}
                                                    </div>
                                                )}
                                                <p className="text-secondary text-sm mt-1">
                                                    {item.qty} x {currency}{item.price.toFixed(2)} = <span className="font-medium text-primary">{currency}{(item.qty * item.price).toFixed(2)}</span>
                                                </p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                    </div>

                    <div className="lg:col-span-4 mt-8 lg:mt-0 animate-slide-up-delayed-1">
                        <div className="bg-surface rounded-2xl shadow-sm border border-default p-4 sm:p-6 sticky top-24">
                            <h2 className="text-xl font-bold text-primary mb-6 pb-4 border-b border-default">Order Summary</h2>

                            <div className="space-y-4 mb-6 text-sm">
                                <div className="flex justify-between text-secondary">
                                    <span>Items</span>
                                    <span className="font-medium text-primary">{currency}{itemsPrice}</span>
                                </div>
                                <div className="flex justify-between text-secondary">
                                    <span>Shipping</span>
                                    <span className="font-medium text-primary">{isPickupOrder ? `${currency}0.00 (Pickup)` : `${currency}${shippingPrice}`}</span>
                                </div>
                                <div className="flex justify-between text-secondary">
                                    <span>Tax ({taxRate}%)</span>
                                    <span className="font-medium text-primary">{currency}{taxPrice}</span>
                                </div>
                            </div>

                            <div className="border-t border-default pt-4 mb-8 flex justify-between items-center">
                                <span className="text-lg font-bold text-primary">Total</span>
                                <span className="text-2xl sm:text-3xl font-bold text-brand">{currency}{totalPrice}</span>
                            </div>

                            <button
                                type="button"
                                className="w-full btn-primary py-4 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
                                disabled={placingOrder || uploading || checkoutItems.length === 0 || (paymentMethod === 'Bank Transfer' && !paymentSlip)}
                                onClick={placeOrderHandler}
                            >
                                {placingOrder ? 'Placing Order...' : 'Place Order'}
                                <CheckCircle size={20} className="group-hover:scale-110 transition-transform" />
                            </button>
                            {paymentMethod === 'Bank Transfer' && !paymentSlip && (
                                <p className="text-sm text-error font-medium text-center mt-3">
                                    Please upload your payment slip above.
                                </p>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default PlaceOrder;
