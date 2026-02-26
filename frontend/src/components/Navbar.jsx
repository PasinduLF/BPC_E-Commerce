import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, User, Menu, X, LogOut, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../context/useAuthStore';
import { useCartStore } from '../context/useCartStore';
import { useConfigStore } from '../context/useConfigStore';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const { userInfo, logout } = useAuthStore();
    const { cartItems } = useCartStore();
    const { config } = useConfigStore();
    const navigate = useNavigate();

    const logoutHandler = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-pink-100 shadow-sm transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 sm:h-20">

                    {/* Logo & Brand */}
                    <div className="flex items-center">
                        <Link to="/" className="flex items-center gap-2 group">
                            <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-rose-500 rounded-xl flex flex-col items-center justify-center text-white font-serif font-bold tracking-tighter shadow-md shadow-pink-200 group-hover:shadow-pink-300 transition-all group-hover:scale-105">
                                <span className="leading-none text-lg">B</span>
                                <span className="leading-none text-xs -mt-1">&C</span>
                            </div>
                            <span className="text-xl sm:text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 tracking-tight ml-1">
                                {config?.businessName || 'Beauty P&C'}
                            </span>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center justify-center flex-1 ml-10">
                        <div className="flex space-x-8">
                            <Link to="/" className="nav-link font-medium text-slate-600 hover:text-pink-600 transition-colors">Home</Link>
                            <Link to="/shop" className="nav-link font-medium text-slate-600 hover:text-pink-600 transition-colors">Shop</Link>
                            <Link to="/about" className="nav-link font-medium text-slate-600 hover:text-pink-600 transition-colors">About</Link>
                            <Link to="/contact" className="nav-link font-medium text-slate-600 hover:text-pink-600 transition-colors">Contact</Link>
                        </div>
                    </div>

                    {/* User Actions */}
                    <div className="hidden md:flex items-center space-x-6">

                        <button className="text-slate-600 hover:text-pink-600 transition-colors">
                            <Search size={20} />
                        </button>

                        {userInfo ? (
                            <div className="relative">
                                <button
                                    onClick={() => setDropdownOpen(!dropdownOpen)}
                                    className="flex items-center gap-2 text-slate-600 hover:text-pink-600 transition-colors font-medium focus:outline-none"
                                >
                                    <User size={20} />
                                    <span className="max-w-[100px] truncate">{userInfo.name}</span>
                                    <ChevronDown size={16} />
                                </button>

                                {dropdownOpen && (
                                    <div className="absolute right-0 mt-3 w-48 bg-white rounded-xl shadow-lg shadow-pink-100 border border-slate-100 py-2 z-50">
                                        <Link
                                            to="/profile"
                                            className="block px-4 py-2 text-sm text-slate-700 hover:bg-pink-50 hover:text-pink-600 transition-colors"
                                            onClick={() => setDropdownOpen(false)}
                                        >
                                            My Profile
                                        </Link>
                                        {userInfo.role === 'admin' && (
                                            <Link
                                                to="/admin/dashboard"
                                                className="block px-4 py-2 text-sm text-slate-700 hover:bg-pink-50 hover:text-pink-600 transition-colors"
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
                                            className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-2"
                                        >
                                            <LogOut size={16} /> Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link to="/login" className="text-slate-600 hover:text-pink-600 transition-colors">
                                <User size={20} />
                            </Link>
                        )}

                        <Link to="/cart" className="relative text-slate-600 hover:text-pink-600 transition-colors group">
                            <ShoppingBag size={20} />
                            {cartItems.length > 0 && (
                                <span className="absolute -top-2 -right-2 bg-pink-500 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                                    {cartItems.reduce((a, c) => a + c.qty, 0)}
                                </span>
                            )}
                        </Link>

                    </div>

                    {/* Mobile menu button */}
                    <div className="flex items-center md:hidden space-x-4">
                        <Link to="/cart" className="relative text-slate-600 transition-colors">
                            <ShoppingBag size={22} />
                            {cartItems.length > 0 && (
                                <span className="absolute -top-2 -right-2 bg-pink-500 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center shadow-sm">
                                    {cartItems.reduce((a, c) => a + c.qty, 0)}
                                </span>
                            )}
                        </Link>
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-slate-600 hover:text-pink-600 hover:bg-pink-50 transition-colors"
                        >
                            {isOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="md:hidden bg-white border-t border-slate-100 shadow-xl absolute w-full left-0">
                    <div className="px-4 pt-4 pb-6 space-y-2">
                        <Link to="/" className="block px-3 py-3 rounded-xl text-base font-medium text-slate-800 hover:bg-pink-50 hover:text-pink-600 transition-colors" onClick={() => setIsOpen(false)}>Home</Link>
                        <Link to="/shop" className="block px-3 py-3 rounded-xl text-base font-medium text-slate-800 hover:bg-pink-50 hover:text-pink-600 transition-colors" onClick={() => setIsOpen(false)}>Shop</Link>

                        {userInfo ? (
                            <div className="border-t border-slate-100 pt-4 mt-2">
                                <div className="px-3 py-2 text-sm text-slate-500 font-medium tracking-wide">MY ACCOUNT ({userInfo.name})</div>
                                <Link to="/profile" className="block px-3 py-3 text-base font-medium text-slate-800 hover:text-pink-600 transition-colors" onClick={() => setIsOpen(false)}>Profile</Link>
                                {userInfo.role === 'admin' && (
                                    <Link to="/admin/dashboard" className="block px-3 py-3 text-base font-medium text-slate-800 hover:text-pink-600 transition-colors" onClick={() => setIsOpen(false)}>Admin Dashboard</Link>
                                )}
                                <button onClick={() => { logoutHandler(); setIsOpen(false); }} className="w-full text-left px-3 py-3 text-base font-medium text-rose-600 hover:bg-rose-50 transition-colors rounded-xl flex items-center gap-2">
                                    <LogOut size={18} /> Logout
                                </button>
                            </div>
                        ) : (
                            <Link to="/login" className="block px-3 py-3 rounded-xl text-base font-medium bg-pink-50 text-pink-600 hover:bg-pink-100 mt-4 transition-colors" onClick={() => setIsOpen(false)}>
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
