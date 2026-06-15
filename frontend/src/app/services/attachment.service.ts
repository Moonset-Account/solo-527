import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG, PaginatedResponse, Attachment } from './api.config';

@Injectable({ providedIn: 'root' })
export class AttachmentService {
  private apiUrl = `${API_CONFIG.baseUrl}/attachments`;

  constructor(private http: HttpClient) {}

  findAll(filters: any = {}): Observable<PaginatedResponse<Attachment>> {
    let params = new HttpParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null) {
        params = params.set(key, filters[key]);
      }
    });
    return this.http.get<PaginatedResponse<Attachment>>(this.apiUrl, { params });
  }

  findOne(id: string): Observable<Attachment> {
    return this.http.get<Attachment>(`${this.apiUrl}/${id}`);
  }

  upload(file: File, entityType: string, entityId: string, description?: string): Observable<Attachment> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityType', entityType);
    formData.append('entityId', entityId);
    if (description) {
      formData.append('description', description);
    }
    return this.http.post<Attachment>(this.apiUrl, formData);
  }

  update(id: string, data: { description?: string; isPublic?: boolean }): Observable<Attachment> {
    return this.http.put<Attachment>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  download(id: string): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.apiUrl}/${id}/download`, {
      responseType: 'blob',
      observe: 'response',
    });
  }
}
