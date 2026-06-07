import type { VisitRecord, FilterParams } from '$types';
import { generateMockData } from '$lib/mockData';

function convertBigInts(obj: any): any {
	if (obj === null || obj === undefined) return obj;
	if (typeof obj === 'bigint') return Number(obj);
	if (Array.isArray(obj)) return obj.map(convertBigInts);
	if (typeof obj === 'object') {
		const result: any = {};
		for (const key of Object.keys(obj)) {
			result[key] = convertBigInts(obj[key]);
		}
		return result;
	}
	return obj;
}

let inMemoryData: VisitRecord[] = [];
let isInitialized = false;
let useDuckDB = false;
let duckDb: any = null;

async function tryInitDuckDB() {
	try {
		const duckdbAsync = await import('duckdb-async');
		const db = await duckdbAsync.Database.create(':memory:');

		await db.run(`
			CREATE TABLE visits (
				visitId VARCHAR,
				department VARCHAR,
				doctor VARCHAR,
				patientType VARCHAR,
				timeSlot VARCHAR,
				registerTime TIMESTAMP,
				checkInTime TIMESTAMP,
				triageTime TIMESTAMP,
				callTime TIMESTAMP,
				paymentTime TIMESTAMP,
				pickupTime TIMESTAMP,
				waitCheckIn DOUBLE,
				waitTriage DOUBLE,
				waitCall DOUBLE,
				waitPayment DOUBLE,
				waitPickup DOUBLE,
				totalWait DOUBLE,
				isAnomaly BOOLEAN,
				anomalyReason VARCHAR
			)
		`);

		duckDb = db;
		useDuckDB = true;
		console.log('DuckDB initialized successfully');
		return true;
	} catch (e) {
		console.log('DuckDB initialization failed, falling back to in-memory mode:', (e as Error).message);
		useDuckDB = false;
		return false;
	}
}

async function loadDataToDuckDB(records: VisitRecord[]) {
	if (!duckDb) return;

	try {
		const BATCH_SIZE = 200;
		for (let i = 0; i < records.length; i += BATCH_SIZE) {
			const batch = records.slice(i, i + BATCH_SIZE);
			const placeholders = batch.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
			const values: any[] = [];

			for (const record of batch) {
				values.push(
					record.visitId,
					record.department,
					record.doctor,
					record.patientType,
					record.timeSlot,
					record.registerTime?.toISOString() ?? null,
					record.checkInTime?.toISOString() ?? null,
					record.triageTime?.toISOString() ?? null,
					record.callTime?.toISOString() ?? null,
					record.paymentTime?.toISOString() ?? null,
					record.pickupTime?.toISOString() ?? null,
					record.waitCheckIn ?? null,
					record.waitTriage ?? null,
					record.waitCall ?? null,
					record.waitPayment ?? null,
					record.waitPickup ?? null,
					record.totalWait ?? null,
					record.isAnomaly,
					record.anomalyReason ?? null
				);
			}

			await duckDb.run(`INSERT INTO visits VALUES ${placeholders}`, ...values);
		}
		console.log(`Loaded ${records.length} records into DuckDB (${Math.ceil(records.length / BATCH_SIZE)} batches)`);
	} catch (e) {
		console.warn('Failed to load data into DuckDB, continuing with in-memory mode only:', (e as Error).message);
	}
}

export async function queryWithDuckDB(sql: string, params: any[] = []): Promise<any[]> {
	if (!useDuckDB || !duckDb) {
		return [];
	}
	try {
		const result = await duckDb.all(sql, ...params);
		return convertBigInts(result);
	} catch (e) {
		console.warn('DuckDB query failed:', (e as Error).message);
		return [];
	}
}

export async function getDuckDBDepartmentStats(filters?: Partial<FilterParams>): Promise<any[]> {
	if (!useDuckDB || !duckDb) return [];

	try {
		let whereClauses: string[] = [];
		let params: any[] = [];

		if (filters?.departments && filters.departments.length > 0) {
			whereClauses.push(`department IN (${filters.departments.map(() => '?').join(',')})`);
			params.push(...filters.departments);
		}
		if (filters?.excludeAnomalies) {
			whereClauses.push('isAnomaly = false');
		}

		const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

		const result = await duckDb.all(`
			SELECT
				department,
				CAST(COUNT(*) AS INTEGER) as patientCount,
				AVG(totalWait) as avgWaitTime,
				PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY totalWait) as medianWaitTime
			FROM visits
			${whereSql}
			GROUP BY department
			ORDER BY avgWaitTime DESC
		`, ...params);
		return convertBigInts(result);
	} catch (e) {
		console.warn('DuckDB department stats query failed:', (e as Error).message);
		return [];
	}
}

export async function getDuckDBOverview(filters?: Partial<FilterParams>): Promise<any | null> {
	if (!useDuckDB || !duckDb) return null;

	try {
		let whereClauses: string[] = [];
		let params: any[] = [];

		if (filters?.departments && filters.departments.length > 0) {
			whereClauses.push(`department IN (${filters.departments.map(() => '?').join(',')})`);
			params.push(...filters.departments);
		}
		if (filters?.excludeAnomalies) {
			whereClauses.push('isAnomaly = false');
		}

		const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

		const results = await duckDb.all(`
			SELECT
				CAST(COUNT(*) AS INTEGER) as totalPatients,
				AVG(totalWait) as avgWaitTime,
				PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY totalWait) as medianWaitTime,
				PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY totalWait) as p95WaitTime,
				CAST(SUM(CASE WHEN isAnomaly THEN 1 ELSE 0 END) AS INTEGER) as anomalyCount,
				MIN(registerTime) as minDate,
				MAX(registerTime) as maxDate
			FROM visits
			${whereSql}
		`, ...params);

		if (results && results.length > 0) {
			return convertBigInts(results[0]);
		}
		return null;
	} catch (e) {
		console.warn('DuckDB overview query failed:', (e as Error).message);
		return null;
	}
}

export async function getDuckDBIntradayTrend(filters?: Partial<FilterParams>): Promise<any[]> {
	if (!useDuckDB || !duckDb) return [];

	try {
		let whereClauses: string[] = [];
		let params: any[] = [];

		if (filters?.departments && filters.departments.length > 0) {
			whereClauses.push(`department IN (${filters.departments.map(() => '?').join(',')})`);
			params.push(...filters.departments);
		}
		if (filters?.excludeAnomalies) {
			whereClauses.push('isAnomaly = false');
		}

		const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

		const result = await duckDb.all(`
			SELECT
				CAST(EXTRACT(HOUR FROM registerTime) AS INTEGER) as hour,
				CAST(COUNT(*) AS INTEGER) as patientCount,
				AVG(totalWait) as avgWaitTime
			FROM visits
			${whereSql}
			GROUP BY EXTRACT(HOUR FROM registerTime)
			ORDER BY hour
		`, ...params);
		return convertBigInts(result);
	} catch (e) {
		console.warn('DuckDB intraday trend query failed:', (e as Error).message);
		return [];
	}
}

async function initData() {
	if (isInitialized) return;
	inMemoryData = generateMockData(5000);
	isInitialized = true;

	const duckdbOk = await tryInitDuckDB();
	if (duckdbOk) {
		await loadDataToDuckDB(inMemoryData);
	}

	console.log(`Data initialized with ${inMemoryData.length} records (${useDuckDB ? 'DuckDB' : 'in-memory'} mode)`);
}

export async function getAllRecords(): Promise<VisitRecord[]> {
	if (!isInitialized) {
		await initData();
	}
	return inMemoryData;
}

export async function insertRecords(records: VisitRecord[]): Promise<void> {
	if (!isInitialized) {
		await initData();
	}
	inMemoryData = [
		...inMemoryData.filter((r) => !records.find((nr) => nr.visitId === r.visitId)),
		...records
	];

	if (useDuckDB && duckDb) {
		await loadDataToDuckDB(records);
	}
}

export async function getAnomalyRecords(): Promise<VisitRecord[]> {
	if (!isInitialized) {
		await initData();
	}
	return inMemoryData.filter((r) => r.isAnomaly || r.anomalyReason);
}

export async function updateAnomalyAnnotation(visitId: string, annotation: string, isAnomaly: boolean): Promise<void> {
	if (!isInitialized) {
		await initData();
	}
	const idx = inMemoryData.findIndex((r) => r.visitId === visitId);
	if (idx !== -1) {
		inMemoryData[idx] = {
			...inMemoryData[idx],
			isAnomaly,
			anomalyReason: annotation || inMemoryData[idx].anomalyReason
		};

		if (useDuckDB && duckDb) {
			try {
				await duckDb.run(
					`UPDATE visits SET isAnomaly = ?, anomalyReason = ? WHERE visitId = ?`,
					isAnomaly,
					annotation || inMemoryData[idx].anomalyReason || null,
					visitId
				);
			} catch (e) {
				console.warn('Failed to update anomaly in DuckDB:', (e as Error).message);
			}
		}
	}
}

export function isUsingDuckDB(): boolean {
	return useDuckDB;
}
