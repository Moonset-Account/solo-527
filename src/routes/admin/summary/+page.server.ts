import { getLatestSummary, getPushRecords } from '$server/services/summary';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const summary = await getLatestSummary();
  const pushRecords = await getPushRecords();

  return {
    summary,
    pushRecords
  };
};
