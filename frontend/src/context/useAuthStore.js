import { create } from 'zustand';

export const useAuthStore = create((set) => ({
    userInfo: localStorage.getItem('userInfo')
        ? JSON.parse(localStorage.getItem('userInfo'))
        : null,

    setCredentials: (data) => {
        localStorage.setItem('userInfo', JSON.stringify(data));
        set({ userInfo: data });
    },

    logout: () => {
        localStorage.removeItem('userInfo');
        set({ userInfo: null });
    }
}));
