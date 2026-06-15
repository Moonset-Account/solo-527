import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Application } from '../models/application.model';

@Injectable({ providedIn: 'root' })
export class ApplicationsService {
  private apiUrl = 'http://localhost:3000/api/applications';

  constructor(private http: HttpClient) {}

  getAll(params?: { status?: string; priority?: string; page?: number; limit?: number }): Observable<{ data: Application[]; total: number }> {
    let httpParams = new HttpParams();
    if (params?.status) httpParams = httpParams.set('status', params.status);
    if (params?.priority) httpParams = httpParams.set('priority', params.priority);
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());
    return this.http.get<{ data: Application[]; total: number }>(this.apiUrl, { params: httpParams });
  }

  getById(id: string): Observable<Application> {
    return this.http.get<Application>(`${this.apiUrl}/${id}`);
  }

  create(data: Partial<Application>): Observable<Application> {
    return this.http.post<Application>(this.apiUrl, data);
  }

  update(id: string, data: Partial<Application>): Observable<Application> {
    return this.http.patch<Application>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
