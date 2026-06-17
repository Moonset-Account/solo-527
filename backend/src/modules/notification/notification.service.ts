import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument } from './schemas/notification.schema';
import { CreateNotificationDto, QueryNotificationDto } from './dto/notification.dto';
import { DictionaryService } from '../dictionary/dictionary.service';
import { UsersService } from '../users/users.service';
import { UserRole, NotificationType, NotificationPriority } from '../../common/enums/index.enum';
import { RedisService } from '../../common/redis/redis.service';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
    private dictionaryService: DictionaryService,
    private usersService: UsersService,
    private redisService: RedisService,
  ) {}

  async create(dto: CreateNotificationDto): Promise<Notification> {
    const notification = new this.notificationModel({
      ...dto,
      channels: ['inApp'],
    });
    await notification.save();

    for (const recipientId of dto.recipientIds) {
      await this.redisService.incr(`notification:unread:${recipientId}`);
      await this.redisService.publish('notification', JSON.stringify({
        notificationId: notification._id,
        recipientId,
        type: notification.type,
        title: notification.title,
      }));
    }

    return notification;
  }

  async findMyNotifications(userId: string, query: QueryNotificationDto): Promise<{ list: Notification[]; total: number; unreadCount: number }> {
    const { type, unreadOnly, unconfirmedOnly, page, pageSize } = query;
    const filter: any = { recipientIds: userId };

    if (type) filter.type = type;
    if (unreadOnly) filter.readBy = { $ne: userId };
    if (unconfirmedOnly) {
      filter.needConfirmation = true;
      filter.confirmedBy = { $ne: userId };
    }

    const [list, total, unreadCount] = await Promise.all([
      this.notificationModel
        .find(filter)
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .sort({ createdAt: -1 })
        .exec(),
      this.notificationModel.countDocuments(filter),
      this.notificationModel.countDocuments({ recipientIds: userId, readBy: { $ne: userId } }),
    ]);

    return { list, total, unreadCount };
  }

  async markAsRead(id: string, userId: string): Promise<void> {
    const notification = await this.notificationModel.findById(id);
    if (!notification) throw new NotFoundException('通知不存在');

    if (!notification.readBy.includes(userId)) {
      notification.readBy.push(userId);
      await notification.save();
      const count = await this.redisService.get<number>(`notification:unread:${userId}`);
      if (count && count > 0) {
        await this.redisService.set(`notification:unread:${userId}`, count - 1);
      }
    }
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationModel.updateMany(
      { recipientIds: userId, readBy: { $ne: userId } },
      { $push: { readBy: userId } },
    );
    await this.redisService.set(`notification:unread:${userId}`, 0);
  }

  async confirm(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationModel.findById(id);
    if (!notification) throw new NotFoundException('通知不存在');
    if (!notification.needConfirmation) {
      throw new Error('该通知无需确认');
    }

    if (!notification.confirmedBy.includes(userId)) {
      notification.confirmedBy.push(userId);
      await notification.save();

      await this.syncToDashboard(notification);
    }

    return notification;
  }

  async getUnreadCount(userId: string): Promise<number> {
    const cached = await this.redisService.get<number>(`notification:unread:${userId}`);
    if (cached !== null) return cached;

    const count = await this.notificationModel.countDocuments({
      recipientIds: userId,
      readBy: { $ne: userId },
    });
    await this.redisService.set(`notification:unread:${userId}`, count);
    return count;
  }

  private async getRecipientsByRoles(roles: UserRole[]): Promise<string[]> {
    const { list } = await this.usersService.findAll({
      role: roles[0],
      page: 1,
      pageSize: 1000,
    } as any);

    const filtered = list.filter((u) => roles.some((r) => u.roles?.includes(r)));
    return filtered.map((u) => u._id.toString());
  }

  async sendApplicationSubmitted(application: any): Promise<void> {
    const managerRoles = [UserRole.REAGENT_MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN];
    const recipientIds = await this.getRecipientsByRoles(managerRoles);

    const config = await this.dictionaryService.getNotificationConfigByType(NotificationType.APPLICATION_SUBMITTED);

    await this.create({
      type: NotificationType.APPLICATION_SUBMITTED,
      priority: config?.priority || NotificationPriority.MEDIUM,
      title: `新的领用申请待审核: ${application.applicationNo}`,
      content: `${application.applicantName} 提交了新的试剂领用申请，用途：${application.purpose}`,
      recipientIds,
      payload: { applicationId: application._id, applicationNo: application.applicationNo },
      relatedModule: 'application',
      relatedId: application._id.toString(),
      needConfirmation: false,
    });
  }

  async sendApplicationApproved(application: any): Promise<void> {
    await this.create({
      type: NotificationType.APPLICATION_APPROVED,
      priority: NotificationPriority.MEDIUM,
      title: `申请已通过: ${application.applicationNo}`,
      content: `您提交的试剂领用申请已通过审核，请按时领取。${application.approval?.remark ? '备注：' + application.approval.remark : ''}`,
      recipientIds: [application.applicantId],
      payload: { applicationId: application._id, applicationNo: application.applicationNo },
      relatedModule: 'application',
      relatedId: application._id.toString(),
    });
  }

  async sendApplicationRejected(application: any, reason: string): Promise<void> {
    await this.create({
      type: NotificationType.APPLICATION_REJECTED,
      priority: NotificationPriority.HIGH,
      title: `申请被驳回: ${application.applicationNo}`,
      content: `您提交的试剂领用申请被驳回，原因：${reason}`,
      recipientIds: [application.applicantId],
      payload: { applicationId: application._id, applicationNo: application.applicationNo },
      relatedModule: 'application',
      relatedId: application._id.toString(),
    });
  }

  async sendLowStockAlert(reagent: any): Promise<void> {
    const managerRoles = [UserRole.REAGENT_MANAGER, UserRole.ADMIN];
    const recipientIds = await this.getRecipientsByRoles(managerRoles);

    await this.create({
      type: NotificationType.SYSTEM_NOTICE,
      priority: NotificationPriority.HIGH,
      title: `库存预警: ${reagent.name}`,
      content: `试剂 ${reagent.name} (批号: ${reagent.batchNo || 'N/A'}) 当前库存 ${reagent.availableQuantity}${reagent.unit}，已低于预警阈值 ${reagent.warningThreshold}${reagent.unit}`,
      recipientIds,
      payload: { reagentId: reagent._id },
      relatedModule: 'reagent',
      relatedId: reagent._id.toString(),
    });
  }

  async sendSafetyComplianceAlert(message: string, relatedData: any, recipientIds?: string[]): Promise<void> {
    const targetRecipients = recipientIds || await this.getRecipientsByRoles([
      UserRole.REAGENT_MANAGER,
      UserRole.LAB_MANAGER,
      UserRole.ADMIN,
      UserRole.SUPER_ADMIN,
    ]);

    await this.create({
      type: NotificationType.SAFETY_COMPLIANCE,
      priority: NotificationPriority.URGENT,
      title: '安全合规提醒',
      content: message,
      recipientIds: targetRecipients,
      payload: relatedData,
      needConfirmation: true,
    });
  }

  async sendSampleUnknownAlert(sample: any, reagentManagerIds?: string[]): Promise<void> {
    const recipientIds = reagentManagerIds || await this.getRecipientsByRoles([
      UserRole.REAGENT_MANAGER,
      UserRole.ADMIN,
    ]);

    const notification = await this.create({
      type: NotificationType.SAMPLE_UNKNOWN,
      priority: NotificationPriority.URGENT,
      title: `样本去向不明: ${sample.sampleCode || sample._id}`,
      content: `样本 ${sample.sampleCode || sample._id} 当前状态为去向不明，请及时确认处理。`,
      recipientIds,
      payload: { sampleId: sample._id, sampleCode: sample.sampleCode },
      relatedModule: 'sample',
      relatedId: sample._id.toString(),
      needConfirmation: true,
    });

    await this.redisService.hset('maintenance-board:pending', notification._id.toString(), JSON.stringify({
      id: notification._id,
      type: notification.type,
      title: notification.title,
      content: notification.content,
      createdAt: notification.createdAt,
      confirmed: false,
    }));
  }

  async syncToDashboard(notification: Notification): Promise<void> {
    notification.syncedToDashboardAt = new Date();
    await notification.save();

    await this.redisService.hset('maintenance-board:confirmed', notification._id.toString(), JSON.stringify({
      id: notification._id,
      type: notification.type,
      title: notification.title,
      content: notification.content,
      confirmedAt: new Date(),
      confirmedBy: notification.confirmedBy,
    }));

    await this.redisService.publish('maintenance-board:update', JSON.stringify({
      id: notification._id,
      status: 'confirmed',
    }));
  }

  async getMaintenanceBoard(): Promise<{ pending: any[]; confirmed: any[] }> {
    const [pendingObj, confirmedObj] = await Promise.all([
      this.redisService.redisClient ? null : null,
      null,
    ]);

    const [pendingNotifs, confirmedNotifs] = await Promise.all([
      this.notificationModel.find({
        needConfirmation: true,
        $expr: { $lt: [{ $size: '$confirmedBy' }, 1] },
      }).sort({ createdAt: -1 }).limit(50),
      this.notificationModel.find({
        needConfirmation: true,
        $expr: { $gte: [{ $size: '$confirmedBy' }, 1] },
      }).sort({ syncedToDashboardAt: -1 }).limit(50),
    ]);

    return {
      pending: pendingNotifs.map((n) => ({
        id: n._id,
        type: n.type,
        priority: n.priority,
        title: n.title,
        content: n.content,
        createdAt: n.createdAt,
      })),
      confirmed: confirmedNotifs.map((n) => ({
        id: n._id,
        type: n.type,
        title: n.title,
        content: n.content,
        confirmedAt: n.syncedToDashboardAt,
        confirmedBy: n.confirmedBy,
      })),
    };
  }
}
