/**
 * Utility functions for generating and working with SEO-friendly slugs.
 * Used to construct clean URLs throughout the frontend.
 */

/**
 * Convert a string into a URL-friendly slug.
 * Same algorithm as backend to ensure consistency.
 * 
 * @param {string} text - The text to slugify
 * @returns {string} The slugified string
 */
export const slugify = (text = '') =>
    String(text)
        .toLowerCase()
        .trim()
        .replace(/['']/g, '')
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/[\s_]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

/**
 * Get the product URL path using slug (preferred) or fallback to ID.
 * 
 * @param {object} product - Product object with slug and/or _id
 * @returns {string} URL path like "/product/vitamin-c-serum"
 */
export const getProductUrl = (product) => {
    if (!product) return '/shop';
    const identifier = product.slug || product._id;
    return `/product/${identifier}`;
};

/**
 * Build a /shop URL with category/brand/subcategory slugs as query params.
 * Falls back to IDs if slugs are not available.
 * 
 * @param {object} options
 * @param {object} [options.category] - Category object with slug or _id
 * @param {object} [options.subcategory] - Subcategory object with slug or _id
 * @param {object} [options.innerSubcategory] - Inner subcategory object with slug or _id
 * @param {object} [options.brand] - Brand object with slug or _id
 * @returns {string} URL path like "/shop?category=skincare&brand=cerave"
 */
export const getShopUrl = ({ category, subcategory, innerSubcategory, brand } = {}) => {
    const params = new URLSearchParams();

    if (category) {
        params.set('category', category.slug || category._id || category);
    }
    if (subcategory) {
        params.set('subcategory', subcategory.slug || subcategory._id || subcategory);
    }
    if (innerSubcategory) {
        params.set('innerSubcategory', innerSubcategory.slug || innerSubcategory._id || innerSubcategory);
    }
    if (brand) {
        params.set('brand', brand.slug || brand._id || brand);
    }

    const qs = params.toString();
    return qs ? `/shop?${qs}` : '/shop';
};
