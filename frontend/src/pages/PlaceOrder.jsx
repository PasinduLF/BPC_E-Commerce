import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../context/useCartStore';
import { useAuthStore } from '../context/useAuthStore';
import axios from 'axios';
import { CheckCircle, Truck, Wallet, ArrowRight, Building, Upload, FileImage, Loader2 } from 'lucide-react';
import { useConfigStore } from '../context/useConfigStore';

const PlaceOrder = () => {
    const { config } = useConfigStore();
    const currency = config?.currencySymbol || '$';

    const navigate = useNavigate();
    const { cartItems, shippingAddress, paymentMethod, clearCart, buyNowItem, clearBuyNowItem } = useCartStore();
    const { userInfo } = useAuthStore();

    const [uploading, setUploading] = useState(false);
    const [paymentSlip, setPaymentSlip] = useState(null);

    useEffect(() => {
        if (!shippingAddress.address) {
            navigate('/shipping');
        } else if (!paymentMethod) {
            navigate('/payment');
        }
    }, [paymentMethod, shippingAddress, navigate]);

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
    if (paymentMethod === 'Cash on Delivery' && codDeliveryCharge > 0) {
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
        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${userInfo.token}`,
                },
            };

            const { data } = await axios.post(
                'http://localhost:5000/api/orders',
                {
                    orderItems: checkoutItems,
                    shippingAddress,
                    paymentMethod,
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
            alert('Order failed to process. Please try again.');
        }
    };

    const uploadFileHandler = async (e) => {
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('image', file);
        setUploading(true);

        try {
            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            };
            const { data } = await axios.post('http://localhost:5000/api/upload', formData, config);
            setPaymentSlip({
                url: data.url,
                public_id: data.public_id,
            });
            setUploading(false);
        } catch (error) {
            console.error(error);
            setUploading(false);
            alert('Failed to upload payment slip. Please try again.');
        }
    };

    return (
        <div className="bg-page min-h-screen py-12 animate-fade-in">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Checkout Steps - Simplified visual */}
                <div className="flex justify-center mb-12 animate-slide-up">
                    <div className="flex items-center gap-4 text-sm font-medium">
                        <span className="text-brand bg-brand-subtle px-3 py-1 rounded-full border border-brand-subtle line-through decoration-brand-subtle">1. Shipping</span>
                        <div className="w-8 h-px bg-brand-subtle"></div>
                        <span className="text-brand bg-brand-subtle px-3 py-1 rounded-full border border-brand-subtle line-through decoration-brand-subtle">2. Payment</span>
                        <div className="w-8 h-px bg-brand-subtle"></div>
                        <span className="text-brand bg-brand-subtle px-3 py-1 rounded-full border border-brand-subtle">3. Order placed</span>
                    </div>
                </div>

                <h1 className="text-3xl font-extrabold text-primary tracking-tight mb-8 animate-slide-up-delayed-1">Review Your Order</h1>

                <div className="lg:grid lg:grid-cols-12 lg:gap-8">

                    <div className="lg:col-span-8 space-y-6 animate-slide-up">

                        {/* Shipping Summary */}
                        <div className="bg-surface rounded-2xl shadow-sm border border-default p-6 md:p-8">
                            <div className="flex items-start gap-4 mb-4">
                                <div className="p-3 bg-brand-subtle rounded-xl text-brand">
                                    <Truck size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-primary">Shipping</h2>
                                    <p className="mt-2 text-secondary">
                                        <strong className="font-semibold text-primary">Address: </strong>
                                        {shippingAddress.address}, {shippingAddress.city}, {shippingAddress.postalCode}, {shippingAddress.country}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Payment Summary */}
                        <div className="bg-surface rounded-2xl shadow-sm border border-default p-6 md:p-8">
                            <div className="flex items-start gap-4 mb-4">
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

                                    <div className="bg-page p-6 rounded-xl border border-default border-dashed text-center">
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
                                                        disabled={uploading}
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
                                                    className="text-sm text-brand hover:brightness-90 mt-2 hover:underline"
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
                        <div className="bg-surface rounded-2xl shadow-sm border border-default p-6 md:p-8 overflow-hidden">
                            <h2 className="text-xl font-bold text-primary mb-6">Order Items</h2>
                            {checkoutItems.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-secondary mb-4">Your cart is empty.</p>
                                    <Link to="/shop" className="text-brand hover:underline">Go back to Shop</Link>
                                </div>
                            ) : (
                                <ul className="divide-y divide-default">
                                    {checkoutItems.map((item, index) => (
                                        <li key={index} className="py-4 flex items-center gap-4">
                                            <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0 border border-default">
                                                {item.images && item.images[0] ? (
                                                    <img src={item.images[0].url} alt={item.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full bg-brand-subtle opacity-50"></div>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <Link to={`/product/${item._id}`} className="font-semibold text-primary hover:text-brand transition-colors line-clamp-1">
                                                    {item.name}
                                                </Link>
                                                {item.variant && (
                                                    <p className="text-brand text-[10px] font-bold uppercase tracking-wider mt-1">
                                                        {item.variant.name}: {item.variant.value}
                                                    </p>
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
                        <div className="bg-surface rounded-2xl shadow-sm border border-default p-6 sticky top-24">
                            <h2 className="text-xl font-bold text-primary mb-6 pb-4 border-b border-default">Order Summary</h2>

                            <div className="space-y-4 mb-6 text-sm">
                                <div className="flex justify-between text-secondary">
                                    <span>Items</span>
                                    <span className="font-medium text-primary">{currency}{itemsPrice}</span>
                                </div>
                                <div className="flex justify-between text-secondary">
                                    <span>Shipping</span>
                                    <span className="font-medium text-primary">{currency}{shippingPrice}</span>
                                </div>
                                <div className="flex justify-between text-secondary">
                                    <span>Tax ({taxRate}%)</span>
                                    <span className="font-medium text-primary">{currency}{taxPrice}</span>
                                </div>
                            </div>

                            <div className="border-t border-default pt-4 mb-8 flex justify-between items-center">
                                <span className="text-lg font-bold text-primary">Total</span>
                                <span className="text-3xl font-bold text-brand">{currency}{totalPrice}</span>
                            </div>

                            <button
                                type="button"
                                className="w-full btn-primary py-4 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
                                disabled={checkoutItems.length === 0 || (paymentMethod === 'Bank Transfer' && !paymentSlip)}
                                onClick={placeOrderHandler}
                            >
                                Place Order
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
