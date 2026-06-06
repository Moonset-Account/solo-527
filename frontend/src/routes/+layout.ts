import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { authToken } from '$lib/stores/auth';
import { get } from 'svelte/store';

export async function load({ url }) {
	if (!browser) return {};

	const token = get(authToken);
	const isLoginPage = url.pathname === '/login';

	if (!token && !isLoginPage) {
		throw goto('/login');
	}

	if (token && isLoginPage) {
		throw goto('/');
	}

	return {};
}
