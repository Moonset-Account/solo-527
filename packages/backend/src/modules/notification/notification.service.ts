import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType, NotificationChannel } from '../../entities/notification.entity';
import { User } from '../../entities/user.entity';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectQueue('email') private emailQueue: Queue,
  ) {}

  async create(data: Partial<Notification>): Promise<Notification> {
    const notification = this.notificationRepository.create({
      ...data,
      channel: data.channel || NotificationChannel.IN_APP,
    });

    const saved = await this.notificationRepository.save(notification);

    if (saved.channel === NotificationChannel.EMAIL || saved.channel === NotificationChannel.BOTH) {
      await this.emailQueue.add('send-notification', {
        notificationId: saved.id,
      });
    }

    return saved;
  }

  async findByUser(userId: string, filters?: { isRead?: boolean; type?: NotificationType }, page = 1, limit = 20) {
    const where: any = { recipientId: userId };
    
    if (filters?.isRead !== undefined) {
      where.isRead = filters.isRead;
    }
    
    if (filters?.type) {
      where.type = filters.type;
    }

    const [data, total] = await this.notificationRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id, recipientId: userId },
    });

    if (!notification) {
      return null;
    }

    notification.isRead = true;
    notification.readAt = new Date();
    return this.notificationRepository.save(notification);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.update(
      { recipientId: userId, isRead: false },
      { isRead: true, readAt: new Date() },
    );
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: { recipientId: userId, isRead: false },
    });
  }

  async sendEmail(notificationId: string): Promise<void> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId },
      relations: ['recipient'],
    });

    if (!notification || notification.emailSent) {
      return;
    }

    console.log(`Sending email to ${notification.recipient.email}: ${notification.title}`);

    notification.emailSent = true;
    notification.emailSentAt = new Date();
    await this.notificationRepository.save(notification);
  }
}
