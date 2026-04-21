/**
 * Standard fallback SVG for products when an image is missing or unreachable.
 * This is consistent with the BPC brand aesthetics (neutral tones, clean icon).
 */
export const FALLBACK_PRODUCT_IMAGE = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20viewBox%3D%220%200%20300%20300%22%3E%3Crect%20width%3D%22300%22%20height%3D%22300%22%20fill%3D%22%23f9fafb%22/%3E%3Cpath%20d%3D%22M0%20210h300v90H0z%22%20fill%3D%22%23f3f4f6%22/%3E%3Ccircle%20cx%3D%22150%22%20cy%3D%22120%22%20r%3D%2225%22%20fill%3D%22%23e5e7eb%22/%3E%3Cpath%20d%3D%22M50%20250l60-80%2040%2050%2050-60%2050%2090H50z%22%20fill%3D%22%23e5e7eb%22/%3E%3Ctext%20x%3D%22150%22%20y%3D%22270%22%20text-anchor%3D%22middle%22%20font-family%3D%22sans-serif%22%20font-size%3D%2214%22%20font-weight%3D%22bold%22%20fill%3D%22%239ca3af%22%3ENO%20IMAGE%20AVAILABLE%3C/text%3E%3C/svg%3E';

/**
 * Validates and returns a usable product image URL.
 * Filters out unreliable placeholder services like via.placeholder.com.
 * 
 * @param {Object} product - Product object
 * @param {number} index - Index of the image to retrieve (default: 0)
 * @returns {string} - Valid image URL or fallback data URI
 */
export const getProductImageUrl = (product, index = 0) => {
    let imageUrl = null;
    
    // 1. Check images array
    if (product?.images?.[index]) {
        imageUrl = typeof product.images[index] === 'string' ? product.images[index] : product.images[index].url;
    } 
    // 2. Fallback to standalone image property (common in cart snapshots or bundles)
    else if (product?.image) {
        imageUrl = typeof product.image === 'string' ? product.image : product.image.url;
    }

    // If no URL exists, or if it points to the unreliable via.placeholder.com, return fallback
    if (!imageUrl || (typeof imageUrl === 'string' && imageUrl.includes('via.placeholder.com'))) {
        return FALLBACK_PRODUCT_IMAGE;
    }
    
    return imageUrl;
};

/**
 * Returns a placeholder for brand logos
 */
export const FALLBACK_BRAND_IMAGE = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20viewBox%3D%220%200%20100%20100%22%3E%3Crect%20width%3D%22100%22%20height%3D%22100%22%20fill%3D%22%23f3f4f6%22/%3E%3Ctext%20x%3D%2250%22%20y%3D%2255%22%20text-anchor%3D%22middle%22%20font-family%3D%22sans-serif%22%20font-size%3D%2210%22%20font-weight%3D%22bold%22%20fill%3D%22%239ca3af%22%3EBRAND%3C/text%3E%3C/svg%3E';
