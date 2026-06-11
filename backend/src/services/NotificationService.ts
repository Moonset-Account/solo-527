import { AppDataSource } from '../database/data-source';
import { Notification, NotificationType, NotificationCategory, EscalationRule, NotificationTask } from '../entities/Notification';
import { User } from '../entities/User';
import { In } from 'typeorm';

export class NotificationService {
  private notificationRepository = AppDataSource.getRepository(Notification);
  private escalationRuleRepository = AppDataSource.getRepository(EscalationRule);
  private notificationTaskRepository = AppDataSource.getRepository(NotificationTask);
  private userRepository = AppDataSource.getRepository(User);

  async createNotification(params: {
    title: string;
    content: string;
    type?: NotificationType;
    category?: NotificationCategory;
    recipientId: string;
    relatedType?: string;
    relatedId?: string;
    actionUrl?: string;
    priority?: number;
  }): Promise<Notification> {
    const notification = this.notificationRepository.create({
      title: params.title,
      content: params.content,
      type: params.type || 'info',
      category: params.category || 'system',
      recipientId: params.recipientId,
      relatedType: params.relatedType,
      relatedId: params.relatedId,
      actionUrl: params.actionUrl,
      priority: params.priority || 0,
    });

    return await this.notificationRepository.save(notification);
  }

  async createNotificationTask(params: {
    notificationId: string;
    assigneeId: string;
    deadline?: Date;
    parentTaskId?: string;
    escalationLevel?: number;
  }): Promise<NotificationTask> {
    const task = this.notificationTaskRepository.create({
      notificationId: params.notificationId,
      assigneeId: params.assigneeId,
      deadline: params.deadline,
      parentTaskId: params.parentTaskId,
      escalationLevel: params.escalationLevel || 0,
    });

    return await this.notificationTaskRepository.save(task);
  }

  async getNotifications(userId: string, params: {
    type?: NotificationType;
    category?: NotificationCategory;
    isRead?: boolean;
    page?: number;
    pageSize?: number;
  }): Promise<{ items: Notification[]; total: number }> {
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const queryBuilder = this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.recipientId = :userId', { userId })
      .orderBy('notification.createdAt', 'DESC')
      .skip(skip)
      .take(pageSize);

    if (params.type) {
      queryBuilder.andWhere('notification.type = :type', { type: params.type });
    }
    if (params.category) {
      queryBuilder.andWhere('notification.category = :category', { category: params.category });
    }
    if (params.isRead !== undefined) {
      queryBuilder.andWhere('notification.isRead = :isRead', { isRead: params.isRead });
    }

    const [items, total] = await queryBuilder.getManyAndCount();

    return { items, total };
  }

  async getUnreadCount(userId: string): Promise<{ total: number; urgent: number; normal: number }> {
    const notifications = await this.notificationRepository.find({
      where: { recipientId: userId, isRead: false },
    });

    const urgent = notifications.filter(n => n.type === 'urgent' || n.type === 'warning').length;
    const normal = notifications.filter(n => n.type === 'info').length;

    return {
      total: notifications.length,
      urgent,
      normal,
    };
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await this.notificationRepository.update(
      { id: notificationId, recipientId: userId },
      { isRead: true, readAt: new Date() }
    );
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.update(
      { recipientId: userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );
  }

  async sendScoreDisputeNotification(assessmentId: string, disputeReason: string, candidateName: string): Promise<void> {
    const rule = await this.escalationRuleRepository.findOne({
      where: { eventType: 'score_dispute', isActive: true },
    });

    const primaryRole = rule?.primaryRole || 'hr';
    const timeoutHours = rule?.timeoutHours || 24;

    const primaryUsers = await this.userRepository.find({
      where: { role: primaryRole as any, isActive: true },
    });

    for (const user of primaryUsers) {
      const notification = await this.createNotification({
        title: '评分争议提醒',
        content: `候选人 ${candidateName} 的测评评分存在争议：${disputeReason}，请在 ${timeoutHours} 小时内处理。`,
        type: 'warning',
        category: 'score_dispute',
        recipientId: user.id,
        relatedType: 'assessment',
        relatedId: assessmentId,
        actionUrl: `/assessments/${assessmentId}`,
        priority: 10,
      });

      const deadline = new Date();
      deadline.setHours(deadline.getHours() + timeoutHours);

      await this.createNotificationTask({
        notificationId: notification.id,
        assigneeId: user.id,
        deadline,
        escalationLevel: 0,
      });
    }
  }

  async sendInterviewScheduleNotification(
    interviewId: string,
    candidateName: string,
    interviewerName: string,
    scheduledTime: Date
  ): Promise<void> {
    const interview = await AppDataSource.getRepository('Interview').findOneBy({ id: interviewId });
    if (!interview) return;

    const interviewUsers = await this.userRepository.find({
      where: { role: 'interviewer', isActive: true, name: interviewerName },
    });

    for (const user of interviewUsers) {
      await this.createNotification({
        title: '面试安排通知',
        content: `您有一场新的面试安排：候选人 ${candidateName}，时间：${scheduledTime.toLocaleString()}`,
        type: 'info',
        category: 'interview_schedule',
        recipientId: user.id,
        relatedType: 'interview',
        relatedId: interviewId,
        actionUrl: `/interviews/${interviewId}`,
        priority: 5,
      });
    }
  }

  async sendResumeStatusNotification(
    resumeId: string,
    candidateName: string,
    newStatus: string,
    recipientId: string
  ): Promise<void> {
    const statusMap: Record<string, string> = {
      submitted: '已提交',
      screening: '筛选中',
      written_test: '笔试中',
      interview: '面试中',
      offer: '已发Offer',
      rejected: '已拒绝',
      hired: '已入职',
    };

    await this.createNotification({
      title: '简历状态更新',
      content: `候选人 ${candidateName} 的简历状态已更新为：${statusMap[newStatus] || newStatus}`,
      type: 'info',
      category: 'resume_status',
      recipientId,
      relatedType: 'resume',
      relatedId: resumeId,
      actionUrl: `/resumes/${resumeId}`,
      priority: 3,
    });
  }

  async sendDeadlineReminder(
    resumeId: string,
    candidateName: string,
    deadlineType: string,
    deadlineDate: Date
  ): Promise<void> {
    const hrUsers = await this.userRepository.find({
      where: { role: 'hr', isActive: true },
    });

    for (const hr of hrUsers) {
      await this.createNotification({
        title: '招聘截止提醒',
        content: `候选人 ${candidateName} 的${deadlineType}截止日期临近：${deadlineDate.toLocaleDateString()}，请及时处理。`,
        type: 'urgent',
        category: 'deadline_reminder',
        recipientId: hr.id,
        relatedType: 'resume',
        relatedId: resumeId,
        actionUrl: `/resumes/${resumeId}`,
        priority: 8,
      });
    }
  }

  async checkAndEscalateTasks(): Promise<void> {
    const now = new Date();
    
    const overdueTasks = await this.notificationTaskRepository
      .createQueryBuilder('task')
      .where('task.status = :status', { status: 'pending' })
      .andWhere('task.deadline < :now', { now })
      .andWhere('task.escalationLevel < :maxLevel', { maxLevel: 3 })
      .getMany();

    for (const task of overdueTasks) {
      await this.escalateTask(task.id);
    }
  }

  async escalateTask(taskId: string): Promise<void> {
    const task = await this.notificationTaskRepository.findOneBy({ id: taskId });
    if (!task) return;
    if (task.status !== 'pending') return;

    const currentAssignee = await this.userRepository.findOneBy({ id: task.assigneeId });
    if (!currentAssignee) return;

    const notification = await this.notificationRepository.findOneBy({ id: task.notificationId });
    if (!notification) return;

    const rule = await this.escalationRuleRepository.findOne({
      where: { eventType: notification.category, isActive: true },
    });

    let nextRole = rule?.escalateToRole;
    let nextTimeoutHours = 12;

    if (!nextRole) {
      if (currentAssignee.role === 'interviewer') {
        nextRole = 'hr';
      } else if (currentAssignee.role === 'hr') {
        nextRole = 'admin';
      }
    }

    if (!nextRole || nextRole === currentAssignee.role) return;

    const nextLevelUsers = await this.userRepository.find({
      where: { role: nextRole as any, isActive: true },
    });

    if (nextLevelUsers.length === 0) return;

    for (const nextUser of nextLevelUsers) {
      const escalatedNotification = await this.createNotification({
        title: `【升级】${notification.title}`,
        content: `任务已升级：原处理人 ${currentAssignee.name} 超时未处理。${notification.content}`,
        type: 'urgent',
        category: 'escalation',
        recipientId: nextUser.id,
        relatedType: notification.relatedType,
        relatedId: notification.relatedId,
        actionUrl: notification.actionUrl,
        priority: 100,
      });

      const deadline = new Date();
      deadline.setHours(deadline.getHours() + nextTimeoutHours);

      await this.createNotificationTask({
        notificationId: escalatedNotification.id,
        assigneeId: nextUser.id,
        deadline,
        parentTaskId: taskId,
        escalationLevel: task.escalationLevel + 1,
      });
    }

    task.status = 'escalated';
    await this.notificationTaskRepository.save(task);
  }

  async getEscalationRules(): Promise<EscalationRule[]> {
    return await this.escalationRuleRepository.find({ where: { isActive: true } });
  }

  async createEscalationRule(params: {
    name: string;
    eventType: string;
    timeoutHours: number;
    primaryRole: string;
    escalateToRole: string;
    description?: string;
  }): Promise<EscalationRule> {
    const rule = this.escalationRuleRepository.create(params);
    return await this.escalationRuleRepository.save(rule);
  }

  async getMyTasks(userId: string): Promise<NotificationTask[]> {
    return await this.notificationTaskRepository
      .createQueryBuilder('task')
      .where('task.assigneeId = :userId', { userId })
      .andWhere('task.status IN (:...statuses)', { statuses: ['pending', 'escalated'] })
      .orderBy('task.createdAt', 'DESC')
      .getMany();
  }

  async getNotificationTasks(notificationId: string): Promise<any[]> {
    const tasks = await this.notificationTaskRepository
      .createQueryBuilder('task')
      .where('task.notificationId = :notificationId', { notificationId })
      .orderBy('task.createdAt', 'ASC')
      .getMany();

    const result = [];
    for (const task of tasks) {
      const assignee = await this.userRepository.findOneBy({ id: task.assigneeId });
      result.push({
        ...task,
        assigneeName: assignee?.name || '未知',
        assigneeRole: assignee?.role || 'unknown',
      });
    }
    return result;
  }

  async assignTask(notificationId: string, assigneeId: string, assignedBy: string, deadlineHours?: number): Promise<NotificationTask> {
    const user = await this.userRepository.findOneBy({ id: assigneeId });
    if (!user) {
      throw new Error('指定的处理人不存在');
    }

    const notification = await this.notificationRepository.findOneBy({ id: notificationId });
    if (!notification) {
      throw new Error('通知不存在');
    }

    const deadline = new Date();
    deadline.setHours(deadline.getHours() + (deadlineHours || 24));

    const task = await this.createNotificationTask({
      notificationId,
      assigneeId,
      deadline,
      escalationLevel: 0,
    });

    notification.recipientId = assigneeId;
    await this.notificationRepository.save(notification);

    return task;
  }

  async completeTask(taskId: string, userId: string, remark?: string): Promise<void> {
    const task = await this.notificationTaskRepository.findOneBy({ id: taskId });
    if (!task) {
      throw new Error('任务不存在');
    }
    if (task.assigneeId !== userId) {
      throw new Error('无权处理此任务');
    }

    task.status = 'completed';
    task.completedAt = new Date();
    await this.notificationTaskRepository.save(task);
  }

  async manualEscalate(notificationId: string, escalatedBy: string): Promise<void> {
    const pendingTasks = await this.notificationTaskRepository
      .createQueryBuilder('task')
      .where('task.notificationId = :notificationId', { notificationId })
      .andWhere('task.status = :status', { status: 'pending' })
      .getMany();

    for (const task of pendingTasks) {
      await this.escalateTask(task.id);
    }
  }

  async getNotificationDetail(notificationId: string): Promise<any> {
    const notification = await this.notificationRepository.findOneBy({ id: notificationId });
    if (!notification) return null;

    const recipient = await this.userRepository.findOneBy({ id: notification.recipientId });
    const tasks = await this.getNotificationTasks(notificationId);

    return {
      ...notification,
      recipientName: recipient?.name || '未知',
      recipientRole: recipient?.role || 'unknown',
      tasks,
    };
  }
}

export const notificationService = new NotificationService();
