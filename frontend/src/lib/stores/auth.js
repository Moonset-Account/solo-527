import { writable } from 'svelte/store';
import { browser } from '$app/environment';

function createAuthStore() {
	let initial = { token: null, user: null };
	if (browser) {
		const stored = localStorage.getItem('auth');
		if (stored) {
			try {
				initial = JSON.parse(stored);
			} catch (e) {
				initial = { token: null, user: null };
			}
		}
	}

	const { subscribe, set } = writable(initial);

	return {
		subscribe,
		login: (token, user) => {
			const data = { token, user };
			set(data);
			if (browser) {
				localStorage.setItem('auth', JSON.stringify(data));
			}
		},
		logout: () => {
			set({ token: null, user: null });
			if (browser) {
				localStorage.removeItem('auth');
			}
		}
	};
}

export const auth = createAuthStore();
