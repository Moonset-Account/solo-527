import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigItem } from './config.schema';
import { CreateConfigItemDto, UpdateConfigItemDto } from './dto/config.dto';
import { ConfigStatus } from '../common/decorators/config-status.enum';
import { RedisService } from '../common/redis/redis.service';

const CONFIG_CACHE_PREFIX = 'config:';
const CONFIG_CACHE_TTL = 600;

@Injectable()
export class ConfigItemsService {
  constructor(
    @InjectModel(ConfigItem.name) private model: Model<ConfigItem>,
    private redisService: RedisService,
  ) {}

  private async invalidateCategoryCache(category?: string) {
    if (category) {
      await this.redisService.delPattern(`${CONFIG_CACHE_PREFIX}${category}:*`);
    } else {
      await this.redisService.delPattern(`${CONFIG_CACHE_PREFIX}*`);
    }
    await this.redisService.incr('config:cache:invalidations');
  }

  async create(dto: CreateConfigItemDto, createdBy: Types.ObjectId): Promise<ConfigItem> {
    const existing = await this.model.findOne({ key: dto.key });
    if (existing) throw new ConflictException('配置key已存在');
    const doc = new this.model({ ...dto, createdBy, updatedBy: createdBy });
    const saved = await doc.save();
    await this.invalidateCategoryCache(dto.category);
    return saved;
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
    const cacheKey = `${CONFIG_CACHE_PREFIX}${category}:${status || 'all'}`;
    const cached = await this.redisService.getJson<ConfigItem[]>(cacheKey);
    if (cached) {
      return cached.map(item => ({ ...item, fromCache: true } as any));
    }

    const filter: any = { category };
    if (status) filter.status = status;
    const data = await this.model.find(filter)
      .populate('createdBy updatedBy', 'realName username')
      .sort({ key: 1 });

    await this.redisService.setJson(cacheKey, data, CONFIG_CACHE_TTL);
    return data;
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
    const saved = await doc.save();
    await this.invalidateCategoryCache(saved.category);
    return saved;
  }

  async updateStatus(id: string, status: ConfigStatus, updatedBy: Types.ObjectId): Promise<ConfigItem> {
    const doc = await this.model.findByIdAndUpdate(id, { status, updatedBy }, { new: true });
    if (!doc) throw new NotFoundException('配置项不存在');
    await this.invalidateCategoryCache(doc.category);
    return doc;
  }
}
