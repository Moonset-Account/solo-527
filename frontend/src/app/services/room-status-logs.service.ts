import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { RoomStatusLog, ApiResponse } from '../types';

@Injectable({
  providedIn: 'root'
})
export class RoomStatusLogsService {
  private endpoint = '/room-status-logs';

  constructor(private apiService: ApiService) {}

  getRoomStatusLogs(propertyId: string): Observable<ApiResponse<RoomStatusLog[]>> {
    return this.apiService.get<ApiResponse<RoomStatusLog[]>>(`${this.endpoint}?propertyId=${propertyId}`);
  }
}
