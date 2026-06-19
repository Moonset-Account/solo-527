import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery, Types } from 'mongoose';
import { Rule, RuleDocument, ToggleHistoryItem } from '../../schemas/rule.schema';
import { CreateRuleDto } from './dto/create-rule.dto';
import { UpdateRuleDto } from './dto/update-rule.dto';
import { ToggleRuleDto } from './dto/toggle-rule.dto';
import { CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@Injectable()
export class RulesService {
  constructor(
    @InjectModel(Rule.name) private ruleModel: Model<RuleDocument>,
  ) {}

  async findAll(): Promise<Rule[]> {
    return this.ruleModel.find().sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<Rule> {
    const rule = await this.ruleModel.findById(id).exec();
    if (!rule) {
      throw new NotFoundException('规则不存在');
    }
    return rule;
  }

  async create(createRuleDto: CreateRuleDto): Promise<Rule> {
    await this.checkCodeUnique(createRuleDto.code);
    const rule = new this.ruleModel(createRuleDto);
    return rule.save();
  }

  async update(id: string, updateRuleDto: UpdateRuleDto): Promise<Rule> {
    if (updateRuleDto.code) {
      await this.checkCodeUnique(updateRuleDto.code, id);
    }
    const rule = await this.ruleModel
      .findByIdAndUpdate(id, updateRuleDto, { new: true })
      .exec();
    if (!rule) {
      throw new NotFoundException('规则不存在');
    }
    return rule;
  }

  async toggle(
    id: string,
    toggleRuleDto: ToggleRuleDto,
    currentUser: CurrentUserPayload,
  ): Promise<Rule> {
    const rule = await this.ruleModel.findById(id).exec();
    if (!rule) {
      throw new NotFoundException('规则不存在');
    }

    const newIsEnabled = !rule.isEnabled;
    const effectiveTime = toggleRuleDto.effectiveTime
      ? new Date(toggleRuleDto.effectiveTime)
      : new Date();

    const historyItem: ToggleHistoryItem = {
      isEnabled: newIsEnabled,
      operatorId: new Types.ObjectId(currentUser.id),
      operatorName: currentUser.name,
      effectiveTime,
      timestamp: new Date(),
    };

    rule.isEnabled = newIsEnabled;
    rule.effectiveTime = effectiveTime;
    rule.toggleHistory = [...rule.toggleHistory, historyItem];

    return rule.save();
  }

  private async checkCodeUnique(code: string, excludeId?: string): Promise<void> {
    const filter: FilterQuery<RuleDocument> = { code };
    if (excludeId) {
      filter._id = { $ne: new Types.ObjectId(excludeId) };
    }
    const existing = await this.ruleModel.findOne(filter).exec();
    if (existing) {
      throw new ConflictException('规则编码已存在');
    }
  }
}
