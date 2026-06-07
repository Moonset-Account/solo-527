import { writable, derived } from 'svelte/store';
import type { FilterState, SavedView, User, Shipment, TemperatureRecord, AnomalyRecord, Vehicle, Customer, Route, Container } from '$lib/types';
import { generateMockData } from '$lib/data/mockData';

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

const mockData = generateMockData();

export const shipmentsStore = writable<Shipment[]>(mockData.shipments);

export const temperatureRecordsStore = writable<TemperatureRecord[]>(mockData.temperatureRecords);

export const locationRecordsStore = writable<any[]>(mockData.locationRecords);

export const anomalyRecordsStore = writable<AnomalyRecord[]>(mockData.anomalyRecords);

export const vehiclesStore = writable<Vehicle[]>(mockData.vehicles);

export const customersStore = writable<Customer[]>(mockData.customers);

export const routesStore = writable<Route[]>(mockData.routes);

export const containersStore = writable<Container[]>(mockData.containers);

export const savedViewsStore = writable<SavedView[]>([]);

function loadSavedViews(): void {
	try {
		const saved = localStorage.getItem('savedViews');
		if (saved) {
			savedViewsStore.set(JSON.parse(saved));
		}
	} catch (e) {
		console.warn('Failed to load saved views:', e);
	}
}

if (typeof window !== 'undefined') {
	loadSavedViews();
}

export const loadingStore = writable<boolean>(false);

export const toastStore = writable<{
	message: string;
	type: 'success' | 'error' | 'info' | 'warning';
} | null>(null);

let toastTimer: any = null;

export function showToast(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info'): void {
	if (toastTimer) clearTimeout(toastTimer);
	toastStore.set({ message, type });
	toastTimer = setTimeout(() => {
		toastStore.set(null);
	}, 3000);
}

export const sidebarCollapsed = writable<boolean>(false);

export const filteredShipments = derived(
	[shipmentsStore, filterStore, userStore],
	([$shipments, $filters, $user]) => {
		let result = [...$shipments];

		if ($user?.role === 'customer' && $user.customerId) {
			result = result.filter((s) => s.customerId === $user.customerId);
		}

		if ($filters.vehicleIds.length > 0) {
			result = result.filter((s) => $filters.vehicleIds.includes(s.vehicleId));
		}

		if ($filters.customerIds.length > 0) {
			result = result.filter((s) => $filters.customerIds.includes(s.customerId));
		}

		if ($filters.routeIds.length > 0) {
			result = result.filter((s) => $filters.routeIds.includes(s.routeId));
		}

		if ($filters.batchNos.length > 0) {
			result = result.filter((s) => $filters.batchNos.includes(s.batchNo));
		}

		return result;
	}
);

export const filteredAnomalies = derived(
	[anomalyRecordsStore, filterStore, userStore, shipmentsStore],
	([$anomalies, $filters, $user, $shipments]) => {
		let result = [...$anomalies];

		const shipmentMap = new Map($shipments.map((s) => [s.id, s]));

		if ($user?.role === 'customer' && $user.customerId) {
			result = result.filter((a) => {
				const shipment = shipmentMap.get(a.shipmentId);
				return shipment?.customerId === $user.customerId;
			});
		}

		if ($filters.anomalyTypes.length > 0) {
			result = result.filter((a) => $filters.anomalyTypes.includes(a.anomalyType));
		}

		if ($filters.severityLevels.length > 0) {
			result = result.filter((a) => $filters.severityLevels.includes(a.severity));
		}

		if ($filters.vehicleIds.length > 0) {
			result = result.filter((a) => {
				const shipment = shipmentMap.get(a.shipmentId);
				return shipment ? $filters.vehicleIds.includes(shipment.vehicleId) : false;
			});
		}

		return result;
	}
);
