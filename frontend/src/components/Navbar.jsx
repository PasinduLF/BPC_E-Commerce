import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, User, Menu, X, LogOut, ChevronDown, Heart, Package, Sun, Moon } from 'lucide-react';
import { useAuthStore } from '../context/useAuthStore';
import { useCartStore } from '../context/useCartStore';
import { useWishlistStore } from '../context/useWishlistStore';
import { useConfigStore } from '../context/useConfigStore';
import { useTheme } from '../context/ThemeContext';
import logoImage from '../assets/logo-color.png';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const { userInfo, logout } = useAuthStore();
    const { cartItems } = useCartStore();
    const { wishlistItems } = useWishlistStore();
    const { config } = useConfigStore();
    const { isDark, toggleMode } = useTheme();
    const navigate = useNavigate();

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
        <nav className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-default shadow-sm transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 sm:h-20">

                    {/* Logo & Brand */}
                    <div className="flex items-center">
                        <Link to="/" className="flex items-center gap-2 group">
                            <img src={logoImage} alt="Beauty P&C Logo" className="h-10 w-auto object-contain transition-transform group-hover:scale-105" />
                            <span className="text-xl sm:text-2xl font-black text-primary tracking-tight ml-1">
                                {config?.businessName || 'Beauty P&C'}
                            </span>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center justify-center flex-1 ml-10">
                        <div className="flex space-x-8">
                            <Link to="/" className="nav-link">Home</Link>
                            <Link to="/shop" className="nav-link">Shop</Link>
                            <Link to="/about" className="nav-link">About</Link>
                            <Link to="/contact" className="nav-link">Contact</Link>
                        </div>
                    </div>

                    {/* User Actions */}
                    <div className="hidden md:flex items-center space-x-6">

                        <form onSubmit={handleSearch} className="relative group">
                            <input 
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search products..."
                                className="w-0 opacity-0 group-hover:w-48 group-hover:opacity-100 focus:w-48 focus:opacity-100 transition-all duration-300 ease-out border-b-2 border-transparent focus:border-brand bg-transparent py-1 px-2 text-sm text-primary placeholder-tertiary outline-none absolute right-8 top-1/2 -translate-y-1/2"
                            />
                            <button type="submit" className="text-secondary hover:text-brand transition-colors z-10 relative bg-surface/80 p-1">
                                <Search size={20} />
                            </button>
                        </form>

                        {userInfo ? (
                            <div className="relative">
                                <button
                                    onClick={() => setDropdownOpen(!dropdownOpen)}
                                    className="flex items-center gap-2 text-secondary hover:text-brand transition-colors font-medium focus:outline-none"
                                >
                                    <User size={20} />
                                    <span className="max-w-[100px] truncate">{userInfo.name}</span>
                                    <ChevronDown size={16} />
                                </button>

                                {dropdownOpen && (
                                    <div className="absolute right-0 mt-3 w-48 bg-surface rounded-xl shadow-lg border border-default py-2 z-50 dropdown-animate origin-top-right">
                                        <Link
                                            to="/profile"
                                            className="block px-4 py-2 text-sm text-primary hover:bg-brand-subtle hover:text-brand transition-colors flex items-center gap-2 font-medium"
                                            onClick={() => setDropdownOpen(false)}
                                        >
                                            <User size={16} /> My Profile
                                        </Link>
                                        <Link
                                            to="/my-orders"
                                            className="block px-4 py-2 text-sm text-primary hover:bg-brand-subtle hover:text-brand transition-colors flex items-center gap-2 font-medium"
                                            onClick={() => setDropdownOpen(false)}
                                        >
                                            <Package size={16} /> My Orders
                                        </Link>
                                        {userInfo.role === 'admin' && (
                                            <Link
                                                to="/admin/dashboard"
                                                className="block px-4 py-2 text-sm text-primary hover:bg-brand-subtle hover:text-brand transition-colors font-medium"
                                                onClick={() => setDropdownOpen(false)}
                                            >
                                                Admin Dashboard
                                            </Link>
                                        )}
                                        <button
                                            onClick={() => {
                                                logoutHandler();
                                                setDropdownOpen(false);
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-error hover:bg-error-bg transition-colors flex items-center gap-2 font-medium"
                                        >
                                            <LogOut size={16} /> Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link to="/login" className="text-secondary hover:text-brand transition-colors">
                                <User size={20} />
                            </Link>
                        )}

                        <button 
                            onClick={toggleMode} 
                            className="bg-brand-subtle text-brand p-2 rounded-full hover:bg-brand hover:text-on-brand transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
                            aria-label="Toggle Dark Mode"
                            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                        >
                            {isDark ? <Sun size={18} /> : <Moon size={18} />}
                        </button>

                        <Link to="/wishlist" className="relative text-secondary hover:text-brand transition-colors group">
                            <Heart size={20} />
                            {wishlistItems.length > 0 && (
                                <span className="absolute -top-2 -right-2 bg-brand text-on-brand text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                                    {wishlistItems.length}
                                </span>
                            )}
                        </Link>

                        <Link to="/cart" className="relative text-secondary hover:text-brand transition-colors group">
                            <ShoppingBag size={20} />
                            {cartItems.length > 0 && (
                                <span className="absolute -top-2 -right-2 bg-brand text-on-brand text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                                    {cartItems.reduce((a, c) => a + c.qty, 0)}
                                </span>
                            )}
                        </Link>

                    </div>

                    {/* Mobile menu button */}
                    <div className="flex items-center md:hidden space-x-4">
                        <button 
                            onClick={toggleMode} 
                            className="bg-brand-subtle text-brand p-2 rounded-full hover:bg-brand hover:text-on-brand transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
                            aria-label="Toggle Dark Mode"
                        >
                            {isDark ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                        <Link to="/wishlist" className="relative text-secondary hover:text-brand transition-colors">
                            <Heart size={22} />
                            {wishlistItems.length > 0 && (
                                <span className="absolute -top-2 -right-2 bg-brand text-on-brand text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center shadow-sm">
                                    {wishlistItems.length}
                                </span>
                            )}
                        </Link>
                        <Link to="/cart" className="relative text-secondary hover:text-brand transition-colors">
                            <ShoppingBag size={22} />
                            {cartItems.length > 0 && (
                                <span className="absolute -top-2 -right-2 bg-brand text-on-brand text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center shadow-sm">
                                    {cartItems.reduce((a, c) => a + c.qty, 0)}
                                </span>
                            )}
                        </Link>
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-secondary hover:text-brand hover:bg-brand-subtle transition-colors"
                        >
                            {isOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="md:hidden bg-surface border-b border-default shadow-xl absolute w-full left-0 mobile-menu-animate origin-top">
                    <div className="px-4 pt-4 pb-6 space-y-2">
                        <form onSubmit={handleSearch} className="mb-4">
                            <div className="relative">
                                <input 
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search products..."
                                    className="w-full bg-muted border border-default rounded-xl py-3 pl-10 pr-4 text-primary focus:outline-none focus:ring-2 focus:ring-brand"
                                />
                                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" />
                            </div>
                        </form>
                        <Link to="/" className="block px-3 py-3 rounded-xl text-base font-medium text-primary hover:bg-brand-subtle hover:text-brand transition-colors" onClick={() => setIsOpen(false)}>Home</Link>
                        <Link to="/shop" className="block px-3 py-3 rounded-xl text-base font-medium text-primary hover:bg-brand-subtle hover:text-brand transition-colors" onClick={() => setIsOpen(false)}>Shop</Link>

                        {userInfo ? (
                            <div className="border-t border-default pt-4 mt-2">
                                <div className="px-3 py-2 text-sm text-secondary font-medium tracking-wide">MY ACCOUNT ({userInfo.name})</div>
                                <Link to="/profile" className="block px-3 py-3 text-base font-medium text-primary hover:text-brand hover:bg-brand-subtle rounded-xl transition-colors flex items-center gap-2" onClick={() => setIsOpen(false)}>
                                    <User size={18} /> My Profile
                                </Link>
                                <Link to="/my-orders" className="block px-3 py-3 text-base font-medium text-primary hover:text-brand hover:bg-brand-subtle rounded-xl transition-colors flex items-center gap-2" onClick={() => setIsOpen(false)}>
                                    <Package size={18} /> My Orders
                                </Link>
                                {userInfo.role === 'admin' && (
                                    <Link to="/admin/dashboard" className="block px-3 py-3 text-base font-medium text-primary hover:text-brand hover:bg-brand-subtle rounded-xl transition-colors" onClick={() => setIsOpen(false)}>Admin Dashboard</Link>
                                )}
                                <button onClick={() => { logoutHandler(); setIsOpen(false); }} className="w-full text-left px-3 py-3 text-base font-medium text-error hover:bg-error-bg transition-colors rounded-xl flex items-center gap-2">
                                    <LogOut size={18} /> Logout
                                </button>
                            </div>
                        ) : (
                            <Link to="/login" className="block px-3 py-3 rounded-xl text-base font-medium bg-brand-subtle text-brand hover:bg-brand hover:text-on-brand mt-4 transition-colors" onClick={() => setIsOpen(false)}>
                                Sign In / Register
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
