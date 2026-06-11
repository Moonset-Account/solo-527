import { json, type RequestHandler } from '@sveltejs/kit';
import { mockApiLogs } from '$lib/mock-data';

export const POST: RequestHandler = async ({ request }) => {
  const body = (await request.json()) as { id: string };

  const idx = mockApiLogs.findIndex((l) => l.id === body.id);
  if (idx < 0) {
    return json({ error: '日志不存在' }, { status: 404 });
  }

  mockApiLogs[idx] = {
    ...mockApiLogs[idx],
    lastRetryAt: new Date().toISOString(),
    retryCount: mockApiLogs[idx].retryCount + 1
  };

  return json({ data: mockApiLogs[idx], ok: true });
};
