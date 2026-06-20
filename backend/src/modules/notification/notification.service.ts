import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, In } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Notification, NotificationType, NotificationChannel, NotificationStatus } from '../../entities/notification.entity';
import { CallbackLog, CallbackType, CallbackStatus } from '../../entities/callback-log.entity';
import { v4 as uuidv4 } from 'uuid';

export interface CreateNotificationDto {
  recipientId?: string;
  recipientTarget?: string;
  type: NotificationType | string;
  channel: NotificationChannel | string;
  title: string;
  content?: string;
  templateParams?: Record<string, any>;
  relatedData?: Record<string, any>;
  maxRetryCount?: number;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(Notification) private notificationRepo: Repository<Notification>,
    @InjectRepository(CallbackLog) private callbackLogRepo: Repository<CallbackLog>,
  ) {}

  async createNotification(dto: CreateNotificationDto) {
    const notification = this.notificationRepo.create({
      recipientId: dto.recipientId,
      recipientTarget: dto.recipientTarget,
      type: dto.type as any,
      channel: dto.channel as any,
      title: dto.title,
      content: dto.content,
      templateParams: dto.templateParams,
      relatedData: dto.relatedData,
      status: dto.channel === NotificationChannel.IN_APP ? NotificationStatus.PENDING : NotificationStatus.PENDING,
      maxRetryCount: dto.maxRetryCount ?? 3,
    });
    const saved = await this.notificationRepo.save(notification);

    if (dto.channel !== NotificationChannel.IN_APP) {
      setImmediate(() => this.sendNotification(saved.id));
    }
    return saved;
  }

  private async sendNotification(id: string) {
    try {
      const notif = await this.notificationRepo.findOne({ where: { id } });
      if (!notif || notif.status === NotificationStatus.SENT) return;

      notif.status = NotificationStatus.SENDING;
      await this.notificationRepo.save(notif);

      let success = false;
      let failureReason = '';

      try {
        switch (notif.channel) {
          case NotificationChannel.EMAIL:
            success = await this.mockSendEmail(notif.recipientTarget, notif.title, notif.content || '');
            break;
          case NotificationChannel.SMS:
            success = await this.mockSendSms(notif.recipientTarget, notif.content || notif.title);
            break;
          case NotificationChannel.WECHAT:
          case NotificationChannel.DINGTALK:
            success = await this.mockSendWebhook(notif);
            break;
          default:
            success = true;
        }
      } catch (err) {
        failureReason = err.message;
        success = false;
      }

      if (success) {
        notif.status = NotificationStatus.SENT;
        notif.sentAt = new Date();
        notif.failureReason = null;
      } else {
        notif.retryCount = (notif.retryCount || 0) + 1;
        if (notif.retryCount >= (notif.maxRetryCount || 3)) {
          notif.status = NotificationStatus.FAILED;
          notif.failureReason = failureReason || '发送失败，已达最大重试次数';
          await this.recordFailedCallback(notif);
        } else {
          notif.status = NotificationStatus.RETRYING;
          notif.nextRetryAt = new Date(Date.now() + notif.retryCount * 5 * 60 * 1000);
          notif.failureReason = failureReason || '发送失败';
        }
      }

      await this.notificationRepo.save(notif);
    } catch (err) {
      this.logger.error(`发送通知失败: ${id}`, err.stack);
    }
  }

  private async mockSendEmail(to: string, subject: string, content: string): Promise<boolean> {
    await new Promise((r) => setTimeout(r, 200));
    this.logger.log(`[EMAIL] Mock发送邮件 -> ${to}: ${subject}`);
    return Math.random() > 0.1;
  }

  private async mockSendSms(phone: string, content: string): Promise<boolean> {
    await new Promise((r) => setTimeout(r, 100));
    this.logger.log(`[SMS] Mock发送短信 -> ${phone}: ${content.substring(0, 30)}...`);
    return Math.random() > 0.05;
  }

  private async mockSendWebhook(notif: Notification): Promise<boolean> {
    await new Promise((r) => setTimeout(r, 150));
    this.logger.log(`[WEBHOOK] Mock发送到 ${notif.channel} -> ${notif.title}`);
    return Math.random() > 0.08;
  }

  private async recordFailedCallback(notif: Notification) {
    try {
      const log = this.callbackLogRepo.create({
        requestId: uuidv4(),
        callbackType: CallbackType.NOTIFICATION,
        status: CallbackStatus.FAILED,
        targetUrl: `notification://${notif.channel}/${notif.recipientTarget || notif.recipientId}`,
        httpMethod: 'POST',
        requestPayload: JSON.stringify({
          type: notif.type,
          title: notif.title,
          content: notif.content,
          relatedData: notif.relatedData,
        }),
        requestHeaders: { 'x-channel': notif.channel },
        retryCount: notif.retryCount,
        maxRetryCount: notif.maxRetryCount,
        failureReason: notif.failureReason,
        relatedId: notif.id,
        relatedType: 'notification',
        firstAttemptAt: notif.createdAt,
        lastAttemptAt: new Date(),
        retryHistory: [],
      });
      await this.callbackLogRepo.save(log);
    } catch (e) {}
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async retryFailedNotifications() {
    const now = new Date();
    const notifs = await this.notificationRepo.find({
      where: [
        { status: NotificationStatus.RETRYING, nextRetryAt: LessThan(now) },
        { status: NotificationStatus.PENDING, channel: In([NotificationChannel.EMAIL, NotificationChannel.SMS, NotificationChannel.WECHAT, NotificationChannel.DINGTALK]) },
      ],
      take: 50,
    });

    this.logger.log(`定时任务: 准备重试 ${notifs.length} 条通知`);
    for (const n of notifs) {
      await this.sendNotification(n.id);
    }
  }

  async getMyNotifications(userId: string, page = 1, pageSize = 20, status?: NotificationStatus, type?: NotificationType) {
    const qb = this.notificationRepo.createQueryBuilder('n').where('n.recipientId = :uid', { uid: userId });
    if (status) qb.andWhere('n.status = :st', { st: status });
    if (type) qb.andWhere('n.type = :tp', { tp: type });

    const [list, total] = await qb
      .orderBy('n.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    const unread = await this.notificationRepo.count({
      where: { recipientId: userId, status: In([NotificationStatus.PENDING, NotificationStatus.SENT]) },
    });

    return { list, total, page, pageSize, unread };
  }

  async readNotification(id: string, userId: string) {
    const notif = await this.notificationRepo.findOne({ where: { id, recipientId: userId } });
    if (!notif) throw new NotFoundException('通知不存在');
    notif.status = NotificationStatus.READ;
    notif.readAt = new Date();
    return this.notificationRepo.save(notif);
  }

  async readAll(userId: string) {
    await this.notificationRepo
      .createQueryBuilder()
      .update()
      .set({ status: NotificationStatus.READ, readAt: new Date() })
      .where('recipientId = :uid AND status IN (:...st)', {
        uid: userId,
        st: [NotificationStatus.PENDING, NotificationStatus.SENT],
      })
      .execute();
    return { success: true };
  }

  async getUnreadCount(userId: string) {
    return this.notificationRepo.count({
      where: { recipientId: userId, status: In([NotificationStatus.PENDING, NotificationStatus.SENT]) },
    });
  }
}
