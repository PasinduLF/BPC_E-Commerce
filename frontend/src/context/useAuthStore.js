import { create } from 'zustand';
import { useCartStore } from './useCartStore';
import { useWishlistStore } from './useWishlistStore';

export const useAuthStore = create((set) => ({
    userInfo: localStorage.getItem('userInfo')
        ? JSON.parse(localStorage.getItem('userInfo'))
        : null,

    setCredentials: (data) => {
        localStorage.setItem('userInfo', JSON.stringify(data));
        set({ userInfo: data });
        // Synchronize guest cart/wishlist with user cart/wishlist payload from DB
        useCartStore.getState().mergeGuestCart(data.cart);
        useWishlistStore.getState().mergeGuestWishlist(data.wishlist);
    },

    logout: () => {
        localStorage.removeItem('userInfo');
        set({ userInfo: null });
        // Revert to empty guest carts/wishlists to protect privacy
        useCartStore.getState().clearToGuest();
        useWishlistStore.getState().clearToGuest();
    }
}));
