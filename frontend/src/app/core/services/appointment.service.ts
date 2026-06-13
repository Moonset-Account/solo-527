import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, PageResult } from './api.service';

export interface Appointment {
  id: number;
  patientId: number;
  patientName: string;
  patientPhone: string;
  doctorId: number;
  doctorName: string;
  clinicId: number;
  clinicName: string;
  slotId: number;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  type: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentSlot {
  id: number;
  doctorId: number;
  date: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  maxPatients: number;
  currentPatients: number;
}

export interface CreateAppointmentDto {
  patientId: number;
  doctorId: number;
  slotId: number;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  type: string;
  notes?: string;
}

export interface UpdateAppointmentDto {
  doctorId?: number;
  slotId?: number;
  appointmentDate?: string;
  startTime?: string;
  endTime?: string;
  type?: string;
  status?: string;
  notes?: string;
}

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private endpoint = '/appointments';
  private slotEndpoint = '/appointment-slots';

  constructor(private api: ApiService) {}

  getAppointments(page: number = 1, pageSize: number = 10, filters?: Record<string, any>): Observable<PageResult<Appointment>> {
    return this.api.getPage<Appointment>(this.endpoint, page, pageSize, filters);
  }

  getAppointment(id: number): Observable<Appointment> {
    return this.api.get<Appointment>(`${this.endpoint}/${id}`);
  }

  createAppointment(data: CreateAppointmentDto): Observable<Appointment> {
    return this.api.post<Appointment>(this.endpoint, data);
  }

  updateAppointment(id: number, data: UpdateAppointmentDto): Observable<Appointment> {
    return this.api.put<Appointment>(`${this.endpoint}/${id}`, data);
  }

  updateStatus(id: number, status: string): Observable<Appointment> {
    return this.api.patch<Appointment>(`${this.endpoint}/${id}/status`, { status });
  }

  deleteAppointment(id: number): Observable<void> {
    return this.api.delete<void>(`${this.endpoint}/${id}`);
  }

  getAvailableSlots(doctorId: number, date: string): Observable<AppointmentSlot[]> {
    return this.api.get<AppointmentSlot[]>(`${this.slotEndpoint}/available`, { doctorId, date });
  }

  getSlots(doctorId?: number, date?: string): Observable<AppointmentSlot[]> {
    return this.api.get<AppointmentSlot[]>(this.slotEndpoint, { doctorId, date });
  }

  getStatistics(startDate?: string, endDate?: string): Observable<any> {
    return this.api.get<any>(`${this.endpoint}/statistics`, { startDate, endDate });
  }
}
