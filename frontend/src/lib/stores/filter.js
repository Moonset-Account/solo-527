import { writable } from 'svelte/store';

const initialFilter = {
	status: '',
	site_id: '',
	box_number: '',
	start_date: '',
	end_date: '',
	page: 1,
	pageSize: 20
};

function createFilterStore() {
	const stored = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('taskFilter') : null;
	const initial = stored ? { ...initialFilter, ...JSON.parse(stored) } : initialFilter;

	const { subscribe, set, update } = writable(initial);

	return {
		subscribe,
		set: (filter) => {
			set(filter);
			if (typeof sessionStorage !== 'undefined') {
				sessionStorage.setItem('taskFilter', JSON.stringify(filter));
			}
		},
		reset: () => {
			set(initialFilter);
			if (typeof sessionStorage !== 'undefined') {
				sessionStorage.removeItem('taskFilter');
			}
		}
	};
}

export const taskFilter = createFilterStore();
