import type { TemperatureRecord } from '$lib/types';
import { temperatureRecordsStore } from '$lib/stores';
import { get } from 'svelte/store';

export interface ImportResult {
	success: number;
	failed: number;
	filledMissing: number;
	errors: string[];
}

export interface ProgressCallback {
	(progress: number): void;
}

export async function importTemperatureData(
	data: any[],
	fieldMapping: Record<string, string>,
	onProgress?: ProgressCallback
): Promise<ImportResult> {
	const result: ImportResult = {
		success: 0,
		failed: 0,
		filledMissing: 0,
		errors: []
	};

	const reversedMapping: Record<string, string> = {};
	Object.entries(fieldMapping).forEach(([source, target]) => {
		if (target) {
			reversedMapping[target] = source;
		}
	});

	const requiredFields = ['shipmentId', 'batchNo', 'timestamp', 'temperature'];
	const missingRequired = requiredFields.filter((f) => !reversedMapping[f]);

	if (missingRequired.length > 0) {
		result.errors.push('缺少必填字段映射: ' + missingRequired.join(', '));
		result.failed = data.length;
		return result;
	}

	const existingRecords = get(temperatureRecordsStore);
	const newRecords: TemperatureRecord[] = [];

	for (let i = 0; i < data.length; i++) {
		const row = data[i];
		const errors: string[] = [];

		try {
			const record: Partial<TemperatureRecord> = {};

			record.id = `temp_${Date.now()}_${i}`;
			record.shipmentId = String(row[reversedMapping.shipmentId] || '').trim();
			if (!record.shipmentId) {
				errors.push('运单ID不能为空');
			}

			record.batchNo = String(row[reversedMapping.batchNo] || '').trim();
			if (!record.batchNo) {
				errors.push('批次号不能为空');
			}

			const timestampRaw = row[reversedMapping.timestamp];
			if (timestampRaw) {
				record.timestamp = new Date(timestampRaw);
				if (isNaN(record.timestamp.getTime())) {
					errors.push('时间戳格式无效');
				}
			} else {
				errors.push('时间戳不能为空');
			}

			const tempRaw = row[reversedMapping.temperature];
			if (tempRaw !== undefined && tempRaw !== null && tempRaw !== '') {
				record.temperature = parseFloat(tempRaw);
				if (isNaN(record.temperature)) {
					errors.push('温度值无效');
				}
			} else {
				errors.push('温度值不能为空');
			}

			if (reversedMapping.humidity && row[reversedMapping.humidity] !== undefined) {
				const hum = parseFloat(row[reversedMapping.humidity]);
				if (!isNaN(hum)) {
					record.humidity = hum;
				}
			}

			if (reversedMapping.latitude && row[reversedMapping.latitude] !== undefined) {
				const lat = parseFloat(row[reversedMapping.latitude]);
				if (!isNaN(lat)) {
					record.latitude = lat;
				} else {
					result.filledMissing++;
				}
			}

			if (reversedMapping.longitude && row[reversedMapping.longitude] !== undefined) {
				const lon = parseFloat(row[reversedMapping.longitude]);
				if (!isNaN(lon)) {
					record.longitude = lon;
				} else {
					result.filledMissing++;
				}
			}

			if (reversedMapping.doorStatus && row[reversedMapping.doorStatus] !== undefined) {
				const doorStatus = String(row[reversedMapping.doorStatus]).toLowerCase();
				record.doorOpen = doorStatus === 'open' || doorStatus === 'true' || doorStatus === '1';
			} else {
				record.doorOpen = false;
				result.filledMissing++;
			}

			if (reversedMapping.probeId && row[reversedMapping.probeId] !== undefined) {
				record.probeId = String(row[reversedMapping.probeId]);
			} else {
				record.probeId = 'probe_default';
				result.filledMissing++;
			}

			if (reversedMapping.probeCalibrated && row[reversedMapping.probeCalibrated] !== undefined) {
				const calibrated = String(row[reversedMapping.probeCalibrated]).toLowerCase();
				record.probeCalibrated = calibrated === 'true' || calibrated === '1' || calibrated === 'yes';
			} else {
				record.probeCalibrated = true;
				result.filledMissing++;
			}

			if (reversedMapping.probeCalibrationDate && row[reversedMapping.probeCalibrationDate]) {
				record.probeCalibrationDate = new Date(row[reversedMapping.probeCalibrationDate]);
			}

			record.calibrationDeviation = 0;
			record.createdAt = new Date();

			if (errors.length === 0) {
				newRecords.push(record as TemperatureRecord);
				result.success++;
			} else {
				result.failed++;
				result.errors.push(`第 ${i + 2} 行: ${errors.join(', ')}`);
			}
		} catch (e) {
			result.failed++;
			result.errors.push(`第 ${i + 2} 行: 解析错误 - ${(e as Error).message}`);
		}

		if (onProgress && i % Math.max(1, Math.floor(data.length / 100)) === 0) {
			onProgress(Math.min(100, Math.round((i / data.length) * 100)));
		}
	}

	if (newRecords.length > 0) {
		temperatureRecordsStore.update((existing) => [...existing, ...newRecords]);

		try {
			localStorage.setItem('temperatureRecords', JSON.stringify(get(temperatureRecordsStore)));
		} catch (e) {
			console.warn('Failed to save to localStorage:', e);
		}
	}

	if (onProgress) {
		onProgress(100);
	}

	return result;
}

export function fillMissingValues(records: TemperatureRecord[]): { records: TemperatureRecord[]; filledCount: number } {
	let filledCount = 0;
	const filled = records.map((record, index) => {
		const result = { ...record };

		if (result.temperature === undefined || result.temperature === null) {
			const prevRecord = records.slice(0, index).reverse().find((r) => r.temperature !== undefined && r.temperature !== null);
			const nextRecord = records.slice(index + 1).find((r) => r.temperature !== undefined && r.temperature !== null);
			if (prevRecord && nextRecord) {
				result.temperature = (prevRecord.temperature + nextRecord.temperature) / 2;
				filledCount++;
			} else if (prevRecord) {
				result.temperature = prevRecord.temperature;
				filledCount++;
			} else if (nextRecord) {
				result.temperature = nextRecord.temperature;
				filledCount++;
			}
		}

		if (result.probeCalibrated === undefined || result.probeCalibrated === null) {
			result.probeCalibrated = true;
			filledCount++;
		}

		if (!result.probeId) {
			result.probeId = 'probe_01';
			filledCount++;
		}

		if (result.doorOpen === undefined || result.doorOpen === null) {
			result.doorOpen = false;
			filledCount++;
		}

		return result;
	});

	return { records: filled, filledCount };
}

export function validateDataQuality(records: TemperatureRecord[]): {
	totalRecords: number;
	validRecords: number;
	missingTemperature: number;
	missingLocation: number;
	outOfRangeTemp: number;
} {
	const stats = {
		totalRecords: records.length,
		validRecords: 0,
		missingTemperature: 0,
		missingLocation: 0,
		outOfRangeTemp: 0
	};

	records.forEach((record) => {
		let isValid = true;

		if (record.temperature === undefined || record.temperature === null) {
			stats.missingTemperature++;
			isValid = false;
		} else if (record.temperature < -50 || record.temperature > 50) {
			stats.outOfRangeTemp++;
			isValid = false;
		}

		if (record.latitude === undefined || record.longitude === undefined) {
			stats.missingLocation++;
		}

		if (isValid) {
			stats.validRecords++;
		}
	});

	return stats;
}
