import { create } from 'zustand';

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

    setBuyNowItem: (item) => set(() => {
        localStorage.setItem('buyNowItem', JSON.stringify(item));
        return { buyNowItem: item };
    }),

    clearBuyNowItem: () => set(() => {
        localStorage.removeItem('buyNowItem');
        return { buyNowItem: null };
    }),

    addToCart: (item) => set((state) => {
        const cartId = item.variant ? `${item._id}-${item.variant._id}` : item._id;
        const itemWithCartId = { ...item, cartId };

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
    }),

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
