import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, PageResult } from './api.service';

export interface OperationLog {
  id: number;
  userId: number;
  username: string;
  operation: string;
  module: string;
  targetId: number;
  targetType: string;
  ipAddress: string;
  userAgent: string;
  details: any;
  createdAt: string;
}

export interface ApiRequestLog {
  id: number;
  requestId: string;
  method: string;
  url: string;
  statusCode: number;
  duration: number;
  userId?: number;
  username?: string;
  ipAddress: string;
  userAgent: string;
  requestBody?: any;
  responseBody?: any;
  errorMessage?: string;
  createdAt: string;
}

export interface ApiRetryLog {
  id: number;
  originalRequestId: string;
  method: string;
  url: string;
  requestBody?: any;
  errorMessage: string;
  retryCount: number;
  maxRetries: number;
  status: 'pending' | 'retrying' | 'success' | 'failed';
  lastAttemptAt?: string;
  nextAttemptAt?: string;
  succeededAt?: string;
  successResponse?: any;
  createdAt: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class LogService {
  private operationEndpoint = '/logs/operations';
  private apiRequestEndpoint = '/logs/api-requests';
  private apiRetryEndpoint = '/logs/api-retries';

  constructor(private api: ApiService) {}

  getOperationLogs(page: number = 1, pageSize: number = 10, filters?: Record<string, any>): Observable<PageResult<OperationLog>> {
    return this.api.getPage<OperationLog>(this.operationEndpoint, page, pageSize, filters);
  }

  getOperationLog(id: number): Observable<OperationLog> {
    return this.api.get<OperationLog>(`${this.operationEndpoint}/${id}`);
  }

  getApiRequestLogs(page: number = 1, pageSize: number = 10, filters?: Record<string, any>): Observable<PageResult<ApiRequestLog>> {
    return this.api.getPage<ApiRequestLog>(this.apiRequestEndpoint, page, pageSize, filters);
  }

  getApiRequestLog(id: number): Observable<ApiRequestLog> {
    return this.api.get<ApiRequestLog>(`${this.apiRequestEndpoint}/${id}`);
  }

  getApiRetryLogs(page: number = 1, pageSize: number = 10, filters?: Record<string, any>): Observable<PageResult<ApiRetryLog>> {
    return this.api.getPage<ApiRetryLog>(this.apiRetryEndpoint, page, pageSize, filters);
  }

  getApiRetryLog(id: number): Observable<ApiRetryLog> {
    return this.api.get<ApiRetryLog>(`${this.apiRetryEndpoint}/${id}`);
  }

  retryRequest(id: number): Observable<ApiRetryLog> {
    return this.api.post<ApiRetryLog>(`${this.apiRetryEndpoint}/${id}/retry`, {});
  }

  batchRetryRequests(ids: number[]): Observable<{ count: number }> {
    return this.api.post<{ count: number }>(`${this.apiRetryEndpoint}/batch-retry`, { ids });
  }

  cancelRetry(id: number): Observable<ApiRetryLog> {
    return this.api.post<ApiRetryLog>(`${this.apiRetryEndpoint}/${id}/cancel`, {});
  }

  getPendingRetries(): Observable<ApiRetryLog[]> {
    return this.api.get<ApiRetryLog[]>(`${this.apiRetryEndpoint}/pending`);
  }

  exportLogs(type: 'operation' | 'api-request' | 'api-retry', filters?: Record<string, any>): Observable<Blob> {
    const endpoint = type === 'operation' ? this.operationEndpoint :
                     type === 'api-request' ? this.apiRequestEndpoint :
                     this.apiRetryEndpoint;
    return this.api.get<Blob>(`${endpoint}/export`, filters);
  }
}
