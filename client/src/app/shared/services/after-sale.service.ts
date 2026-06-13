import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { AfterSaleOrder } from '../models';

@Injectable({ providedIn: 'root' })
export class AfterSaleService {
  constructor(private api: ApiService) {}

  getAll(filters?: Record<string, any>): Observable<AfterSaleOrder[]> {
    return this.api.get<AfterSaleOrder[]>('/after-sale', filters);
  }

  create(data: any): Observable<AfterSaleOrder> {
    return this.api.post<AfterSaleOrder>('/after-sale', data);
  }

  update(id: string, data: any): Observable<AfterSaleOrder> {
    return this.api.patch<AfterSaleOrder>(`/after-sale/${id}`, data);
  }

  assign(id: string, assigneeId: string): Observable<AfterSaleOrder> {
    return this.api.post<AfterSaleOrder>(`/after-sale/${id}/assign`, { assigneeId });
  }

  close(id: string): Observable<AfterSaleOrder> {
    return this.api.post<AfterSaleOrder>(`/after-sale/${id}/close`, {});
  }
}
