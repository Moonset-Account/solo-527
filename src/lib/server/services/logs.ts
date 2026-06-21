import { mockExportTasks, mockOperationLogs, mockErrorLogs } from '$lib/mock/data';
import { generateUUID } from '$utils';
import type { ExportTask, OperationLog, ErrorLog, PaginatedResult } from '$types';

export async function getExportTasks(page = 1, pageSize = 20): Promise<PaginatedResult<ExportTask>> {
  const data = [...mockExportTasks].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const total = data.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const end = start + pageSize;

  return {
    data: data.slice(start, end),
    total,
    page,
    pageSize,
    totalPages
  };
}

export async function createExportTask(
  type: ExportTask['type'],
  format: ExportTask['format'],
  params: Record<string, any>,
  createdBy: string
): Promise<ExportTask> {
  const task: ExportTask = {
    id: generateUUID(),
    type,
    format,
    status: 'pending',
    params,
    createdBy,
    createdAt: new Date().toISOString()
  };
  mockExportTasks.unshift(task);

  setTimeout(() => {
    task.status = 'processing';
  }, 500);
  setTimeout(() => {
    task.status = 'completed';
    task.completedAt = new Date().toISOString();
    task.fileUrl = `/exports/${task.id}.${format}`;
  }, 2000);

  return task;
}

export async function getOperationLogs(
  page = 1,
  pageSize = 20,
  resourceType?: string
): Promise<PaginatedResult<OperationLog>> {
  let data = [...mockOperationLogs];
  if (resourceType) {
    data = data.filter((l) => l.resourceType === resourceType);
  }
  data.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const total = data.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const end = start + pageSize;

  return {
    data: data.slice(start, end),
    total,
    page,
    pageSize,
    totalPages
  };
}

export async function logOperation(
  action: string,
  resourceType: string,
  resourceId: string,
  operator: string,
  beforeData?: any,
  afterData?: any
): Promise<void> {
  const log: OperationLog = {
    id: generateUUID(),
    action,
    resourceType,
    resourceId,
    beforeData,
    afterData,
    operator,
    createdAt: new Date().toISOString()
  };
  mockOperationLogs.unshift(log);
}

export async function getErrorLogs(
  page = 1,
  pageSize = 20,
  severity?: string,
  type?: string
): Promise<PaginatedResult<ErrorLog>> {
  let data = [...mockErrorLogs];
  if (severity) {
    data = data.filter((l) => l.severity === severity);
  }
  if (type) {
    data = data.filter((l) => l.type === type);
  }
  data.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const total = data.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const end = start + pageSize;

  return {
    data: data.slice(start, end),
    total,
    page,
    pageSize,
    totalPages
  };
}

export async function logError(
  type: ErrorLog['type'],
  errorMessage: string,
  severity: ErrorLog['severity'] = 'error',
  endpoint?: string,
  method?: string,
  statusCode?: number,
  stackTrace?: string
): Promise<ErrorLog> {
  const log: ErrorLog = {
    id: generateUUID(),
    type,
    errorMessage,
    severity,
    endpoint,
    method,
    statusCode,
    stackTrace,
    alertSent: false,
    createdAt: new Date().toISOString()
  };
  mockErrorLogs.unshift(log);

  if (severity === 'critical') {
    log.alertSent = true;
    log.alertSentAt = new Date().toISOString();
  }

  return log;
}
