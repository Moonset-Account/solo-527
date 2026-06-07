import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { insertRecords } from '$lib/server/db';
import { validateDataQuality } from '$lib/server/security';
import Papa from 'papaparse';
import type { VisitRecord, PatientType } from '$types';

export const POST: RequestHandler = async ({ request }) => {
	const formData = await request.formData();
	const file = formData.get('file') as File;

	if (!file) {
		return json({ error: '未上传文件' }, { status: 400 });
	}

	const text = await file.text();
	const result = Papa.parse(text, {
		header: true,
		skipEmptyLines: true
	});

	const records: VisitRecord[] = [];
	const errors: string[] = [];

	for (let i = 0; i < result.data.length; i++) {
		const row = result.data[i] as Record<string, string>;
		try {
			const record: VisitRecord = {
				visitId: row.visitId || row['就诊ID'] || `IMPORT_${Date.now()}_${i}`,
				department: row.department || row['科室'] || '',
				doctor: row.doctor || row['医生'] || '',
				patientType: (row.patientType || row['患者类型'] || '普通') as PatientType,
				timeSlot: row.timeSlot || row['时段'] || '',
				registerTime: parseDate(row.registerTime || row['挂号时间']),
				checkInTime: parseDate(row.checkInTime || row['签到时间']),
				triageTime: parseDate(row.triageTime || row['分诊时间']),
				callTime: parseDate(row.callTime || row['叫号时间']),
				paymentTime: parseDate(row.paymentTime || row['缴费时间']),
				pickupTime: parseDate(row.pickupTime || row['取药时间']),
				isAnomaly: row.isAnomaly === 'true' || row['是否异常'] === '是',
				anomalyReason: row.anomalyReason || row['异常原因']
			};
			records.push(record);
		} catch (e: any) {
			errors.push(`第 ${i + 2} 行: ${e.message}`);
		}
	}

	const { valid, invalid, warnings } = validateDataQuality(records);

	await insertRecords(valid);

	return json({
		success: valid.length,
		failed: invalid.length + errors.length,
		errors: [...errors, ...invalid.map((i) => `${i.record.visitId}: ${i.reason}`)],
		warnings,
		totalProcessed: records.length
	});
};

function parseDate(value: string | undefined): Date | null {
	if (!value) return null;
	const date = new Date(value);
	return isNaN(date.getTime()) ? null : date;
}
