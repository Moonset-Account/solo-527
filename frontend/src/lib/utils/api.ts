import { get } from 'svelte/store';
import { auth } from '../stores/auth';
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

function getHeaders(): Record<string, string> {
	const token = get(auth.token);
	const headers: Record<string, string> = {
		'Content-Type': 'application/json'
	};
	if (token) {
		headers['Authorization'] = `Bearer ${token}`;
	}
	return headers;
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
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

	return res.json();
}

export const api = {
	login: (data: LoginRequest): Promise<LoginResponse> =>
		request('/auth/login', {
			method: 'POST',
			body: JSON.stringify(data)
		}),

	getCurrentUser: (): Promise<User> => request('/auth/me'),
	getUsers: (): Promise<User[]> => request('/users'),

	receiveBatch: (data: any): Promise<VaccineBatch> =>
		request('/batches/receive', {
			method: 'POST',
			body: JSON.stringify(data)
		}),

	getBatches: (params?: { status?: string; date?: string }): Promise<VaccineBatch[]> => {
		const query = new URLSearchParams();
		if (params?.status) query.set('status', params.status);
		if (params?.date) query.set('date', params.date);
		return request(`/batches?${query.toString()}`);
	},

	getBatch: (id: number): Promise<VaccineBatch> => request(`/batches/${id}`),

	isolateBatch: (data: { batch_id: number; reason: string }): Promise<any> =>
		request('/batches/isolate', {
			method: 'POST',
			body: JSON.stringify(data)
		}),

	restoreBatch: (id: number): Promise<any> =>
		request(`/batches/${id}/restore`, { method: 'POST' }),

	getExpiringBatches: (days = 7): Promise<VaccineBatch[]> =>
		request(`/batches/expiring?days=${days}`),

	getAbnormalBatches: (): Promise<AbnormalData> => request('/batches/abnormal'),

	createHandover: (data: any): Promise<HandoverRecord> =>
		request('/handover', {
			method: 'POST',
			body: JSON.stringify(data)
		}),

	getHandoverRecords: (params?: { date?: string; status?: string }): Promise<HandoverRecord[]> => {
		const query = new URLSearchParams();
		if (params?.date) query.set('date', params.date);
		if (params?.status) query.set('status', params.status);
		return request(`/handover?${query.toString()}`);
	},

	getHandoverRecord: (id: number): Promise<HandoverRecord> => request(`/handover/${id}`),

	handleHandoverFailure: (data: any): Promise<any> =>
		request('/handover/failure', {
			method: 'POST',
			body: JSON.stringify(data)
		}),

	getTodayStats: (): Promise<StatsData> => request('/stats/today'),

	uploadAttachment: (formData: FormData): Promise<any> => {
		const token = get(auth.token);
		return fetch(`${API_BASE}/batches/attachments`, {
			method: 'POST',
			headers: token ? { Authorization: `Bearer ${token}` } : {},
			body: formData
		}).then((r) => r.json());
	},

	getBatchAttachments: (batchId: number): Promise<TempAttachment[]> =>
		request(`/batches/${batchId}/attachments`),

	downloadAttachment: (id: number): string => `${API_BASE}/attachments/${id}/download`
};
