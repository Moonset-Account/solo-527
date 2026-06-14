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
import { isDbReady, safeQuery } from '@/common/db-utils';

@Injectable()
export class SettingsService {
  constructor(
    @InjectModel(DictItem.name) private dictItemModel: Model<DictItemDocument>,
    @InjectModel(SystemConfig.name) private systemConfigModel: Model<SystemConfigDocument>,
  ) {}

  private empty<T>(page: number, pageSize: number): PaginatedResult<T> {
    return { list: [], total: 0, page, pageSize };
  }

  async createDictItem(dto: CreateDictItemDto): Promise<DictItem> {
    if (!isDbReady()) {
      return {
        _id: 'mock_dict_' + Date.now(),
        sort: 0,
        enabled: true,
        ...dto,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;
    }
    const item = new this.dictItemModel({ sort: 0, enabled: true, ...dto });
    const saved = await item.save();
    return saved.toObject() as any;
  }

  async findAllDictItems(query: QueryDictItemDto): Promise<PaginatedResult<DictItem>> {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const fallback = this.empty<DictItem>(page, pageSize);
    if (!isDbReady()) return fallback;

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

    return safeQuery(async () => {
      const [list, total] = await Promise.all([
        this.dictItemModel.find(filter).sort({ dictCode: 1, sort: 1 }).skip((page - 1) * pageSize).limit(pageSize).lean().exec(),
        this.dictItemModel.countDocuments(filter),
      ]);
      return { list: list as any, total, page, pageSize };
    }, fallback);
  }

  async findDictItemsByCode(dictCode: string): Promise<DictItem[]> {
    return safeQuery(
      () => this.dictItemModel.find({ deletedAt: null, dictCode, enabled: true }).sort({ sort: 1 }).lean().exec() as any,
      [
        { _id: 'dict_1', dictCode, dictName: '示例字典', itemLabel: '选项A', itemValue: 'A', sort: 1, enabled: true } as any,
        { _id: 'dict_2', dictCode, dictName: '示例字典', itemLabel: '选项B', itemValue: 'B', sort: 2, enabled: true } as any,
      ],
    );
  }

  async findAllDictCodes(): Promise<Array<{ dictCode: string; dictName: string }>> {
    if (!isDbReady()) {
      return [
        { dictCode: 'content_status', dictName: '内容状态' },
        { dictCode: 'platform_type', dictName: '平台类型' },
        { dictCode: 'review_node', dictName: '审稿节点类型' },
      ];
    }
    return safeQuery(async () => {
      const items: any[] = await this.dictItemModel.find({ deletedAt: null }).select('dictCode dictName').lean().exec();
      const map = new Map<string, string>();
      items.forEach((item) => {
        if (!map.has(item.dictCode)) map.set(item.dictCode, item.dictName);
      });
      return Array.from(map.entries()).map(([dictCode, dictName]) => ({ dictCode, dictName }));
    }, []);
  }

  async findOneDictItem(id: string): Promise<DictItem> {
    if (!isDbReady()) {
      return {
        _id: id,
        dictCode: 'demo_code',
        dictName: '示例字典（DB离线）',
        itemLabel: '示例项',
        itemValue: 'demo',
        sort: 1,
        enabled: true,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;
    }
    const item: any = await this.dictItemModel.findById(id).lean().exec();
    if (!item || item.deletedAt) throw new NotFoundException('字典项不存在');
    return item;
  }

  async updateDictItem(id: string, dto: UpdateDictItemDto): Promise<DictItem> {
    if (!isDbReady()) {
      const base = await this.findOneDictItem(id);
      return { ...base, ...dto, updatedAt: new Date() } as any;
    }
    await this.findOneDictItem(id);
    return this.dictItemModel.findByIdAndUpdate(id, { ...dto, updatedAt: new Date() } as any, { new: true }).lean().exec() as any;
  }

  async removeDictItem(id: string): Promise<void> {
    if (!isDbReady()) return;
    await this.findOneDictItem(id);
    await this.dictItemModel.findByIdAndUpdate(id, { deletedAt: new Date() } as any);
  }

  async createSystemConfig(dto: CreateSystemConfigDto): Promise<SystemConfig> {
    if (!isDbReady()) {
      return {
        _id: 'mock_cfg_' + Date.now(),
        ...dto,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;
    }
    const config = new this.systemConfigModel(dto);
    const saved = await config.save();
    return saved.toObject() as any;
  }

  async findAllSystemConfigs(query: QuerySystemConfigDto): Promise<PaginatedResult<SystemConfig>> {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const fallback = this.empty<SystemConfig>(page, pageSize);
    if (!isDbReady()) return fallback;

    const keyword = query.keyword;
    const { configGroup } = query;
    const filter: any = { deletedAt: null };
    if (keyword) filter.configKey = { $regex: keyword, $options: 'i' };
    if (configGroup) filter.configGroup = configGroup;

    return safeQuery(async () => {
      const [list, total] = await Promise.all([
        this.systemConfigModel.find(filter).sort({ configGroup: 1, configKey: 1 }).skip((page - 1) * pageSize).limit(pageSize).lean().exec(),
        this.systemConfigModel.countDocuments(filter),
      ]);
      return { list: list as any, total, page, pageSize };
    }, fallback);
  }

  async findOneSystemConfig(id: string): Promise<SystemConfig> {
    if (!isDbReady()) {
      return {
        _id: id,
        configKey: 'demo.key',
        configValue: 'demo_value',
        configGroup: 'general',
        description: '示例配置（DB离线）',
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;
    }
    const config: any = await this.systemConfigModel.findById(id).lean().exec();
    if (!config || config.deletedAt) throw new NotFoundException('系统配置不存在');
    return config;
  }

  async findSystemConfigByKey(key: string): Promise<SystemConfig | null> {
    return safeQuery(
      () => this.systemConfigModel.findOne({ configKey: key, deletedAt: null }).lean().exec() as any,
      null,
    );
  }

  async findSystemConfigsByGroup(group: string): Promise<SystemConfig[]> {
    if (!isDbReady()) {
      if (group === 'threshold') {
        return [
          { _id: 'cfg_1', configKey: 'review_timeout_hours', configValue: '24', configGroup: 'threshold', description: '审稿超时小时数' } as any,
          { _id: 'cfg_2', configKey: 'publish_remind_minutes', configValue: '30', configGroup: 'threshold', description: '发布提醒提前分钟数' } as any,
        ];
      }
      if (group === 'default_assignee') {
        return [
          { _id: 'cfg_3', configKey: 'default_content_owner', configValue: 'zhangsan', configGroup: 'default_assignee', description: '默认内容负责人' } as any,
          { _id: 'cfg_4', configKey: 'default_exception_owner', configValue: 'lisi', configGroup: 'default_assignee', description: '默认异常处理人' } as any,
        ];
      }
      return [];
    }
    return safeQuery(
      () => this.systemConfigModel.find({ configGroup: group, deletedAt: null }).lean().exec() as any,
      [],
    );
  }

  async findAllConfigGroups(): Promise<string[]> {
    if (!isDbReady()) return ['threshold', 'default_assignee', 'notification'];
    return safeQuery(async () => {
      const configs: any[] = await this.systemConfigModel.find({ deletedAt: null }).select('configGroup').lean().exec();
      return Array.from(new Set(configs.map((c) => c.configGroup)));
    }, []);
  }

  async updateSystemConfig(id: string, dto: UpdateSystemConfigDto): Promise<SystemConfig> {
    if (!isDbReady()) {
      const base = await this.findOneSystemConfig(id);
      return { ...base, ...dto, updatedAt: new Date() } as any;
    }
    await this.findOneSystemConfig(id);
    return this.systemConfigModel.findByIdAndUpdate(id, { ...dto, updatedAt: new Date() } as any, { new: true }).lean().exec() as any;
  }

  async removeSystemConfig(id: string): Promise<void> {
    if (!isDbReady()) return;
    await this.findOneSystemConfig(id);
    await this.systemConfigModel.findByIdAndUpdate(id, { deletedAt: new Date() } as any);
  }
}
