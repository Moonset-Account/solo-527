import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from './api.config';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private apiUrl = `${API_CONFIG.baseUrl}/dashboard`;

  constructor(private http: HttpClient) {}

  getOverview(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/overview`);
  }

  getAgingReport(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/aging-report`);
  }

  getMonthlyTrend(months: number = 6): Observable<any[]> {
    const params = new HttpParams().set('months', months.toString());
    return this.http.get<any[]>(`${this.apiUrl}/monthly-trend`, { params });
  }
}
