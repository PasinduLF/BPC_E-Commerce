import { ShieldCheck, Truck, Sparkles, Heart } from 'lucide-react';
import { useConfigStore } from '../context/useConfigStore';

const About = () => {
    const { config } = useConfigStore();

    const features = [
        {
            icon: <Sparkles size={24} />,
            title: "Premium Quality",
            description: "We source only the finest cosmetic ingredients to ensure the highest quality products for your skin."
        },
        {
            icon: <Heart size={24} />,
            title: "Cruelty Free",
            description: "100% of our products are completely cruelty-free. We believe in beauty without harm."
        },
        {
            icon: <ShieldCheck size={24} />,
            title: "Dermatologist Tested",
            description: "All our ranges undergo rigorous testing to ensure they are safe and effective for all skin types."
        },
        {
            icon: <Truck size={24} />,
            title: "Fast Shipping",
            description: "We offer expedited shipping options to ensure your favorite products reach you precisely when you need them."
        }
    ];

    return (
        <div className="bg-page min-h-screen">
            {/* Hero Section */}
            <div className="relative py-24 sm:py-32 overflow-hidden bg-brand-subtle animate-fade-in">
                <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-[600px] h-[600px] rounded-full bg-brand opacity-10 blur-3xl mix-blend-multiply pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-[400px] h-[400px] rounded-full bg-brand opacity-10 blur-3xl mix-blend-multiply pointer-events-none"></div>
                
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <h1 className="text-4xl md:text-6xl font-black text-primary tracking-tight mb-6">
                        About <span className="bg-gradient-to-r from-brand to-brand-hover bg-clip-text text-transparent">{config?.businessName || 'Beauty P&C'}</span>
                    </h1>
                    <p className="text-xl text-secondary max-w-2xl mx-auto leading-relaxed">
                        Empowering beauty, confidence, and self-expression through premium, sustainable cosmetics carefully curated for you.
                    </p>
                </div>
            </div>

            {/* Our Story Section */}
            <div className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 animate-slide-up">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                    <div>
                        <div className="w-full aspect-square md:aspect-auto md:h-[500px] bg-gradient-to-tr from-brand-subtle to-surface border border-default rounded-3xl overflow-hidden relative shadow-lg">
                            {/* Placeholder for a beautiful brand image */}
                            <div className="absolute inset-0 bg-brand/5 backdrop-blur-sm flex items-center justify-center">
                                <Sparkles size={48} className="text-brand opacity-50" />
                            </div>
                        </div>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-brand tracking-widest uppercase mb-3">Our Story</h2>
                        <h3 className="text-3xl md:text-4xl font-black text-primary mb-6 leading-tight">
                            Redefining Modern Beauty Standards
                        </h3>
                        <div className="space-y-4 text-secondary text-lg leading-relaxed">
                            <p>
                                Founded with a passion for transformative cosmetics, {config?.businessName || 'Beauty P&C'} was born from a simple idea: everyone deserves access to high-quality, ethical beauty products that actually work.
                            </p>
                            <p>
                                We spent years researching formulations and sourcing sustainable ingredients from around the globe. Our commitment goes beyond makeup—we aim to celebrate individuality and inspire confidence in your daily routine.
                            </p>
                            <p>
                                Welcome to our community. We're thrilled to be part of your beauty journey.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Why Choose Us */}
            <div className="bg-surface border-y border-default py-20 animate-slide-up-delayed-1">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-black text-primary mb-4">The Beauty P&C Difference</h2>
                        <p className="text-secondary max-w-2xl mx-auto">
                            We don't just sell cosmetics; we provide a promise of quality, integrity, and exceptional care.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {features.map((feature, index) => (
                            <div key={index} className="bg-page border border-default rounded-3xl p-8 hover:-translate-y-2 transition-transform duration-300 hover:shadow-xl hover:shadow-brand-subtle">
                                <div className="w-14 h-14 bg-brand-subtle text-brand rounded-2xl flex items-center justify-center mb-6">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold text-primary mb-3">{feature.title}</h3>
                                <p className="text-secondary leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default About;
