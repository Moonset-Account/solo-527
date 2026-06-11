import { json, type RequestHandler } from '@sveltejs/kit';
import { mockTodos } from '$lib/mock-data';

export const POST: RequestHandler = async ({ request }) => {
  const body = (await request.json()) as {
    id: string;
    status: 'pending' | 'processing' | 'done';
  };

  const idx = mockTodos.findIndex((t) => t.id === body.id);
  if (idx < 0) {
    return json({ error: '待办不存在' }, { status: 404 });
  }

  mockTodos[idx] = {
    ...mockTodos[idx],
    status: body.status
  };

  return json({ data: mockTodos[idx], ok: true });
};
