import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Property, PageResult, PaginatedParams, ApiResponse } from '../types';

@Injectable({
  providedIn: 'root'
})
export class PropertiesService {
  private endpoint = '/properties';

  constructor(private apiService: ApiService) {}

  getProperties(params?: PaginatedParams): Observable<ApiResponse<PageResult<Property>>> {
    return this.apiService.get<ApiResponse<PageResult<Property>>>(this.endpoint, params);
  }

  getProperty(id: string): Observable<ApiResponse<Property>> {
    return this.apiService.get<ApiResponse<Property>>(`${this.endpoint}/${id}`);
  }

  createProperty(data: Partial<Property>): Observable<ApiResponse<Property>> {
    return this.apiService.post<ApiResponse<Property>>(this.endpoint, data);
  }

  updateProperty(id: string, data: Partial<Property>): Observable<ApiResponse<Property>> {
    return this.apiService.put<ApiResponse<Property>>(`${this.endpoint}/${id}`, data);
  }

  deleteProperty(id: string): Observable<ApiResponse<void>> {
    return this.apiService.delete<ApiResponse<void>>(`${this.endpoint}/${id}`);
  }

  updatePropertyStatus(id: string, data: { status: string; reason?: string }): Observable<ApiResponse<Property>> {
    return this.apiService.put<ApiResponse<Property>>(`${this.endpoint}/${id}/status`, data);
  }
}
