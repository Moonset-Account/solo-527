import { getMetricData } from '$server/services/metrics';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const metrics = await getMetricData({ page: 1, pageSize: 20 });

  return {
    metrics
  };
};
