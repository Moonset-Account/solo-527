export interface FilterState {
	districts: string[];
	plantTypes: string[];
	taskTypes: string[];
	teams: string[];
	dateRange: [string, string];
}

export interface TaskRecord {
	id: string;
	district: string;
	plant_type: string;
	task_type: string;
	team: string;
	planned_date: string;
	completed_date: string | null;
	status: 'completed' | 'overdue' | 'rain_delayed' | 'pending';
	rainfall_mm: number;
	pest_issue: boolean;
	pest_type: string | null;
	photo_url: string | null;
}

export interface WeatherRecord {
	record_date: string;
	district: string;
	rainfall_mm: number;
	temperature: number;
	humidity: number;
	weather_type: string;
}

export interface PestRecord {
	id: string;
	district: string;
	pest_type: string;
	severity: 'low' | 'medium' | 'high';
	found_date: string;
	plant_type: string;
}

export interface Annotation {
	id: string;
	task_id: string;
	content: string;
	author: string;
	created_at: string;
}

export interface MetricCard {
	label: string;
	value: number;
	unit?: string;
	trend?: 'up' | 'down' | 'flat';
	trendValue?: number;
	color?: string;
}

export const DISTRICTS = ['城东片区', '城西片区', '城南片区', '城北片区', '中心片区'];
export const PLANT_TYPES = ['乔木', '灌木', '草坪', '花卉', '绿篱', '攀援植物'];
export const TASK_TYPES = ['浇水', '修剪', '病虫害防治', '施肥', '巡检', '除草'];
export const TEAMS = ['班组A', '班组B', '班组C', '班组D', '班组E'];
export const PEST_TYPES = ['蚜虫', '红蜘蛛', '白粉病', '锈病', '天牛', '介壳虫', '煤污病', '叶斑病'];

export const DISTRICT_AREAS: Record<string, number> = {
	'城东片区': 120,
	'城西片区': 95,
	'城南片区': 110,
	'城北片区': 85,
	'中心片区': 65
};

export const DEFAULT_FILTER: FilterState = {
	districts: [],
	plantTypes: [],
	taskTypes: [],
	teams: [],
	dateRange: ['', '']
};

export function formatDate(d: Date): string {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
}

export function daysAgo(n: number): string {
	const d = new Date(2025, 4, 1);
	d.setDate(d.getDate() + (59 - n));
	return formatDate(d);
}
