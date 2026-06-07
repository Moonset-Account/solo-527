import { json } from '@sveltejs/kit';
import { initDB, insertTemperatureRecords } from '$lib/server/duckdb';
import type { TemperatureRecord } from '$lib/types';

export async function POST({ request }) {
	try {
		await initDB();

		const formData = await request.formData();
		const file = formData.get('file') as File;
		const fieldMappingStr = formData.get('fieldMapping') as string;

		if (!file) {
			return json({ success: false, error: '请选择文件' }, { status: 400 });
		}

		let fieldMapping: Record<string, string> = {};
		try {
			fieldMapping = JSON.parse(fieldMappingStr || '{}');
		} catch (e) {
			return json({ success: false, error: '字段映射格式错误' }, { status: 400 });
		}

		const content = await file.text();
		const lines = content.split('\n').filter((l) => l.trim());
		if (lines.length < 2) {
			return json({ success: false, error: '文件内容为空或格式无效' }, { status: 400 });
		}

		const headers = lines[0].split(',').map((h) => h.trim());
		const reversedMapping: Record<string, number> = {};
		for (const [key, mappedField] of Object.entries(fieldMapping)) {
			const idx = headers.findIndex((h) => h === mappedField);
			if (idx >= 0) {
				reversedMapping[key] = idx;
			}
		}

		const records: TemperatureRecord[] = [];
		const errors: string[] = [];
		let filledMissing = 0;

		for (let i = 1; i < lines.length; i++) {
			const row = lines[i].split(',').map((c) => c.trim());
			try {
				const record: Partial<TemperatureRecord> = {
					id: `imported_${Date.now()}_${i}`,
					shipmentId: '',
					batchNo: '',
					probeId: 'imported_probe',
					timestamp: new Date(),
					temperature: 0,
					probeCalibrated: true,
					calibrationDeviation: 0,
					createdAt: new Date()
				};

				let hasRequired = true;

				if (reversedMapping.shipmentId !== undefined) {
					record.shipmentId = row[reversedMapping.shipmentId] || '';
				} else {
					record.shipmentId = `auto_${Date.now()}`;
					filledMissing++;
				}

				if (reversedMapping.batchNo !== undefined) {
					record.batchNo = row[reversedMapping.batchNo] || '';
				} else {
					record.batchNo = `BATCH_${Date.now()}`;
					filledMissing++;
				}

				if (reversedMapping.timestamp !== undefined) {
					const ts = row[reversedMapping.timestamp];
					if (ts) {
						record.timestamp = new Date(ts);
					} else {
						record.timestamp = new Date();
						filledMissing++;
					}
				}

				if (reversedMapping.temperature !== undefined) {
					const temp = parseFloat(row[reversedMapping.temperature]);
					if (!isNaN(temp)) {
						record.temperature = temp;
					} else {
						hasRequired = false;
					}
				} else {
					hasRequired = false;
				}

				if (reversedMapping.probeId !== undefined) {
					record.probeId = row[reversedMapping.probeId] || 'imported_probe';
				}

				if (reversedMapping.humidity !== undefined) {
					const hum = parseFloat(row[reversedMapping.humidity]);
					if (!isNaN(hum)) {
						record.humidity = hum;
					}
				}

				if (reversedMapping.latitude !== undefined) {
					const lat = parseFloat(row[reversedMapping.latitude]);
					if (!isNaN(lat)) {
						record.latitude = lat;
					}
				}

				if (reversedMapping.longitude !== undefined) {
					const lng = parseFloat(row[reversedMapping.longitude]);
					if (!isNaN(lng)) {
						record.longitude = lng;
					}
				}

				if (reversedMapping.doorStatus !== undefined) {
					const door = row[reversedMapping.doorStatus]?.toLowerCase();
					record.doorOpen = door === 'open' || door === 'true' || door === '1';
				}

				if (reversedMapping.probeCalibrated !== undefined) {
					const cal = row[reversedMapping.probeCalibrated]?.toLowerCase();
					record.probeCalibrated = cal === 'true' || cal === '1' || cal === 'yes';
				}

				if (hasRequired) {
					records.push(record as TemperatureRecord);
				} else {
					errors.push(`第 ${i + 1} 行: 缺少必需的温度数据`);
				}
			} catch (e) {
				errors.push(`第 ${i + 1} 行: 数据解析失败`);
			}
		}

		if (records.length > 0) {
			await insertTemperatureRecords(records);
		}

		return json({
			success: true,
			data: {
				total: lines.length - 1,
				imported: records.length,
				failed: errors.length,
				filledMissing,
				errors: errors.slice(0, 20),
				preview: records.slice(0, 10).map((r) => ({
					...r,
					timestamp: r.timestamp.toISOString(),
					createdAt: r.createdAt.toISOString(),
					probeCalibrationDate: r.probeCalibrationDate?.toISOString()
				}))
			}
		});
	} catch (e) {
		return json({ success: false, error: (e as Error).message }, { status: 500 });
	}
}

export async function GET() {
	try {
		await initDB();
		return json({
			success: true,
			data: {
				importOptions: {
					supportedFormats: ['CSV', 'XLSX', 'XLS'],
					maxFileSize: 50 * 1024 * 1024,
					requiredFields: ['temperature'],
					optionalFields: [
						'shipmentId',
						'batchNo',
						'probeId',
						'timestamp',
						'humidity',
						'latitude',
						'longitude',
						'doorStatus',
						'probeCalibrated',
						'probeCalibrationDate'
					],
					missingValueStrategies: [
						{ key: 'linear_interpolation', label: '线性插值' },
						{ key: 'forward_fill', label: '前向填充' },
						{ key: 'default', label: '默认值填充' }
					]
				}
			}
		});
	} catch (e) {
		return json({ success: false, error: (e as Error).message }, { status: 500 });
	}
}
