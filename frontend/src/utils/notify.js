import { toast } from 'sonner';
import { useNotificationStore } from '../context/useNotificationStore';

const queue = [];
let processing = false;

const runQueue = () => {
    if (processing || queue.length === 0) return;
    processing = true;

    const next = queue.shift();
    const { type = 'info', title, description, actionLabel, onAction } = next;

    const toastOptions = {
        description,
        action: actionLabel
            ? {
                label: actionLabel,
                onClick: () => {
                    if (typeof onAction === 'function') onAction();
                },
            }
            : undefined,
    };

    if (type === 'success') toast.success(title, toastOptions);
    else if (type === 'error') toast.error(title, toastOptions);
    else if (type === 'warning') toast.warning(title, toastOptions);
    else toast(title, toastOptions);

    setTimeout(() => {
        processing = false;
        runQueue();
    }, 500);
};

export const notify = ({
    type = 'info',
    title,
    description = '',
    actionLabel,
    onAction,
    persist = true,
}) => {
    if (persist) {
        useNotificationStore.getState().addNotification({
            type,
            title,
            description,
        });
    }

    queue.push({ type, title, description, actionLabel, onAction });
    runQueue();
};
