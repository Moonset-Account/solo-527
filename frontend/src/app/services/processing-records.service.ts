import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProcessingRecord } from '../models/processing-record.model';

@Injectable({ providedIn: 'root' })
export class ProcessingRecordsService {
  private apiUrl = 'http://localhost:3000/api/processing-records';

  constructor(private http: HttpClient) {}

  getByEntity(entityType: string, entityId: string): Observable<ProcessingRecord[]> {
    return this.http.get<ProcessingRecord[]>(`${this.apiUrl}/entity/${entityType.toUpperCase()}/${entityId}`);
  }

  create(data: Partial<ProcessingRecord>): Observable<ProcessingRecord> {
    return this.http.post<ProcessingRecord>(this.apiUrl, {
      ...data,
      entityType: data.entityType ? String(data.entityType).toUpperCase() : undefined,
      previousValue: typeof data.previousValue === 'string' ? data.previousValue : JSON.stringify(data.previousValue),
      newValue: typeof data.newValue === 'string' ? data.newValue : JSON.stringify(data.newValue),
      details: typeof data.details === 'string' ? { reason: data.details } : data.details,
    });
  }
}
