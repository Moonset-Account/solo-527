import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useToastStore = defineStore('toast', () => {
    const toasts = ref([]);
    let id = 0;

    const addToast = (toast) => {
        id++;
        const toastItem = {
            id,
            type: toast.type || 'info',
            title: toast.title || '',
            message: toast.message,
            duration: toast.duration || 5000,
        };
        toasts.value.push(toastItem);

        if (toastItem.duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, toastItem.duration);
        }

        return id;
    };

    const removeToast = (toastId) => {
        const index = toasts.value.findIndex(t => t.id === toastId);
        if (index > -1) {
            toasts.value.splice(index, 1);
        }
    };

    const clearToasts = () => {
        toasts.value = [];
    };

    const success = (message, options = {}) => addToast({ ...options, type: 'success', message });
    const error = (message, options = {}) => addToast({ ...options, type: 'error', message });
    const warning = (message, options = {}) => addToast({ ...options, type: 'warning', message });
    const info = (message, options = {}) => addToast({ ...options, type: 'info', message });

    return {
        toasts,
        addToast,
        removeToast,
        clearToasts,
        success,
        error,
        warning,
        info,
    };
});
