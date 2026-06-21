import { getAnomalyById, getAnomalyNotes, getAnomalies } from '$server/services/anomalies';
import { getMetricDefinitionByKey } from '$server/services/metrics';
import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
  const anomaly = await getAnomalyById(params.id);
  
  if (!anomaly) {
    throw error(404, '异常记录不存在');
  }

  const notes = await getAnomalyNotes(params.id);
  const metricDefinition = await getMetricDefinitionByKey(anomaly.metricKey);
  
  const relatedResult = await getAnomalies({
    page: 1,
    pageSize: 5,
    dateFrom: anomaly.date,
    dateTo: anomaly.date
  });

  const relatedAnomalies = relatedResult.data.filter((a) => a.id !== anomaly.id).slice(0, 4);

  return {
    anomaly,
    notes,
    metricDefinition,
    relatedAnomalies
  };
};
