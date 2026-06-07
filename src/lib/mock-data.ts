import {
	DISTRICTS,
	PLANT_TYPES,
	TASK_TYPES,
	TEAMS,
	PEST_TYPES,
	DISTRICT_AREAS,
	formatDate,
	type TaskRecord,
	type WeatherRecord,
	type PestRecord
} from './types';

class SeededRandom {
	private seed: number;
	constructor(seed: number) { this.seed = seed; }
	next(): number {
		this.seed = (this.seed * 16807 + 0) % 2147483647;
		return (this.seed - 1) / 2147483646;
	}
	rand(min: number, max: number): number {
		return min + this.next() * (max - min);
	}
	pick<T>(arr: T[]): T {
		return arr[Math.floor(this.next() * arr.length)];
	}
	int(min: number, max: number): number {
		return Math.floor(this.rand(min, max + 1));
	}
}

const RNG = new SeededRandom(42);
const FIXED_START = new Date(2025, 4, 1);

function fixedDate(offset: number): string {
	const d = new Date(FIXED_START);
	d.setDate(d.getDate() + offset);
	return formatDate(d);
}

function generateWeatherRecords(days: number): WeatherRecord[] {
	const records: WeatherRecord[] = [];
	for (let i = 0; i < days; i++) {
		const dateStr = fixedDate(i);
		for (const district of DISTRICTS) {
			const isRainy = RNG.next() < 0.25;
			const rainfall = isRainy ? RNG.rand(5, 60) : RNG.rand(0, 4);
			const temp = RNG.rand(15, 35);
			const humidity = isRainy ? RNG.rand(70, 95) : RNG.rand(40, 70);
			let weather_type: string;
			if (rainfall > 30) weather_type = '大雨';
			else if (rainfall > 10) weather_type = '中雨';
			else if (rainfall > 3) weather_type = '小雨';
			else if (temp > 32) weather_type = '高温';
			else weather_type = '晴';
			records.push({
				record_date: dateStr,
				district,
				rainfall_mm: Math.round(rainfall * 10) / 10,
				temperature: Math.round(temp * 10) / 10,
				humidity: Math.round(humidity * 10) / 10,
				weather_type
			});
		}
	}
	return records;
}

function generateTaskRecords(days: number, weatherRecords: WeatherRecord[]): TaskRecord[] {
	const records: TaskRecord[] = [];
	let id = 1;
	const weatherMap = new Map<string, WeatherRecord>();
	for (const w of weatherRecords) {
		weatherMap.set(`${w.record_date}|${w.district}`, w);
	}
	for (let i = 0; i < days; i++) {
		const dateStr = fixedDate(i);
		const tasksPerDay = RNG.int(15, 35);
		for (let t = 0; t < tasksPerDay; t++) {
			const district = RNG.pick(DISTRICTS);
			const plantType = RNG.pick(PLANT_TYPES);
			const taskType = RNG.pick(TASK_TYPES);
			const team = RNG.pick(TEAMS);
			const wKey = `${dateStr}|${district}`;
			const weatherOnDate = weatherMap.get(wKey);
			const rainfall = weatherOnDate ? weatherOnDate.rainfall_mm : 0;
			const isHeavyRain = rainfall >= 10;
			let status: TaskRecord['status'];
			let completedDate: string | null = null;
			const isPestTask = taskType === '病虫害防治';
			const hasPestIssue = isPestTask && RNG.next() < 0.4;
			const pestType = hasPestIssue ? RNG.pick(PEST_TYPES) : null;
			if (i >= days - 2) {
				status = 'pending';
			} else if (isHeavyRain && RNG.next() < 0.7) {
				status = 'rain_delayed';
				if (i + 1 < days && RNG.next() < 0.6) {
					completedDate = fixedDate(i + 1);
				}
			} else if (RNG.next() < 0.12) {
				status = 'overdue';
			} else {
				status = 'completed';
				completedDate = RNG.next() < 0.3 ? fixedDate(Math.max(0, i - 1)) : dateStr;
			}
			records.push({
				id: `T${String(id++).padStart(5, '0')}`,
				district,
				plant_type: plantType,
				task_type: taskType,
				team,
				planned_date: dateStr,
				completed_date: completedDate,
				status,
				rainfall_mm: Math.round(rainfall * 10) / 10,
				pest_issue: hasPestIssue,
				pest_type: pestType,
				photo_url: taskType === '巡检' ? `photo_${id}.jpg` : null
			});
		}
	}
	return records;
}

function generatePestRecords(days: number): PestRecord[] {
	const records: PestRecord[] = [];
	let id = 1;
	for (let i = 0; i < days; i++) {
		const dateStr = fixedDate(i);
		const count = RNG.int(0, 5);
		for (let c = 0; c < count; c++) {
			const district = RNG.pick(DISTRICTS);
			const severityRoll = RNG.next();
			let severity: PestRecord['severity'];
			if (severityRoll < 0.5) severity = 'low';
			else if (severityRoll < 0.85) severity = 'medium';
			else severity = 'high';
			records.push({
				id: `P${String(id++).padStart(5, '0')}`,
				district,
				pest_type: RNG.pick(PEST_TYPES),
				severity,
				found_date: dateStr,
				plant_type: RNG.pick(PLANT_TYPES)
			});
		}
	}
	return records;
}

export function generateMockData(days = 60) {
	const weatherRecords = generateWeatherRecords(days);
	const taskRecords = generateTaskRecords(days, weatherRecords);
	const pestRecords = generatePestRecords(days);
	return { taskRecords, weatherRecords, pestRecords };
}

export { DISTRICT_AREAS };
