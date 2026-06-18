import { Injectable } from '@nestjs/common';
import { AnomaliesService } from '../anomalies/anomalies.service';
import { ReportsService } from '../reports/reports.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UsersService } from '../users/users.service';
import { AlertRulesService } from '../alert-rules/alert-rules.service';
import { Inject } from '@nestjs/common';
import { REDIS_CLIENT } from '../redis/redis.module';
import Redis from 'ioredis';

@Injectable()
export class DashboardService {
  constructor(
    private anomaliesService: AnomaliesService,
    private reportsService: ReportsService,
    private notificationsService: NotificationsService,
    private usersService: UsersService,
    private alertRulesService: AlertRulesService,
    @Inject(REDIS_CLIENT) private redis: Redis,
  ) {}

  async getOverview(user?: any) {
    const cacheKey = 'dashboard:overview';
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const [
      anomalyStats,
      pendingSummary,
      reports,
      activeRules,
      expiringUsers,
    ] = await Promise.all([
      this.anomaliesService.getStatistics(),
      this.anomaliesService.getPendingSummary(),
      this.reportsService.findAll({
        page: 1,
        pageSize: 5,
      }),
      this.alertRulesService.findAll({
        status: 'enabled',
        page: 1,
        pageSize: 100,
      }),
      this.usersService.findExpiringUsers(7),
    ]);

    const latestWeekly = await this.reportsService.getLatestPublished('weekly');
    const latestMonthly = await this.reportsService.getLatestPublished('monthly');

    const result = {
      summary: {
        totalAnomalies: anomalyStats.total,
        pendingAnomalies: anomalyStats.byStatus.pending || 0,
        processingAnomalies: anomalyStats.byStatus.processing || 0,
        resolvedRate: anomalyStats.total
          ? Number(
              ((anomalyStats.byStatus.resolved || 0) / anomalyStats.total * 100).toFixed(1),
            )
          : 0,
        todayNew: anomalyStats.todayCreated,
        criticalCount: anomalyStats.bySeverity.critical || 0,
        warningCount: anomalyStats.bySeverity.warning || 0,
        activeAlertRules: activeRules.total,
      },
      toProcess: pendingSummary,
      anomalyTrend: anomalyStats.weekTrend,
      byCategory: anomalyStats.byCategory,
      bySeverity: anomalyStats.bySeverity,
      byStatus: anomalyStats.byStatus,
      recentReports: reports.list,
      latestWeeklyReport: latestWeekly,
      latestMonthlyReport: latestMonthly,
      expiringPermissions: expiringUsers,
    };

    await this.redis.set(cacheKey, JSON.stringify(result), 'EX', 120);
    return result;
  }

  async getTodoList(userId: string) {
    const [myAnomalies, notifications] = await Promise.all([
      this.anomaliesService.findAll({
        assigneeId: userId,
        status: 'pending' as any,
        page: 1,
        pageSize: 20,
      }),
      this.notificationsService.findByUser(userId, {
        isRead: false,
        page: 1,
        pageSize: 10,
      }),
    ]);

    const processing = await this.anomaliesService.findAll({
      assigneeId: userId,
      status: 'processing' as any,
      page: 1,
      pageSize: 20,
    });

    return {
      pendingTasks: myAnomalies.list,
      inProgressTasks: processing.list,
      unreadNotifications: notifications.list,
      unreadCount: notifications.total,
    };
  }

  async getDashboardData(user?: any) {
    const [overview, todo] = await Promise.all([
      this.getOverview(user),
      user ? this.getTodoList(user.sub) : Promise.resolve(null),
    ]);

    return {
      overview,
      todo,
    };
  }

  async clearCache() {
    const keys = await this.redis.keys('dashboard:*');
    if (keys.length > 0) {
      await this.redis.del(keys);
    }
    return { cleared: keys.length };
  }
}
