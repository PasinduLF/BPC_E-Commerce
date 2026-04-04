import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../context/useAuthStore';
import { Plus, Trash2, LayoutList, Layers } from 'lucide-react';

const CategoryManage = () => {
    const { userInfo } = useAuthStore();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showAddForm, setShowAddForm] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryDesc, setNewCategoryDesc] = useState('');

    const [activeCategoryId, setActiveCategoryId] = useState(null);
    const [newSubcategoryName, setNewSubcategoryName] = useState('');

    const fetchCategories = async () => {
        try {
            const { data } = await axios.get('http://localhost:5000/api/categories');
            setCategories(data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const createCategoryHandler = async (e) => {
        e.preventDefault();
        try {
            const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
            await axios.post('http://localhost:5000/api/categories', {
                name: newCategoryName,
                description: newCategoryDesc
            }, config);

            setNewCategoryName('');
            setNewCategoryDesc('');
            setShowAddForm(false);
            fetchCategories();
        } catch (error) {
            alert('Failed to create category');
        }
    };

    const deleteCategoryHandler = async (id, name) => {
        if (window.confirm(`Delete category: ${name}? This may impact products using it.`)) {
            try {
                const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
                await axios.delete(`http://localhost:5000/api/categories/${id}`, config);
                fetchCategories();
            } catch (error) {
                alert('Failed to delete category');
            }
        }
    };

    const addSubcategoryHandler = async (e, categoryId) => {
        e.preventDefault();
        try {
            const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
            await axios.post(`http://localhost:5000/api/categories/${categoryId}/subcategories`, {
                name: newSubcategoryName
            }, config);

            setNewSubcategoryName('');
            setActiveCategoryId(null);
            fetchCategories();
        } catch (error) {
            alert('Failed to add subcategory');
        }
    };

    return (
        <div className="space-y-6">

            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-primary">Categories & Structure</h1>
                    <p className="text-secondary text-sm mt-1">Organize your shop catalog.</p>
                </div>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="btn-primary flex items-center gap-2"
                >
                    {showAddForm ? 'Cancel' : <><Plus size={18} /> New Category</>}
                </button>
            </div>

            {showAddForm && (
                <div className="bg-surface rounded-2xl shadow-sm border border-default p-6 animate-fade-in-up mb-6">
                    <h2 className="text-lg font-bold text-primary mb-4 flex items-center gap-2 border-b border-default pb-4">
                        <LayoutList size={20} className="text-brand" /> Create Root Category
                    </h2>
                    <form onSubmit={createCategoryHandler} className="max-w-xl space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-primary mb-1">Category Name</label>
                            <input
                                type="text" required value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)}
                                placeholder="e.g. Skincare"
                                className="w-full px-4 py-2 border border-default rounded-lg input-focus bg-page text-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-primary mb-1">Description</label>
                            <textarea
                                required value={newCategoryDesc} onChange={(e) => setNewCategoryDesc(e.target.value)}
                                rows="2"
                                className="w-full px-4 py-2 border border-default rounded-lg input-focus bg-page text-primary"
                            ></textarea>
                        </div>
                        <button type="submit" className="px-6 py-2 bg-brand hover:brightness-95 text-white rounded-lg transition-colors font-medium text-sm">
                            Save Category
                        </button>
                    </form>
                </div>
            )}

            {loading ? (
                <div className="text-center py-12 text-secondary">Loading taxonomy...</div>
            ) : categories.length === 0 ? (
                <div className="text-center py-12 bg-surface rounded-2xl border border-default">
                    <Layers size={48} className="mx-auto text-tertiary mb-4" />
                    <h3 className="text-xl font-medium text-primary">No categories found</h3>
                    <p className="text-secondary mt-1">Create your first product category structure.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categories.map((category) => (
                        <div key={category._id} className="bg-surface rounded-2xl shadow-sm border border-default overflow-hidden flex flex-col">

                            <div className="p-6 border-b border-default bg-page/50 relative flex-1">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                                        <Layers size={18} className="text-brand" />
                                        {category.name}
                                    </h3>
                                    <button
                                        onClick={() => deleteCategoryHandler(category._id, category.name)}
                                        className="text-tertiary hover:text-error transition-colors p-1"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                <p className="text-sm text-secondary line-clamp-2">{category.description}</p>
                            </div>

                            <div className="p-4 bg-surface flex-1 min-h-[120px]">
                                <h4 className="text-xs font-semibold text-tertiary uppercase tracking-wider mb-3">Subcategories ({category.subcategories?.length || 0})</h4>
                                <ul className="flex flex-wrap gap-2 mb-4">
                                    {category.subcategories?.map(sub => (
                                        <li key={sub._id} className="bg-page text-primary text-xs px-2.5 py-1 rounded-md border border-default">
                                            {sub.name}
                                        </li>
                                    ))}
                                </ul>

                                {activeCategoryId === category._id ? (
                                    <form onSubmit={(e) => addSubcategoryHandler(e, category._id)} className="flex items-center gap-2 mt-auto">
                                        <input
                                            type="text" required autoFocus
                                            value={newSubcategoryName} onChange={(e) => setNewSubcategoryName(e.target.value)}
                                            placeholder="New subcategory..."
                                            className="w-full px-3 py-1.5 border border-default rounded text-sm bg-page text-primary input-focus"
                                        />
                                        <button type="submit" className="bg-success-bg text-success hover:brightness-95 px-3 py-1.5 rounded text-sm font-medium transition-colors">Add</button>
                                        <button type="button" onClick={() => setActiveCategoryId(null)} className="text-secondary hover:bg-page px-2 py-1.5 rounded text-sm transition-colors">X</button>
                                    </form>
                                ) : (
                                    <button
                                        onClick={() => setActiveCategoryId(category._id)}
                                        className="w-full mt-auto block text-center text-xs font-medium text-brand border border-dashed border-brand-subtle hover:bg-brand-subtle py-2 rounded transition-colors"
                                    >
                                        + Add Subcategory
                                    </button>
                                )}
                            </div>

                        </div>
                    ))}
                </div>
            )}

        </div>
    );
};

export default CategoryManage;
