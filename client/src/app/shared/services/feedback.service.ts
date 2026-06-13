import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Feedback, FeedbackStats } from '../models';

@Injectable({ providedIn: 'root' })
export class FeedbackService {
  constructor(private api: ApiService) {}

  getAll(filters?: Record<string, any>): Observable<Feedback[]> {
    return this.api.get<Feedback[]>('/feedbacks', filters);
  }

  getStats(filters?: Record<string, any>): Observable<FeedbackStats> {
    return this.api.get<FeedbackStats>('/feedbacks/stats', filters);
  }

  create(projectId: string, data: any): Observable<Feedback> {
    return this.api.post<Feedback>(`/projects/${projectId}/feedbacks`, data);
  }

  exportExcel(filters?: Record<string, any>): Observable<Blob> {
    return this.api.download('/feedbacks/export', filters);
  }
}
