import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../context/useCartStore';
import { useAuthStore } from '../context/useAuthStore';
import { MapPin, Plus } from 'lucide-react';

const Shipping = () => {
    const { shippingAddress, saveShippingAddress } = useCartStore();
    const { userInfo } = useAuthStore();
    const navigate = useNavigate();

    const [address, setAddress] = useState(shippingAddress.address || '');
    const [city, setCity] = useState(shippingAddress.city || '');
    const [postalCode, setPostalCode] = useState(shippingAddress.postalCode || '');
    const [country, setCountry] = useState(shippingAddress.country || '');

    const [showNewForm, setShowNewForm] = useState(!userInfo?.addresses?.length);

    const handleSelectSavedAddress = (addr) => {
        setAddress(addr.address);
        setCity(addr.city);
        setPostalCode(addr.postalCode);
        setCountry(addr.country);
        saveShippingAddress(addr);
        navigate('/payment');
    };

    const submitHandler = (e) => {
        e.preventDefault();
        saveShippingAddress({ address, city, postalCode, country });
        navigate('/payment');
    };

    return (
        <div className="bg-page min-h-screen py-12 animate-fade-in">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Checkout Steps - Simplified visual */}
                <div className="flex justify-center mb-12 animate-slide-up">
                    <div className="flex items-center gap-4 text-sm font-medium">
                        <span className="text-brand bg-brand-subtle px-3 py-1 rounded-full border border-brand-subtle">1. Shipping</span>
                        <div className="w-8 h-px bg-default"></div>
                        <span className="text-tertiary">2. Payment</span>
                        <div className="w-8 h-px bg-default"></div>
                        <span className="text-tertiary">3. Order placed</span>
                    </div>
                </div>

                <div className="bg-surface rounded-3xl shadow-sm border border-default p-8 sm:p-12 animate-slide-up-delayed-1">
                    <h1 className="text-3xl font-extrabold text-primary tracking-tight mb-8">Shipping Information</h1>

                    {userInfo?.addresses?.length > 0 && (
                        <div className="mb-10">
                            <h2 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
                                <MapPin size={20} className="text-brand" />
                                Select a Saved Address
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {userInfo.addresses.map((addr, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => handleSelectSavedAddress(addr)}
                                        className={`cursor-pointer border-2 rounded-2xl p-5 hover:border-brand-subtle transition-all ${address === addr.address ? 'border-brand bg-brand-subtle/50' : 'border-default bg-surface'}`}
                                    >
                                        <p className="font-semibold text-primary">{addr.address}</p>
                                        <p className="text-sm text-secondary mt-1">{addr.city}, {addr.postalCode}</p>
                                        <p className="text-sm text-secondary">{addr.country}</p>
                                    </div>
                                ))}
                                <div
                                    onClick={() => setShowNewForm(true)}
                                    className={`cursor-pointer border-2 rounded-2xl p-5 flex flex-col items-center justify-center text-secondary hover:border-brand-subtle hover:text-brand transition-all ${showNewForm ? 'border-brand bg-brand-subtle/50 text-brand' : 'border-default border-dashed bg-page'}`}
                                >
                                    <Plus size={24} className="mb-2" />
                                    <span className="font-medium text-sm">Enter New Address</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {(!userInfo?.addresses?.length || showNewForm) && (
                        <form onSubmit={submitHandler} className="space-y-6 pt-6 border-t border-default">
                            <h2 className="text-lg font-bold text-primary mb-4">New Address Details</h2>

                            <div>
                                <label className="block text-sm font-medium text-secondary mb-2">Street Address</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-3 border border-default rounded-xl bg-muted focus:bg-surface input-focus text-primary"
                                    placeholder="123 Beauty Lane, Apt 4"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-secondary mb-2">City</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-3 border border-default rounded-xl bg-muted focus:bg-surface input-focus text-primary"
                                        placeholder="New York"
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-secondary mb-2">Postal Code</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-3 border border-default rounded-xl bg-muted focus:bg-surface input-focus text-primary"
                                        placeholder="10001"
                                        value={postalCode}
                                        onChange={(e) => setPostalCode(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-secondary mb-2">Country</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-3 border border-default rounded-xl bg-muted focus:bg-surface input-focus text-primary"
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
                    )}
                </div>
            </div>
        </div>
    );
};

export default Shipping;
