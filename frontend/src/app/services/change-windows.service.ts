import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ChangeWindow } from '../models/change-window.model';

@Injectable({ providedIn: 'root' })
export class ChangeWindowsService {
  private apiUrl = 'http://localhost:3000/api/change-windows';

  constructor(private http: HttpClient) {}

  getAll(): Observable<ChangeWindow[]> {
    return this.http.get<ChangeWindow[]>(this.apiUrl);
  }

  getByEntity(entityType: string, entityId: string): Observable<ChangeWindow[]> {
    return this.http.get<ChangeWindow[]>(this.apiUrl, {
      params: { entityType: entityType.toUpperCase(), entityId },
    });
  }

  create(data: Partial<ChangeWindow>): Observable<ChangeWindow> {
    return this.http.post<ChangeWindow>(this.apiUrl, {
      ...data,
      entityType: data.entityType ? String(data.entityType).toUpperCase() : undefined,
      status: data.status || 'SCHEDULED',
    });
  }

  update(id: string, data: Partial<ChangeWindow>): Observable<ChangeWindow> {
    return this.http.patch<ChangeWindow>(`${this.apiUrl}/${id}`, data);
  }
}
