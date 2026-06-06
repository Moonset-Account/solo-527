import { get, writable } from 'svelte/store';
import { authToken, refreshTrigger } from '../stores/auth';
import { OfflineCache, OfflineQueue, isOnline } from './offline';
import type {
	LoginRequest,
	LoginResponse,
	User,
	VaccineBatch,
	HandoverRecord,
	TempAttachment,
	AbnormalData,
	StatsData
} from '../types';

const API_BASE = '/api';

export const offlineQueueCount = writable(OfflineQueue.count());
export const online = writable(typeof navigator !== 'undefined' ? navigator.onLine : true);
export const syncStatus = writable('idle');
export const lastSyncTime = writable(null);

if (typeof window !== 'undefined') {
	window.addEventListener('online', () => {
		online.set(true);
		processOfflineQueue();
	});
	window.addEventListener('offline', () => online.set(false));
	window.addEventListener('offline-queue-changed', (e: any) => {
		offlineQueueCount.set(e.detail.count);
	});
}

function getHeaders(): Record<string, string> {
	const token = get(authToken);
	const headers: Record<string, string> = {
		'Content-Type': 'application/json'
	};
	if (token) {
		headers['Authorization'] = `Bearer ${token}`;
	}
	return headers;
}

async function request<T>(url: string, options: RequestInit = {}, cacheKey?: string, cacheTtl = 30): Promise<T> {
	const isGet = !options.method || options.method === 'GET';
	const useCache = isGet && cacheKey && typeof localStorage !== 'undefined';

	if (useCache) {
		const cached = OfflineCache.get<T>(cacheKey);
		if (cached) {
			requestFresh(url, options, cacheKey).catch(() => {});
			return cached;
		}
	}

	if (!isOnline() && !isGet) {
		throw new Error('OFFLINE');
	}

	return requestFresh(url, options, cacheKey);
}

async function requestFresh<T>(url: string, options: RequestInit = {}, cacheKey?: string): Promise<T> {
	const res = await fetch(`${API_BASE}${url}`, {
		...options,
		headers: {
			...getHeaders(),
			...(options.headers || {})
		}
	});

	if (!res.ok) {
		const err = await res.json().catch(() => ({ error: '请求失败' }));
		throw new Error(err.error || `HTTP ${res.status}`);
	}

	const data = await res.json();

	if (cacheKey && (!options.method || options.method === 'GET')) {
		OfflineCache.set(cacheKey, data, 30);
	}

	return data;
}

function enqueueOffline(type: string, payload: any): void {
	OfflineQueue.enqueue({
		type,
		payload,
		timestamp: Date.now()
	});
	offlineQueueCount.set(OfflineQueue.count());
	if (typeof window !== 'undefined') {
		window.dispatchEvent(new CustomEvent('offline-enqueued', { detail: { type, count: OfflineQueue.count() } }));
	}
}

export async function processOfflineQueue(): Promise<void> {
	if (!isOnline()) return;

	syncStatus.set('syncing');

	let item = OfflineQueue.dequeue();
	let syncedCount = 0;

	while (item) {
		try {
			switch (item.type) {
				case 'receiveBatch':
					await requestFresh('/batches/receive', {
						method: 'POST',
						body: JSON.stringify(item.payload)
					});
					break;
				case 'createHandover':
					await requestFresh('/handover', {
						method: 'POST',
						body: JSON.stringify(item.payload)
					});
					break;
				case 'isolateBatch':
					await requestFresh('/batches/isolate', {
						method: 'POST',
						body: JSON.stringify(item.payload)
					});
					break;
				case 'handleHandoverFailure':
					await requestFresh('/handover/failure', {
						method: 'POST',
						body: JSON.stringify(item.payload)
					});
					break;
			}
			syncedCount++;
		} catch (e) {
			console.error('Offline queue item failed:', e);
			OfflineQueue.enqueue(item);
			syncStatus.set('error');
			break;
		}
		item = OfflineQueue.dequeue();
	}

	offlineQueueCount.set(OfflineQueue.count());
	lastSyncTime.set(new Date());

	if (OfflineQueue.count() === 0 && syncedCount > 0) {
		OfflineCache.clearAll();
		syncStatus.set('synced');
		refreshTrigger.update((n) => n + 1);
		if (typeof window !== 'undefined') {
			window.dispatchEvent(new CustomEvent('offline-synced', { detail: { count: syncedCount } }));
			window.dispatchEvent(new CustomEvent('offline-cache-cleared'));
		}
		setTimeout(() => syncStatus.set('idle'), 3000);
	} else if (syncedCount === 0) {
		syncStatus.set('idle');
	}
}

export const api = {
	login: (data: LoginRequest): Promise<LoginResponse> =>
		request('/auth/login', {
			method: 'POST',
			body: JSON.stringify(data)
		}),

	getCurrentUser: (): Promise<User> => request('/auth/me', {}, 'auth_me', 60),
	getUsers: (): Promise<User[]> => request('/users', {}, 'users', 120),

	receiveBatch: (data: any): Promise<VaccineBatch> => {
		if (!isOnline()) {
			enqueueOffline('receiveBatch', data);
			return Promise.resolve({
				id: Date.now(),
				...data,
				status: 'pending',
				created_at: new Date().toISOString(),
				offline: true
			} as VaccineBatch);
		}
		return request('/batches/receive', {
			method: 'POST',
			body: JSON.stringify(data)
		}).then(r => {
			OfflineCache.remove('batches');
			OfflineCache.remove('stats_today');
			return r;
		});
	},

	getBatches: (params?: { status?: string; date?: string }): Promise<VaccineBatch[]> => {
		const query = new URLSearchParams();
		if (params?.status) query.set('status', params.status);
		if (params?.date) query.set('date', params.date);
		const key = `batches_${query.toString()}`;
		return request(`/batches?${query.toString()}`, {}, key, 15);
	},

	getBatch: (id: number): Promise<VaccineBatch> =>
		request(`/batches/${id}`, {}, `batch_${id}`, 15),

	isolateBatch: (data: { batch_id: number; reason: string }): Promise<any> => {
		if (!isOnline()) {
			enqueueOffline('isolateBatch', data);
			return Promise.resolve({ success: true, offline: true });
		}
		return request('/batches/isolate', {
			method: 'POST',
			body: JSON.stringify(data)
		}).then(r => {
			OfflineCache.remove(`batch_${data.batch_id}`);
			OfflineCache.remove('batches');
			OfflineCache.remove('batches_abnormal');
			return r;
		});
	},

	restoreBatch: (id: number): Promise<any> =>
		request(`/batches/${id}/restore`, { method: 'POST' }).then(r => {
			OfflineCache.remove(`batch_${id}`);
			OfflineCache.remove('batches');
			OfflineCache.remove('batches_abnormal');
			return r;
		}),

	getExpiringBatches: (days = 7): Promise<VaccineBatch[]> =>
		request(`/batches/expiring?days=${days}`, {}, `batches_expiring_${days}`, 60),

	getAbnormalBatches: (): Promise<AbnormalData> =>
		request('/batches/abnormal', {}, 'batches_abnormal', 10),

	createHandover: (data: any): Promise<HandoverRecord> => {
		if (!isOnline()) {
			enqueueOffline('createHandover', data);
			return Promise.resolve({
				id: Date.now(),
				...data,
				status: 'pending',
				handover_at: new Date().toISOString(),
				offline: true
			} as HandoverRecord);
		}
		return request('/handover', {
			method: 'POST',
			body: JSON.stringify(data)
		}).then(r => {
			OfflineCache.remove('handover');
			OfflineCache.remove('stats_today');
			return r;
		});
	},

	getHandoverRecords: (params?: { date?: string; status?: string }): Promise<HandoverRecord[]> => {
		const query = new URLSearchParams();
		if (params?.date) query.set('date', params.date);
		if (params?.status) query.set('status', params.status);
		const key = `handover_${query.toString()}`;
		return request(`/handover?${query.toString()}`, {}, key, 15);
	},

	getHandoverRecord: (id: number): Promise<HandoverRecord> =>
		request(`/handover/${id}`, {}, `handover_${id}`, 15),

	handleHandoverFailure: (data: any): Promise<any> => {
		if (!isOnline()) {
			enqueueOffline('handleHandoverFailure', data);
			return Promise.resolve({ success: true, offline: true });
		}
		return request('/handover/failure', {
			method: 'POST',
			body: JSON.stringify(data)
		}).then(r => {
			OfflineCache.remove(`handover_${data.handover_id}`);
			OfflineCache.remove('handover');
			return r;
		});
	},

	getTodayStats: (): Promise<StatsData> =>
		request('/stats/today', {}, 'stats_today', 10),

	uploadAttachment: (formData: FormData): Promise<any> => {
		const token = get(authToken);
		return fetch(`${API_BASE}/batches/attachments`, {
			method: 'POST',
			headers: token ? { Authorization: `Bearer ${token}` } : {},
			body: formData
		}).then((r) => r.json());
	},

	getBatchAttachments: (batchId: number): Promise<TempAttachment[]> =>
		request(`/batches/${batchId}/attachments`, {}, `attachments_${batchId}`, 30),

	downloadAttachment: (id: number): string => `${API_BASE}/attachments/${id}/download`
};
