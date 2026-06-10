import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Setting, SettingDocument } from './setting.schema';

export const DEFAULT_SETTINGS = [
  { key: 'default_technician_id', value: '', description: '默认负责人ID', group: 'general' },
  { key: 'default_technician_name', value: '', description: '默认负责人姓名', group: 'general' },
  { key: 'shop_name', value: '美甲店', description: '店铺名称', group: 'general' },
  { key: 'shop_phone', value: '', description: '店铺电话', group: 'general' },
  { key: 'shop_address', value: '', description: '店铺地址', group: 'general' },
  { key: 'business_start_time', value: '09:00', description: '营业开始时间', group: 'business' },
  { key: 'business_end_time', value: '21:00', description: '营业结束时间', group: 'business' },
  { key: 'appointment_advance_minutes', value: '30', description: '预约提前提醒(分钟)', group: 'reminder' },
  { key: 'appointment_conflict_blocking', value: 'true', description: '预约冲突是否阻断', group: 'reminder' },
  { key: 'membership_expire_days', value: '30', description: '会员卡到期提醒(天)', group: 'reminder' },
  { key: 'daily_report_time', value: '22:00', description: '每日报表时间', group: 'reminder' },
];

@Injectable()
export class SettingsService {
  constructor(@InjectModel('Setting') private settingModel: Model<SettingDocument>) {}

  async initDefaultSettings() {
    for (const setting of DEFAULT_SETTINGS) {
      const existing = await this.settingModel.findOne({ key: setting.key }).exec();
      if (!existing) {
        const newSetting = new this.settingModel(setting);
        await newSetting.save();
      }
    }
  }

  async findAll(query: any = {}): Promise<Setting[]> {
    const filter: any = {};
    if (query.group) {
      filter.group = query.group;
    }
    return this.settingModel.find(filter).sort({ sort: 1, key: 1 }).exec();
  }

  async findByKey(key: string): Promise<Setting | null> {
    return this.settingModel.findOne({ key }).exec();
  }

  async getValue(key: string, defaultValue: string = ''): Promise<string> {
    const setting = await this.settingModel.findOne({ key }).exec();
    return setting ? setting.value : defaultValue;
  }

  async getByGroup(group: string): Promise<Record<string, string>> {
    const settings = await this.settingModel.find({ group }).exec();
    const result: Record<string, string> = {};
    for (const setting of settings) {
      result[setting.key] = setting.value;
    }
    return result;
  }

  async update(key: string, value: string, userId: string): Promise<Setting | null> {
    return this.settingModel
      .findOneAndUpdate(
        { key },
        { value, updatedBy: userId },
        { new: true, upsert: true },
      )
      .exec();
  }

  async batchUpdate(settings: Array<{ key: string; value: string }>, userId: string): Promise<void> {
    for (const setting of settings) {
      await this.settingModel
        .findOneAndUpdate(
          { key: setting.key },
          { value: setting.value, updatedBy: userId },
          { new: true, upsert: true },
        )
        .exec();
    }
  }

  async getAll(): Promise<Record<string, string>> {
    const settings = await this.settingModel.find().exec();
    const result: Record<string, string> = {};
    for (const setting of settings) {
      result[setting.key] = setting.value;
    }
    return result;
  }
}
