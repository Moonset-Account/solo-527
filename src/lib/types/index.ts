export interface Session {
	session_id: string;
	user_id: string;
	customer_level: string;
	channel: string;
	version: string;
	start_time: string;
	end_time: string;
	total_rounds: number;
	intent_tag: string;
	is_transfer_to_human: boolean;
	satisfaction_score: number;
	user_question: string;
	bot_answer: string;
	transfer_reason?: string;
	hour_of_day: number;
	day_of_week: number;
}

export interface OverviewMetrics {
	total_sessions: number;
	transfer_rate: number;
	avg_satisfaction: number;
	avg_rounds: number;
	total_transfers: number;
	resolved_by_bot: number;
}

export interface FunnelDataPoint {
	name: string;
	value: number;
	rate?: number;
}

export type DimensionType = 'intent' | 'channel' | 'hour' | 'level' | 'version';

export interface DimensionDataPoint {
	dimension: string;
	dimension_value: string;
	total_sessions: number;
	transfer_count: number;
	transfer_rate: number;
	avg_satisfaction: number;
	avg_rounds: number;
	is_low_sample?: boolean;
	has_note?: boolean;
}

export interface TrendDataPoint {
	time: string;
	avg_satisfaction: number;
	transfer_rate: number;
	total_sessions: number;
}

export interface FilterState {
	startDate: string;
	endDate: string;
	channels: string[];
	versions: string[];
	customerLevels: string[];
	intentTags: string[];
}

export interface Note {
	id: string;
	dimension: DimensionType;
	dimensionValue: string;
	content: string;
	createdAt: number;
	createdBy: string;
}

export interface Pagination {
	page: number;
	pageSize: number;
}

export interface PaginatedResult<T> {
	data: T[];
	total: number;
	page: number;
	pageSize: number;
}
