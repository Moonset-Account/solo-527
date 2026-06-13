import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { Project, ProjectDetail } from '../models';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  constructor(private api: ApiService) {}

  getAll(): Observable<Project[]> {
    return this.api.get<any[]>('/projects').pipe(
      map((items) => items.map((p) => ({
        ...p,
        customerName: p.customer?.name || p.customerName || '',
        customerPhone: p.customer?.phone || p.customerPhone || '',
        totalBudget: p.budget || p.latestBudget?.totalCost || 0,
      })))
    );
  }

  getById(id: string): Observable<ProjectDetail> {
    return this.api.get<any>(`/projects/${id}`).pipe(
      map((p) => ({
        ...p,
        customerName: p.customer?.name || p.customerName || '',
        customerPhone: p.customer?.phone || p.customerPhone || '',
        totalBudget: p.budget || p.latestBudget?.totalCost || 0,
        latestBudget: p.latestBudget || null,
        contract: p.contract || null,
        feedbacks: p.feedbacks || [],
        afterSaleOrders: p.afterSaleOrders || [],
        photos: p.photos || [],
        attachments: p.attachments || [],
      }))
    );
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
