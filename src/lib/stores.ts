import { writable, derived } from 'svelte/store';
import { DEFAULT_FILTER, type FilterState, type Annotation } from './types';

export const filterStore = writable<FilterState>({ ...DEFAULT_FILTER });

export const annotationsStore = writable<Annotation[]>([]);

export function addAnnotation(annotation: Omit<Annotation, 'id' | 'created_at'>) {
	annotationsStore.update((list) => [
		...list,
		{
			...annotation,
			id: `A${Date.now()}`,
			created_at: new Date().toISOString()
		}
	]);
}

export const isFilterActive = derived(filterStore, ($f) => {
	return (
		$f.districts.length > 0 ||
		$f.plantTypes.length > 0 ||
		$f.taskTypes.length > 0 ||
		$f.teams.length > 0 ||
		($f.dateRange[0] !== '' && $f.dateRange[1] !== '')
	);
});

export function resetFilter() {
	filterStore.set({ ...DEFAULT_FILTER });
}
