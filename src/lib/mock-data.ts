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

function rand(min: number, max: number): number {
	return Math.random() * (max - min) + min;
}

function pick<T>(arr: T[]): T {
	return arr[Math.floor(Math.random() * arr.length)];
}

function generateWeatherRecords(days: number): WeatherRecord[] {
	const records: WeatherRecord[] = [];
	for (let i = days; i >= 0; i--) {
		const d = new Date();
		d.setDate(d.getDate() - i);
		const dateStr = formatDate(d);
		for (const district of DISTRICTS) {
			const isRainy = Math.random() < 0.25;
			const rainfall = isRainy ? rand(5, 60) : rand(0, 4);
			const temp = rand(15, 35);
			const humidity = isRainy ? rand(70, 95) : rand(40, 70);
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
	for (let i = days; i >= 0; i--) {
		const d = new Date();
		d.setDate(d.getDate() - i);
		const dateStr = formatDate(d);
		const tasksPerDay = Math.floor(rand(15, 35));
		for (let t = 0; t < tasksPerDay; t++) {
			const district = pick(DISTRICTS);
			const plantType = pick(PLANT_TYPES);
			const taskType = pick(TASK_TYPES);
			const team = pick(TEAMS);
			const weatherOnDate = weatherRecords.filter(
				(w) => w.record_date === dateStr && w.district === district
			);
			const rainfall = weatherOnDate.length > 0 ? weatherOnDate[0].rainfall_mm : 0;
			const isHeavyRain = rainfall >= 10;
			let status: TaskRecord['status'];
			let completedDate: string | null = null;
			const isPestTask = taskType === '病虫害防治';
			const hasPestIssue = isPestTask && Math.random() < 0.4;
			if (i <= 1) {
				status = 'pending';
			} else if (isHeavyRain && Math.random() < 0.7) {
				status = 'rain_delayed';
				const newDate = new Date(d);
				newDate.setDate(newDate.getDate() + 1);
				if (Math.random() < 0.6) {
					completedDate = formatDate(newDate);
					status = 'rain_delayed';
				}
			} else if (Math.random() < 0.12) {
				status = 'overdue';
			} else {
				status = 'completed';
				const compDate = new Date(d);
				if (Math.random() < 0.3) compDate.setDate(compDate.getDate() - 1);
				completedDate = formatDate(compDate);
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
				photo_url: taskType === '巡检' ? `photo_${id}.jpg` : null
			});
		}
	}
	return records;
}

function generatePestRecords(days: number): PestRecord[] {
	const records: PestRecord[] = [];
	let id = 1;
	for (let i = days; i >= 0; i--) {
		const d = new Date();
		d.setDate(d.getDate() - i);
		const dateStr = formatDate(d);
		const count = Math.floor(rand(0, 5));
		for (let c = 0; c < count; c++) {
			const district = pick(DISTRICTS);
			const severityRoll = Math.random();
			let severity: PestRecord['severity'];
			if (severityRoll < 0.5) severity = 'low';
			else if (severityRoll < 0.85) severity = 'medium';
			else severity = 'high';
			records.push({
				id: `P${String(id++).padStart(5, '0')}`,
				district,
				pest_type: pick(PEST_TYPES),
				severity,
				found_date: dateStr,
				plant_type: pick(PLANT_TYPES)
			});
		}
	}
	return records;
}

export function generateMockData(days = 30) {
	const weatherRecords = generateWeatherRecords(days);
	const taskRecords = generateTaskRecords(days, weatherRecords);
	const pestRecords = generatePestRecords(days);
	return { taskRecords, weatherRecords, pestRecords };
}

export { DISTRICT_AREAS };
