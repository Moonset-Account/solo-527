import { get } from 'svelte/store';
import { auth } from '$stores/auth';

const API_BASE = '/api';

async function request(path, options = {}) {
	const authData = get(auth);
	const headers = {
		'Content-Type': 'application/json',
		...options.headers
	};

	if (authData.token) {
		headers['Authorization'] = `Bearer ${authData.token}`;
	}

	const response = await fetch(`${API_BASE}${path}`, {
		...options,
		headers
	});

	if (!response.ok) {
		let error = '请求失败';
		try {
			const data = await response.json();
			error = data.error || error;
		} catch (e) {}
		throw new Error(error);
	}

	if (response.headers.get('content-type')?.includes('text/csv')) {
		return response;
	}

	return response.json();
}

export const api = {
	login: (username, password) =>
		request('/login', {
			method: 'POST',
			body: JSON.stringify({ username, password })
		}),

	getMe: () => request('/me'),

	getSites: () => request('/sites'),

	getRoutes: () => request('/routes'),

	getBoxes: (status = '') => request(`/boxes${status ? `?status=${status}` : ''}`),

	getTasks: (params = {}) => {
		const query = new URLSearchParams(params).toString();
		return request(`/tasks${query ? `?${query}` : ''}`);
	},

	getTask: (id) => request(`/tasks/${id}`),

	createTask: (data) =>
		request('/tasks', {
			method: 'POST',
			body: JSON.stringify(data)
		}),

	signTask: (id, data) =>
		request(`/tasks/${id}/sign`, {
			method: 'POST',
			body: JSON.stringify(data)
		}),

	returnTask: (id, reason) =>
		request(`/tasks/${id}/return`, {
			method: 'POST',
			body: JSON.stringify({ reason })
		}),

	resendTask: (id) =>
		request(`/tasks/${id}/resend`, {
			method: 'POST'
		}),

	reviewTask: (id, approved, note) =>
		request(`/tasks/${id}/review`, {
			method: 'POST',
			body: JSON.stringify({ approved, note })
		}),

	exportTasks: async (params = {}) => {
		const query = new URLSearchParams(params).toString();
		const authData = get(auth);
		const response = await fetch(`${API_BASE}/tasks/export/csv${query ? `?${query}` : ''}`, {
			headers: {
				'Authorization': `Bearer ${authData.token}`
			}
		});
		const blob = await response.blob();
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `cold_chain_tasks_${new Date().toISOString().split('T')[0]}.csv`;
		a.click();
		window.URL.revokeObjectURL(url);
	}
};
