import { writable, derived } from 'svelte/store';
import type { FilterState } from '@/lib/types';

function getDefaultDateRange(): { start: string; end: string } {
	const end = new Date();
	const start = new Date();
	start.setDate(start.getDate() - 14);
	return {
		start: start.toISOString().split('T')[0],
		end: end.toISOString().split('T')[0]
	};
}

const defaultRange = getDefaultDateRange();

const initialState: FilterState = {
	startDate: defaultRange.start,
	endDate: defaultRange.end,
	channels: [],
	versions: [],
	customerLevels: [],
	intentTags: []
};

function createFilterStore() {
	const { subscribe, set, update } = writable<FilterState>(initialState);

	return {
		subscribe,
		setDateRange: (startDate: string, endDate: string) =>
			update((state) => ({ ...state, startDate, endDate })),
		setChannels: (channels: string[]) => update((state) => ({ ...state, channels })),
		setVersions: (versions: string[]) => update((state) => ({ ...state, versions })),
		setCustomerLevels: (customerLevels: string[]) =>
			update((state) => ({ ...state, customerLevels })),
		setIntentTags: (intentTags: string[]) => update((state) => ({ ...state, intentTags })),
		reset: () => set(initialState)
	};
}

export const filterStore = createFilterStore();

export const activeFilterCount = derived(filterStore, ($filters) => {
	let count = 0;
	if ($filters.channels.length > 0) count++;
	if ($filters.versions.length > 0) count++;
	if ($filters.customerLevels.length > 0) count++;
	if ($filters.intentTags.length > 0) count++;
	return count;
});
