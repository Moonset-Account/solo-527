import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DictItem, DictItemDocument } from './schemas/dict-item.schema';
import { SystemConfig, SystemConfigDocument } from './schemas/system-config.schema';
import {
  QueryDictItemDto,
  CreateDictItemDto,
  UpdateDictItemDto,
  QuerySystemConfigDto,
  CreateSystemConfigDto,
  UpdateSystemConfigDto,
} from './dto/settings.dto';
import { PaginatedResult } from '@/common/dto/pagination';

@Injectable()
export class SettingsService {
  constructor(
    @InjectModel(DictItem.name) private dictItemModel: Model<DictItemDocument>,
    @InjectModel(SystemConfig.name) private systemConfigModel: Model<SystemConfigDocument>,
  ) {}

  async createDictItem(dto: CreateDictItemDto): Promise<DictItem> {
    const item = new this.dictItemModel({ sort: 0, enabled: true, ...dto });
    return item.save();
  }

  async findAllDictItems(query: QueryDictItemDto): Promise<PaginatedResult<DictItem>> {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const keyword = query.keyword;
    const { dictCode, enabled } = query;
    const filter: any = { deletedAt: null };
    if (keyword) {
      filter.$or = [
        { dictName: { $regex: keyword, $options: 'i' } },
        { itemLabel: { $regex: keyword, $options: 'i' } },
      ];
    }
    if (dictCode) filter.dictCode = dictCode;
    if (enabled !== undefined) filter.enabled = enabled;

    const [list, total] = await Promise.all([
      this.dictItemModel.find(filter).sort({ dictCode: 1, sort: 1 }).skip((page - 1) * pageSize).limit(pageSize).lean().exec(),
      this.dictItemModel.countDocuments(filter),
    ]);

    return { list: list as any, total, page, pageSize };
  }

  async findDictItemsByCode(dictCode: string): Promise<DictItem[]> {
    return this.dictItemModel.find({ deletedAt: null, dictCode, enabled: true }).sort({ sort: 1 }).lean().exec() as any;
  }

  async findAllDictCodes(): Promise<Array<{ dictCode: string; dictName: string }>> {
    const items: any[] = await this.dictItemModel.find({ deletedAt: null }).select('dictCode dictName').lean().exec();
    const map = new Map<string, string>();
    items.forEach((item) => {
      if (!map.has(item.dictCode)) {
        map.set(item.dictCode, item.dictName);
      }
    });
    return Array.from(map.entries()).map(([dictCode, dictName]) => ({ dictCode, dictName }));
  }

  async findOneDictItem(id: string): Promise<DictItem> {
    const item: any = await this.dictItemModel.findById(id).lean().exec();
    if (!item || item.deletedAt) throw new NotFoundException('字典项不存在');
    return item;
  }

  async updateDictItem(id: string, dto: UpdateDictItemDto): Promise<DictItem> {
    await this.findOneDictItem(id);
    return this.dictItemModel.findByIdAndUpdate(id, { ...dto, updatedAt: new Date() } as any, { new: true }).lean().exec() as any;
  }

  async removeDictItem(id: string): Promise<void> {
    await this.findOneDictItem(id);
    await this.dictItemModel.findByIdAndUpdate(id, { deletedAt: new Date() } as any);
  }

  async createSystemConfig(dto: CreateSystemConfigDto): Promise<SystemConfig> {
    const config = new this.systemConfigModel(dto);
    return config.save();
  }

  async findAllSystemConfigs(query: QuerySystemConfigDto): Promise<PaginatedResult<SystemConfig>> {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const keyword = query.keyword;
    const { configGroup } = query;
    const filter: any = { deletedAt: null };
    if (keyword) filter.configKey = { $regex: keyword, $options: 'i' };
    if (configGroup) filter.configGroup = configGroup;

    const [list, total] = await Promise.all([
      this.systemConfigModel.find(filter).sort({ configGroup: 1, configKey: 1 }).skip((page - 1) * pageSize).limit(pageSize).lean().exec(),
      this.systemConfigModel.countDocuments(filter),
    ]);

    return { list: list as any, total, page, pageSize };
  }

  async findOneSystemConfig(id: string): Promise<SystemConfig> {
    const config: any = await this.systemConfigModel.findById(id).lean().exec();
    if (!config || config.deletedAt) throw new NotFoundException('系统配置不存在');
    return config;
  }

  async findSystemConfigByKey(key: string): Promise<SystemConfig | null> {
    return this.systemConfigModel.findOne({ configKey: key, deletedAt: null }).lean().exec() as any;
  }

  async findSystemConfigsByGroup(group: string): Promise<SystemConfig[]> {
    return this.systemConfigModel.find({ configGroup: group, deletedAt: null }).lean().exec() as any;
  }

  async findAllConfigGroups(): Promise<string[]> {
    const configs: any[] = await this.systemConfigModel.find({ deletedAt: null }).select('configGroup').lean().exec();
    return Array.from(new Set(configs.map((c) => c.configGroup)));
  }

  async updateSystemConfig(id: string, dto: UpdateSystemConfigDto): Promise<SystemConfig> {
    await this.findOneSystemConfig(id);
    return this.systemConfigModel.findByIdAndUpdate(id, { ...dto, updatedAt: new Date() } as any, { new: true }).lean().exec() as any;
  }

  async removeSystemConfig(id: string): Promise<void> {
    await this.findOneSystemConfig(id);
    await this.systemConfigModel.findByIdAndUpdate(id, { deletedAt: new Date() } as any);
  }
}
