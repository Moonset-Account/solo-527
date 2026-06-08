export interface ViewingRecord {
	student_id: string;
	chapter_id: string;
	chapter_version: string;
	watch_duration: number;
	completion_rate: number;
	date: string;
	is_transition: boolean;
}

export interface QuizRecord {
	student_id: string;
	chapter_id: string;
	chapter_version: string;
	quiz_id: string;
	score: number;
	total: number;
	date: string;
}

export interface WrongAnswerRecord {
	student_id: string;
	chapter_id: string;
	chapter_version: string;
	quiz_id: string;
	question_id: string;
	selected_option: string;
	correct_option: string;
	date: string;
}

export interface DiscussionRecord {
	student_id: string;
	chapter_id: string;
	topic: string;
	content: string;
	topic_summary: string;
	date: string;
}

export interface RefundRecord {
	student_id: string;
	chapter_id: string;
	reason: string;
	feedback: string;
	date: string;
}

export interface ChapterVersion {
	chapter_id: string;
	version: string;
	release_date: string;
	changes_summary: string;
}

export interface FilterState {
	dateRange: [string, string];
	chapters: string[];
	versions: string[];
	course: string;
}

export interface PathFlowNode {
	name: string;
	itemStyle?: { color?: string; borderColor?: string };
}

export interface PathFlowLink {
	source: string;
	target: string;
	value: number;
	lineStyle?: { color?: string };
}

export interface BottleneckData {
	chapter_id: string;
	dropoff_rate: number;
	avg_completion: number;
	avg_score: number;
	sample_size: number;
	is_transition: boolean;
}

export interface HeatmapData {
	chapter_id: string;
	question_id: string;
	wrong_count: number;
}

export interface VersionCompareData {
	chapter_id: string;
	version: string;
	metric: string;
	value: number;
	sample_size: number;
}

export interface ExportMetadata {
	timeWindow: [string, string];
	sampleSize: number;
	filterCriteria: FilterState;
	generatedAt: string;
}
