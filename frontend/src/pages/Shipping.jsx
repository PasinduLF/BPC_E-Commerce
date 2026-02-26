import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../context/useCartStore';

const Shipping = () => {
    const { shippingAddress, saveShippingAddress } = useCartStore();
    const navigate = useNavigate();

    const [address, setAddress] = useState(shippingAddress.address || '');
    const [city, setCity] = useState(shippingAddress.city || '');
    const [postalCode, setPostalCode] = useState(shippingAddress.postalCode || '');
    const [country, setCountry] = useState(shippingAddress.country || '');

    const submitHandler = (e) => {
        e.preventDefault();
        saveShippingAddress({ address, city, postalCode, country });
        navigate('/payment');
    };

    return (
        <div className="bg-slate-50 min-h-screen py-12">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Checkout Steps - Simplified visual */}
                <div className="flex justify-center mb-12">
                    <div className="flex items-center gap-4 text-sm font-medium">
                        <span className="text-pink-600 bg-pink-50 px-3 py-1 rounded-full border border-pink-100">1. Shipping</span>
                        <div className="w-8 h-px bg-slate-200"></div>
                        <span className="text-slate-400">2. Payment</span>
                        <div className="w-8 h-px bg-slate-200"></div>
                        <span className="text-slate-400">3. Order placed</span>
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 sm:p-12">
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-8">Shipping Information</h1>

                    <form onSubmit={submitHandler} className="space-y-6">

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Street Address</label>
                            <input
                                type="text"
                                required
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white input-focus"
                                placeholder="123 Beauty Lane, Apt 4"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">City</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white input-focus"
                                    placeholder="New York"
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Postal Code</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white input-focus"
                                    placeholder="10001"
                                    value={postalCode}
                                    onChange={(e) => setPostalCode(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Country</label>
                            <input
                                type="text"
                                required
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white input-focus"
                                placeholder="United States"
                                value={country}
                                onChange={(e) => setCountry(e.target.value)}
                            />
                        </div>

                        <div className="pt-6">
                            <button type="submit" className="w-full btn-primary py-4 text-lg">
                                Continue to Payment
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Shipping;
