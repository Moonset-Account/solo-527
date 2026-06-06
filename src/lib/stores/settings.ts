import { writable } from 'svelte/store';
import type { Settings } from '$lib/types';

const defaultSettings: Settings = {
	lowTempThreshold: 60,
	minSampleCount: 3,
	lateDeliveryThreshold: 15,
	exportTimeRange: '06:00-18:00'
};

function createSettingsStore() {
	const { subscribe, set, update } = writable<Settings>(defaultSettings);

	return {
		subscribe,
		updateSettings: (newSettings: Partial<Settings>) =>
			update((current) => ({ ...current, ...newSettings })),
		reset: () => set(defaultSettings)
	};
}

export const settings = createSettingsStore();
