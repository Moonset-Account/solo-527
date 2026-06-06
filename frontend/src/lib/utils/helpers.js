export const statusMap = {
	pending: { label: '待处理', class: 'bg-gray-100 text-gray-800' },
	in_transit: { label: '配送中', class: 'bg-blue-100 text-blue-800' },
	arrived: { label: '已到达', class: 'bg-yellow-100 text-yellow-800' },
	signed: { label: '已签收', class: 'bg-green-100 text-green-800' },
	returned: { label: '已退回', class: 'bg-orange-100 text-orange-800' },
	exception: { label: '异常', class: 'bg-red-100 text-red-800' },
	reviewing: { label: '复核中', class: 'bg-purple-100 text-purple-800' },
	completed: { label: '已完成', class: 'bg-emerald-100 text-emerald-800' }
};

export const boxStatusMap = {
	idle: { label: '空闲', class: 'bg-gray-100 text-gray-800' },
	in_transit: { label: '配送中', class: 'bg-blue-100 text-blue-800' },
	arrived: { label: '已到达', class: 'bg-yellow-100 text-yellow-800' },
	signed: { label: '已签收', class: 'bg-green-100 text-green-800' },
	exception: { label: '异常', class: 'bg-red-100 text-red-800' },
	returned: { label: '已退回', class: 'bg-orange-100 text-orange-800' },
	locked: { label: '已锁定', class: 'bg-purple-100 text-purple-800' }
};

export function formatDate(date) {
	if (!date) return '-';
	const d = new Date(date);
	return d.toLocaleString('zh-CN', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit'
	});
}

export function formatDateOnly(date) {
	if (!date) return '';
	const d = new Date(date);
	return d.toISOString().split('T')[0];
}

export function getStatusLabel(status) {
	return statusMap[status]?.label || status;
}

export function getStatusClass(status) {
	return statusMap[status]?.class || 'bg-gray-100 text-gray-800';
}

export function getBoxStatusLabel(status) {
	return boxStatusMap[status]?.label || status;
}

export function getBoxStatusClass(status) {
	return boxStatusMap[status]?.class || 'bg-gray-100 text-gray-800';
}

export function isTemperatureNormal(temp) {
	return temp >= 2.0 && temp <= 8.0;
}
