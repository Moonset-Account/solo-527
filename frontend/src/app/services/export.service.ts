import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ExportService {
  private baseUrl = '/api';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  exportData(type: string, params?: Record<string, any>): Observable<Blob> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          queryParams.set(key, params[key]);
        }
      });
    }
    const queryString = queryParams.toString();
    const url = `${this.baseUrl}/export/${type}${queryString ? '?' + queryString : ''}`;

    return this.http.get(url, {
      headers: this.getHeaders(),
      responseType: 'blob'
    });
  }
}
