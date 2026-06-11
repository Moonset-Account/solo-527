import { mockRetentionAlerts } from '$lib/mock-data';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
  let retentionAlerts = mockRetentionAlerts;

  try {
    const res = await fetch('/api/alerts');
    if (res.ok) {
      const json = await res.json();
      if (json.data) {
        retentionAlerts = json.data;
      }
    }
  } catch {}

  return {
    retentionAlerts
  };
};
