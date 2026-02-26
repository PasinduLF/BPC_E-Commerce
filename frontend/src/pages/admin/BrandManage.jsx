import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../context/useAuthStore';
import { Tag, Plus, Trash2, Image as ImageIcon } from 'lucide-react';

const BrandManage = () => {
    const { userInfo } = useAuthStore();
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);

    // Form states
    const [showAddForm, setShowAddForm] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    const fetchBrands = async () => {
        try {
            setLoading(true);
            const { data } = await axios.get('http://localhost:5000/api/brands');
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

    const createBrandHandler = async (e) => {
        e.preventDefault();
        try {
            setUploading(true);
            const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };

            let imageUrl = '';
            if (imageFile) {
                const formData = new FormData();
                formData.append('image', imageFile);
                const uploadRes = await axios.post('http://localhost:5000/api/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                imageUrl = uploadRes.data.url;
            }

            await axios.post('http://localhost:5000/api/brands', {
                name,
                description,
                image: imageUrl
            }, config);

            // Reset form
            setName('');
            setDescription('');
            setImageFile(null);
            setShowAddForm(false);
            fetchBrands();
            setUploading(false);
        } catch (error) {
            setUploading(false);
            alert(error.response?.data?.message || 'Failed to create brand');
        }
    };

    const deleteBrandHandler = async (id, brandName) => {
        if (window.confirm(`Are you sure you want to delete brand "${brandName}"?`)) {
            try {
                const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
                await axios.delete(`http://localhost:5000/api/brands/${id}`, config);
                fetchBrands();
            } catch (error) {
                alert(error.response?.data?.message || 'Failed to delete brand. It might be assigned to products.');
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Brand Management</h1>
                    <p className="text-slate-500 text-sm mt-1">Manage cosmetic brands available in the store.</p>
                </div>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="btn-primary flex items-center gap-2"
                >
                    {showAddForm ? 'Cancel' : <><Plus size={18} /> Add Brand</>}
                </button>
            </div>

            {showAddForm && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8 animate-fade-in-up mb-8">
                    <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
                        <Tag size={20} className="text-pink-500" /> New Brand
                    </h2>

                    <form onSubmit={createBrandHandler} className="space-y-6 max-w-2xl">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Brand Name</label>
                            <input
                                type="text" required value={name} onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg input-focus bg-slate-50"
                                placeholder="e.g. L'Oreal Paris"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Description (Optional)</label>
                            <textarea
                                value={description} onChange={(e) => setDescription(e.target.value)}
                                rows="3"
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg input-focus bg-slate-50"
                            ></textarea>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Brand Logo (Optional)</label>
                            <input
                                type="file" accept="image/*"
                                onChange={(e) => setImageFile(e.target.files[0])}
                                className="w-full px-3 py-2 border border-slate-200 rounded text-sm bg-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100"
                            />
                        </div>

                        <div className="pt-4 flex gap-3">
                            <button type="submit" disabled={uploading} className="flex-1 flex justify-center items-center gap-2 px-6 py-2.5 bg-pink-600 hover:bg-pink-700 text-white font-medium rounded-lg shadow-sm transition-colors disabled:opacity-50">
                                {uploading ? 'Processing...' : 'Save Brand'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden text-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-4 text-left font-semibold text-slate-600 uppercase tracking-wider">Logo</th>
                                <th className="px-6 py-4 text-left font-semibold text-slate-600 uppercase tracking-wider">Brand Name</th>
                                <th className="px-6 py-4 text-left font-semibold text-slate-600 uppercase tracking-wider">Description</th>
                                <th className="px-6 py-4 text-center font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan="4" className="text-center py-8 text-slate-500">Loading brands...</td></tr>
                            ) : brands.length === 0 ? (
                                <tr><td colSpan="4" className="text-center py-12 text-slate-500">No brands found. Add one above.</td></tr>
                            ) : (
                                brands.map(brand => (
                                    <tr key={brand._id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {brand.image ? (
                                                <div className="w-10 h-10 rounded bg-white border border-slate-200 p-1 flex items-center justify-center">
                                                    <img src={brand.image} alt={brand.name} className="max-w-full max-h-full object-contain" />
                                                </div>
                                            ) : (
                                                <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center text-slate-400">
                                                    <ImageIcon size={20} />
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-800">
                                            {brand.name}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 max-w-xs truncate">
                                            {brand.description || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <button
                                                onClick={() => deleteBrandHandler(brand._id, brand.name)}
                                                className="text-rose-400 hover:text-rose-600 p-2 rounded-lg transition-colors"
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
