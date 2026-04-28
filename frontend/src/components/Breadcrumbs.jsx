import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { getShopUrl } from '../utils/slugUtils';

const Breadcrumbs = ({ category, subcategory, innerSubcategory, productName }) => {
    // Resolve subcategory name from category.subcategories if only ID is provided
    const resSub = (category && subcategory && !subcategory.name) 
        ? category.subcategories?.find(s => s._id === (typeof subcategory === 'string' ? subcategory : subcategory._id))
        : subcategory;

    // Resolve inner subcategory name if only ID was stored/passed
    const resInner = (resSub && innerSubcategory && !innerSubcategory.name)
        ? resSub.nestedSubcategories?.find(n => n._id === (typeof innerSubcategory === 'string' ? innerSubcategory : innerSubcategory._id))
        : innerSubcategory;

    const subName = resSub?.name || subcategory?.name || subcategory;
    const innerName = resInner?.name || innerSubcategory?.name || innerSubcategory;

    return (
        <nav className="flex items-center space-x-2 text-xs sm:text-sm text-secondary mb-6 overflow-x-auto whitespace-nowrap pb-2 custom-scrollbar">
            <Link to="/" className="flex items-center gap-1 hover:text-brand transition-colors">
                <Home size={14} />
                <span>Home</span>
            </Link>

            <ChevronRight size={12} className="text-tertiary flex-shrink-0" />
            <Link to="/shop" className="hover:text-brand transition-colors">
                Shop
            </Link>

            {category && (
                <>
                    <ChevronRight size={12} className="text-tertiary flex-shrink-0" />
                    <Link to={getShopUrl({ category })} className="hover:text-brand transition-colors">
                        {category.name}
                    </Link>
                </>
            )}

            {subName && (
                <>
                    <ChevronRight size={12} className="text-tertiary flex-shrink-0" />
                    <Link 
                        to={getShopUrl({ category, subcategory: resSub || subcategory })} 
                        className="hover:text-brand transition-colors"
                    >
                        {subName}
                    </Link>
                </>
            )}

            {innerName && (
                <>
                    <ChevronRight size={12} className="text-tertiary flex-shrink-0" />
                    <Link 
                        to={getShopUrl({ category, subcategory: resSub || subcategory, innerSubcategory: resInner || innerSubcategory })}
                        className="hover:text-brand transition-colors"
                    >
                        {innerName}
                    </Link>
                </>
            )}

            {productName && (
                <>
                    <ChevronRight size={12} className="text-tertiary flex-shrink-0" />
                    <span className="text-primary font-bold truncate max-w-[150px] sm:max-xs">{productName}</span>
                </>
            )}
        </nav>
    );
};

export default Breadcrumbs;
