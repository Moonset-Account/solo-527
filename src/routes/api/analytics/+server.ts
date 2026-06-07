import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { getAllRecords } from '$lib/server/db';
import { desensitizeRecords, getCurrentUserRole } from '$lib/server/security';
import {
	filterRecords,
	calculateOverview,
	calculateSankeyData,
	calculateDepartmentComparison,
	calculateIntradayTrend,
	getAllWaitTimes,
	calculateStats,
	calculateHistogram
} from '$lib/analytics';
import type { FilterParams } from '$types';

export const GET: RequestHandler = async ({ url }) => {
	const role = getCurrentUserRole();
	let allRecords = await getAllRecords();

	const departments = url.searchParams.getAll('departments');
	const doctors = url.searchParams.getAll('doctors');
	const timeSlots = url.searchParams.getAll('timeSlots');
	const patientTypes = url.searchParams.getAll('patientTypes');
	const processNodes = url.searchParams.getAll('processNodes');
	const excludeAnomalies = url.searchParams.get('excludeAnomalies') !== 'false';

	const filters: Partial<FilterParams> = {
		departments: departments.length > 0 ? departments : undefined,
		doctors: doctors.length > 0 ? doctors : undefined,
		timeSlots: timeSlots.length > 0 ? timeSlots : undefined,
		patientTypes: patientTypes.length > 0 ? (patientTypes as any) : undefined,
		processNodes: processNodes.length > 0 ? (processNodes as any) : undefined,
		excludeAnomalies
	};

	let filteredRecords = filterRecords(allRecords, filters);
	filteredRecords = desensitizeRecords(filteredRecords, role);

	const selectedNodes = filters.processNodes as string[] | undefined;

	const overview = calculateOverview(filteredRecords, selectedNodes);
	const sankey = calculateSankeyData(filteredRecords, selectedNodes);
	const deptCompare = calculateDepartmentComparison(filteredRecords);
	const intraday = calculateIntradayTrend(filteredRecords);

	const allWaitTimes = getAllWaitTimes(filteredRecords, selectedNodes);
	const nodeStats: Record<string, any> = {};
	const distributions: Record<string, any> = {};

	for (const [node, waits] of allWaitTimes) {
		nodeStats[node] = calculateStats(waits);
		distributions[node] = calculateHistogram(waits, 15);
	}

	return json({
		overview,
		sankey,
		deptCompare,
		intraday,
		nodeStats,
		distributions,
		recordCount: filteredRecords.length,
		filters
	});
};
