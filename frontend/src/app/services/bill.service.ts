import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG, PaginatedResponse, Bill, StatusHistory } from './api.config';

@Injectable({ providedIn: 'root' })
export class BillService {
  private apiUrl = `${API_CONFIG.baseUrl}/bills`;

  constructor(private http: HttpClient) {}

  findAll(filters: any = {}): Observable<PaginatedResponse<Bill>> {
    let params = new HttpParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        params = params.set(key, filters[key]);
      }
    });
    return this.http.get<PaginatedResponse<Bill>>(this.apiUrl, { params });
  }

  findOne(id: string): Observable<Bill> {
    return this.http.get<Bill>(`${this.apiUrl}/${id}`);
  }

  create(data: any): Observable<Bill> {
    return this.http.post<Bill>(this.apiUrl, data);
  }

  update(id: string, data: any): Observable<Bill> {
    return this.http.put<Bill>(`${this.apiUrl}/${id}`, data);
  }

  updateStatus(id: string, status: string, reason?: string): Observable<Bill> {
    return this.http.put<Bill>(`${this.apiUrl}/${id}/status`, { status, reason });
  }

  recordPayment(id: string, data: any): Observable<Bill> {
    return this.http.post<Bill>(`${this.apiUrl}/${id}/payment`, data);
  }

  getStatusHistory(id: string): Observable<StatusHistory[]> {
    return this.http.get<StatusHistory[]>(`${this.apiUrl}/${id}/history`);
  }

  getOverdueBills(): Observable<Bill[]> {
    return this.http.get<Bill[]>(`${this.apiUrl}/overdue`);
  }

  getStatistics(filters: any = {}): Observable<any> {
    let params = new HttpParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined) {
        params = params.set(key, filters[key]);
      }
    });
    return this.http.get<any>(`${this.apiUrl}/statistics`, { params });
  }
}
