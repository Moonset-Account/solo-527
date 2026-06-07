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
		const stmt = await duckDb.prepare(
			`INSERT INTO visits VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		);

		for (const record of records) {
			await stmt.run(
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
				record.waitCheckIn,
				record.waitTriage,
				record.waitCall,
				record.waitPayment,
				record.waitPickup,
				record.totalWait,
				record.isAnomaly,
				record.anomalyReason ?? null
			);
		}
		await stmt.finalize();
		console.log(`Loaded ${records.length} records into DuckDB`);
	} catch (e) {
		console.warn('Failed to load data into DuckDB, continuing with in-memory mode only:', (e as Error).message);
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
	}
}

export function isUsingDuckDB(): boolean {
	return useDuckDB;
}
