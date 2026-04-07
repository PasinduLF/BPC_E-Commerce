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
        contactPhone: '',
        storefrontAppearance: {
            heroTitle: '',
            heroSubtitle: '',
            heroHighlight: '',
            heroImage: { url: '', public_id: '' }
        }
    });

    const [heroImageFile, setHeroImageFile] = useState(null);
    const [heroImagePreview, setHeroImagePreview] = useState(null);

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
                contactPhone: config.contactPhone || '',
                storefrontAppearance: {
                    heroTitle: config.storefrontAppearance?.heroTitle || '',
                    heroSubtitle: config.storefrontAppearance?.heroSubtitle || '',
                    heroHighlight: config.storefrontAppearance?.heroHighlight || '',
                    heroImage: config.storefrontAppearance?.heroImage || { url: '', public_id: '' }
                }
            });
            if (config.storefrontAppearance?.heroImage?.url) {
                setHeroImagePreview(config.storefrontAppearance.heroImage.url);
            }
        }
    }, [config, fetchConfig]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleAppearanceChange = (e) => {
        setFormData({
            ...formData,
            storefrontAppearance: {
                ...formData.storefrontAppearance,
                [e.target.name]: e.target.value
            }
        });
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setHeroImageFile(file);
            setHeroImagePreview(URL.createObjectURL(file));
        }
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
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${userInfo.token}`,
                },
            };

            const submitData = new FormData();
            submitData.append('businessName', formData.businessName);
            submitData.append('currencySymbol', formData.currencySymbol);
            submitData.append('taxRate', formData.taxRate);
            submitData.append('shippingFee', formData.shippingFee);
            submitData.append('freeShippingThreshold', formData.freeShippingThreshold);
            submitData.append('codDeliveryCharge', formData.codDeliveryCharge);
            submitData.append('contactEmail', formData.contactEmail);
            submitData.append('contactPhone', formData.contactPhone);
            
            // Append Bank Details as JSON string
            submitData.append('bankDetails', JSON.stringify(formData.bankDetails));
            
            // Append Storefront Appearance as JSON string
            submitData.append('storefrontAppearance', JSON.stringify({
                heroTitle: formData.storefrontAppearance.heroTitle,
                heroSubtitle: formData.storefrontAppearance.heroSubtitle,
                heroHighlight: formData.storefrontAppearance.heroHighlight
            }));
            
            if (heroImageFile) {
                submitData.append('heroImage', heroImageFile);
            }

            const { data } = await axios.put('/api/config', submitData, reqConfig);

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
            <div className="flex items-center gap-3 border-b border-default pb-4">
                <div className="p-2 bg-page rounded-lg text-primary">
                    <Settings size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-primary">System Configuration</h1>
                    <p className="text-secondary text-sm mt-1">Manage global variables and operational behaviors.</p>
                </div>
            </div>

            {message && (
                <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium animate-fade-in-up ${message.type === 'success' ? 'bg-success-bg text-success border border-success/30' : 'bg-error-bg text-error border border-error/30'}`}>
                    <AlertCircle size={18} />
                    {message.text}
                </div>
            )}

            <form onSubmit={submitHandler} className="space-y-8">
                {/* General Branding */}
                <div className="bg-surface p-6 sm:p-8 rounded-2xl shadow-sm border border-default">
                    <h2 className="text-lg font-bold text-primary mb-6 pb-2 border-b border-default">General Branding</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-primary mb-2">Business Name</label>
                            <input
                                type="text" name="businessName" value={formData.businessName} onChange={handleChange}
                                className="w-full px-4 py-2 bg-page border border-default rounded-lg focus:border-brand focus:ring-1 focus:ring-brand outline-none text-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-primary mb-2">Currency Symbol</label>
                            <input
                                type="text" name="currencySymbol" value={formData.currencySymbol} onChange={handleChange}
                                placeholder="e.g. $, LKR, €, £"
                                className="w-full px-4 py-2 bg-page border border-default rounded-lg focus:border-brand focus:ring-1 focus:ring-brand outline-none text-primary font-medium"
                            />
                            <p className="text-xs text-tertiary mt-2">Appears globally. Ex: {formData.currencySymbol || '$'}120.00</p>
                        </div>
                    </div>
                </div>

                {/* Storefront Appearance */}
                <div className="bg-surface p-6 sm:p-8 rounded-2xl shadow-sm border border-default">
                    <h2 className="text-lg font-bold text-primary mb-6 pb-2 border-b border-default">Storefront Appearance</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-primary mb-2">Hero Section Highlight Label</label>
                                <input
                                    type="text" name="heroHighlight" value={formData.storefrontAppearance.heroHighlight} onChange={handleAppearanceChange}
                                    placeholder="e.g. NEW COLLECTION 2026"
                                    className="w-full px-4 py-2 bg-page border border-default rounded-lg focus:border-brand focus:ring-1 focus:ring-brand outline-none text-primary text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-primary mb-2">Hero Section Title</label>
                                <textarea
                                    name="heroTitle" value={formData.storefrontAppearance.heroTitle} onChange={handleAppearanceChange}
                                    placeholder="e.g. Discover Your \n True Radiance" rows="2"
                                    className="w-full px-4 py-2 bg-page border border-default rounded-lg focus:border-brand focus:ring-1 focus:ring-brand outline-none text-primary text-sm resize-none"
                                />
                                <p className="text-xs text-tertiary mt-1">Use \n for line breaks.</p>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-primary mb-2">Hero Section Subtitle</label>
                                <textarea
                                    name="heroSubtitle" value={formData.storefrontAppearance.heroSubtitle} onChange={handleAppearanceChange}
                                    placeholder="e.g. Premium cosmetics curated for your skin..." rows="3"
                                    className="w-full px-4 py-2 bg-page border border-default rounded-lg focus:border-brand focus:ring-1 focus:ring-brand outline-none text-primary text-sm resize-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-primary mb-2">Hero Banner Image</label>
                            <div className="border border-default rounded-xl overflow-hidden bg-page relative aspect-[4/3] flex flex-col items-center justify-center">
                                {heroImagePreview ? (
                                    <img src={heroImagePreview} alt="Hero Preview" className="absolute inset-0 w-full h-full object-cover" />
                                ) : (
                                    <div className="text-secondary text-center p-4">
                                        <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-2 border border-default">📸</div>
                                        <span className="text-sm">No Image Uploaded</span>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <label className="cursor-pointer bg-surface text-primary font-semibold px-4 py-2 rounded-lg text-sm shadow-sm hover:brightness-95 transition-colors">
                                        Change Image
                                        <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                                    </label>
                                </div>
                            </div>
                            <div className="mt-3 flex justify-between items-center text-xs text-tertiary">
                                <span>Recommended: 4:3 Aspect Ratio</span>
                                {!heroImagePreview && (
                                    <label className="cursor-pointer text-brand hover:brightness-90 font-semibold">
                                        Upload Image
                                        <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                                    </label>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* E-Commerce Operations */}
                <div className="bg-surface p-6 sm:p-8 rounded-2xl shadow-sm border border-default">
                    <h2 className="text-lg font-bold text-primary mb-6 pb-2 border-b border-default">Financial Operations</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-primary mb-2">Global Tax Rate (%)</label>
                            <input
                                type="number" step="0.01" min="0" name="taxRate" value={formData.taxRate} onChange={handleChange}
                                className="w-full px-4 py-2 bg-page border border-default rounded-lg focus:border-brand focus:ring-1 focus:ring-brand outline-none text-primary"
                            />
                        </div>
                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 bg-page p-5 rounded-xl border border-default">
                            <div>
                                <label className="block text-sm font-bold text-primary mb-2">Base Shipping Fee</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-tertiary font-bold">{formData.currencySymbol}</span>
                                    <input
                                        type="number" step="0.01" min="0" name="shippingFee" value={formData.shippingFee} onChange={handleChange}
                                        className="w-full pl-8 pr-4 py-2 bg-surface border border-default rounded-lg focus:border-brand focus:ring-1 focus:ring-brand outline-none text-primary"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-primary mb-2">Free Shipping Threshold</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-tertiary font-bold">{formData.currencySymbol}</span>
                                    <input
                                        type="number" step="0.01" min="0" name="freeShippingThreshold" value={formData.freeShippingThreshold} onChange={handleChange}
                                        className="w-full pl-8 pr-4 py-2 bg-surface border border-default rounded-lg focus:border-brand focus:ring-1 focus:ring-brand outline-none text-primary"
                                    />
                                </div>
                                <p className="text-xs text-tertiary mt-2">Set to 0 to disable free shipping logic.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Payment Settings */}
                <div className="bg-surface p-6 sm:p-8 rounded-2xl shadow-sm border border-default">
                    <h2 className="text-lg font-bold text-primary mb-6 pb-2 border-b border-default">Payment Settings</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-primary mb-2">COD Delivery Charge</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-tertiary font-bold">{formData.currencySymbol}</span>
                                <input
                                    type="number" step="0.01" min="0" name="codDeliveryCharge" value={formData.codDeliveryCharge} onChange={handleChange}
                                    className="w-full pl-8 pr-4 py-2 bg-page border border-default rounded-lg focus:border-brand focus:ring-1 focus:ring-brand outline-none text-primary"
                                />
                            </div>
                            <p className="text-xs text-tertiary mt-2">Extra fee applied when Cash on Delivery is selected.</p>
                        </div>
                        <div className="md:col-span-2 mt-4 border-t border-default pt-6">
                            <div className="flex justify-between items-center mb-4">
                                <label className="block text-sm font-bold text-primary">Bank Transfer Details</label>
                                <button
                                    type="button"
                                    onClick={addBankDetail}
                                    className="text-brand bg-brand-subtle hover:brightness-95 px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1 transition-colors"
                                >
                                    <Plus size={16} /> Add Bank Account
                                </button>
                            </div>

                            {formData.bankDetails.length === 0 ? (
                                <div className="text-center py-6 bg-page rounded-xl border border-default border-dashed text-secondary text-sm">
                                    No bank accounts added yet. Click above to add one.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {formData.bankDetails.map((bank, index) => (
                                        <div key={index} className="bg-page p-5 rounded-xl border border-default relative group">
                                            <button
                                                type="button"
                                                onClick={() => removeBankDetail(index)}
                                                className="absolute top-4 right-4 text-tertiary hover:text-error transition-colors"
                                                title="Remove Bank Account"
                                            >
                                                <Trash2 size={18} />
                                            </button>

                                            <div className="flex items-center gap-2 text-primary font-bold mb-4">
                                                <Building size={16} className="text-tertiary" />
                                                Bank Account {index + 1}
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-semibold text-secondary mb-1">Bank Name</label>
                                                    <input
                                                        type="text"
                                                        value={bank.bankName}
                                                        onChange={(e) => handleBankDetailChange(index, 'bankName', e.target.value)}
                                                        placeholder="e.g. ABC Bank"
                                                        required
                                                        className="w-full px-3 py-2 bg-surface border border-default rounded-lg focus:border-brand focus:ring-1 focus:ring-brand outline-none text-primary text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-secondary mb-1">Branch</label>
                                                    <input
                                                        type="text"
                                                        value={bank.branch}
                                                        onChange={(e) => handleBankDetailChange(index, 'branch', e.target.value)}
                                                        placeholder="e.g. Main Branch"
                                                        required
                                                        className="w-full px-3 py-2 bg-surface border border-default rounded-lg focus:border-brand focus:ring-1 focus:ring-brand outline-none text-primary text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-secondary mb-1">Account Name</label>
                                                    <input
                                                        type="text"
                                                        value={bank.accountName}
                                                        onChange={(e) => handleBankDetailChange(index, 'accountName', e.target.value)}
                                                        placeholder="e.g. Beauty P&C"
                                                        required
                                                        className="w-full px-3 py-2 bg-surface border border-default rounded-lg focus:border-brand focus:ring-1 focus:ring-brand outline-none text-primary text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-secondary mb-1">Account Number</label>
                                                    <input
                                                        type="text"
                                                        value={bank.accountNumber}
                                                        onChange={(e) => handleBankDetailChange(index, 'accountNumber', e.target.value)}
                                                        placeholder="e.g. 123456789"
                                                        required
                                                        className="w-full px-3 py-2 bg-surface border border-default rounded-lg focus:border-brand focus:ring-1 focus:ring-brand outline-none text-primary text-sm"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <p className="text-xs text-tertiary mt-3">These accounts will be shown to customers when they select Bank Transfer at checkout.</p>
                        </div>
                    </div>
                </div>

                {/* Contact Information */}
                <div className="bg-surface p-6 sm:p-8 rounded-2xl shadow-sm border border-default">
                    <h2 className="text-lg font-bold text-primary mb-6 pb-2 border-b border-default">Support Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-primary mb-2">Contact Email</label>
                            <input
                                type="email" name="contactEmail" value={formData.contactEmail} onChange={handleChange}
                                className="w-full px-4 py-2 bg-page border border-default rounded-lg focus:border-brand focus:ring-1 focus:ring-brand outline-none text-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-primary mb-2">Contact Phone</label>
                            <input
                                type="text" name="contactPhone" value={formData.contactPhone} onChange={handleChange}
                                className="w-full px-4 py-2 bg-page border border-default rounded-lg focus:border-brand focus:ring-1 focus:ring-brand outline-none text-primary"
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
