import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG, PaginatedResponse, AuditLog } from './api.config';

@Injectable({ providedIn: 'root' })
export class AuditService {
  private apiUrl = `${API_CONFIG.baseUrl}/audit-logs`;

  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
    }),
  };

  constructor(private http: HttpClient) {}

  findAll(filters: any = {}): Observable<PaginatedResponse<AuditLog>> {
    let params = new HttpParams();
    const allowedParams = ['entityType', 'entityId', 'userId', 'action', 'startDate', 'endDate', 'page', 'limit'];
    Object.keys(filters).forEach(key => {
      if (allowedParams.includes(key) && filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        params = params.set(key, filters[key]);
      }
    });
    return this.http.get<PaginatedResponse<AuditLog>>(this.apiUrl, { params });
  }

  findOne(id: string): Observable<AuditLog> {
    return this.http.get<AuditLog>(`${this.apiUrl}/${id}`);
  }

  findByEntity(entityType: string, entityId: string): Observable<AuditLog[]> {
    let params = new HttpParams();
    params = params.set('entityType', entityType);
    params = params.set('entityId', entityId);
    return this.http.get<AuditLog[]>(`${this.apiUrl}/entity`, { params });
  }

  findByUser(userId: string): Observable<AuditLog[]> {
    let params = new HttpParams();
    params = params.set('userId', userId);
    return this.http.get<AuditLog[]>(`${this.apiUrl}/user`, { params });
  }

  exportLogs(filters: any = {}): Observable<Blob> {
    let params = new HttpParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        params = params.set(key, filters[key]);
      }
    });
    return this.http.get(`${this.apiUrl}/export`, {
      params,
      responseType: 'blob',
    });
  }
}
