import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../context/useCartStore';
import { useAuthStore } from '../context/useAuthStore';
import { useConfigStore } from '../context/useConfigStore';
import { MapPin, Plus } from 'lucide-react';

const Shipping = () => {
    const { shippingAddress, saveShippingAddress } = useCartStore();
    const { userInfo } = useAuthStore();
    const { config } = useConfigStore();
    const navigate = useNavigate();

    const [fulfillmentType, setFulfillmentType] = useState(shippingAddress.fulfillmentType || 'delivery');
    const [name, setName] = useState(shippingAddress.name || userInfo?.name || '');
    const [address, setAddress] = useState(shippingAddress.address || '');
    const [city, setCity] = useState(shippingAddress.city || '');
    const [postalCode, setPostalCode] = useState(shippingAddress.postalCode || '');
    const [country, setCountry] = useState(shippingAddress.country || '');
    const [phone, setPhone] = useState(shippingAddress.phone || userInfo?.phone || '');

    const [showNewForm, setShowNewForm] = useState(!userInfo?.addresses?.length);

    const handleSelectSavedAddress = (addr) => {
        setName(userInfo?.name || shippingAddress.name || '');
        setAddress(addr.address);
        setCity(addr.city);
        setPostalCode(addr.postalCode);
        setCountry(addr.country);
        setPhone(shippingAddress.phone || userInfo?.phone || '');
        setShowNewForm(true);
    };

    const submitHandler = (e) => {
        e.preventDefault();

        if (fulfillmentType === 'pickup') {
            saveShippingAddress({
                fulfillmentType,
                name,
                phone,
                address: config?.pickupStore?.address || 'Store Pickup',
                city: config?.pickupStore?.city || 'Store City',
                postalCode: 'N/A',
                country: 'N/A'
            });
        } else {
            saveShippingAddress({ fulfillmentType, name, address, city, postalCode, country, phone });
        }

        navigate('/payment');
    };

    return (
        <div className="bg-page min-h-screen py-12 animate-fade-in">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Checkout Steps - Simplified visual */}
                <div className="flex justify-center mb-10 sm:mb-12 animate-slide-up">
                    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm font-medium">
                        <span className="text-brand bg-brand-subtle px-3 py-1 rounded-full border border-brand-subtle">1. Shipping</span>
                        <div className="hidden sm:block w-8 h-px bg-default"></div>
                        <span className="text-tertiary">2. Payment</span>
                        <div className="hidden sm:block w-8 h-px bg-default"></div>
                        <span className="text-tertiary">3. Order placed</span>
                    </div>
                </div>

                <div className="bg-surface rounded-3xl shadow-sm border border-default p-5 sm:p-8 lg:p-12 animate-slide-up-delayed-1">
                    <h1 className="text-3xl font-extrabold text-primary tracking-tight mb-8">Shipping Information</h1>

                    <div className="mb-8">
                        <h2 className="text-lg font-bold text-primary mb-4">Delivery Method</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setFulfillmentType('delivery')}
                                className={`text-left border-2 rounded-xl p-4 transition-all ${fulfillmentType === 'delivery' ? 'border-brand bg-brand-subtle/40' : 'border-default bg-page hover:border-brand-subtle'}`}
                            >
                                <p className="font-semibold text-primary">Home Delivery</p>
                                <p className="text-sm text-secondary mt-1">Ship order to your address.</p>
                            </button>
                            <button
                                type="button"
                                onClick={() => setFulfillmentType('pickup')}
                                className={`text-left border-2 rounded-xl p-4 transition-all ${fulfillmentType === 'pickup' ? 'border-brand bg-brand-subtle/40' : 'border-default bg-page hover:border-brand-subtle'}`}
                            >
                                <p className="font-semibold text-primary">Store Pickup</p>
                                <p className="text-sm text-secondary mt-1">Pick up from our store (bank transfer only).</p>
                            </button>
                        </div>
                    </div>

                    {fulfillmentType === 'delivery' && userInfo?.addresses?.length > 0 && (
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

                    {fulfillmentType === 'pickup' && (
                        <div className="mb-6 p-5 rounded-xl border border-default bg-page">
                            <h2 className="text-lg font-bold text-primary mb-3">Pickup Location</h2>
                            {config?.pickupStore?.storeName && config?.pickupStore?.address ? (
                                <div className="space-y-1 text-secondary text-sm">
                                    <p><span className="font-semibold text-primary">Store:</span> {config.pickupStore.storeName}</p>
                                    <p><span className="font-semibold text-primary">Address:</span> {config.pickupStore.address}, {config.pickupStore.city}</p>
                                    {config.pickupStore.phone && <p><span className="font-semibold text-primary">Phone:</span> {config.pickupStore.phone}</p>}
                                    {config.pickupStore.openingHours && <p><span className="font-semibold text-primary">Hours:</span> {config.pickupStore.openingHours}</p>}
                                    {config.pickupStore.notes && <p><span className="font-semibold text-primary">Notes:</span> {config.pickupStore.notes}</p>}
                                </div>
                            ) : (
                                <p className="text-sm text-warning">Pickup store details are not configured yet. Please contact support.</p>
                            )}
                        </div>
                    )}

                    {(fulfillmentType === 'pickup' || !userInfo?.addresses?.length || showNewForm) && (
                        <form onSubmit={submitHandler} className="space-y-6 pt-6 border-t border-default">
                            <h2 className="text-lg font-bold text-primary mb-4">
                                {fulfillmentType === 'pickup' ? 'Pickup Contact Details' : 'New Address Details'}
                            </h2>

                            <div>
                                <label className="block text-sm font-medium text-secondary mb-2">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-3 border border-default rounded-xl bg-muted focus:bg-surface input-focus text-primary"
                                    placeholder="Your full name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>

                            {fulfillmentType === 'delivery' && (
                                <>
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
                                </>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-secondary mb-2">Phone Number</label>
                                <input
                                    type="tel"
                                    required
                                    className="w-full px-4 py-3 border border-default rounded-xl bg-muted focus:bg-surface input-focus text-primary"
                                    placeholder="(555) 123-4567"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
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
