import { writable, get } from 'svelte/store';
import type { FilterState } from './types';

const initial: FilterState = {
	dateRange: ['2025-01-01', '2025-06-30'],
	chapters: [],
	versions: [],
	course: 'all'
};

function createFilterStore() {
	const { subscribe, set, update } = writable<FilterState>(initial);

	const history: FilterState[] = [JSON.parse(JSON.stringify(initial))];
	let historyIndex = 0;

	function pushState(state: FilterState) {
		history.splice(historyIndex + 1);
		history.push(JSON.parse(JSON.stringify(state)));
		historyIndex = history.length - 1;
	}

	return {
		subscribe,
		set: (val: FilterState) => {
			pushState(val);
			set(val);
		},
		update: (fn: (s: FilterState) => FilterState) => {
			update((s) => {
				const next = fn(s);
				pushState(next);
				return next;
			});
		},
		reset: () => {
			const fresh = JSON.parse(JSON.stringify(initial));
			pushState(fresh);
			set(fresh);
		},
		undo: () => {
			if (historyIndex > 0) {
				historyIndex--;
				set(JSON.parse(JSON.stringify(history[historyIndex])));
			}
		},
		redo: () => {
			if (historyIndex < history.length - 1) {
				historyIndex++;
				set(JSON.parse(JSON.stringify(history[historyIndex])));
			}
		},
		getCurrent: () => get({ subscribe })
	};
}

export const filterStore = createFilterStore();

export const isInternalAccount = writable(false);

export const selectedVersion = writable<string>('latest');

export const globalLoading = writable(false);
