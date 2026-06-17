import {
	format,
	formatDistanceToNow,
	parseISO,
	isValid,
	differenceInHours,
	startOfDay,
	endOfDay
} from 'date-fns';
import { zhCN } from 'date-fns/locale';

export function formatDate(date: Date | string | null | undefined, fmt: string = 'yyyy-MM-dd'): string {
	if (!date) return '-';
	const d = typeof date === 'string' ? parseISO(date) : date;
	if (!isValid(d)) return '-';
	return format(d, fmt, { locale: zhCN });
}

export function formatDateTime(date: Date | string | null | undefined): string {
	return formatDate(date, 'yyyy-MM-dd HH:mm');
}

export function formatTime(date: Date | string | null | undefined): string {
	return formatDate(date, 'HH:mm');
}

export function formatRelative(date: Date | string | null | undefined): string {
	if (!date) return '-';
	const d = typeof date === 'string' ? parseISO(date) : date;
	if (!isValid(d)) return '-';
	return formatDistanceToNow(d, { addSuffix: true, locale: zhCN });
}

export function calculateDuration(start: Date | string, end: Date | string): number {
	const s = typeof start === 'string' ? parseISO(start) : start;
	const e = typeof end === 'string' ? parseISO(end) : end;
	return Math.round(differenceInHours(e, s) * 100) / 100;
}

export function getDateRangeForFilter(range: string): { start: Date; end: Date } {
	const now = new Date();
	switch (range) {
		case 'today':
			return { start: startOfDay(now), end: endOfDay(now) };
		case 'week':
			const weekStart = new Date(now);
			weekStart.setDate(now.getDate() - now.getDay());
			return { start: startOfDay(weekStart), end: endOfDay(now) };
		case 'month':
			const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
			return { start: startOfDay(monthStart), end: endOfDay(now) };
		case 'year':
			const yearStart = new Date(now.getFullYear(), 0, 1);
			return { start: startOfDay(yearStart), end: endOfDay(now) };
		default:
			return { start: startOfDay(now), end: endOfDay(now) };
	}
}

export function isDateInRange(date: Date, start: Date, end: Date): boolean {
	return date >= start && date <= end;
}
