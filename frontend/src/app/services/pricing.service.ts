import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { PricePlan, PageResult, PaginatedParams, ApiResponse } from '../types';

@Injectable({
  providedIn: 'root'
})
export class PricingService {
  private endpoint = '/pricing';

  constructor(private apiService: ApiService) {}

  getPricings(params?: PaginatedParams): Observable<ApiResponse<PageResult<PricePlan>>> {
    return this.apiService.get<ApiResponse<PageResult<PricePlan>>>(this.endpoint, params);
  }

  createPricing(data: Partial<PricePlan>): Observable<ApiResponse<PricePlan>> {
    return this.apiService.post<ApiResponse<PricePlan>>(this.endpoint, data);
  }

  setCurrentPricing(id: string): Observable<ApiResponse<PricePlan>> {
    return this.apiService.post<ApiResponse<PricePlan>>(`${this.endpoint}/${id}/set-current`);
  }

  deletePricing(id: string): Observable<ApiResponse<void>> {
    return this.apiService.delete<ApiResponse<void>>(`${this.endpoint}/${id}`);
  }
}
