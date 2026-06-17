export function formatNumber(num: number | string | null | undefined, decimals: number = 2): string {
	if (num === null || num === undefined) return '0';
	const n = typeof num === 'string' ? parseFloat(num) : num;
	if (isNaN(n)) return '0';
	return n.toLocaleString('zh-CN', {
		minimumFractionDigits: decimals,
		maximumFractionDigits: decimals
	});
}

export function formatCurrency(amount: number | string | null | undefined, currency: string = 'CNY'): string {
	if (amount === null || amount === undefined) return '¥0.00';
	const n = typeof amount === 'string' ? parseFloat(amount) : amount;
	if (isNaN(n)) return '¥0.00';
	return new Intl.NumberFormat('zh-CN', {
		style: 'currency',
		currency
	}).format(n);
}

export function formatPercentage(value: number, total: number, decimals: number = 1): string {
	if (total === 0) return '0%';
	return `${((value / total) * 100).toFixed(decimals)}%`;
}

export function formatFileSize(bytes: number): string {
	if (bytes === 0) return '0 B';
	const k = 1024;
	const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function truncateText(text: string, maxLength: number): string {
	if (text.length <= maxLength) return text;
	return text.slice(0, maxLength) + '...';
}

export function capitalizeFirst(str: string): string {
	return str.charAt(0).toUpperCase() + str.slice(1);
}

export function statusToText(status: string): string {
	const map: Record<string, string> = {
		draft: '草稿',
		published: '已发布',
		ongoing: '进行中',
		completed: '已完成',
		cancelled: '已取消',
		registered: '已报名',
		canceled: '已取消',
		attended: '已参加',
		absent: '未出席',
		pending: '待处理',
		confirmed: '已确认',
		rejected: '已拒绝',
		processing: '处理中',
		resolved: '已解决',
		closed: '已关闭'
	};
	return map[status] || status;
}

export function roleToText(role: string): string {
	const map: Record<string, string> = {
		volunteer: '志愿者',
		manager: '项目队长',
		admin: '管理员'
	};
	return map[role] || role;
}

export function urgencyToText(urgency: string): string {
	const map: Record<string, string> = {
		low: '低',
		normal: '普通',
		high: '高',
		urgent: '紧急'
	};
	return map[urgency] || urgency;
}

export function generateId(): string {
	return crypto.randomUUID();
}

export function debounce<T extends (...args: unknown[]) => unknown>(
	fn: T,
	delay: number
): (...args: Parameters<T>) => void {
	let timeoutId: ReturnType<typeof setTimeout>;
	return (...args: Parameters<T>) => {
		clearTimeout(timeoutId);
		timeoutId = setTimeout(() => fn(...args), delay);
	};
}

export function formatDateTime(date: Date | string | null | undefined): string {
	if (!date) return '-';
	const d = typeof date === 'string' ? new Date(date) : date;
	if (isNaN(d.getTime())) return '-';
	const pad = (n: number) => n.toString().padStart(2, '0');
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatDate(date: Date | string | null | undefined): string {
	if (!date) return '-';
	const d = typeof date === 'string' ? new Date(date) : date;
	if (isNaN(d.getTime())) return '-';
	const pad = (n: number) => n.toString().padStart(2, '0');
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function formatTime(date: Date | string | null | undefined): string {
	if (!date) return '-';
	const d = typeof date === 'string' ? new Date(date) : date;
	if (isNaN(d.getTime())) return '-';
	const pad = (n: number) => n.toString().padStart(2, '0');
	return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
