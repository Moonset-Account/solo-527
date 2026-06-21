import { getOperationLogs, getErrorLogs, getExportTasks } from '$server/services/logs';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const [operationLogs, errorLogs, exportTasks] = await Promise.all([
    getOperationLogs(1, 20),
    getErrorLogs(1, 20),
    getExportTasks(1, 20)
  ]);

  return {
    operationLogs,
    errorLogs,
    exportTasks
  };
};
