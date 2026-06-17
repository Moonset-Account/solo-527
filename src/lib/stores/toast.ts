import { writable } from 'svelte/store';

export interface Toast {
	id: string;
	type: 'success' | 'error' | 'warning' | 'info';
	message: string;
	duration: number;
}

function createToastStore() {
	const { subscribe, update } = writable<Toast[]>([]);

	function show(type: Toast['type'], message: string, duration: number = 3000) {
		const id = crypto.randomUUID();
		update((toasts) => [...toasts, { id, type, message, duration }]);

		setTimeout(() => {
			update((toasts) => toasts.filter((t) => t.id !== id));
		}, duration);

		return id;
	}

	function remove(id: string) {
		update((toasts) => toasts.filter((t) => t.id !== id));
	}

	return {
		subscribe,
		success: (message: string, duration?: number) => show('success', message, duration),
		error: (message: string, duration?: number) => show('error', message, duration),
		warning: (message: string, duration?: number) => show('warning', message, duration),
		info: (message: string, duration?: number) => show('info', message, duration),
		remove
	};
}

export const toast = createToastStore();
