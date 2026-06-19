import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Lead, LeadDocument, LeadStatus } from '../../schemas/lead.schema';
import { Followup, FollowupDocument, FollowupStatus } from '../../schemas/followup.schema';
import { Exception, ExceptionDocument, ExceptionStatus } from '../../schemas/exception.schema';
import { CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { RedisService } from '../../shared/redis/redis.service';

interface DashboardStats {
  todayFollowups: number;
  pendingLeads: number;
  pendingExceptions: number;
}

interface TodayTask {
  id: string;
  type: 'followup' | 'lead' | 'exception';
  title: string;
  time?: Date;
  priority: string;
}

@Injectable()
export class DashboardService {
  private readonly CACHE_TTL = 300;

  constructor(
    @InjectModel(Lead.name) private leadModel: Model<LeadDocument>,
    @InjectModel(Followup.name) private followupModel: Model<FollowupDocument>,
    @InjectModel(Exception.name) private exceptionModel: Model<ExceptionDocument>,
    private redisService: RedisService,
  ) {}

  async getStats(user: CurrentUserPayload): Promise<DashboardStats> {
    const cacheKey = `dashboard:stats:${user.id}`;
    const cached = await this.redisService.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const [todayFollowups, pendingLeads, pendingExceptions] = await Promise.all([
      this.followupModel.countDocuments({
        assigneeId: new Types.ObjectId(user.id),
        status: FollowupStatus.PENDING,
        scheduledAt: { $gte: startOfDay, $lte: endOfDay },
      }).exec(),
      this.leadModel.countDocuments({
        $or: [
          { status: LeadStatus.NEW },
          { assigneeId: { $exists: false } },
          { assigneeId: null },
        ],
      }).exec(),
      this.exceptionModel.countDocuments({
        status: { $in: [ExceptionStatus.OPEN, ExceptionStatus.PROCESSING] },
      }).exec(),
    ]);

    const stats: DashboardStats = {
      todayFollowups,
      pendingLeads,
      pendingExceptions,
    };

    await this.redisService.set(cacheKey, JSON.stringify(stats), this.CACHE_TTL);

    return stats;
  }

  async getTodayTasks(user: CurrentUserPayload): Promise<TodayTask[]> {
    const cacheKey = `dashboard:today-tasks:${user.id}`;
    const cached = await this.redisService.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const followups = await this.followupModel
      .find({
        assigneeId: new Types.ObjectId(user.id),
        status: FollowupStatus.PENDING,
        scheduledAt: { $gte: startOfDay, $lte: endOfDay },
      })
      .sort({ scheduledAt: 1 })
      .limit(10)
      .exec();

    const tasks: TodayTask[] = followups.map((f) => ({
      id: f._id.toString(),
      type: 'followup',
      title: `回访 ${f.contactName} - ${f.contactPhone}`,
      time: f.scheduledAt,
      priority: 'high',
    }));

    await this.redisService.set(cacheKey, JSON.stringify(tasks), this.CACHE_TTL);

    return tasks;
  }

  async getExceptions(): Promise<Exception[]> {
    const cacheKey = 'dashboard:exceptions';
    const cached = await this.redisService.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const exceptions = await this.exceptionModel
      .find({
        status: { $in: [ExceptionStatus.OPEN, ExceptionStatus.PROCESSING] },
      })
      .sort({ createdAt: -1 })
      .limit(10)
      .exec();

    await this.redisService.set(cacheKey, JSON.stringify(exceptions), this.CACHE_TTL);

    return exceptions;
  }
}
