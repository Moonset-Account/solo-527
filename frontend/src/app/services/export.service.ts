import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG, PaginatedResponse, ExportQueue } from './api.config';

@Injectable({ providedIn: 'root' })
export class ExportService {
  private apiUrl = `${API_CONFIG.baseUrl}/exports`;

  constructor(private http: HttpClient) {}

  findAll(filters: any = {}): Observable<PaginatedResponse<ExportQueue>> {
    let params = new HttpParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null) {
        params = params.set(key, filters[key]);
      }
    });
    return this.http.get<PaginatedResponse<ExportQueue>>(this.apiUrl, { params });
  }

  findOne(id: string): Observable<ExportQueue> {
    return this.http.get<ExportQueue>(`${this.apiUrl}/${id}`);
  }

  create(data: any): Observable<ExportQueue> {
    return this.http.post<ExportQueue>(this.apiUrl, data);
  }

  retry(id: string): Observable<ExportQueue> {
    return this.http.post<ExportQueue>(`${this.apiUrl}/${id}/retry`, {});
  }

  download(id: string): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.apiUrl}/${id}/download`, {
      responseType: 'blob',
      observe: 'response',
    });
  }
}
