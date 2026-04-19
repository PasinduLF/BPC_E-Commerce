import { create } from 'zustand';

export const useNotificationStore = create((set) => ({
    notifications: [],
    addNotification: (notification) =>
        set((state) => ({
            notifications: [
                {
                    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                    createdAt: new Date().toISOString(),
                    read: false,
                    ...notification,
                },
                ...state.notifications,
            ].slice(0, 100),
        })),
    markAsRead: (id) =>
        set((state) => ({
            notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        })),
    markAllAsRead: () =>
        set((state) => ({
            notifications: state.notifications.map((n) => ({ ...n, read: true })),
        })),
    clearAll: () => set({ notifications: [] }),
}));
