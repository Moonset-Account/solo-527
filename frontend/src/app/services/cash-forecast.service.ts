import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG, PaginatedResponse, CashForecast } from './api.config';

@Injectable({ providedIn: 'root' })
export class CashForecastService {
  private apiUrl = `${API_CONFIG.baseUrl}/cash-forecasts`;

  constructor(private http: HttpClient) {}

  findAll(page: number = 1, limit: number = 50): Observable<PaginatedResponse<CashForecast>> {
    const params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());
    return this.http.get<PaginatedResponse<CashForecast>>(this.apiUrl, { params });
  }

  findOne(id: string): Observable<CashForecast> {
    return this.http.get<CashForecast>(`${this.apiUrl}/${id}`);
  }

  generate(period: string, openingBalance: number): Observable<CashForecast> {
    return this.http.post<CashForecast>(this.apiUrl, { period, openingBalance });
  }

  updateActuals(id: string, data: any): Observable<CashForecast> {
    return this.http.put<CashForecast>(`${this.apiUrl}/${id}/actuals`, data);
  }

  updateStatus(id: string, status: string): Observable<CashForecast> {
    return this.http.put<CashForecast>(`${this.apiUrl}/${id}/status`, { status });
  }

  getTrend(months: number = 6): Observable<any> {
    const params = new HttpParams().set('months', months.toString());
    return this.http.get<any>(`${this.apiUrl}/trend`, { params });
  }
}
