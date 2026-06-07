import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { resetSeeded } from '$lib/server/services.js';

export const POST: RequestHandler = async () => {
  resetSeeded();
  return json({ ok: true, message: 'Database will re-seed on next request' });
};
