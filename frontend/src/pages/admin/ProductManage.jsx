import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../../context/useAuthStore';
import { Package, Plus, Edit, Trash2, Tag, UploadCloud, ExternalLink } from 'lucide-react';

const ProductManage = () => {
    const { userInfo } = useAuthStore();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);

    // Form states
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [discountPrice, setDiscountPrice] = useState('0');
    const [costPrice, setCostPrice] = useState('0'); // Admin only
    const [categoryId, setCategoryId] = useState('');
    const [subcategoryId, setSubcategoryId] = useState('');
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

    const fetchData = async () => {
        try {
            setLoading(true);
            const [prodRes, catRes, brandRes] = await Promise.all([
                axios.get('http://localhost:5000/api/products?admin=true'),
                axios.get('http://localhost:5000/api/categories'),
                axios.get('http://localhost:5000/api/brands')
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
                    const { data } = await axios.post('http://localhost:5000/api/upload', formData, {
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
                    const { data } = await axios.post('http://localhost:5000/api/upload', formData, {
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
                price: variants.length > 0 ? (finalVariants[0]?.price || 0) : Number(price),
                discountPrice: variants.length > 0 ? (finalVariants[0]?.discountPrice || 0) : Number(discountPrice),
                costPrice: variants.length > 0 ? (finalVariants[0]?.costPrice || 0) : Number(costPrice),
                category: categoryId,
                subcategory: subcategoryId || undefined,
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
                await axios.put(`http://localhost:5000/api/products/${editingId}`, productData, config);
            } else {
                productData.images = finalImages.length > 0 ? finalImages : [{ public_id: 'placeholder', url: 'https://via.placeholder.com/300' }];
                await axios.post('http://localhost:5000/api/products', productData, config);
            }

            // Reset form
            setName('');
            setDescription('');
            setPrice('');
            setDiscountPrice('0');
            setCostPrice('0');
            setCategoryId('');
            setSubcategoryId('');
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
        setPrice(product.price);
        setDiscountPrice(product.discountPrice || '0');
        setCostPrice(product.costPrice || '0');
        setCategoryId(product.category?._id || product.category || '');
        setSubcategoryId(product.subcategory || '');
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
                await axios.delete(`http://localhost:5000/api/products/${id}`, config);
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
                    <h1 className="text-2xl font-bold text-slate-800">Product Catalog</h1>
                    <p className="text-slate-500 text-sm mt-1">Manage listings, set retail prices, and view stock.</p>
                </div>
                <button
                    onClick={() => {
                        if (showAddForm) {
                            setShowAddForm(false);
                            setEditingId(null);
                            setName('');
                            setDescription('');
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
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8 animate-fade-in-up mb-8">
                    <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
                        <Package size={20} className="text-pink-500" /> {editingId ? 'Edit Product' : 'New Product Listing'}
                    </h2>

                    <form onSubmit={createProductHandler} className="space-y-6">

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Product Title</label>
                                <input
                                    type="text" required value={name} onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg input-focus bg-slate-50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Brand (Optional)</label>
                                <select
                                    value={brandId} onChange={(e) => setBrandId(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg input-focus bg-slate-50 text-slate-700"
                                >
                                    <option value="">No Brand Selected</option>
                                    {brands.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                                    <select
                                        required value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setSubcategoryId(''); }}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg input-focus bg-slate-50 text-slate-700"
                                    >
                                        <option value="">Select category</option>
                                        {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Subcategory</label>
                                    <select
                                        value={subcategoryId} onChange={(e) => setSubcategoryId(e.target.value)}
                                        disabled={!categoryId || categories.find(c => c._id === categoryId)?.subcategories?.length === 0}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg input-focus bg-slate-50 text-slate-700 disabled:opacity-50"
                                    >
                                        <option value="">{categoryId ? 'Select subcategory (Optional)' : 'Select category first'}</option>
                                        {categories.find(c => c._id === categoryId)?.subcategories?.map(sub => (
                                            <option key={sub._id} value={sub._id}>{sub.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                            <textarea
                                required value={description} onChange={(e) => setDescription(e.target.value)}
                                rows="3"
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg input-focus bg-slate-50"
                            ></textarea>
                        </div>

                        {variants.length === 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <div>
                                    <label className="block text-sm font-medium text-emerald-700 mb-1 flex items-center gap-1">
                                        <Tag size={16} /> Retail Price ($)
                                    </label>
                                    <input
                                        type="number" required step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)}
                                        className="w-full px-4 py-2 border border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500 rounded-lg outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-pink-700 mb-1 flex items-center gap-1">
                                        <Tag size={16} /> Discount Price ($)
                                    </label>
                                    <input
                                        type="number" step="0.01" min="0" value={discountPrice} onChange={(e) => setDiscountPrice(e.target.value)}
                                        className="w-full px-4 py-2 border border-pink-200 focus:border-pink-500 focus:ring-pink-500 rounded-lg outline-none"
                                    />
                                    <p className="text-xs text-pink-600 mt-1">Leave 0 if none.</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-amber-700 mb-1 flex items-center gap-1">
                                        <Tag size={16} /> Base Unit Cost ($)
                                    </label>
                                    <input
                                        type="number" required step="0.01" min="0" value={costPrice} onChange={(e) => setCostPrice(e.target.value)}
                                        className="w-full px-4 py-2 border border-amber-200 focus:border-amber-500 focus:ring-amber-500 rounded-lg outline-none"
                                    />
                                    <p className="text-xs text-amber-600 mt-1">Tracked for profit.</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                                        <Package size={16} /> Current Stock Qty
                                    </label>
                                    <input
                                        type="number" required min="0" value={stock} onChange={(e) => setStock(e.target.value)}
                                        className="w-full px-4 py-2 border border-slate-200 focus:border-slate-500 focus:ring-slate-500 rounded-lg outline-none"
                                    />
                                    <p className="text-xs text-slate-500 mt-1">Initial stock level.</p>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <input
                                type="checkbox" id="isActive" checked={isActive} onChange={(e) => setIsActive(e.target.checked)}
                                className="w-5 h-5 text-pink-600 rounded border-slate-300 focus:ring-pink-500"
                            />
                            <label htmlFor="isActive" className="font-bold text-slate-800 cursor-pointer">
                                Product is Active <span className="font-normal text-slate-500 ml-2">(Uncheck to hide from customer storefront)</span>
                            </label>
                        </div>

                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                    <Tag size={18} /> Product Variants (Optional)
                                </h3>
                                <button type="button" onClick={addVariant} className="text-sm px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 hover:text-pink-600 hover:border-pink-300 font-medium transition-colors">
                                    + Add Variant
                                </button>
                            </div>
                            {variants.length > 0 ? (
                                <div className="space-y-3">
                                    {variants.map((v, idx) => (
                                        <div key={idx} className="flex flex-col gap-3 bg-white p-4 rounded-lg border border-slate-200 shadow-sm relative pr-10">
                                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Option Name</label>
                                                    <input type="text" placeholder="e.g. Size, Color" value={v.name} onChange={(e) => handleVariantChange(idx, 'name', e.target.value)} className="w-full text-sm mt-1 px-3 py-1.5 border border-slate-200 rounded outline-none focus:border-pink-400" required />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Value</label>
                                                    <input type="text" placeholder="e.g. 100ml, Red" value={v.value} onChange={(e) => handleVariantChange(idx, 'value', e.target.value)} className="w-full text-sm mt-1 px-3 py-1.5 border border-slate-200 rounded outline-none focus:border-pink-400" required />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-emerald-600 uppercase">Retail Price ($)</label>
                                                    <input type="number" step="0.01" value={v.price} onChange={(e) => handleVariantChange(idx, 'price', e.target.value)} className="w-full text-sm mt-1 px-3 py-1.5 border border-slate-200 rounded outline-none focus:border-emerald-400" required />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-pink-600 uppercase">Discount Price ($)</label>
                                                    <input type="number" step="0.01" value={v.discountPrice} onChange={(e) => handleVariantChange(idx, 'discountPrice', e.target.value)} className="w-full text-sm mt-1 px-3 py-1.5 border border-slate-200 rounded outline-none focus:border-pink-400" />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-amber-600 uppercase">Base Unit Cost ($)</label>
                                                    <input type="number" step="0.01" value={v.costPrice} onChange={(e) => handleVariantChange(idx, 'costPrice', e.target.value)} className="w-full text-sm mt-1 px-3 py-1.5 border border-slate-200 rounded outline-none focus:border-amber-400" required />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-indigo-600 uppercase">Current Stock Qty</label>
                                                    <input type="number" min="0" value={v.stock} onChange={(e) => handleVariantChange(idx, 'stock', e.target.value)} className="w-full text-sm mt-1 px-3 py-1.5 border border-slate-200 rounded outline-none focus:border-indigo-400" required />
                                                </div>
                                                <div className="col-span-2">
                                                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Variant Image (Optional)</label>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        {(v.image || v.imageFile) && (
                                                            <div className="w-10 h-10 rounded border overflow-hidden flex-shrink-0">
                                                                <img src={v.imageFile ? URL.createObjectURL(v.imageFile) : v.image} alt="variant" className="w-full h-full object-cover" />
                                                            </div>
                                                        )}
                                                        <input type="file" accept="image/*" onChange={(e) => handleVariantChange(idx, 'imageFile', e.target.files[0])} className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100" />
                                                    </div>
                                                </div>
                                            </div>
                                            <button type="button" onClick={() => removeVariant(idx)} className="absolute right-3 top-4 text-rose-400 hover:text-rose-600 p-1 bg-rose-50 rounded-md">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    <p className="text-xs text-slate-500 mt-2">When variants are active, the specific unit price and stock applies directly instead of a base price.</p>
                                </div>
                            ) : (
                                <p className="text-sm text-slate-500">No variants added. E.g add sizes (100ml, 50ml) or shades (Red, Pink).</p>
                            )}
                        </div>

                        <div className="bg-pink-50 p-6 rounded-xl border border-pink-100 border-dashed">
                            <h3 className="text-sm font-bold text-pink-800 mb-3 flex items-center gap-2">
                                <UploadCloud size={18} /> Upload Product Images
                            </h3>
                            <div>
                                {existingImages.length > 0 && (
                                    <div className="mb-4 p-4 bg-white rounded-lg border border-pink-100">
                                        <h4 className="text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Currently Saved Images (Drag left/right implicitly via buttons)</h4>
                                        <div className="flex gap-2 overflow-x-auto pb-2">
                                            {existingImages.map((img, idx) => (
                                                <div key={idx} className="relative w-24 h-24 flex-shrink-0 border border-slate-200 rounded-md overflow-hidden group">
                                                    <img src={img.url} alt="existing" className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-center items-center gap-1">
                                                        <div className="flex gap-1">
                                                            <button type="button" onClick={() => {
                                                                if (idx === 0) return;
                                                                const newImgs = [...existingImages];
                                                                [newImgs[idx - 1], newImgs[idx]] = [newImgs[idx], newImgs[idx - 1]];
                                                                setExistingImages(newImgs);
                                                            }} className="p-1 bg-white rounded text-xs text-slate-800 disabled:opacity-50 hover:bg-slate-200" disabled={idx === 0}>←</button>

                                                            <button type="button" onClick={() => {
                                                                if (idx === existingImages.length - 1) return;
                                                                const newImgs = [...existingImages];
                                                                [newImgs[idx + 1], newImgs[idx]] = [newImgs[idx], newImgs[idx + 1]];
                                                                setExistingImages(newImgs);
                                                            }} className="p-1 bg-white rounded text-xs text-slate-800 disabled:opacity-50 hover:bg-slate-200" disabled={idx === existingImages.length - 1}>→</button>
                                                        </div>
                                                        <button type="button" onClick={() => setExistingImages(existingImages.filter((_, i) => i !== idx))} className="px-2 py-0.5 mt-1 bg-rose-500 text-white rounded text-[10px] font-bold">REMOVE</button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <input
                                    type="file" multiple accept="image/*"
                                    onChange={(e) => setSelectedFiles(e.target.files)}
                                    className="w-full px-3 py-2 border border-pink-200 rounded text-sm bg-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100"
                                />
                                <p className="text-xs text-pink-600 mt-2">Select new files to append to the product gallery.</p>
                                {selectedFiles.length > 0 && (
                                    <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
                                        {Array.from(selectedFiles).map((file, idx) => (
                                            <div key={idx} className="w-16 h-16 flex-shrink-0 border border-emerald-200 rounded overflow-hidden relative">
                                                <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                                                <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[9px] px-1 font-bold">NEW</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end gap-3">
                            <button type="button" disabled={uploading} onClick={() => setShowAddForm(false)} className="px-5 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 font-medium rounded-lg transition-colors">
                                Cancel
                            </button>
                            <button type="submit" disabled={uploading} className="flex items-center gap-2 px-6 py-2.5 bg-pink-600 hover:bg-pink-700 text-white font-medium rounded-lg shadow-sm transition-colors disabled:opacity-50">
                                {uploading ? 'Processing...' : (editingId ? 'Update Product' : 'Publish Listing')}
                            </button>
                        </div>

                    </form>
                </div>
            )}

            {/* Product List */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden text-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-4 text-left font-semibold text-slate-600 uppercase tracking-wider">Product</th>
                                <th className="px-6 py-4 text-left font-semibold text-slate-600 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-4 text-left font-semibold text-slate-600 uppercase tracking-wider">Brand</th>
                                <th className="px-6 py-4 text-right font-semibold text-slate-600 uppercase tracking-wider">Retail Price</th>
                                <th className="px-6 py-4 text-right font-semibold text-slate-600 uppercase tracking-wider">Our Cost</th>
                                <th className="px-6 py-4 text-center font-semibold text-slate-600 uppercase tracking-wider">Inventory</th>
                                <th className="px-6 py-4 text-center font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan="6" className="text-center py-8 text-slate-500">Loading catalog...</td></tr>
                            ) : products.length === 0 ? (
                                <tr><td colSpan="6" className="text-center py-12 text-slate-500">No products available. Add one above!</td></tr>
                            ) : (
                                products.map(product => (
                                    <tr key={product._id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <Link to={`/product/${product._id}`} target="_blank" className="flex items-center gap-4 group cursor-pointer inline-flex">
                                                <div className="w-12 h-12 rounded-lg bg-pink-50 border border-pink-100 overflow-hidden group-hover:ring-2 ring-pink-300 transition-all">
                                                    {product.images?.[0] ? (
                                                        <img src={product.images[0].url} alt={product.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-xs text-pink-300">Img</div>
                                                    )}
                                                </div>
                                                <div>
                                                    <span className="font-bold text-slate-900 block group-hover:text-pink-600 transition-colors">{product.name}</span>
                                                    <span className="text-xs text-slate-400 font-mono">ID: ...{product._id.substring(product._id.length - 4)}</span>
                                                </div>
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                                            <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-md text-xs font-medium">
                                                {product.category?.name || 'Unknown'}
                                                {product.subcategory ? (
                                                    <span className="text-slate-400 font-normal ml-1">
                                                        &rsaquo; {product.subcategory.name}
                                                    </span>
                                                ) : null}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                                            {product.brand ? (
                                                <span className="bg-pink-50 text-pink-700 px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider">
                                                    {product.brand.name}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-slate-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-emerald-600">
                                            ${product.price?.toFixed(2) || '0.00'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-amber-600">
                                            ${product.costPrice?.toFixed(2) || '0.00'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            {product.stock > 0 ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    {product.stock} in stock
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
                                                    Out of stock
                                                </span>
                                            )}
                                            {product.variants && product.variants.length > 0 && (
                                                <div className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-wider">
                                                    + {product.variants.length} Variants
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                            {product.isActive === false && (
                                                <span className="block mb-2 text-xs font-bold text-rose-600 bg-rose-50 rounded px-1 py-0.5">Inactive</span>
                                            )}
                                            <Link
                                                to={`/product/${product._id}`}
                                                target="_blank"
                                                className="inline-flex text-slate-400 hover:text-indigo-600 p-2 rounded-lg transition-colors mr-1"
                                                title="View Product Details"
                                            >
                                                <ExternalLink size={18} />
                                            </Link>
                                            <button
                                                onClick={() => openEditForm(product)}
                                                className="text-slate-400 hover:text-pink-600 p-2 rounded-lg transition-colors"
                                                title="Edit Product"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => deleteProductHandler(product._id, product.name)}
                                                className="text-rose-400 hover:text-rose-600 p-2 rounded-lg transition-colors ml-2"
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
