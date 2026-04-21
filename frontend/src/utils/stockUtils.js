export const getFirstAvailableVariant = (product) => {
    const variants = Array.isArray(product?.variants) ? product.variants : [];
    if (variants.length === 0) return null;
    return variants.find((variant) => Number(variant?.stock || 0) > 0) || null;
};

export const getProductAvailableStock = (product, selectedVariant = null) => {
    if (!product) return 0;

    if (selectedVariant?._id) {
        return Number(selectedVariant.stock || 0);
    }

    const variants = Array.isArray(product.variants) ? product.variants : [];
    if (variants.length > 0) {
        return variants.reduce((sum, variant) => sum + Number(variant?.stock || 0), 0);
    }

    return Number(product.stock || 0);
};

export const hasProductStock = (product, qty = 1, selectedVariant = null) => {
    if (!product || product.isActive === false) return false;
    const requiredQty = Math.max(Number(qty || 0), 1);
    return getProductAvailableStock(product, selectedVariant) >= requiredQty;
};

export const hasBundleStock = (bundle, qty = 1) => {
    if (!bundle || bundle.isActive === false) return false;
    const requiredBundleQty = Math.max(Number(qty || 0), 1);
    const lines = Array.isArray(bundle.products) ? bundle.products : (Array.isArray(bundle.bundleProducts) ? bundle.bundleProducts : []);

    if (lines.length === 0) return false;

    return lines.every((line) => {
        const product = line?.product;
        if (!product || product.isActive === false) return false;

        const lineQty = Math.max(Number(line?.qty || 1), 1) * requiredBundleQty;
        const variants = Array.isArray(product.variants) ? product.variants : [];

        if (line?.variantId && variants.length > 0) {
            const variant = variants.find((v) => String(v?._id) === String(line.variantId));
            return Boolean(variant) && Number(variant.stock || 0) >= lineQty;
        }

        if (variants.length > 0) {
            const totalVariantStock = variants.reduce((sum, variant) => sum + Number(variant?.stock || 0), 0);
            return totalVariantStock >= lineQty;
        }

        return Number(product.stock || 0) >= lineQty;
    });
};
