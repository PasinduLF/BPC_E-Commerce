import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowRight, Tag } from 'lucide-react';
import Breadcrumbs from '../components/Breadcrumbs';
import { FALLBACK_BRAND_IMAGE } from '../utils/imageUtils';

const Brands = () => {
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBrands = async () => {
            try {
                const { data } = await axios.get('/api/brands');
                setBrands(data);
            } catch (error) {
                console.error('Failed to load brands:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchBrands();
    }, []);

    return (
        <div className="bg-page min-h-screen py-12 animate-fade-in">
            <div className="max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-6">
                <Breadcrumbs />

                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-black text-primary mb-3">
                            Shop by <span className="text-brand">Brand</span>
                        </h1>
                        <p className="text-base sm:text-lg text-secondary font-medium max-w-2xl">
                            Explore trusted beauty and personal care brands curated for your routine.
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
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
                        {Array.from({ length: 10 }).map((_, i) => (
                            <div key={i} className="bg-surface border border-default rounded-3xl overflow-hidden">
                                <div className="skeleton aspect-[5/4] w-full" />
                                <div className="p-4 space-y-2">
                                    <div className="skeleton h-4 w-3/4 rounded" />
                                    <div className="skeleton h-3 w-full rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : brands.length === 0 ? (
                    <div className="text-center py-20 bg-surface rounded-3xl border border-default">
                        <div className="w-16 h-16 bg-brand-subtle rounded-full flex items-center justify-center mx-auto mb-4">
                            <Tag size={28} className="text-brand" />
                        </div>
                        <h3 className="text-lg font-semibold text-primary">No brands yet</h3>
                        <p className="text-secondary mt-1 text-sm">Check back soon for our brand partners.</p>
                        <Link to="/shop" className="btn-primary inline-flex items-center gap-2 mt-5">
                            Browse All Products <ArrowRight size={16} />
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
                        {brands.map((brand) => (
                            <Link
                                key={brand._id}
                                to={`/shop?brand=${brand._id}`}
                                className="group bg-surface border border-default rounded-3xl overflow-hidden hover:shadow-lg hover:border-brand/30 transition-all duration-200 flex flex-col"
                            >
                                <div className="aspect-[5/4] bg-page flex items-center justify-center p-5 overflow-hidden border-b border-default">
                                    {brand.image && !brand.image.includes('via.placeholder.com') ? (
                                        <img
                                            src={brand.image}
                                            alt={brand.name}
                                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="w-14 h-14 rounded-full bg-brand-subtle flex items-center justify-center">
                                            <span className="text-2xl font-bold text-brand">
                                                {brand.name ? brand.name.charAt(0).toUpperCase() : '?'}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Brand Info */}
                                <div className="p-4 flex flex-col flex-1">
                                    <h3 className="font-semibold text-primary group-hover:text-brand transition-colors text-sm sm:text-base leading-tight">
                                        {brand.name}
                                    </h3>
                                    {brand.description && (
                                        <p className="text-tertiary text-xs mt-1 line-clamp-2 flex-1">
                                            {brand.description}
                                        </p>
                                    )}
                                    <span className="inline-flex items-center gap-1 text-brand text-xs font-medium mt-3 group-hover:gap-2 transition-all">
                                        Shop now <ArrowRight size={11} />
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Brands;
