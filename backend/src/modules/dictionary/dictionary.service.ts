import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Dictionary, DictionaryDocument } from './schemas/dictionary.schema';
import { NotificationConfig, NotificationConfigDocument } from './schemas/notification-config.schema';
import {
  CreateDictionaryDto,
  UpdateDictionaryDto,
  CreateNotificationConfigDto,
  UpdateNotificationConfigDto,
  QueryDictionaryDto,
} from './dto/dictionary.dto';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../../common/enums/index.enum';

@Injectable()
export class DictionaryService {
  constructor(
    @InjectModel(Dictionary.name) private dictionaryModel: Model<DictionaryDocument>,
    @InjectModel(NotificationConfig.name) private notificationConfigModel: Model<NotificationConfigDocument>,
    private auditService: AuditService,
  ) {}

  async createDictionary(dto: CreateDictionaryDto, operatorId?: string): Promise<Dictionary> {
    const existing = await this.dictionaryModel.findOne({ code: dto.code });
    if (existing) throw new ConflictException(`字典编码 ${dto.code} 已存在`);

    const dict = new this.dictionaryModel({
      ...dto,
      audit: { createdBy: operatorId, updatedBy: operatorId },
    });
    await dict.save();

    await this.auditService.create({
      action: AuditAction.CREATE,
      module: 'dictionary',
      targetId: dict._id.toString(),
      targetName: dict.name,
      operatorId,
      details: dto,
    });

    return dict;
  }

  async findDictionaries(query: QueryDictionaryDto): Promise<{ list: Dictionary[]; total: number }> {
    const { type, code, page, pageSize } = query;
    const filter: any = {};
    if (type) filter.type = type;
    if (code) filter.code = { $regex: code, $options: 'i' };

    const [list, total] = await Promise.all([
      this.dictionaryModel.find(filter).skip((page - 1) * pageSize).limit(pageSize).sort({ createdAt: -1 }),
      this.dictionaryModel.countDocuments(filter),
    ]);
    return { list, total };
  }

  async getDictionaryByCode(code: string): Promise<Dictionary> {
    const dict = await this.dictionaryModel.findOne({ code, enabled: true });
    if (!dict) throw new NotFoundException(`字典 ${code} 不存在`);
    return dict;
  }

  async getDictionaryItems(code: string): Promise<Array<{ value: string; label: string; sort: number; enabled: boolean; extra?: Record<string, any> }>> {
    const dict = await this.getDictionaryByCode(code);
    return dict.items.filter((i) => i.enabled).sort((a, b) => a.sort - b.sort);
  }

  async updateDictionary(id: string, dto: UpdateDictionaryDto, operatorId?: string): Promise<Dictionary> {
    const dict = await this.dictionaryModel.findById(id);
    if (!dict) throw new NotFoundException('字典不存在');

    Object.assign(dict, dto, { audit: { ...dict.audit, updatedBy: operatorId, updatedAt: new Date() } });
    await dict.save();

    await this.auditService.create({
      action: AuditAction.UPDATE,
      module: 'dictionary',
      targetId: id,
      targetName: dict.name,
      operatorId,
      details: dto,
    });

    return dict;
  }

  async deleteDictionary(id: string, operatorId?: string): Promise<void> {
    const dict = await this.dictionaryModel.findById(id);
    if (!dict) throw new NotFoundException('字典不存在');

    dict.enabled = false;
    dict.audit = { ...dict.audit, updatedBy: operatorId, updatedAt: new Date() };
    await dict.save();

    await this.auditService.create({
      action: AuditAction.DELETE,
      module: 'dictionary',
      targetId: id,
      targetName: dict.name,
      operatorId,
    });
  }

  async createNotificationConfig(dto: CreateNotificationConfigDto, operatorId?: string): Promise<NotificationConfig> {
    const existing = await this.notificationConfigModel.findOne({ type: dto.type });
    if (existing) throw new ConflictException(`通知类型 ${dto.type} 配置已存在`);

    const config = new this.notificationConfigModel({
      ...dto,
      audit: { createdBy: operatorId, updatedBy: operatorId },
    });
    await config.save();

    await this.auditService.create({
      action: AuditAction.CREATE,
      module: 'notification_config',
      targetId: config._id.toString(),
      targetName: config.name,
      operatorId,
      details: dto,
    });

    return config;
  }

  async findNotificationConfigs(): Promise<NotificationConfig[]> {
    return this.notificationConfigModel.find().sort({ createdAt: -1 });
  }

  async updateNotificationConfig(id: string, dto: UpdateNotificationConfigDto, operatorId?: string): Promise<NotificationConfig> {
    const config = await this.notificationConfigModel.findById(id);
    if (!config) throw new NotFoundException('通知配置不存在');

    Object.assign(config, dto, { audit: { ...config.audit, updatedBy: operatorId, updatedAt: new Date() } });
    await config.save();

    await this.auditService.create({
      action: AuditAction.UPDATE,
      module: 'notification_config',
      targetId: id,
      targetName: config.name,
      operatorId,
      details: dto,
    });

    return config;
  }

  async getNotificationConfigByType(type: string): Promise<NotificationConfig | null> {
    return this.notificationConfigModel.findOne({ type, enabled: true });
  }
}
