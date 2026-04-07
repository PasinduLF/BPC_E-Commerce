import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Search, ShoppingBag, User, Menu, X, LogOut, ChevronDown, Heart, Package, Sun, Moon, Sparkles, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../context/useAuthStore';
import { useCartStore } from '../context/useCartStore';
import { useWishlistStore } from '../context/useWishlistStore';
import { useConfigStore } from '../context/useConfigStore';
import { useTheme } from '../context/ThemeContext';
import logoImage from '../assets/logo-color.png';
import BottomMobileNav from './BottomMobileNav';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false); // Mobile Drawer
    const [dropdownOpen, setDropdownOpen] = useState(false); // User Profile
    const [searchQuery, setSearchQuery] = useState('');
    const [isScrolled, setIsScrolled] = useState(false);
    
    // Mega Menu State
    const [categories, setCategories] = useState([]);
    const [activeMegaMenu, setActiveMegaMenu] = useState(null);
    const [hoveredSubId, setHoveredSubId] = useState(null); // Level 2 Hover state
    const [expandedCategory, setExpandedCategory] = useState(null); // For Mobile Accordion

    const { userInfo, logout } = useAuthStore();
    const { cartItems } = useCartStore();
    const { wishlistItems } = useWishlistStore();
    const { config } = useConfigStore();
    const { isDark, toggleMode } = useTheme();
    const navigate = useNavigate();

    // Fetch Categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const { data } = await axios.get('/api/categories');
                setCategories(data);
            } catch (error) {
                console.error('Failed to load categories for nav', error);
            }
        };
        fetchCategories();
    }, []);

    // Scroll listener for sticky state formatting
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const logoutHandler = () => {
        logout();
        navigate('/login');
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
            setSearchQuery('');
            setIsOpen(false);
        }
    };

    return (
        <header className="relative w-full z-50">
            {/* Tier 1: Announcement Bar (Desktop Only) */}
            <div className="hidden md:block bg-primary text-surface text-xs font-medium py-1.5 px-4 z-50 relative">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Sparkles size={12} className="text-brand" />
                        <span>Free delivery on orders over {config?.currencySymbol || '$'}5,000</span>
                    </div>
                    <div className="flex gap-6">
                        <Link to={userInfo ? "/my-orders" : "/login"} className="hover:text-brand transition-colors">Track Order</Link>
                        <Link to="/contact" className="hover:text-brand transition-colors">Help & Contact</Link>
                    </div>
                </div>
            </div>

            {/* Tier 2: Main Navigation Bar */}
            <nav className={`sticky top-0 w-full transition-all duration-300 ${isScrolled ? 'desktop-nav-scrolled' : 'bg-surface/80 backdrop-blur-md border-b border-default shadow-sm'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16 sm:h-20">

                        {/* Mobile left side (Hamburger) */}
                        <div className="flex items-center gap-3 md:hidden">
                            <button
                                onClick={() => setIsOpen(true)}
                                className="inline-flex items-center justify-center p-2 rounded-lg text-secondary hover:text-brand hover:bg-brand-subtle transition-colors focus:outline-none"
                            >
                                <Menu size={24} />
                            </button>
                        </div>

                        {/* Logo & Brand (Center on mobile, Left on desktop) */}
                        <div className="flex items-center flex-1 md:flex-none justify-center md:justify-start">
                            <Link to="/" className="flex items-center gap-2 group">
                                <span className="md:hidden text-lg font-black text-primary tracking-tight">
                                    Beauty P&C
                                </span>
                                <img src={logoImage} alt="Beauty P&C Logo" className="hidden md:block h-8 sm:h-10 w-auto object-contain transition-transform group-hover:scale-105" />
                                <span className="text-xl sm:text-2xl font-black text-primary tracking-tight ml-1 hidden md:block">
                                    {config?.businessName || 'Beauty P&C'}
                                </span>
                            </Link>
                        </div>

                        {/* Desktop Mega Menu Categories */}
                        <div className="hidden md:flex items-center justify-center flex-1 px-8">
                            <div className="flex space-x-6 h-full items-center">
                                {categories.slice(0, 5).map(category => (
                                    <div 
                                        key={category._id} 
                                        className="relative h-20 flex items-center group"
                                        onMouseEnter={() => setActiveMegaMenu(category._id)}
                                        onMouseLeave={() => setActiveMegaMenu(null)}
                                    >
                                        <Link to={`/shop?category=${category._id}`} className="nav-link text-sm uppercase tracking-wider">
                                            {category.name}
                                        </Link>
                                        
                                        {/* Dropdown Panel */}
                                        {activeMegaMenu === category._id && category.subcategories?.length > 0 && (
                                            <div className="absolute left-1/2 -translate-x-1/2 top-20 w-max min-w-[700px] max-w-5xl bg-surface border border-default shadow-2xl mega-menu-animate rounded-2xl overflow-hidden cursor-default pointer-events-auto flex">
                                                
                                                {/* Left Sidebar: Subcategories */}
                                                <div className="w-1/3 bg-subtle border-r border-default p-4 space-y-1">
                                                    <h3 className="text-[10px] font-black uppercase text-tertiary tracking-widest px-3 mb-3">Browse {category.name}</h3>
                                                    {category.subcategories.map(sub => (
                                                        <Link 
                                                            key={sub._id}
                                                            to={`/shop?category=${category._id}&subcategory=${sub._id}`}
                                                            onMouseEnter={() => setHoveredSubId(sub._id)}
                                                            className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all group/sub ${hoveredSubId === sub._id ? 'bg-surface text-brand shadow-sm font-bold' : 'text-secondary hover:bg-surface/50'}`}
                                                        >
                                                            <span>{sub.name}</span>
                                                            <ChevronRight size={14} className={`transition-transform ${hoveredSubId === sub._id ? 'translate-x-1' : 'opacity-0 group-hover/sub:opacity-100'}`} />
                                                        </Link>
                                                    ))}
                                                </div>

                                                {/* Right Content: Inner Items */}
                                                <div className="flex-1 p-8 min-w-[400px]">
                                                    {category.subcategories.find(s => s._id === (hoveredSubId || category.subcategories[0]._id))?.nestedSubcategories?.length > 0 ? (
                                                        <div className="animate-fade-in">
                                                            <div className="flex items-center justify-between mb-6 border-b border-default pb-4">
                                                                <h4 className="text-xl font-black text-primary">
                                                                    {category.subcategories.find(s => s._id === (hoveredSubId || category.subcategories[0]._id))?.name}
                                                                </h4>
                                                                <Link 
                                                                    to={`/shop?category=${category._id}&subcategory=${hoveredSubId || category.subcategories[0]._id}`}
                                                                    className="text-xs font-bold text-brand hover:underline"
                                                                >
                                                                    View All
                                                                </Link>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                                                                {category.subcategories.find(s => s._id === (hoveredSubId || category.subcategories[0]._id))?.nestedSubcategories.map((nested, nIdx) => (
                                                                    <Link 
                                                                        key={nested._id || nIdx}
                                                                        to={`/shop?category=${category._id}&subcategory=${hoveredSubId || category.subcategories[0]._id}&innerSubcategory=${nested._id}`}
                                                                        className="text-sm text-secondary hover:text-brand transition-colors flex items-center gap-2 group/item"
                                                                    >
                                                                        <div className="w-1.5 h-1.5 rounded-full bg-brand/30 group-hover/item:bg-brand transition-colors"></div>
                                                                        {nested.name}
                                                                    </Link>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="h-full flex flex-col items-center justify-center text-center py-12 opacity-40">
                                                            <Sparkles size={48} className="mb-4 text-tertiary" />
                                                            <p className="font-bold text-secondary">Discover our premium range</p>
                                                            <p className="text-sm">Explore specialized products for {category.subcategories.find(s => s._id === (hoveredSubId || category.subcategories[0]._id))?.name}.</p>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Optional Promo Panel (Hidden for sidebar menu to keep width manageable, or made wider) */}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Desktop User Actions */}
                        <div className="hidden md:flex items-center space-x-5">
                            <form onSubmit={handleSearch} className="relative group flex items-center">
                                <input 
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search..."
                                    className="w-0 opacity-0 group-hover:w-48 group-hover:opacity-100 focus:w-48 focus:opacity-100 transition-all duration-300 ease-out border-b border-default focus:border-brand bg-transparent py-1 px-2 text-sm text-primary placeholder-tertiary outline-none"
                                />
                                <button type="submit" className="text-secondary hover:text-brand transition-colors z-10 p-1">
                                    <Search size={20} />
                                </button>
                            </form>

                            <button 
                                onClick={toggleMode} 
                                className="text-secondary hover:text-brand p-1.5 rounded-full hover:bg-subtle focus:outline-none transition-colors"
                            >
                                {isDark ? <Sun size={18} /> : <Moon size={18} />}
                            </button>

                            {userInfo ? (
                                <div className="relative">
                                    <button
                                        onClick={() => setDropdownOpen(!dropdownOpen)}
                                        className="flex items-center gap-1.5 text-secondary hover:text-brand transition-colors font-medium focus:outline-none"
                                    >
                                        <User size={20} />
                                        <span className="max-w-[80px] truncate text-sm">{userInfo.name}</span>
                                        <ChevronDown size={14} />
                                    </button>

                                    {dropdownOpen && (
                                        <div className="absolute right-0 mt-3 w-48 bg-surface rounded-xl shadow-xl border border-default py-2 z-50 dropdown-animate origin-top-right">
                                            <div className="px-4 py-2 border-b border-default mb-2">
                                                <p className="text-xs text-tertiary font-bold uppercase tracking-wider">Account</p>
                                                <p className="text-sm font-bold text-primary truncate">{userInfo.email}</p>
                                            </div>
                                            <Link to="/profile" className="px-4 py-2 text-sm text-secondary hover:bg-subtle hover:text-brand transition-colors flex items-center gap-2" onClick={() => setDropdownOpen(false)}>
                                                <User size={16} /> My Profile
                                            </Link>
                                            <Link to="/my-orders" className="px-4 py-2 text-sm text-secondary hover:bg-subtle hover:text-brand transition-colors flex items-center gap-2" onClick={() => setDropdownOpen(false)}>
                                                <Package size={16} /> My Orders
                                            </Link>
                                            <Link to="/wishlist" className="px-4 py-2 text-sm text-secondary hover:bg-subtle hover:text-brand transition-colors flex items-center gap-2" onClick={() => setDropdownOpen(false)}>
                                                <Heart size={16} /> Wishlist
                                            </Link>
                                            {userInfo.role === 'admin' && (
                                                <Link to="/admin/dashboard" className="px-4 py-2 text-sm text-primary font-medium hover:bg-subtle hover:text-brand transition-colors flex items-center gap-2" onClick={() => setDropdownOpen(false)}>
                                                    <Sparkles size={16} className="text-brand"/> Admin Panel
                                                </Link>
                                            )}
                                            <button onClick={() => { logoutHandler(); setDropdownOpen(false); }} className="w-full text-left px-4 py-2 mt-2 border-t border-default text-sm text-error hover:bg-error-bg transition-colors flex items-center gap-2">
                                                <LogOut size={16} /> Logout
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <Link to="/login" className="text-secondary hover:text-brand transition-colors p-1">
                                    <User size={20} />
                                </Link>
                            )}

                            <Link to="/wishlist" className="relative text-secondary hover:text-brand transition-colors group p-1">
                                <Heart size={20} />
                                {wishlistItems.length > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-brand text-on-brand text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                                        {wishlistItems.length}
                                    </span>
                                )}
                            </Link>

                            <Link to="/cart" className="relative text-secondary hover:text-brand transition-colors group p-1">
                                <ShoppingBag size={20} />
                                {cartItems.length > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-brand text-on-brand text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                                        {cartItems.reduce((a, c) => a + c.qty, 0)}
                                    </span>
                                )}
                            </Link>
                        </div>

                        {/* Mobile right side (Theme Toggle) */}
                        <div className="flex items-center gap-3 md:hidden">
                            <button
                                onClick={toggleMode}
                                className="text-secondary hover:text-brand p-1.5 rounded-lg focus:outline-none transition-colors"
                                aria-label="Toggle dark mode"
                            >
                                {isDark ? <Sun size={22} /> : <Moon size={22} />}
                            </button>
                        </div>

                    </div>
                </div>
            </nav>

            {/* Mobile Nav Overlay & Drawer */}
            {isOpen && (
                <div className="md:hidden z-50 fixed inset-0">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm mobile-drawer-overlay-animate" onClick={() => setIsOpen(false)}></div>
                    <div className="absolute inset-y-0 left-0 w-4/5 max-w-sm bg-surface shadow-2xl mobile-drawer-animate flex flex-col">
                        
                        {/* Drawer Header */}
                        <div className="p-5 border-b border-default flex items-center justify-between bg-subtle">
                            <div className="flex items-center gap-2">
                                <img src={logoImage} alt="Logo" className="h-8 w-auto object-contain" />
                                <span className="text-lg font-black text-primary tracking-tight">Menu</span>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="text-secondary hover:bg-surface p-1.5 rounded-full transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Search in Drawer */}
                        <div className="p-4 border-b border-default">
                            <form onSubmit={handleSearch} className="relative">
                                <input 
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search for products..."
                                    className="w-full bg-muted border border-default rounded-xl py-3 pl-10 pr-4 text-primary text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all"
                                />
                                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" />
                            </form>
                        </div>

                        {/* Drawer Links */}
                        <div className="flex-1 overflow-y-auto py-2">
                            {categories.map((category) => (
                                <div key={category._id} className="border-b border-default px-2">
                                    <div 
                                        className="flex items-center justify-between p-3 rounded-lg flex-1 cursor-pointer"
                                        onClick={() => setExpandedCategory(expandedCategory === category._id ? null : category._id)}
                                    >
                                        <span className="font-bold text-primary group-hover:text-brand transition-colors">{category.name}</span>
                                        <ChevronDown size={18} className={`text-secondary transition-transform ${expandedCategory === category._id ? 'rotate-180 text-brand' : ''}`} />
                                    </div>
                                    
                                    {/* Mobile Subcategories Accordion */}
                                    {expandedCategory === category._id && category.subcategories?.length > 0 && (
                                        <div className="pl-6 pb-3 pr-3 space-y-4">
                                            {category.subcategories.map(sub => (
                                                <div key={sub._id}>
                                                    <p className="text-xs font-black uppercase text-tertiary tracking-wider mb-2">{sub.name}</p>
                                                    <ul className="space-y-2 border-l-2 border-muted pl-3">
                                                        {sub.nestedSubcategories?.map((nested, nIdx) => (
                                                            <li key={nested._id || nIdx}>
                                                                <Link 
                                                                    to={`/shop?category=${category._id}&subcategory=${sub._id}&innerSubcategory=${nested._id}`} 
                                                                    className="text-sm font-medium text-secondary py-1 block hover:text-brand transition-colors"
                                                                    onClick={() => setIsOpen(false)}
                                                                >
                                                                    {nested.name}
                                                                </Link>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            ))}
                                            <Link 
                                                to={`/shop?category=${category._id}`}
                                                className="mt-4 flex items-center justify-between text-brand text-sm font-bold bg-brand-subtle px-4 py-2 rounded-lg"
                                                onClick={() => setIsOpen(false)}
                                            >
                                                View all {category.name} <ChevronRight size={16} />
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            ))}

                            <Link to="/about" className="block px-5 py-4 font-bold text-primary border-b border-default hover:bg-subtle" onClick={() => setIsOpen(false)}>About Us</Link>
                        </div>

                        {/* Drawer Footer / User */}
                        <div className="p-4 bg-page border-t border-default pb-safe">
                            {userInfo ? (
                                <div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 bg-brand-subtle rounded-full flex flex-col items-center justify-center text-brand font-bold">
                                            {userInfo.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-primary">{userInfo.name}</p>
                                            <p className="text-xs text-tertiary">{userInfo.email}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 mb-3">
                                        <Link to="/profile" className="bg-surface border border-default rounded-lg py-2 text-center text-sm font-medium hover:border-brand" onClick={() => setIsOpen(false)}>Profile</Link>
                                        <Link to="/my-orders" className="bg-surface border border-default rounded-lg py-2 text-center text-sm font-medium hover:border-brand" onClick={() => setIsOpen(false)}>Orders</Link>
                                    </div>
                                    {userInfo.role === 'admin' && (
                                        <Link to="/admin/dashboard" className="block w-full bg-primary text-surface rounded-lg py-2.5 text-center text-sm font-bold mb-3" onClick={() => setIsOpen(false)}>Admin Dashboard</Link>
                                    )}
                                    <button onClick={() => { logoutHandler(); setIsOpen(false); }} className="w-full flex items-center justify-center gap-2 text-error text-sm font-bold py-2 hover:bg-error-bg rounded-lg transition-colors">
                                        <LogOut size={16} /> Logout
                                    </button>
                                </div>
                            ) : (
                                <Link to="/login" className="btn-primary block w-full text-center py-3 text-sm" onClick={() => setIsOpen(false)}>
                                    Sign In / Register
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Bottom Mobile Navigation (Thumb friendly bar) */}
            <BottomMobileNav />
        </header>
    );
};

export default Navbar;
