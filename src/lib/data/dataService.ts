import { get } from 'svelte/store';
import { savedViewsStore, userStore } from '$lib/stores';
import type {
	SavedView,
	AnomalyDurationStats,
	ResponsibilitySegment,
	KPISummary
} from '$lib/types';

const API_BASE = '/api';

async function apiFetch<T = any>(path: string, options?: RequestInit): Promise<T> {
	const res = await fetch(`${API_BASE}${path}`, options);
	const data = await res.json();
	if (!data.success) {
		throw new Error(data.error || 'API 调用失败');
	}
	return data.data;
}

export async function getKPISummary(): Promise<KPISummary> {
	try {
		const data = await apiFetch<any>('/kpi');
		return {
			totalShipments: data.totalShipments,
			activeShipments: data.activeShipments,
			totalAnomalies: data.totalAnomalies,
			complianceRate: data.complianceRate,
			averageTemperature: data.averageTemperature,
			avgDeliveryDelayMinutes: data.avgDeliveryDelayMinutes,
			trends: data.trends
		};
	} catch (e) {
		console.warn('API 获取 KPI 失败，使用本地数据');
		return {
			totalShipments: 15,
			activeShipments: 0,
			totalAnomalies: 12,
			complianceRate: 92.5,
			averageTemperature: -12.3,
			avgDeliveryDelayMinutes: 18,
			trends: {
				complianceRate: [91.2, 92.8, 90.5, 93.1, 92.5, 91.8, 92.5],
				anomalies: [8, 5, 12, 6, 9, 7, 5]
			}
		};
	}
}

export async function getVehicleOptions(): Promise<{ id: string; label: string }[]> {
	try {
		const data = await apiFetch<any>('/options');
		return data.vehicles || [];
	} catch (e) {
		console.warn('API 获取车辆失败，使用本地数据');
		return [
			{ id: 'v001', label: '京A·12345' },
			{ id: 'v002', label: '京B·67890' },
			{ id: 'v003', label: '沪C·24680' }
		];
	}
}

export async function getCustomerOptions(): Promise<{ id: string; label: string }[]> {
	try {
		const data = await apiFetch<any>('/options');
		return data.customers || [];
	} catch (e) {
		console.warn('API 获取客户失败，使用本地数据');
		return [
			{ id: 'c001', label: '鲜优生鲜' },
			{ id: 'c002', label: '冷链医药' },
			{ id: 'c003', label: '冰淇淋连锁' }
		];
	}
}

export async function getRouteOptions(): Promise<{ id: string; label: string }[]> {
	try {
		const data = await apiFetch<any>('/options');
		return data.routes || [];
	} catch (e) {
		console.warn('API 获取路线失败，使用本地数据');
		return [
			{ id: 'r001', label: '北京-上海' },
			{ id: 'r002', label: '上海-杭州' },
			{ id: 'r003', label: '北京-广州' }
		];
	}
}

export async function getContainerOptions(): Promise<{ id: string; label: string }[]> {
	try {
		const data = await apiFetch<any>('/options');
		return data.containers || [];
	} catch (e) {
		console.warn('API 获取温控箱失败，使用本地数据');
		return [
			{ id: 'ct001', label: 'CNTR-001' },
			{ id: 'ct002', label: 'CNTR-002' }
		];
	}
}

export function getAnomalyDurationStats(): AnomalyDurationStats[] {
	return [
		{ type: 'over_temp', label: '温度超标', totalMinutes: 45 * 18, count: 18, color: '#ef4444' },
		{ type: 'under_temp', label: '温度过低', totalMinutes: 32 * 8, count: 8, color: '#3b82f6' },
		{ type: 'door_open', label: '开门超时', totalMinutes: 28 * 12, count: 12, color: '#f59e0b' },
		{ type: 'probe_error', label: '探头故障', totalMinutes: 15 * 5, count: 5, color: '#8b5cf6' },
		{ type: 'delay', label: '到货延迟', totalMinutes: 65 * 10, count: 10, color: '#10b981' }
	];
}

export function getResponsibilitySegments(): ResponsibilitySegment[] {
	return [
		{ id: 'r1', shipmentId: '', batchNo: '', party: 'carrier', partyLabel: '承运商', startTime: new Date(), endTime: new Date(), durationMinutes: 892, anomalyType: '', color: '#ef4444' },
		{ id: 'r2', shipmentId: '', batchNo: '', party: 'warehouse', partyLabel: '仓库', startTime: new Date(), endTime: new Date(), durationMinutes: 512, anomalyType: '', color: '#f59e0b' },
		{ id: 'r3', shipmentId: '', batchNo: '', party: 'equipment', partyLabel: '设备', startTime: new Date(), endTime: new Date(), durationMinutes: 425, anomalyType: '', color: '#8b5cf6' },
		{ id: 'r4', shipmentId: '', batchNo: '', party: 'customer', partyLabel: '客户', startTime: new Date(), endTime: new Date(), durationMinutes: 180, anomalyType: '', color: '#3b82f6' },
		{ id: 'r5', shipmentId: '', batchNo: '', party: 'unknown', partyLabel: '待确认', startTime: new Date(), endTime: new Date(), durationMinutes: 106, anomalyType: '', color: '#6b7280' }
	];
}

export async function exportShipmentsCSV(shipments: any[]): Promise<void> {
	try {
		const filters = {};
		const url = `/api/export?format=csv&type=shipments&filters=${encodeURIComponent(JSON.stringify(filters))}`;
		window.open(url, '_blank');
	} catch (e) {
		console.warn('API 导出失败，使用本地导出');
		const columns = ['id', 'batchNo', 'vehiclePlate', 'customerName', 'routeName', 'departureTime', 'arrivalTime', 'status'];
		const csv = [
			columns.join(','),
			...shipments.map((s: any) => columns.map((c) => {
				const val = s[c];
				return val ? `"${String(val).replace(/"/g, '""')}"` : '';
			}).join(','))
		].join('\n');

		const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
		const link = document.createElement('a');
		link.href = URL.createObjectURL(blob);
		link.download = `shipments_${new Date().toISOString().slice(0, 10)}.csv`;
		link.click();
	}
}

export async function exportAnomaliesCSV(anomalies: any[]): Promise<void> {
	try {
		const filters = {};
		const url = `/api/export?format=csv&type=anomalies&filters=${encodeURIComponent(JSON.stringify(filters))}`;
		window.open(url, '_blank');
	} catch (e) {
		console.warn('API 导出失败，使用本地导出');
		const columns = ['shipmentId', 'batchNo', 'anomalyType', 'severity', 'durationMinutes', 'startTime', 'status'];
		const csv = [
			columns.join(','),
			...anomalies.map((a: any) => columns.map((c) => {
				const val = a[c];
				return val ? `"${String(val).replace(/"/g, '""')}"` : '';
			}).join(','))
		].join('\n');

		const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
		const link = document.createElement('a');
		link.href = URL.createObjectURL(blob);
		link.download = `anomalies_${new Date().toISOString().slice(0, 10)}.csv`;
		link.click();
	}
}

export async function saveViewToAPI(view: Omit<SavedView, 'id' | 'createdAt'>): Promise<SavedView> {
	try {
		const user = get(userStore);
		const data = await apiFetch<any>('/views', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				...view,
				createdBy: user?.username || 'anonymous'
			})
		});
		return data;
	} catch (e) {
		console.warn('API 保存视图失败，使用本地存储');
		const newView: SavedView = {
			...view,
			id: `view_${Date.now()}`,
			createdAt: new Date().toISOString()
		};
		savedViewsStore.update((views) => [...views, newView]);
		return newView;
	}
}

export async function loadViewsFromAPI(): Promise<SavedView[]> {
	try {
		const data = await apiFetch<any>('/views');
		return data || [];
	} catch (e) {
		console.warn('API 加载视图失败，使用本地存储');
		return get(savedViewsStore);
	}
}

export async function deleteViewFromAPI(id: string): Promise<void> {
	try {
		await apiFetch<any>(`/views?id=${encodeURIComponent(id)}`, {
			method: 'DELETE'
		});
	} catch (e) {
		console.warn('API 删除视图失败，使用本地存储');
		savedViewsStore.update((views) => views.filter((v) => v.id !== id));
	}
}
