import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG, PaginatedResponse, Invoice } from './api.config';

@Injectable({ providedIn: 'root' })
export class InvoiceService {
  private apiUrl = `${API_CONFIG.baseUrl}/invoices`;

  constructor(private http: HttpClient) {}

  findAll(filters: any = {}): Observable<PaginatedResponse<Invoice>> {
    let params = new HttpParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        params = params.set(key, filters[key]);
      }
    });
    return this.http.get<PaginatedResponse<Invoice>>(this.apiUrl, { params });
  }

  findOne(id: string): Observable<Invoice> {
    return this.http.get<Invoice>(`${this.apiUrl}/${id}`);
  }

  create(data: any): Observable<Invoice> {
    return this.http.post<Invoice>(this.apiUrl, data);
  }

  update(id: string, data: any): Observable<Invoice> {
    return this.http.put<Invoice>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  send(id: string): Observable<Invoice> {
    return this.http.post<Invoice>(`${this.apiUrl}/${id}/send`, {});
  }

  recordPayment(id: string, data: any): Observable<Invoice> {
    return this.http.post<Invoice>(`${this.apiUrl}/${id}/payment`, data);
  }
}
