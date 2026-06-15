import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG, PaginatedResponse, CollectionRhythm, CollectionRecord } from './api.config';

@Injectable({ providedIn: 'root' })
export class CollectionService {
  private baseUrl = API_CONFIG.baseUrl;

  constructor(private http: HttpClient) {}

  findAllRhythms(filters: any = {}): Observable<PaginatedResponse<CollectionRhythm>> {
    let params = new HttpParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null) {
        params = params.set(key, filters[key]);
      }
    });
    return this.http.get<PaginatedResponse<CollectionRhythm>>(`${this.baseUrl}/collection/rhythms`, { params });
  }

  findOneRhythm(id: string): Observable<CollectionRhythm> {
    return this.http.get<CollectionRhythm>(`${this.baseUrl}/collection/rhythms/${id}`);
  }

  createRhythm(data: any): Observable<CollectionRhythm> {
    return this.http.post<CollectionRhythm>(`${this.baseUrl}/collection/rhythms`, data);
  }

  updateRhythm(id: string, data: any): Observable<CollectionRhythm> {
    return this.http.put<CollectionRhythm>(`${this.baseUrl}/collection/rhythms/${id}`, data);
  }

  findAllRecords(filters: any = {}): Observable<PaginatedResponse<CollectionRecord>> {
    let params = new HttpParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null) {
        params = params.set(key, filters[key]);
      }
    });
    return this.http.get<PaginatedResponse<CollectionRecord>>(`${this.baseUrl}/collection/records`, { params });
  }

  findOneRecord(id: string): Observable<CollectionRecord> {
    return this.http.get<CollectionRecord>(`${this.baseUrl}/collection/records/${id}`);
  }

  createRecord(data: any): Observable<CollectionRecord> {
    return this.http.post<CollectionRecord>(`${this.baseUrl}/collection/records`, data);
  }

  updateRecord(id: string, data: any): Observable<CollectionRecord> {
    return this.http.put<CollectionRecord>(`${this.baseUrl}/collection/records/${id}`, data);
  }

  getStatistics(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/collection/records/statistics`);
  }
}
