import { create } from 'zustand';

const getUser = () => {
    return JSON.parse(localStorage.getItem('userInfo'));
};

const loadInitialWishlist = () => {
    const user = getUser();
    if (user && user.wishlist) {
        return user.wishlist;
    }

    // Guest fallback
    const guestWishlist = localStorage.getItem('wishlistItems_guest');
    if (guestWishlist) return JSON.parse(guestWishlist);

    return [];
};

export const useWishlistStore = create((set, get) => ({
    wishlistItems: loadInitialWishlist(),

    addToWishlist: (product) => {
        const { wishlistItems } = get();
        const existItem = wishlistItems.find((x) => x._id === product._id);

        if (!existItem) {
            const updatedWishlist = [...wishlistItems, product];
            set({ wishlistItems: updatedWishlist });

            const user = getUser();
            if (!user) {
                localStorage.setItem('wishlistItems_guest', JSON.stringify(updatedWishlist));
            }
        }
    },

    removeFromWishlist: (id) => {
        const { wishlistItems } = get();
        const updatedWishlist = wishlistItems.filter((x) => x._id !== id);
        set({ wishlistItems: updatedWishlist });

        const user = getUser();
        if (!user) {
            localStorage.setItem('wishlistItems_guest', JSON.stringify(updatedWishlist));
        }
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
    },

    mergeGuestWishlist: (dbWishlist) => {
        const guestWishlist = get().wishlistItems;
        const userSavedWishlist = dbWishlist || [];

        let mergedWishlist = [...userSavedWishlist];
        guestWishlist.forEach(guestItem => {
            const exist = mergedWishlist.find(x => x._id === guestItem._id);
            if (!exist) {
                mergedWishlist.push(guestItem);
            }
        });

        localStorage.removeItem('wishlistItems_guest');
        set({ wishlistItems: mergedWishlist });
    },

    loadWishlistFromDB: (dbWishlist) => {
        set({ wishlistItems: dbWishlist || [] });
    },

    clearToGuest: () => {
        const guestWishlist = JSON.parse(localStorage.getItem('wishlistItems_guest')) || [];
        set({ wishlistItems: guestWishlist });
    }
}));
