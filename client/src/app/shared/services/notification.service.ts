import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { ApiService } from './api.service';
import { Notification, DashboardStats } from '../models';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private socket: Socket | null = null;
  private notificationSubject = new Subject<Notification>();
  private unreadCountSubject = new Subject<number>();
  public notification$ = this.notificationSubject.asObservable();
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private api: ApiService) {}

  getAll(): Observable<Notification[]> {
    return this.api.get<Notification[]>('/notifications');
  }

  getUnreadCount(): Observable<{ count: number }> {
    return this.api.get<{ count: number }>('/notifications/unread-count');
  }

  getDashboardStats(): Observable<DashboardStats> {
    return this.api.get<DashboardStats>('/notifications/dashboard-stats');
  }

  markAsRead(id: string): Observable<Notification> {
    return this.api.patch<Notification>(`/notifications/${id}/read`, {});
  }

  markAllAsRead(): Observable<void> {
    return this.api.post<void>('/notifications/read-all', {});
  }

  refreshUnreadCount(): void {
    this.getUnreadCount().subscribe({
      next: (data) => this.unreadCountSubject.next(data.count),
      error: () => {},
    });
  }

  connectWebSocket(userId: string): void {
    if (this.socket && this.socket.connected) {
      return;
    }
    const wsUrl = 'http://localhost:3000';
    this.socket = io(wsUrl, {
      auth: { userId },
      transports: ['websocket', 'polling'],
    });

    this.socket.on('notification', (notification: Notification) => {
      this.notificationSubject.next(notification);
      this.refreshUnreadCount();
      this.showBrowserNotification(notification);
    });

    this.socket.on('connect', () => {
      console.log('Notification WebSocket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('Notification WebSocket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });
  }

  disconnectWebSocket(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  private showBrowserNotification(notification: Notification): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.content || '',
        icon: '/assets/icon.png',
      });
    }
  }

  requestNotificationPermission(): void {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }
}
