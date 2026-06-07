import { MOCK_SESSIONS } from '@/lib/data/mockData';
import type {
	Session,
	OverviewMetrics,
	FunnelDataPoint,
	DimensionDataPoint,
	DimensionType,
	TrendDataPoint,
	FilterState,
	Pagination,
	PaginatedResult
} from '@/lib/types';

function filterSessions(sessions: Session[], filters: FilterState): Session[] {
	return sessions.filter((s) => {
		const startTime = new Date(s.start_time);
		const startDate = new Date(filters.startDate);
		const endDate = new Date(filters.endDate);
		endDate.setHours(23, 59, 59, 999);

		if (startTime < startDate || startTime > endDate) return false;
		if (filters.channels.length > 0 && !filters.channels.includes(s.channel)) return false;
		if (filters.versions.length > 0 && !filters.versions.includes(s.version)) return false;
		if (filters.customerLevels.length > 0 && !filters.customerLevels.includes(s.customer_level))
			return false;
		if (filters.intentTags.length > 0 && !filters.intentTags.includes(s.intent_tag)) return false;

		return true;
	});
}

export function getOverviewMetrics(filters: FilterState): OverviewMetrics {
	const sessions = filterSessions(MOCK_SESSIONS, filters);
	const total = sessions.length;
	const transfers = sessions.filter((s) => s.is_transfer_to_human).length;
	const totalSatisfaction = sessions.reduce((sum, s) => sum + s.satisfaction_score, 0);
	const totalRounds = sessions.reduce((sum, s) => sum + s.total_rounds, 0);

	return {
		total_sessions: total,
		transfer_rate: total > 0 ? transfers / total : 0,
		avg_satisfaction: total > 0 ? totalSatisfaction / total : 0,
		avg_rounds: total > 0 ? totalRounds / total : 0,
		total_transfers: transfers,
		resolved_by_bot: total - transfers
	};
}

export function getFunnelData(filters: FilterState): FunnelDataPoint[] {
	const sessions = filterSessions(MOCK_SESSIONS, filters);
	const total = sessions.length;
	const withIntent = sessions.filter((s) => s.intent_tag).length;
	const transfers = sessions.filter((s) => s.is_transfer_to_human).length;
	const withSatisfaction = sessions.filter((s) => s.satisfaction_score > 0).length;

	return [
		{ name: '会话接入', value: total, rate: 1 },
		{ name: '意图识别', value: withIntent, rate: total > 0 ? withIntent / total : 0 },
		{ name: '机器人回复', value: total - transfers, rate: total > 0 ? (total - transfers) / total : 0 },
		{ name: '转人工', value: transfers, rate: total > 0 ? transfers / total : 0 },
		{ name: '满意度评价', value: withSatisfaction, rate: total > 0 ? withSatisfaction / total : 0 }
	];
}

export function getDimensionAnalysis(
	dimension: DimensionType,
	filters: FilterState
): DimensionDataPoint[] {
	const sessions = filterSessions(MOCK_SESSIONS, filters);
	const groups = new Map<string, Session[]>();

	for (const s of sessions) {
		let key: string;
		switch (dimension) {
			case 'intent':
				key = s.intent_tag;
				break;
			case 'channel':
				key = s.channel;
				break;
			case 'hour':
				key = `${s.hour_of_day.toString().padStart(2, '0')}:00`;
				break;
			case 'level':
				key = s.customer_level;
				break;
			case 'version':
				key = s.version;
				break;
			default:
				key = s.intent_tag;
		}

		if (!groups.has(key)) {
			groups.set(key, []);
		}
		groups.get(key)!.push(s);
	}

	const results: DimensionDataPoint[] = [];
	for (const [dimensionValue, groupSessions] of groups) {
		const total = groupSessions.length;
		const transfers = groupSessions.filter((s) => s.is_transfer_to_human).length;
		const totalSatisfaction = groupSessions.reduce((sum, s) => sum + s.satisfaction_score, 0);
		const totalRounds = groupSessions.reduce((sum, s) => sum + s.total_rounds, 0);

		results.push({
			dimension,
			dimension_value: dimensionValue,
			total_sessions: total,
			transfer_count: transfers,
			transfer_rate: total > 0 ? transfers / total : 0,
			avg_satisfaction: total > 0 ? totalSatisfaction / total : 0,
			avg_rounds: total > 0 ? totalRounds / total : 0,
			is_low_sample: total < 30
		});
	}

	return results.sort((a, b) => b.transfer_rate - a.transfer_rate);
}

export function getSatisfactionTrend(
	granularity: 'hour' | 'day',
	filters: FilterState
): TrendDataPoint[] {
	const sessions = filterSessions(MOCK_SESSIONS, filters);
	const groups = new Map<string, Session[]>();

	for (const s of sessions) {
		const date = new Date(s.start_time);
		let key: string;
		if (granularity === 'hour') {
			key = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:00`;
		} else {
			key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
		}

		if (!groups.has(key)) {
			groups.set(key, []);
		}
		groups.get(key)!.push(s);
	}

	const results: TrendDataPoint[] = [];
	for (const [time, groupSessions] of groups) {
		const total = groupSessions.length;
		const transfers = groupSessions.filter((s) => s.is_transfer_to_human).length;
		const totalSatisfaction = groupSessions.reduce((sum, s) => sum + s.satisfaction_score, 0);

		results.push({
			time,
			avg_satisfaction: total > 0 ? totalSatisfaction / total : 0,
			transfer_rate: total > 0 ? transfers / total : 0,
			total_sessions: total
		});
	}

	return results.sort((a, b) => a.time.localeCompare(b.time));
}

export function getSessionDetails(
	filters: FilterState,
	pagination: Pagination
): PaginatedResult<Session> {
	const sessions = filterSessions(MOCK_SESSIONS, filters);
	const start = (pagination.page - 1) * pagination.pageSize;
	const end = start + pagination.pageSize;

	return {
		data: sessions.slice(start, end),
		total: sessions.length,
		page: pagination.page,
		pageSize: pagination.pageSize
	};
}

export function getFailureExamples(filters: FilterState, limit = 10): Session[] {
	const sessions = filterSessions(MOCK_SESSIONS, filters);
	const transferSessions = sessions.filter((s) => s.is_transfer_to_human);
	return transferSessions.slice(0, limit);
}

export function getSessionsByDimension(
	dimension: DimensionType,
	dimensionValue: string,
	filters: FilterState
): Session[] {
	const sessions = filterSessions(MOCK_SESSIONS, filters);
	return sessions.filter((s) => {
		switch (dimension) {
			case 'intent':
				return s.intent_tag === dimensionValue;
			case 'channel':
				return s.channel === dimensionValue;
			case 'hour':
				const hour = parseInt(dimensionValue.split(':')[0]);
				return s.hour_of_day === hour;
			case 'level':
				return s.customer_level === dimensionValue;
			case 'version':
				return s.version === dimensionValue;
			default:
				return s.intent_tag === dimensionValue;
		}
	});
}

export function getDistinctValues(): {
	intents: string[];
	channels: string[];
	versions: string[];
	customerLevels: string[];
} {
	const intents = new Set<string>();
	const channels = new Set<string>();
	const versions = new Set<string>();
	const customerLevels = new Set<string>();

	for (const s of MOCK_SESSIONS) {
		intents.add(s.intent_tag);
		channels.add(s.channel);
		versions.add(s.version);
		customerLevels.add(s.customer_level);
	}

	return {
		intents: Array.from(intents).sort(),
		channels: Array.from(channels).sort(),
		versions: Array.from(versions).sort(),
		customerLevels: Array.from(customerLevels).sort()
	};
}
