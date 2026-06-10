import { Injectable } from '@nestjs/common';
import * as dayjs from 'dayjs';

export interface Notification {
  id: string;
  type: 'delivery' | 'shortage' | 'quality' | 'production' | 'system';
  title: string;
  message: string;
  level: 'info' | 'warning' | 'danger';
  read: boolean;
  createdAt: Date;
  relatedId?: string;
}

@Injectable()
export class NotificationService {
  private notifications: Notification[] = [];

  create(notification: Omit<Notification, 'id' | 'read' | 'createdAt'>): Notification {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      read: false,
      createdAt: new Date(),
    };
    this.notifications.unshift(newNotification);
    if (this.notifications.length > 1000) {
      this.notifications = this.notifications.slice(0, 1000);
    }
    return newNotification;
  }

  findAll(unreadOnly: boolean = false): Notification[] {
    if (unreadOnly) {
      return this.notifications.filter(n => !n.read);
    }
    return this.notifications;
  }

  markAsRead(id: string): boolean {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.read = true;
      return true;
    }
    return false;
  }

  markAllAsRead(): number {
    let count = 0;
    this.notifications.forEach(n => {
      if (!n.read) {
        n.read = true;
        count++;
      }
    });
    return count;
  }

  checkDeliveryReminders(orders: any[]): Notification[] {
    const now = dayjs();
    const created: Notification[] = [];
    
    orders.forEach(order => {
      if (order.status === 'completed' || order.status === 'cancelled') return;
      
      const deliveryDate = dayjs(order.deliveryDate);
      const diffDays = deliveryDate.diff(now, 'day');
      
      if (diffDays <= 1 && diffDays >= 0) {
        created.push(this.create({
          type: 'delivery',
          title: '交付提醒',
          message: `订单【${order.orderNo}】${order.productName} 将于 ${deliveryDate.format('YYYY-MM-DD')} 交付，请注意跟进！`,
          level: diffDays === 0 ? 'danger' : 'warning',
          relatedId: order.id,
        }));
      } else if (diffDays < 0) {
        created.push(this.create({
          type: 'delivery',
          title: '交付逾期',
          message: `订单【${order.orderNo}】${order.productName} 已逾期 ${Math.abs(diffDays)} 天，请尽快处理！`,
          level: 'danger',
          relatedId: order.id,
        }));
      }
    });
    
    return created;
  }
}
