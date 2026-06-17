import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigItem } from './config.schema';
import { CreateConfigItemDto, UpdateConfigItemDto } from './dto/config.dto';
import { ConfigStatus } from '../common/decorators/config-status.enum';

@Injectable()
export class ConfigItemsService {
  constructor(@InjectModel(ConfigItem.name) private model: Model<ConfigItem>) {}

  async create(dto: CreateConfigItemDto, createdBy: Types.ObjectId): Promise<ConfigItem> {
    const existing = await this.model.findOne({ key: dto.key });
    if (existing) throw new ConflictException('配置key已存在');
    const doc = new this.model({ ...dto, createdBy, updatedBy: createdBy });
    return doc.save();
  }

  async findAll(q: any): Promise<{ data: ConfigItem[]; total: number }> {
    const page = q.page || 1, limit = q.limit || 50;
    const filter: any = {};
    if (q.category) filter.category = q.category;
    if (q.status) filter.status = q.status;
    if (q.key) filter.key = { $regex: q.key, $options: 'i' };
    const [data, total] = await Promise.all([
      this.model.find(filter).skip((page - 1) * limit).limit(limit)
        .populate('createdBy updatedBy changeLogs.operator', 'realName username')
        .sort({ updatedAt: -1 }),
      this.model.countDocuments(filter),
    ]);
    return { data, total };
  }

  async findByCategory(category: string, status?: string): Promise<ConfigItem[]> {
    const filter: any = { category };
    if (status) filter.status = status;
    return this.model.find(filter).populate('createdBy updatedBy', 'realName username').sort({ key: 1 });
  }

  async findOne(id: string): Promise<ConfigItem> {
    const doc = await this.model.findById(id)
      .populate('createdBy updatedBy changeLogs.operator', 'realName username');
    if (!doc) throw new NotFoundException('配置项不存在');
    return doc;
  }

  async update(id: string, dto: UpdateConfigItemDto, updatedBy: Types.ObjectId): Promise<ConfigItem> {
    const doc = await this.model.findById(id);
    if (!doc) throw new NotFoundException('配置项不存在');
    if (dto.value !== undefined && JSON.stringify(dto.value) !== JSON.stringify(doc.value)) {
      doc.changeLogs.push({
        date: new Date(),
        from: doc.value,
        to: dto.value,
        operator: updatedBy,
      });
    }
    Object.assign(doc, { ...dto, updatedBy });
    return doc.save();
  }

  async updateStatus(id: string, status: ConfigStatus, updatedBy: Types.ObjectId): Promise<ConfigItem> {
    const doc = await this.model.findByIdAndUpdate(id, { status, updatedBy }, { new: true });
    if (!doc) throw new NotFoundException('配置项不存在');
    return doc;
  }
}
