import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Deposit, PageResult, PaginatedParams, ApiResponse } from '../types';

@Injectable({
  providedIn: 'root'
})
export class DepositsService {
  private endpoint = '/deposits';

  constructor(private apiService: ApiService) {}

  getDeposits(params?: PaginatedParams): Observable<ApiResponse<PageResult<Deposit>>> {
    return this.apiService.get<ApiResponse<PageResult<Deposit>>>(this.endpoint, params);
  }

  getDeposit(id: string): Observable<ApiResponse<Deposit>> {
    return this.apiService.get<ApiResponse<Deposit>>(`${this.endpoint}/${id}`);
  }
}
