import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cron } from '@nestjs/schedule';
import { Anomaly, AnomalyCategory } from './schemas/anomaly.schema';
import { AnomalyEvent } from './schemas/anomaly-event.schema';
import {
  CreateAnomalyDto,
  UpdateAnomalyDto,
  QueryAnomaliesDto,
  BatchAssignDto,
} from './dto/anomaly.dto';
import { Inject } from '@nestjs/common';
import { REDIS_CLIENT } from '../redis/redis.module';
import Redis from 'ioredis';

@Injectable()
export class AnomaliesService {
  constructor(
    @InjectModel(Anomaly.name) private anomalyModel: Model<Anomaly>,
    @InjectModel(AnomalyEvent.name) private anomalyEventModel: Model<AnomalyEvent>,
    @Inject(REDIS_CLIENT) private redis: Redis,
  ) {}

  async create(createDto: CreateAnomalyDto, operator?: any): Promise<Anomaly> {
    const anomaly = new this.anomalyModel({
      ...createDto,
      detectedAt: createDto.detectedAt ? new Date(createDto.detectedAt) : new Date(),
    });
    const saved = await anomaly.save();

    await this.createEvent(saved._id, 'created', '异常记录已创建', operator);
    await this.updateDashboardCache();

    return saved;
  }

  async findAll(query: QueryAnomaliesDto) {
    const {
      keyword,
      category,
      severity,
      status,
      assigneeId,
      datasetId,
      startDate,
      endDate,
      page = 1,
      pageSize = 20,
    } = query;

    const filter: any = {};

    if (keyword) {
      filter.$or = [
        { title: { $regex: keyword, $options: 'i' } },
        { metricName: { $regex: keyword, $options: 'i' } },
        { summary: { $regex: keyword, $options: 'i' } },
        { 'possibleCauses.description': { $regex: keyword, $options: 'i' } },
        { tags: { $in: [new RegExp(keyword, 'i')] } },
      ];
    }
    if (category) filter.category = category;
    if (severity) filter.severity = severity;
    if (status) filter.status = status;
    if (assigneeId) filter.assigneeId = new Types.ObjectId(assigneeId);
    if (datasetId) filter.datasetId = new Types.ObjectId(datasetId);

    if (startDate || endDate) {
      filter.detectedAt = {};
      if (startDate) filter.detectedAt.$gte = new Date(startDate);
      if (endDate) filter.detectedAt.$lte = new Date(endDate);
    }

    const total = await this.anomalyModel.countDocuments(filter);
    const list = await this.anomalyModel
      .find(filter)
      .sort({ severity: 1, detectedAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    return { list, total, page, pageSize };
  }

  async findOne(id: string): Promise<Anomaly> {
    const anomaly = await this.anomalyModel.findByIdAndUpdate(
      id,
      { $inc: { viewCount: 1 } },
      { new: true },
    );
    if (!anomaly) {
      throw new NotFoundException('异常记录不存在');
    }
    return anomaly;
  }

  async update(
    id: string,
    updateDto: UpdateAnomalyDto,
    operator?: any,
  ): Promise<Anomaly> {
    const existing = await this.anomalyModel.findById(id);
    if (!existing) {
      throw new NotFoundException('异常记录不存在');
    }

    const beforeData = existing.toObject();

    const updateData: any = { ...updateDto };

    if (updateDto.assigneeId) {
      const assignee = await this.getUserInfo(updateDto.assigneeId);
      updateData.assigneeName = assignee?.name;
    }

    if (updateDto.status === 'resolved' && !existing.resolvedAt) {
      updateData.resolvedAt = new Date();
      if (operator) {
        updateData.resolvedById = new Types.ObjectId(operator.sub);
        updateData.resolvedByName = operator.name;
      }
    }

    const updated = await this.anomalyModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true },
    );

    const changes = this.detectChanges(beforeData, updated.toObject());
    if (changes.length > 0) {
      await this.createEvent(
        id,
        'updated',
        `更新了: ${changes.join(', ')}`,
        operator,
        beforeData,
        updateData,
      );
    }

    await this.updateDashboardCache();
    return updated;
  }

  async batchAssign(batchDto: BatchAssignDto, operator?: any) {
    const { ids, assigneeId } = batchDto;
    const assignee = await this.getUserInfo(assigneeId);

    const result = await this.anomalyModel.updateMany(
      { _id: { $in: ids.map((id) => new Types.ObjectId(id)) } },
      {
        assigneeId: new Types.ObjectId(assigneeId),
        assigneeName: assignee?.name,
        status: 'processing',
      },
    );

    for (const id of ids) {
      await this.createEvent(
        id,
        'assigned',
        `分配给 ${assignee?.name || '未知用户'} 处理`,
        operator,
      );
    }

    await this.updateDashboardCache();
    return { modifiedCount: result.modifiedCount };
  }

  async remove(id: string, operator?: any): Promise<void> {
    const anomaly = await this.anomalyModel.findByIdAndDelete(id);
    if (!anomaly) {
      throw new NotFoundException('异常记录不存在');
    }
    await this.anomalyEventModel.deleteMany({ anomalyId: id });
    await this.updateDashboardCache();
  }

  async getEvents(anomalyId: string) {
    return this.anomalyEventModel
      .find({ anomalyId: new Types.ObjectId(anomalyId) })
      .sort({ createdAt: -1 })
      .limit(100);
  }

  async getStatistics() {
    const cacheKey = 'anomaly:statistics';
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [totalByStatus, totalBySeverity, totalByCategory, recentTrend, recentCreated] =
      await Promise.all([
        this.anomalyModel.aggregate([
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
        this.anomalyModel.aggregate([
          { $group: { _id: '$severity', count: { $sum: 1 } } },
        ]),
        this.anomalyModel.aggregate([
          { $group: { _id: '$category', count: { $sum: 1 } } },
        ]),
        this.anomalyModel.aggregate([
          { $match: { detectedAt: { $gte: weekAgo } } },
          {
            $group: {
              _id: {
                year: { $year: '$detectedAt' },
                month: { $month: '$detectedAt' },
                day: { $dayOfMonth: '$detectedAt' },
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
        ]),
        this.anomalyModel.countDocuments({ detectedAt: { $gte: today } }),
      ]);

    const result = {
      total: totalByStatus.reduce((s, i) => s + i.count, 0),
      byStatus: Object.fromEntries(totalByStatus.map((i) => [i._id, i.count])),
      bySeverity: Object.fromEntries(totalBySeverity.map((i) => [i._id, i.count])),
      byCategory: Object.fromEntries(totalByCategory.map((i) => [i._id, i.count])),
      todayCreated: recentCreated,
      weekTrend: recentTrend.map((item) => ({
        date: `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`,
        count: item.count,
      })),
    };

    await this.redis.set(cacheKey, JSON.stringify(result), 'EX', 300);
    return result;
  }

  async getPendingSummary() {
    const pending = await this.anomalyModel
      .find({ status: { $in: ['pending', 'processing'] } })
      .sort({ severity: 1, detectedAt: -1 })
      .limit(10);

    const stats = await this.getStatistics();

    return {
      toProcess: pending,
      statistics: {
        pending: stats.byStatus.pending || 0,
        processing: stats.byStatus.processing || 0,
        critical: stats.bySeverity.critical || 0,
        warning: stats.bySeverity.warning || 0,
        todayCreated: stats.todayCreated,
      },
    };
  }

  async getTrendData(id: string) {
    const anomaly = await this.anomalyModel.findById(id);
    if (!anomaly) {
      throw new NotFoundException('异常记录不存在');
    }
    return anomaly.trendData || [];
  }

  private async createEvent(
    anomalyId: string | Types.ObjectId,
    eventType: string,
    description: string,
    operator?: any,
    before?: any,
    after?: any,
  ) {
    const event = new this.anomalyEventModel({
      anomalyId: typeof anomalyId === 'string' ? new Types.ObjectId(anomalyId) : anomalyId,
      eventType,
      description,
      before,
      after,
      operatorId: operator?.sub ? new Types.ObjectId(operator.sub) : null,
      operatorName: operator?.name || '系统',
    });
    await event.save();
  }

  private detectChanges(before: any, after: any): string[] {
    const changes: string[] = [];
    const fields = ['status', 'severity', 'assigneeId', 'summary', 'resolvedCause'];
    const fieldNames: Record<string, string> = {
      status: '状态',
      severity: '严重程度',
      assigneeId: '处理人',
      summary: '摘要',
      resolvedCause: '解决原因',
    };
    for (const field of fields) {
      if (before[field] !== after[field]) {
        changes.push(fieldNames[field] || field);
      }
    }
    return changes;
  }

  private async getUserInfo(userId: string) {
    try {
      const UserModel = this.anomalyModel.db.collection('users');
      const user = await UserModel.findOne({ _id: new Types.ObjectId(userId) });
      return user;
    } catch {
      return null;
    }
  }

  private async updateDashboardCache() {
    await this.redis.del('anomaly:statistics');
  }

  async initMockData() {
    const count = await this.anomalyModel.countDocuments();
    if (count > 0) return;

    const categories: AnomalyCategory[] = [
      'user_growth',
      'retention',
      'conversion',
      'activation',
      'revenue',
    ];
    const severities = ['critical', 'warning', 'info'] as const;
    const statuses = ['pending', 'processing', 'resolved', 'ignored'] as const;
    const titles = [
      '日新增用户数骤降 30%',
      '7日留存率低于预期',
      '付费转化率异常波动',
      '新用户激活率下降',
      'ARPU 值出现异常峰值',
      '渠道 A 注册量异常',
      '首屏加载时长超标',
      '推送点击率下滑',
      '次日留存率异常走低',
      '订单量突然激增',
    ];
    const metrics = [
      'daily_new_users',
      'retention_7d',
      'pay_conversion_rate',
      'activation_rate',
      'arpu',
      'channel_registrations',
      'page_load_time',
      'push_ctr',
      'retention_1d',
      'order_count',
    ];

    const mockData: any[] = [];
    for (let i = 0; i < 25; i++) {
      const category = categories[Math.floor(Math.random() * categories.length)];
      const severity = severities[Math.floor(Math.random() * (i < 8 ? 2 : 3))];
      const status = statuses[Math.floor(Math.random() * (i < 12 ? 2 : 4))];
      const currentValue = Math.random() * 1000 + 100;
      const expectedValue = currentValue * (0.7 + Math.random() * 0.6);

      const trendData = [];
      const now = Date.now();
      for (let d = 14; d >= 0; d--) {
        const ts = new Date(now - d * 24 * 60 * 60 * 1000);
        const val = expectedValue * (0.8 + Math.random() * 0.4) + (d < 3 ? (3 - d) * currentValue * 0.05 : 0);
        trendData.push({
          timestamp: ts,
          value: Math.round(val),
          expected: Math.round(expectedValue),
          deviation: Number((((val - expectedValue) / expectedValue) * 100).toFixed(2)),
        });
      }

      const possibleCauses = [
        {
          type: '活动影响',
          description: '近期运营活动结束导致流量回落',
          confidence: 0.72,
          evidence: '活动结束时间与异常时间点吻合',
        },
        {
          type: '渠道变化',
          description: '主渠道投放策略调整',
          confidence: 0.58,
          evidence: '渠道 A 占比下降 15%',
        },
        {
          type: '技术故障',
          description: '注册接口异常率上升',
          confidence: 0.34,
          evidence: '接口 5xx 错误率增加 2.3%',
        },
      ];

      mockData.push({
        title: titles[i % titles.length] + (i >= titles.length ? ` (${Math.floor(i / titles.length) + 1})` : ''),
        category,
        metricName: metrics[i % metrics.length],
        severity,
        status,
        currentValue: Math.round(currentValue),
        expectedValue: Math.round(expectedValue),
        deviationPercent: Number((((currentValue - expectedValue) / expectedValue) * 100).toFixed(2)),
        detectedAt: new Date(now - i * 6 * 60 * 60 * 1000 - Math.random() * 3600000),
        trendData,
        possibleCauses: possibleCauses.slice(0, Math.floor(Math.random() * 3) + 1),
        summary: status === 'resolved' ? '已确认是活动影响，后续调整投放策略' : undefined,
        resolvedCause: status === 'resolved' ? '活动结束自然回落，已同步运营调整策略' : undefined,
        tags: [category, severity],
        commentCount: Math.floor(Math.random() * 5),
      });
    }

    await this.anomalyModel.insertMany(mockData);
    console.log('✅ 异常监控模拟数据初始化完成');
  }
}
