import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { ApiService } from './api.service';
import { Notification } from '../models';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private ws: WebSocket | null = null;
  private notificationSubject = new Subject<Notification>();
  public notification$ = this.notificationSubject.asObservable();

  constructor(private api: ApiService) {}

  getAll(): Observable<Notification[]> {
    return this.api.get<Notification[]>('/notifications');
  }

  markAsRead(id: string): Observable<Notification> {
    return this.api.patch<Notification>(`/notifications/${id}/read`, {});
  }

  markAllAsRead(): Observable<void> {
    return this.api.post<void>('/notifications/read-all', {});
  }

  connectWebSocket(userId: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return;
    }
    const wsUrl = 'ws://localhost:3000';
    this.ws = new WebSocket(`${wsUrl}/notifications?userId=${userId}`);
    this.ws.onmessage = (event) => {
      try {
        const notification = JSON.parse(event.data) as Notification;
        this.notificationSubject.next(notification);
      } catch {
        console.error('Failed to parse notification');
      }
    };
    this.ws.onerror = () => {
      console.error('WebSocket error');
    };
    this.ws.onclose = () => {
      this.ws = null;
    };
  }

  disconnectWebSocket(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
