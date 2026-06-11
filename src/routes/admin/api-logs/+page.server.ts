import { mockApiLogs } from '$lib/mock-data';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
  let apiLogs = mockApiLogs;

  try {
    const res = await fetch('/api/api-logs');
    if (res.ok) {
      const json = await res.json();
      if (json.data) {
        apiLogs = json.data;
      }
    }
  } catch {}

  return {
    apiLogs
  };
};
