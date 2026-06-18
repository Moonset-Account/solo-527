import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Dict, DictDocument } from './dict.schema.js';
import { ReminderTemplate, ReminderTemplateDocument } from './reminder-template.schema.js';
import { ScopeConfig, ScopeConfigDocument } from './scope-config.schema.js';

@Injectable()
export class SettingsService {
  constructor(
    @InjectModel(Dict.name) private dictModel: Model<DictDocument>,
    @InjectModel(ReminderTemplate.name)
    private reminderModel: Model<ReminderTemplateDocument>,
    @InjectModel(ScopeConfig.name) private scopeModel: Model<ScopeConfigDocument>,
  ) {}

  async getDicts(category?: string) {
    const filter: any = {};
    if (category) filter.category = category;
    return this.dictModel.find(filter).sort({ category: 1, sort: 1 }).lean();
  }

  async createDict(data: Partial<Dict>) {
    const created = new this.dictModel(data);
    return created.save();
  }

  async updateDict(id: string, data: Partial<Dict>) {
    const updated = await this.dictModel.findByIdAndUpdate(id, data, { new: true }).lean();
    if (!updated) throw new NotFoundException('字典项不存在');
    return updated;
  }

  async deleteDict(id: string) {
    await this.dictModel.findByIdAndDelete(id);
  }

  async getReminders() {
    return this.reminderModel.find().sort({ type: 1 }).lean();
  }

  async createReminder(data: Partial<ReminderTemplate>) {
    const created = new this.reminderModel(data);
    return created.save();
  }

  async updateReminder(id: string, data: Partial<ReminderTemplate>) {
    const updated = await this.reminderModel.findByIdAndUpdate(id, data, { new: true }).lean();
    if (!updated) throw new NotFoundException('提醒模板不存在');
    return updated;
  }

  async deleteReminder(id: string) {
    await this.reminderModel.findByIdAndDelete(id);
  }

  async getScopes(type?: string) {
    const filter: any = {};
    if (type) filter.type = type;
    return this.scopeModel.find(filter).sort({ type: 1, name: 1 }).lean();
  }

  async createScope(data: Partial<ScopeConfig>) {
    const created = new this.scopeModel(data);
    return created.save();
  }

  async updateScope(id: string, data: Partial<ScopeConfig>) {
    const updated = await this.scopeModel.findByIdAndUpdate(id, data, { new: true }).lean();
    if (!updated) throw new NotFoundException('范围配置不存在');
    return updated;
  }

  async deleteScope(id: string) {
    await this.scopeModel.findByIdAndDelete(id);
  }

  async getRoles() {
    return this.scopeModel.find({ type: 'role' }).sort({ name: 1 }).lean();
  }

  async createRole(data: Partial<ScopeConfig>) {
    const created = new this.scopeModel({ ...data, type: 'role' });
    return created.save();
  }

  async updateRole(id: string, data: Partial<ScopeConfig>) {
    const updated = await this.scopeModel
      .findByIdAndUpdate(id, { ...data, type: 'role' }, { new: true })
      .lean();
    if (!updated) throw new NotFoundException('角色不存在');
    return updated;
  }

  async deleteRole(id: string) {
    await this.scopeModel.findByIdAndDelete(id);
  }
}
