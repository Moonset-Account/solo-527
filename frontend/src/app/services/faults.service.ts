import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Fault } from '../models/fault.model';

@Injectable({ providedIn: 'root' })
export class FaultsService {
  private apiUrl = 'http://localhost:3000/api/faults';

  constructor(private http: HttpClient) {}

  getAll(params?: { status?: string; severity?: string; page?: number; limit?: number }): Observable<{ data: Fault[]; total: number }> {
    let httpParams = new HttpParams();
    if (params?.status) httpParams = httpParams.set('status', params.status);
    if (params?.severity) httpParams = httpParams.set('severity', params.severity);
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());
    return this.http.get<{ data: Fault[]; total: number }>(this.apiUrl, { params: httpParams });
  }

  getById(id: string): Observable<Fault> {
    return this.http.get<Fault>(`${this.apiUrl}/${id}`);
  }

  create(data: Partial<Fault>): Observable<Fault> {
    return this.http.post<Fault>(this.apiUrl, data);
  }

  update(id: string, data: Partial<Fault>): Observable<Fault> {
    return this.http.patch<Fault>(`${this.apiUrl}/${id}`, data);
  }

  resolve(id: string, data: { resolution: string }): Observable<Fault> {
    return this.http.post<Fault>(`${this.apiUrl}/${id}/resolve`, data);
  }

  getAlerts(): Observable<Fault[]> {
    return this.http.get<Fault[]>(`${this.apiUrl}/alerts`);
  }
}
