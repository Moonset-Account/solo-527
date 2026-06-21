import { getMetricDefinitions } from '$server/services/metrics';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const definitions = await getMetricDefinitions();

  return {
    definitions
  };
};
