import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Counselor, Package, Appointment, PaginatedResponse, AppointmentStatus } from '../models/appointment.model';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  getCounselors(activeOnly = false): Observable<Counselor[]> {
    const params: { active?: string } = {};
    if (activeOnly) {
      params.active = 'true';
    }
    return this.http.get<Counselor[]>(`${environment.apiUrl}/counselors`, { params });
  }

  getCounselor(id: string): Observable<Counselor> {
    return this.http.get<Counselor>(`${environment.apiUrl}/counselors/${id}`);
  }

  createCounselor(data: Partial<Counselor>): Observable<Counselor> {
    return this.http.post<Counselor>(`${environment.apiUrl}/counselors`, data);
  }

  updateCounselor(id: string, data: Partial<Counselor>): Observable<Counselor> {
    return this.http.put<Counselor>(`${environment.apiUrl}/counselors/${id}`, data);
  }

  deleteCounselor(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/counselors/${id}`);
  }

  getPackages(activeOnly = false): Observable<Package[]> {
    const params: { active?: string } = {};
    if (activeOnly) {
      params.active = 'true';
    }
    return this.http.get<Package[]>(`${environment.apiUrl}/packages`, { params });
  }

  getPackage(id: string): Observable<Package> {
    return this.http.get<Package>(`${environment.apiUrl}/packages/${id}`);
  }

  createPackage(data: Partial<Package>): Observable<Package> {
    return this.http.post<Package>(`${environment.apiUrl}/packages`, data);
  }

  updatePackage(id: string, data: Partial<Package>): Observable<Package> {
    return this.http.put<Package>(`${environment.apiUrl}/packages/${id}`, data);
  }

  deletePackage(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/packages/${id}`);
  }

  getAppointments(params?: {
    status?: AppointmentStatus;
    counselorId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Observable<PaginatedResponse<Appointment>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, String(value));
        }
      });
    }
    return this.http.get<PaginatedResponse<Appointment>>(
      `${environment.apiUrl}/appointments`,
      { params: httpParams }
    );
  }

  getTodayAppointments(counselorId?: string): Observable<Appointment[]> {
    const params: { counselorId?: string } = {};
    if (counselorId) {
      params.counselorId = counselorId;
    }
    return this.http.get<Appointment[]>(`${environment.apiUrl}/appointments/today`, { params });
  }

  getAppointment(id: string): Observable<Appointment> {
    return this.http.get<Appointment>(`${environment.apiUrl}/appointments/${id}`);
  }

  createAppointment(data: Partial<Appointment>): Observable<Appointment> {
    return this.http.post<Appointment>(`${environment.apiUrl}/appointments`, data);
  }

  updateAppointment(id: string, data: Partial<Appointment>): Observable<Appointment> {
    return this.http.put<Appointment>(`${environment.apiUrl}/appointments/${id}`, data);
  }

  updateAppointmentStatus(id: string, status: AppointmentStatus): Observable<Appointment> {
    return this.http.put<Appointment>(`${environment.apiUrl}/appointments/${id}/status`, { status });
  }

  getStatistics(startDate: string, endDate: string): Observable<any> {
    const params = { startDate, endDate };
    return this.http.get(`${environment.apiUrl}/appointments/statistics`, { params });
  }

  getCounselorWorkload(startDate: string, endDate: string): Observable<any[]> {
    const params = { startDate, endDate };
    return this.http.get<any[]>(`${environment.apiUrl}/appointments/workload`, { params });
  }

  checkIn(appointmentId: string, notes?: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/checkins`, { appointmentId, notes });
  }

  getTodayCheckins(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/checkins/today`);
  }

  getWaitlist(params?: {
    status?: string;
    counselorId?: string;
    page?: number;
    limit?: number;
  }): Observable<PaginatedResponse<any>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, String(value));
        }
      });
    }
    return this.http.get<PaginatedResponse<any>>(`${environment.apiUrl}/waitlist`, { params: httpParams });
  }

  getWaitlistCount(counselorId?: string): Observable<number> {
    const params: { counselorId?: string } = {};
    if (counselorId) {
      params.counselorId = counselorId;
    }
    return this.http.get<number>(`${environment.apiUrl}/waitlist/count`, { params });
  }

  createWaitlistEntry(data: Partial<any>): Observable<any> {
    return this.http.post(`${environment.apiUrl}/waitlist`, data);
  }

  updateWaitlistStatus(id: string, status: string): Observable<any> {
    return this.http.put(`${environment.apiUrl}/waitlist/${id}/status`, { status });
  }

  exportAppointments(startDate: string, endDate: string): void {
    const url = `${environment.apiUrl}/statistics/export/appointments?startDate=${startDate}&endDate=${endDate}`;
    this.downloadFile(url, `appointments_${Date.now()}.csv`);
  }

  exportWorkload(startDate: string, endDate: string): void {
    const url = `${environment.apiUrl}/statistics/export/workload?startDate=${startDate}&endDate=${endDate}`;
    this.downloadFile(url, `workload_${Date.now()}.csv`);
  }

  exportNoShow(startDate: string, endDate: string): void {
    const url = `${environment.apiUrl}/statistics/export/no-show?startDate=${startDate}&endDate=${endDate}`;
    this.downloadFile(url, `no_show_${Date.now()}.csv`);
  }

  exportOperationLogs(startDate: string, endDate: string): void {
    const url = `${environment.apiUrl}/statistics/export/operation-logs?startDate=${startDate}&endDate=${endDate}`;
    this.downloadFile(url, `operation_logs_${Date.now()}.csv`);
  }

  private downloadFile(url: string, filename: string): void {
    const token = localStorage.getItem('token');
    fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.blob())
      .then((blob) => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        URL.revokeObjectURL(link.href);
      });
  }

  getDashboardStats(startDate: string, endDate: string): Observable<any> {
    const params = { startDate, endDate };
    return this.http.get(`${environment.apiUrl}/statistics/dashboard`, { params });
  }

  getOperationLogs(params?: {
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Observable<PaginatedResponse<any>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, String(value));
        }
      });
    }
    return this.http.get<PaginatedResponse<any>>(`${environment.apiUrl}/operation-logs`, { params: httpParams });
  }
}
