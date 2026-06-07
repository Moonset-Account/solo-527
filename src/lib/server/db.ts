import type { VisitRecord, FilterParams, OverviewStats, DepartmentCompareItem, IntradayTrendPoint } from '$types';
import { generateMockData } from '$lib/mockData';

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
		return await duckDb.all(sql, ...params);
	} catch (e) {
		console.warn('DuckDB query failed:', (e as Error).message);
		return [];
	}
}

export async function getDuckDBOverview(): Promise<any> {
	if (!useDuckDB || !duckDb) return null;

	try {
		const result = await duckDb.all(`
			SELECT
				COUNT(*) as totalRecords,
				AVG(totalWait) as avgTotalWait,
				AVG(waitCall) as avgWaitCall,
				SUM(CASE WHEN isAnomaly THEN 1 ELSE 0 END) as anomalyCount
			FROM visits
		`);
		return result[0];
	} catch (e) {
		console.warn('DuckDB overview query failed:', (e as Error).message);
		return null;
	}
}

export async function getDuckDBDepartmentStats(): Promise<any[]> {
	if (!useDuckDB || !duckDb) return [];

	try {
		return await duckDb.all(`
			SELECT
				department,
				COUNT(*) as visitCount,
				AVG(totalWait) as avgWaitTime,
				PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY totalWait) as medianWaitTime
			FROM visits
			GROUP BY department
			ORDER BY avgWaitTime DESC
		`);
	} catch (e) {
		console.warn('DuckDB department stats query failed:', (e as Error).message);
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
	return inMemoryData.filter((r) => r.isAnomaly);
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
