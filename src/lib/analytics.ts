import type { VisitRecord, FilterParams, WaitTimeStats, SankeyData, DepartmentCompareItem, IntradayTrendPoint, OverviewStats, HistogramBin } from '$types';
import { processNodes } from '$lib/dictionary';

export function calculateWaitMinutes(start: Date | null, end: Date | null): number | null {
	if (!start || !end) return null;
	const diff = end.getTime() - start.getTime();
	if (diff < 0) return null;
	return Math.round(diff / 60000);
}

export function getWaitTimeForNode(record: VisitRecord, node: string): number | null {
	switch (node) {
		case '挂号-签到':
			return calculateWaitMinutes(record.registerTime, record.checkInTime);
		case '签到-分诊':
			return calculateWaitMinutes(record.checkInTime, record.triageTime);
		case '分诊-叫号':
			return calculateWaitMinutes(record.triageTime, record.callTime);
		case '叫号-缴费':
			return calculateWaitMinutes(record.callTime, record.paymentTime);
		case '缴费-取药':
			return calculateWaitMinutes(record.paymentTime, record.pickupTime);
		default:
			return null;
	}
}

export function getAllWaitTimes(
	records: VisitRecord[],
	selectedNodes?: string[]
): Map<string, number[]> {
	const waitTimes = new Map<string, number[]>();
	const allNodePairs = [
		{ pair: '挂号-签到', nodes: ['挂号', '签到'] },
		{ pair: '签到-分诊', nodes: ['签到', '分诊'] },
		{ pair: '分诊-叫号', nodes: ['分诊', '叫号'] },
		{ pair: '叫号-缴费', nodes: ['叫号', '缴费'] },
		{ pair: '缴费-取药', nodes: ['缴费', '取药'] }
	];

	const nodeFilter = selectedNodes && selectedNodes.length > 0 ? selectedNodes : null;
	const filteredPairs = nodeFilter
		? allNodePairs.filter((p) => p.nodes.every((n) => nodeFilter.includes(n)))
		: allNodePairs;

	for (const { pair } of filteredPairs) {
		waitTimes.set(pair, []);
	}

	for (const record of records) {
		for (const { pair } of filteredPairs) {
			const wait = getWaitTimeForNode(record, pair);
			if (wait !== null && wait >= 0) {
				waitTimes.get(pair)!.push(wait);
			}
		}
	}

	return waitTimes;
}

export function calculateStats(values: number[]): Omit<WaitTimeStats, 'node'> {
	if (values.length === 0) {
		return { avg: 0, median: 0, p95: 0, min: 0, max: 0, count: 0 };
	}

	const sorted = [...values].sort((a, b) => a - b);
	const sum = sorted.reduce((a, b) => a + b, 0);
	const avg = sum / sorted.length;
	const median = sorted[Math.floor(sorted.length / 2)];
	const p95 = sorted[Math.floor(sorted.length * 0.95)];
	const min = sorted[0];
	const max = sorted[sorted.length - 1];

	return { avg: Math.round(avg * 10) / 10, median, p95, min, max, count: sorted.length };
}

export function filterRecords(records: VisitRecord[], params: Partial<FilterParams>): VisitRecord[] {
	return records.filter((r) => {
		if (params.departments && params.departments.length > 0) {
			if (!params.departments.includes(r.department)) return false;
		}
		if (params.doctors && params.doctors.length > 0) {
			if (!params.doctors.includes(r.doctor)) return false;
		}
		if (params.timeSlots && params.timeSlots.length > 0) {
			if (!params.timeSlots.includes(r.timeSlot)) return false;
		}
		if (params.patientTypes && params.patientTypes.length > 0) {
			if (!params.patientTypes.includes(r.patientType)) return false;
		}
		if (params.processNodes && params.processNodes.length > 0) {
			const nodeTimeMap: Record<string, Date | null> = {
				挂号: r.registerTime,
				签到: r.checkInTime,
				分诊: r.triageTime,
				叫号: r.callTime,
				缴费: r.paymentTime,
				取药: r.pickupTime
			};
			const hasAllNodes = params.processNodes.every((node) => nodeTimeMap[node] !== null);
			if (!hasAllNodes) return false;
		}
		if (params.dateRange) {
			if (r.registerTime) {
				if (r.registerTime < params.dateRange.start) return false;
				if (r.registerTime > params.dateRange.end) return false;
			}
		}
		if (params.excludeAnomalies && r.isAnomaly) {
			return false;
		}
		return true;
	});
}

export function calculateSankeyData(
	records: VisitRecord[],
	selectedNodes?: string[]
): SankeyData {
	const nodeSet = new Set<string>();
	const linkMap = new Map<string, { source: string; target: string; value: number; totalWait: number }>();

	const allStages = ['挂号', '签到', '分诊', '叫号', '缴费', '取药'];
	const nodeFilter = selectedNodes && selectedNodes.length > 0 ? selectedNodes : allStages;

	for (const record of records) {
		const stages: { name: string; time: Date | null }[] = [
			{ name: '挂号', time: record.registerTime },
			{ name: '签到', time: record.checkInTime },
			{ name: '分诊', time: record.triageTime },
			{ name: '叫号', time: record.callTime },
			{ name: '缴费', time: record.paymentTime },
			{ name: '取药', time: record.pickupTime }
		];

		let validStages = stages.filter((s) => s.time !== null);
		validStages = validStages.filter((s) => nodeFilter.includes(s.name));

		if (validStages.length < 2) continue;

		for (let i = 0; i < validStages.length - 1; i++) {
			const source = validStages[i].name;
			const target = validStages[i + 1].name;
			nodeSet.add(source);
			nodeSet.add(target);

			const waitTime = calculateWaitMinutes(validStages[i].time, validStages[i + 1].time);
			const key = `${source}->${target}`;

			if (!linkMap.has(key)) {
				linkMap.set(key, { source, target, value: 0, totalWait: 0 });
			}

			const link = linkMap.get(key)!;
			link.value += 1;
			if (waitTime !== null) {
				link.totalWait += waitTime;
			}
		}
	}

	const nodes = Array.from(nodeSet).map((name) => ({ name }));
	const links = Array.from(linkMap.values()).map((l) => ({
		source: l.source,
		target: l.target,
		value: l.value,
		waitTime: l.value > 0 ? Math.round(l.totalWait / l.value) : 0
	}));

	return { nodes, links };
}

export function calculateHistogram(values: number[], binCount: number = 20): HistogramBin[] {
	if (values.length === 0) return [];

	const min = Math.min(...values);
	const max = Math.max(...values);
	const binWidth = (max - min) / binCount;

	const bins: HistogramBin[] = [];
	for (let i = 0; i < binCount; i++) {
		bins.push({
			start: Math.round((min + i * binWidth) * 10) / 10,
			end: Math.round((min + (i + 1) * binWidth) * 10) / 10,
			count: 0
		});
	}

	for (const value of values) {
		let binIndex = Math.floor((value - min) / binWidth);
		if (binIndex >= binCount) binIndex = binCount - 1;
		if (binIndex < 0) binIndex = 0;
		bins[binIndex].count++;
	}

	return bins;
}

export function calculateDepartmentComparison(records: VisitRecord[]): DepartmentCompareItem[] {
	const deptMap = new Map<string, { records: VisitRecord[]; waitTimes: number[] }>();

	for (const record of records) {
		if (!deptMap.has(record.department)) {
			deptMap.set(record.department, { records: [], waitTimes: [] });
		}
		const dept = deptMap.get(record.department)!;
		dept.records.push(record);

		const totalWait =
			calculateWaitMinutes(record.registerTime, record.callTime) ||
			0;
		if (totalWait > 0) {
			dept.waitTimes.push(totalWait);
		}
	}

	const result: DepartmentCompareItem[] = [];

	for (const [dept, data] of deptMap) {
		const stats = calculateStats(data.waitTimes);
		const nodeWaits: { node: string; avg: number }[] = [];
		const nodePairs = ['挂号-签到', '签到-分诊', '分诊-叫号', '叫号-缴费', '缴费-取药'];

		for (const node of nodePairs) {
			const waits: number[] = [];
			for (const record of data.records) {
				const w = getWaitTimeForNode(record, node);
				if (w !== null) waits.push(w);
			}
			if (waits.length > 0) {
				nodeWaits.push({ node, avg: calculateStats(waits).avg });
			}
		}

		nodeWaits.sort((a, b) => b.avg - a.avg);

		result.push({
			department: dept,
			avgWaitTime: stats.avg,
			medianWaitTime: stats.median,
			patientCount: data.records.length,
			bottleneckNode: nodeWaits.length > 0 ? nodeWaits[0].node : '未知'
		});
	}

	result.sort((a, b) => b.avgWaitTime - a.avgWaitTime);
	return result;
}

export function calculateIntradayTrend(records: VisitRecord[]): IntradayTrendPoint[] {
	const hourMap = new Map<number, { waitTimes: number[]; count: number }>();

	for (let h = 7; h <= 21; h++) {
		hourMap.set(h, { waitTimes: [], count: 0 });
	}

	for (const record of records) {
		if (!record.registerTime) continue;

		const hour = record.registerTime.getHours();
		if (!hourMap.has(hour)) continue;

		const wait = calculateWaitMinutes(record.registerTime, record.callTime);
		const data = hourMap.get(hour)!;
		data.count++;
		if (wait !== null && wait > 0) {
			data.waitTimes.push(wait);
		}
	}

	const result: IntradayTrendPoint[] = [];
	for (let h = 7; h <= 21; h++) {
		const data = hourMap.get(h)!;
		const stats = calculateStats(data.waitTimes);

		let timeSlot = '';
		if (h < 12) timeSlot = '上午';
		else if (h < 18) timeSlot = '下午';
		else timeSlot = '晚间';

		result.push({
			hour: h,
			timeSlot,
			avgWaitTime: stats.avg,
			patientCount: data.count
		});
	}

	return result;
}

export function calculateOverview(records: VisitRecord[], selectedNodes?: string[]): OverviewStats {
	const allWaitTimes: number[] = [];
	const nodeWaits: Map<string, number[]> = new Map();
	const deptCount: Map<string, number> = new Map();
	const slotCount: Map<string, number> = new Map();
	let minDate: Date | null = null;
	let maxDate: Date | null = null;
	let anomalyCount = 0;

	const allNodePairs = [
		{ pair: '挂号-签到', nodes: ['挂号', '签到'] },
		{ pair: '签到-分诊', nodes: ['签到', '分诊'] },
		{ pair: '分诊-叫号', nodes: ['分诊', '叫号'] },
		{ pair: '叫号-缴费', nodes: ['叫号', '缴费'] },
		{ pair: '缴费-取药', nodes: ['缴费', '取药'] }
	];

	const nodeFilter = selectedNodes && selectedNodes.length > 0 ? selectedNodes : null;
	const filteredPairs = nodeFilter
		? allNodePairs.filter((p) => p.nodes.every((n) => nodeFilter.includes(n)))
		: allNodePairs;

	for (const { pair } of filteredPairs) {
		nodeWaits.set(pair, []);
	}

	for (const record of records) {
		if (record.isAnomaly) anomalyCount++;

		if (record.registerTime) {
			if (!minDate || record.registerTime < minDate) minDate = record.registerTime;
			if (!maxDate || record.registerTime > maxDate) maxDate = record.registerTime;
		}

		for (const { pair } of filteredPairs) {
			const w = getWaitTimeForNode(record, pair);
			if (w !== null && w >= 0) {
				nodeWaits.get(pair)!.push(w);
				allWaitTimes.push(w);
			}
		}

		deptCount.set(record.department, (deptCount.get(record.department) || 0) + 1);
		slotCount.set(record.timeSlot, (slotCount.get(record.timeSlot) || 0) + 1);
	}

	const allStats = calculateStats(allWaitTimes);

	let longestNode = '';
	let longestTime = 0;
	for (const [node, waits] of nodeWaits) {
		const s = calculateStats(waits);
		if (s.avg > longestTime) {
			longestTime = s.avg;
			longestNode = node;
		}
	}

	let busiestDept = '';
	let busiestDeptCount = 0;
	for (const [dept, count] of deptCount) {
		if (count > busiestDeptCount) {
			busiestDeptCount = count;
			busiestDept = dept;
		}
	}

	let busiestSlot = '';
	let busiestSlotCount = 0;
	for (const [slot, count] of slotCount) {
		if (count > busiestSlotCount) {
			busiestSlotCount = count;
			busiestSlot = slot;
		}
	}

	return {
		totalPatients: records.length,
		totalAvgWaitTime: allStats.avg,
		longestWaitNode: longestNode,
		longestWaitTime: longestTime,
		busiestDepartment: busiestDept,
		busiestTimeSlot: busiestSlot,
		anomalyCount,
		dataDateRange: {
			start: minDate || new Date(),
			end: maxDate || new Date()
		}
	};
}
