import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../context/useCartStore';
import { useAuthStore } from '../context/useAuthStore';
import { Building, Wallet, CreditCard as CreditCardIcon, Plus } from 'lucide-react';
import StepIndicator from '../components/StepIndicator';

const Payment = () => {
    const navigate = useNavigate();
    const { userInfo } = useAuthStore();
    const { shippingAddress, paymentMethod, savePaymentMethod } = useCartStore();
    const isPickupOrder = shippingAddress?.fulfillmentType === 'pickup';

    const [selectedMethod, setSelectedMethod] = useState(isPickupOrder ? 'Bank Transfer' : (paymentMethod || 'Cash on Delivery'));
    const [selectedCardId, setSelectedCardId] = useState('');

    useEffect(() => {
        if (!shippingAddress.address) {
            navigate('/shipping');
        }
    }, [shippingAddress, navigate]);

    useEffect(() => {
        if (isPickupOrder) {
            setSelectedMethod('Bank Transfer');
        }
    }, [isPickupOrder]);

    const submitHandler = (e) => {
        e.preventDefault();
        savePaymentMethod(selectedMethod);
        navigate('/placeorder');
    };

    const hasSavedCards = userInfo?.paymentCards?.length > 0;

    return (
        <div className="bg-page min-h-screen py-10 sm:py-12 animate-fade-in">
            <div className="max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-6">

                {/* Step Indicator */}
                <StepIndicator currentStep={3} steps={['Shopping Bag', 'Shipping', 'Payment']} />

                {/* Payment Method Selection */}

                <div className="bg-surface rounded-3xl shadow-sm border border-default p-4 sm:p-8 lg:p-12 animate-slide-up-delayed-1">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight mb-6 sm:mb-8">Payment Method</h1>

                    <form onSubmit={submitHandler} className="space-y-6">

                        <fieldset>
                            <legend className="sr-only">Choose a payment method</legend>
                            <div className="space-y-4">

                                {!isPickupOrder && (
                                    <label className={`relative flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-0 p-4 sm:p-6 cursor-pointer rounded-2xl border-2 transition-all ${selectedMethod === 'Cash on Delivery' ? 'border-brand bg-brand-subtle/50' : 'border-default bg-surface hover:border-brand-subtle'}`}>
                                        <div className="flex items-center gap-4 w-full sm:w-auto min-w-0">
                                            <div className="w-12 h-12 bg-surface rounded-full flex items-center justify-center shadow-sm text-brand">
                                                <Wallet size={24} />
                                            </div>
                                            <div>
                                                <p className="text-base sm:text-lg font-semibold text-primary">Cash on Delivery</p>
                                                <p className="text-secondary text-sm mt-1">Pay when you receive your order.</p>
                                            </div>
                                        </div>
                                        <div className="ml-0 sm:ml-auto self-end sm:self-auto">
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
                                )}

                                {/* Bank Transfer Option */}
                                <label className={`relative flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-0 p-4 sm:p-6 cursor-pointer rounded-2xl border-2 transition-all ${selectedMethod === 'Bank Transfer' ? 'border-brand bg-brand-subtle/50' : 'border-default bg-surface hover:border-brand-subtle'}`}>
                                    <div className="flex items-center gap-4 w-full sm:w-auto min-w-0">
                                        <div className="w-12 h-12 bg-surface rounded-full flex items-center justify-center shadow-sm text-brand">
                                            <Building size={24} />
                                        </div>
                                        <div>
                                            <p className="text-base sm:text-lg font-semibold text-primary">Bank Transfer</p>
                                            <p className="text-secondary text-sm mt-1">Upload a payment slip to complete your order.</p>
                                        </div>
                                    </div>
                                    <div className="ml-0 sm:ml-auto self-end sm:self-auto">
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

                                {isPickupOrder && (
                                    <p className="text-sm text-secondary bg-page border border-default rounded-xl p-4 leading-relaxed">
                                        Store pickup orders can only be paid via bank transfer.
                                    </p>
                                )}

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
