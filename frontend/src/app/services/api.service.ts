import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class ApiService {
  base = '/api';
  private admin$ = new BehaviorSubject<any>(null);

  constructor(private http: HttpClient, private router: Router, private snackBar: MatSnackBar) {
    const u = localStorage.getItem('adminUser');
    if (u) this.admin$.next(JSON.parse(u));
  }

  get admin() { return this.admin$.asObservable(); }
  getAdmin() { return this.admin$.value; }

  toast(msg: string, type = 'success') {
    this.snackBar.open(msg, '×', {
      duration: 3000, panelClass: type === 'error' ? 'toast-error' : 'toast-success',
      horizontalPosition: 'right', verticalPosition: 'top',
    });
  }

  // Auth
  login(username: string, password: string): Observable<any> {
    return this.http.post(`${this.base}/auth/login`, { username, password }).pipe(
      tap((res: any) => {
        localStorage.setItem('accessToken', res.accessToken);
        localStorage.setItem('refreshToken', res.refreshToken);
        localStorage.setItem('adminUser', JSON.stringify(res.user));
        this.admin$.next(res.user);
      })
    );
  }
  logout() {
    localStorage.clear();
    this.admin$.next(null);
    this.router.navigate(['/admin/login']);
  }

  // Registrations
  createRegistration(body: any): Observable<any> {
    return this.http.post(`${this.base}/registrations`, body);
  }
  lookupRegistrations(phone: string, orderId?: string): Observable<any> {
    const params = { phone };
    if (orderId) (params as any).orderId = orderId;
    return this.http.get(`${this.base}/registrations/lookup`, { params });
  }
  listRegistrations(params: any = {}): Observable<any> {
    return this.http.get(`${this.base}/registrations`, { params });
  }
  getRegistration(id: string): Observable<any> {
    return this.http.get(`${this.base}/registrations/${id}`);
  }
  reviewRegistration(id: string, body: any): Observable<any> {
    return this.http.patch(`${this.base}/registrations/${id}/review`, body);
  }

  // Tickets
  listTickets(includeOff = false): Observable<any> {
    return this.http.get(`${this.base}/ticket-types`, { params: { includeOff: String(includeOff) } });
  }
  createTicket(body: any): Observable<any> {
    return this.http.post(`${this.base}/ticket-types`, body);
  }
  updateTicket(id: string, body: any): Observable<any> {
    return this.http.put(`${this.base}/ticket-types/${id}`, body);
  }
  setTicketStatus(id: string, isOnSale: boolean): Observable<any> {
    return this.http.patch(`${this.base}/ticket-types/${id}/status`, { isOnSale });
  }
  adjustInventory(id: string, body: any): Observable<any> {
    return this.http.patch(`${this.base}/ticket-types/${id}/inventory`, body);
  }
  inventoryHistory(id: string): Observable<any> {
    return this.http.get(`${this.base}/ticket-types/${id}/history`);
  }

  // Sessions
  listSessions(onlyActive = true): Observable<any> {
    return this.http.get(`${this.base}/sessions`, { params: { onlyActive: String(onlyActive) } });
  }
  createSession(body: any): Observable<any> {
    return this.http.post(`${this.base}/sessions`, body);
  }
  updateSession(id: string, body: any): Observable<any> {
    return this.http.put(`${this.base}/sessions/${id}`, body);
  }
  getSeats(id: string): Observable<any> {
    return this.http.get(`${this.base}/sessions/${id}/seats`);
  }
  updateSeat(sessionId: string, seatId: string, body: any): Observable<any> {
    return this.http.patch(`${this.base}/sessions/${sessionId}/seats/${seatId}`, body);
  }
  setSessionQuality(id: string, qualityWeight: number): Observable<any> {
    return this.http.patch(`${this.base}/sessions/${id}/quality-weight`, { qualityWeight });
  }

  // Guests
  listGuests(keyword = ''): Observable<any> {
    return this.http.get(`${this.base}/guests`, { params: { keyword } });
  }
  createGuest(body: any): Observable<any> {
    return this.http.post(`${this.base}/guests`, body);
  }
  updateGuestQuota(id: string, totalQuota: number): Observable<any> {
    return this.http.patch(`${this.base}/guests/${id}/quota`, { totalQuota });
  }
  allocateGuest(id: string, body: any): Observable<any> {
    return this.http.post(`${this.base}/guests/${id}/allocations`, body);
  }
  listGuestAllocations(id: string): Observable<any> {
    return this.http.get(`${this.base}/guests/${id}/allocations`);
  }

  // Checkin
  generateCheckinCodes(registrationIds: string[]): Observable<any> {
    return this.http.post(`${this.base}/checkin-codes/generate`, { registrationIds });
  }
  listCheckinCodes(params: any = {}): Observable<any> {
    return this.http.get(`${this.base}/checkin-codes`, { params });
  }
  getCheckinCode(code: string): Observable<any> {
    return this.http.get(`${this.base}/checkin-codes/${code}`);
  }
  verifyCheckin(code: string, location = '主会场'): Observable<any> {
    return this.http.post(`${this.base}/checkin-codes/${code}/verify`, { location });
  }

  // Refunds
  applyRefund(body: any): Observable<any> {
    return this.http.post(`${this.base}/refunds`, body);
  }
  listRefunds(params: any = {}): Observable<any> {
    return this.http.get(`${this.base}/refunds`, { params });
  }
  getRefund(id: string): Observable<any> {
    return this.http.get(`${this.base}/refunds/${id}`);
  }
  reviewRefund(id: string, body: any): Observable<any> {
    return this.http.patch(`${this.base}/refunds/${id}/review`, body);
  }
  executeRefund(id: string): Observable<any> {
    return this.http.post(`${this.base}/refunds/${id}/execute`, {});
  }

  // Notifications
  listTemplates(onlyActive = true): Observable<any> {
    return this.http.get(`${this.base}/notification-templates`, { params: { onlyActive: String(onlyActive) } });
  }
  getTemplate(id: string): Observable<any> {
    return this.http.get(`${this.base}/notification-templates/${id}`);
  }
  updateTemplate(id: string, body: any): Observable<any> {
    return this.http.put(`${this.base}/notification-templates/${id}`, body);
  }
  sendNotifications(body: any): Observable<any> {
    return this.http.post(`${this.base}/notifications/send`, body);
  }
  listNotificationHistory(params: any = {}): Observable<any> {
    return this.http.get(`${this.base}/notifications/history`, { params });
  }

  // Analytics
  dashboardKpi(): Observable<any> {
    return this.http.get(`${this.base}/analytics/dashboard`);
  }
  qualityStats(params: any = {}): Observable<any> {
    return this.http.get(`${this.base}/analytics/quality`, { params });
  }
  funnelData(): Observable<any> {
    return this.http.get(`${this.base}/analytics/funnel`);
  }

  // Gap
  listGapTodos(status = 'pending'): Observable<any> {
    return this.http.get(`${this.base}/gap/todos`, { params: { status } });
  }
  getSuggestions(registrationId: string): Observable<any> {
    return this.http.get(`${this.base}/gap/${registrationId}/suggestions`);
  }
  handleGap(registrationId: string, body: any): Observable<any> {
    return this.http.post(`${this.base}/gap/${registrationId}/handle`, body);
  }

  // Exceptions
  listCloseReasons(): Observable<any> {
    return this.http.get(`${this.base}/exceptions/reasons`);
  }
  listExceptions(params: any = {}): Observable<any> {
    return this.http.get(`${this.base}/exceptions`, { params });
  }
  getException(id: string): Observable<any> {
    return this.http.get(`${this.base}/exceptions/${id}`);
  }
  traceException(id: string): Observable<any> {
    return this.http.get(`${this.base}/exceptions/${id}/trace`);
  }
}
