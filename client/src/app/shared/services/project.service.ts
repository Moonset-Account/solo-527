import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Project, ProjectDetail } from '../models';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  constructor(private api: ApiService) {}

  getAll(): Observable<Project[]> {
    return this.api.get<Project[]>('/projects');
  }

  getById(id: string): Observable<ProjectDetail> {
    return this.api.get<ProjectDetail>(`/projects/${id}`);
  }

  create(data: Partial<Project>): Observable<Project> {
    return this.api.post<Project>('/projects', data);
  }

  update(id: string, data: Partial<Project>): Observable<Project> {
    return this.api.patch<Project>(`/projects/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`/projects/${id}`);
  }
}
