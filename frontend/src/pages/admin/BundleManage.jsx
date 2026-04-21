import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
    Plus, Pencil, Trash2, X, Gift, Loader2, Search, Check,
    ImagePlus, Tag, Sparkles, ToggleLeft, ToggleRight, Calculator, RefreshCcw
} from 'lucide-react';
import { useAuthStore } from '../../context/useAuthStore';
import { useConfigStore } from '../../context/useConfigStore';

const EMPTY_FORM = {
    name: '',
    description: '',
    image: { public_id: '', url: '' },
    products: [],
    bundlePrice: '',
    originalPrice: '',
    isActive: true,
    isFeatured: false,
};

const getEffectivePrice = (price, discountPrice) => {
    const base = Number(price || 0);
    const discount = Number(discountPrice || 0);
    return discount > 0 && discount < base ? discount : base;
};

const BundleManage = () => {
    const { userInfo } = useAuthStore();
    const { config } = useConfigStore();
    const currency = config?.currencySymbol || '$';
    const reqConfig = { headers: { Authorization: `Bearer ${userInfo?.token}` } };

    const [bundles, setBundles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingBundle, setEditingBundle] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [imageUploading, setImageUploading] = useState(false);
    const [overrideOriginalPrice, setOverrideOriginalPrice] = useState(false);

    // Product search
    const [productSearch, setProductSearch] = useState('');
    const [productResults, setProductResults] = useState([]);
    const [searchingProducts, setSearchingProducts] = useState(false);

    const fetchBundles = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await axios.get('/api/bundles?admin=true', reqConfig);
            setBundles(data);
        } catch {
            toast.error('Failed to load bundles');
        } finally {
            setLoading(false);
        }
    }, [userInfo?.token]);

    useEffect(() => { fetchBundles(); }, [fetchBundles]);

    // Debounced product search
    useEffect(() => {
        if (productSearch.trim().length < 2) { setProductResults([]); return; }
        const timer = setTimeout(async () => {
            setSearchingProducts(true);
            try {
                const { data } = await axios.get(
                    `/api/products?keyword=${encodeURIComponent(productSearch)}&pageSize=8&admin=true`,
                    reqConfig
                );
                setProductResults(data.products || []);
            } catch { setProductResults([]); }
            finally { setSearchingProducts(false); }
        }, 350);
        return () => clearTimeout(timer);
    }, [productSearch]);

    // Auto-calculate originalPrice from selected products
    useEffect(() => {
        if (overrideOriginalPrice) return;
        const computed = form.products.reduce((sum, bp) => {
            const pd = bp.productData || {};
            const selectedVariant = (pd.variants || []).find(v => String(v._id) === String(bp.variantId));
            const unitPrice = selectedVariant
                ? getEffectivePrice(selectedVariant.price, selectedVariant.discountPrice)
                : getEffectivePrice(pd.price, pd.discountPrice);
            return sum + unitPrice * (bp.qty || 1);
        }, 0);
        setForm(prev => ({ ...prev, originalPrice: computed > 0 ? computed.toFixed(2) : '' }));
    }, [form.products, overrideOriginalPrice]);

    const openCreate = () => {
        setEditingBundle(null);
        setForm(EMPTY_FORM);
        setProductSearch('');
        setProductResults([]);
        setOverrideOriginalPrice(false);
        setShowModal(true);
    };

    const openEdit = (bundle) => {
        setEditingBundle(bundle);
        setOverrideOriginalPrice(false);
        setForm({
            name: bundle.name,
            description: bundle.description || '',
            image: bundle.image || { public_id: '', url: '' },
            products: (bundle.products || []).map(bp => ({
                product: bp.product?._id || bp.product,
                productData: bp.product,
                qty: bp.qty || 1,
                variantId: bp.variantId || '',
                variantName: bp.variantName || '',
            })),
            bundlePrice: bundle.bundlePrice || '',
            originalPrice: bundle.originalPrice || '',
            isActive: bundle.isActive !== false,
            isFeatured: bundle.isFeatured || false,
        });
        setProductSearch('');
        setProductResults([]);
        setShowModal(true);
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('image', file);
        setImageUploading(true);
        try {
            const { data } = await axios.post('/api/upload', formData, {
                headers: { ...reqConfig.headers, 'Content-Type': 'multipart/form-data' }
            });
            setForm(prev => ({ ...prev, image: { public_id: data.public_id, url: data.url } }));
            toast.success('Image uploaded');
        } catch { toast.error('Image upload failed'); }
        finally { setImageUploading(false); }
    };

    const addProduct = (product) => {
        const preferredVariant = (product.variants || []).find(v => Number(v.stock || 0) > 0) || product.variants?.[0];
        const variantId = preferredVariant?._id || '';
        const variantName = preferredVariant ? `${preferredVariant.name}: ${preferredVariant.value}` : '';

        const duplicate = form.products.find((p) => (
            (p.product?._id || p.product) === product._id && String(p.variantId || '') === String(variantId || '')
        ));

        if (duplicate) {
            toast.info(`${product.name} is already in this bundle`);
            return;
        }

        setForm(prev => ({
            ...prev,
            products: [...prev.products, { product: product._id, productData: product, qty: 1, variantId, variantName }]
        }));
        setProductSearch('');
        setProductResults([]);
    };

    const removeProduct = (indexToRemove) => {
        setForm(prev => ({
            ...prev,
            products: prev.products.filter((_, index) => index !== indexToRemove)
        }));
    };

    const updateProductQty = (indexToUpdate, qty) => {
        setForm(prev => ({
            ...prev,
            products: prev.products.map((p, index) =>
                index === indexToUpdate ? { ...p, qty: Math.max(1, Number(qty)) } : p
            )
        }));
    };

    const updateProductVariant = (indexToUpdate, nextVariantId) => {
        setForm(prev => ({
            ...prev,
            products: prev.products.map((line, index) => {
                if (index !== indexToUpdate) return line;
                const pd = line.productData || {};
                const selectedVariant = (pd.variants || []).find(v => String(v._id) === String(nextVariantId));
                return {
                    ...line,
                    variantId: selectedVariant?._id || '',
                    variantName: selectedVariant ? `${selectedVariant.name}: ${selectedVariant.value}` : '',
                };
            })
        }));
    };

    const handleSave = async () => {
        if (!form.name.trim()) return toast.error('Bundle name is required');
        if (form.products.length === 0) return toast.error('Add at least one product');
        if (!form.bundlePrice || Number(form.bundlePrice) < 0) return toast.error('Valid bundle price is required');
        setSaving(true);
        try {
            const payload = {
                name: form.name.trim(),
                description: form.description.trim(),
                image: form.image,
                products: form.products.map(p => ({
                    product: p.product?._id || p.product,
                    qty: p.qty,
                    variantId: p.variantId || undefined,
                    variantName: p.variantName || '',
                })),
                bundlePrice: Number(form.bundlePrice),
                originalPrice: Number(form.originalPrice) || 0,
                isActive: form.isActive,
                isFeatured: form.isFeatured,
            };
            if (editingBundle) {
                await axios.put(`/api/bundles/${editingBundle._id}`, payload, reqConfig);
                toast.success('Bundle updated');
            } else {
                await axios.post('/api/bundles', payload, reqConfig);
                toast.success('Bundle created');
            }
            setShowModal(false);
            fetchBundles();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save bundle');
        } finally { setSaving(false); }
    };

    const handleDelete = async (bundle) => {
        if (!window.confirm(`Delete bundle "${bundle.name}"? This cannot be undone.`)) return;
        setDeletingId(bundle._id);
        try {
            await axios.delete(`/api/bundles/${bundle._id}`, reqConfig);
            toast.success('Bundle deleted');
            fetchBundles();
        } catch { toast.error('Failed to delete bundle'); }
        finally { setDeletingId(null); }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-surface rounded-2xl shadow-sm border border-default p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-primary">Bundle Offers</h1>
                        <p className="text-secondary text-sm mt-1">Create and manage high-converting bundle deals for your customers.</p>
                    </div>
                    <button onClick={openCreate} className="btn-primary flex items-center gap-2 self-start sm:self-auto">
                        <Plus size={18} /> Add Bundle
                    </button>
                </div>
            </div>

            {/* Bundles Table */}
            <div className="bg-surface rounded-2xl shadow-sm border border-default overflow-hidden text-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-default">
                        <thead className="bg-page">
                            <tr>
                                <th className="px-6 py-4 text-left font-semibold text-secondary uppercase tracking-wider text-xs">Bundle</th>
                                <th className="px-6 py-4 text-left font-semibold text-secondary uppercase tracking-wider text-xs hidden md:table-cell">Products</th>
                                <th className="px-6 py-4 text-left font-semibold text-secondary uppercase tracking-wider text-xs">Price</th>
                                <th className="px-6 py-4 text-center font-semibold text-secondary uppercase tracking-wider text-xs hidden sm:table-cell">Status</th>
                                <th className="px-6 py-4 text-center font-semibold text-secondary uppercase tracking-wider text-xs">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-surface divide-y divide-default">
                            {loading ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <tr key={i}>
                                        <td className="px-6 py-4"><div className="skeleton h-10 w-40 rounded" /></td>
                                        <td className="px-6 py-4 hidden md:table-cell"><div className="skeleton h-4 w-16 rounded" /></td>
                                        <td className="px-6 py-4"><div className="skeleton h-4 w-20 rounded" /></td>
                                        <td className="px-6 py-4 hidden sm:table-cell"><div className="skeleton h-6 w-16 rounded-full mx-auto" /></td>
                                        <td className="px-6 py-4"><div className="skeleton h-8 w-16 rounded mx-auto" /></td>
                                    </tr>
                                ))
                            ) : bundles.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-12 text-secondary">
                                        No bundles yet. Create your first bundle offer above.
                                    </td>
                                </tr>
                            ) : (
                                bundles.map((bundle) => (
                                    <tr key={bundle._id} className="hover:bg-page transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-xl bg-page border border-default p-1.5 flex items-center justify-center flex-shrink-0">
                                                    {bundle.image?.url
                                                        ? <img src={bundle.image.url} alt={bundle.name} className="max-w-full max-h-full object-contain" />
                                                        : <Gift size={18} className="text-brand" />
                                                    }
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-primary">{bundle.name}</p>
                                                    {bundle.isFeatured && (
                                                        <span className="inline-flex items-center gap-1 text-[10px] text-brand font-semibold">
                                                            <Sparkles size={9} /> Featured
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-secondary hidden md:table-cell">
                                            {bundle.products?.length || 0} item{bundle.products?.length !== 1 ? 's' : ''}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="font-bold text-brand">{currency}{Number(bundle.bundlePrice).toFixed(2)}</span>
                                            {Number(bundle.originalPrice) > Number(bundle.bundlePrice) && (
                                                <span className="block text-tertiary text-xs line-through">{currency}{Number(bundle.originalPrice).toFixed(2)}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center hidden sm:table-cell">
                                            <span className={`status-badge ${bundle.isActive ? 'status-success' : 'status-error'}`}>
                                                {bundle.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <button
                                                onClick={() => openEdit(bundle)}
                                                className="text-brand hover:brightness-90 p-2 rounded-lg transition-colors mr-1 hover:bg-brand-subtle/60"
                                                title="Edit"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(bundle)}
                                                disabled={deletingId === bundle._id}
                                                className="text-error hover:brightness-90 p-2 rounded-lg transition-colors disabled:opacity-50 hover:bg-error-bg"
                                                title="Delete"
                                            >
                                                {deletingId === bundle._id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create / Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-6 px-3">
                    <div className="bg-surface rounded-3xl shadow-2xl w-full max-w-3xl border border-default my-auto animate-fade-in">

                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-default bg-page rounded-t-3xl">
                            <div>
                                <h2 className="text-lg font-bold text-primary flex items-center gap-2">
                                    <Gift size={20} className="text-brand" />
                                    {editingBundle ? 'Edit Bundle' : 'New Bundle'}
                                </h2>
                                <p className="text-xs text-secondary mt-0.5">
                                    {editingBundle ? 'Update bundle details below.' : 'Fill in the details to create a new bundle offer.'}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 rounded-lg hover:bg-surface text-secondary hover:text-primary transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-primary mb-1">Bundle Name *</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                                    placeholder="e.g. Summer Glow Kit"
                                    className="w-full px-4 py-2 border border-default rounded-lg input-focus bg-page text-primary"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-primary mb-1">Description</label>
                                <textarea
                                    value={form.description}
                                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                                    placeholder="Describe what's included and why it's a great deal..."
                                    rows={3}
                                    className="w-full px-4 py-2 border border-default rounded-lg input-focus bg-page text-primary resize-none"
                                />
                            </div>

                            {/* Image Upload */}
                            <div>
                                <label className="block text-sm font-medium text-primary mb-1">Bundle Image</label>
                                <div className="flex items-center gap-4">
                                    <div className="w-20 h-20 rounded-lg border border-default bg-page flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                                        {form.image?.url ? (
                                            <>
                                                <img src={form.image.url} alt="Bundle" className="w-full h-full object-cover" />
                                                <button
                                                    onClick={() => setForm(p => ({ ...p, image: { public_id: '', url: '' } }))}
                                                    className="absolute top-1 right-1 bg-error text-white p-0.5 rounded-full"
                                                >
                                                    <X size={10} />
                                                </button>
                                            </>
                                        ) : (
                                            <ImagePlus size={20} className="text-tertiary" />
                                        )}
                                    </div>
                                    <label className="flex-1 cursor-pointer">
                                        <div className="w-full px-4 py-2 border border-default rounded-lg text-secondary hover:border-brand hover:text-brand transition-colors text-sm flex items-center gap-2 bg-page">
                                            {imageUploading ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />}
                                            {imageUploading ? 'Uploading...' : 'Upload image'}
                                        </div>
                                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={imageUploading} />
                                    </label>
                                </div>
                            </div>

                            {/* Product Search */}
                            <div>
                                <label className="block text-sm font-medium text-primary mb-1">Products *</label>
                                <div className="relative">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" />
                                    <input
                                        type="text"
                                        value={productSearch}
                                        onChange={e => setProductSearch(e.target.value)}
                                        placeholder="Search products to add..."
                                        className="w-full pl-9 pr-4 py-2 border border-default rounded-lg input-focus bg-page text-primary"
                                    />
                                    {searchingProducts && (
                                        <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand animate-spin" />
                                    )}
                                </div>

                                {/* Search Results */}
                                {productResults.length > 0 && (
                                    <div className="mt-1 border border-default rounded-lg bg-surface shadow-md overflow-hidden">
                                        {productResults.map(product => (
                                            <button
                                                key={product._id}
                                                type="button"
                                                onClick={() => addProduct(product)}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-page transition-colors text-left border-b border-default last:border-0"
                                            >
                                                <div className="w-9 h-9 rounded border border-default overflow-hidden flex-shrink-0 bg-page">
                                                    {product.images?.[0]?.url
                                                        ? <img src={product.images[0].url} alt={product.name} className="w-full h-full object-cover" />
                                                        : <div className="w-full h-full bg-brand-subtle" />
                                                    }
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-primary text-sm truncate">{product.name}</p>
                                                    <p className="text-xs text-tertiary">{currency}{Number(product.discountPrice > 0 ? product.discountPrice : product.price).toFixed(2)}</p>
                                                    {Array.isArray(product.variants) && product.variants.length > 0 && (
                                                        <p className="text-[10px] text-brand font-semibold mt-0.5">{product.variants.length} variant(s)</p>
                                                    )}
                                                </div>
                                                <Plus size={14} className="text-brand flex-shrink-0" />
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Selected Products */}
                                {form.products.length > 0 && (
                                    <div className="mt-3 space-y-2">
                                        <p className="text-xs font-semibold text-secondary uppercase tracking-wider">Included Products</p>
                                        {form.products.map((bp, idx) => {
                                            const pd = bp.productData || bp.product;
                                            const pname = pd?.name || 'Product';
                                            const pimg = pd?.images?.[0]?.url || '';
                                            const selectedVariant = (pd?.variants || []).find(v => String(v._id) === String(bp.variantId));
                                            const unitPrice = selectedVariant
                                                ? getEffectivePrice(selectedVariant.price, selectedVariant.discountPrice)
                                                : getEffectivePrice(pd?.price, pd?.discountPrice);
                                            const lineTotal = unitPrice * (bp.qty || 1);
                                            return (
                                                <div key={idx} className="flex items-center gap-3 bg-page border border-default rounded-lg p-2.5">
                                                    <div className="w-9 h-9 rounded border border-default overflow-hidden flex-shrink-0 bg-surface">
                                                        {pimg ? <img src={pimg} alt={pname} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-brand-subtle" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <span className="text-sm font-medium text-primary truncate block">{pname}</span>
                                                        {Array.isArray(pd?.variants) && pd.variants.length > 0 && (
                                                            <div className="mt-1">
                                                                <select
                                                                    value={bp.variantId || ''}
                                                                    onChange={(e) => updateProductVariant(idx, e.target.value)}
                                                                    className="text-xs w-full sm:w-auto px-2 py-1 border border-default rounded bg-surface text-primary"
                                                                >
                                                                    <option value="">Any available variant</option>
                                                                    {pd.variants.map((variant) => (
                                                                        <option key={variant._id} value={variant._id}>
                                                                            {variant.name}: {variant.value} ({currency}{getEffectivePrice(variant.price, variant.discountPrice).toFixed(2)}, stock: {variant.stock || 0})
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        )}
                                                        {unitPrice > 0 && (
                                                            <span className="text-xs text-tertiary">
                                                                {currency}{unitPrice.toFixed(2)} × {bp.qty}
                                                                {bp.qty > 1 && <span className="ml-1 font-medium text-secondary">= {currency}{lineTotal.toFixed(2)}</span>}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-0.5 border border-default rounded-lg bg-surface">
                                                        <button type="button" onClick={() => updateProductQty(idx, bp.qty - 1)} className="px-2 py-1 text-secondary hover:text-brand transition-colors text-sm">−</button>
                                                        <span className="px-2 text-sm font-medium text-primary">{bp.qty}</span>
                                                        <button type="button" onClick={() => updateProductQty(idx, bp.qty + 1)} className="px-2 py-1 text-secondary hover:text-brand transition-colors text-sm">+</button>
                                                    </div>
                                                    <button type="button" onClick={() => removeProduct(idx)} className="p-1.5 text-error hover:bg-error-bg rounded-lg transition-colors">
                                                        <X size={13} />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Pricing */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Bundle Price */}
                                <div>
                                    <label className="block text-sm font-medium text-primary mb-1 flex items-center gap-1">
                                        <Tag size={12} /> Bundle Price * ({currency})
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={form.bundlePrice}
                                        onChange={e => setForm(p => ({ ...p, bundlePrice: e.target.value }))}
                                        placeholder="0.00"
                                        className="w-full px-4 py-2 border border-default rounded-lg input-focus bg-page text-primary"
                                    />
                                </div>

                                {/* Original Price — auto-calculated */}
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="text-sm font-medium text-primary flex items-center gap-1">
                                            <Calculator size={12} /> Original Price ({currency})
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setOverrideOriginalPrice(p => !p)}
                                            className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-colors ${overrideOriginalPrice
                                                ? 'bg-brand-subtle border-brand/30 text-brand'
                                                : 'bg-page border-default text-tertiary hover:border-brand hover:text-brand'
                                            }`}
                                        >
                                            {overrideOriginalPrice ? <><RefreshCcw size={8} /> Auto</> : <><Calculator size={8} /> Override</>}
                                        </button>
                                    </div>

                                    {overrideOriginalPrice ? (
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={form.originalPrice}
                                            onChange={e => setForm(p => ({ ...p, originalPrice: e.target.value }))}
                                            placeholder="0.00"
                                            className="w-full px-4 py-2 border border-brand rounded-lg input-focus bg-page text-primary"
                                            autoFocus
                                        />
                                    ) : (
                                        <div>
                                            <div className={`w-full px-4 py-2 border rounded-lg flex items-center justify-between ${form.products.length > 0 ? 'border-default bg-page' : 'border-dashed border-default bg-page'}`}>
                                                <span className={`font-bold text-base tabular-nums ${form.products.length > 0 ? 'text-primary' : 'text-tertiary'}`}>
                                                    {form.products.length > 0 && form.originalPrice
                                                        ? `${currency}${Number(form.originalPrice).toLocaleString('en-LK', { minimumFractionDigits: 2 })}`
                                                        : '—'
                                                    }
                                                </span>
                                                <span className="text-[10px] font-semibold text-tertiary uppercase tracking-wider flex items-center gap-0.5">
                                                    <Calculator size={8} /> Auto
                                                </span>
                                            </div>
                                            {form.products.length > 0 && Number(form.bundlePrice) > 0 && Number(form.originalPrice) > Number(form.bundlePrice) && (
                                                <p className="mt-1 text-xs text-success font-medium">
                                                    Customer saves {currency}{(Number(form.originalPrice) - Number(form.bundlePrice)).toFixed(2)}
                                                    {' '}({Math.round(((Number(form.originalPrice) - Number(form.bundlePrice)) / Number(form.originalPrice)) * 100)}% off)
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Toggles */}
                            <div className="flex flex-wrap gap-3 pt-1">
                                <button
                                    type="button"
                                    onClick={() => setForm(p => ({ ...p, isActive: !p.isActive }))}
                                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border font-medium text-sm transition-colors ${form.isActive ? 'bg-success-bg border-success/30 text-success' : 'bg-page border-default text-secondary hover:border-brand'}`}
                                >
                                    {form.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                                    {form.isActive ? 'Active' : 'Inactive'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setForm(p => ({ ...p, isFeatured: !p.isFeatured }))}
                                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border font-medium text-sm transition-colors ${form.isFeatured ? 'bg-brand-subtle border-brand/30 text-brand' : 'bg-page border-default text-secondary hover:border-brand'}`}
                                >
                                    <Sparkles size={15} />
                                    {form.isFeatured ? 'Featured' : 'Not Featured'}
                                </button>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-default flex justify-end gap-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-5 py-2 border border-default rounded-lg text-secondary hover:text-primary hover:bg-page font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-2 px-6 py-2 bg-brand hover:brightness-95 text-white font-medium rounded-lg shadow-sm transition-colors disabled:opacity-50"
                            >
                                {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                                {saving ? 'Saving...' : (editingBundle ? 'Update Bundle' : 'Save Bundle')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BundleManage;
