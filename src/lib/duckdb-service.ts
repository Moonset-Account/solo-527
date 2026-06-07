import * as duckdb from '@duckdb/duckdb-wasm';
import type { FilterState } from './types';
import { FIXED_TASK_RECORDS, FIXED_WEATHER_RECORDS, FIXED_PEST_RECORDS } from './mock-data';

let db: duckdb.AsyncDuckDB | null = null;
let conn: duckdb.AsyncDuckDBConnection | null = null;
let dataLoaded = false;

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
	if (dataLoaded) return;
	await initDB();
	await conn!.query(`
		CREATE TABLE IF NOT EXISTS maintenance_tasks (
			id VARCHAR, district VARCHAR, plant_type VARCHAR, task_type VARCHAR,
			team VARCHAR, planned_date DATE, completed_date DATE, status VARCHAR,
			rainfall_mm DOUBLE, pest_issue BOOLEAN, pest_type VARCHAR, photo_url VARCHAR
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
	for (const r of FIXED_TASK_RECORDS) {
		await conn!.query(`INSERT INTO maintenance_tasks VALUES (
			'${r.id}','${r.district}','${r.plant_type}','${r.task_type}','${r.team}',
			'${r.planned_date}',${r.completed_date ? `'${r.completed_date}'` : 'NULL'},
			'${r.status}',${r.rainfall_mm},${r.pest_issue},${r.pest_type ? `'${r.pest_type}'` : 'NULL'},${r.photo_url ? `'${r.photo_url}'` : 'NULL'}
		)`);
	}
	for (const r of FIXED_WEATHER_RECORDS) {
		await conn!.query(`INSERT INTO weather_records VALUES (
			'${r.record_date}','${r.district}',${r.rainfall_mm},${r.temperature},${r.humidity},'${r.weather_type}'
		)`);
	}
	for (const r of FIXED_PEST_RECORDS) {
		await conn!.query(`INSERT INTO pest_records VALUES (
			'${r.id}','${r.district}','${r.pest_type}','${r.severity}','${r.found_date}','${r.plant_type}'
		)`);
	}
	dataLoaded = true;
}

export interface DetailFilter extends FilterState {
	statuses?: string[];
	pestType?: string;
}

function buildWhere(filter: DetailFilter): string {
	const clauses: string[] = [];
	if (filter.districts.length > 0)
		clauses.push(`district IN (${filter.districts.map((d) => `'${d}'`).join(',')})`);
	if (filter.plantTypes.length > 0)
		clauses.push(`plant_type IN (${filter.plantTypes.map((p) => `'${p}'`).join(',')})`);
	if (filter.taskTypes.length > 0)
		clauses.push(`task_type IN (${filter.taskTypes.map((t) => `'${t}'`).join(',')})`);
	if (filter.teams.length > 0)
		clauses.push(`team IN (${filter.teams.map((t) => `'${t}'`).join(',')})`);
	if (filter.dateRange[0] && filter.dateRange[1]) {
		clauses.push(`planned_date BETWEEN '${filter.dateRange[0]}' AND '${filter.dateRange[1]}'`);
	}
	if (filter.statuses && filter.statuses.length > 0) {
		clauses.push(`status IN (${filter.statuses.map((s) => `'${s}'`).join(',')})`);
	}
	if (filter.pestType) {
		clauses.push(`pest_type = '${filter.pestType}'`);
	}
	return clauses.length > 0 ? 'WHERE ' + clauses.join(' AND ') : '';
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

function toPlain(obj: any): any {
	if (obj === null || obj === undefined) return obj;
	if (typeof obj === 'bigint') return Number(obj);
	if (Array.isArray(obj)) return obj.map(toPlain);
	if (typeof obj === 'object') {
		const result: any = {};
		for (const key of Object.keys(obj)) {
			result[key] = toPlain(obj[key]);
		}
		return result;
	}
	return obj;
}

async function runQuery(sql: string): Promise<any[]> {
	await ensureDB();
	const result = await conn!.query(sql);
	return result.toArray().map(toPlain);
}

export async function queryOverviewMetrics(filter: FilterState) {
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
	return (await runQuery(sql))[0];
}

export async function queryCompletionTrend(filter: FilterState, groupBy: 'day' | 'week' | 'month' = 'day') {
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
	return runQuery(sql);
}

export async function queryWeatherCorrelation(filter: FilterState) {
	const joinClauses: string[] = [];
	joinClauses.push(`w.record_date = m.planned_date`);
	joinClauses.push(`w.district = m.district`);
	if (filter.dateRange[0] && filter.dateRange[1]) {
		joinClauses.push(`m.planned_date BETWEEN '${filter.dateRange[0]}' AND '${filter.dateRange[1]}'`);
	}
	if (filter.districts.length > 0) {
		joinClauses.push(`m.district IN (${filter.districts.map((d) => `'${d}'`).join(',')})`);
	}
	if (filter.teams.length > 0) {
		joinClauses.push(`m.team IN (${filter.teams.map((t) => `'${t}'`).join(',')})`);
	}
	if (filter.plantTypes.length > 0) {
		joinClauses.push(`m.plant_type IN (${filter.plantTypes.map((p) => `'${p}'`).join(',')})`);
	}
	if (filter.taskTypes.length > 0) {
		joinClauses.push(`m.task_type IN (${filter.taskTypes.map((t) => `'${t}'`).join(',')})`);
	}
	const sql = `
		SELECT
			w.record_date as date,
			AVG(w.rainfall_mm) as avg_rainfall,
			ROUND(SUM(CASE WHEN m.status='overdue' THEN 1 ELSE 0 END)::DOUBLE / NULLIF(COUNT(m.id)::DOUBLE, 0) * 100, 1) as overdue_rate,
			ROUND(SUM(CASE WHEN m.status='rain_delayed' THEN 1 ELSE 0 END)::DOUBLE / NULLIF(COUNT(m.id)::DOUBLE, 0) * 100, 1) as rain_delayed_rate,
			COUNT(m.id) as task_count
		FROM weather_records w
		LEFT JOIN maintenance_tasks m ON ${joinClauses.join(' AND ')}
		GROUP BY w.record_date
		ORDER BY w.record_date;
	`;
	return runQuery(sql);
}

export async function queryPestMap(filter: FilterState) {
	const w = buildWhereForPest(filter);
	const sql = `
		SELECT
			district,
			pest_type,
			severity,
			COUNT(*) as count,
			MIN(found_date) as first_found,
			MAX(found_date) as last_found
		FROM pest_records ${w}
		GROUP BY district, pest_type, severity
		ORDER BY count DESC;
	`;
	return runQuery(sql);
}

export async function queryPestTrend(filter: FilterState) {
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
	return runQuery(sql);
}

export async function queryPestDistribution(filter: FilterState) {
	const w = buildWhereForPest(filter);
	const sql = `
		SELECT pest_type, COUNT(*) as count
		FROM pest_records ${w}
		GROUP BY pest_type
		ORDER BY count DESC;
	`;
	return runQuery(sql);
}

export async function queryTeamComparison(filter: FilterState) {
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
	return runQuery(sql);
}

export async function queryTeamEfficiency(filter: FilterState) {
	const w = buildWhere({ ...filter, statuses: ['completed', 'overdue', 'rain_delayed'] });
	const sql = `
		SELECT
			team,
			COUNT(*) as task_count,
			AVG(CASE WHEN completed_date IS NOT NULL
				THEN DATE_DIFF('day', planned_date::DATE, completed_date::DATE)
				ELSE NULL END) as avg_duration
		FROM maintenance_tasks ${w}
		GROUP BY team;
	`;
	return runQuery(sql);
}

export async function queryDetailRecords(filter: DetailFilter, page = 0, pageSize = 50) {
	const w = buildWhere(filter);
	const offset = page * pageSize;
	const sql = `
		SELECT * FROM maintenance_tasks ${w}
		ORDER BY planned_date DESC, district
		LIMIT ${pageSize} OFFSET ${offset};
	`;
	return runQuery(sql);
}

export async function queryDetailCount(filter: DetailFilter) {
	const w = buildWhere(filter);
	const sql = `SELECT COUNT(*) as total FROM maintenance_tasks ${w};`;
	const rows = await runQuery(sql);
	return rows[0].total;
}

export async function queryAnnotations(taskId: string) {
	const sql = `SELECT * FROM annotations WHERE task_id = '${taskId}' ORDER BY created_at DESC;`;
	return runQuery(sql);
}

export async function insertAnnotation(taskId: string, content: string, author: string) {
	await ensureDB();
	const id = `A${Date.now()}`;
	const escapedContent = content.replace(/'/g, "''");
	const escapedAuthor = author.replace(/'/g, "''");
	const sql = `INSERT INTO annotations VALUES ('${id}', '${taskId}', '${escapedContent}', '${escapedAuthor}', CURRENT_TIMESTAMP);`;
	await conn!.query(sql);
	return id;
}
