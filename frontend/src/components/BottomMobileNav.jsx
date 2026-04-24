import { Link, useLocation } from 'react-router-dom';
import { Home, Store, Package, User } from 'lucide-react';

const BottomMobileNav = () => {
    const location = useLocation();

    const isActive = (path) => location.pathname === path || location.pathname.startsWith(`${path}/`);

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-xl border-t border-default shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] pb-safe pt-2 px-3 sm:px-6 px-safe">
            <div className="grid grid-cols-4 items-center gap-1 h-14 min-[360px]:h-[3.75rem]">
                
                {/* Home */}
                <Link to="/" className="flex flex-col items-center justify-center gap-1 group min-w-0">
                    <div className={`p-1.5 rounded-full transition-colors ${isActive('/') ? 'bg-brand-subtle text-brand' : 'text-secondary group-hover:text-primary transition-colors'}`}>
                        <Home size={22} className={isActive('/') ? 'fill-brand/20' : ''} />
                    </div>
                    <span className={`text-[10px] font-medium transition-colors ${isActive('/') ? 'text-brand' : 'text-tertiary'}`}>Home</span>
                </Link>

                {/* Shop */}
                <Link to="/shop" className="flex flex-col items-center justify-center gap-1 group min-w-0">
                    <div className={`p-1.5 rounded-full transition-colors ${isActive('/shop') ? 'bg-brand-subtle text-brand' : 'text-secondary group-hover:text-primary transition-colors'}`}>
                        <Store size={22} className={isActive('/shop') ? 'fill-brand/20' : ''} />
                    </div>
                    <span className={`text-[10px] font-medium transition-colors ${isActive('/shop') ? 'text-brand' : 'text-tertiary'}`}>Shop</span>
                </Link>

                {/* My Orders */}
                <Link to="/my-orders" className="flex flex-col items-center justify-center gap-1 group min-w-0">
                    <div className={`p-1.5 rounded-full transition-colors ${isActive('/my-orders') ? 'bg-brand-subtle text-brand' : 'text-secondary group-hover:text-primary transition-colors'}`}>
                        <Package size={22} className={isActive('/my-orders') ? 'fill-brand/20' : ''} />
                    </div>
                    <span className={`text-[10px] font-medium transition-colors ${isActive('/my-orders') ? 'text-brand' : 'text-tertiary'}`}>My Order</span>
                </Link>

                {/* Profile */}
                <Link to="/profile" className="flex flex-col items-center justify-center gap-1 group min-w-0">
                    <div className={`p-1.5 rounded-full transition-colors ${isActive('/profile') ? 'bg-brand-subtle text-brand' : 'text-secondary group-hover:text-primary transition-colors'}`}>
                        <User size={22} className={isActive('/profile') ? 'fill-brand/20' : ''} />
                    </div>
                    <span className={`text-[10px] font-medium transition-colors ${isActive('/profile') ? 'text-brand' : 'text-tertiary'}`}>Profile</span>
                </Link>

            </div>
        </div>
    );
};

export default BottomMobileNav;
