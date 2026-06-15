import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProcessingRecord } from '../models/processing-record.model';

@Injectable({ providedIn: 'root' })
export class ProcessingRecordsService {
  private apiUrl = 'http://localhost:3000/api/processing-records';

  constructor(private http: HttpClient) {}

  getByEntity(entityType: string, entityId: string): Observable<ProcessingRecord[]> {
    return this.http.get<ProcessingRecord[]>(`${this.apiUrl}/entity/${entityType}/${entityId}`);
  }

  create(data: Partial<ProcessingRecord>): Observable<ProcessingRecord> {
    return this.http.post<ProcessingRecord>(this.apiUrl, data);
  }
}
