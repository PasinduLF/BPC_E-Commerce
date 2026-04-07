import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../context/useCartStore';
import { useAuthStore } from '../context/useAuthStore';
import { Building, Wallet, CreditCard as CreditCardIcon, Plus } from 'lucide-react';

const Payment = () => {
    const navigate = useNavigate();
    const { userInfo } = useAuthStore();
    const { shippingAddress, paymentMethod, savePaymentMethod } = useCartStore();

    const [selectedMethod, setSelectedMethod] = useState(paymentMethod || 'Cash on Delivery');
    const [selectedCardId, setSelectedCardId] = useState('');

    useEffect(() => {
        if (!shippingAddress.address) {
            navigate('/shipping');
        }
    }, [shippingAddress, navigate]);

    const submitHandler = (e) => {
        e.preventDefault();
        savePaymentMethod(selectedMethod);
        navigate('/placeorder');
    };

    const hasSavedCards = userInfo?.paymentCards?.length > 0;

    return (
        <div className="bg-page min-h-screen py-12 animate-fade-in">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Checkout Steps - Simplified visual */}
                <div className="flex justify-center mb-10 sm:mb-12 animate-slide-up">
                    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm font-medium">
                        <span className="text-brand bg-brand-subtle px-3 py-1 rounded-full border border-brand-subtle line-through decoration-brand-subtle">1. Shipping</span>
                        <div className="hidden sm:block w-8 h-px bg-brand-subtle"></div>
                        <span className="text-brand bg-brand-subtle px-3 py-1 rounded-full border border-brand-subtle">2. Payment</span>
                        <div className="hidden sm:block w-8 h-px bg-default"></div>
                        <span className="text-tertiary">3. Order placed</span>
                    </div>
                </div>

                <div className="bg-surface rounded-3xl shadow-sm border border-default p-5 sm:p-8 lg:p-12 animate-slide-up-delayed-1">
                    <h1 className="text-3xl font-extrabold text-primary tracking-tight mb-8">Payment Method</h1>

                    <form onSubmit={submitHandler} className="space-y-6">

                        <fieldset>
                            <legend className="sr-only">Choose a payment method</legend>
                            <div className="space-y-4">

                                {/* Cash on Delivery Option */}
                                <label className={`relative flex items-center p-6 cursor-pointer rounded-2xl border-2 transition-all ${selectedMethod === 'Cash on Delivery' ? 'border-brand bg-brand-subtle/50' : 'border-default bg-surface hover:border-brand-subtle'}`}>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-surface rounded-full flex items-center justify-center shadow-sm text-brand">
                                            <Wallet size={24} />
                                        </div>
                                        <div>
                                            <p className="text-lg font-semibold text-primary">Cash on Delivery</p>
                                            <p className="text-secondary text-sm mt-1">Pay when you receive your order.</p>
                                        </div>
                                    </div>
                                    <div className="ml-auto">
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedMethod === 'Cash on Delivery' ? 'border-brand' : 'border-muted'}`}>
                                            {selectedMethod === 'Cash on Delivery' && <div className="w-3 h-3 bg-brand rounded-full"></div>}
                                        </div>
                                    </div>
                                    <input
                                        type="radio"
                                        className="sr-only"
                                        name="paymentMethod"
                                        value="Cash on Delivery"
                                        onChange={(e) => setSelectedMethod(e.target.value)}
                                    />
                                </label>

                                {/* Bank Transfer Option */}
                                <label className={`relative flex items-center p-6 cursor-pointer rounded-2xl border-2 transition-all ${selectedMethod === 'Bank Transfer' ? 'border-brand bg-brand-subtle/50' : 'border-default bg-surface hover:border-brand-subtle'}`}>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-surface rounded-full flex items-center justify-center shadow-sm text-brand">
                                            <Building size={24} />
                                        </div>
                                        <div>
                                            <p className="text-lg font-semibold text-primary">Bank Transfer</p>
                                            <p className="text-secondary text-sm mt-1">Upload a payment slip to complete your order.</p>
                                        </div>
                                    </div>
                                    <div className="ml-auto">
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedMethod === 'Bank Transfer' ? 'border-brand' : 'border-muted'}`}>
                                            {selectedMethod === 'Bank Transfer' && <div className="w-3 h-3 bg-brand rounded-full"></div>}
                                        </div>
                                    </div>
                                    <input
                                        type="radio"
                                        className="sr-only"
                                        name="paymentMethod"
                                        value="Bank Transfer"
                                        onChange={(e) => setSelectedMethod(e.target.value)}
                                    />
                                </label>

                            </div>
                        </fieldset>

                        <div className="pt-6">
                            <button type="submit" className="w-full btn-primary py-4 text-lg">
                                Continue to Review
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Payment;
