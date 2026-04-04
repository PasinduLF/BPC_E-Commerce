import { Link, Outlet, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuthStore } from '../context/useAuthStore';
import { useTheme } from '../context/ThemeContext';
import logoImage from '../assets/logo-no-background.png';
import {
    LayoutDashboard,
    Package,
    Grid,
    ShoppingCart,
    Users,
    Truck,
    ArrowLeft,
    ShoppingBag,
    Tags,
    PackageSearch,
    Calculator,
    LogOut,
    Menu,
    X,
    FolderTree,
    Container,
    Receipt,
    Settings,
    Store,
    Sun,
    Moon
} from 'lucide-react';

const AdminLayout = () => {
    const { userInfo } = useAuthStore();
    const location = useLocation();
    const { isDark, toggleMode } = useTheme();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    if (!userInfo || userInfo.role !== 'admin') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-page">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-error mb-2">Access Denied</h2>
                    <p className="text-secondary mb-6">You must be an administrator to view this area.</p>
                    <Link to="/" className="btn-primary">Return Home</Link>
                </div>
            </div>
        );
    }

    const navItems = [
        { name: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard size={20} /> },
        { name: 'Point of Sale (POS)', path: '/admin/pos', icon: <ShoppingCart size={20} /> },
        { name: 'Products', path: '/admin/products', icon: <Package size={20} /> },
        { name: 'Brands', path: '/admin/brands', icon: <Grid size={20} /> },
        { name: 'Categories', path: '/admin/categories', icon: <Grid size={20} /> },
        { name: 'Orders', path: '/admin/orders', icon: <ShoppingCart size={20} /> },
        { name: 'Wholesale Inventory', path: '/admin/wholesale', icon: <Truck size={20} /> },
        { name: 'Ledger Balances', path: '/admin/financials', icon: <Truck size={20} /> },
        { name: 'Customers', path: '/admin/users', icon: <Users size={20} /> },
        { name: 'Income & Expense', path: '/admin/income-expense', icon: <Receipt size={20} /> },
        { name: 'System Settings', path: '/admin/settings', icon: <Settings size={20} /> },
    ];

    return (
        <div className="flex h-screen bg-page">
            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
                    onClick={() => setIsMobileMenuOpen(false)}
                ></div>
            )}

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-surface border-r border-default flex-col flex-shrink-0 transition-transform duration-300 ease-in-out md:flex md:static md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-6 flex items-start justify-between">
                    <div className="flex flex-col mb-1">
                        <img src={logoImage} alt="Beauty P&C Logo" className="h-8 w-auto object-contain mb-2 dark:brightness-0 dark:invert" />
                        <h2 className="text-sm font-bold text-secondary tracking-tight">
                            Admin <span className="text-[10px] bg-brand-subtle text-brand px-1.5 py-0.5 rounded-full font-bold uppercase ml-1">Pro</span>
                        </h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={toggleMode} className="text-secondary hover:text-brand p-1.5 rounded-full hover:bg-subtle focus:outline-none transition-colors" title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}>
                            {isDark ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                        <button className="md:hidden text-secondary hover:text-primary p-1 rounded-full hover:bg-subtle" onClick={() => setIsMobileMenuOpen(false)}>
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
                        return (
                            <Link
                                key={item.name}
                                to={item.path}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${isActive ? 'bg-brand-subtle text-brand border border-brand/20 shadow-sm' : 'text-secondary hover:bg-subtle hover:text-primary border border-transparent'}`}
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                {item.icon}
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-default mt-auto">
                    <Link to="/" className="flex items-center gap-2 text-sm text-secondary hover:text-brand font-medium px-4 py-2 transition-colors">
                        <Store size={18} /> Back to Store
                    </Link>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 min-w-0 flex flex-col">
                {/* Mobile Header */}
                <div className="md:hidden bg-surface border-b border-default px-4 py-4 flex items-center justify-between sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <button className="text-secondary hover:text-primary p-1 rounded-full hover:bg-page" onClick={() => setIsMobileMenuOpen(true)}>
                            <Menu size={24} />
                        </button>
                        <img src={logoImage} alt="Beauty P&C Logo" className="h-6 w-auto object-contain dark:brightness-0 dark:invert" />
                    </div>
                    {/* Simple mobile menu (could be expanded) */}
                    <select
                        className="bg-page border border-default text-primary rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-brand"
                        value={location.pathname}
                        onChange={(e) => window.location.href = e.target.value}
                    >
                        {navItems.map(item => (
                            <option key={item.path} value={item.path}>{item.name}</option>
                        ))}
                    </select>
                </div>

                {/* Render nested routes */}
                <div className="p-4 sm:p-6 lg:p-8 flex-1 overflow-y-auto animate-fade-in animate-slide-up">
                    <Outlet />
                </div>
            </main>

        </div>
    );
};

export default AdminLayout;
