import { Link } from 'react-router-dom';
import { Facebook, Instagram, Mail, MessageCircle, Music2, Radio, BookOpen } from 'lucide-react';
import logoImage from '../assets/logo-no-background.png';

const Footer = () => {
    return (
        <footer className="bg-[#1A1A1A] text-gray-100 pt-12 sm:pt-16 pb-8 overflow-hidden">
            <div className="max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 sm:gap-12 text-center md:text-left">

                    <div className="col-span-1 md:col-span-2 flex flex-col items-center md:items-start">
                        <Link to="/" className="inline-block mb-4">
                            <img src={logoImage} alt="Beauty P&C Logo" className="h-12 w-auto object-contain brightness-0 invert" />
                        </Link>
                        <p className="text-gray-400 max-w-sm mb-6">
                            Your ultimate destination for premium cosmetics and beauty products. We bring you the best brands with seamless delivery.
                        </p>
                        <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                            <a
                                href="https://www.facebook.com/beautypanc"
                                target="_blank"
                                rel="noreferrer"
                                aria-label="Facebook"
                                className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-brand hover:text-white transition-all"
                            >
                                <Facebook size={20} />
                            </a>
                            <a
                                href="https://www.instagram.com/beautypandc"
                                target="_blank"
                                rel="noreferrer"
                                aria-label="Instagram"
                                className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-brand hover:text-white transition-all"
                            >
                                <Instagram size={20} />
                            </a>
                            <a
                                href="https://wa.me/94785993262"
                                target="_blank"
                                rel="noreferrer"
                                aria-label="WhatsApp"
                                className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-brand hover:text-white transition-all"
                            >
                                <MessageCircle size={20} />
                            </a>
                            <a
                                href="mailto:beautypandc@gmail.com"
                                aria-label="Email"
                                className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-brand hover:text-white transition-all"
                            >
                                <Mail size={20} />
                            </a>
                        </div>
                        <div className="mt-4 space-y-2 text-sm text-gray-400">
                            <p>
                                <a href="https://www.tiktok.com/@beauty.pc" target="_blank" rel="noreferrer" className="hover:text-brand transition-colors inline-flex items-center gap-2">
                                    <Music2 size={14} />
                                    <span>TikTok: @beauty.pc</span>
                                </a>
                            </p>
                            <div className="flex flex-wrap gap-x-4 gap-y-2">
                                <a href="https://whatsapp.com/channel/0029Vaa30pmJuyAA3qmdJ61V" target="_blank" rel="noreferrer" className="hover:text-brand transition-colors inline-flex items-center gap-2">
                                    <Radio size={14} />
                                    <span>WhatsApp Channel</span>
                                </a>
                                <a href="https://wa.me/c/94785993262" target="_blank" rel="noreferrer" className="hover:text-brand transition-colors inline-flex items-center gap-2">
                                    <BookOpen size={14} />
                                    <span>WhatsApp Catalog</span>
                                </a>
                            </div>
                        </div>
                    </div>

                    <nav aria-label="Shop navigation">
                        <h3 className="text-lg font-semibold mb-4 text-white">Shop</h3>
                        <ul className="space-y-3">
                            <li><Link to="/shop" className="text-gray-400 hover:text-brand transition-colors">All Products</Link></li>
                            <li><Link to="/categories" className="text-gray-400 hover:text-brand transition-colors">Categories</Link></li>
                            <li><Link to="/bundles" className="text-gray-400 hover:text-brand transition-colors">Bundle Deals</Link></li>
                            <li><Link to="/brands" className="text-gray-400 hover:text-brand transition-colors">Brands</Link></li>
                        </ul>
                    </nav>

                    <nav aria-label="Help navigation">
                        <h3 className="text-lg font-semibold mb-4 text-white">Help</h3>
                        <ul className="space-y-3">
                            <li><Link to="/contact" className="text-gray-400 hover:text-brand transition-colors">Contact Us</Link></li>
                            <li><Link to="/about" className="text-gray-400 hover:text-brand transition-colors">About Us</Link></li>
                        </ul>
                    </nav>

                </div>

                <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500 gap-4 text-center md:text-left">
                    <p>&copy; {new Date().getFullYear()} Beauty P&C. All rights reserved.</p>
                    <div className="flex flex-wrap justify-center md:justify-end gap-x-4 gap-y-2 mt-4 md:mt-0">
                        <Link to="/privacy" className="hover:text-brand transition-colors">Privacy Policy</Link>
                        <Link to="/terms" className="hover:text-brand transition-colors">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
