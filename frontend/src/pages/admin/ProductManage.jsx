import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../../context/useAuthStore';
import { useConfigStore } from '../../context/useConfigStore';
import { Package, Plus, Edit, Trash2, Tag, UploadCloud, ExternalLink } from 'lucide-react';

const ProductManage = () => {
    const { userInfo } = useAuthStore();
    const { config } = useConfigStore();
    const currency = config?.currencySymbol || '$';
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);

    // Form states
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [descriptionSections, setDescriptionSections] = useState({
        details: '',
        benefits: '',
        howToUse: '',
        ingredients: '',
        specifications: '',
        shippingInformation: ''
    });
    const [price, setPrice] = useState('');
    const [discountPrice, setDiscountPrice] = useState('0');
    const [costPrice, setCostPrice] = useState('0'); // Admin only
    const [categoryId, setCategoryId] = useState('');
    const [subcategoryId, setSubcategoryId] = useState('');
    const [innerSubcategoryId, setInnerSubcategoryId] = useState('');
    const [brandId, setBrandId] = useState('');
    const [stock, setStock] = useState('0');
    const [variants, setVariants] = useState([]);
    const [isActive, setIsActive] = useState(true);

    // Variant Handlers
    const addVariant = () => setVariants([...variants, { name: '', value: '', price: 0, discountPrice: 0, costPrice: 0, stock: 0, image: '', imageFile: null }]);
    const removeVariant = (index) => setVariants(variants.filter((_, i) => i !== index));
    const handleVariantChange = (index, field, val) => {
        const newV = [...variants];
        newV[index][field] = val;
        setVariants(newV);
    };

    // File uploads
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [existingImages, setExistingImages] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const files = e.dataTransfer.files;
            const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
            if (imageFiles.length > 0) {
                const newFiles = new DataTransfer();
                Array.from(selectedFiles || []).forEach(f => newFiles.items.add(f));
                imageFiles.forEach(f => newFiles.items.add(f));
                setSelectedFiles(newFiles.files);
            }
        }
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const [prodRes, catRes, brandRes] = await Promise.all([
                axios.get('/api/products?admin=true'),
                axios.get('/api/categories'),
                axios.get('/api/brands')
            ]);

            setProducts(prodRes.data.products || prodRes.data);
            setCategories(catRes.data);
            setBrands(brandRes.data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const createProductHandler = async (e) => {
        e.preventDefault();
        try {
            setUploading(true);
            const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };

            let uploadedImages = [];
            if (selectedFiles.length > 0) {
                // Upload each file sequentially to Cloudinary via backend
                for (let i = 0; i < selectedFiles.length; i++) {
                    const formData = new FormData();
                    formData.append('image', selectedFiles[i]);
                    const { data } = await axios.post('/api/upload', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                    uploadedImages.push({ public_id: data.public_id, url: data.url });
                }
            }

            let finalVariants = [];
            for (let v of variants) {
                let imageUrl = v.image || '';
                if (v.imageFile) {
                    const formData = new FormData();
                    formData.append('image', v.imageFile);
                    const { data } = await axios.post('/api/upload', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                    imageUrl = data.url;
                }
                finalVariants.push({
                    name: v.name,
                    value: v.value,
                    price: Number(v.price || 0),
                    discountPrice: Number(v.discountPrice || 0),
                    costPrice: Number(v.costPrice || 0),
                    stock: Number(v.stock || 0),
                    image: imageUrl
                });
            }

            const productData = {
                name,
                description,
                descriptionSections,
                price: variants.length > 0 ? (finalVariants[0]?.price || 0) : Number(price),
                discountPrice: variants.length > 0 ? (finalVariants[0]?.discountPrice || 0) : Number(discountPrice),
                costPrice: variants.length > 0 ? (finalVariants[0]?.costPrice || 0) : Number(costPrice),
                category: categoryId,
                subcategory: subcategoryId || undefined,
                innerSubcategory: innerSubcategoryId || undefined,
                brand: brandId || undefined,
                stock: variants.length > 0 ? finalVariants.reduce((sum, v) => sum + v.stock, 0) : Number(stock),
                variants: finalVariants,
                isActive
            };

            const finalImages = [...existingImages, ...uploadedImages];

            if (editingId) {
                if (finalImages.length > 0) {
                    productData.images = finalImages;
                }
                await axios.put(`/api/products/${editingId}`, productData, config);
            } else {
                productData.images = finalImages.length > 0 ? finalImages : [{ public_id: 'placeholder', url: 'https://via.placeholder.com/300' }];
                await axios.post('/api/products', productData, config);
            }

            // Reset form
            setName('');
            setDescription('');
            setDescriptionSections({
                details: '',
                benefits: '',
                howToUse: '',
                ingredients: '',
                specifications: '',
                shippingInformation: ''
            });
            setPrice('');
            setDiscountPrice('0');
            setCostPrice('0');
            setCategoryId('');
            setSubcategoryId('');
            setInnerSubcategoryId('');
            setBrandId('');
            setStock('0');
            setVariants([]);
            setIsActive(true);
            setSelectedFiles([]);
            setExistingImages([]);
            setEditingId(null);
            setShowAddForm(false);
            fetchData();
            setUploading(false);

        } catch (error) {
            setUploading(false);
            alert(error.response?.data?.message || 'Failed to save product');
        }
    };

    const openEditForm = (product) => {
        setEditingId(product._id);
        setName(product.name);
        setDescription(product.description);
        setDescriptionSections({
            details: product.descriptionSections?.details || '',
            benefits: product.descriptionSections?.benefits || '',
            howToUse: product.descriptionSections?.howToUse || '',
            ingredients: product.descriptionSections?.ingredients || '',
            specifications: product.descriptionSections?.specifications || '',
            shippingInformation: product.descriptionSections?.shippingInformation || ''
        });
        setPrice(product.price);
        setDiscountPrice(product.discountPrice || '0');
        setCostPrice(product.costPrice || '0');
        setCategoryId(product.category?._id || product.category || '');
        setSubcategoryId(product.subcategory?._id || product.subcategory || '');
        setInnerSubcategoryId(product.innerSubcategory?._id || product.innerSubcategory || '');
        setBrandId(product.brand?._id || product.brand || '');
        setStock(product.stock || '0');
        setVariants(product.variants || []);
        setIsActive(product.isActive !== false); // Defaults to true if missing
        setSelectedFiles([]);
        setExistingImages(product.images || []);
        setShowAddForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const deleteProductHandler = async (id, title) => {
        if (window.confirm(`Delete product ${title}?`)) {
            try {
                const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
                await axios.delete(`/api/products/${id}`, config);
                fetchData();
            } catch (error) {
                alert(error.response?.data?.message || 'Failed to delete product');
            }
        }
    };

    return (
        <div className="space-y-6">

            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-primary">Product Catalog</h1>
                    <p className="text-secondary text-sm mt-1">Manage listings, set retail prices, and view stock.</p>
                </div>
                <button
                    onClick={() => {
                        if (showAddForm) {
                            setShowAddForm(false);
                            setEditingId(null);
                            setName('');
                            setDescription('');
                            setDescriptionSections({
                                details: '',
                                benefits: '',
                                howToUse: '',
                                ingredients: '',
                                specifications: '',
                                shippingInformation: ''
                            });
                            setPrice('');
                            setDiscountPrice('0');
                            setCostPrice('0');
                            setCategoryId('');
                            setSubcategoryId('');
                            setBrandId('');
                            setStock('0');
                            setVariants([]);
                            setIsActive(true);
                            setExistingImages([]);
                        } else {
                            setShowAddForm(true);
                        }
                    }}
                    className="btn-primary flex items-center gap-2"
                >
                    {showAddForm ? 'Cancel' : <><Plus size={18} /> Add Product</>}
                </button>
            </div>

            {showAddForm && (
                <div className="bg-surface rounded-2xl shadow-sm border border-default p-6 sm:p-8 animate-fade-in-up mb-8">
                    <h2 className="text-lg font-bold text-primary mb-6 flex items-center gap-2 border-b border-default pb-4">
                        <Package size={20} className="text-brand" /> {editingId ? 'Edit Product' : 'New Product Listing'}
                    </h2>

                    <form onSubmit={createProductHandler} className="space-y-6">

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-primary mb-1">Product Title</label>
                                <input
                                    type="text" required value={name} onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 py-2 border border-default rounded-lg input-focus bg-page text-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-primary mb-1">Brand (Optional)</label>
                                <select
                                    value={brandId} onChange={(e) => setBrandId(e.target.value)}
                                    className="w-full px-4 py-2 border border-default rounded-lg input-focus bg-page text-primary"
                                >
                                    <option value="">No Brand Selected</option>
                                    {brands.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-sm font-medium text-primary mb-1">Category</label>
                                    <select
                                        required value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setSubcategoryId(''); }}
                                        className="w-full px-4 py-2 border border-default rounded-lg input-focus bg-page text-primary"
                                    >
                                        <option value="">Select category</option>
                                        {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-primary mb-1">Subcategory</label>
                                    <select
                                        value={subcategoryId} onChange={(e) => { setSubcategoryId(e.target.value); setInnerSubcategoryId(''); }}
                                        disabled={!categoryId}
                                        className="w-full px-4 py-2 border border-default rounded-lg input-focus bg-page text-primary disabled:opacity-50"
                                    >
                                        <option value="">{categoryId ? 'Select subcategory' : 'Select category first'}</option>
                                        {categories.find(c => c._id === categoryId)?.subcategories?.map(sub => (
                                            <option key={sub._id} value={sub._id}>{sub.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-primary mb-1">Inner Subcategory (Optional)</label>
                                    <select
                                        value={innerSubcategoryId} onChange={(e) => setInnerSubcategoryId(e.target.value)}
                                        disabled={!subcategoryId}
                                        className="w-full px-4 py-2 border border-default rounded-lg input-focus bg-page text-primary disabled:opacity-50"
                                    >
                                        <option value="">{subcategoryId ? 'Select inner subcategory' : 'Select subcategory first'}</option>
                                        {categories.find(c => c._id === categoryId)?.subcategories?.find(s => s._id === subcategoryId)?.nestedSubcategories?.map(nested => (
                                            <option key={nested._id} value={nested._id}>{nested.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-primary mb-1">Short Description</label>
                            <textarea
                                required value={description} onChange={(e) => setDescription(e.target.value)}
                                rows="3"
                                placeholder="Short summary shown near product title"
                                className="w-full px-4 py-2 border border-default rounded-lg input-focus bg-page text-primary"
                            ></textarea>
                        </div>

                        <div className="bg-page p-5 rounded-xl border border-default space-y-4">
                            <h3 className="text-sm font-bold text-primary uppercase tracking-wide">Product Description Sections</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-primary mb-1">Details</label>
                                    <textarea
                                        value={descriptionSections.details}
                                        onChange={(e) => setDescriptionSections((prev) => ({ ...prev, details: e.target.value }))}
                                        rows="4"
                                        className="w-full px-4 py-2 border border-default rounded-lg input-focus bg-surface text-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-primary mb-1">Benefits</label>
                                    <textarea
                                        value={descriptionSections.benefits}
                                        onChange={(e) => setDescriptionSections((prev) => ({ ...prev, benefits: e.target.value }))}
                                        rows="4"
                                        className="w-full px-4 py-2 border border-default rounded-lg input-focus bg-surface text-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-primary mb-1">How to Use</label>
                                    <textarea
                                        value={descriptionSections.howToUse}
                                        onChange={(e) => setDescriptionSections((prev) => ({ ...prev, howToUse: e.target.value }))}
                                        rows="4"
                                        className="w-full px-4 py-2 border border-default rounded-lg input-focus bg-surface text-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-primary mb-1">Ingredients</label>
                                    <textarea
                                        value={descriptionSections.ingredients}
                                        onChange={(e) => setDescriptionSections((prev) => ({ ...prev, ingredients: e.target.value }))}
                                        rows="4"
                                        className="w-full px-4 py-2 border border-default rounded-lg input-focus bg-surface text-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-primary mb-1">Specifications</label>
                                    <textarea
                                        value={descriptionSections.specifications}
                                        onChange={(e) => setDescriptionSections((prev) => ({ ...prev, specifications: e.target.value }))}
                                        rows="4"
                                        className="w-full px-4 py-2 border border-default rounded-lg input-focus bg-surface text-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-primary mb-1">Shipping Information</label>
                                    <textarea
                                        value={descriptionSections.shippingInformation}
                                        onChange={(e) => setDescriptionSections((prev) => ({ ...prev, shippingInformation: e.target.value }))}
                                        rows="4"
                                        className="w-full px-4 py-2 border border-default rounded-lg input-focus bg-surface text-primary"
                                    />
                                </div>
                            </div>
                        </div>

                        {variants.length === 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-page p-4 rounded-xl border border-default">
                                <div>
                                    <label className="block text-sm font-medium text-success mb-1 flex items-center gap-1">
                                        <Tag size={16} /> Retail Price ($)
                                    </label>
                                    <input
                                        type="number" required step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)}
                                        className="w-full px-4 py-2 border border-default focus:border-success focus:ring-success rounded-lg outline-none bg-surface text-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-brand mb-1 flex items-center gap-1">
                                        <Tag size={16} /> Discount Price ($)
                                    </label>
                                    <input
                                        type="number" step="0.01" min="0" value={discountPrice} onChange={(e) => setDiscountPrice(e.target.value)}
                                        className="w-full px-4 py-2 border border-default focus:border-brand focus:ring-brand rounded-lg outline-none bg-surface text-primary"
                                    />
                                    <p className="text-xs text-brand mt-1">Leave 0 if none.</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-warning mb-1 flex items-center gap-1">
                                        <Tag size={16} /> Base Unit Cost ($)
                                    </label>
                                    <input
                                        type="number" required step="0.01" min="0" value={costPrice} onChange={(e) => setCostPrice(e.target.value)}
                                        className="w-full px-4 py-2 border border-default focus:border-warning focus:ring-warning rounded-lg outline-none bg-surface text-primary"
                                    />
                                    <p className="text-xs text-warning mt-1">Tracked for profit.</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-primary mb-1 flex items-center gap-1">
                                        <Package size={16} /> Current Stock Qty
                                    </label>
                                    <input
                                        type="number" required min="0" value={stock} onChange={(e) => setStock(e.target.value)}
                                        className="w-full px-4 py-2 border border-default focus:border-primary focus:ring-primary rounded-lg outline-none bg-surface text-primary"
                                    />
                                    <p className="text-xs text-secondary mt-1">Initial stock level.</p>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-3 bg-page p-4 rounded-xl border border-default">
                            <input
                                type="checkbox" id="isActive" checked={isActive} onChange={(e) => setIsActive(e.target.checked)}
                                className="w-5 h-5 text-brand rounded border-default focus:ring-brand"
                            />
                            <label htmlFor="isActive" className="font-bold text-primary cursor-pointer">
                                Product is Active <span className="font-normal text-secondary ml-2">(Uncheck to hide from customer storefront)</span>
                            </label>
                        </div>

                        <div className="bg-page p-6 rounded-xl border border-default">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-sm font-bold text-primary flex items-center gap-2">
                                    <Tag size={18} /> Product Variants (Optional)
                                </h3>
                                <button type="button" onClick={addVariant} className="text-sm px-3 py-1.5 bg-surface border border-default rounded-lg text-secondary hover:text-brand hover:border-brand font-medium transition-colors">
                                    + Add Variant
                                </button>
                            </div>
                            {variants.length > 0 ? (
                                <div className="space-y-3">
                                    {variants.map((v, idx) => (
                                        <div key={idx} className="flex flex-col gap-3 bg-surface p-4 rounded-lg border border-default shadow-sm relative pr-10">
                                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-secondary uppercase">Option Name</label>
                                                    <input type="text" placeholder="e.g. Size, Color" value={v.name} onChange={(e) => handleVariantChange(idx, 'name', e.target.value)} className="w-full text-sm mt-1 px-3 py-1.5 border border-default rounded outline-none focus:border-brand bg-page text-primary" required />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-secondary uppercase">Value</label>
                                                    <input type="text" placeholder="e.g. 100ml, Red" value={v.value} onChange={(e) => handleVariantChange(idx, 'value', e.target.value)} className="w-full text-sm mt-1 px-3 py-1.5 border border-default rounded outline-none focus:border-brand bg-page text-primary" required />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-success uppercase">Retail Price ($)</label>
                                                    <input type="number" step="0.01" value={v.price} onChange={(e) => handleVariantChange(idx, 'price', e.target.value)} className="w-full text-sm mt-1 px-3 py-1.5 border border-default rounded outline-none focus:border-success bg-page text-primary" required />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-brand uppercase">Discount Price ($)</label>
                                                    <input type="number" step="0.01" value={v.discountPrice} onChange={(e) => handleVariantChange(idx, 'discountPrice', e.target.value)} className="w-full text-sm mt-1 px-3 py-1.5 border border-default rounded outline-none focus:border-brand bg-page text-primary" />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-warning uppercase">Base Unit Cost ($)</label>
                                                    <input type="number" step="0.01" value={v.costPrice} onChange={(e) => handleVariantChange(idx, 'costPrice', e.target.value)} className="w-full text-sm mt-1 px-3 py-1.5 border border-default rounded outline-none focus:border-warning bg-page text-primary" required />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-info uppercase">Current Stock Qty</label>
                                                    <input type="number" min="0" value={v.stock} onChange={(e) => handleVariantChange(idx, 'stock', e.target.value)} className="w-full text-sm mt-1 px-3 py-1.5 border border-default rounded outline-none focus:border-info bg-page text-primary" required />
                                                </div>
                                                <div className="col-span-2">
                                                    <label className="block text-[10px] font-bold text-secondary uppercase">Variant Image (Optional)</label>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        {(v.image || v.imageFile) && (
                                                            <div className="w-10 h-10 rounded border border-default overflow-hidden flex-shrink-0">
                                                                <img src={v.imageFile ? URL.createObjectURL(v.imageFile) : v.image} alt="variant" className="w-full h-full object-cover" />
                                                            </div>
                                                        )}
                                                        <input type="file" accept="image/*" onChange={(e) => handleVariantChange(idx, 'imageFile', e.target.files[0])} className="w-full text-xs text-secondary file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-brand-subtle file:text-brand hover:file:brightness-105" />
                                                    </div>
                                                </div>
                                            </div>
                                            <button type="button" onClick={() => removeVariant(idx)} className="absolute right-3 top-4 text-error hover:brightness-90 p-1 bg-error-bg rounded-md">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    <p className="text-xs text-tertiary mt-2">When variants are active, the specific unit price and stock applies directly instead of a base price.</p>
                                </div>
                            ) : (
                                <p className="text-sm text-secondary">No variants added. E.g add sizes (100ml, 50ml) or shades (Red, Pink).</p>
                            )}
                        </div>

                        <div className="bg-brand-subtle p-6 rounded-xl border border-brand/20 border-dashed" onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}>
                            <h3 className="text-sm font-bold text-brand mb-3 flex items-center gap-2">
                                <UploadCloud size={18} /> Upload Product Images
                            </h3>
                            <div>
                                {existingImages.length > 0 && (
                                    <div className="mb-4 p-4 bg-surface rounded-lg border border-default">
                                        <h4 className="text-xs font-bold text-secondary mb-2 uppercase tracking-wide">Currently Saved Images (Drag left/right implicitly via buttons)</h4>
                                        <div className="flex gap-2 overflow-x-auto pb-2">
                                            {existingImages.map((img, idx) => (
                                                <div key={idx} className="relative w-24 h-24 flex-shrink-0 border border-default rounded-md overflow-hidden group">
                                                    <img src={img.url} alt="existing" className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-center items-center gap-1">
                                                        <div className="flex gap-1">
                                                            <button type="button" onClick={() => {
                                                                if (idx === 0) return;
                                                                const newImgs = [...existingImages];
                                                                [newImgs[idx - 1], newImgs[idx]] = [newImgs[idx], newImgs[idx - 1]];
                                                                setExistingImages(newImgs);
                                                            }} className="p-1 bg-surface rounded text-xs text-primary disabled:opacity-50 hover:brightness-90" disabled={idx === 0}>←</button>

                                                            <button type="button" onClick={() => {
                                                                if (idx === existingImages.length - 1) return;
                                                                const newImgs = [...existingImages];
                                                                [newImgs[idx + 1], newImgs[idx]] = [newImgs[idx], newImgs[idx + 1]];
                                                                setExistingImages(newImgs);
                                                            }} className="p-1 bg-surface rounded text-xs text-primary disabled:opacity-50 hover:brightness-90" disabled={idx === existingImages.length - 1}>→</button>
                                                        </div>
                                                        <button type="button" onClick={() => setExistingImages(existingImages.filter((_, i) => i !== idx))} className="px-2 py-0.5 mt-1 bg-error text-white rounded text-[10px] font-bold">REMOVE</button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className={`p-4 rounded-lg border-2 transition-all ${dragActive ? 'border-brand bg-brand/5' : 'border-default bg-surface'}`}>
                                    <label htmlFor="file-input" className={`block text-center cursor-pointer ${dragActive ? 'text-brand' : 'text-secondary'}`}>
                                        <p className="text-sm font-medium mb-1">{dragActive ? '📌 Drop images here' : '📁 Drag & drop images here or click to browse'}</p>
                                        <p className="text-xs text-tertiary">Supports JPG, PNG, WebP, GIF</p>
                                    </label>
                                    <input
                                        id="file-input"
                                        type="file" multiple accept="image/*"
                                        onChange={(e) => {
                                            const files = e.target.files;
                                            if (files) {
                                                const newFiles = new DataTransfer();
                                                Array.from(selectedFiles || []).forEach(f => newFiles.items.add(f));
                                                Array.from(files).forEach(f => newFiles.items.add(f));
                                                setSelectedFiles(newFiles.files);
                                            }
                                        }}
                                        className="hidden"
                                    />
                                </div>
                                <p className="text-xs text-brand mt-2">Select new files to append to the product gallery.</p>
                                {selectedFiles.length > 0 && (
                                    <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
                                        {Array.from(selectedFiles).map((file, idx) => (
                                            <div key={idx} className="w-16 h-16 flex-shrink-0 border border-success/30 rounded overflow-hidden relative">
                                                <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                                                <div className="absolute top-0 right-0 bg-success text-white text-[9px] px-1 font-bold">NEW</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end gap-3">
                            <button type="button" disabled={uploading} onClick={() => setShowAddForm(false)} className="px-5 py-2.5 text-secondary bg-surface hover:brightness-95 border border-default font-medium rounded-lg transition-colors">
                                Cancel
                            </button>
                            <button type="submit" disabled={uploading} className="btn-primary flex items-center gap-2 px-6 py-2.5 shadow-sm transition-colors disabled:opacity-50">
                                {uploading ? 'Processing...' : (editingId ? 'Update Product' : 'Publish Listing')}
                            </button>
                        </div>

                    </form>
                </div>
            )}

            {/* Product List */}
            <div className="bg-surface rounded-2xl shadow-sm border border-default overflow-hidden text-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-default">
                        <thead className="bg-page">
                            <tr>
                                <th className="px-6 py-4 text-left font-semibold text-secondary uppercase tracking-wider">Product</th>
                                <th className="px-6 py-4 text-left font-semibold text-secondary uppercase tracking-wider">Category</th>
                                <th className="px-6 py-4 text-left font-semibold text-secondary uppercase tracking-wider">Brand</th>
                                <th className="px-6 py-4 text-right font-semibold text-secondary uppercase tracking-wider">Retail Price</th>
                                <th className="px-6 py-4 text-right font-semibold text-secondary uppercase tracking-wider">Our Cost</th>
                                <th className="px-6 py-4 text-center font-semibold text-secondary uppercase tracking-wider">Inventory</th>
                                <th className="px-6 py-4 text-center font-semibold text-secondary uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-surface divide-y divide-default">
                            {loading ? (
                                <tr><td colSpan="6" className="text-center py-8 text-secondary">Loading catalog...</td></tr>
                            ) : products.length === 0 ? (
                                <tr><td colSpan="6" className="text-center py-12 text-secondary">No products available. Add one above!</td></tr>
                            ) : (
                                products.map(product => (
                                    <tr key={product._id} className="hover:bg-page transition-colors">
                                        <td className="px-6 py-4">
                                            <Link to={`/product/${product._id}`} target="_blank" className="flex items-center gap-4 group cursor-pointer inline-flex">
                                                <div className="w-12 h-12 rounded-lg bg-brand-subtle border border-brand/20 overflow-hidden group-hover:ring-2 ring-brand/50 transition-all">
                                                    {product.images?.[0] ? (
                                                        <img src={product.images[0].url} alt={product.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-xs text-brand/50">Img</div>
                                                    )}
                                                </div>
                                                <div>
                                                    <span className="font-bold text-primary block group-hover:text-brand transition-colors">{product.name}</span>
                                                    <span className="text-xs text-tertiary font-mono">ID: ...{product._id.substring(product._id.length - 4)}</span>
                                                </div>
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-secondary">
                                            <span className="bg-page text-primary border border-default px-2 py-1 rounded-md text-xs font-medium">
                                                {product.category?.name || 'Unknown'}
                                                {product.subcategory ? (
                                                    <span className="text-tertiary font-normal ml-1">
                                                        &rsaquo; {product.subcategory.name}
                                                    </span>
                                                ) : null}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-secondary">
                                            {product.brand ? (
                                                <span className="bg-brand-subtle text-brand border border-brand/20 px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider">
                                                    {product.brand.name}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-tertiary">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-success">
                                            {currency}{product.price?.toFixed(2) || '0.00'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-warning">
                                            {currency}{product.costPrice?.toFixed(2) || '0.00'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            {product.stock > 0 ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-info-bg text-info">
                                                    {product.stock} in stock
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-error-bg text-error">
                                                    Out of stock
                                                </span>
                                            )}
                                            {product.variants && product.variants.length > 0 && (
                                                <div className="text-[10px] text-tertiary mt-1 uppercase font-bold tracking-wider">
                                                    + {product.variants.length} Variants
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                            {product.isActive === false && (
                                                <span className="block mb-2 text-xs font-bold text-error bg-error-bg rounded px-1 py-0.5">Inactive</span>
                                            )}
                                            <Link
                                                to={`/product/${product._id}`}
                                                target="_blank"
                                                className="inline-flex text-tertiary hover:text-info p-2 rounded-lg transition-colors mr-1"
                                                title="View Product Details"
                                            >
                                                <ExternalLink size={18} />
                                            </Link>
                                            <button
                                                onClick={() => openEditForm(product)}
                                                className="text-tertiary hover:text-brand p-2 rounded-lg transition-colors"
                                                title="Edit Product"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => deleteProductHandler(product._id, product.name)}
                                                className="text-error hover:brightness-90 p-2 rounded-lg transition-colors ml-2"
                                                title="Delete Product"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
};

export default ProductManage;
