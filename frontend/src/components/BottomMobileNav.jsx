import { Link, useLocation } from 'react-router-dom';
import { Home, Grid, Search, ShoppingBag } from 'lucide-react';
import { useCartStore } from '../context/useCartStore';

const BottomMobileNav = ({ onOpenCategories, onOpenSearch }) => {
    const { cartItems } = useCartStore();
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-xl border-t border-default shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] pb-safe pt-2 px-6">
            <div className="flex items-center justify-between h-14">
                
                {/* Home */}
                <Link to="/" className="flex flex-col items-center justify-center w-12 gap-1 group">
                    <div className={`p-1.5 rounded-full transition-colors ${isActive('/') ? 'bg-brand-subtle text-brand' : 'text-secondary group-hover:text-primary transition-colors'}`}>
                        <Home size={22} className={isActive('/') ? 'fill-brand/20' : ''} />
                    </div>
                    <span className={`text-[10px] font-medium transition-colors ${isActive('/') ? 'text-brand' : 'text-tertiary'}`}>Home</span>
                </Link>

                {/* Categories (Triggers Drawer) */}
                <button onClick={onOpenCategories} className="flex flex-col items-center justify-center w-12 gap-1 group outline-none">
                    <div className="p-1.5 rounded-full text-secondary group-hover:text-primary transition-colors">
                        <Grid size={22} />
                    </div>
                    <span className="text-[10px] font-medium text-tertiary transition-colors">Categories</span>
                </button>

                {/* Search (Triggers Search overlay or focuses top input) */}
                <button onClick={onOpenSearch} className="flex flex-col items-center justify-center w-12 gap-1 group outline-none">
                    <div className="p-1.5 rounded-full text-secondary group-hover:text-primary transition-colors">
                        <Search size={22} />
                    </div>
                    <span className="text-[10px] font-medium text-tertiary transition-colors">Search</span>
                </button>

                {/* Cart */}
                <Link to="/cart" className="flex flex-col items-center justify-center w-12 gap-1 group relative">
                    <div className={`p-1.5 rounded-full transition-colors ${isActive('/cart') ? 'bg-brand-subtle text-brand' : 'text-secondary group-hover:text-primary transition-colors'}`}>
                        <ShoppingBag size={22} className={isActive('/cart') ? 'fill-brand/20' : ''} />
                    </div>
                    {cartItems.length > 0 && (
                        <span className="absolute top-0 right-1 bg-brand text-on-brand text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center shadow-sm border-2 border-surface">
                            {cartItems.reduce((a, c) => a + c.qty, 0)}
                        </span>
                    )}
                    <span className={`text-[10px] font-medium transition-colors ${isActive('/cart') ? 'text-brand' : 'text-tertiary'}`}>Cart</span>
                </Link>

            </div>
        </div>
    );
};

export default BottomMobileNav;
