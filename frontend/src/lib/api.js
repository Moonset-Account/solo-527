const API_BASE = '/api';

function getToken() {
	return localStorage.getItem('token') || '';
}

async function request(url, options = {}) {
	const headers = {
		'Content-Type': 'application/json',
		...options.headers
	};
	if (getToken()) {
		headers['Authorization'] = getToken();
	}

	const res = await fetch(`${API_BASE}${url}`, {
		...options,
		headers
	});

	if (res.status === 401) {
		localStorage.removeItem('token');
		localStorage.removeItem('user');
		window.location.href = '/login';
		throw new Error('未登录');
	}

	const data = await res.json().catch(() => ({}));
	if (!res.ok) {
		throw new Error(data.error || '请求失败');
	}
	return data;
}

export const api = {
	login: (username, password) => request('/auth/login', {
		method: 'POST',
		body: JSON.stringify({ username, password })
	}),

	logout: () => request('/auth/logout', { method: 'POST' }),

	getCurrentUser: () => request('/auth/me'),

	getTeams: () => request('/teams'),

	getHolidays: (year) => request(`/holidays?year=${year || ''}`),

	getTimeSlots: (dayType, isNoise) => request(`/time-slots?day_type=${dayType}&is_noise=${isNoise}`),

	checkNoiseDate: (date) => request(`/check-noise-date?date=${date}`),

	createApplication: (data) => request('/applications', {
		method: 'POST',
		body: JSON.stringify(data)
	}),

	getApplications: (params = {}) => {
		const query = new URLSearchParams(params).toString();
		return request(`/applications?${query}`);
	},

	getApplication: (id) => request(`/applications/${id}`),

	updateApplication: (id, data) => request(`/applications/${id}`, {
		method: 'PUT',
		body: JSON.stringify(data)
	}),

	reviewApplication: (id, status, comment) => request(`/applications/${id}/review`, {
		method: 'POST',
		body: JSON.stringify({ status, comment })
	}),

	createViolation: (data) => request('/violations', {
		method: 'POST',
		body: JSON.stringify(data)
	}),

	getViolations: (params = {}) => {
		const query = new URLSearchParams(params).toString();
		return request(`/violations?${query}`);
	},

	handleViolation: (id, comment) => request(`/violations/${id}/handle`, {
		method: 'POST',
		body: JSON.stringify({ comment })
	}),

	verifyQR: (qrCode) => request('/gate/verify', {
		method: 'POST',
		body: JSON.stringify({ qr_code: qrCode })
	}),

	getVerificationRecords: (params = {}) => {
		const query = new URLSearchParams(params).toString();
		return request(`/gate/records?${query}`);
	},

	getNotifications: () => request('/notifications'),

	markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: 'POST' }),

	getAuditLogs: (params = {}) => {
		const query = new URLSearchParams(params).toString();
		return request(`/audit/logs?${query}`);
	}
};

export function getUser() {
	try {
		return JSON.parse(localStorage.getItem('user') || 'null');
	} catch {
		return null;
	}
}

export function setAuth(token, user) {
	localStorage.setItem('token', token);
	localStorage.setItem('user', JSON.stringify(user));
}

export function clearAuth() {
	localStorage.removeItem('token');
	localStorage.removeItem('user');
}

export const statusText = {
	pending: '待审核',
	manual_review: '待人工复核',
	approved: '已通过',
	rejected: '已拒绝',
	returned: '已退回修改',
	open: '待处理',
	closed: '已处理'
};

export const statusColor = {
	pending: '#f59e0b',
	manual_review: '#8b5cf6',
	approved: '#10b981',
	rejected: '#ef4444',
	returned: '#f97316',
	open: '#ef4444',
	closed: '#6b7280'
};
