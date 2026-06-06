import duckdb from 'duckdb';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '../../../../data');

let db: duckdb.Database | null = null;

export async function getDuckDB(): Promise<duckdb.Database> {
	if (db) return db;

	return new Promise((resolve, reject) => {
		db = new duckdb.Database(':memory:', (err) => {
			if (err) {
				reject(err);
				return;
			}
			initializeDatabase(db!)
				.then(() => resolve(db!))
				.catch(reject);
		});
	});
}

async function initializeDatabase(db: duckdb.Database): Promise<void> {
	return new Promise((resolve, reject) => {
		db.run(
			`
			CREATE TABLE IF NOT EXISTS temperature_samples (
				id VARCHAR PRIMARY KEY,
				box_id VARCHAR NOT NULL,
				delivery_date DATE NOT NULL,
				sample_time TIMESTAMP NOT NULL,
				temperature FLOAT NOT NULL,
				lat FLOAT,
				lng FLOAT
			);
			
			CREATE TABLE IF NOT EXISTS delivery_orders (
				id VARCHAR PRIMARY KEY,
				box_id VARCHAR NOT NULL,
				delivery_man_id VARCHAR NOT NULL,
				building_id VARCHAR NOT NULL,
				meal_type_id VARCHAR NOT NULL,
				delivery_date DATE NOT NULL,
				scheduled_time TIMESTAMP NOT NULL,
				actual_time TIMESTAMP,
				status VARCHAR NOT NULL
			);
			
			CREATE TABLE IF NOT EXISTS delivery_men (
				id VARCHAR PRIMARY KEY,
				name VARCHAR NOT NULL,
				phone VARCHAR
			);
			
			CREATE TABLE IF NOT EXISTS buildings (
				id VARCHAR PRIMARY KEY,
				name VARCHAR NOT NULL,
				lat FLOAT NOT NULL,
				lng FLOAT NOT NULL,
				address VARCHAR
			);
			
			CREATE TABLE IF NOT EXISTS meal_types (
				id VARCHAR PRIMARY KEY,
				name VARCHAR NOT NULL,
				standard_temp FLOAT NOT NULL
			);
			
			CREATE TABLE IF NOT EXISTS refund_requests (
				id VARCHAR PRIMARY KEY,
				order_id VARCHAR NOT NULL,
				applicant VARCHAR NOT NULL,
				reason VARCHAR NOT NULL,
				amount FLOAT NOT NULL,
				status VARCHAR NOT NULL,
				created_at TIMESTAMP NOT NULL
			);
			
			CREATE TABLE IF NOT EXISTS delivery_photos (
				id VARCHAR PRIMARY KEY,
				order_id VARCHAR NOT NULL,
				url VARCHAR NOT NULL,
				thumbnail VARCHAR NOT NULL,
				upload_time TIMESTAMP NOT NULL
			);
		`,
			(err) => {
				if (err) reject(err);
				else resolve();
			}
		);
	});
}

export function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
	return new Promise(async (resolve, reject) => {
		const db = await getDuckDB();
		db.all(sql, params, (err, rows) => {
			if (err) reject(err);
			else resolve(rows as T[]);
		});
	});
}

export async function cleanTemperatureData(date: string, threshold: number): Promise<any[]> {
	return query(
		`
		WITH raw_data AS (
			SELECT 
				box_id,
				sample_time,
				temperature,
				lat,
				lng,
				CASE 
					WHEN temperature < 0 OR temperature > 100 THEN 'out_of_range'
					WHEN ABS(temperature - LAG(temperature) OVER (PARTITION BY box_id ORDER BY sample_time)) > 20 THEN 'sudden_change'
					ELSE NULL
				END AS exclude_reason
			FROM temperature_samples
			WHERE delivery_date = ?
		)
		SELECT 
			box_id,
			sample_time,
			temperature,
			lat,
			lng
		FROM raw_data
		WHERE exclude_reason IS NULL
		AND temperature < ?
		`,
		[date, threshold]
	);
}

export async function getExcludedSamples(date: string, boxId?: string): Promise<any[]> {
	let sql = `
		WITH raw_data AS (
			SELECT 
				box_id,
				sample_time,
				temperature,
				CASE 
					WHEN temperature < 0 OR temperature > 100 THEN '温度超出合理范围'
					WHEN ABS(temperature - LAG(temperature) OVER (PARTITION BY box_id ORDER BY sample_time)) > 20 THEN '传感器数据异常波动'
					ELSE NULL
				END AS exclude_reason
			FROM temperature_samples
			WHERE delivery_date = ?
		`;
	const params: any[] = [date];

	if (boxId) {
		sql += ` AND box_id = ? `;
		params.push(boxId);
	}

	sql += `
		)
		SELECT 
			box_id,
			sample_time as time,
			temperature,
			exclude_reason as reason
		FROM raw_data
		WHERE exclude_reason IS NOT NULL
	`;

	return query(sql, params);
}
