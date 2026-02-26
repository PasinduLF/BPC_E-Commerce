import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../context/useCartStore';
import { Building, Wallet } from 'lucide-react';

const Payment = () => {
    const navigate = useNavigate();
    const { shippingAddress, paymentMethod, savePaymentMethod } = useCartStore();

    const [selectedMethod, setSelectedMethod] = useState(paymentMethod || 'Cash on Delivery');

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

    return (
        <div className="bg-slate-50 min-h-screen py-12">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

                <div className="flex justify-center mb-12">
                    <div className="flex items-center gap-4 text-sm font-medium">
                        <span className="text-pink-600 bg-pink-50 px-3 py-1 rounded-full border border-pink-100 line-through decoration-pink-300">1. Shipping</span>
                        <div className="w-8 h-px bg-pink-200"></div>
                        <span className="text-pink-600 bg-pink-50 px-3 py-1 rounded-full border border-pink-100">2. Payment</span>
                        <div className="w-8 h-px bg-slate-200"></div>
                        <span className="text-slate-400">3. Order placed</span>
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 sm:p-12">
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-8">Payment Method</h1>

                    <form onSubmit={submitHandler} className="space-y-6">

                        <fieldset>
                            <legend className="sr-only">Choose a payment method</legend>
                            <div className="space-y-4">

                                {/* Cash on Delivery Option */}
                                <label className={`relative flex items-center p-6 cursor-pointer rounded-2xl border-2 transition-all ${selectedMethod === 'Cash on Delivery' ? 'border-pink-500 bg-pink-50/50' : 'border-slate-100 bg-white hover:border-pink-200'}`}>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-pink-500">
                                            <Wallet size={24} />
                                        </div>
                                        <div>
                                            <p className="text-lg font-semibold text-slate-900">Cash on Delivery</p>
                                            <p className="text-slate-500 text-sm mt-1">Pay when you receive your order.</p>
                                        </div>
                                    </div>
                                    <div className="ml-auto">
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedMethod === 'Cash on Delivery' ? 'border-pink-500' : 'border-slate-300'}`}>
                                            {selectedMethod === 'Cash on Delivery' && <div className="w-3 h-3 bg-pink-500 rounded-full"></div>}
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
                                <label className={`relative flex items-center p-6 cursor-pointer rounded-2xl border-2 transition-all ${selectedMethod === 'Bank Transfer' ? 'border-pink-500 bg-pink-50/50' : 'border-slate-100 bg-white hover:border-pink-200'}`}>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-blue-500">
                                            <Building size={24} />
                                        </div>
                                        <div>
                                            <p className="text-lg font-semibold text-slate-900">Bank Transfer</p>
                                            <p className="text-slate-500 text-sm mt-1">Upload a payment slip to complete your order.</p>
                                        </div>
                                    </div>
                                    <div className="ml-auto">
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedMethod === 'Bank Transfer' ? 'border-pink-500' : 'border-slate-300'}`}>
                                            {selectedMethod === 'Bank Transfer' && <div className="w-3 h-3 bg-pink-500 rounded-full"></div>}
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
