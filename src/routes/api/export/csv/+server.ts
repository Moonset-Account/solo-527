import type { RequestHandler } from './$types';
import { getAllRecords } from '$lib/server/db';
import { filterRecords } from '$lib/analytics';
import { formatRecordForCSV } from '$lib/mockData';
import { desensitizeRecords, getCurrentUserRole } from '$lib/server/security';
import Papa from 'papaparse';
import type { FilterParams } from '$types';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const { filters, fields } = body as {
		filters: Partial<FilterParams>;
		fields?: string[];
	};

	const role = getCurrentUserRole();
	let records = await getAllRecords();
	records = filterRecords(records, filters);
	records = desensitizeRecords(records, role);

	const csvData = records.map((r) => formatRecordForCSV(r));

	const csv = Papa.unparse(csvData, {
		columns: fields && fields.length > 0 ? fields : undefined
	});

	const headers = new Headers();
	headers.set('Content-Type', 'text/csv; charset=utf-8');
	headers.set(
		'Content-Disposition',
		`attachment; filename="wait_time_analysis_${new Date().toISOString().slice(0, 10)}.csv"`
	);

	return new Response('\uFEFF' + csv, { headers });
};
