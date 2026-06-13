import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Budget, BudgetComparison } from '../models';

@Injectable({ providedIn: 'root' })
export class BudgetService {
  constructor(private api: ApiService) {}

  getByProject(projectId: string): Observable<Budget[]> {
    return this.api.get<Budget[]>(`/projects/${projectId}/budgets`);
  }

  create(projectId: string, data: any): Observable<Budget> {
    return this.api.post<Budget>(`/projects/${projectId}/budgets`, data);
  }

  getById(id: string): Observable<Budget> {
    return this.api.get<Budget>(`/budgets/${id}`);
  }

  update(id: string, data: any): Observable<Budget> {
    return this.api.patch<Budget>(`/budgets/${id}`, data);
  }

  submit(id: string): Observable<Budget> {
    return this.api.post<Budget>(`/budgets/${id}/submit`, {});
  }

  approve(id: string): Observable<Budget> {
    return this.api.post<Budget>(`/budgets/${id}/approve`, {});
  }

  reject(id: string): Observable<Budget> {
    return this.api.post<Budget>(`/budgets/${id}/reject`, {});
  }

  sendToClient(id: string): Observable<Budget> {
    return this.api.post<Budget>(`/budgets/${id}/send-to-client`, {});
  }

  compare(id: string, compareVersionId: string): Observable<BudgetComparison> {
    return this.api.get<BudgetComparison>(`/budgets/${id}/compare/${compareVersionId}`);
  }

  confirm(id: string): Observable<any> {
    return this.api.post<any>(`/budgets/${id}/confirm`, {});
  }

  requestChanges(id: string, reason?: string): Observable<any> {
    return this.api.post<any>(`/budgets/${id}/request-changes`, { reason });
  }
}
