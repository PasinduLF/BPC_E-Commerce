import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../context/useAuthStore';
import { useConfigStore } from '../../context/useConfigStore';
import { Settings, Save, AlertCircle, Plus, Trash2, Building } from 'lucide-react';

const SystemSettings = () => {
    const { userInfo } = useAuthStore();
    const { config, fetchConfig, updateConfigLocally } = useConfigStore();

    const [formData, setFormData] = useState({
        businessName: '',
        currencySymbol: '$',
        taxRate: 0,
        shippingFee: 0,
        freeShippingThreshold: 0,
        codDeliveryCharge: 0,
        bankDetails: [],
        contactEmail: '',
        contactPhone: ''
    });

    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        if (!config) {
            fetchConfig();
        } else {
            setFormData({
                businessName: config.businessName || '',
                currencySymbol: config.currencySymbol || '$',
                taxRate: config.taxRate || 0,
                shippingFee: config.shippingFee || 0,
                freeShippingThreshold: config.freeShippingThreshold || 0,
                codDeliveryCharge: config.codDeliveryCharge || 0,
                bankDetails: Array.isArray(config.bankDetails) ? config.bankDetails : [],
                contactEmail: config.contactEmail || '',
                contactPhone: config.contactPhone || ''
            });
        }
    }, [config, fetchConfig]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleBankDetailChange = (index, field, value) => {
        const updatedBanks = [...formData.bankDetails];
        updatedBanks[index][field] = value;
        setFormData({ ...formData, bankDetails: updatedBanks });
    };

    const addBankDetail = () => {
        setFormData({
            ...formData,
            bankDetails: [...formData.bankDetails, { bankName: '', accountName: '', accountNumber: '', branch: '' }]
        });
    };

    const removeBankDetail = (index) => {
        const updatedBanks = formData.bankDetails.filter((_, i) => i !== index);
        setFormData({ ...formData, bankDetails: updatedBanks });
    };

    const submitHandler = async (e) => {
        e.preventDefault();
        setMessage(null);
        setSaving(true);
        try {
            const reqConfig = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${userInfo.token}`,
                },
            };

            const { data } = await axios.put('http://localhost:5000/api/config', formData, reqConfig);

            updateConfigLocally(data);
            setMessage({ type: 'success', text: 'System configuration saved successfully!' });

            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update settings.' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                <div className="p-2 bg-slate-100 rounded-lg text-slate-700">
                    <Settings size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">System Configuration</h1>
                    <p className="text-slate-500 text-sm mt-1">Manage global variables and operational behaviors.</p>
                </div>
            </div>

            {message && (
                <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium animate-fade-in-up ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                    <AlertCircle size={18} />
                    {message.text}
                </div>
            )}

            <form onSubmit={submitHandler} className="space-y-8">
                {/* General Branding */}
                <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-100">
                    <h2 className="text-lg font-bold text-slate-800 mb-6 pb-2 border-b border-slate-50">General Branding</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Business Name</label>
                            <input
                                type="text" name="businessName" value={formData.businessName} onChange={handleChange}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none text-slate-700"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Currency Symbol</label>
                            <input
                                type="text" name="currencySymbol" value={formData.currencySymbol} onChange={handleChange}
                                placeholder="e.g. $, LKR, €, £"
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none text-slate-700 font-medium"
                            />
                            <p className="text-xs text-slate-400 mt-2">Appears globally. Ex: {formData.currencySymbol || '$'}120.00</p>
                        </div>
                    </div>
                </div>

                {/* E-Commerce Operations */}
                <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-100">
                    <h2 className="text-lg font-bold text-slate-800 mb-6 pb-2 border-b border-slate-50">Financial Operations</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Global Tax Rate (%)</label>
                            <input
                                type="number" step="0.01" min="0" name="taxRate" value={formData.taxRate} onChange={handleChange}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none text-slate-700"
                            />
                        </div>
                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-5 rounded-xl border border-slate-100">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Base Shipping Fee</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{formData.currencySymbol}</span>
                                    <input
                                        type="number" step="0.01" min="0" name="shippingFee" value={formData.shippingFee} onChange={handleChange}
                                        className="w-full pl-8 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none text-slate-700"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Free Shipping Threshold</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{formData.currencySymbol}</span>
                                    <input
                                        type="number" step="0.01" min="0" name="freeShippingThreshold" value={formData.freeShippingThreshold} onChange={handleChange}
                                        className="w-full pl-8 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none text-slate-700"
                                    />
                                </div>
                                <p className="text-xs text-slate-400 mt-2">Set to 0 to disable free shipping logic.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Payment Settings */}
                <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-100">
                    <h2 className="text-lg font-bold text-slate-800 mb-6 pb-2 border-b border-slate-50">Payment Settings</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">COD Delivery Charge</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{formData.currencySymbol}</span>
                                <input
                                    type="number" step="0.01" min="0" name="codDeliveryCharge" value={formData.codDeliveryCharge} onChange={handleChange}
                                    className="w-full pl-8 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none text-slate-700"
                                />
                            </div>
                            <p className="text-xs text-slate-400 mt-2">Extra fee applied when Cash on Delivery is selected.</p>
                        </div>
                        <div className="md:col-span-2 mt-4 border-t border-slate-100 pt-6">
                            <div className="flex justify-between items-center mb-4">
                                <label className="block text-sm font-bold text-slate-700">Bank Transfer Details</label>
                                <button
                                    type="button"
                                    onClick={addBankDetail}
                                    className="text-pink-600 bg-pink-50 hover:bg-pink-100 px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1 transition-colors"
                                >
                                    <Plus size={16} /> Add Bank Account
                                </button>
                            </div>

                            {formData.bankDetails.length === 0 ? (
                                <div className="text-center py-6 bg-slate-50 rounded-xl border border-slate-200 border-dashed text-slate-500 text-sm">
                                    No bank accounts added yet. Click above to add one.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {formData.bankDetails.map((bank, index) => (
                                        <div key={index} className="bg-slate-50 p-5 rounded-xl border border-slate-200 relative group">
                                            <button
                                                type="button"
                                                onClick={() => removeBankDetail(index)}
                                                className="absolute top-4 right-4 text-slate-400 hover:text-rose-500 transition-colors"
                                                title="Remove Bank Account"
                                            >
                                                <Trash2 size={18} />
                                            </button>

                                            <div className="flex items-center gap-2 text-slate-800 font-bold mb-4">
                                                <Building size={16} className="text-slate-400" />
                                                Bank Account {index + 1}
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Bank Name</label>
                                                    <input
                                                        type="text"
                                                        value={bank.bankName}
                                                        onChange={(e) => handleBankDetailChange(index, 'bankName', e.target.value)}
                                                        placeholder="e.g. ABC Bank"
                                                        required
                                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none text-slate-700 text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Branch</label>
                                                    <input
                                                        type="text"
                                                        value={bank.branch}
                                                        onChange={(e) => handleBankDetailChange(index, 'branch', e.target.value)}
                                                        placeholder="e.g. Main Branch"
                                                        required
                                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none text-slate-700 text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Account Name</label>
                                                    <input
                                                        type="text"
                                                        value={bank.accountName}
                                                        onChange={(e) => handleBankDetailChange(index, 'accountName', e.target.value)}
                                                        placeholder="e.g. Beauty P&C"
                                                        required
                                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none text-slate-700 text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Account Number</label>
                                                    <input
                                                        type="text"
                                                        value={bank.accountNumber}
                                                        onChange={(e) => handleBankDetailChange(index, 'accountNumber', e.target.value)}
                                                        placeholder="e.g. 123456789"
                                                        required
                                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none text-slate-700 text-sm"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <p className="text-xs text-slate-400 mt-3">These accounts will be shown to customers when they select Bank Transfer at checkout.</p>
                        </div>
                    </div>
                </div>

                {/* Contact Information */}
                <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-100">
                    <h2 className="text-lg font-bold text-slate-800 mb-6 pb-2 border-b border-slate-50">Support Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Contact Email</label>
                            <input
                                type="email" name="contactEmail" value={formData.contactEmail} onChange={handleChange}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none text-slate-700"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Contact Phone</label>
                            <input
                                type="text" name="contactPhone" value={formData.contactPhone} onChange={handleChange}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none text-slate-700"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={saving}
                        className="btn-primary flex items-center gap-2 text-base px-8 py-3 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        <Save size={18} />
                        {saving ? 'Saving Changes...' : 'Save Configuration'}
                    </button>
                </div>
            </form>

        </div>
    );
};

export default SystemSettings;
