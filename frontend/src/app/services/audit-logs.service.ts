import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuditLog } from '../models/audit-log.model';

@Injectable({ providedIn: 'root' })
export class AuditLogsService {
  private apiUrl = 'http://localhost:3000/api/audit-logs';

  constructor(private http: HttpClient) {}

  getAll(params?: { entityType?: string; action?: string; operator?: string; page?: number; limit?: number }): Observable<{ data: AuditLog[]; total: number }> {
    let httpParams = new HttpParams();
    if (params?.entityType) httpParams = httpParams.set('entityType', params.entityType);
    if (params?.action) httpParams = httpParams.set('action', params.action);
    if (params?.operator) httpParams = httpParams.set('operator', params.operator);
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());
    return this.http.get<{ data: AuditLog[]; total: number }>(this.apiUrl, { params: httpParams });
  }
}
