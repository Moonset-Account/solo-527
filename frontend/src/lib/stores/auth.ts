import { writable } from 'svelte/store';
import type { User } from '../types';

function createAuthStore() {
	const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
	const storedUser = typeof localStorage !== 'undefined' ? localStorage.getItem('user') : null;
	
	const user = writable<User | null>(storedUser ? JSON.parse(storedUser) : null);
	const authToken = writable<string | null>(token);

	return {
		user,
		token: authToken,
		login: (token: string, userData: User) => {
			if (typeof localStorage !== 'undefined') {
				localStorage.setItem('token', token);
				localStorage.setItem('user', JSON.stringify(userData));
			}
			authToken.set(token);
			user.set(userData);
		},
		logout: () => {
			if (typeof localStorage !== 'undefined') {
				localStorage.removeItem('token');
				localStorage.removeItem('user');
			}
			authToken.set(null);
			user.set(null);
		}
	};
}

export const auth = createAuthStore();

export const drawerOpen = writable(false);
export const refreshTrigger = writable(0);
