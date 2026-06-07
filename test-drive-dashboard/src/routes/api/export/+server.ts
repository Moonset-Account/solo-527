import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { getExportData } from '$lib/server/services.js';
import XLSX from 'xlsx';

export const GET: RequestHandler = async ({ url }) => {
  const filters = {
    model_id: url.searchParams.get('model_id') || '',
    sales_id: url.searchParams.get('sales_id') || '',
    source: url.searchParams.get('source') || '',
    period_start: url.searchParams.get('period_start') || '',
    period_end: url.searchParams.get('period_end') || '',
    store_id: url.searchParams.get('store_id') || '',
    is_visited: url.searchParams.get('is_visited') || ''
  };

  const data = await getExportData(filters);

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, '试驾预约报表');

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  return new Response(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename=test-drive-report.xlsx'
    }
  });
};
