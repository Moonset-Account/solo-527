import * as duckdb from '@duckdb/duckdb-wasm';
import type { FilterState, TaskRecord, WeatherRecord, PestRecord, Annotation } from './types';
import { generateMockData } from './mock-data';

let db: duckdb.AsyncDuckDB | null = null;
let conn: duckdb.AsyncDuckDBConnection | null = null;

async function initDB(): Promise<duckdb.AsyncDuckDB> {
	if (db && conn) return db;
	const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
	const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);
	const workerUrl = URL.createObjectURL(
		new Blob([`importScripts("${bundle.mainWorker!}");`], { type: 'text/javascript' })
	);
	const worker = new Worker(workerUrl);
	const logger = new duckdb.ConsoleLogger();
	db = new duckdb.AsyncDuckDB(logger, worker);
	await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
	conn = await db.connect();
	return db;
}

export async function ensureDB() {
	await initDB();
}

export async function loadMockData(): Promise<void> {
	const d = await initDB();
	await d.registerFileText('maintenance_tasks.csv', '');
	await d.registerFileText('weather_records.csv', '');
	await d.registerFileText('pest_records.csv', '');
	const data = generateMockData(60);
	await conn!.query(`
		CREATE TABLE IF NOT EXISTS maintenance_tasks (
			id VARCHAR, district VARCHAR, plant_type VARCHAR, task_type VARCHAR,
			team VARCHAR, planned_date DATE, completed_date DATE, status VARCHAR,
			rainfall_mm DOUBLE, pest_issue BOOLEAN, photo_url VARCHAR
		);
		CREATE TABLE IF NOT EXISTS weather_records (
			record_date DATE, district VARCHAR, rainfall_mm DOUBLE,
			temperature DOUBLE, humidity DOUBLE, weather_type VARCHAR
		);
		CREATE TABLE IF NOT EXISTS pest_records (
			id VARCHAR, district VARCHAR, pest_type VARCHAR, severity VARCHAR,
			found_date DATE, plant_type VARCHAR
		);
		CREATE TABLE IF NOT EXISTS annotations (
			id VARCHAR, task_id VARCHAR, content TEXT, author VARCHAR, created_at TIMESTAMP
		);
	`);
	for (const r of data.taskRecords) {
		await conn!.query(`INSERT INTO maintenance_tasks VALUES (
			'${r.id}','${r.district}','${r.plant_type}','${r.task_type}','${r.team}',
			'${r.planned_date}',${r.completed_date ? `'${r.completed_date}'` : 'NULL'},
			'${r.status}',${r.rainfall_mm},${r.pest_issue},${r.photo_url ? `'${r.photo_url}'` : 'NULL'}
		)`);
	}
	for (const r of data.weatherRecords) {
		await conn!.query(`INSERT INTO weather_records VALUES (
			'${r.record_date}','${r.district}',${r.rainfall_mm},${r.temperature},${r.humidity},'${r.weather_type}'
		)`);
	}
	for (const r of data.pestRecords) {
		await conn!.query(`INSERT INTO pest_records VALUES (
			'${r.id}','${r.district}','${r.pest_type}','${r.severity}','${r.found_date}','${r.plant_type}'
		)`);
	}
}

function buildWhere(filter: FilterState): string {
	const clauses: string[] = [];
	if (filter.districts.length > 0)
		clauses.push(`district IN (${filter.districts.map((d) => `'${d}'`).join(',')})`);
	if (filter.plantTypes.length > 0)
		clauses.push(`plant_type IN (${filter.plantTypes.map((p) => `'${p}'`).join(',')})`);
	if (filter.taskTypes.length > 0)
		clauses.push(`task_type IN (${filter.taskTypes.map((t) => `'${t}'`).join(',')})`);
	if (filter.teams.length > 0) clauses.push(`team IN (${filter.teams.map((t) => `'${t}'`).join(',')})`);
	if (filter.dateRange[0] && filter.dateRange[1]) {
		clauses.push(`planned_date BETWEEN '${filter.dateRange[0]}' AND '${filter.dateRange[1]}'`);
	}
	return clauses.length > 0 ? 'WHERE ' + clauses.join(' AND ') : '';
}

export async function queryOverviewMetrics(filter: FilterState) {
	await ensureDB();
	const w = buildWhere(filter);
	const sql = `
		SELECT
			COUNT(*) as total_tasks,
			SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) as completed_tasks,
			SUM(CASE WHEN status='overdue' THEN 1 ELSE 0 END) as overdue_tasks,
			SUM(CASE WHEN status='rain_delayed' THEN 1 ELSE 0 END) as rain_delayed_tasks,
			ROUND(SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END)::DOUBLE / NULLIF(COUNT(*)::DOUBLE, 0) * 100, 1) as completion_rate,
			ROUND(SUM(CASE WHEN status='overdue' THEN 1 ELSE 0 END)::DOUBLE / NULLIF(COUNT(*)::DOUBLE, 0) * 100, 1) as overdue_rate,
			ROUND(SUM(CASE WHEN status='rain_delayed' THEN 1 ELSE 0 END)::DOUBLE / NULLIF(COUNT(*)::DOUBLE, 0) * 100, 1) as rain_delayed_rate
		FROM maintenance_tasks ${w};
	`;
	const result = await conn!.query(sql);
	return result.toArray()[0];
}

export async function queryCompletionTrend(filter: FilterState, groupBy: 'day' | 'week' | 'month' = 'day') {
	await ensureDB();
	const w = buildWhere(filter);
	const trunc = groupBy === 'month' ? 'month' : groupBy === 'week' ? 'week' : 'day';
	const sql = `
		SELECT
			DATE_TRUNC('${trunc}', planned_date) as period,
			COUNT(*) as total,
			SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) as completed,
			SUM(CASE WHEN status='overdue' THEN 1 ELSE 0 END) as overdue,
			SUM(CASE WHEN status='rain_delayed' THEN 1 ELSE 0 END) as rain_delayed
		FROM maintenance_tasks ${w}
		GROUP BY DATE_TRUNC('${trunc}', planned_date)
		ORDER BY period;
	`;
	const result = await conn!.query(sql);
	return result.toArray();
}

export async function queryWeatherCorrelation(filter: FilterState) {
	await ensureDB();
	const w = buildWhere(filter).replace('plant_type', 'm.plant_type').replace('task_type', 'm.task_type');
	const joinClause = filter.dateRange[0] && filter.dateRange[1]
		? `AND m.planned_date BETWEEN '${filter.dateRange[0]}' AND '${filter.dateRange[1]}'`
		: '';
	const sql = `
		SELECT
			w.record_date as date,
			AVG(w.rainfall_mm) as avg_rainfall,
			ROUND(SUM(CASE WHEN m.status='overdue' THEN 1 ELSE 0 END)::DOUBLE / NULLIF(COUNT(m.id)::DOUBLE, 0) * 100, 1) as overdue_rate,
			ROUND(SUM(CASE WHEN m.status='rain_delayed' THEN 1 ELSE 0 END)::DOUBLE / NULLIF(COUNT(m.id)::DOUBLE, 0) * 100, 1) as rain_delayed_rate,
			COUNT(m.id) as task_count
		FROM weather_records w
		LEFT JOIN maintenance_tasks m ON w.record_date = m.planned_date AND w.district = m.district
			${joinClause}
			${filter.districts.length > 0 ? `AND m.district IN (${filter.districts.map((d) => `'${d}'`).join(',')})` : ''}
			${filter.teams.length > 0 ? `AND m.team IN (${filter.teams.map((t) => `'${t}'`).join(',')})` : ''}
		GROUP BY w.record_date
		ORDER BY w.record_date;
	`;
	const result = await conn!.query(sql);
	return result.toArray();
}

export async function queryPestMap(filter: FilterState) {
	await ensureDB();
	const w = buildWhere(filter).replace('plant_type', 'p.plant_type');
	const sql = `
		SELECT
			p.district,
			p.pest_type,
			p.severity,
			COUNT(*) as count,
			MIN(p.found_date) as first_found,
			MAX(p.found_date) as last_found
		FROM pest_records p
		${w.replace('task_type', "'all'").replace("team = ", "1=1 AND 2=2 --").replace('planned_date', 'found_date')}
		GROUP BY p.district, p.pest_type, p.severity
		ORDER BY count DESC;
	`;
	const wherePest = buildWhereForPest(filter);
	const sqlFixed = `
		SELECT
			district,
			pest_type,
			severity,
			COUNT(*) as count,
			MIN(found_date) as first_found,
			MAX(found_date) as last_found
		FROM pest_records
		${wherePest}
		GROUP BY district, pest_type, severity
		ORDER BY count DESC;
	`;
	const result = await conn!.query(sqlFixed);
	return result.toArray();
}

function buildWhereForPest(filter: FilterState): string {
	const clauses: string[] = [];
	if (filter.districts.length > 0)
		clauses.push(`district IN (${filter.districts.map((d) => `'${d}'`).join(',')})`);
	if (filter.plantTypes.length > 0)
		clauses.push(`plant_type IN (${filter.plantTypes.map((p) => `'${p}'`).join(',')})`);
	if (filter.dateRange[0] && filter.dateRange[1]) {
		clauses.push(`found_date BETWEEN '${filter.dateRange[0]}' AND '${filter.dateRange[1]}'`);
	}
	return clauses.length > 0 ? 'WHERE ' + clauses.join(' AND ') : '';
}

export async function queryPestTrend(filter: FilterState) {
	await ensureDB();
	const w = buildWhereForPest(filter);
	const sql = `
		SELECT
			found_date as date,
			COUNT(*) as count,
			district
		FROM pest_records ${w}
		GROUP BY found_date, district
		ORDER BY found_date;
	`;
	const result = await conn!.query(sql);
	return result.toArray();
}

export async function queryPestDistribution(filter: FilterState) {
	await ensureDB();
	const w = buildWhereForPest(filter);
	const sql = `
		SELECT pest_type, COUNT(*) as count
		FROM pest_records ${w}
		GROUP BY pest_type
		ORDER BY count DESC;
	`;
	const result = await conn!.query(sql);
	return result.toArray();
}

export async function queryTeamComparison(filter: FilterState) {
	await ensureDB();
	const w = buildWhere(filter);
	const sql = `
		SELECT
			team,
			COUNT(*) as total,
			SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) as completed,
			SUM(CASE WHEN status='overdue' THEN 1 ELSE 0 END) as overdue,
			SUM(CASE WHEN status='rain_delayed' THEN 1 ELSE 0 END) as rain_delayed,
			ROUND(SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END)::DOUBLE / NULLIF(COUNT(*)::DOUBLE, 0) * 100, 1) as completion_rate,
			ROUND(SUM(CASE WHEN status='overdue' THEN 1 ELSE 0 END)::DOUBLE / NULLIF(COUNT(*)::DOUBLE, 0) * 100, 1) as overdue_rate,
			ROUND(SUM(CASE WHEN status='rain_delayed' THEN 1 ELSE 0 END)::DOUBLE / NULLIF(COUNT(*)::DOUBLE, 0) * 100, 1) as rain_delayed_rate,
			SUM(CASE WHEN pest_issue THEN 1 ELSE 0 END) as pest_issues
		FROM maintenance_tasks ${w}
		GROUP BY team
		ORDER BY team;
	`;
	const result = await conn!.query(sql);
	return result.toArray();
}

export async function queryTeamEfficiency(filter: FilterState) {
	await ensureDB();
	const w = buildWhere(filter);
	const sql = `
		SELECT
			team,
			COUNT(*) as task_count,
			AVG(CASE WHEN completed_date IS NOT NULL
				THEN DATE_DIFF('day', planned_date::DATE, completed_date::DATE)
				ELSE NULL END) as avg_duration
		FROM maintenance_tasks ${w}
		WHERE status IN ('completed', 'overdue', 'rain_delayed')
		GROUP BY team;
	`;
	const result = await conn!.query(sql);
	return result.toArray();
}

export async function queryDetailRecords(filter: FilterState, page = 0, pageSize = 50) {
	await ensureDB();
	const w = buildWhere(filter);
	const offset = page * pageSize;
	const sql = `
		SELECT * FROM maintenance_tasks ${w}
		ORDER BY planned_date DESC, district
		LIMIT ${pageSize} OFFSET ${offset};
	`;
	const result = await conn!.query(sql);
	return result.toArray();
}

export async function queryDetailCount(filter: FilterState) {
	await ensureDB();
	const w = buildWhere(filter);
	const sql = `SELECT COUNT(*) as total FROM maintenance_tasks ${w};`;
	const result = await conn!.query(sql);
	return result.toArray()[0].total;
}

export async function queryAnnotations(taskId: string) {
	await ensureDB();
	const sql = `SELECT * FROM annotations WHERE task_id = '${taskId}' ORDER BY created_at DESC;`;
	const result = await conn!.query(sql);
	return result.toArray();
}

export async function insertAnnotation(taskId: string, content: string, author: string) {
	await ensureDB();
	const id = `A${Date.now()}`;
	const sql = `INSERT INTO annotations VALUES ('${id}', '${taskId}', '${content}', '${author}', CURRENT_TIMESTAMP);`;
	await conn!.query(sql);
	return id;
}

export async function queryTaskByStatus(filter: FilterState, statuses: string[]) {
	await ensureDB();
	const w = buildWhere(filter);
	const statusClause = `status IN (${statuses.map((s) => `'${s}'`).join(',')})`;
	const whereClause = w ? w + ' AND ' + statusClause : 'WHERE ' + statusClause;
	const sql = `SELECT * FROM maintenance_tasks ${whereClause} ORDER BY planned_date DESC;`;
	const result = await conn!.query(sql);
	return result.toArray();
}
