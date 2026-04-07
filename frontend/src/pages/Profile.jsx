import { useState } from 'react';
import { useAuthStore } from '../context/useAuthStore';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AlertCircle, CreditCard, MapPin, Plus, Trash2, Loader2, Check, User, Mail, Shield, Edit3, Camera, Phone, Calendar, LogOut } from 'lucide-react';

const Profile = () => {
    const { userInfo, setCredentials, logout } = useAuthStore();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    // Local State for Forms
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [newAddress, setNewAddress] = useState({ address: '', city: '', postalCode: '', country: '' });

    const [showCardForm, setShowCardForm] = useState(false);
    const [newCard, setNewCard] = useState({ cardName: '', cardNumber: '', expiryDate: '' });

    // Profile Edit State
    const [showEditProfile, setShowEditProfile] = useState(false);
    const [editProfileData, setEditProfileData] = useState({
        name: userInfo?.name || '',
        email: userInfo?.email || '',
        phone: userInfo?.phone || '',
        dob: userInfo?.dob ? userInfo.dob.split('T')[0] : ''
    });
    const [profileImageFile, setProfileImageFile] = useState(null);
    const [profileImagePreview, setProfileImagePreview] = useState(null);

    const savedAddresses = userInfo?.addresses || [];
    const savedCards = userInfo?.paymentCards || [];

    const handleSaveProfile = async (updates, successMsg, isFormData = false) => {
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const config = {
                headers: { 
                    Authorization: `Bearer ${userInfo.token}`,
                    // Axios automatically sets multipart/form-data boundary when data is FormData
                    ...(isFormData ? {} : { 'Content-Type': 'application/json' })
                }
            };

            const { data } = await axios.put('/api/users/profile', updates, config);

            // Re-inject the token so authStore doesn't lose it on cache update
            const updatedUser = { ...data, token: userInfo.token };
            setCredentials(updatedUser);

            if (successMsg) {
                setSuccess(successMsg);
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    // --- Addresses ---
    const handleAddAddress = async (e) => {
        e.preventDefault();
        const updatedAddresses = [...savedAddresses, newAddress];
        await handleSaveProfile({ addresses: updatedAddresses }, 'Address added successfully!');
        setShowAddressForm(false);
        setNewAddress({ address: '', city: '', postalCode: '', country: '' });
    };

    const handleDeleteAddress = async (index) => {
        const updatedAddresses = savedAddresses.filter((_, i) => i !== index);
        await handleSaveProfile({ addresses: updatedAddresses }, 'Address removed successfully!');
    };

    // --- Profile Editing ---
    const handleProfileImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfileImageFile(file);
            setProfileImagePreview(URL.createObjectURL(file));
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        
        const formData = new FormData();
        formData.append('name', editProfileData.name);
        formData.append('email', editProfileData.email);
        if (editProfileData.phone) formData.append('phone', editProfileData.phone);
        if (editProfileData.dob) formData.append('dob', editProfileData.dob);
        if (profileImageFile) {
            formData.append('profileImage', profileImageFile);
        }

        await handleSaveProfile(formData, 'Profile updated successfully!', true);
        setShowEditProfile(false);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (!userInfo) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-page">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-primary mb-2">Not Logged In</h2>
                    <p className="text-secondary mb-6">Please log in to view your profile.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-page min-h-screen py-12 animate-fade-in">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h1 className="text-3xl font-black text-primary tracking-tight">My Profile</h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Personal Info */}
                    <div className="lg:col-span-5 flex flex-col gap-6 animate-slide-up">             {success && (
                    <div className="mb-6 bg-success-bg text-success p-4 rounded-xl flex items-center gap-3 border border-success-bg">
                        <Check size={20} />
                        <span className="font-medium text-sm">{success}</span>
                    </div>
                )}
                {error && (
                    <div className="mb-6 bg-error-bg text-error p-4 rounded-xl flex items-center gap-3 border border-error-bg">
                        <AlertCircle size={20} />
                        <span className="font-medium text-sm">{error}</span>
                    </div>
                )}
                        <div className="bg-surface rounded-3xl shadow-sm border border-default p-6 sm:p-8 sticky top-24">
                            <div className="flex flex-col items-center text-center mb-6 relative group">
                                <div className="w-28 h-28 bg-brand-subtle rounded-full flex items-center justify-center mb-4 border-4 border-surface shadow-md overflow-hidden relative">
                                    {userInfo?.profileImage?.url ? (
                                        <img src={userInfo.profileImage.url} alt={userInfo.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={48} className="text-brand" />
                                    )}
                                </div>
                                <h2 className="text-2xl font-bold text-primary">{userInfo.name}</h2>
                                <p className="text-brand font-medium text-sm mt-1 flex items-center justify-center gap-1">
                                    <Shield size={14} />
                                    <span className="capitalize">{userInfo.role} Account</span>
                                </p>
                                <button 
                                    disabled={loading}
                                    onClick={() => setShowEditProfile(true)}
                                    className="mt-4 text-xs font-semibold text-brand bg-brand-subtle hover:brightness-95 px-4 py-2 rounded-full transition-colors flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    <Edit3 size={14} /> Edit Profile
                                </button>
                            </div>

                            <div className="space-y-4 border-t border-default pt-6">
                                <div>
                                    <label className="text-xs font-bold text-tertiary uppercase tracking-wider mb-1 block">Email Address</label>
                                    <div className="flex items-center gap-3 text-primary font-medium bg-muted px-4 py-3 rounded-xl border border-default truncate">
                                        <Mail size={18} className="text-tertiary shrink-0" />
                                        <span className="truncate">{userInfo.email}</span>
                                    </div>
                                </div>
                                {userInfo.phone && (
                                    <div>
                                        <label className="text-xs font-bold text-tertiary uppercase tracking-wider mb-1 block">Phone Number</label>
                                        <div className="flex items-center gap-3 text-primary font-medium bg-muted px-4 py-3 rounded-xl border border-default">
                                            <Phone size={18} className="text-tertiary shrink-0" />
                                            {userInfo.phone}
                                        </div>
                                    </div>
                                )}
                                {userInfo.dob && (
                                    <div>
                                        <label className="text-xs font-bold text-tertiary uppercase tracking-wider mb-1 block">Date of Birth</label>
                                        <div className="flex items-center gap-3 text-primary font-medium bg-muted px-4 py-3 rounded-xl border border-default">
                                            <Calendar size={18} className="text-tertiary shrink-0" />
                                            {new Date(userInfo.dob).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric'})}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Saved Addresses & Payment Cards */}
                    <div className="lg:col-span-7 flex flex-col gap-6 animate-slide-up-delayed-1">
                        <div className="bg-surface rounded-3xl shadow-sm border border-default p-6 sm:p-8">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-default">
                                <div>
                                    <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                                        <MapPin className="text-brand" size={24} />
                                        Addresses Book
                                    </h2>
                                    <p className="text-sm text-secondary mt-1">Manage your shipping destinations</p>
                                </div>
                                <button
                                    disabled={loading}
                                    onClick={() => setShowAddressForm(!showAddressForm)}
                                    className="text-sm font-semibold btn-primary px-4 py-2 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    <Plus size={16} /> Add New Address
                                </button>
                            </div>

                            {showAddressForm && (
                                <form onSubmit={handleAddAddress} className="mb-8 bg-brand-subtle/50 p-6 rounded-2xl border border-brand-subtle animate-fade-in-up">
                                    <h3 className="font-bold text-primary mb-4">Add a new address</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-secondary mb-1">Street Address</label>
                                            <input type="text" required value={newAddress.address} onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })} className="w-full px-4 py-2 border border-default rounded-xl input-focus text-primary text-sm bg-surface shadow-sm" placeholder="123 Main St, Apt 4B" />
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-semibold text-secondary mb-1">City</label>
                                                <input type="text" required value={newAddress.city} onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })} className="w-full px-4 py-2 border border-default rounded-xl input-focus text-primary text-sm bg-surface shadow-sm" placeholder="Colombo" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-secondary mb-1">Postal Code</label>
                                                <input type="text" required value={newAddress.postalCode} onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })} className="w-full px-4 py-2 border border-default rounded-xl input-focus text-primary text-sm bg-surface shadow-sm" placeholder="10001" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-secondary mb-1">Country</label>
                                            <input type="text" required value={newAddress.country} onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })} className="w-full px-4 py-2 border border-default rounded-xl input-focus text-primary text-sm bg-surface shadow-sm" placeholder="Sri Lanka" />
                                        </div>
                                        <div className="flex gap-3 pt-4 border-t border-default mt-6">
                                            <button type="button" disabled={loading} onClick={() => setShowAddressForm(false)} className="flex-1 px-4 py-2.5 border border-default text-secondary rounded-xl text-sm font-semibold hover:bg-surface bg-muted transition-colors disabled:opacity-60 disabled:cursor-not-allowed">Cancel</button>
                                            <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 btn-primary rounded-xl text-sm font-semibold transition-colors disabled:opacity-50">{loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Save Address'}</button>
                                        </div>
                                    </div>
                                </form>
                            )}

                            <div className="grid grid-cols-1 gap-4">
                                {savedAddresses.length === 0 ? (
                                    <div className="text-center py-12 bg-page rounded-2xl border border-default border-dashed">
                                        <MapPin className="mx-auto h-12 w-12 text-tertiary mb-3" />
                                        <p className="text-secondary font-medium">No addresses saved yet.</p>
                                        <p className="text-tertiary text-sm mt-1">Add one above for faster checkout.</p>
                                    </div>
                                ) : (
                                    savedAddresses.map((addr, index) => (
                                        <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl border border-default bg-surface hover:border-brand-subtle hover:shadow-lg hover:shadow-brand-subtle/50 transition-all group">
                                            <div className="flex-1 mb-4 sm:mb-0">
                                                <p className="font-bold text-primary text-lg">{addr.address}</p>
                                                <p className="text-secondary mt-1">{addr.city}, {addr.postalCode}</p>
                                                <p className="text-secondary font-medium">{addr.country}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button disabled={loading} onClick={() => handleDeleteAddress(index)} className="p-2 sm:px-4 sm:py-2 text-error hover:bg-error-bg border border-transparent hover:border-error-bg rounded-xl transition-all flex items-center gap-2 text-sm font-semibold w-full sm:w-auto justify-center disabled:opacity-60 disabled:cursor-not-allowed" title="Delete Address">
                                                    <Trash2 size={18} className="sm:hidden" />
                                                    <span className="hidden sm:inline">Delete</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-10 border-t border-default pt-6 flex justify-center">
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-error-bg text-error font-semibold hover:bg-error-bg transition-colors"
                    >
                        <LogOut size={16} /> Logout
                    </button>
                </div>

                {/* Edit Profile Modal */}
                {showEditProfile && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowEditProfile(false)}></div>
                        <div className="bg-surface rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative z-10 animate-fade-in-up">
                            <div className="p-6 sm:p-8 border-b border-default flex justify-between items-center">
                                <h2 className="text-xl font-bold text-primary">Edit Profile</h2>
                                <button onClick={() => setShowEditProfile(false)} className="text-tertiary hover:text-secondary transition-colors">
                                    <Trash2 size={20} className="rotate-45" /> {/* Using Trash2 as an 'X' close button visually for speed */}
                                </button>
                            </div>
                            <div className="p-6 sm:p-8 max-h-[70vh] overflow-y-auto">
                                <form id="editProfileForm" onSubmit={handleUpdateProfile} className="space-y-5">
                                    
                                    <div className="flex flex-col items-center mb-6">
                                        <div className="relative group cursor-pointer">
                                            <div className="w-24 h-24 bg-brand-subtle rounded-full flex items-center justify-center border-4 border-brand-subtle shadow-sm overflow-hidden">
                                                {profileImagePreview ? (
                                                    <img src={profileImagePreview} alt="Preview" className="w-full h-full object-cover" />
                                                ) : userInfo?.profileImage?.url ? (
                                                    <img src={userInfo.profileImage.url} alt="Current" className="w-full h-full object-cover" />
                                                ) : (
                                                    <User size={40} className="text-brand" />
                                                )}
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Camera size={24} className="text-white" />
                                                </div>
                                            </div>
                                            <input 
                                                type="file" 
                                                accept="image/*" 
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                                                onChange={handleProfileImageChange} 
                                                title="Change Profile Picture"
                                            />
                                        </div>
                                        <p className="text-xs text-secondary font-medium mt-3">Click to change picture</p>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-secondary mb-1">Full Name</label>
                                        <input type="text" required value={editProfileData.name} onChange={(e) => setEditProfileData({...editProfileData, name: e.target.value})} className="w-full px-4 py-3 border border-default rounded-xl input-focus text-primary text-sm bg-muted focus:bg-surface transition-colors" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-secondary mb-1">Email Address</label>
                                        <input type="email" required value={editProfileData.email} onChange={(e) => setEditProfileData({...editProfileData, email: e.target.value})} className="w-full px-4 py-3 border border-default rounded-xl input-focus text-primary text-sm bg-muted focus:bg-surface transition-colors" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-secondary mb-1">Phone Number</label>
                                        <input type="tel" value={editProfileData.phone} onChange={(e) => setEditProfileData({...editProfileData, phone: e.target.value})} className="w-full px-4 py-3 border border-default rounded-xl input-focus text-primary text-sm bg-muted focus:bg-surface transition-colors" placeholder="+1 (555) 123-4567" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-secondary mb-1">Date of Birth</label>
                                        <input type="date" value={editProfileData.dob} onChange={(e) => setEditProfileData({...editProfileData, dob: e.target.value})} className="w-full px-4 py-3 border border-default rounded-xl input-focus text-primary text-sm bg-muted focus:bg-surface transition-colors" />
                                    </div>
                                </form>
                            </div>
                            <div className="p-6 border-t border-default flex gap-3">
                                <button type="button" disabled={loading} onClick={() => setShowEditProfile(false)} className="flex-1 px-4 py-3 border border-default text-secondary rounded-xl text-sm font-bold hover:bg-muted transition-colors disabled:opacity-60 disabled:cursor-not-allowed">Cancel</button>
                                <button type="submit" form="editProfileForm" disabled={loading} className="flex-1 px-4 py-3 btn-primary rounded-xl text-sm font-bold transition-colors shadow-sm flex items-center justify-center">
                                    {loading ? <Loader2 size={18} className="animate-spin" /> : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Profile;
