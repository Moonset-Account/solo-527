import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AlertRule } from './schemas/alert-rule.schema';
import {
  CreateAlertRuleDto,
  UpdateAlertRuleDto,
  QueryAlertRulesDto,
} from './dto/alert-rule.dto';

@Injectable()
export class AlertRulesService {
  constructor(
    @InjectModel(AlertRule.name) private alertRuleModel: Model<AlertRule>,
  ) {}

  async create(
    createDto: CreateAlertRuleDto,
    operator?: any,
  ): Promise<AlertRule> {
    const rule = new this.alertRuleModel({
      ...createDto,
      datasetId: new Types.ObjectId(createDto.datasetId),
      notifyUserIds: createDto.notifyUserIds?.map((id) => new Types.ObjectId(id)) || [],
      createdById: operator?.sub ? new Types.ObjectId(operator.sub) : null,
      createdByName: operator?.name || '系统',
    });
    return rule.save();
  }

  async findAll(query: QueryAlertRulesDto) {
    const { keyword, datasetId, status, page = 1, pageSize = 20 } = query;
    const filter: any = {};

    if (keyword) {
      filter.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
        { metricName: { $regex: keyword, $options: 'i' } },
      ];
    }
    if (datasetId) filter.datasetId = new Types.ObjectId(datasetId);
    if (status) filter.status = status;

    const total = await this.alertRuleModel.countDocuments(filter);
    const list = await this.alertRuleModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    return { list, total, page, pageSize };
  }

  async findOne(id: string): Promise<AlertRule> {
    const rule = await this.alertRuleModel.findById(id);
    if (!rule) {
      throw new NotFoundException('告警规则不存在');
    }
    return rule;
  }

  async update(
    id: string, updateDto: UpdateAlertRuleDto): Promise<AlertRule> {
    const updateData: any = { ...updateDto };
    if (updateDto.notifyUserIds) {
      updateData.notifyUserIds = updateDto.notifyUserIds.map((id) => new Types.ObjectId(id));
    }

    const rule = await this.alertRuleModel.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
    if (!rule) {
      throw new NotFoundException('告警规则不存在');
    }
    return rule;
  }

  async toggleStatus(id: string): Promise<AlertRule> {
    const rule = await this.alertRuleModel.findById(id);
    if (!rule) {
      throw new NotFoundException('告警规则不存在');
    }
    rule.status = rule.status === 'enabled' ? 'disabled' : 'enabled';
    return rule.save();
  }

  async remove(id: string): Promise<void> {
    const rule = await this.alertRuleModel.findByIdAndDelete(id);
    if (!rule) {
      throw new NotFoundException('告警规则不存在');
    }
  }

  async findEnabledRules(): Promise<AlertRule[]> {
    return this.alertRuleModel.find({ status: 'enabled' });
  }

  async updateTriggerInfo(id: string) {
    await this.alertRuleModel.findByIdAndUpdate(id, {
      $inc: { triggerCount: 1 },
      $set: { lastTriggeredAt: new Date() },
    });
  }

  async initMockData() {
    const count = await this.alertRuleModel.countDocuments();
    if (count > 0) return;

    const mockRules = [
      {
        name: '日新增用户低于阈值告警',
        description: '当日新增用户数低于 800 时触发告警',
        datasetId: new Types.ObjectId(),
        metricName: 'daily_new_users',
        conditions: [
          { field: 'value', operator: 'lt', value: 800 },
        ],
        conditionLogic: 'all',
        notifyChannels: ['email', 'wechat'],
        checkIntervalMinutes: 60,
        suppressMinutes: 120,
        status: 'enabled',
        triggerCount: 5,
        lastTriggeredAt: new Date(Date.now() - 86400000),
      },
      {
        name: '7日留存率下降告警',
        description: '7日留存率较上周下降超过 10% 触发',
        datasetId: new Types.ObjectId(),
        metricName: 'retention_7d',
        conditions: [
          { field: 'value', operator: 'lt', value: 0.35 },
          { field: 'changePercent', operator: 'lt', value: -10 },
        ],
        conditionLogic: 'all',
        notifyChannels: ['email'],
        checkIntervalMinutes: 360,
        suppressMinutes: 360,
        status: 'enabled',
        triggerCount: 3,
      },
      {
        name: '付费转化率异常告警',
        description: '付费转化率低于 2% 时告警',
        datasetId: new Types.ObjectId(),
        metricName: 'pay_conversion_rate',
        conditions: [
          { field: 'value', operator: 'lt', value: 0.02 },
        ],
        notifyChannels: ['email', 'sms'],
        checkIntervalMinutes: 120,
        suppressMinutes: 240,
        status: 'enabled',
        triggerCount: 0,
      },
      {
        name: 'ARPU 异常波动',
        description: 'ARPU 日波动超过 20% 告警',
        datasetId: new Types.ObjectId(),
        metricName: 'arpu',
        conditions: [
          { field: 'changePercent', operator: 'gt', value: 20 },
        ],
        notifyChannels: ['email'],
        checkIntervalMinutes: 60,
        suppressMinutes: 180,
        status: 'disabled',
        triggerCount: 2,
      },
      {
        name: '首屏加载时长告警',
        description: '首屏加载超过 3 秒告警',
        datasetId: new Types.ObjectId(),
        metricName: 'page_load_time',
        conditions: [
          { field: 'avg', operator: 'gt', value: 3000 },
        ],
        notifyChannels: ['email', 'webhook'],
        webhookUrl: 'https://hooks.example.com/alert',
        checkIntervalMinutes: 30,
        suppressMinutes: 60,
        status: 'enabled',
        triggerCount: 8,
        lastTriggeredAt: new Date(Date.now() - 3600000),
      },
      {
        name: '推送点击率下滑告警',
        description: '推送点击率低于 5% 时告警',
        datasetId: new Types.ObjectId(),
        metricName: 'push_ctr',
        conditions: [
          { field: 'value', operator: 'lt', value: 0.05 },
        ],
        notifyChannels: ['email'],
        checkIntervalMinutes: 180,
        suppressMinutes: 360,
        status: 'enabled',
        triggerCount: 1,
      },
    ];

    await this.alertRuleModel.insertMany(mockRules);
    console.log('✅ 告警规则模拟数据初始化完成');
  }
}
