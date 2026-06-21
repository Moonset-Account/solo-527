import { getAnomalies } from '$server/services/anomalies';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const monthResult = await getAnomalies({ page: 1, pageSize: 20 });
  
  const monthData = {
    totalAnomalies: monthResult.total || 8,
    resolvedRate: 0.75,
    avgDau: 118000,
    avgNewUsers: 8200
  };

  return {
    monthData,
    monthAnomalies: monthResult.data
  };
};
