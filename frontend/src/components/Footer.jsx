import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-slate-900 pt-16 pb-8 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12">

                    <div className="col-span-1 md:col-span-2">
                        <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-rose-300 tracking-tight block mb-4">
                            Beauty P&C
                        </span>
                        <p className="text-slate-400 max-w-sm mb-6">
                            Your ultimate destination for premium cosmetics and beauty products. We bring you the best brands with seamless delivery.
                        </p>
                        <div className="flex space-x-4">
                            <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-pink-600 hover:text-white transition-all">
                                <Facebook size={20} />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-pink-600 hover:text-white transition-all">
                                <Instagram size={20} />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-pink-600 hover:text-white transition-all">
                                <Twitter size={20} />
                            </a>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-white">Shop</h3>
                        <ul className="space-y-3">
                            <li><Link to="/shop" className="text-slate-400 hover:text-pink-400 transition-colors">All Products</Link></li>
                            <li><Link to="/categories" className="text-slate-400 hover:text-pink-400 transition-colors">Categories</Link></li>
                            <li><Link to="/offers" className="text-slate-400 hover:text-pink-400 transition-colors">Special Offers</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-white">Help</h3>
                        <ul className="space-y-3">
                            <li><Link to="/contact" className="text-slate-400 hover:text-pink-400 transition-colors">Contact Us</Link></li>
                            <li><Link to="/shipping" className="text-slate-400 hover:text-pink-400 transition-colors">Shipping Info</Link></li>
                            <li><Link to="/faq" className="text-slate-400 hover:text-pink-400 transition-colors">FAQ</Link></li>
                        </ul>
                    </div>

                </div>

                <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-slate-500">
                    <p>&copy; {new Date().getFullYear()} Beauty P&C. All rights reserved.</p>
                    <div className="flex space-x-4 mt-4 md:mt-0">
                        <Link to="/privacy" className="hover:text-pink-400 transition-colors">Privacy Policy</Link>
                        <Link to="/terms" className="hover:text-pink-400 transition-colors">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
