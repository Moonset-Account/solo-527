import { writable } from 'svelte/store';
import { browser } from '$app/environment';

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
	let initial = { ...initialFilter };
	if (browser) {
		const stored = sessionStorage.getItem('taskFilter');
		if (stored) {
			try {
				initial = { ...initialFilter, ...JSON.parse(stored) };
			} catch (e) {}
		}
	}

	const { subscribe, set } = writable(initial);

	return {
		subscribe,
		set: (filter) => {
			set(filter);
			if (browser) {
				sessionStorage.setItem('taskFilter', JSON.stringify(filter));
			}
		},
		reset: () => {
			set(initialFilter);
			if (browser) {
				sessionStorage.removeItem('taskFilter');
			}
		}
	};
}

export const taskFilter = createFilterStore();
