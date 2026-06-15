import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { InspectionTemplate } from '../models/inspection-template.model';

@Injectable({ providedIn: 'root' })
export class InspectionTemplatesService {
  private apiUrl = 'http://localhost:3000/api/inspection-templates';

  constructor(private http: HttpClient) {}

  getAll(): Observable<InspectionTemplate[]> {
    return this.http.get<InspectionTemplate[]>(this.apiUrl);
  }

  getById(id: string): Observable<InspectionTemplate> {
    return this.http.get<InspectionTemplate>(`${this.apiUrl}/${id}`);
  }

  create(data: Partial<InspectionTemplate>): Observable<InspectionTemplate> {
    return this.http.post<InspectionTemplate>(this.apiUrl, data);
  }

  update(id: string, data: Partial<InspectionTemplate>): Observable<InspectionTemplate> {
    return this.http.patch<InspectionTemplate>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
