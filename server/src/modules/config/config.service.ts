import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Config } from '../../schemas/config.schema';
import { OperationLog } from '../../schemas/operation-log.schema';
import { CreateConfigDto, UpdateConfigDto, QueryConfigDto } from './config.dto';

@Injectable()
export class ConfigService {
  constructor(
    @InjectModel(Config.name) private configModel: Model<Config>,
    @InjectModel(OperationLog.name) private operationLogModel: Model<OperationLog>,
  ) {}

  async create(dto: CreateConfigDto): Promise<Config> {
    const created = new this.configModel(dto);
    const saved = await created.save();
    await this.logOperation('config', 'create', dto.updatedBy.userId, dto.updatedBy.userName, `Created config: ${dto.key}`);
    return saved;
  }

  async findAll(query: QueryConfigDto): Promise<Config[]> {
    const filter: any = {};
    if (query.type) filter.type = query.type;
    return this.configModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<Config> {
    const config = await this.configModel.findById(id).exec();
    if (!config) throw new NotFoundException('Config not found');
    return config;
  }

  async update(id: string, dto: UpdateConfigDto): Promise<Config> {
    const config = await this.configModel.findById(id).exec();
    if (!config) throw new NotFoundException('Config not found');

    if (dto.updatedBy) {
      config.updatedBy = dto.updatedBy;
    }
    if (dto.value !== undefined) {
      config.value = dto.value;
    }
    if (dto.description !== undefined) {
      config.description = dto.description;
    }

    const saved = await config.save();
    if (dto.updatedBy) {
      await this.logOperation('config', 'update', dto.updatedBy.userId, dto.updatedBy.userName, `Updated config: ${config.key}`);
    }
    return saved;
  }

  private async logOperation(module: string, action: string, operatorId: string, operatorName: string, detail: string): Promise<void> {
    await this.operationLogModel.create({ module, action, operatorId, operatorName, detail, environment: 'production' });
  }
}
