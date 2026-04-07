import { create } from 'zustand';
import axios from 'axios';

export const useConfigStore = create((set) => ({
    config: null,
    loading: true,
    error: null,

    fetchConfig: async () => {
        set({ loading: true, error: null });
        try {
            const { data } = await axios.get('/api/config');
            set({ config: data, loading: false });
        } catch (error) {
            set({ error: error.message, loading: false });
        }
    },

    updateConfigLocally: (newConfig) => {
        set({ config: newConfig });
    }
}));
