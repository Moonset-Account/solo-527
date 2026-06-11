import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Config, ConfigDocument, ChangeLog, ChangeLogItem } from '../../schemas/config.schema';
import { CreateConfigDto, UpdateConfigDto, QueryConfigDto } from '../../dto/config.dto';

export type { ChangeLog, ChangeLogItem } from '../../schemas/config.schema';

@Injectable()
export class ConfigsService {
  constructor(
    @InjectModel(Config.name) private configModel: Model<ConfigDocument>,
  ) {}

  private createChangeLogItem(modifiedBy: string, oldValue: any, newValue: any): ChangeLogItem {
    return {
      modifiedBy: modifiedBy || 'system',
      modifiedAt: new Date(),
      oldValue: JSON.parse(JSON.stringify(oldValue)),
      newValue: JSON.parse(JSON.stringify(newValue)),
    };
  }

  async create(createConfigDto: CreateConfigDto): Promise<Config> {
    if (!createConfigDto.key || !createConfigDto.key.trim()) {
      throw new BadRequestException('配置 key 不能为空');
    }
    if (!createConfigDto.type || !createConfigDto.type.trim()) {
      throw new BadRequestException('配置类型不能为空');
    }
    if (createConfigDto.value === undefined) {
      throw new BadRequestException('配置值不能为空');
    }

    const existing = await this.configModel.findOne({ key: createConfigDto.key }).exec();
    if (existing) {
      throw new ConflictException(`配置 key ${createConfigDto.key} 已存在`);
    }

    const data: any = {
      ...createConfigDto,
      enabled: createConfigDto.enabled !== undefined ? createConfigDto.enabled : true,
      version: createConfigDto.version || 1,
      changeLog: [],
    };

    const createdConfig = new this.configModel(data);
    return createdConfig.save();
  }

  async findAll(query: QueryConfigDto): Promise<{ data: Config[]; total: number; page: number; pageSize: number }> {
    const { key, type, enabled, page = 1, pageSize = 10 } = query;
    const filter: any = {};
    if (key) filter.key = { $regex: key, $options: 'i' };
    if (type) filter.type = type;
    if (enabled !== undefined) filter.enabled = enabled;

    const skip = (page - 1) * pageSize;
    const [data, total] = await Promise.all([
      this.configModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(pageSize).exec(),
      this.configModel.countDocuments(filter).exec(),
    ]);
    return { data, total, page, pageSize };
  }

  async findOne(id: string): Promise<Config> {
    const config = await this.configModel.findById(id).exec();
    if (!config) {
      throw new NotFoundException(`配置 ID ${id} 不存在`);
    }
    return config;
  }

  async findByKey(key: string): Promise<Config> {
    const config = await this.configModel.findOne({ key }).exec();
    if (!config) {
      throw new NotFoundException(`配置 key ${key} 不存在`);
    }
    return config;
  }

  async update(id: string, updateConfigDto: UpdateConfigDto): Promise<Config> {
    const existing = await this.configModel.findById(id).exec();
    if (!existing) {
      throw new NotFoundException(`配置 ID ${id} 不存在`);
    }

    const updateData: any = {};
    const changeLogs: ChangeLogItem[] = [...(existing.changeLog || [])];
    const modifiedBy = updateConfigDto.modifiedBy || 'system';

    if (updateConfigDto.value !== undefined) {
      updateData.value = updateConfigDto.value;
      changeLogs.push(this.createChangeLogItem(modifiedBy, existing.value, updateConfigDto.value));
    }
    if (updateConfigDto.type !== undefined && existing.type !== updateConfigDto.type) {
      updateData.type = updateConfigDto.type;
      changeLogs.push(this.createChangeLogItem(modifiedBy, existing.type, updateConfigDto.type));
    }
    if (updateConfigDto.enabled !== undefined && existing.enabled !== updateConfigDto.enabled) {
      updateData.enabled = updateConfigDto.enabled;
      changeLogs.push(this.createChangeLogItem(modifiedBy, existing.enabled, updateConfigDto.enabled));
    }
    if (updateConfigDto.remark !== undefined && existing.remark !== updateConfigDto.remark) {
      updateData.remark = updateConfigDto.remark;
      changeLogs.push(this.createChangeLogItem(modifiedBy, existing.remark, updateConfigDto.remark));
    }

    if (Object.keys(updateData).length === 0) {
      return existing;
    }

    updateData.changeLog = changeLogs;
    updateData.modifiedBy = modifiedBy;
    updateData.version = (existing.version || 1) + 1;

    const updatedConfig = await this.configModel
      .findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
      .exec();
    return updatedConfig;
  }

  async remove(id: string): Promise<Config> {
    const deletedConfig = await this.configModel.findByIdAndDelete(id).exec();
    if (!deletedConfig) {
      throw new NotFoundException(`配置 ID ${id} 不存在`);
    }
    return deletedConfig;
  }

  async enable(id: string, modifiedBy?: string): Promise<Config> {
    const existing = await this.configModel.findById(id).exec();
    if (!existing) {
      throw new NotFoundException(`配置 ID ${id} 不存在`);
    }

    const changeLogs: ChangeLogItem[] = [...(existing.changeLog || [])];
    changeLogs.push(this.createChangeLogItem(modifiedBy || 'system', existing.enabled, true));

    const config = await this.configModel
      .findByIdAndUpdate(
        id,
        {
          enabled: true,
          changeLog: changeLogs,
          modifiedBy: modifiedBy || 'system',
          version: (existing.version || 1) + 1,
        },
        { new: true },
      )
      .exec();
    return config;
  }

  async disable(id: string, modifiedBy?: string): Promise<Config> {
    const existing = await this.configModel.findById(id).exec();
    if (!existing) {
      throw new NotFoundException(`配置 ID ${id} 不存在`);
    }

    const changeLogs: ChangeLogItem[] = [...(existing.changeLog || [])];
    changeLogs.push(this.createChangeLogItem(modifiedBy || 'system', existing.enabled, false));

    const config = await this.configModel
      .findByIdAndUpdate(
        id,
        {
          enabled: false,
          changeLog: changeLogs,
          modifiedBy: modifiedBy || 'system',
          version: (existing.version || 1) + 1,
        },
        { new: true },
      )
      .exec();
    return config;
  }

  async getByType(type: string): Promise<Config[]> {
    return this.configModel.find({ type, enabled: true }).sort({ key: 1 }).exec();
  }

  async groupByType(): Promise<Record<string, Config[]>> {
    const configs = await this.configModel.find({ enabled: true }).sort({ type: 1, key: 1 }).exec();
    const grouped: Record<string, Config[]> = {};
    for (const config of configs) {
      if (!grouped[config.type]) {
        grouped[config.type] = [];
      }
      grouped[config.type].push(config);
    }
    return grouped;
  }

  async getChangeLog(id: string): Promise<ChangeLogItem[]> {
    const config = await this.configModel.findById(id).exec();
    if (!config) {
      throw new NotFoundException(`配置 ID ${id} 不存在`);
    }
    return config.changeLog || [];
  }
}
