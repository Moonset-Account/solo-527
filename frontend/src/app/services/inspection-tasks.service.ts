import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { InspectionTask } from '../models/inspection-task.model';

@Injectable({ providedIn: 'root' })
export class InspectionTasksService {
  private apiUrl = 'http://localhost:3000/api/inspection-tasks';

  constructor(private http: HttpClient) {}

  getAll(params?: { status?: string }): Observable<InspectionTask[]> {
    let httpParams = new HttpParams();
    if (params?.status) httpParams = httpParams.set('status', params.status);
    return this.http.get<InspectionTask[]>(this.apiUrl, { params: httpParams });
  }

  getById(id: string): Observable<InspectionTask> {
    return this.http.get<InspectionTask>(`${this.apiUrl}/${id}`);
  }

  create(data: Partial<InspectionTask>): Observable<InspectionTask> {
    return this.http.post<InspectionTask>(this.apiUrl, data);
  }

  generateFromTemplate(templateId: string, assignee: string): Observable<InspectionTask> {
    return this.http.post<InspectionTask>(`${this.apiUrl}/generate/${templateId}`, { assignee });
  }

  complete(id: string, results: InspectionTask['results'], notes: string): Observable<InspectionTask> {
    return this.http.patch<InspectionTask>(`${this.apiUrl}/${id}/complete`, { results, notes });
  }
}
