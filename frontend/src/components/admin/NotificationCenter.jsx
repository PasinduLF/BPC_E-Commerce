import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNotificationStore } from '../../context/useNotificationStore';

const NotificationCenter = () => {
    const [open, setOpen] = useState(false);
    const { notifications, markAsRead, markAllAsRead, clearAll } = useNotificationStore();

    const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

    return (
        <div className="relative">
            <button
                type="button"
                aria-label="Open notification center"
                onClick={() => setOpen((prev) => !prev)}
                className="touch-target inline-flex items-center justify-center rounded-lg border border-default bg-page text-secondary hover:text-brand hover:border-brand transition-colors"
            >
                <Bell size={18} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-warning text-white text-[10px] font-bold flex items-center justify-center">
                        {unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-[320px] max-h-[420px] overflow-hidden rounded-2xl border border-default bg-surface shadow-lg z-30">
                    <div className="p-3 border-b border-default flex items-center justify-between">
                        <h3 className="text-sm font-bold text-primary">Notifications</h3>
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                aria-label="Mark all notifications as read"
                                onClick={markAllAsRead}
                                className="touch-target p-2 rounded-lg text-secondary hover:text-brand hover:bg-page"
                            >
                                <CheckCheck size={16} />
                            </button>
                            <button
                                type="button"
                                aria-label="Clear all notifications"
                                onClick={clearAll}
                                className="touch-target p-2 rounded-lg text-secondary hover:text-error hover:bg-error-bg"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>

                    <div className="overflow-y-auto max-h-[360px]">
                        {notifications.length === 0 ? (
                            <div className="p-4 text-sm text-secondary">No notifications yet.</div>
                        ) : (
                            notifications.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => markAsRead(item.id)}
                                    className={`w-full text-left p-3 border-b border-default hover:bg-page transition-colors ${item.read ? '' : 'bg-brand-subtle/40'}`}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-sm font-semibold text-primary">{item.title}</p>
                                        <span className="text-[10px] text-tertiary">{new Date(item.createdAt).toLocaleTimeString()}</span>
                                    </div>
                                    {item.description && <p className="text-xs text-secondary mt-1">{item.description}</p>}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationCenter;
