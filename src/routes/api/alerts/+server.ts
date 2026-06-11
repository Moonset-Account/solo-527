import { json, type RequestHandler } from '@sveltejs/kit';
import { mockRetentionAlerts } from '$lib/mock-data';

export const POST: RequestHandler = async ({ request }) => {
  const body = (await request.json()) as {
    id: string;
    action: 'notify' | 'acknowledge' | 'resolve';
  };

  const idx = mockRetentionAlerts.findIndex((a) => a.id === body.id);
  if (idx < 0) {
    return json({ error: '预警不存在' }, { status: 404 });
  }

  switch (body.action) {
    case 'notify':
      mockRetentionAlerts[idx] = {
        ...mockRetentionAlerts[idx],
        notifiedAt: new Date().toISOString()
      };
      break;
    case 'acknowledge':
      mockRetentionAlerts[idx] = {
        ...mockRetentionAlerts[idx],
        status: 'acknowledged'
      };
      break;
    case 'resolve':
      mockRetentionAlerts[idx] = {
        ...mockRetentionAlerts[idx],
        status: 'resolved'
      };
      break;
  }

  return json({ data: mockRetentionAlerts[idx], ok: true });
};
