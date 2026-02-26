import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../context/useAuthStore';
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
    Settings
} from 'lucide-react';

const AdminLayout = () => {
    const { userInfo } = useAuthStore();
    const location = useLocation();

    if (!userInfo || userInfo.role !== 'admin') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-rose-600 mb-2">Access Denied</h2>
                    <p className="text-slate-500 mb-6">You must be an administrator to view this area.</p>
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
        <div className="flex min-h-screen bg-slate-50">

            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col flex-shrink-0 sticky top-0 h-screen overflow-y-auto">
                <div className="p-6">
                    <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                        Admin Portal <span className="text-[10px] bg-pink-100 text-pink-600 px-2 py-0.5 rounded-full font-bold uppercase">Pro</span>
                    </h2>
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-4">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
                        return (
                            <Link
                                key={item.name}
                                to={item.path}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${isActive ? 'bg-pink-50 text-pink-600 border border-pink-100 shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'}`}
                            >
                                {item.icon}
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-100 mt-auto">
                    <Link to="/" className="flex items-center gap-2 text-sm text-slate-500 hover:text-pink-600 font-medium px-4 py-2 transition-colors">
                        <ArrowLeft size={16} /> Exit Admin Dashboard
                    </Link>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 min-w-0 flex flex-col">
                {/* Mobile Header */}
                <div className="md:hidden bg-white border-b border-slate-200 px-4 py-4 flex items-center justify-between sticky top-0 z-10">
                    <h2 className="text-lg font-bold text-slate-800">Admin Portal</h2>
                    {/* Simple mobile menu (could be expanded) */}
                    <select
                        className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm"
                        value={location.pathname}
                        onChange={(e) => window.location.href = e.target.value}
                    >
                        {navItems.map(item => (
                            <option key={item.path} value={item.path}>{item.name}</option>
                        ))}
                    </select>
                </div>

                {/* Render nested routes */}
                <div className="p-4 sm:p-6 lg:p-8 flex-1 overflow-y-auto">
                    <Outlet />
                </div>
            </main>

        </div>
    );
};

export default AdminLayout;
