import request from '@/utils/request';
import { OperationLog, SearchParams, PaginatedResult } from '@/types';

export const getOperationLogs = (params?: SearchParams): Promise<PaginatedResult<OperationLog>> => {
  return request.get('/operation-logs', { params });
};

export const getMyLogs = (limit?: number): Promise<OperationLog[]> => {
  return request.get('/operation-logs/my', { params: { limit } });
};
