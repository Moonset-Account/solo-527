export function formatPercent(value: number, decimals = 1): string {
	return `${(value * 100).toFixed(decimals)}%`;
}

export function formatNumber(value: number): string {
	if (value >= 1000000) {
		return `${(value / 1000000).toFixed(1)}M`;
	}
	if (value >= 1000) {
		return `${(value / 1000).toFixed(1)}K`;
	}
	return value.toString();
}

export function formatDate(date: string | Date): string {
	const d = typeof date === 'string' ? new Date(date) : date;
	return d.toLocaleDateString('zh-CN', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	});
}

export function formatDateTime(date: string | Date): string {
	const d = typeof date === 'string' ? new Date(date) : date;
	return d.toLocaleString('zh-CN', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit'
	});
}

export function formatSatisfaction(score: number): { text: string; class: string } {
	if (score >= 4.5) return { text: '非常满意', class: 'badge-success' };
	if (score >= 3.5) return { text: '满意', class: 'badge-success' };
	if (score >= 2.5) return { text: '一般', class: 'badge-warning' };
	if (score >= 1.5) return { text: '不满意', class: 'badge-danger' };
	return { text: '非常不满意', class: 'badge-danger' };
}

export function isTransferRateHigh(rate: number, threshold = 0.3): boolean {
	return rate > threshold;
}

export function isSatisfactionLow(score: number, threshold = 3.0): boolean {
	return score < threshold;
}

export function isLowSample(count: number, threshold = 30): boolean {
	return count < threshold;
}

export function getDimensionLabel(dimension: string): string {
	const labels: Record<string, string> = {
		intent: '意图标签',
		channel: '渠道',
		hour: '时段',
		level: '客户等级',
		version: '版本'
	};
	return labels[dimension] || dimension;
}

export function getLevelLabel(level: string): string {
	const labels: Record<string, string> = {
		vip: 'VIP',
		high: '高价值',
		normal: '普通',
		new: '新用户'
	};
	return labels[level] || level;
}

export function getChannelLabel(channel: string): string {
	const labels: Record<string, string> = {
		app: 'APP',
		web: '网页',
		wechat: '微信',
		mini_program: '小程序'
	};
	return labels[channel] || channel;
}
