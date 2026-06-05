const API_BASE = '/api';

export interface User {
	id: number;
	username: string;
	role: 'admin' | 'pharmacist' | 'window';
	name: string;
}

export interface Medicine {
	id: number;
	name: string;
	code: string;
}

export interface Batch {
	id: number;
	batch_no: string;
	quantity: number;
	expiry_date: string;
	medicine_name: string;
	medicine_code?: string;
}

export interface PrescriptionItem {
	id: number;
	medicine_name: string;
	medicine_code: string;
	batch_no: string;
	quantity: number;
	accept_alternative: boolean;
	alternative_batch_no?: string;
}

export interface Prescription {
	id: number;
	prescription_no: string;
	patient_name: string;
	patient_phone: string;
	status: string;
	pick_up_time: string;
	expiry_date: string;
	queue_no?: number;
	window_id?: number;
	created_at: string;
	is_manual_entry: boolean;
	manual_entry_by?: string;
	manual_entry_at?: string;
	manual_entry_reason?: string;
}

export interface QueueItem {
	id: number;
	queue_no: number;
	status: string;
	prescription_no: string;
	patient_name: string;
	window_no?: string;
	called_at?: string;
}

export interface Window {
	id: number;
	window_no: string;
	name: string;
	is_active: boolean;
}

export interface RestockTodo {
	id: number;
	medicine_name: string;
	batch_no?: string;
	quantity_needed: number;
	status: string;
	created_at: string;
	created_by: string;
	notes?: string;
	completed_at?: string;
	completed_by?: string;
}

function getHeaders(): HeadersInit {
	const token = localStorage.getItem('token');
	return {
		'Content-Type': 'application/json',
		...(token ? { Authorization: `Bearer ${token}` } : {})
	};
}

async function handleResponse<T>(res: Response): Promise<T> {
	if (res.status === 401) {
		localStorage.removeItem('token');
		localStorage.removeItem('user');
		window.location.href = '/login';
	}
	if (!res.ok) {
		const err = await res.json().catch(() => ({ error: '请求失败' }));
		throw new Error(err.error || '请求失败');
	}
	return res.json();
}

export const api = {
	login: async (username: string, password: string): Promise<{ token: string; user: User }> => {
		const res = await fetch(`${API_BASE}/auth/login`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ username, password })
		});
		return handleResponse(res);
	},

	getCurrentUser: async (): Promise<User> => {
		const res = await fetch(`${API_BASE}/auth/me`, { headers: getHeaders() });
		return handleResponse(res);
	},

	getPrescriptions: async (status?: string): Promise<{ prescriptions: Prescription[] }> => {
		const url = new URL(`${API_BASE}/prescriptions`);
		if (status) url.searchParams.set('status', status);
		const res = await fetch(url.toString(), { headers: getHeaders() });
		return handleResponse(res);
	},

	getPrescription: async (no: string): Promise<{ prescription: Prescription; items: PrescriptionItem[]; ahead_count: number }> => {
		const res = await fetch(`${API_BASE}/prescriptions/${no}`, { headers: getHeaders() });
		return handleResponse(res);
	},

	createPrescription: async (data: any): Promise<any> => {
		const res = await fetch(`${API_BASE}/prescriptions`, {
			method: 'POST',
			headers: getHeaders(),
			body: JSON.stringify(data)
		});
		return handleResponse(res);
	},

	enqueuePrescription: async (id: number): Promise<any> => {
		const res = await fetch(`${API_BASE}/prescriptions/${id}/enqueue`, {
			method: 'POST',
			headers: getHeaders()
		});
		return handleResponse(res);
	},

	cancelPrescription: async (id: number): Promise<any> => {
		const res = await fetch(`${API_BASE}/prescriptions/${id}/cancel`, {
			method: 'POST',
			headers: getHeaders()
		});
		return handleResponse(res);
	},

	reschedulePrescription: async (id: number, newPickUpTime: string, reason: string): Promise<any> => {
		const res = await fetch(`${API_BASE}/prescriptions/${id}/reschedule`, {
			method: 'POST',
			headers: getHeaders(),
			body: JSON.stringify({ new_pick_up_time: newPickUpTime, reason })
		});
		return handleResponse(res);
	},

	getMedicines: async (): Promise<{ medicines: Medicine[] }> => {
		const res = await fetch(`${API_BASE}/medicines`, { headers: getHeaders() });
		return handleResponse(res);
	},

	getMedicineBatches: async (medicineId: number): Promise<{ batches: Batch[] }> => {
		const res = await fetch(`${API_BASE}/medicines/${medicineId}/batches`, { headers: getHeaders() });
		return handleResponse(res);
	},

	getAllBatches: async (): Promise<{ batches: Batch[] }> => {
		const res = await fetch(`${API_BASE}/batches`, { headers: getHeaders() });
		return handleResponse(res);
	},

	getQueueStatus: async (): Promise<{ date: string; waiting_count: number; called_count: number; completed_count: number; queue: QueueItem[] }> => {
		const res = await fetch(`${API_BASE}/queue/status`, { headers: getHeaders() });
		return handleResponse(res);
	},

	getWindows: async (): Promise<{ windows: Window[] }> => {
		const res = await fetch(`${API_BASE}/windows`, { headers: getHeaders() });
		return handleResponse(res);
	},

	callNext: async (windowId: number): Promise<any> => {
		const res = await fetch(`${API_BASE}/window/call-next`, {
			method: 'POST',
			headers: getHeaders(),
			body: JSON.stringify({ window_id: windowId })
		});
		return handleResponse(res);
	},

	dispense: async (prescriptionId: number): Promise<any> => {
		const res = await fetch(`${API_BASE}/window/dispense`, {
			method: 'POST',
			headers: getHeaders(),
			body: JSON.stringify({ prescription_id: prescriptionId })
		});
		return handleResponse(res);
	},

	confirmAlternative: async (itemId: number, alternativeBatchId: number, acceptAlternative: boolean): Promise<any> => {
		const res = await fetch(`${API_BASE}/prescription-items/${itemId}/confirm-alternative`, {
			method: 'POST',
			headers: getHeaders(),
			body: JSON.stringify({ alternative_batch_id: alternativeBatchId, accept_alternative: acceptAlternative })
		});
		return handleResponse(res);
	},

	getRestockTodos: async (status?: string): Promise<{ restock_todos: RestockTodo[] }> => {
		const url = new URL(`${API_BASE}/restock-todos`);
		if (status) url.searchParams.set('status', status);
		const res = await fetch(url.toString(), { headers: getHeaders() });
		return handleResponse(res);
	},

	completeRestockTodo: async (id: number, quantityAdded: number): Promise<any> => {
		const res = await fetch(`${API_BASE}/restock-todos/${id}/complete`, {
			method: 'POST',
			headers: getHeaders(),
			body: JSON.stringify({ quantity_added: quantityAdded })
		});
		return handleResponse(res);
	},

	createBackup: async (): Promise<any> => {
		const res = await fetch(`${API_BASE}/backups`, {
			method: 'POST',
			headers: getHeaders()
		});
		return handleResponse(res);
	},

	getBackupRecords: async (): Promise<any> => {
		const res = await fetch(`${API_BASE}/backups`, { headers: getHeaders() });
		return handleResponse(res);
	},

	getSmsNotifications: async (): Promise<any> => {
		const res = await fetch(`${API_BASE}/sms-notifications`, { headers: getHeaders() });
		return handleResponse(res);
	}
};
