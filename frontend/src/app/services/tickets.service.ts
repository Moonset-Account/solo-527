import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Ticket, PageResult, PaginatedParams, ApiResponse } from '../types';

@Injectable({
  providedIn: 'root'
})
export class TicketsService {
  private endpoint = '/tickets';

  constructor(private apiService: ApiService) {}

  getTickets(params?: PaginatedParams): Observable<ApiResponse<PageResult<Ticket>>> {
    return this.apiService.get<ApiResponse<PageResult<Ticket>>>(this.endpoint, params);
  }

  getTicket(id: string): Observable<ApiResponse<Ticket>> {
    return this.apiService.get<ApiResponse<Ticket>>(`${this.endpoint}/${id}`);
  }

  createTicket(data: Partial<Ticket>): Observable<ApiResponse<Ticket>> {
    return this.apiService.post<ApiResponse<Ticket>>(this.endpoint, data);
  }

  updateTicketStatus(id: string, data: { status: string; remark?: string }): Observable<ApiResponse<Ticket>> {
    return this.apiService.put<ApiResponse<Ticket>>(`${this.endpoint}/${id}/status`, data);
  }
}
