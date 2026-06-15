import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG, PaginatedResponse, Reconciliation } from './api.config';

@Injectable({ providedIn: 'root' })
export class ReconciliationService {
  private apiUrl = `${API_CONFIG.baseUrl}/reconciliations`;

  constructor(private http: HttpClient) {}

  findAll(page: number = 1, limit: number = 50): Observable<PaginatedResponse<Reconciliation>> {
    const params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());
    return this.http.get<PaginatedResponse<Reconciliation>>(this.apiUrl, { params });
  }

  findOne(id: string): Observable<Reconciliation> {
    return this.http.get<Reconciliation>(`${this.apiUrl}/${id}`);
  }

  create(period: string): Observable<Reconciliation> {
    return this.http.post<Reconciliation>(this.apiUrl, { period });
  }

  updateStatus(id: string, status: string): Observable<Reconciliation> {
    return this.http.put<Reconciliation>(`${this.apiUrl}/${id}/status`, { status });
  }

  linkRecord(id: string, data: any): Observable<Reconciliation> {
    return this.http.post<Reconciliation>(`${this.apiUrl}/${id}/link-record`, data);
  }

  addVariance(id: string, data: any): Observable<Reconciliation> {
    return this.http.post<Reconciliation>(`${this.apiUrl}/${id}/variance`, data);
  }

  getLinkedRecords(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}/linked-records`);
  }

  getStatistics(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/statistics`);
  }
}
