import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from './modules/users/user.schema.js';
import { Lead, LeadDocument } from './modules/leads/lead.schema.js';
import { Followup, FollowupDocument } from './modules/followups/followup.schema.js';
import { FollowupRule, FollowupRuleDocument } from './modules/followups/followup-rule.schema.js';
import { Prediction, PredictionDocument } from './modules/predictions/prediction.schema.js';
import { ChurnRecord, ChurnRecordDocument } from './modules/churn/churn-record.schema.js';
import { Tag, TagDocument } from './modules/tags/tag.schema.js';
import { Contract, ContractDocument } from './modules/reports/contract.schema.js';
import { Dict, DictDocument } from './modules/settings/dict.schema.js';
import { ReminderTemplate, ReminderTemplateDocument } from './modules/settings/reminder-template.schema.js';
import { ScopeConfig, ScopeConfigDocument } from './modules/settings/scope-config.schema.js';

@Injectable()
export class SeedService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Lead.name) private leadModel: Model<LeadDocument>,
    @InjectModel(Followup.name) private followupModel: Model<FollowupDocument>,
    @InjectModel(FollowupRule.name) private followupRuleModel: Model<FollowupRuleDocument>,
    @InjectModel(Prediction.name) private predictionModel: Model<PredictionDocument>,
    @InjectModel(ChurnRecord.name) private churnModel: Model<ChurnRecordDocument>,
    @InjectModel(Tag.name) private tagModel: Model<TagDocument>,
    @InjectModel(Contract.name) private contractModel: Model<ContractDocument>,
    @InjectModel(Dict.name) private dictModel: Model<DictDocument>,
    @InjectModel(ReminderTemplate.name) private reminderModel: Model<ReminderTemplateDocument>,
    @InjectModel(ScopeConfig.name) private scopeModel: Model<ScopeConfigDocument>,
  ) {}

  async seed() {
    const userCount = await this.userModel.countDocuments();
    if (userCount > 0) return;

    console.log('开始初始化种子数据...');

    await this.seedUsers();
    await this.seedDicts();
    await this.seedTags();
    await this.seedFollowupRules();
    await this.seedReminderTemplates();
    await this.seedScopeConfigs();
    const leadIds = await this.seedLeads();
    await this.seedFollowups(leadIds);
    await this.seedPredictions(leadIds);
    await this.seedChurnRecords(leadIds);
    await this.seedContracts(leadIds);

    console.log('种子数据初始化完成！');
  }

  private async seedUsers() {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const users = [
      { username: 'admin', password: hashedPassword, name: '系统管理员', role: 'admin', department: '管理层', permissions: ['all'] },
      { username: 'zhangwei', password: hashedPassword, name: '张伟', role: 'manager', department: '销售一部', permissions: ['leads:read', 'leads:write', 'followups:read', 'followups:write', 'reports:read'] },
      { username: 'liuna', password: hashedPassword, name: '刘娜', role: 'manager', department: '销售二部', permissions: ['leads:read', 'leads:write', 'followups:read', 'followups:write', 'reports:read'] },
      { username: 'wangqiang', password: hashedPassword, name: '王强', role: 'consultant', department: '销售一部', permissions: ['leads:read', 'leads:write', 'followups:read', 'followups:write'] },
      { username: 'chenli', password: hashedPassword, name: '陈丽', role: 'consultant', department: '销售一部', permissions: ['leads:read', 'leads:write', 'followups:read', 'followups:write'] },
      { username: 'zhaoming', password: hashedPassword, name: '赵明', role: 'consultant', department: '销售二部', permissions: ['leads:read', 'leads:write', 'followups:read', 'followups:write'] },
      { username: 'sunyan', password: hashedPassword, name: '孙燕', role: 'operator', department: '客服部', permissions: ['leads:read', 'followups:read'] },
    ];
    await this.userModel.insertMany(users);
  }

  private async seedDicts() {
    const dicts = [
      { category: 'lead_source', key: 'online_form', label: '线上表单', sort: 1 },
      { category: 'lead_source', key: 'referral', label: '转介绍', sort: 2 },
      { category: 'lead_source', key: 'exhibition', label: '展会', sort: 3 },
      { category: 'lead_source', key: 'phone_consult', label: '电话咨询', sort: 4 },
      { category: 'lead_source', key: 'old_customer', label: '老客户推荐', sort: 5 },
      { category: 'decoration_style', key: 'modern_simple', label: '现代简约', sort: 1 },
      { category: 'decoration_style', key: 'nordic', label: '北欧', sort: 2 },
      { category: 'decoration_style', key: 'chinese', label: '中式', sort: 3 },
      { category: 'decoration_style', key: 'american', label: '美式', sort: 4 },
      { category: 'decoration_style', key: 'luxury', label: '轻奢', sort: 5 },
      { category: 'churn_reason', key: 'price_mismatch', label: '价格不符', sort: 1 },
      { category: 'churn_reason', key: 'schedule_conflict', label: '工期冲突', sort: 2 },
      { category: 'churn_reason', key: 'competitor_signed', label: '竞品签约', sort: 3 },
      { category: 'churn_reason', key: 'no_demand', label: '暂无需求', sort: 4 },
      { category: 'churn_reason', key: 'other', label: '其他', sort: 5 },
      { category: 'lead_status', key: 'new', label: '新线索', sort: 1 },
      { category: 'lead_status', key: 'contacted', label: '已联系', sort: 2 },
      { category: 'lead_status', key: 'measured', label: '已量房', sort: 3 },
      { category: 'lead_status', key: 'quoted', label: '已报价', sort: 4 },
      { category: 'lead_status', key: 'contracted', label: '已签约', sort: 5 },
      { category: 'lead_status', key: 'lost', label: '已流失', sort: 6 },
    ];
    await this.dictModel.insertMany(dicts);
  }

  private async seedTags() {
    const tags = [
      { name: '高意向', group: '意向度', color: '#f5222d', enabled: true },
      { name: '中意向', group: '意向度', color: '#fa8c16', enabled: true },
      { name: '低意向', group: '意向度', color: '#52c41a', enabled: true },
      { name: 'VIP客户', group: '客户类型', color: '#722ed1', enabled: true },
      { name: '复购客户', group: '客户类型', color: '#eb2f96', enabled: true },
      { name: '急装', group: '紧急度', color: '#f5222d', enabled: true },
      { name: '待跟进', group: '紧急度', color: '#faad14', enabled: true },
      { name: '大户型', group: '房型', color: '#1890ff', enabled: true },
      { name: '小户型', group: '房型', color: '#13c2c2', enabled: true },
      { name: '学区房', group: '房型', color: '#52c41a', enabled: true },
    ];
    await this.tagModel.insertMany(tags);
  }

  private async seedFollowupRules() {
    const rules = [
      {
        name: '新线索24小时内回访',
        triggerCondition: { event: 'lead_created', params: {} },
        action: { remindHours: 24, remindMethod: ['system', 'sms'], remindTarget: ['assignedTo'] },
        scope: { departments: [], roles: ['consultant', 'manager'], leadSources: [] },
        priority: 1,
        enabled: true,
      },
      {
        name: '已联系3天内安排量房',
        triggerCondition: { event: 'lead_contacted', params: {} },
        action: { remindHours: 72, remindMethod: ['system'], remindTarget: ['assignedTo'] },
        scope: { departments: [], roles: ['consultant'], leadSources: [] },
        priority: 2,
        enabled: true,
      },
      {
        name: '量房后5天内报价',
        triggerCondition: { event: 'lead_measured', params: {} },
        action: { remindHours: 120, remindMethod: ['system', 'wechat'], remindTarget: ['assignedTo', 'manager'] },
        scope: { departments: [], roles: ['consultant', 'manager'], leadSources: [] },
        priority: 3,
        enabled: true,
      },
      {
        name: '报价后7天内促签',
        triggerCondition: { event: 'lead_quoted', params: {} },
        action: { remindHours: 168, remindMethod: ['system', 'sms'], remindTarget: ['assignedTo', 'manager'] },
        scope: { departments: [], roles: ['consultant', 'manager'], leadSources: [] },
        priority: 4,
        enabled: true,
      },
      {
        name: '展会线索优先跟进',
        triggerCondition: { event: 'lead_created', params: { source: '展会' } },
        action: { remindHours: 4, remindMethod: ['system', 'sms', 'wechat'], remindTarget: ['assignedTo', 'manager'] },
        scope: { departments: [], roles: ['consultant', 'manager'], leadSources: ['展会'] },
        priority: 0,
        enabled: true,
      },
    ];
    await this.followupRuleModel.insertMany(rules);
  }

  private async seedReminderTemplates() {
    const templates = [
      { name: '新线索提醒', type: 'lead_created', channels: ['system', 'sms'], template: '您有一条新的装修线索待跟进：{customerName}，电话：{phone}，来源：{source}。请在24小时内联系客户。', scope: { departments: [], roles: ['consultant'] }, enabled: true },
      { name: '回访到期提醒', type: 'followup_due', channels: ['system', 'wechat'], template: '您有一条回访即将到期：客户{customerName}的{type}回访，计划时间{scheduledAt}，请及时跟进。', scope: { departments: [], roles: ['consultant'] }, enabled: true },
      { name: '签约催促提醒', type: 'contract_urge', channels: ['system', 'sms'], template: '客户{customerName}已报价{days}天，请尽快推动签约。', scope: { departments: [], roles: ['consultant', 'manager'] }, enabled: true },
      { name: '流失预警提醒', type: 'churn_warning', channels: ['system', 'sms', 'wechat'], template: '预警：客户{customerName}已有{days}天未跟进，存在流失风险，请立即处理。', scope: { departments: [], roles: ['manager'] }, enabled: true },
    ];
    await this.reminderModel.insertMany(templates);
  }

  private async seedScopeConfigs() {
    const scopes = [
      { name: '部门配置', type: 'department', values: ['销售一部', '销售二部', '设计部', '客服部', '管理层'] },
      { name: '角色配置', type: 'role', values: ['admin', 'manager', 'consultant', 'operator'] },
      { name: '来源配置', type: 'source', values: ['线上表单', '转介绍', '展会', '电话咨询', '老客户推荐'] },
    ];
    await this.scopeModel.insertMany(scopes);
  }

  private async seedLeads(): Promise<Types.ObjectId[]> {
    const users = await this.userModel.find().lean();
    const consultants = users.filter((u) => u.role === 'consultant' || u.role === 'manager');

    const leadsData = [
      { customerName: '李建国', phone: '13812345678', source: '线上表单', status: 'contracted', decorationDemand: { houseType: '三室两厅', area: 128, budgetRange: '20-30万', style: '现代简约', expectedStartDate: '2026-03-01' }, tags: ['高意向', 'VIP客户', '大户型'] },
      { customerName: '王芳', phone: '13698765432', source: '转介绍', status: 'quoted', decorationDemand: { houseType: '两室一厅', area: 89, budgetRange: '10-15万', style: '北欧', expectedStartDate: '2026-04-15' }, tags: ['高意向', '急装'] },
      { customerName: '张晓东', phone: '15012348765', source: '展会', status: 'measured', decorationDemand: { houseType: '四室两厅', area: 168, budgetRange: '30-50万', style: '轻奢', expectedStartDate: '2026-05-01' }, tags: ['高意向', 'VIP客户', '大户型'] },
      { customerName: '陈静', phone: '18765432109', source: '电话咨询', status: 'contacted', decorationDemand: { houseType: '一室一厅', area: 55, budgetRange: '5-8万', style: '现代简约', expectedStartDate: '2026-06-01' }, tags: ['中意向', '小户型'] },
      { customerName: '赵鹏飞', phone: '13987654321', source: '老客户推荐', status: 'contracted', decorationDemand: { houseType: '三室两厅', area: 115, budgetRange: '18-25万', style: '中式', expectedStartDate: '2026-02-15' }, tags: ['高意向', '复购客户'] },
      { customerName: '刘美玲', phone: '15234567890', source: '线上表单', status: 'new', decorationDemand: { houseType: '两室两厅', area: 95, budgetRange: '12-18万', style: '北欧', expectedStartDate: '2026-07-01' }, tags: ['待跟进'] },
      { customerName: '黄志强', phone: '18678901234', source: '展会', status: 'quoted', decorationDemand: { houseType: '三室一厅', area: 105, budgetRange: '15-22万', style: '美式', expectedStartDate: '2026-04-01' }, tags: ['中意向', '急装'] },
      { customerName: '周婷', phone: '13701234567', source: '转介绍', status: 'measured', decorationDemand: { houseType: '两室一厅', area: 78, budgetRange: '8-12万', style: '现代简约', expectedStartDate: '2026-05-15' }, tags: ['中意向', '学区房'] },
      { customerName: '吴大海', phone: '15890123456', source: '电话咨询', status: 'lost', decorationDemand: { houseType: '四室两厅', area: 155, budgetRange: '35-45万', style: '轻奢', expectedStartDate: '2026-03-01' }, tags: ['低意向'] },
      { customerName: '孙丽华', phone: '13567890123', source: '线上表单', status: 'contacted', decorationDemand: { houseType: '一室一厅', area: 48, budgetRange: '4-6万', style: '现代简约', expectedStartDate: '2026-08-01' }, tags: ['低意向', '小户型'] },
      { customerName: '马超', phone: '18901234567', source: '展会', status: 'new', decorationDemand: { houseType: '三室两厅', area: 132, budgetRange: '22-30万', style: '中式', expectedStartDate: '2026-06-15' }, tags: ['待跟进', '大户型'] },
      { customerName: '林小红', phone: '13654321098', source: '老客户推荐', status: 'contracted', decorationDemand: { houseType: '两室两厅', area: 92, budgetRange: '12-16万', style: '北欧', expectedStartDate: '2026-01-15' }, tags: ['高意向', '复购客户'] },
      { customerName: '杨志远', phone: '15123456789', source: '线上表单', status: 'quoted', decorationDemand: { houseType: '三室两厅', area: 118, budgetRange: '20-28万', style: '轻奢', expectedStartDate: '2026-04-01' }, tags: ['高意向'] },
      { customerName: '何秀英', phone: '18789012345', source: '转介绍', status: 'measured', decorationDemand: { houseType: '两室一厅', area: 72, budgetRange: '8-12万', style: '现代简约', expectedStartDate: '2026-05-01' }, tags: ['中意向', '学区房'] },
      { customerName: '郑伟', phone: '13945678901', source: '电话咨询', status: 'lost', decorationDemand: { houseType: '三室一厅', area: 108, budgetRange: '15-20万', style: '美式', expectedStartDate: '2026-03-15' }, tags: ['低意向'] },
      { customerName: '谢敏', phone: '15678901234', source: '展会', status: 'contacted', decorationDemand: { houseType: '四室两厅', area: 175, budgetRange: '40-60万', style: '轻奢', expectedStartDate: '2026-07-01' }, tags: ['高意向', 'VIP客户', '大户型'] },
      { customerName: '罗军', phone: '13890123456', source: '线上表单', status: 'new', decorationDemand: { houseType: '一室一厅', area: 52, budgetRange: '5-7万', style: '北欧', expectedStartDate: '2026-09-01' }, tags: ['待跟进', '小户型'] },
      { customerName: '蒋雪梅', phone: '13512345678', source: '老客户推荐', status: 'measured', decorationDemand: { houseType: '三室两厅', area: 125, budgetRange: '18-25万', style: '现代简约', expectedStartDate: '2026-04-15' }, tags: ['中意向', '复购客户'] },
      { customerName: '韩磊', phone: '18723456789', source: '转介绍', status: 'quoted', decorationDemand: { houseType: '两室两厅', area: 98, budgetRange: '13-18万', style: '中式', expectedStartDate: '2026-05-15' }, tags: ['中意向'] },
      { customerName: '唐艳', phone: '15134567890', source: '电话咨询', status: 'contacted', decorationDemand: { houseType: '三室一厅', area: 102, budgetRange: '15-22万', style: '美式', expectedStartDate: '2026-06-01' }, tags: ['低意向'] },
      { customerName: '曹明辉', phone: '13956789012', source: '展会', status: 'contracted', decorationDemand: { houseType: '四室两厅', area: 162, budgetRange: '38-50万', style: '轻奢', expectedStartDate: '2026-02-01' }, tags: ['高意向', 'VIP客户', '大户型'] },
      { customerName: '许婷婷', phone: '15689012345', source: '线上表单', status: 'lost', decorationDemand: { houseType: '两室一厅', area: 68, budgetRange: '6-10万', style: '现代简约', expectedStartDate: '2026-03-01' }, tags: ['低意向', '学区房'] },
      { customerName: '邓超', phone: '18301234567', source: '老客户推荐', status: 'new', decorationDemand: { houseType: '三室两厅', area: 135, budgetRange: '25-35万', style: '中式', expectedStartDate: '2026-08-01' }, tags: ['高意向', '待跟进'] },
    ];

    const leads = [];
    for (const data of leadsData) {
      const assignee = consultants[Math.floor(Math.random() * consultants.length)];
      const lead = new this.leadModel({
        ...data,
        assignedTo: assignee._id,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000),
      });
      leads.push(await lead.save());
    }

    return leads.map((l) => l._id as Types.ObjectId);
  }

  private async seedFollowups(leadIds: Types.ObjectId[]) {
    const users = await this.userModel.find({ role: { $in: ['consultant', 'manager'] } }).lean();
    const followupsData: any[] = [];
    const types = ['phone', 'wechat', 'visit'];
    const results = [
      '客户表示有意向，需进一步沟通方案',
      '客户需要和家人商量，约好下周再联系',
      '客户确认量房时间',
      '客户对设计方案满意，待报价',
      '客户觉得报价偏高，需要调整方案',
      '客户已确认签约意向',
      '客户暂无装修计划，留待后续跟进',
      '客户对风格有明确要求，需设计师介入',
      '客户预算有限，推荐基础套餐',
      '客户反馈竞品报价更低，需提供差异化方案',
    ];

    for (const leadId of leadIds) {
      const count = Math.floor(Math.random() * 4) + 1;
      for (let i = 0; i < count; i++) {
        const user = users[Math.floor(Math.random() * users.length)];
        const scheduledAt = new Date(Date.now() - (30 - i * 7) * 24 * 60 * 60 * 1000);
        const isCompleted = Math.random() > 0.2;

        followupsData.push({
          leadId,
          type: types[Math.floor(Math.random() * types.length)],
          scheduledAt,
          completedAt: isCompleted ? new Date(scheduledAt.getTime() + Math.random() * 24 * 60 * 60 * 1000) : undefined,
          result: isCompleted ? results[Math.floor(Math.random() * results.length)] : undefined,
          nextFollowupAt: i < count - 1
            ? new Date(scheduledAt.getTime() + (3 + Math.floor(Math.random() * 5)) * 24 * 60 * 60 * 1000)
            : undefined,
          createdBy: user._id,
        });
      }
    }

    await this.followupModel.insertMany(followupsData);
  }

  private async seedPredictions(leadIds: Types.ObjectId[]) {
    const leads = await this.leadModel.find({ _id: { $in: leadIds } }).lean();
    const predictionsData: any[] = [];

    for (const lead of leads) {
      const statusScoreMap: Record<string, number> = {
        new: 20, contacted: 40, measured: 60, quoted: 75, contracted: 95, lost: 0,
      };

      const statusFactor = statusScoreMap[lead.status] ?? 30;
      const factors = [
        { name: '线索状态', weight: 0.4, value: statusFactor },
        { name: '回访频率', weight: 0.25, value: Math.min(Math.floor(Math.random() * 40), 30) },
        { name: '需求匹配', weight: 0.2, value: Math.min(Math.floor(Math.random() * 30), 20) },
        { name: '时效性', weight: 0.15, value: Math.max(0, 20 - Math.floor(Math.random() * 30)) },
      ];

      const score = Math.round(factors.reduce((sum, f) => sum + f.value * f.weight, 0));
      let riskLevel = 'low';
      if (score < 30 || lead.status === 'lost') riskLevel = 'high';
      else if (score < 55) riskLevel = 'medium';

      predictionsData.push({ leadId: lead._id, score, factors, riskLevel });
    }

    await this.predictionModel.insertMany(predictionsData);
  }

  private async seedChurnRecords(leadIds: Types.ObjectId[]) {
    const leads = await this.leadModel.find({ _id: { $in: leadIds }, status: 'lost' }).lean();
    const reasons = ['价格不符', '工期冲突', '竞品签约', '暂无需求', '其他'];
    const details = [
      '客户预算与报价差距较大，无法达成一致',
      '客户装修时间与公司排期冲突',
      '客户已与竞品公司签订合同',
      '客户暂时搁置装修计划',
      '客户个人原因暂时放弃装修',
    ];

    const churnData = leads.map((lead, idx) => ({
      leadId: lead._id,
      reason: reasons[idx % reasons.length],
      detail: details[idx % details.length],
      churnedAt: new Date(lead.updatedAt || Date.now()),
      canRecall: Math.random() > 0.5,
    }));

    if (churnData.length > 0) {
      await this.churnModel.insertMany(churnData);
    }
  }

  private async seedContracts(leadIds: Types.ObjectId[]) {
    const leads = await this.leadModel.find({ _id: { $in: leadIds } }).lean();
    const users = await this.userModel.find({ role: { $in: ['consultant', 'manager'] } }).lean();
    const contractsData: any[] = [];

    for (const lead of leads) {
      if (lead.status === 'contracted') {
        contractsData.push({
          leadId: lead._id,
          status: 'signed',
          processingHours: Math.floor(Math.random() * 200) + 50,
          responsiblePerson: users[Math.floor(Math.random() * users.length)].name,
        });
      } else if (lead.status === 'quoted') {
        contractsData.push({
          leadId: lead._id,
          status: 'pending',
          pendingReason: ['等待客户确认方案', '报价调整中', '等待设计师出图', '客户出差中'][Math.floor(Math.random() * 4)],
          processingHours: Math.floor(Math.random() * 120) + 20,
          responsiblePerson: users[Math.floor(Math.random() * users.length)].name,
        });
      }
    }

    if (contractsData.length > 0) {
      await this.contractModel.insertMany(contractsData);
    }
  }
}
