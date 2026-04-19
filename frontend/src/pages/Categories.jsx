import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowRight, Layers } from 'lucide-react';
import Breadcrumbs from '../components/Breadcrumbs';

const Categories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const { data } = await axios.get('/api/categories');
                setCategories(Array.isArray(data) ? data : []);
                setError('');
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load categories');
            } finally {
                setLoading(false);
            }
        };

        fetchCategories();
    }, []);

    return (
        <div className="bg-page min-h-screen py-12">
            <div className="max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-6">
                <Breadcrumbs />

                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-primary mb-3">Explore Categories</h1>
                        <p className="text-secondary font-medium">
                            Browse all product categories and jump directly into the collection you want.
                        </p>
                    </div>
                    <Link
                        to="/shop"
                        className="inline-flex items-center gap-2 text-brand font-bold hover:brightness-90 transition-colors"
                    >
                        View All Products <ArrowRight size={18} />
                    </Link>
                </div>

                {loading ? (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                        {Array.from({ length: 8 }).map((_, idx) => (
                            <div key={idx} className="aspect-[4/5] rounded-3xl bg-muted animate-pulse" />
                        ))}
                    </div>
                ) : error ? (
                    <div className="rounded-2xl border border-error/30 bg-error-bg text-error p-6">{error}</div>
                ) : categories.length === 0 ? (
                    <div className="rounded-2xl border border-default bg-surface p-10 text-center">
                        <Layers size={32} className="mx-auto text-tertiary mb-3" />
                        <p className="text-secondary">No categories available yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                        {categories.map((cat) => (
                            <Link
                                key={cat._id}
                                to={`/shop?category=${cat._id}`}
                                className="group relative rounded-3xl overflow-hidden aspect-[4/5] bg-muted flex flex-col justify-end"
                            >
                                {cat.image && (
                                    <img
                                        src={typeof cat.image === 'string' ? cat.image : cat.image.url}
                                        alt={cat.name}
                                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                    />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent opacity-85 group-hover:opacity-100 transition-opacity" />
                                <div className="relative z-10 p-5 w-full text-center">
                                    <h2 className="text-surface font-bold text-lg leading-tight mb-1 group-hover:-translate-y-1 transition-transform">
                                        {cat.name}
                                    </h2>
                                    <p className="text-surface/90 text-xs">
                                        {(cat.subcategories || []).length} subcategories
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Categories;
