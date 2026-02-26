import { create } from 'zustand';

export const useCartStore = create((set) => ({
    cartItems: localStorage.getItem('cartItems')
        ? JSON.parse(localStorage.getItem('cartItems'))
        : [],

    shippingAddress: localStorage.getItem('shippingAddress')
        ? JSON.parse(localStorage.getItem('shippingAddress'))
        : {},

    paymentMethod: localStorage.getItem('paymentMethod')
        ? JSON.parse(localStorage.getItem('paymentMethod'))
        : 'Cash on Delivery',

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

        localStorage.setItem('cartItems', JSON.stringify(updatedCart));
        return { cartItems: updatedCart };
    }),

    removeFromCart: (cartIdToRemove) => set((state) => {
        const updatedCart = state.cartItems.filter((x) => x.cartId !== cartIdToRemove);
        localStorage.setItem('cartItems', JSON.stringify(updatedCart));
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
        localStorage.removeItem('cartItems');
        return { cartItems: [] };
    }),
}));
