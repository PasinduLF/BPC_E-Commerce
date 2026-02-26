import { Link } from 'react-router-dom';
import { ArrowRight, Star, ShoppingBag } from 'lucide-react';
import { useConfigStore } from '../context/useConfigStore';

const Home = () => {
    const { config } = useConfigStore();
    const currency = config?.currencySymbol || '$';
    return (
        <div className="flex flex-col min-h-screen">

            {/* Hero Section */}
            <section className="relative bg-pink-50 overflow-hidden pt-12 pb-24 sm:pt-24 lg:pb-32">
                <div className="absolute inset-0">
                    {/* Background decorative elements */}
                    <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-pink-200 to-rose-100 opacity-50 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-pink-300 to-pink-100 opacity-40 blur-3xl"></div>
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:text-left">
                    <div className="lg:grid lg:grid-cols-2 lg:gap-8 items-center">

                        <div className="mb-12 lg:mb-0 z-10 relative">
                            <span className="inline-block py-1 px-3 rounded-full bg-pink-100 text-pink-700 text-sm font-semibold tracking-wider mb-6">
                                NEW COLLECTION 2026
                            </span>
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6">
                                Discover Your <br className="hidden sm:block" />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-400">
                                    True Radiance
                                </span>
                            </h1>
                            <p className="mt-4 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto sm:mx-0 mb-8">
                                Premium cosmetics curated for your skin. Experience the perfect blend of natural ingredients and modern beauty science.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center sm:justify-start">
                                <Link to="/shop" className="btn-primary flex items-center justify-center gap-2 text-lg">
                                    Shop Now <ArrowRight size={20} />
                                </Link>
                                <Link to="/categories" className="bg-white text-slate-700 hover:text-pink-600 border border-slate-200 font-medium py-3 px-6 rounded-lg hover:border-pink-300 transition-all shadow-sm flex items-center justify-center text-lg">
                                    Explore Categories
                                </Link>
                            </div>
                        </div>

                        <div className="relative z-10 hidden lg:block">
                            {/* Placeholder for Hero Image - In a real app we'd use a Cloudinary URL */}
                            <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-[4/3] bg-gradient-to-br from-pink-100 to-white flex items-center justify-center">
                                <div className="absolute inset-0 bg-pink-900/5 mix-blend-multiply"></div>
                                <div className="text-center text-pink-400 font-medium">
                                    <span className="block text-4xl mb-4">✨</span>
                                    Hero Product Showcase
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* Featured Products Section */}
            <section className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">Trending Now</h2>
                        <div className="w-24 h-1 bg-pink-500 mx-auto rounded-full"></div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {/* Product Cards Placeholder */}
                        {[1, 2, 3, 4].map((item) => (
                            <div key={item} className="group relative bg-white border border-slate-100 rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-pink-100 transition-all duration-300 transform hover:-translate-y-1">
                                <div className="aspect-square bg-slate-50 relative p-6 flex flex-col items-center justify-center overflow-hidden">
                                    {/* Placeholder image representation */}
                                    <div className="w-32 h-32 rounded-full bg-pink-100 opacity-50 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 group-hover:scale-110 transition-transform duration-500"></div>
                                    <span className="relative z-10 text-pink-300 text-sm font-medium border border-pink-200 rounded px-2 py-1 bg-white">Product {item} Mock</span>

                                    <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold text-pink-600">
                                        New
                                    </div>
                                </div>
                                <div className="p-5">
                                    <div className="flex items-center gap-1 text-yellow-400 mb-2">
                                        <Star size={16} fill="currentColor" />
                                        <Star size={16} fill="currentColor" />
                                        <Star size={16} fill="currentColor" />
                                        <Star size={16} fill="currentColor" />
                                        <Star size={16} fill="currentColor" className="text-slate-200" />
                                        <span className="text-slate-400 text-xs ml-1">(24)</span>
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-800 mb-1">Radiant Glow Serum</h3>
                                    <p className="text-sm text-slate-500 mb-4 capitalize">Skincare</p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xl font-bold text-slate-900">$45.00</span>
                                        <button className="bg-pink-50 hover:bg-pink-100 text-pink-600 p-2 rounded-full transition-colors hidden sm:block">
                                            <ShoppingBag size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Banner */}
            <section className="bg-pink-600 py-16 text-white overflow-hidden relative">
                <div className="absolute inset-0 opacity-10 pattern-dots"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-pink-500">
                        <div className="p-4">
                            <h4 className="text-xl font-bold mb-2">Premium Quality</h4>
                            <p className="text-pink-100 text-sm">Sourced from the finest ingredients</p>
                        </div>
                        <div className="p-4">
                            <h4 className="text-xl font-bold mb-2">Free Delivery</h4>
                            <p className="text-pink-100 text-sm">
                                {config?.freeShippingThreshold > 0
                                    ? `On orders over ${currency}${config.freeShippingThreshold}`
                                    : `Standard shipping applies`}
                            </p>
                        </div>
                        <div className="p-4">
                            <h4 className="text-xl font-bold mb-2">Secure Payments</h4>
                            <p className="text-pink-100 text-sm">100% safe & protected checkouts</p>
                        </div>
                    </div>
                </div>
            </section>

        </div>
    );
};

export default Home;
