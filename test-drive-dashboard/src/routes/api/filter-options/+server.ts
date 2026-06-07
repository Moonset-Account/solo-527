import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { getFilterOptions } from '$lib/server/services.js';

export const GET: RequestHandler = async () => {
  const data = await getFilterOptions();
  return json(data);
};
