import { create } from 'zustand';
import { getFirstAvailableVariant, hasBundleStock, hasProductStock } from '../utils/stockUtils';

const getUser = () => {
    return JSON.parse(localStorage.getItem('userInfo'));
};

const loadInitialCart = () => {
    const user = getUser();
    if (user && user.cart) {
        // Source of truth is the DB via userInfo
        return user.cart;
    }

    // Guest fallback
    const guestCart = localStorage.getItem('cartItems_guest');
    if (guestCart) return JSON.parse(guestCart);

    return [];
};

export const useCartStore = create((set) => ({
    cartItems: loadInitialCart(),

    shippingAddress: localStorage.getItem('shippingAddress')
        ? JSON.parse(localStorage.getItem('shippingAddress'))
        : {},

    paymentMethod: localStorage.getItem('paymentMethod')
        ? JSON.parse(localStorage.getItem('paymentMethod'))
        : 'Cash on Delivery',

    buyNowItem: localStorage.getItem('buyNowItem')
        ? JSON.parse(localStorage.getItem('buyNowItem'))
        : null,

    setBuyNowItem: (item) => {
        const isBundle = Boolean(item?.isBundle);

        if (isBundle) {
            if (!hasBundleStock(item, item?.qty || 1)) {
                return false;
            }
        } else if (!hasProductStock(item, item?.qty || 1, item?.variant || null)) {
            return false;
        }

        set(() => {
            localStorage.setItem('buyNowItem', JSON.stringify(item));
            return { buyNowItem: item };
        });

        return true;
    },

    clearBuyNowItem: () => set(() => {
        localStorage.removeItem('buyNowItem');
        return { buyNowItem: null };
    }),

    addToCart: (item) => {
        const qty = Math.max(Number(item?.qty || 1), 1);
        let resolvedVariant = item?.variant || null;

        if (!resolvedVariant && Array.isArray(item?.variants) && item.variants.length > 0) {
            resolvedVariant = getFirstAvailableVariant(item);
        }

        if (!hasProductStock(item, qty, resolvedVariant)) {
            return false;
        }

        set((state) => {
            const cartId = resolvedVariant ? `${item._id}-${resolvedVariant._id}` : item._id;
            const itemWithCartId = { ...item, variant: resolvedVariant, cartId, qty };

            const existItem = state.cartItems.find((x) => x.cartId === cartId);

            let updatedCart;
            if (existItem) {
                updatedCart = state.cartItems.map((x) =>
                    x.cartId === existItem.cartId ? itemWithCartId : x
                );
            } else {
                updatedCart = [...state.cartItems, itemWithCartId];
            }

            const user = getUser();
            if (!user) {
                localStorage.setItem('cartItems_guest', JSON.stringify(updatedCart));
            }

            return { cartItems: updatedCart };
        });

        return true;
    },

    addBundleToCart: (bundle) => {
        if (!hasBundleStock(bundle, 1)) {
            return false;
        }

        set((state) => {
        // Bundles use a unique cartId prefix so they don't conflict with products
        const cartId = `bundle-${bundle._id}`;

        // If already in cart, do nothing (bundle is atomic — qty always 1)
        const alreadyInCart = state.cartItems.find((x) => x.cartId === cartId);
        if (alreadyInCart) {
            return { cartItems: state.cartItems };
        }

        const bundleCartItem = {
            _id: bundle._id,
            cartId,
            name: bundle.name,
            image: bundle.image?.url || '',
            price: bundle.bundlePrice,
            qty: 1,
            isBundle: true,
            bundleProducts: bundle.products || [],
            // Bundle availability is validated before insertion.
            stock: 9999,
        };

        const updatedCart = [...state.cartItems, bundleCartItem];

        const user = getUser();
        if (!user) {
            localStorage.setItem('cartItems_guest', JSON.stringify(updatedCart));
        }

        return { cartItems: updatedCart };
        });

        return true;
    },

    removeFromCart: (cartIdToRemove) => set((state) => {
        const updatedCart = state.cartItems.filter((x) => x.cartId !== cartIdToRemove);

        const user = getUser();
        if (!user) {
            localStorage.setItem('cartItems_guest', JSON.stringify(updatedCart));
        }
        return { cartItems: updatedCart };
    }),

    saveShippingAddress: (data) => set(() => {
        localStorage.setItem('shippingAddress', JSON.stringify(data));
        return { shippingAddress: data };
    }),

    savePaymentMethod: (data) => set(() => {
        localStorage.setItem('paymentMethod', JSON.stringify(data));
        return { paymentMethod: data };
    }),

    clearCart: () => set(() => {
        const user = getUser();
        if (!user) {
            localStorage.removeItem('cartItems_guest');
        }
        return { cartItems: [] };
    }),

    mergeGuestCart: (dbCart) => set((state) => {
        const userSavedCart = dbCart || [];
        const guestCart = state.cartItems; // currently holding guest items before flush

        let mergedCart = [...userSavedCart];
        // If they had items as a guest, add them to their DB cart
        guestCart.forEach(guestItem => {
            const exist = mergedCart.find(x => x.cartId === guestItem.cartId);
            if (exist) {
                exist.qty = guestItem.qty;
            } else {
                mergedCart.push(guestItem);
            }
        });

        localStorage.removeItem('cartItems_guest');
        return { cartItems: mergedCart };
    }),

    loadCartFromDB: (dbCart) => set(() => {
        // Also clear any lingering specific checkouts
        localStorage.removeItem('buyNowItem');
        return { cartItems: dbCart || [], buyNowItem: null };
    }),

    clearToGuest: () => set(() => {
        const guestCart = JSON.parse(localStorage.getItem('cartItems_guest')) || [];
        return { cartItems: guestCart, buyNowItem: null };
    })
}));
