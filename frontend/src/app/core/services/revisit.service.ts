import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, PageResult } from './api.service';

export interface RevisitChurn {
  id: number;
  patientId: number;
  patientName: string;
  patientPhone: string;
  lastVisitDate: string;
  expectedReturnDate: string;
  daysOverdue: number;
  churnRiskLevel: 'low' | 'medium' | 'high' | 'critical';
  treatmentHistory: string;
  status: 'identified' | 'contacted' | 'scheduled' | 'visited' | 'lost';
  assignedTo: number;
  assignedToName: string;
  lastContactedAt?: string;
  lastContactedBy?: number;
  lastContactedByName?: string;
  contactAttempts: number;
  notes: string;
  outcome: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRevisitChurnDto {
  patientId: number;
  lastVisitDate: string;
  expectedReturnDate: string;
  churnRiskLevel: string;
  treatmentHistory: string;
  assignedTo: number;
  notes?: string;
}

export interface UpdateRevisitChurnDto {
  expectedReturnDate?: string;
  churnRiskLevel?: string;
  status?: string;
  assignedTo?: number;
  notes?: string;
  outcome?: string;
}

export interface RecordContactDto {
  contactResult: string;
  notes?: string;
  nextFollowUpDate?: string;
}

@Injectable({ providedIn: 'root' })
export class RevisitService {
  private endpoint = '/revisit-churns';

  constructor(private api: ApiService) {}

  getRevisitChurns(page: number = 1, pageSize: number = 10, filters?: Record<string, any>): Observable<PageResult<RevisitChurn>> {
    return this.api.getPage<RevisitChurn>(this.endpoint, page, pageSize, filters);
  }

  getRevisitChurn(id: number): Observable<RevisitChurn> {
    return this.api.get<RevisitChurn>(`${this.endpoint}/${id}`);
  }

  createRevisitChurn(data: CreateRevisitChurnDto): Observable<RevisitChurn> {
    return this.api.post<RevisitChurn>(this.endpoint, data);
  }

  updateRevisitChurn(id: number, data: UpdateRevisitChurnDto): Observable<RevisitChurn> {
    return this.api.put<RevisitChurn>(`${this.endpoint}/${id}`, data);
  }

  updateStatus(id: number, status: string): Observable<RevisitChurn> {
    return this.api.patch<RevisitChurn>(`${this.endpoint}/${id}/status`, { status });
  }

  recordContact(id: number, data: RecordContactDto): Observable<RevisitChurn> {
    return this.api.post<RevisitChurn>(`${this.endpoint}/${id}/record-contact`, data);
  }

  scheduleAppointment(id: number, appointmentId: number): Observable<RevisitChurn> {
    return this.api.post<RevisitChurn>(`${this.endpoint}/${id}/schedule`, { appointmentId });
  }

  markAsVisited(id: number, notes?: string): Observable<RevisitChurn> {
    return this.api.post<RevisitChurn>(`${this.endpoint}/${id}/mark-visited`, { notes });
  }

  markAsLost(id: number, reason: string): Observable<RevisitChurn> {
    return this.api.post<RevisitChurn>(`${this.endpoint}/${id}/mark-lost`, { reason });
  }

  getMyRevisitChurns(page: number = 1, pageSize: number = 10, filters?: Record<string, any>): Observable<PageResult<RevisitChurn>> {
    return this.api.getPage<RevisitChurn>(`${this.endpoint}/my`, page, pageSize, filters);
  }

  analyzeChurn(startDate?: string, endDate?: string): Observable<any> {
    return this.api.post<any>(`${this.endpoint}/analyze`, { startDate, endDate });
  }

  getStatistics(startDate?: string, endDate?: string): Observable<any> {
    return this.api.get<any>(`${this.endpoint}/statistics`, { startDate, endDate });
  }
}
