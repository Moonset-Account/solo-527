import type { RequestHandler } from './$types';
import { getAllRecords } from '$lib/server/db';
import { filterRecords } from '$lib/analytics';
import { formatRecordForCSV } from '$lib/mockData';
import { desensitizeRecords, getCurrentUserRole, getDesensitizedFields, checkPermission } from '$lib/server/security';
import Papa from 'papaparse';
import type { FilterParams } from '$types';

export const POST: RequestHandler = async ({ request }) => {
	const role = getCurrentUserRole();

	if (!checkPermission(role, 'export_csv')) {
		return new Response(JSON.stringify({ error: '无权限导出 CSV' }), {
			status: 403,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	const body = await request.json();
	const { filters, fields } = body as {
		filters: Partial<FilterParams>;
		fields?: string[];
	};

	let records = await getAllRecords();
	records = filterRecords(records, filters);
	records = desensitizeRecords(records, role);

	const allowedFields = getDesensitizedFields(role);
	const exportFields = fields && fields.length > 0
		? fields.filter((f) => allowedFields.includes(f))
		: allowedFields;

	const csvData = records.map((r) => formatRecordForCSV(r));

	const csv = Papa.unparse(csvData, { columns: exportFields });

	const headers = new Headers();
	headers.set('Content-Type', 'text/csv; charset=utf-8');
	headers.set(
		'Content-Disposition',
		`attachment; filename="wait_time_analysis_${new Date().toISOString().slice(0, 10)}.csv"`
	);

	return new Response('\uFEFF' + csv, { headers });
};
