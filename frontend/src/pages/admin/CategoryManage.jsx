import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../context/useAuthStore';
import { Plus, Trash2, LayoutList, Layers, Edit, ChevronDown, ChevronRight, Home, ArrowLeft } from 'lucide-react';

const CategoryManage = () => {
    const { userInfo } = useAuthStore();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showAddForm, setShowAddForm] = useState(false);
    const [editingCategoryId, setEditingCategoryId] = useState(null); // ID of Category/Sub/Nested currently edited
    
    // Taxonomy Path (Drill Down)
    // [] -> Root categories
    // [{ id, name, type: 'category' }] -> Subcategories of specific Category
    // [{ id, name, type: 'category' }, { id, name, type: 'subcategory' }] -> Nested subcategories of specific Subcategory
    const [navStack, setNavStack] = useState([]);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryDesc, setNewCategoryDesc] = useState('');
    const [newCategoryImage, setNewCategoryImage] = useState('');
    const [selectedImageFile, setSelectedImageFile] = useState(null);

    const [newSubName, setNewSubName] = useState(''); // Quick Add sub/nested name
    const [newSubDesc, setNewSubDesc] = useState('');

    const fetchCategories = async () => {
        try {
            const { data } = await axios.get('/api/categories');
            setCategories(data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    useEffect(() => {
        queueMicrotask(fetchCategories);
    }, []);

    const saveCategoryHandler = async (e) => {
        e.preventDefault();
        try {
            const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
            let imageUrl = newCategoryImage;

            if (selectedImageFile) {
                const formData = new FormData();
                formData.append('image', selectedImageFile);
                const { data } = await axios.post('/api/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                imageUrl = data.url;
            }

            // LEVEL 0: ROOT CATEGORY
            if (navStack.length === 0) {
                if (editingCategoryId) {
                    await axios.put(`/api/categories/${editingCategoryId}`, { name: newCategoryName, description: newCategoryDesc, image: imageUrl }, config);
                } else {
                    await axios.post('/api/categories', { name: newCategoryName, description: newCategoryDesc, image: imageUrl }, config);
                }
            } 
            // LEVEL 1: SUBCATEGORY (Drilled into CATEGORY)
            else if (navStack.length === 1) {
                const catId = navStack[0].id;
                if (editingCategoryId) {
                    await axios.put(`/api/categories/${catId}/subcategories/${editingCategoryId}`, { name: newSubName, description: newSubDesc }, config);
                } else {
                    await axios.post(`/api/categories/${catId}/subcategories`, { name: newSubName, description: newSubDesc }, config);
                }
            } 
            // LEVEL 2: NESTED (Drilled into SUBCATEGORY)
            else if (navStack.length === 2) {
                const catId = navStack[0].id;
                const subcategoryId = navStack[1].id;
                if (editingCategoryId) {
                    await axios.put(
                        `/api/categories/${catId}/subcategories/${subcategoryId}/nested/${editingCategoryId}`,
                        { name: newSubName, description: newSubDesc },
                        config
                    );
                } else {
                    await axios.post(
                        `/api/categories/${catId}/subcategories/${subcategoryId}/nested`,
                        { name: newSubName, description: newSubDesc },
                        config
                    );
                }
            }

            setNewCategoryName('');
            setNewCategoryDesc('');
            setNewSubName('');
            setNewSubDesc('');
            setNewCategoryImage('');
            setSelectedImageFile(null);
            setEditingCategoryId(null);
            setShowAddForm(false);
            fetchCategories();
        } catch {
            alert('Failed to save at this level');
        }
    };

    const openEditForm = (item) => {
        setEditingCategoryId(item._id);
        if (navStack.length === 0) {
            setNewCategoryName(item.name);
            setNewCategoryDesc(item.description || '');
            setNewCategoryImage(item.image || '');
        } else {
            setNewSubName(item.name);
            setNewSubDesc(item.description || '');
        }
        setSelectedImageFile(null);
        setShowAddForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const deleteCategoryHandler = async (id, name) => {
        const type = navStack.length === 0 ? 'root category' : 'subcategory';
        if (window.confirm(`Delete ${type}: ${name}? This may impact products using it.`)) {
            try {
                const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
                if (navStack.length === 0) {
                    await axios.delete(`/api/categories/${id}`, config);
                } else {
                    const catId = navStack[0].id;
                    await axios.delete(`/api/categories/${catId}/subcategories/${id}`, config);
                }
                fetchCategories();
            } catch {
                alert(`Failed to delete ${type}`);
            }
        }
    };

    const pushToStack = (id, name, type) => {
        setEditingCategoryId(null);
        setShowAddForm(false);
        setNavStack([...navStack, { id, name, type }]);
    };

    const popFromStack = (index) => {
        setEditingCategoryId(null);
        setShowAddForm(false);
        setNavStack(navStack.slice(0, index + 1));
    };

    const goBack = () => {
        setEditingCategoryId(null);
        setShowAddForm(false);
        setNavStack(navStack.slice(0, -1));
    };

    const deleteNestedSubcategoryHandler = async (catId, subId, nestedId) => {
        if (!window.confirm('Delete this inner subcategory?')) return;
        try {
            const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
            await axios.delete(`/api/categories/${catId}/subcategories/${subId}/nested/${nestedId}`, config);
            fetchCategories();
        } catch {
            alert('Failed to delete nested subcategory');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header & Breadcrumbs */}
            <div className="bg-surface rounded-2xl shadow-sm border border-default p-4 sm:p-6 mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-bold text-tertiary uppercase tracking-widest mb-2">
                            <button onClick={() => setNavStack([])} className="hover:text-brand transition-colors flex items-center gap-1">
                                <Home size={12} /> Root
                            </button>
                            {navStack.map((item, index) => (
                                <span key={index} className="flex items-center gap-2">
                                    <ChevronRight size={10} />
                                    <button 
                                        onClick={() => popFromStack(index)} 
                                        className={`hover:text-brand transition-colors ${index === navStack.length - 1 ? 'text-brand' : ''}`}
                                    >
                                        {item.name}
                                    </button>
                                </span>
                            ))}
                        </div>
                        <h1 className="text-2xl font-black text-primary">
                            {navStack.length === 0 ? 'Categories & Taxonomy' : navStack[navStack.length - 1].name}
                        </h1>
                        <p className="text-secondary text-sm">
                            {navStack.length === 0 ? 'Manage the high-level departments of your store.' : 
                             navStack.length === 1 ? `Managing sub-groups of ${navStack[0].name}.` : 
                             `Managing individual items of ${navStack[1].name}.`}
                        </p>
                    </div>

                    <div className="flex gap-2">
                        {navStack.length > 0 && (
                            <button onClick={goBack} className="btn-secondary flex items-center gap-2 px-4">
                                <ArrowLeft size={18} /> Back
                            </button>
                        )}
                        <button
                            onClick={() => {
                                setEditingCategoryId(null);
                                setShowAddForm(!showAddForm);
                            }}
                            className={`${showAddForm ? 'bg-error-bg text-error' : 'btn-primary'} flex items-center gap-2 px-4 py-2 rounded-xl transition-all shadow-sm font-bold`}
                        >
                            {showAddForm ? 'Cancel' : <><Plus size={18} /> Add {navStack.length === 0 ? 'Category' : navStack.length === 1 ? 'Subcategory' : 'Inner Item'}</>}
                        </button>
                    </div>
                </div>
            </div>

            {/* Add / Edit Form Section */}
            {showAddForm && (
                <div className="bg-surface rounded-2xl shadow-xl border-2 border-brand/20 p-6 animate-fade-in-up mb-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-full -mr-16 -mt-16"></div>
                    <h2 className="text-lg font-bold text-primary mb-6 flex items-center gap-2 border-b border-default pb-4 relative z-10">
                        <LayoutList size={22} className="text-brand" /> 
                        {editingCategoryId ? 'Modify' : 'Create New'} {navStack.length === 0 ? 'Root Category' : navStack.length === 1 ? 'Subcategory' : 'Inner Property'}
                    </h2>
                    
                    <form onSubmit={saveCategoryHandler} className="max-w-2xl space-y-6 relative z-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-primary mb-2">Display Name</label>
                                <input
                                    type="text" required 
                                    value={navStack.length === 0 ? newCategoryName : newSubName} 
                                    onChange={(e) => navStack.length === 0 ? setNewCategoryName(e.target.value) : setNewSubName(e.target.value)}
                                    placeholder={navStack.length === 0 ? "e.g. Skincare, Makeup" : "e.g. Cleansers, Lipsticks, Matte"}
                                    className="w-full px-4 py-3 border border-default rounded-xl input-focus bg-page text-primary font-medium"
                                />
                            </div>
                            
                            {navStack.length < 2 && (
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-primary mb-2">Detailed Description</label>
                                    <textarea
                                        value={navStack.length === 0 ? newCategoryDesc : newSubDesc} 
                                        onChange={(e) => navStack.length === 0 ? setNewCategoryDesc(e.target.value) : setNewSubDesc(e.target.value)}
                                        rows="3"
                                        placeholder="What kind of products belong here?"
                                        className="w-full px-4 py-3 border border-default rounded-xl input-focus bg-page text-primary"
                                    ></textarea>
                                </div>
                            )}

                            {navStack.length === 0 && (
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-primary mb-2">Mood / Banner Image</label>
                                    <div className="flex items-center gap-6 p-4 bg-page rounded-2xl border border-default">
                                        {(newCategoryImage || selectedImageFile) && (
                                            <div className="w-24 h-24 rounded-xl border-2 border-brand/20 overflow-hidden flex-shrink-0 shadow-inner">
                                                <img src={selectedImageFile ? URL.createObjectURL(selectedImageFile) : newCategoryImage} alt="preview" className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <input
                                                type="file" accept="image/*" onChange={(e) => setSelectedImageFile(e.target.files[0])}
                                                className="w-full text-sm text-secondary file:mr-4 file:py-2.5 file:px-6 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-brand file:text-white hover:file:brightness-110 cursor-pointer"
                                            />
                                            <p className="text-[10px] text-tertiary mt-2 uppercase font-bold tracking-widest">Recommended: 1200x400 JPG/PNG</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-default">
                            <button type="button" onClick={() => setShowAddForm(false)} className="px-6 py-2.5 text-sm font-bold text-secondary hover:text-primary transition-colors">Cancel</button>
                            <button type="submit" className="btn-primary px-8 py-2.5 rounded-xl text-sm font-black shadow-lg shadow-brand/20">
                                {editingCategoryId ? 'Apply Changes' : 'Confirm & Save'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Hierarchical View Content */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, idx) => (
                        <div key={`category-skeleton-${idx}`} className="bg-surface rounded-3xl border border-default overflow-hidden">
                            <div className="skeleton h-32 w-full" />
                            <div className="p-6 space-y-4">
                                <div className="skeleton h-6 w-40" />
                                <div className="skeleton h-4 w-full" />
                                <div className="skeleton h-4 w-5/6" />
                                <div className="skeleton h-10 w-full" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : categories.length === 0 ? (
                <div className="text-center py-20 bg-surface rounded-3xl border-2 border-dashed border-default">
                    <Layers size={64} className="mx-auto text-tertiary/20 mb-6" />
                    <h3 className="text-2xl font-black text-primary">Your Catalog is Empty</h3>
                    <p className="text-secondary mt-2 max-w-sm mx-auto font-medium">Create your first root category to start organizing your professional shop.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {/* LEVEL 0: ROOT CATEGORIES */}
                    {navStack.length === 0 && categories.map((cat) => (
                        <div key={cat._id} className="group bg-surface rounded-3xl shadow-sm hover:shadow-xl border border-default overflow-hidden transition-all duration-500 hover:-translate-y-1">
                            <div className="h-32 bg-brand/5 relative overflow-hidden">
                                {cat.image ? (
                                    <img src={cat.image} alt={cat.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center opacity-10"><Layers size={48} /></div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                <div className="absolute bottom-4 left-6 flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-white border border-white/30">
                                        <Layers size={20} />
                                    </div>
                                    <h3 className="text-xl font-black text-white">{cat.name}</h3>
                                </div>
                            </div>
                            
                            <div className="p-6">
                                <p className="text-secondary text-sm line-clamp-2 mb-6 min-h-[40px] font-medium">{cat.description || "No description provided."}</p>
                                
                                <div className="flex items-center justify-between pt-4 border-t border-default">
                                    <div className="flex gap-1.5">
                                        <button onClick={() => openEditForm(cat)} className="p-2.5 text-secondary hover:text-brand hover:bg-brand-subtle rounded-xl transition-all" title="Edit Properties"><Edit size={18} /></button>
                                        <button onClick={() => deleteCategoryHandler(cat._id, cat.name)} className="p-2.5 text-secondary hover:text-error hover:bg-error-bg rounded-xl transition-all" title="Delete Category"><Trash2 size={18} /></button>
                                    </div>
                                    <button 
                                        onClick={() => pushToStack(cat._id, cat.name, 'category')} 
                                        className="btn-primary flex items-center gap-2 py-2 px-5 rounded-xl font-black text-xs group/btn"
                                    >
                                        Browse Subgroups <ChevronRight size={14} className="transition-transform group-hover/btn:translate-x-1" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* LEVEL 1: SUBCATEGORIES */}
                    {navStack.length === 1 && categories.find(c => c._id === navStack[0].id)?.subcategories?.map((sub) => (
                        <div key={sub._id} className="bg-surface rounded-3xl p-6 border border-default shadow-sm hover:border-brand/40 transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-brand-subtle rounded-2xl flex items-center justify-center text-brand">
                                        <div className="w-2 h-2 rounded-full bg-brand animate-pulse"></div>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-primary">{sub.name}</h3>
                                        <span className="text-[10px] font-black text-tertiary uppercase tracking-widest">{sub.nestedSubcategories?.length || 0} nested items</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => openEditForm(sub)}
                                        className="p-2 text-tertiary hover:text-brand transition-colors"
                                        title="Edit subcategory"
                                    >
                                        <Edit size={18} />
                                    </button>
                                    <button
                                        onClick={() => deleteCategoryHandler(sub._id, sub.name)}
                                        className="p-2 text-tertiary hover:text-error transition-colors"
                                        title="Delete subcategory"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                            <p className="text-sm text-secondary mb-6 font-medium line-clamp-2">{sub.description || "Standard sub-classification."}</p>
                            <button 
                                onClick={() => pushToStack(sub._id, sub.name, 'subcategory')}
                                className="w-full flex items-center justify-center gap-2 bg-page hover:bg-brand hover:text-white border border-default group-hover:border-brand py-3 rounded-2xl transition-all font-bold text-sm"
                            >
                                Manage Items <ChevronRight size={18} />
                            </button>
                        </div>
                    ))}

                    {/* LEVEL 2: NESTED ITEMS */}
                    {navStack.length === 2 && categories.find(c => c._id === navStack[0].id)?.subcategories?.find(s => s._id === navStack[1].id)?.nestedSubcategories?.map((nested) => (
                        <div key={nested._id} className="bg-surface rounded-2xl p-5 border border-default flex items-center justify-between group hover:border-brand/30 transition-all shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="w-8 h-8 rounded-lg bg-page flex items-center justify-center text-tertiary group-hover:text-brand transition-colors border border-default">
                                    <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                                </div>
                                <span className="font-bold text-primary">{nested.name}</span>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                <button
                                    onClick={() => openEditForm(nested)}
                                    className="p-2 text-tertiary hover:text-brand transition-colors"
                                    title="Edit inner item"
                                >
                                    <Edit size={18} />
                                </button>
                                <button
                                    onClick={() => deleteNestedSubcategoryHandler(navStack[0].id, navStack[1].id, nested._id)}
                                    className="p-2 text-tertiary hover:text-error transition-colors"
                                    title="Delete inner item"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CategoryManage;
