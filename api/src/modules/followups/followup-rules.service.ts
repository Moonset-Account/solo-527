import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FollowupRule, FollowupRuleDocument } from './followup-rule.schema.js';
import { CreateFollowupRuleDto } from './dto/create-followup-rule.dto.js';
import { UpdateFollowupRuleDto } from './dto/update-followup-rule.dto.js';

function toFrontend(d: any): any {
  return {
    id: d._id,
    name: d.name,
    triggerEvent: d.triggerCondition?.event || '',
    triggerParams: d.triggerCondition?.params || {},
    actionRemindHours: d.action?.remindHours || 24,
    actionMethods: d.action?.remindMethod || [],
    actionTarget: d.action?.remindTarget?.[0] || '',
    scopeDepartments: d.scope?.departments || [],
    scopeRoles: d.scope?.roles || [],
    scopeSources: d.scope?.leadSources || [],
    priority: d.priority,
    enabled: d.enabled,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

function toBackend(data: any): any {
  const result: any = {};
  if (data.name !== undefined) result.name = data.name;
  if (data.triggerEvent !== undefined || data.triggerParams !== undefined) {
    result.triggerCondition = {
      event: data.triggerEvent || '',
      params: data.triggerParams || {},
    };
  }
  if (data.actionRemindHours !== undefined || data.actionMethods !== undefined || data.actionTarget !== undefined) {
    result.action = {
      remindHours: data.actionRemindHours ?? 24,
      remindMethod: data.actionMethods || [],
      remindTarget: data.actionTarget ? [data.actionTarget] : [],
    };
  }
  if (data.scopeDepartments !== undefined || data.scopeRoles !== undefined || data.scopeSources !== undefined) {
    result.scope = {
      departments: data.scopeDepartments || [],
      roles: data.scopeRoles || [],
      leadSources: data.scopeSources || [],
    };
  }
  if (data.priority !== undefined) result.priority = data.priority;
  if (data.enabled !== undefined) result.enabled = data.enabled;
  return result;
}

@Injectable()
export class FollowupRulesService {
  constructor(
    @InjectModel(FollowupRule.name)
    private followupRuleModel: Model<FollowupRuleDocument>,
  ) {}

  async findAll() {
    const data = await this.followupRuleModel.find().sort({ priority: 1 }).lean();
    return data.map((d: any) => toFrontend(d));
  }

  async create(dto: CreateFollowupRuleDto) {
    const backendData = toBackend(dto);
    const created = new this.followupRuleModel(backendData);
    const saved = await created.save();
    return toFrontend(saved.toObject());
  }

  async update(id: string, dto: UpdateFollowupRuleDto) {
    const backendData = toBackend(dto);
    const updated = await this.followupRuleModel
      .findByIdAndUpdate(id, backendData, { new: true })
      .lean();
    if (!updated) throw new NotFoundException('回访规则不存在');
    return toFrontend(updated);
  }

  async toggle(id: string, enabled?: boolean) {
    const rule = await this.followupRuleModel.findById(id);
    if (!rule) throw new NotFoundException('回访规则不存在');
    rule.enabled = enabled !== undefined ? enabled : !rule.enabled;
    await rule.save();
    return toFrontend(rule.toObject());
  }
}
