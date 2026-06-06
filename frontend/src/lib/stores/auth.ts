import { writable, derived } from 'svelte/store';

const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
const storedUser = typeof localStorage !== 'undefined' ? localStorage.getItem('user') : null;

export const user = writable(storedUser ? JSON.parse(storedUser) : null);
export const authToken = writable(token);

export const drawerOpen = writable(false);
export const refreshTrigger = writable(0);

export function login(tokenValue, userData) {
	if (typeof localStorage !== 'undefined') {
		localStorage.setItem('token', tokenValue);
		localStorage.setItem('user', JSON.stringify(userData));
	}
	authToken.set(tokenValue);
	user.set(userData);
}

export function logout() {
	if (typeof localStorage !== 'undefined') {
		localStorage.removeItem('token');
		localStorage.removeItem('user');
	}
	authToken.set(null);
	user.set(null);
}

export const isAuthenticated = derived([user, authToken], ([$user, $token]) => {
	return !!$user && !!$token;
});
