import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../context/useAuthStore';
import { useConfigStore } from '../../context/useConfigStore';
import { Settings, Save, AlertCircle } from 'lucide-react';

const SystemSettings = () => {
    const { userInfo } = useAuthStore();
    const { config, fetchConfig, updateConfigLocally } = useConfigStore();

    const [formData, setFormData] = useState({
        businessName: '',
        currencySymbol: '$',
        taxRate: 0,
        shippingFee: 0,
        freeShippingThreshold: 0,
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
                contactEmail: config.contactEmail || '',
                contactPhone: config.contactPhone || ''
            });
        }
    }, [config, fetchConfig]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
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
