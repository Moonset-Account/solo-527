import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ReminderRule,
  ReminderRuleDocument,
  ReminderCategory,
} from './reminder-rule.schema';

@Injectable()
export class RemindersService {
  constructor(@InjectModel('ReminderRule') private reminderRuleModel: Model<ReminderRuleDocument>) {}

  async create(createReminderDto: any, userId: string): Promise<ReminderRule> {
    const rule = new this.reminderRuleModel({
      ...createReminderDto,
      createdBy: userId,
      updatedBy: userId,
    });
    return rule.save();
  }

  async findAll(query: any = {}): Promise<ReminderRule[]> {
    const filter: any = {};
    if (query.type) {
      filter.type = query.type;
    }
    if (query.category) {
      filter.category = query.category;
    }
    if (query.enabled !== undefined) {
      filter.enabled = query.enabled;
    }
    return this.reminderRuleModel.find(filter).sort({ sort: 1, createdAt: -1 }).exec();
  }

  async findByCategory(category: ReminderCategory): Promise<ReminderRule[]> {
    return this.reminderRuleModel.find({ category, enabled: true }).sort({ sort: 1 }).exec();
  }

  async findById(id: string): Promise<ReminderRule | null> {
    return this.reminderRuleModel.findById(id).exec();
  }

  async update(id: string, updateReminderDto: any, userId: string): Promise<ReminderRule | null> {
    updateReminderDto.updatedBy = userId;
    return this.reminderRuleModel
      .findByIdAndUpdate(id, updateReminderDto, { new: true })
      .exec();
  }

  async remove(id: string): Promise<ReminderRule | null> {
    return this.reminderRuleModel.findByIdAndDelete(id).exec();
  }

  async toggleEnabled(id: string, enabled: boolean, userId: string): Promise<ReminderRule | null> {
    return this.reminderRuleModel
      .findByIdAndUpdate(id, { enabled, updatedBy: userId }, { new: true })
      .exec();
  }

  async getReminders(): Promise<{ daily: ReminderRule[]; alert: ReminderRule[] }> {
    const daily = await this.reminderRuleModel
      .find({ category: ReminderCategory.DAILY, enabled: true })
      .sort({ sort: 1 })
      .exec();
    const alert = await this.reminderRuleModel
      .find({ category: ReminderCategory.ALERT, enabled: true })
      .sort({ sort: 1 })
      .exec();
    return { daily, alert };
  }

  async checkAppointmentConflict(
    technicianId: string,
    date: string,
    startTime: string,
    duration: number,
  ): Promise<{ hasConflict: boolean; level?: string; message?: string }> {
    const rules = await this.reminderRuleModel
      .find({ type: 'appointment_conflict', enabled: true })
      .exec();

    return { hasConflict: false };
  }
}
