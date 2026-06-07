import type { VisitRecord } from '$types';
import { generateMockData } from '$lib/mockData';

let inMemoryData: VisitRecord[] = [];
let isInitialized = false;

async function initData() {
	if (isInitialized) return;
	inMemoryData = generateMockData(5000);
	isInitialized = true;
	console.log('Data initialized with 5000 mock records');
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
}
