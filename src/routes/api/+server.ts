import { json, type RequestHandler } from '@sveltejs/kit';
import {
  mockSubscriptions,
  mockTodos,
  mockExceptions,
  mockOrders,
  mockRetentionAlerts,
  mockApiLogs
} from '$lib/mock-data';

export const GET: RequestHandler = async ({ url }) => {
  const resource = url.searchParams.get('resource');

  switch (resource) {
    case 'subscriptions':
      return json({ data: mockSubscriptions });
    case 'todos':
      return json({ data: mockTodos });
    case 'exceptions':
      return json({ data: mockExceptions });
    case 'orders':
      return json({ data: mockOrders });
    case 'alerts':
      return json({ data: mockRetentionAlerts });
    case 'api-logs':
      return json({ data: mockApiLogs });
    default:
      return json(
        {
          subscriptions: mockSubscriptions.length,
          todos: mockTodos.length,
          exceptions: mockExceptions.length,
          orders: mockOrders.length,
          alerts: mockRetentionAlerts.length
        },
        { status: 200 }
      );
  }
};
