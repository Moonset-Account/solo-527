import { writable, derived } from 'svelte/store';
import type { FilterState, SavedView, User } from '$lib/types';

const initialFilters: FilterState = {
	dateRange: undefined,
	vehicleIds: [],
	customerIds: [],
	routeIds: [],
	batchNos: [],
	anomalyTypes: [],
	severityLevels: []
};

export const filterStore = writable<FilterState>(initialFilters);

export const activeFiltersCount = derived(filterStore, ($filters) => {
	let count = 0;
	if ($filters.dateRange) count++;
	if ($filters.vehicleIds.length) count++;
	if ($filters.customerIds.length) count++;
	if ($filters.routeIds.length) count++;
	if ($filters.batchNos.length) count++;
	if ($filters.anomalyTypes.length) count++;
	if ($filters.severityLevels.length) count++;
	return count;
});

export function resetFilters(): void {
	filterStore.set(initialFilters);
}

export const userStore = writable<User | null>(null);

export const isAuthenticated = derived(userStore, ($user) => !!$user);

export const userRole = derived(userStore, ($user) => $user?.role || null);

export const savedViewsStore = writable<SavedView[]>([]);

export const loadingStore = writable<boolean>(false);

export const toastStore = writable<{
	message: string;
	type: 'success' | 'error' | 'info' | 'warning';
} | null>(null);

let toastTimer: NodeJS.Timeout | null = null;

export function showToast(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info'): void {
	if (toastTimer) clearTimeout(toastTimer);
	toastStore.set({ message, type });
	toastTimer = setTimeout(() => {
		toastStore.set(null);
	}, 3000);
}

export const sidebarCollapsed = writable<boolean>(false);
