import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Lease, PageResult, PaginatedParams, ApiResponse } from '../types';

@Injectable({
  providedIn: 'root'
})
export class LeasesService {
  private endpoint = '/leases';

  constructor(private apiService: ApiService) {}

  getLeases(params?: PaginatedParams): Observable<ApiResponse<PageResult<Lease>>> {
    return this.apiService.get<ApiResponse<PageResult<Lease>>>(this.endpoint, params);
  }

  getLease(id: string): Observable<ApiResponse<Lease>> {
    return this.apiService.get<ApiResponse<Lease>>(`${this.endpoint}/${id}`);
  }

  createLease(data: Partial<Lease>): Observable<ApiResponse<Lease>> {
    return this.apiService.post<ApiResponse<Lease>>(this.endpoint, data);
  }

  updateLease(id: string, data: Partial<Lease>): Observable<ApiResponse<Lease>> {
    return this.apiService.put<ApiResponse<Lease>>(`${this.endpoint}/${id}`, data);
  }

  deleteLease(id: string): Observable<ApiResponse<void>> {
    return this.apiService.delete<ApiResponse<void>>(`${this.endpoint}/${id}`);
  }
}
