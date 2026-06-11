import {
  mockOrders,
  mockSubscriptions,
  mockRetentionAlerts,
  mockApiLogs,
  mockUsers
} from '$lib/mock-data';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
  let orders = mockOrders;
  let subscriptions = mockSubscriptions;
  let retentionAlerts = mockRetentionAlerts;
  let apiLogs = mockApiLogs;
  let users = mockUsers;

  try {
    const res = await fetch('/api/orders');
    if (res.ok) {
      const json = await res.json();
      if (json.data) {
        orders = json.data;
      }
    }
  } catch {}

  try {
    const res = await fetch('/api/subscriptions');
    if (res.ok) {
      const json = await res.json();
      if (json.data) {
        subscriptions = json.data;
      }
    }
  } catch {}

  try {
    const res = await fetch('/api/alerts');
    if (res.ok) {
      const json = await res.json();
      if (json.data) {
        retentionAlerts = json.data;
      }
    }
  } catch {}

  try {
    const res = await fetch('/api/api-logs');
    if (res.ok) {
      const json = await res.json();
      if (json.data) {
        apiLogs = json.data;
      }
    }
  } catch {}

  try {
    const res = await fetch('/api/users');
    if (res.ok) {
      const json = await res.json();
      if (json.data) {
        users = json.data;
      }
    }
  } catch {}

  return {
    orders,
    subscriptions,
    retentionAlerts,
    apiLogs,
    users
  };
};
