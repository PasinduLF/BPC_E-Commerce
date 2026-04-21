import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../../context/useAuthStore';
import { useConfigStore } from '../../context/useConfigStore';
import { Package, Plus, Edit, Trash2, Tag, UploadCloud, ExternalLink, Search, Copy, Download, GripVertical } from 'lucide-react';
import { notify } from '../../utils/notify';
import StatusLegend from '../../components/admin/StatusLegend';

const PRODUCT_DRAFT_KEY = 'admin-product-draft-v1';
import { FALLBACK_PRODUCT_IMAGE, getProductImageUrl } from '../../utils/imageUtils';

const ProductManage = () => {
    const { userInfo } = useAuthStore();
    const { config } = useConfigStore();
    const currency = config?.currencySymbol || '$';
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [catalogSearch, setCatalogSearch] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterBrand, setFilterBrand] = useState('all');
    const [stockFilter, setStockFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [activeFormTab, setActiveFormTab] = useState('basic');
    const [fieldErrors, setFieldErrors] = useState({});
    const [uploadProgress, setUploadProgress] = useState(0);
    const [sku, setSku] = useState('');
    const [lastTemplate, setLastTemplate] = useState(null);
    const [draggedExistingImageIndex, setDraggedExistingImageIndex] = useState(null);

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

    const removeSelectedFile = (indexToRemove) => {
        const newFiles = new DataTransfer();
        Array.from(selectedFiles).forEach((file, idx) => {
            if (idx !== indexToRemove) {
                newFiles.items.add(file);
            }
        });
        setSelectedFiles(newFiles.files);
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const pageSize = 48;
            const [firstProductRes, catRes, brandRes] = await Promise.all([
                axios.get(`/api/products?admin=true&pageNumber=1&pageSize=${pageSize}`),
                axios.get('/api/categories'),
                axios.get('/api/brands')
            ]);

            const firstPageProducts = firstProductRes.data?.products || [];
            const totalPages = Number(firstProductRes.data?.pages || 1);

            if (totalPages > 1) {
                const remainingRequests = [];
                for (let page = 2; page <= totalPages; page += 1) {
                    remainingRequests.push(
                        axios.get(`/api/products?admin=true&pageNumber=${page}&pageSize=${pageSize}`)
                    );
                }

                const remainingResponses = await Promise.all(remainingRequests);
                const remainingProducts = remainingResponses.flatMap((response) => response.data?.products || []);
                setProducts([...firstPageProducts, ...remainingProducts]);
            } else {
                setProducts(firstPageProducts);
            }

            setCategories(catRes.data);
            setBrands(brandRes.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        const savedDraft = localStorage.getItem(PRODUCT_DRAFT_KEY);
        if (!savedDraft || showAddForm) return;

        try {
            const draft = JSON.parse(savedDraft);
            if (!draft || typeof draft !== 'object') return;
            setName(draft.name || '');
            setDescription(draft.description || '');
            setDescriptionSections(draft.descriptionSections || {
                details: '', benefits: '', howToUse: '', ingredients: '', specifications: '', shippingInformation: ''
            });
            setPrice(draft.price || '');
            setDiscountPrice(draft.discountPrice || '0');
            setCostPrice(draft.costPrice || '0');
            setCategoryId(draft.categoryId || '');
            setSubcategoryId(draft.subcategoryId || '');
            setInnerSubcategoryId(draft.innerSubcategoryId || '');
            setBrandId(draft.brandId || '');
            setStock(draft.stock || '0');
            setSku(draft.sku || '');
        } catch (error) {
            console.error('Failed to parse product draft', error);
        }
    }, [showAddForm]);

    useEffect(() => {
        if (!showAddForm || editingId) return;

        const draftData = {
            name,
            description,
            descriptionSections,
            price,
            discountPrice,
            costPrice,
            categoryId,
            subcategoryId,
            innerSubcategoryId,
            brandId,
            stock,
            sku,
        };
        localStorage.setItem(PRODUCT_DRAFT_KEY, JSON.stringify(draftData));
    }, [showAddForm, editingId, name, description, descriptionSections, price, discountPrice, costPrice, categoryId, subcategoryId, innerSubcategoryId, brandId, stock, sku]);

    const validateField = (fieldName, value) => {
        if (fieldName === 'name' && !String(value || '').trim()) return 'Product title is required.';
        if (fieldName === 'description' && String(value || '').trim().length < 20) return 'Description should be at least 20 characters.';
        if (fieldName === 'price' && Number(value || 0) <= 0 && variants.length === 0) return 'Retail price must be greater than 0.';
        if (fieldName === 'stock' && Number(value || 0) < 0 && variants.length === 0) return 'Stock cannot be negative.';
        return '';
    };

    const handleValidatedInput = (fieldName, value, setter) => {
        setter(value);
        const error = validateField(fieldName, value);
        setFieldErrors((prev) => ({ ...prev, [fieldName]: error }));
    };

    const generateSku = () => {
        const titlePart = String(name || 'ITEM').toUpperCase().replace(/[^A-Z0-9]+/g, '').slice(0, 6) || 'ITEM';
        const categoryPart = String(categories.find((c) => c._id === categoryId)?.name || 'GEN').toUpperCase().replace(/[^A-Z0-9]+/g, '').slice(0, 3) || 'GEN';
        const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase();
        setSku(`${categoryPart}-${titlePart}-${randomPart}`);
    };

    const cloneProduct = (product) => {
        setEditingId(null);
        setName(`${product.name} (Copy)`);
        setDescription(product.description || '');
        setDescriptionSections({
            details: product.descriptionSections?.details || '',
            benefits: product.descriptionSections?.benefits || '',
            howToUse: product.descriptionSections?.howToUse || '',
            ingredients: product.descriptionSections?.ingredients || '',
            specifications: product.descriptionSections?.specifications || '',
            shippingInformation: product.descriptionSections?.shippingInformation || ''
        });
        setPrice(product.price || '');
        setDiscountPrice(product.discountPrice || '0');
        setCostPrice(product.costPrice || '0');
        setCategoryId(product.category?._id || product.category || '');
        setSubcategoryId(product.subcategory?._id || product.subcategory || '');
        setInnerSubcategoryId(product.innerSubcategory?._id || product.innerSubcategory || '');
        setBrandId(product.brand?._id || product.brand || '');
        setStock(product.stock || '0');
        setVariants(product.variants || []);
        setExistingImages(product.images || []);
        setSelectedFiles([]);
        setSku('');
        setActiveFormTab('basic');
        setShowAddForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const exportProductsCsv = () => {
        const headers = ['ID', 'Name', 'Category', 'Brand', 'Price', 'Cost', 'Stock', 'Status'];
        const rows = filteredProducts.map((product) => [
            product._id,
            product.name,
            product.category?.name || 'Unknown',
            product.brand?.name || 'Unbranded',
            Number(product.price || 0).toFixed(2),
            Number(product.costPrice || 0).toFixed(2),
            Number(product.stock || 0),
            product.isActive === false ? 'Inactive' : 'Active',
        ]);
        const csv = [headers, ...rows]
            .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
            .join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `products-export-${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const filteredProducts = useMemo(() => {
        const searchValue = catalogSearch.trim().toLowerCase();

        return products.filter((product) => {
            const matchesSearch = !searchValue
                || String(product.name || '').toLowerCase().includes(searchValue)
                || String(product._id || '').toLowerCase().includes(searchValue);

            const productCategoryId = String(product.category?._id || product.category || '');
            const matchesCategory = filterCategory === 'all' || productCategoryId === filterCategory;

            const productBrandId = String(product.brand?._id || product.brand || '');
            const matchesBrand = filterBrand === 'all' || productBrandId === filterBrand;

            const productStock = Number(product.stock || 0);
            const matchesStock = stockFilter === 'all'
                || (stockFilter === 'in' && productStock > 0)
                || (stockFilter === 'out' && productStock <= 0);

            const active = product.isActive !== false;
            const matchesStatus = statusFilter === 'all'
                || (statusFilter === 'active' && active)
                || (statusFilter === 'inactive' && !active);

            return matchesSearch && matchesCategory && matchesBrand && matchesStock && matchesStatus;
        });
    }, [products, catalogSearch, filterCategory, filterBrand, stockFilter, statusFilter]);

    const createProductHandler = async (e) => {
        e.preventDefault();
        const nameError = validateField('name', name);
        const descriptionError = validateField('description', description);
        const priceError = validateField('price', price);
        const stockError = validateField('stock', stock);

        if (nameError || descriptionError || priceError || stockError) {
            setFieldErrors({ name: nameError, description: descriptionError, price: priceError, stock: stockError });
            setActiveFormTab('basic');
            return;
        }

        try {
            setUploading(true);
            setUploadProgress(0);
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
                    setUploadProgress(Math.round(((i + 1) / selectedFiles.length) * 100));
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
                sku: sku || undefined,
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
                productData.images = finalImages.length > 0 ? finalImages : [{ public_id: 'placeholder', url: FALLBACK_PRODUCT_IMAGE }];
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
            setSku('');
            setUploadProgress(0);
            localStorage.removeItem(PRODUCT_DRAFT_KEY);
            setLastTemplate(productData);
            fetchData();
            setUploading(false);

        } catch (error) {
            setUploading(false);
            setUploadProgress(0);
            notify({ type: 'error', title: 'Save failed', description: error.response?.data?.message || 'Failed to save product' });
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
        setSku(product.sku || '');
        setShowAddForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const deleteProductHandler = async (id, title) => {
        if (window.confirm(`Delete product ${title}?`)) {
            try {
                const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
                await axios.delete(`/api/products/${id}`, config);
                fetchData();
                notify({ type: 'success', title: 'Product deleted', description: `${title} was removed.` });
            } catch (error) {
                notify({ type: 'error', title: 'Delete failed', description: error.response?.data?.message || 'Failed to delete product' });
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
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={exportProductsCsv}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-default bg-surface text-secondary hover:text-brand hover:border-brand transition-colors"
                    >
                        <Download size={16} />
                        Export CSV
                    </button>
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
                                setSku('');
                            } else {
                                setShowAddForm(true);
                            }
                        }}
                        className="btn-primary flex items-center gap-2"
                    >
                        {showAddForm ? 'Cancel' : <><Plus size={18} /> Add Product</>}
                    </button>
                </div>
            </div>

            <StatusLegend />

            {showAddForm && (
                <div className="bg-surface rounded-2xl shadow-sm border border-default p-6 sm:p-8 animate-fade-in-up mb-8">
                    <h2 className="text-lg font-bold text-primary mb-6 flex items-center gap-2 border-b border-default pb-4">
                        <Package size={20} className="text-brand" /> {editingId ? 'Edit Product' : 'New Product Listing'}
                    </h2>

                    <form onSubmit={createProductHandler} className="space-y-6">

                        <div className="flex flex-wrap gap-2 border-b border-default pb-4">
                            {[
                                { key: 'basic', label: 'Basic Info', target: 'tab-basic' },
                                { key: 'pricing', label: 'Pricing', target: 'tab-pricing' },
                                { key: 'images', label: 'Images', target: 'tab-images' },
                                { key: 'variants', label: 'Variants', target: 'tab-variants' },
                                { key: 'meta', label: 'Meta', target: 'tab-meta' },
                            ].map((tab) => (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => {
                                        setActiveFormTab(tab.key);
                                        document.getElementById(tab.target)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                    }}
                                    className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${activeFormTab === tab.key ? 'bg-brand-subtle border-brand text-brand' : 'bg-page border-default text-secondary hover:text-brand hover:border-brand'}`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                            <button
                                type="button"
                                onClick={() => {
                                    if (!lastTemplate) return;
                                    setBrandId(lastTemplate.brand || '');
                                    setCategoryId(lastTemplate.category || '');
                                    setCostPrice(lastTemplate.costPrice || '0');
                                    setDiscountPrice(lastTemplate.discountPrice || '0');
                                }}
                                className="ml-auto inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-default bg-page text-secondary hover:text-brand hover:border-brand transition-colors"
                            >
                                <Copy size={14} />
                                Copy from previous
                            </button>
                        </div>

                        <div id="tab-basic" className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-primary mb-1">Product Title <span className="text-error">*</span></label>
                                <input
                                    type="text" required value={name} onChange={(e) => handleValidatedInput('name', e.target.value, setName)}
                                    className="w-full px-4 py-2 border border-default rounded-lg input-focus bg-page text-primary"
                                />
                                {fieldErrors.name && <p className="text-xs text-error mt-1">{fieldErrors.name}</p>}
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
                            <div>
                                <label className="block text-sm font-medium text-primary mb-1">SKU</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={sku}
                                        onChange={(e) => setSku(e.target.value.toUpperCase())}
                                        placeholder="Auto or manual SKU"
                                        className="w-full px-4 py-2 border border-default rounded-lg input-focus bg-page text-primary"
                                    />
                                    <button type="button" onClick={generateSku} className="px-3 py-2 rounded-lg border border-default text-secondary hover:text-brand hover:border-brand">
                                        Generate
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-primary mb-1">Short Description <span className="text-error">*</span></label>
                            <textarea
                                required value={description} onChange={(e) => handleValidatedInput('description', e.target.value, setDescription)}
                                rows="6"
                                placeholder="Short summary shown near product title"
                                className="w-full px-4 py-2 border border-default rounded-lg input-focus bg-page text-primary"
                            ></textarea>
                            {fieldErrors.description && <p className="text-xs text-error mt-1">{fieldErrors.description}</p>}
                        </div>

                        <div className="bg-page p-5 rounded-xl border border-default space-y-4">
                            <h3 className="text-sm font-bold text-primary uppercase tracking-wide">Product Description Sections</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-primary mb-1">Details</label>
                                    <textarea
                                        value={descriptionSections.details}
                                        onChange={(e) => setDescriptionSections((prev) => ({ ...prev, details: e.target.value }))}
                                        rows="6"
                                        className="w-full px-4 py-2 border border-default rounded-lg input-focus bg-surface text-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-primary mb-1">Benefits</label>
                                    <textarea
                                        value={descriptionSections.benefits}
                                        onChange={(e) => setDescriptionSections((prev) => ({ ...prev, benefits: e.target.value }))}
                                        rows="6"
                                        className="w-full px-4 py-2 border border-default rounded-lg input-focus bg-surface text-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-primary mb-1">How to Use</label>
                                    <textarea
                                        value={descriptionSections.howToUse}
                                        onChange={(e) => setDescriptionSections((prev) => ({ ...prev, howToUse: e.target.value }))}
                                        rows="6"
                                        className="w-full px-4 py-2 border border-default rounded-lg input-focus bg-surface text-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-primary mb-1">Ingredients</label>
                                    <textarea
                                        value={descriptionSections.ingredients}
                                        onChange={(e) => setDescriptionSections((prev) => ({ ...prev, ingredients: e.target.value }))}
                                        rows="6"
                                        className="w-full px-4 py-2 border border-default rounded-lg input-focus bg-surface text-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-primary mb-1">Specifications</label>
                                    <textarea
                                        value={descriptionSections.specifications}
                                        onChange={(e) => setDescriptionSections((prev) => ({ ...prev, specifications: e.target.value }))}
                                        rows="6"
                                        className="w-full px-4 py-2 border border-default rounded-lg input-focus bg-surface text-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-primary mb-1">Shipping Information</label>
                                    <textarea
                                        value={descriptionSections.shippingInformation}
                                        onChange={(e) => setDescriptionSections((prev) => ({ ...prev, shippingInformation: e.target.value }))}
                                        rows="6"
                                        className="w-full px-4 py-2 border border-default rounded-lg input-focus bg-surface text-primary"
                                    />
                                </div>
                            </div>
                        </div>

                        {variants.length === 0 && (
                            <div id="tab-pricing" className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-page p-4 rounded-xl border border-default">
                                <div>
                                    <label className="block text-sm font-medium text-success mb-1 flex items-center gap-1">
                                        <Tag size={16} /> Retail Price ({currency}) <span className="text-error">*</span>
                                    </label>
                                    <input
                                        type="number" required step="0.01" min="0" value={price} onChange={(e) => handleValidatedInput('price', e.target.value, setPrice)}
                                        className="w-full px-4 py-2 border border-default focus:border-success focus:ring-success rounded-lg outline-none bg-surface text-primary"
                                    />
                                    {fieldErrors.price && <p className="text-xs text-error mt-1">{fieldErrors.price}</p>}
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
                                        <Package size={16} /> Current Stock Qty <span className="text-error">*</span>
                                    </label>
                                    <input
                                        type="number" required min="0" value={stock} onChange={(e) => handleValidatedInput('stock', e.target.value, setStock)}
                                        className="w-full px-4 py-2 border border-default focus:border-primary focus:ring-primary rounded-lg outline-none bg-surface text-primary"
                                    />
                                    {fieldErrors.stock && <p className="text-xs text-error mt-1">{fieldErrors.stock}</p>}
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

                        <div id="tab-variants" className="bg-page p-6 rounded-xl border border-default">
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

                        <div id="tab-images" className="bg-brand-subtle p-6 rounded-xl border border-brand/20 border-dashed" onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}>
                            <h3 className="text-sm font-bold text-brand mb-3 flex items-center gap-2">
                                <UploadCloud size={18} /> Upload Product Images
                            </h3>
                            <div>
                                {existingImages.length > 0 && (
                                    <div className="mb-4 p-4 bg-surface rounded-lg border border-default">
                                        <h4 className="text-xs font-bold text-secondary mb-2 uppercase tracking-wide">Currently Saved Images (Drag left/right implicitly via buttons)</h4>
                                        <div className="flex gap-2 overflow-x-auto pb-2 snap-x touch-pan-x">
                                            {existingImages.map((img, idx) => (
                                                <div
                                                    key={idx}
                                                    className="relative w-24 h-24 flex-shrink-0 border border-default rounded-md overflow-hidden group snap-start"
                                                    draggable
                                                    onDragStart={() => setDraggedExistingImageIndex(idx)}
                                                    onDragOver={(e) => e.preventDefault()}
                                                    onDrop={() => {
                                                        if (draggedExistingImageIndex === null || draggedExistingImageIndex === idx) return;
                                                        const reordered = [...existingImages];
                                                        const [dragged] = reordered.splice(draggedExistingImageIndex, 1);
                                                        reordered.splice(idx, 0, dragged);
                                                        setExistingImages(reordered);
                                                        setDraggedExistingImageIndex(null);
                                                    }}
                                                >
                                                    <img src={img.url} alt="existing" className="w-full h-full object-cover" />
                                                    <div className="absolute left-1 top-1 bg-black/50 text-white rounded p-0.5">
                                                        <GripVertical size={12} />
                                                    </div>
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
                                {uploading && (
                                    <div className="mt-3">
                                        <div className="w-full h-2 bg-surface rounded-full overflow-hidden">
                                            <div className="h-full bg-brand transition-all" style={{ width: `${uploadProgress}%` }} />
                                        </div>
                                        <p className="text-xs text-secondary mt-1">Uploading {uploadProgress}%</p>
                                    </div>
                                )}
                                {selectedFiles.length > 0 && (
                                    <div className="mt-3">
                                        <div className="mb-2 text-xs text-secondary">
                                            {Array.from(selectedFiles).some((file) => file.size > 2 * 1024 * 1024) && (
                                                <p className="text-warning">Some images are larger than 2MB. Consider compressing for faster loading.</p>
                                            )}
                                        </div>
                                        <div className="flex gap-2 overflow-x-auto pb-2 snap-x touch-pan-x">
                                            {Array.from(selectedFiles).map((file, idx) => (
                                                <div key={idx} className="w-16 h-16 flex-shrink-0 border border-success/30 rounded overflow-hidden relative group snap-start">
                                                    <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                                                    <div className="absolute top-0 right-0 bg-success text-white text-[9px] px-1 font-bold">NEW</div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeSelectedFile(idx)}
                                                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xl font-bold hover:bg-black/70"
                                                        title="Remove this image"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-xs text-success mt-2">{selectedFiles.length} new image{selectedFiles.length !== 1 ? 's' : ''} selected</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div id="tab-meta" className="pt-4 flex justify-end gap-3">
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

            {/* Catalog Filters */}
            <div className="bg-surface rounded-2xl shadow-sm border border-default p-4 md:p-5">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    <div className="md:col-span-2 relative">
                        <Search size={16} className="absolute left-3 top-2.5 text-tertiary" />
                        <input
                            type="text"
                            value={catalogSearch}
                            onChange={(e) => setCatalogSearch(e.target.value)}
                            placeholder="Search by product name or ID..."
                            className="w-full pl-9 pr-3 py-2 border border-default rounded-lg bg-page text-primary input-focus"
                        />
                    </div>

                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="px-3 py-2 border border-default rounded-lg bg-page text-primary input-focus"
                    >
                        <option value="all">All Categories</option>
                        {categories.map((c) => (
                            <option key={c._id} value={c._id}>{c.name}</option>
                        ))}
                    </select>

                    <select
                        value={filterBrand}
                        onChange={(e) => setFilterBrand(e.target.value)}
                        className="px-3 py-2 border border-default rounded-lg bg-page text-primary input-focus"
                    >
                        <option value="all">All Brands</option>
                        {brands.map((b) => (
                            <option key={b._id} value={b._id}>{b.name}</option>
                        ))}
                    </select>

                    <div className="grid grid-cols-2 gap-2">
                        <select
                            value={stockFilter}
                            onChange={(e) => setStockFilter(e.target.value)}
                            className="px-3 py-2 border border-default rounded-lg bg-page text-primary input-focus"
                        >
                            <option value="all">All Stock</option>
                            <option value="in">In Stock</option>
                            <option value="out">Out</option>
                        </select>

                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2 border border-default rounded-lg bg-page text-primary input-focus"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Product List */}
            <div className="bg-surface rounded-2xl shadow-sm border border-default overflow-hidden text-sm hidden md:block">
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
                                Array.from({ length: 5 }).map((_, idx) => (
                                    <tr key={`skeleton-row-${idx}`}>
                                        <td colSpan="7" className="px-6 py-4"><div className="skeleton h-10 w-full" /></td>
                                    </tr>
                                ))
                            ) : filteredProducts.length === 0 ? (
                                <tr><td colSpan="7" className="text-center py-12 text-secondary">No products match the selected filters.</td></tr>
                            ) : (
                                filteredProducts.map(product => (
                                    <tr key={product._id} className="hover:bg-page transition-colors">
                                        <td className="px-6 py-4">
                                            <Link to={`/product/${product._id}`} target="_blank" className="flex items-center gap-4 group cursor-pointer inline-flex">
                                                <div className="w-12 h-12 rounded-lg bg-brand-subtle border border-brand/20 overflow-hidden group-hover:ring-2 ring-brand/50 transition-all">
                                                    {product.images?.[0] ? (
                                                        <img src={getProductImageUrl(product)} alt={product.name} className="w-full h-full object-cover" />
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
                                            {Number(product.stock || 0) <= 0 ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-error-bg text-error">
                                                    Out of stock
                                                </span>
                                            ) : Number(product.stock || 0) <= 10 ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning-bg text-warning">
                                                    Low ({product.stock})
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-bg text-success">
                                                    Healthy ({product.stock})
                                                </span>
                                            )}
                                            {Number(product.stock || 0) <= 5 && (
                                                <div className="text-[10px] text-error mt-1 uppercase font-bold tracking-wider">
                                                    Reorder alert
                                                </div>
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
                                                aria-label={`Open product ${product.name} in storefront`}
                                                className="inline-flex text-tertiary hover:text-info p-2 rounded-lg transition-colors mr-1"
                                                title="View Product Details"
                                            >
                                                <ExternalLink size={18} />
                                            </Link>
                                            <button
                                                onClick={() => openEditForm(product)}
                                                aria-label={`Edit product ${product.name}`}
                                                className="text-tertiary hover:text-brand p-2 rounded-lg transition-colors"
                                                title="Edit Product"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => cloneProduct(product)}
                                                aria-label={`Clone product ${product.name}`}
                                                className="text-tertiary hover:text-info p-2 rounded-lg transition-colors"
                                                title="Clone Product"
                                            >
                                                <Copy size={18} />
                                            </button>
                                            <button
                                                onClick={() => deleteProductHandler(product._id, product.name)}
                                                aria-label={`Delete product ${product.name}`}
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

            <div className="md:hidden space-y-3">
                {loading ? (
                    Array.from({ length: 6 }).map((_, idx) => (
                        <div key={idx} className="bg-surface rounded-xl border border-default p-4 space-y-2">
                            <div className="skeleton h-24 w-full" />
                            <div className="skeleton h-4 w-2/3" />
                            <div className="skeleton h-4 w-1/3" />
                        </div>
                    ))
                ) : filteredProducts.length === 0 ? (
                    <div className="bg-surface rounded-xl border border-default p-4 text-sm text-secondary">No products match the selected filters.</div>
                ) : (
                    filteredProducts.map((product) => (
                        <div key={`mobile-${product._id}`} className="bg-surface rounded-xl border border-default p-4">
                            <div className="flex items-start gap-3">
                                <div className="w-20 h-20 rounded-lg overflow-hidden bg-page border border-default">
                                    {product.images?.[0] ? (
                                        <img src={getProductImageUrl(product)} alt={product.name || 'Product image'} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xs text-tertiary">No Image</div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-primary line-clamp-1">{product.name}</p>
                                    <p className="text-xs text-secondary mt-1">{currency}{Number(product.price || 0).toFixed(2)} • Stock {Number(product.stock || 0)}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <button onClick={() => openEditForm(product)} className="btn-tertiary text-xs px-3 py-1.5">Edit</button>
                                        <button onClick={() => cloneProduct(product)} className="btn-tertiary text-xs px-3 py-1.5">Clone</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

        </div>
    );
};

export default ProductManage;
