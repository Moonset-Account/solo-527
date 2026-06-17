import { writable } from 'svelte/store';
import type { User } from '$lib/server/db/schema';

export interface AuthState {
	user: (User & { passwordHash?: never }) | null;
	isAuthenticated: boolean;
	loading: boolean;
}

const initialState: AuthState = {
	user: null,
	isAuthenticated: false,
	loading: true
};

function createAuthStore() {
	const { subscribe, set, update } = writable<AuthState>(initialState);

	return {
		subscribe,
		login: (user: User) => {
			const { passwordHash, ...safeUser } = user;
			set({ user: safeUser, isAuthenticated: true, loading: false });
		},
		logout: () => {
			set({ user: null, isAuthenticated: false, loading: false });
		},
		setLoading: (loading: boolean) => {
			update((state) => ({ ...state, loading }));
		},
		checkAuth: async () => {
			try {
				const res = await fetch('/api/auth/me', {
					credentials: 'include'
				});
				if (res.ok) {
					const data = await res.json();
					set({ user: data.user, isAuthenticated: true, loading: false });
				} else {
					set({ user: null, isAuthenticated: false, loading: false });
				}
			} catch {
				set({ user: null, isAuthenticated: false, loading: false });
			}
		}
	};
}

export const auth = createAuthStore();

export function hasRole(role: string, requiredRole: string): boolean {
	const roleHierarchy: Record<string, number> = {
		volunteer: 1,
		manager: 2,
		admin: 3
	};
	return (roleHierarchy[role] || 0) >= (roleHierarchy[requiredRole] || 0);
}
