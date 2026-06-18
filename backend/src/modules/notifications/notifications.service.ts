import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cron } from '@nestjs/schedule';
import {
  Notification,
  NotificationType,
  NotificationPriority,
} from './schemas/notification.schema';
import { Inject } from '@nestjs/common';
import { REDIS_CLIENT } from '../redis/redis.module';
import Redis from 'ioredis';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<Notification>,
    @Inject(REDIS_CLIENT) private redis: Redis,
  ) {}

  async create(
    params: {
      userId: string;
      type: NotificationType;
      title: string;
      content?: string;
      priority?: NotificationPriority;
      data?: Record<string, any>;
      ccUserIds?: string[];
    },
  ): Promise<Notification> {
    const notification = new this.notificationModel({
      userId: new Types.ObjectId(params.userId),
      type: params.type,
      title: params.title,
      content: params.content,
      priority: params.priority || 'normal',
      data: params.data,
      ccUserIds: params.ccUserIds?.map((id) => new Types.ObjectId(id)) || [],
    });

    const saved = await notification.save();

    const cacheKey = `notification:unread_count:${params.userId}`;
    await this.redis.incr(cacheKey);
    await this.redis.expire(cacheKey, 3600);

    return saved;
  }

  async findByUser(
    userId: string,
    query: {
      isRead?: boolean;
      type?: NotificationType;
      priority?: NotificationPriority;
      page?: number;
      pageSize?: number;
    },
  ) {
    const { isRead, type, priority, page = 1, pageSize = 20 } = query;
    const filter: any = {
      userId: new Types.ObjectId(userId),
      isArchived: false,
    };

    if (isRead !== undefined) filter.isRead = isRead;
    if (type) filter.type = type;
    if (priority) filter.priority = priority;

    const total = await this.notificationModel.countDocuments(filter);
    const list = await this.notificationModel
      .find(filter)
      .sort({ priority: 1, createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    return { list, total, page, pageSize };
  }

  async findOne(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationModel.findOne({
      _id: id,
      userId: new Types.ObjectId(userId),
    });
    if (!notification) {
      throw new NotFoundException('通知不存在');
    }
    return notification;
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationModel.findOneAndUpdate(
      { _id: id, userId: new Types.ObjectId(userId) },
      { isRead: true, readAt: new Date() },
      { new: true },
    );
    if (!notification) {
      throw new NotFoundException('通知不存在');
    }
    await this.updateUnreadCountCache(userId);
    return notification;
  }

  async markAllAsRead(userId: string): Promise<{ count: number }> {
    const result = await this.notificationModel.updateMany(
      { userId: new Types.ObjectId(userId), isRead: false },
      { isRead: true, readAt: new Date() },
    );
    await this.updateUnreadCountCache(userId);
    return { count: result.modifiedCount };
  }

  async getUnreadCount(userId: string): Promise<number> {
    const cacheKey = `notification:unread_count:${userId}`;
    const cached = await this.redis.get(cacheKey);
    if (cached !== null) {
      return parseInt(cached, 10);
    }

    const count = await this.notificationModel.countDocuments({
      userId: new Types.ObjectId(userId),
      isRead: false,
      isArchived: false,
    });

    await this.redis.set(cacheKey, count.toString(), 'EX', 3600);
    return count;
  }

  async remove(id: string, userId: string): Promise<void> {
    const result = await this.notificationModel.findOneAndUpdate(
      { _id: id, userId: new Types.ObjectId(userId) },
      { isArchived: true },
    );
    if (!result) {
      throw new NotFoundException('通知不存在');
    }
  }

  private async updateUnreadCountCache(userId: string) {
    const cacheKey = `notification:unread_count:${userId}`;
    const count = await this.notificationModel.countDocuments({
      userId: new Types.ObjectId(userId),
      isRead: false,
      isArchived: false,
    });
    await this.redis.set(cacheKey, count.toString(), 'EX', 3600);
  }

  async notifyPermissionExpiring(
    users: { userId: string; userName: string; expireAt: Date; datasetName?: string }[],
  ) {
    for (const user of users) {
      const daysLeft = Math.ceil(
        (new Date(user.expireAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      );
      const msg = daysLeft <= 0
        ? `${user.userName}，您的账号权限已过期，请联系运营负责人`
        : `${user.userName}，您的${user.datasetName || '系统'}权限将在 ${daysLeft} 天后过期`;

      await this.create({
        userId: user.userId,
        type: daysLeft <= 0 ? 'permission_expired' : 'permission_expiring',
        title: daysLeft <= 0 ? '⚠️ 权限已过期' : '⏰ 权限即将过期',
        content: msg,
        priority: daysLeft <= 1 ? 'high' : 'normal',
        data: {
          userName: user.userName,
          expireAt: user.expireAt,
          datasetName: user.datasetName,
          daysLeft,
        },
      });
    }
  }

  @Cron('0 0 9 * * *')
  async dailyCheckPermissionExpiry() {
    console.log('🔔 开始检查即将过期的权限...');
  }

  async initMockData(userId: string) {
    const count = await this.notificationModel.countDocuments({
      userId: new Types.ObjectId(userId),
    });
    if (count > 0) return;

    const mockData = [
      {
        type: 'anomaly_detected' as NotificationType,
        title: '🚨 检测到严重异常：日新增用户骤降',
        content: '今日日新增用户数较昨日下降 32%，请及时处理',
        priority: 'critical' as NotificationPriority,
        data: { anomalyId: 'mock1', severity: 'critical' },
      },
      {
        type: 'anomaly_assigned' as NotificationType,
        title: '📋 新的异常任务分配给您',
        content: '运营经理将【7日留存率异常】分配给您处理',
        priority: 'high' as NotificationPriority,
        data: { anomalyId: 'mock2', assignee: userId },
      },
      {
        type: 'permission_expiring' as NotificationType,
        title: '⏰ 数据集权限即将过期',
        content: '您的【留存分析数据集】访问权限将在 3 天后过期',
        priority: 'normal' as NotificationPriority,
        data: { datasetName: '留存分析数据集', daysLeft: 3 },
      },
      {
        type: 'report_reminder' as NotificationType,
        title: '📅 周报提醒：请准备本周复盘',
        content: '请于周一 10:00 前完成本周异常分析周报',
        priority: 'normal' as NotificationPriority,
        data: { reportType: 'weekly', dueAt: new Date(Date.now() + 86400000) },
      },
      {
        type: 'mention' as NotificationType,
        title: '@你 运营专员在评论中提到了您',
        content: '请帮忙确认留存率下降是否与注册流程变更有关',
        priority: 'normal' as NotificationPriority,
        data: { commentId: 'mock1', anomalyId: 'mock3' },
      },
      {
        type: 'alert_triggered' as NotificationType,
        title: '🔔 告警触发：首屏加载时长超标',
        content: '连续 3 次检测到首屏平均加载时长超过 3 秒阈值',
        priority: 'high' as NotificationPriority,
        data: { ruleId: 'mock1', metricName: 'page_load_time' },
      },
    ];

    const insertData = mockData.map((item, i) => ({
      userId: new Types.ObjectId(userId),
      ...item,
      isRead: i >= 3,
      createdAt: new Date(Date.now() - i * 3600000 * 2),
    }));

    await this.notificationModel.insertMany(insertData);
    await this.updateUnreadCountCache(userId);
  }
}
