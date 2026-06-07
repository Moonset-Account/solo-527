import type { VisitRecord, PatientType } from '$types';
import { departments, timeSlots } from '$lib/dictionary';

function seededRandom(seed: number): () => number {
	let s = seed;
	return function () {
		s = (s * 9301 + 49297) % 233280;
		return s / 233280;
	};
}

function randomInt(min: number, max: number, rand: () => number): number {
	return Math.floor(rand() * (max - min + 1)) + min;
}

function formatDate(date: Date): string {
	return date.toISOString().slice(0, 19).replace('T', ' ');
}

export function generateMockData(count: number = 5000, seed: number = 42): VisitRecord[] {
	const rand = seededRandom(seed);
	const records: VisitRecord[] = [];
	const patientTypeList: PatientType[] = ['普通', '急诊', '复诊', 'VIP'];
	const doctorNames = ['张医生', '李医生', '王医生', '刘医生', '陈医生', '杨医生', '赵医生', '黄医生'];

	const baseDate = new Date('2024-06-01');

	for (let i = 0; i < count; i++) {
		const daysOffset = randomInt(0, 29, rand);
		const visitDate = new Date(baseDate);
		visitDate.setDate(visitDate.getDate() + daysOffset);

		const isWeekend = visitDate.getDay() === 0 || visitDate.getDay() === 6;
		const timeSlotIdx = isWeekend
			? randomInt(0, 1, rand)
			: randomInt(0, timeSlots.length - 1, rand);
		const timeSlot = timeSlots[timeSlotIdx];

		let baseHour: number;
		if (timeSlotIdx === 0) {
			baseHour = 8 + randomInt(0, 3, rand);
		} else if (timeSlotIdx === 1) {
			baseHour = 13 + randomInt(0, 3, rand);
		} else {
			baseHour = 18 + randomInt(0, 2, rand);
		}

		const registerTime = new Date(visitDate);
		registerTime.setHours(baseHour, randomInt(0, 59, rand), randomInt(0, 59, rand));

		const deptIdx = randomInt(0, departments.length - 1, rand);
		const department = departments[deptIdx];
		const doctorIdx = randomInt(0, doctorNames.length - 1, rand);
		const doctor = doctorNames[doctorIdx];
		const patientTypeIdx = randomInt(0, patientTypeList.length - 1, rand);
		const patientType = patientTypeList[patientTypeIdx];

		let checkInDelay: number;
		let triageDelay: number;
		let callDelay: number;
		let paymentDelay: number;
		let pickupDelay: number;

		if (patientType === 'VIP') {
			checkInDelay = randomInt(1, 5, rand);
			triageDelay = randomInt(2, 8, rand);
			callDelay = randomInt(5, 20, rand);
			paymentDelay = randomInt(1, 5, rand);
			pickupDelay = randomInt(3, 10, rand);
		} else if (patientType === '急诊') {
			checkInDelay = randomInt(1, 3, rand);
			triageDelay = randomInt(1, 5, rand);
			callDelay = randomInt(3, 15, rand);
			paymentDelay = randomInt(2, 8, rand);
			pickupDelay = randomInt(5, 15, rand);
		} else {
			checkInDelay = randomInt(2, 10, rand);
			triageDelay = randomInt(5, 20, rand);
			callDelay = randomInt(15, 60, rand);
			paymentDelay = randomInt(3, 15, rand);
			pickupDelay = randomInt(5, 25, rand);
		}

		if (isWeekend) {
			callDelay = Math.floor(callDelay * 1.3);
			triageDelay = Math.floor(triageDelay * 1.2);
		}

		if (deptIdx === 2 || deptIdx === 3) {
			callDelay = Math.floor(callDelay * 1.4);
		}

		const isAnomaly = rand() < 0.03;
		let anomalyReason: string | undefined;

		if (isAnomaly) {
			const anomalyType = randomInt(0, 2, rand);
			if (anomalyType === 0) {
				callDelay = callDelay * 3;
				anomalyReason = '系统故障导致叫号延迟';
			} else if (anomalyType === 1) {
				pickupDelay = pickupDelay * 4;
				anomalyReason = '药品缺货临时调配';
			} else {
				anomalyReason = '患者临时取消';
			}
		}

		const checkInTime = new Date(registerTime.getTime() + checkInDelay * 60 * 1000);
		const triageTime = new Date(checkInTime.getTime() + triageDelay * 60 * 1000);
		const callTime = new Date(triageTime.getTime() + callDelay * 60 * 1000);
		const paymentTime = new Date(callTime.getTime() + randomInt(10, 30, rand) * 60 * 1000 + paymentDelay * 60 * 1000);
		const pickupTime = new Date(paymentTime.getTime() + pickupDelay * 60 * 1000);

		records.push({
			visitId: `V${String(i + 1).padStart(6, '0')}`,
			department,
			doctor,
			patientType,
			timeSlot,
			registerTime,
			checkInTime,
			triageTime,
			callTime,
			paymentTime,
			pickupTime,
			isAnomaly,
			anomalyReason
		});
	}

	return records;
}

export function formatRecordForCSV(record: VisitRecord): Record<string, string> {
	return {
		visitId: record.visitId,
		department: record.department,
		doctor: record.doctor,
		patientType: record.patientType,
		timeSlot: record.timeSlot,
		registerTime: record.registerTime ? formatDate(record.registerTime) : '',
		checkInTime: record.checkInTime ? formatDate(record.checkInTime) : '',
		triageTime: record.triageTime ? formatDate(record.triageTime) : '',
		callTime: record.callTime ? formatDate(record.callTime) : '',
		paymentTime: record.paymentTime ? formatDate(record.paymentTime) : '',
		pickupTime: record.pickupTime ? formatDate(record.pickupTime) : '',
		isAnomaly: String(record.isAnomaly),
		anomalyReason: record.anomalyReason || ''
	};
}
