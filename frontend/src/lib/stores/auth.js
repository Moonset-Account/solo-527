import { writable } from 'svelte/store';

function createAuthStore() {
	const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('auth') : null;
	const initial = stored ? JSON.parse(stored) : { token: null, user: null };

	const { subscribe, set, update } = writable(initial);

	return {
		subscribe,
		login: (token, user) => {
			const data = { token, user };
			set(data);
			if (typeof localStorage !== 'undefined') {
				localStorage.setItem('auth', JSON.stringify(data));
			}
		},
		logout: () => {
			set({ token: null, user: null });
			if (typeof localStorage !== 'undefined') {
				localStorage.removeItem('auth');
			}
		}
	};
}

export const auth = createAuthStore();
