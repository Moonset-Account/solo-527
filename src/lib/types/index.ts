export interface FunnelStage {
	stage: 'browse' | 'register' | 'checkin' | 'cancel' | 'feedback';
	name: string;
	count: number;
	rate: number;
	totalRate: number;
}

export interface ActivityTypeFunnel {
	name: string;
	funnel: number[];
}

export interface FunnelRequest {
	startDate: string;
	endDate: string;
	activityTypes: string[];
	communities: string[];
	ageGroups: string[];
	channels: string[];
	weather: string[];
	caliberVersion: string;
}

export interface FunnelResponse {
	funnel: FunnelStage[];
	byActivityType: ActivityTypeFunnel[];
	sampleSize: number;
	hasMinorData: boolean;
	cancelReasons: { tag: string; count: number }[];
	feedbackTopics: { topic: string; count: number }[];
}

export interface FilterState {
	startDate: string;
	endDate: string;
	activityTypes: string[];
	communities: string[];
	ageGroups: string[];
	channels: string[];
	weather: string[];
	caliberVersion: string;
}

export interface FilterOption {
	value: string;
	label: string;
}

export interface CaliberVersion {
	version_id: string;
	version_name: string;
	effective_date: string;
	type_mapping: Record<string, string>;
	created_at: string;
	is_active: boolean;
}

export interface Activity {
	activity_id: string;
	name: string;
	type: string;
	start_time: string;
	community_name: string;
	weather: string;
	registrations: number;
	checkins: number;
	cancellations: number;
	feedback_count: number;
}

export interface ExportRequest extends FunnelRequest {
	format: 'csv' | 'xlsx';
	includeDetails: boolean;
	exportType: 'aggregated' | 'detailed';
	userRole?: 'operator' | 'admin';
}

export interface User {
	id: string;
	name: string;
	role: 'operator' | 'admin';
}

export interface CancelReason {
	tag: string;
	count: number;
}

export interface FeedbackTopic {
	topic: string;
	count: number;
}
