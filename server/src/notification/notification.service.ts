import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './notification.entity.js';
import { User } from '../common/user.entity.js';
import { NotificationGateway } from './notification.gateway.js';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepo: Repository<Notification>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private notificationGateway: NotificationGateway,
  ) {}

  async findByUser(userId: string) {
    return this.notificationRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async markAsRead(id: string) {
    await this.notificationRepo.update(id, { read: true });
    return { message: 'Notification marked as read' };
  }

  async markAllAsRead(userId: string) {
    await this.notificationRepo.update({ userId, read: false }, { read: true });
    return { message: 'All notifications marked as read' };
  }

  async create(userId: string, type: string, title: string, message?: string, data?: any) {
    const notification = this.notificationRepo.create({ userId, type, title, message, data });
    const saved = await this.notificationRepo.save(notification);
    this.notificationGateway.sendToUser(userId, saved);
    return saved;
  }

  async notifyRole(companyId: string, role: string, type: string, title: string, data?: any) {
    const users = await this.userRepo.find({ where: { companyId, role } });
    for (const user of users) {
      await this.create(user.id, type, title, undefined, data);
    }
  }
}
