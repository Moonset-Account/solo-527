import type { FunnelRequest, FunnelResponse, ExportRequest } from '$lib/types';

export async function fetchFilters() {
	const res = await fetch('/api/filters', { method: 'POST' });
	if (!res.ok) throw new Error('获取筛选项失败');
	return res.json();
}

export async function fetchFunnel(request: FunnelRequest): Promise<FunnelResponse> {
	const res = await fetch('/api/funnel', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(request)
	});
	if (!res.ok) throw new Error('获取漏斗数据失败');
	return res.json();
}

export async function fetchActivities(request: Partial<FunnelRequest>) {
	const res = await fetch('/api/activities', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(request)
	});
	if (!res.ok) throw new Error('获取活动列表失败');
	return res.json();
}

export async function fetchExport(request: ExportRequest) {
	const res = await fetch('/api/export', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(request)
	});
	if (!res.ok) {
		const err = await res.json();
		throw new Error(err.error || '导出失败');
	}
	return res.json();
}

export function downloadCSV(csvContent: string, filename: string) {
	const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
	const link = document.createElement('a');
	const url = URL.createObjectURL(blob);
	link.setAttribute('href', url);
	link.setAttribute('download', filename);
	link.style.visibility = 'hidden';
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
}
