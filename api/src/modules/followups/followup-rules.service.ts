import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FollowupRule, FollowupRuleDocument } from './followup-rule.schema.js';
import { CreateFollowupRuleDto } from './dto/create-followup-rule.dto.js';
import { UpdateFollowupRuleDto } from './dto/update-followup-rule.dto.js';

@Injectable()
export class FollowupRulesService {
  constructor(
    @InjectModel(FollowupRule.name)
    private followupRuleModel: Model<FollowupRuleDocument>,
  ) {}

  async findAll() {
    return this.followupRuleModel.find().sort({ priority: 1 }).lean();
  }

  async create(dto: CreateFollowupRuleDto) {
    const created = new this.followupRuleModel(dto);
    return created.save();
  }

  async update(id: string, dto: UpdateFollowupRuleDto) {
    const updated = await this.followupRuleModel
      .findByIdAndUpdate(id, dto, { new: true })
      .lean();
    if (!updated) throw new NotFoundException('回访规则不存在');
    return updated;
  }

  async toggle(id: string) {
    const rule = await this.followupRuleModel.findById(id);
    if (!rule) throw new NotFoundException('回访规则不存在');
    rule.enabled = !rule.enabled;
    await rule.save();
    return rule.toObject();
  }
}
