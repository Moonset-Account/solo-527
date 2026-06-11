import { json, type RequestHandler } from '@sveltejs/kit';
import { mockExceptions } from '$lib/mock-data';
import type { ExceptionRecord } from '$lib/types';

export const POST: RequestHandler = async ({ request }) => {
  const body = (await request.json()) as {
    id: string;
    result: string;
    remark?: string;
    hostId: string;
    hostName: string;
  };

  const idx = mockExceptions.findIndex((e) => e.id === body.id);
  if (idx < 0) {
    return json({ error: '异常记录不存在' }, { status: 404 });
  }

  mockExceptions[idx] = {
    ...mockExceptions[idx],
    status: 'resolved',
    result: body.result,
    remark: body.remark || null,
    hostId: body.hostId,
    hostName: body.hostName,
    resolvedAt: new Date().toISOString()
  } as ExceptionRecord;

  return json({ data: mockExceptions[idx], ok: true });
};
