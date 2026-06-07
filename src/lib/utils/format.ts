export function formatDate(date: Date | string | null | undefined): string {
	if (!date) return '-';
	const d = new Date(date);
	if (isNaN(d.getTime())) return '-';
	return d.toLocaleDateString('zh-CN', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	});
}

export function formatDateTime(date: Date | string | null | undefined): string {
	if (!date) return '-';
	const d = new Date(date);
	if (isNaN(d.getTime())) return '-';
	return d.toLocaleString('zh-CN', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit'
	});
}

export function formatTime(date: Date | string | null | undefined): string {
	if (!date) return '-';
	const d = new Date(date);
	if (isNaN(d.getTime())) return '-';
	return d.toLocaleTimeString('zh-CN', {
		hour: '2-digit',
		minute: '2-digit'
	});
}

export function formatDuration(minutes: number): string {
	if (minutes < 60) return `${Math.round(minutes)} 分钟`;
	const hours = Math.floor(minutes / 60);
	const mins = Math.round(minutes % 60);
	return mins > 0 ? `${hours} 小时 ${mins} 分钟` : `${hours} 小时`;
}

export function formatTemperature(value: number): string {
	return `${value.toFixed(1)}°C`;
}

export function formatPercentage(value: number): string {
	return `${value.toFixed(1)}%`;
}

export function getTemperatureStatus(temp: number): { status: string; color: string } {
	if (temp > 8) return { status: '超温', color: 'text-red-500' };
	if (temp < -25) return { status: '低温', color: 'text-blue-500' };
	return { status: '正常', color: 'text-green-500' };
}

export function getSeverityColor(severity: string): string {
	switch (severity) {
		case 'critical':
			return 'bg-red-100 text-red-800';
		case 'high':
			return 'bg-orange-100 text-orange-800';
		case 'medium':
			return 'bg-yellow-100 text-yellow-800';
		case 'low':
			return 'bg-green-100 text-green-800';
		default:
			return 'bg-gray-100 text-gray-800';
	}
}

export function getSeverityLabel(severity: string): string {
	switch (severity) {
		case 'critical':
			return '严重';
		case 'high':
			return '高';
		case 'medium':
			return '中';
		case 'low':
			return '低';
		default:
			return severity;
	}
}

export function getAnomalyTypeLabel(type: string): string {
	switch (type) {
		case 'over_temp':
			return '温度超标';
		case 'under_temp':
			return '温度过低';
		case 'door_open':
			return '开门超时';
		case 'probe_error':
			return '探头故障';
		case 'delay':
			return '到货延迟';
		default:
			return type;
	}
}

export function getResponsiblePartyLabel(party: string): string {
	switch (party) {
		case 'carrier':
			return '承运商';
		case 'warehouse':
			return '仓库';
		case 'customer':
			return '客户';
		case 'equipment':
			return '设备';
		case 'unknown':
			return '待确认';
		default:
			return party;
	}
}

export function getShipmentStatusLabel(status: string): string {
	switch (status) {
		case 'in_transit':
			return '在途';
		case 'completed':
			return '已完成';
		case 'delayed':
			return '已延迟';
		case 'abnormal':
			return '异常';
		default:
			return status;
	}
}

export function getShipmentStatusColor(status: string): string {
	switch (status) {
		case 'in_transit':
			return 'bg-blue-100 text-blue-800';
		case 'completed':
			return 'bg-green-100 text-green-800';
		case 'delayed':
			return 'bg-yellow-100 text-yellow-800';
		case 'abnormal':
			return 'bg-red-100 text-red-800';
		default:
			return 'bg-gray-100 text-gray-800';
	}
}

export function getCalibrationStatus(isCalibrated: boolean, deviation?: number): {
	status: string;
	color: string;
	icon: string;
} {
	if (!isCalibrated || (deviation !== undefined && Math.abs(deviation) > 0.5)) {
		return { status: '待校准', color: 'text-yellow-600', icon: 'alert-triangle' };
	}
	return { status: '已校准', color: 'text-cyan-600', icon: 'check-circle' };
}

export function generateId(): string {
	return Math.random().toString(36).substring(2, 15);
}

export function downloadCSV(data: any[], filename: string): void {
	if (data.length === 0) return;

	const headers = Object.keys(data[0]);
	const csvContent = [
		headers.join(','),
		...data.map((row) =>
			headers
				.map((h) => {
					const value = row[h];
					if (typeof value === 'string' && value.includes(',')) {
						return `"${value}"`;
					}
					return value ?? '';
				})
				.join(',')
		)
	].join('\n');

	const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
	const link = document.createElement('a');
	link.href = URL.createObjectURL(blob);
	link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
	link.click();
	URL.revokeObjectURL(link.href);
}

export async function downloadPDF(title: string, content: string): Promise<void> {
	const { jsPDF } = await import('jspdf');
	const doc = new jsPDF();

	doc.setFontSize(18);
	doc.text(title, 20, 20);

	doc.setFontSize(10);
	const lines = doc.splitTextToSize(content, 170);
	doc.text(lines, 20, 35);

	doc.save(`${title}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function debounce<T extends (...args: any[]) => any>(
	fn: T,
	delay: number
): (...args: Parameters<T>) => void {
	let timer: NodeJS.Timeout;
	return (...args: Parameters<T>) => {
		clearTimeout(timer);
		timer = setTimeout(() => fn(...args), delay);
	};
}
