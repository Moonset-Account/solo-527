import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Feedback } from '../models';

@Injectable({ providedIn: 'root' })
export class FeedbackService {
  constructor(private api: ApiService) {}

  getAll(filters?: Record<string, any>): Observable<Feedback[]> {
    return this.api.get<Feedback[]>('/feedbacks', filters);
  }

  create(projectId: string, data: any): Observable<Feedback> {
    return this.api.post<Feedback>(`/projects/${projectId}/feedbacks`, data);
  }

  exportExcel(filters?: Record<string, any>): Observable<Blob> {
    return this.api.download('/feedbacks/export', filters);
  }
}
