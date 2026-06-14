import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PlatformAccount, PlatformAccountDocument } from './schemas/platform-account.schema';
import { Material, MaterialDocument } from './schemas/material.schema';
import { Schedule, ScheduleDocument } from './schemas/schedule.schema';
import {
  QueryPlatformAccountDto,
  CreatePlatformAccountDto,
  UpdatePlatformAccountDto,
  QueryMaterialDto,
  CreateMaterialDto,
  UpdateMaterialDto,
  QueryScheduleDto,
  CreateScheduleDto,
  UpdateScheduleDto,
} from './dto/operation.dto';
import { PaginatedResult } from '@/common/dto/pagination';
import { isDbReady, safeQuery } from '@/common/db-utils';
import dayjs from 'dayjs';

@Injectable()
export class OperationService {
  constructor(
    @InjectModel(PlatformAccount.name) private platformAccountModel: Model<PlatformAccountDocument>,
    @InjectModel(Material.name) private materialModel: Model<MaterialDocument>,
    @InjectModel(Schedule.name) private scheduleModel: Model<ScheduleDocument>,
  ) {}

  private empty<T>(page: number, pageSize: number): PaginatedResult<T> {
    return { list: [], total: 0, page, pageSize };
  }

  async createPlatformAccount(dto: CreatePlatformAccountDto): Promise<PlatformAccount> {
    if (!isDbReady()) {
      return {
        _id: 'mock_pa_' + Date.now(),
        ...dto,
        isActive: true,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;
    }
    const account = new this.platformAccountModel(dto);
    const saved = await account.save();
    return saved.toObject() as any;
  }

  async findAllPlatformAccounts(query: QueryPlatformAccountDto): Promise<PaginatedResult<PlatformAccount>> {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const fallback = this.empty<PlatformAccount>(page, pageSize);
    if (!isDbReady()) return fallback;

    const keyword = query.keyword;
    const { platform, operator, isActive } = query;
    const filter: any = { deletedAt: null };
    if (keyword) filter.name = { $regex: keyword, $options: 'i' };
    if (platform) filter.platform = platform;
    if (operator) filter.operator = operator;
    if (isActive !== undefined) filter.isActive = isActive;

    return safeQuery(async () => {
      const [list, total] = await Promise.all([
        this.platformAccountModel.find(filter).sort({ createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize).lean().exec(),
        this.platformAccountModel.countDocuments(filter),
      ]);
      return { list: list as any, total, page, pageSize };
    }, fallback);
  }

  async findOnePlatformAccount(id: string): Promise<PlatformAccount> {
    if (!isDbReady()) {
      return {
        _id: id,
        name: '示例账号（DB离线）',
        platform: 'douyin',
        accountId: '@demo',
        operator: 'zhangsan',
        followers: 10000,
        isActive: true,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;
    }
    const account: any = await this.platformAccountModel.findById(id).lean().exec();
    if (!account || account.deletedAt) throw new NotFoundException('平台账号不存在');
    return account;
  }

  async updatePlatformAccount(id: string, dto: UpdatePlatformAccountDto): Promise<PlatformAccount> {
    if (!isDbReady()) {
      const base = await this.findOnePlatformAccount(id);
      return { ...base, ...dto, updatedAt: new Date() } as any;
    }
    await this.findOnePlatformAccount(id);
    return this.platformAccountModel.findByIdAndUpdate(id, { ...dto, updatedAt: new Date() } as any, { new: true }).lean().exec() as any;
  }

  async removePlatformAccount(id: string): Promise<void> {
    if (!isDbReady()) return;
    await this.findOnePlatformAccount(id);
    await this.platformAccountModel.findByIdAndUpdate(id, { deletedAt: new Date() } as any);
  }

  async createMaterial(dto: CreateMaterialDto): Promise<Material> {
    if (!isDbReady()) {
      return {
        _id: 'mock_mat_' + Date.now(),
        ...dto,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;
    }
    const data: any = { ...dto };
    if (dto.interviewDate) data.interviewDate = new Date(dto.interviewDate);
    const material = new this.materialModel(data);
    const saved = await material.save();
    return saved.toObject() as any;
  }

  async findAllMaterials(query: QueryMaterialDto): Promise<PaginatedResult<Material>> {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const fallback = this.empty<Material>(page, pageSize);
    if (!isDbReady()) return fallback;

    const keyword = query.keyword;
    const { interviewee, startDate, endDate, keywords } = query;
    const filter: any = { deletedAt: null };
    if (keyword) filter.title = { $regex: keyword, $options: 'i' };
    if (interviewee) filter.interviewee = interviewee;
    if (keywords && keywords.length > 0) filter.keywords = { $in: keywords };
    if (startDate || endDate) {
      filter.interviewDate = {};
      if (startDate) filter.interviewDate.$gte = dayjs(startDate).startOf('day').toDate();
      if (endDate) filter.interviewDate.$lte = dayjs(endDate).endOf('day').toDate();
    }

    return safeQuery(async () => {
      const [list, total] = await Promise.all([
        this.materialModel.find(filter).sort({ interviewDate: -1 }).skip((page - 1) * pageSize).limit(pageSize).lean().exec(),
        this.materialModel.countDocuments(filter),
      ]);
      return { list: list as any, total, page, pageSize };
    }, fallback);
  }

  async findOneMaterial(id: string): Promise<Material> {
    if (!isDbReady()) {
      return {
        _id: id,
        title: '示例采访素材（DB离线）',
        interviewee: '张总',
        interviewDate: new Date(),
        keywords: ['品牌', '新品'],
        url: '',
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;
    }
    const material: any = await this.materialModel.findById(id).lean().exec();
    if (!material || material.deletedAt) throw new NotFoundException('素材不存在');
    return material;
  }

  async updateMaterial(id: string, dto: UpdateMaterialDto): Promise<Material> {
    if (!isDbReady()) {
      const base = await this.findOneMaterial(id);
      return { ...base, ...dto, updatedAt: new Date() } as any;
    }
    await this.findOneMaterial(id);
    const updateData: any = { ...dto, updatedAt: new Date() };
    if (dto.interviewDate) updateData.interviewDate = new Date(dto.interviewDate);
    return this.materialModel.findByIdAndUpdate(id, updateData, { new: true }).lean().exec() as any;
  }

  async removeMaterial(id: string): Promise<void> {
    if (!isDbReady()) return;
    await this.findOneMaterial(id);
    await this.materialModel.findByIdAndUpdate(id, { deletedAt: new Date() } as any);
  }

  async createSchedule(dto: CreateScheduleDto): Promise<Schedule> {
    if (!isDbReady()) {
      return {
        _id: 'mock_sch_' + Date.now(),
        ...dto,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;
    }
    const schedule = new this.scheduleModel({
      ...dto,
      scheduledTime: dto.scheduledTime ? new Date(dto.scheduledTime) : undefined,
    });
    const saved = await schedule.save();
    return saved.toObject() as any;
  }

  async findAllSchedules(query: QueryScheduleDto): Promise<PaginatedResult<Schedule>> {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const fallback = this.empty<Schedule>(page, pageSize);
    if (!isDbReady()) return fallback;

    const keyword = query.keyword;
    const { status, startDate, endDate, publisher } = query;
    const filter: any = { deletedAt: null };
    if (keyword) filter.contentTitle = { $regex: keyword, $options: 'i' };
    if (status) filter.status = status;
    if (publisher) filter.publisher = publisher;
    if (startDate || endDate) {
      filter.scheduledTime = {};
      if (startDate) filter.scheduledTime.$gte = dayjs(startDate).startOf('day').toDate();
      if (endDate) filter.scheduledTime.$lte = dayjs(endDate).endOf('day').toDate();
    }

    return safeQuery(async () => {
      const [list, total] = await Promise.all([
        this.scheduleModel
          .find(filter)
          .sort({ scheduledTime: 1 })
          .skip((page - 1) * pageSize)
          .limit(pageSize)
          .populate('platformIds')
          .lean()
          .exec(),
        this.scheduleModel.countDocuments(filter),
      ]);
      return { list: list as any, total, page, pageSize };
    }, fallback);
  }

  async findOneSchedule(id: string): Promise<Schedule> {
    if (!isDbReady()) {
      return {
        _id: id,
        contentTitle: '示例发布排期（DB离线）',
        status: 'pending',
        scheduledTime: new Date(),
        publisher: 'zhangsan',
        platformIds: [],
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;
    }
    const schedule: any = await this.scheduleModel.findById(id).populate('platformIds').lean().exec();
    if (!schedule || schedule.deletedAt) throw new NotFoundException('排期不存在');
    return schedule;
  }

  async updateSchedule(id: string, dto: UpdateScheduleDto): Promise<Schedule> {
    if (!isDbReady()) {
      const base = await this.findOneSchedule(id);
      return { ...base, ...dto, updatedAt: new Date() } as any;
    }
    await this.findOneSchedule(id);
    const updateData: any = { ...dto, updatedAt: new Date() };
    if (dto.scheduledTime) updateData.scheduledTime = new Date(dto.scheduledTime);
    return this.scheduleModel.findByIdAndUpdate(id, updateData, { new: true }).populate('platformIds').lean().exec() as any;
  }

  async removeSchedule(id: string): Promise<void> {
    if (!isDbReady()) return;
    await this.findOneSchedule(id);
    await this.scheduleModel.findByIdAndUpdate(id, { deletedAt: new Date() } as any);
  }
}
