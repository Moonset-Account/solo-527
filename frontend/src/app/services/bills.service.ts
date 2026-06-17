import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Bill, PageResult, PaginatedParams, ApiResponse } from '../types';

@Injectable({
  providedIn: 'root'
})
export class BillsService {
  private endpoint = '/bills';

  constructor(private apiService: ApiService) {}

  getBills(params?: PaginatedParams): Observable<ApiResponse<PageResult<Bill>>> {
    return this.apiService.get<ApiResponse<PageResult<Bill>>>(this.endpoint, params);
  }

  getBill(id: string): Observable<ApiResponse<Bill>> {
    return this.apiService.get<ApiResponse<Bill>>(`${this.endpoint}/${id}`);
  }

  reconcileBill(id: string, data: { reconciled: boolean; paidAmount: number; paidDate: string; sourceRemark?: string }): Observable<ApiResponse<Bill>> {
    return this.apiService.patch<ApiResponse<Bill>>(`${this.endpoint}/${id}/reconcile`, data);
  }

  createBill(data: Partial<Bill>): Observable<ApiResponse<Bill>> {
    return this.apiService.post<ApiResponse<Bill>>(this.endpoint, data);
  }

  updateBill(id: string, data: Partial<Bill>): Observable<ApiResponse<Bill>> {
    return this.apiService.put<ApiResponse<Bill>>(`${this.endpoint}/${id}`, data);
  }
}
