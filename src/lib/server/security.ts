import type { VisitRecord, UserRole } from '$types';

function hashValue(value: string): string {
	let hash = 0;
	for (let i = 0; i < value.length; i++) {
		const char = value.charCodeAt(i);
		hash = ((hash << 5) - hash) + char;
		hash = hash & hash;
	}
	return Math.abs(hash).toString(16).padStart(12, '0').slice(0, 12);
}

const doctorCodeMap = new Map<string, string>();
let doctorCodeCounter = 0;

function getDoctorCode(doctor: string): string {
	if (!doctorCodeMap.has(doctor)) {
		doctorCodeCounter++;
		const code = String.fromCharCode(64 + doctorCodeCounter);
		doctorCodeMap.set(doctor, `医生${code}`);
	}
	return doctorCodeMap.get(doctor)!;
}

export function desensitizeRecord(record: VisitRecord, role: UserRole): VisitRecord {
	if (role === 'analyst' || role === 'manager') {
		return record;
	}

	const desensitized: VisitRecord = {
		...record,
		visitId: hashValue(record.visitId),
		doctor: getDoctorCode(record.doctor),
		anomalyReason: undefined,
		isAnomaly: false
	};

	if (role !== 'analyst' && role !== 'manager') {
		desensitized.registerTime = record.registerTime
			? new Date(new Date(record.registerTime).setSeconds(0, 0))
			: null;
		desensitized.checkInTime = record.checkInTime
			? new Date(new Date(record.checkInTime).setSeconds(0, 0))
			: null;
		desensitized.triageTime = record.triageTime
			? new Date(new Date(record.triageTime).setSeconds(0, 0))
			: null;
		desensitized.callTime = record.callTime
			? new Date(new Date(record.callTime).setSeconds(0, 0))
			: null;
		desensitized.paymentTime = record.paymentTime
			? new Date(new Date(record.paymentTime).setSeconds(0, 0))
			: null;
		desensitized.pickupTime = record.pickupTime
			? new Date(new Date(record.pickupTime).setSeconds(0, 0))
			: null;
	}

	return desensitized;
}

export function desensitizeRecords(records: VisitRecord[], role: UserRole): VisitRecord[] {
	if (role === 'analyst' || role === 'manager') {
		return records;
	}
	return records.map((r) => desensitizeRecord(r, role));
}

export function getDesensitizedFields(role: UserRole): string[] {
	if (role === 'analyst' || role === 'manager') {
		return ['visitId', 'department', 'doctor', 'patientType', 'timeSlot',
			'registerTime', 'checkInTime', 'triageTime', 'callTime', 'paymentTime', 'pickupTime',
			'totalWait', 'isAnomaly', 'anomalyReason'];
	}
	return ['visitId', 'department', 'doctor', 'patientType', 'timeSlot',
		'registerTime', 'checkInTime', 'triageTime', 'callTime', 'paymentTime', 'pickupTime',
		'totalWait'];
}

export function checkPermission(role: UserRole, permission: string): boolean {
	const permissions: Record<UserRole, string[]> = {
		public: [
			'view_analytics',
			'view_dictionary',
			'export_csv'
		],
		manager: [
			'view_analytics',
			'view_dictionary',
			'export_csv',
			'export_pdf',
			'view_anomalies'
		],
		analyst: [
			'view_analytics',
			'view_dictionary',
			'export_csv',
			'export_pdf',
			'import_data',
			'view_anomalies',
			'annotate_anomalies'
		]
	};

	return permissions[role]?.includes(permission) || false;
}

export function getCurrentUserRole(): UserRole {
	return 'analyst';
}

export function validateDataQuality(records: VisitRecord[]): {
	valid: VisitRecord[];
	invalid: { record: VisitRecord; reason: string }[];
	warnings: string[];
} {
	const valid: VisitRecord[] = [];
	const invalid: { record: VisitRecord; reason: string }[] = [];
	const warnings: string[] = [];

	const missingFields = new Map<string, number>();
	const timeOrderIssues = 0;

	for (const record of records) {
		const issues: string[] = [];

		if (!record.department) issues.push('科室为空');
		if (!record.doctor) issues.push('医生为空');
		if (!record.patientType) issues.push('患者类型为空');
		if (!record.timeSlot) issues.push('时段为空');

		const times = [
			['挂号', record.registerTime],
			['签到', record.checkInTime],
			['分诊', record.triageTime],
			['叫号', record.callTime],
			['缴费', record.paymentTime],
			['取药', record.pickupTime]
		] as const;

		for (let i = 0; i < times.length - 1; i++) {
			const [currName, currTime] = times[i];
			const [nextName, nextTime] = times[i + 1];
			if (currTime && nextTime && currTime > nextTime) {
				issues.push(`${currName}时间晚于${nextName}时间`);
			}
		}

		for (const [name, time] of times) {
			if (!time) {
				missingFields.set(name, (missingFields.get(name) || 0) + 1);
			}
		}

		if (issues.length > 0) {
			invalid.push({ record, reason: issues.join('; ') });
		} else {
			valid.push(record);
		}
	}

	for (const [field, count] of missingFields) {
		if (count > records.length * 0.05) {
			warnings.push(`${field}缺失率较高: ${((count / records.length) * 100).toFixed(1)}%`);
		}
	}

	if (invalid.length > records.length * 0.1) {
		warnings.push(`异常数据比例较高: ${((invalid.length / records.length) * 100).toFixed(1)}%`);
	}

	return { valid, invalid, warnings };
}
