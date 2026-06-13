import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, PageResult } from './api.service';

export interface ReminderTask {
  id: number;
  type: 'appointment' | 'followup' | 'payment' | 'revisit';
  relatedId: number;
  patientId: number;
  patientName: string;
  patientPhone: string;
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assignedTo: number;
  assignedToName: string;
  dueDate: string;
  completedAt?: string;
  completedBy?: number;
  completedByName?: string;
  reminderCount: number;
  lastReminderAt?: string;
  remarks: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReminderDto {
  type: string;
  relatedId: number;
  patientId: number;
  title: string;
  content: string;
  priority: string;
  assignedTo: number;
  dueDate: string;
  remarks?: string;
}

export interface UpdateReminderDto {
  title?: string;
  content?: string;
  priority?: string;
  status?: string;
  assignedTo?: number;
  dueDate?: string;
  remarks?: string;
}

@Injectable({ providedIn: 'root' })
export class ReminderService {
  private endpoint = '/reminders';

  constructor(private api: ApiService) {}

  getReminders(page: number = 1, pageSize: number = 10, filters?: Record<string, any>): Observable<PageResult<ReminderTask>> {
    return this.api.getPage<ReminderTask>(this.endpoint, page, pageSize, filters);
  }

  getReminder(id: number): Observable<ReminderTask> {
    return this.api.get<ReminderTask>(`${this.endpoint}/${id}`);
  }

  createReminder(data: CreateReminderDto): Observable<ReminderTask> {
    return this.api.post<ReminderTask>(this.endpoint, data);
  }

  updateReminder(id: number, data: UpdateReminderDto): Observable<ReminderTask> {
    return this.api.put<ReminderTask>(`${this.endpoint}/${id}`, data);
  }

  updateStatus(id: number, status: string): Observable<ReminderTask> {
    return this.api.patch<ReminderTask>(`${this.endpoint}/${id}/status`, { status });
  }

  completeReminder(id: number, remarks?: string): Observable<ReminderTask> {
    return this.api.post<ReminderTask>(`${this.endpoint}/${id}/complete`, { remarks });
  }

  sendReminder(id: number, method: 'sms' | 'phone' | 'wechat'): Observable<ReminderTask> {
    return this.api.post<ReminderTask>(`${this.endpoint}/${id}/send`, { method });
  }

  batchSendReminders(ids: number[], method: 'sms' | 'phone' | 'wechat'): Observable<void> {
    return this.api.post<void>(`${this.endpoint}/batch-send`, { ids, method });
  }

  getMyReminders(page: number = 1, pageSize: number = 10, filters?: Record<string, any>): Observable<PageResult<ReminderTask>> {
    return this.api.getPage<ReminderTask>(`${this.endpoint}/my`, page, pageSize, filters);
  }

  getStatistics(startDate?: string, endDate?: string): Observable<any> {
    return this.api.get<any>(`${this.endpoint}/statistics`, { startDate, endDate });
  }
}
