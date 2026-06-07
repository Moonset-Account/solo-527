import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { getFunnelData } from '$lib/server/services.js';

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

  const data = await getFunnelData(filters);
  return json(data);
};
