import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, PageResult } from './api.service';

export interface FollowUpTask {
  id: number;
  patientId: number;
  patientName: string;
  patientPhone: string;
  appointmentId: number;
  treatmentType: string;
  followUpType: 'treatment' | 'postoperative' | 'regular';
  followUpDate: string;
  status: 'pending' | 'in_progress' | 'completed' | 'no_answer' | 'cancelled';
  assignedTo: number;
  assignedToName: string;
  content: string;
  response: string;
  nextFollowUpDate?: string;
  contactedAt?: string;
  contactedBy?: number;
  contactedByName?: string;
  attempts: number;
  lastAttemptAt?: string;
  remarks: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFollowUpDto {
  patientId: number;
  appointmentId: number;
  treatmentType: string;
  followUpType: string;
  followUpDate: string;
  assignedTo: number;
  content: string;
  remarks?: string;
}

export interface UpdateFollowUpDto {
  followUpDate?: string;
  status?: string;
  assignedTo?: number;
  content?: string;
  response?: string;
  nextFollowUpDate?: string;
  remarks?: string;
}

@Injectable({ providedIn: 'root' })
export class FollowUpService {
  private endpoint = '/follow-ups';

  constructor(private api: ApiService) {}

  getFollowUps(page: number = 1, pageSize: number = 10, filters?: Record<string, any>): Observable<PageResult<FollowUpTask>> {
    return this.api.getPage<FollowUpTask>(this.endpoint, page, pageSize, filters);
  }

  getFollowUp(id: number): Observable<FollowUpTask> {
    return this.api.get<FollowUpTask>(`${this.endpoint}/${id}`);
  }

  createFollowUp(data: CreateFollowUpDto): Observable<FollowUpTask> {
    return this.api.post<FollowUpTask>(this.endpoint, data);
  }

  updateFollowUp(id: number, data: UpdateFollowUpDto): Observable<FollowUpTask> {
    return this.api.put<FollowUpTask>(`${this.endpoint}/${id}`, data);
  }

  updateStatus(id: number, status: string): Observable<FollowUpTask> {
    return this.api.patch<FollowUpTask>(`${this.endpoint}/${id}/status`, { status });
  }

  recordContact(id: number, data: { response: string; status: string; nextFollowUpDate?: string; remarks?: string }): Observable<FollowUpTask> {
    return this.api.post<FollowUpTask>(`${this.endpoint}/${id}/record-contact`, data);
  }

  getPatientFollowUps(patientId: number): Observable<FollowUpTask[]> {
    return this.api.get<FollowUpTask[]>(`${this.endpoint}/patient/${patientId}`);
  }

  getMyFollowUps(page: number = 1, pageSize: number = 10, filters?: Record<string, any>): Observable<PageResult<FollowUpTask>> {
    return this.api.getPage<FollowUpTask>(`${this.endpoint}/my`, page, pageSize, filters);
  }

  generateFollowUps(startDate?: string, endDate?: string): Observable<{ count: number }> {
    return this.api.post<{ count: number }>(`${this.endpoint}/generate`, { startDate, endDate });
  }

  getStatistics(startDate?: string, endDate?: string): Observable<any> {
    return this.api.get<any>(`${this.endpoint}/statistics`, { startDate, endDate });
  }
}
