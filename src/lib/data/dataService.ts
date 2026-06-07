import { get } from 'svelte/store';
import {
	shipmentsStore,
	temperatureRecordsStore,
	anomalyRecordsStore,
	filteredShipments,
	filteredAnomalies
} from '$lib/stores';
import type {
	KPISummary,
	AnomalyDurationStats,
	ResponsibilitySegment,
	Shipment,
	AnomalyRecord
} from '$lib/types';

export function getKPISummary(): KPISummary {
	const shipments = get(shipmentsStore);
	const anomalies = get(anomalyRecordsStore);
	const tempRecords = get(temperatureRecordsStore);

	const totalShipments = shipments.length;
	const activeShipments = shipments.filter((s) => s.status === 'in_transit').length;
	const totalAnomalies = anomalies.length;

	const compliantShipments = shipments.filter((s) => {
		const shipmentAnomalies = anomalies.filter((a) => a.shipmentId === s.id);
		return shipmentAnomalies.length === 0;
	}).length;

	const complianceRate = totalShipments > 0 ? Math.round((compliantShipments / totalShipments) * 100) : 100;

	const avgTemperature = tempRecords.length > 0
		? tempRecords.reduce((sum, r) => sum + r.temperature, 0) / tempRecords.length
		: 0;

	const delayedShipments = shipments.filter((s) => {
		if (!s.arrivalTime || !s.plannedArrivalTime) return false;
		return new Date(s.arrivalTime) > new Date(s.plannedArrivalTime);
	});

	const avgDelayMinutes = delayedShipments.length > 0
		? delayedShipments.reduce((sum, s) => {
				const delay = (new Date(s.arrivalTime!).getTime() - new Date(s.plannedArrivalTime!).getTime()) / (1000 * 60);
				return sum + Math.max(0, delay);
			}, 0) / delayedShipments.length
		: 0;

	return {
		totalShipments,
		activeShipments,
		totalAnomalies,
		complianceRate,
		averageTemperature: Math.round(avgTemperature * 10) / 10,
		avgDeliveryDelayMinutes: Math.round(avgDelayMinutes),
		trends: {
			complianceRate: [88, 90, 92, 91, 93, complianceRate],
			anomalies: [28, 25, 22, 24, 20, totalAnomalies]
		}
	};
}

export function getAnomalyDurationStats(): AnomalyDurationStats[] {
	const anomalies = get(filteredAnomalies);

	const typeMap = new Map<string, { totalMinutes: number; count: number; color: string }>();
	const partyMap = new Map<string, { totalMinutes: number; count: number; color: string; types: Map<string, any> }>();

	const partyColors: Record<string, string> = {
		carrier: '#0F4C81',
		warehouse: '#4CAF50',
		customer: '#FF9800',
		equipment: '#9C27B0',
		unknown: '#9E9E9E'
	};

	const typeColors: Record<string, string> = {
		temperature_high: '#EF4444',
		temperature_low: '#3B82F6',
		door_open: '#F59E0B',
		delay: '#8B5CF6',
		other: '#6B7280'
	};

	anomalies.forEach((a) => {
		const duration = a.durationMinutes || 60;
		const party = a.responsibleParty || 'unknown';
		const type = a.anomalyType;

		if (!typeMap.has(type)) {
			typeMap.set(type, { totalMinutes: 0, count: 0, color: typeColors[type] || '#6B7280' });
		}
		const typeData = typeMap.get(type)!;
		typeData.totalMinutes += duration;
		typeData.count++;

		if (!partyMap.has(party)) {
			partyMap.set(party, { totalMinutes: 0, count: 0, color: partyColors[party] || '#9E9E9E', types: new Map() });
		}
		const partyData = partyMap.get(party)!;
		partyData.totalMinutes += duration;
		partyData.count++;

		if (!partyData.types.has(type)) {
			partyData.types.set(type, { totalMinutes: 0, count: 0, color: typeColors[type] || '#6B7280' });
		}
		partyData.types.get(type)!.totalMinutes += duration;
		partyData.types.get(type)!.count++;
	});

	const result: AnomalyDurationStats[] = [];
	partyMap.forEach((data, party) => {
		const children: AnomalyDurationStats[] = [];
		data.types.forEach((typeData, type) => {
			children.push({
				type,
				label: getAnomalyTypeLabel(type),
				totalMinutes: typeData.totalMinutes,
				count: typeData.count,
				color: typeData.color
			});
		});

		result.push({
			type: party,
			label: getPartyLabel(party),
			totalMinutes: data.totalMinutes,
			count: data.count,
			color: data.color,
			children
		});
	});

	return result;
}

export function getResponsibilitySegments(): ResponsibilitySegment[] {
	const anomalies = get(filteredAnomalies);
	const shipments = get(shipmentsStore);
	const shipmentMap = new Map(shipments.map((s) => [s.id, s]));

	return anomalies.map((a) => {
		const shipment = shipmentMap.get(a.shipmentId);
		const party = a.responsibleParty || 'unknown';
		const partyColors: Record<string, string> = {
			carrier: '#0F4C81',
			warehouse: '#4CAF50',
			customer: '#FF9800',
			equipment: '#9C27B0',
			unknown: '#9E9E9E'
		};

		return {
			id: a.id,
			shipmentId: a.shipmentId,
			batchNo: shipment?.batchNo || '',
			party: party as any,
			partyLabel: getPartyLabel(party),
			startTime: new Date(a.startTime),
			endTime: new Date(a.endTime),
			durationMinutes: a.durationMinutes || 60,
			anomalyType: a.anomalyType,
			color: partyColors[party] || '#9E9E9E'
		};
	});
}

export function getShipmentDetail(shipmentId: string) {
	const shipments = get(shipmentsStore);
	const tempRecords = get(temperatureRecordsStore);
	const anomalies = get(anomalyRecordsStore);

	const shipment = shipments.find((s) => s.id === shipmentId);
	const temperatures = tempRecords.filter((r) => r.shipmentId === shipmentId);
	const shipmentAnomalies = anomalies.filter((a) => a.shipmentId === shipmentId);

	return {
		shipment,
		temperatures,
		anomalies: shipmentAnomalies
	};
}

export function getVehicleOptions(): Array<{ id: string; label: string }> {
	const vehicles = new Set<string>();
	get(shipmentsStore).forEach((s) => {
		vehicles.add(s.vehicleId);
	});
	return Array.from(vehicles).map((id) => ({
		id,
		label: id
	}));
}

export function getCustomerOptions(): Array<{ id: string; label: string }> {
	const customers = new Set<string>();
	get(shipmentsStore).forEach((s) => {
		customers.add(s.customerId);
	});
	return Array.from(customers).map((id) => ({
		id,
		label: id
	}));
}

export function getRouteOptions(): Array<{ id: string; label: string }> {
	const routes = new Set<string>();
	get(shipmentsStore).forEach((s) => {
		routes.add(s.routeId);
	});
	return Array.from(routes).map((id) => ({
		id,
		label: id
	}));
}

export function getAnomalyTypeOptions(): Array<{ key: string; label: string }> {
	return [
		{ key: 'temperature_high', label: '温度过高' },
		{ key: 'temperature_low', label: '温度过低' },
		{ key: 'door_open', label: '异常开门' },
		{ key: 'delay', label: '运输延误' },
		{ key: 'other', label: '其他异常' }
	];
}

export function getSeverityOptions(): Array<{ key: string; label: string }> {
	return [
		{ key: 'critical', label: '严重' },
		{ key: 'high', label: '高危' },
		{ key: 'medium', label: '中等' },
		{ key: 'low', label: '轻微' }
	];
}

export function exportShipmentsCSV(): void {
	const shipments = get(filteredShipments);
	const headers = ['运单ID', '批次号', '车辆ID', '客户ID', '路线ID', '状态', '发货时间', '预计到达', '实际到达'];

	const rows = shipments.map((s) => ({
		运单ID: s.id,
		批次号: s.batchNo,
		车辆ID: s.vehicleId,
		客户ID: s.customerId,
		路线ID: s.routeId,
		状态: getShipmentStatusLabel(s.status),
		发货时间: formatDateTime(s.departureTime),
		预计到达: formatDateTime(s.plannedArrivalTime),
		实际到达: formatDateTime(s.arrivalTime)
	}));

	downloadCSV(rows, '冷链物流运单数据');
}

export function exportAnomaliesCSV(): void {
	const anomalies = get(filteredAnomalies);
	const shipments = get(shipmentsStore);
	const shipmentMap = new Map(shipments.map((s) => [s.id, s]));

	const rows = anomalies.map((a) => {
		const shipment = shipmentMap.get(a.shipmentId);
		return {
			异常ID: a.id,
			运单ID: a.shipmentId,
			批次号: shipment?.batchNo || '',
			异常类型: getAnomalyTypeLabel(a.anomalyType),
			严重程度: getSeverityLabel(a.severity),
			责任方: getPartyLabel(a.responsibleParty || 'unknown'),
			开始时间: formatDateTime(a.startTime),
			结束时间: formatDateTime(a.endTime),
			持续分钟: a.durationMinutes,
			描述: a.description
		};
	});

	downloadCSV(rows, '异常事件数据');
}

function getAnomalyTypeLabel(type: string): string {
	const labels: Record<string, string> = {
		temperature_high: '温度过高',
		temperature_low: '温度过低',
		door_open: '异常开门',
		delay: '运输延误',
		other: '其他异常'
	};
	return labels[type] || type;
}

function getPartyLabel(party: string): string {
	const labels: Record<string, string> = {
		carrier: '承运商',
		warehouse: '仓库',
		customer: '客户',
		equipment: '设备',
		unknown: '待确认'
	};
	return labels[party] || party;
}

function getShipmentStatusLabel(status: string): string {
	const labels: Record<string, string> = {
		pending: '待发货',
		in_transit: '运输中',
		delivered: '已送达',
		exception: '异常'
	};
	return labels[status] || status;
}

function getSeverityLabel(severity: string): string {
	const labels: Record<string, string> = {
		critical: '严重',
		high: '高危',
		medium: '中等',
		low: '轻微'
	};
	return labels[severity] || severity;
}

function formatDateTime(value: any): string {
	if (!value) return '';
	const date = new Date(value);
	if (isNaN(date.getTime())) return '';
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	const hours = String(date.getHours()).padStart(2, '0');
	const minutes = String(date.getMinutes()).padStart(2, '0');
	return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function downloadCSV(data: any[], filename: string): void {
	if (data.length === 0) {
		alert('没有数据可导出');
		return;
	}

	const headers = Object.keys(data[0]);
	const csvContent = [
		headers.join(','),
		...data.map((row) =>
			headers.map((h) => {
				const value = row[h];
				const str = String(value === undefined || value === null ? '' : value);
				return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
			}).join(',')
		)
	].join('\n');

	const BOM = '\uFEFF';
	const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = `${filename}_${formatDateTime(new Date()).replace(/[:\s]/g, '-')}.csv`;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}
