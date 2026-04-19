import { useState, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';
import axios from 'axios';
import { useAuthStore } from '../../context/useAuthStore';
import { Tag, Plus, Trash2, Image as ImageIcon, ZoomIn, X, Check } from 'lucide-react';
import { toast } from 'sonner';

const createImage = (url) =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error) => reject(error));
        image.crossOrigin = 'anonymous';
        image.src = url;
    });

const getCroppedImage = async (imageSrc, cropPixels, fileName) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    canvas.width = cropPixels.width;
    canvas.height = cropPixels.height;

    context.drawImage(
        image,
        cropPixels.x,
        cropPixels.y,
        cropPixels.width,
        cropPixels.height,
        0,
        0,
        cropPixels.width,
        cropPixels.height
    );

    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            if (!blob) {
                resolve(null);
                return;
            }

            resolve(new File([blob], fileName, { type: 'image/png' }));
        }, 'image/png');
    });
};

const BrandManage = () => {
    const { userInfo } = useAuthStore();
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);

    // Form states
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingBrandId, setEditingBrandId] = useState('');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [cropperOpen, setCropperOpen] = useState(false);
    const [cropSource, setCropSource] = useState('');
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [cropping, setCropping] = useState(false);
    const [uploading, setUploading] = useState(false);

    const fetchBrands = async () => {
        try {
            setLoading(true);
            const { data } = await axios.get('/api/brands');
            setBrands(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching brands:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBrands();
    }, []);

    const resetLogoCropper = () => {
        setCropperOpen(false);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setCroppedAreaPixels(null);
    };

    const resetBrandForm = () => {
        setEditingBrandId('');
        setName('');
        setDescription('');
        setImageFile(null);
        setImagePreview('');
        setCropperOpen(false);
        setCropSource('');
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setCroppedAreaPixels(null);
    };

    const openCreateForm = () => {
        resetBrandForm();
        setShowAddForm((prev) => !prev);
    };

    const openEditForm = (brand) => {
        setShowAddForm(true);
        setEditingBrandId(brand._id);
        setName(brand.name || '');
        setDescription(brand.description || '');
        setImageFile(null);
        setImagePreview(brand.image || '');
        resetLogoCropper();
    };

    const handleBrandImageSelect = (file) => {
        if (!file) {
            return;
        }

        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));

        const reader = new FileReader();
        reader.onload = () => {
            setCropSource(String(reader.result || ''));
        };
        reader.readAsDataURL(file);
    };

    const openLogoCropper = () => {
        if (!cropSource) {
            toast.error('Choose a logo image first.');
            return;
        }

        setCropperOpen(true);
        setZoom(1);
        setCrop({ x: 0, y: 0 });
        setCroppedAreaPixels(null);
    };

    const handleCropComplete = (_, areaPixels) => {
        setCroppedAreaPixels(areaPixels);
    };

    const confirmCrop = async () => {
        if (!cropSource || !croppedAreaPixels) {
            return;
        }

        try {
            setCropping(true);
            const croppedFile = await getCroppedImage(cropSource, croppedAreaPixels, `brand-logo-${Date.now()}.png`);
            if (croppedFile) {
                setImageFile(croppedFile);
                setImagePreview(URL.createObjectURL(croppedFile));
            }
            resetLogoCropper();
        } finally {
            setCropping(false);
        }
    };

    const cancelCrop = () => {
        resetLogoCropper();
    };

    const createBrandHandler = async (e) => {
        e.preventDefault();
        try {
            setUploading(true);
            const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };

            let imageUrl = '';
            if (imageFile) {
                const formData = new FormData();
                formData.append('image', imageFile);
                const uploadRes = await axios.post('/api/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                imageUrl = uploadRes.data.url;
            }

            const payload = {
                name,
                description,
                image: imageUrl || imagePreview || '',
            };

            if (editingBrandId) {
                await axios.put(`/api/brands/${editingBrandId}`, payload, config);
            } else {
                await axios.post('/api/brands', payload, config);
            }

            // Reset form
            resetBrandForm();
            setShowAddForm(false);
            fetchBrands();
            setUploading(false);
            toast.success(editingBrandId ? 'Brand updated successfully.' : 'Brand created successfully.');
        } catch (error) {
            setUploading(false);
            toast.error(error.response?.data?.message || 'Failed to save brand');
        }
    };

    const deleteBrandHandler = async (id, brandName) => {
        if (window.confirm(`Are you sure you want to delete brand "${brandName}"?`)) {
            try {
                const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
                await axios.delete(`/api/brands/${id}`, config);
                fetchBrands();
                toast.success('Brand deleted successfully.');
            } catch (error) {
                toast.error(error.response?.data?.message || 'Failed to delete brand. It might be assigned to products.');
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-primary">Brand Management</h1>
                    <p className="text-secondary text-sm mt-1">Manage cosmetic brands available in the store.</p>
                </div>
                <button
                        onClick={openCreateForm}
                    className="btn-primary flex items-center gap-2"
                >
                        {showAddForm ? 'Cancel' : <><Plus size={18} /> Add Brand</>}
                </button>
            </div>

            {showAddForm && (
                <div className="bg-surface rounded-2xl shadow-sm border border-default p-6 sm:p-8 animate-fade-in-up mb-8">
                    <h2 className="text-lg font-bold text-primary mb-6 flex items-center gap-2 border-b border-default pb-4">
                            <Tag size={20} className="text-brand" /> {editingBrandId ? 'Edit Brand' : 'New Brand'}
                    </h2>

                    <form onSubmit={createBrandHandler} className="space-y-6 max-w-2xl">
                        <div>
                            <label className="block text-sm font-medium text-primary mb-1">Brand Name</label>
                            <input
                                type="text" required value={name} onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-2 border border-default rounded-lg input-focus bg-page text-primary"
                                placeholder="e.g. L'Oreal Paris"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-primary mb-1">Description (Optional)</label>
                            <textarea
                                value={description} onChange={(e) => setDescription(e.target.value)}
                                rows="3"
                                className="w-full px-4 py-2 border border-default rounded-lg input-focus bg-page text-primary"
                            ></textarea>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-primary mb-1">Brand Logo (Optional)</label>
                            <input
                                type="file" accept="image/*"
                                onChange={(e) => handleBrandImageSelect(e.target.files[0])}
                                className="w-full px-3 py-2 border border-default rounded text-sm bg-surface file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-subtle file:text-brand hover:file:brightness-95 text-primary"
                            />
                            <div className="mt-3 flex items-center gap-3 flex-wrap">
                                <button
                                    type="button"
                                    onClick={openLogoCropper}
                                    disabled={!cropSource}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand text-white hover:bg-brand-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ZoomIn size={16} />
                                    Crop logo
                                </button>
                                <p className="text-xs text-secondary">Select a logo first, then crop it to fit the home page brand strip cleanly.</p>
                            </div>
                            {imagePreview && (
                                <div className="mt-4 w-28 h-28 rounded-2xl border border-default bg-page p-2 flex items-center justify-center overflow-hidden">
                                    <img src={imagePreview} alt="Brand logo preview" className="w-full h-full object-contain" />
                                </div>
                            )}
                        </div>

                        <div className="pt-4 flex gap-3">
                            <button type="submit" disabled={uploading} className="flex-1 flex justify-center items-center gap-2 px-6 py-2.5 bg-brand hover:brightness-95 text-white font-medium rounded-lg shadow-sm transition-colors disabled:opacity-50">
                                {uploading ? 'Processing...' : editingBrandId ? 'Update Brand' : 'Save Brand'}
                            </button>
                            {editingBrandId && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        resetBrandForm();
                                        setShowAddForm(false);
                                    }}
                                    className="px-6 py-2.5 rounded-lg border border-default bg-page text-secondary hover:bg-brand hover:text-white transition-colors"
                                >
                                    Close Edit
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            )}

            {cropperOpen && (
                <div className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-surface rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden border border-default">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-default bg-page">
                            <div>
                                <h3 className="text-lg font-bold text-primary">Crop Brand Logo</h3>
                                <p className="text-xs text-secondary mt-1">Zoom and crop the image to match the home page logo display.</p>
                            </div>
                            <button
                                type="button"
                                onClick={cancelCrop}
                                className="p-2 rounded-lg hover:bg-surface text-secondary hover:text-primary transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="relative w-full h-[420px] bg-black">
                            <Cropper
                                image={cropSource}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                cropShape="rect"
                                showGrid={true}
                                onCropChange={setCrop}
                                onZoomChange={setZoom}
                                onCropComplete={handleCropComplete}
                            />
                        </div>

                        <div className="p-6 space-y-5 bg-surface">
                            <div className="flex items-center gap-3">
                                <ZoomIn size={18} className="text-brand" />
                                <input
                                    type="range"
                                    min="1"
                                    max="3"
                                    step="0.01"
                                    value={zoom}
                                    onChange={(e) => setZoom(Number(e.target.value))}
                                    className="w-full accent-brand"
                                />
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={cancelCrop}
                                    className="px-4 py-2 rounded-lg border border-default bg-page text-secondary hover:bg-brand hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={confirmCrop}
                                    disabled={cropping}
                                    className="px-4 py-2 rounded-lg bg-brand text-white hover:bg-brand-hover transition-colors disabled:opacity-50 inline-flex items-center gap-2"
                                >
                                    <Check size={16} />
                                    {cropping ? 'Saving Crop...' : 'Use Cropped Logo'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-surface rounded-2xl shadow-sm border border-default overflow-hidden text-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-default">
                        <thead className="bg-page">
                            <tr>
                                <th className="px-6 py-4 text-left font-semibold text-secondary uppercase tracking-wider">Logo</th>
                                <th className="px-6 py-4 text-left font-semibold text-secondary uppercase tracking-wider">Brand Name</th>
                                <th className="px-6 py-4 text-left font-semibold text-secondary uppercase tracking-wider">Description</th>
                                <th className="px-6 py-4 text-center font-semibold text-secondary uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-surface divide-y divide-default">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, idx) => (
                                    <tr key={`brand-skeleton-${idx}`}>
                                        <td className="px-6 py-4"><div className="skeleton h-10 w-10 rounded-lg" /></td>
                                        <td className="px-6 py-4"><div className="skeleton h-4 w-32" /></td>
                                        <td className="px-6 py-4"><div className="skeleton h-4 w-full max-w-sm" /></td>
                                        <td className="px-6 py-4"><div className="skeleton h-8 w-24 mx-auto" /></td>
                                    </tr>
                                ))
                            ) : brands.length === 0 ? (
                                <tr><td colSpan="4" className="text-center py-12 text-secondary">No brands found. Add one above.</td></tr>
                            ) : (
                                brands.map(brand => (
                                    <tr key={brand._id} className="hover:bg-page transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {brand.image ? (
                                                <div className="w-10 h-10 rounded bg-surface border border-default p-1 flex items-center justify-center">
                                                    <img src={brand.image} alt={brand.name} className="max-w-full max-h-full object-contain" />
                                                </div>
                                            ) : (
                                                <div className="w-10 h-10 rounded bg-brand-subtle flex items-center justify-center text-tertiary">
                                                    <ImageIcon size={20} />
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap font-bold text-primary">
                                            {brand.name}
                                        </td>
                                        <td className="px-6 py-4 text-secondary max-w-xs truncate">
                                            {brand.description || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <button
                                                onClick={() => openEditForm(brand)}
                                                className="text-brand hover:brightness-90 p-2 rounded-lg transition-colors mr-2"
                                                title="Edit Brand"
                                            >
                                                <Tag size={18} />
                                            </button>
                                            <button
                                                onClick={() => deleteBrandHandler(brand._id, brand.name)}
                                                className="text-error hover:brightness-90 p-2 rounded-lg transition-colors"
                                                title="Delete Brand"
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

export default BrandManage;
