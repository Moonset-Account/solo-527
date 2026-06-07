import { writable, derived } from 'svelte/store';
import type { FilterState, FilterOption, CaliberVersion } from '$lib/types';

function getDefaultDates() {
	const end = new Date();
	const start = new Date();
	start.setMonth(start.getMonth() - 3);
	return {
		startDate: start.toISOString().split('T')[0],
		endDate: end.toISOString().split('T')[0]
	};
}

const defaultDates = getDefaultDates();

export const filters = writable<FilterState>({
	startDate: defaultDates.startDate,
	endDate: defaultDates.endDate,
	activityTypes: [],
	communities: [],
	ageGroups: [],
	channels: [],
	weather: [],
	caliberVersion: 'latest'
});

export const filterOptions = writable<{
	activityTypes: FilterOption[];
	communities: FilterOption[];
	ageGroups: FilterOption[];
	channels: FilterOption[];
	weather: FilterOption[];
	caliberVersions: CaliberVersion[];
}>({
	activityTypes: [],
	communities: [],
	ageGroups: [],
	channels: [],
	weather: [],
	caliberVersions: []
});

export const activeFilterCount = derived(filters, ($f) => {
	return (
		$f.activityTypes.length +
		$f.communities.length +
		$f.ageGroups.length +
		$f.channels.length +
		$f.weather.length
	);
});

export function resetFilters() {
	filters.update((f) => ({
		...f,
		activityTypes: [],
		communities: [],
		ageGroups: [],
		channels: [],
		weather: []
	}));
}
