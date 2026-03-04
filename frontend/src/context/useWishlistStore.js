import { create } from 'zustand';

export const useWishlistStore = create((set, get) => ({
    wishlistItems: localStorage.getItem('wishlistItems')
        ? JSON.parse(localStorage.getItem('wishlistItems'))
        : [],

    addToWishlist: (product) => {
        const { wishlistItems } = get();
        const existItem = wishlistItems.find((x) => x._id === product._id);

        if (!existItem) {
            const updatedWishlist = [...wishlistItems, product];
            set({ wishlistItems: updatedWishlist });
            localStorage.setItem('wishlistItems', JSON.stringify(updatedWishlist));
        }
    },

    removeFromWishlist: (id) => {
        const { wishlistItems } = get();
        const updatedWishlist = wishlistItems.filter((x) => x._id !== id);
        set({ wishlistItems: updatedWishlist });
        localStorage.setItem('wishlistItems', JSON.stringify(updatedWishlist));
    },

    isInWishlist: (id) => {
        const { wishlistItems } = get();
        return wishlistItems.some((x) => x._id === id);
    },

    toggleWishlist: (product) => {
        const { isInWishlist, addToWishlist, removeFromWishlist } = get();
        if (isInWishlist(product._id)) {
            removeFromWishlist(product._id);
        } else {
            addToWishlist(product);
        }
    }
}));
