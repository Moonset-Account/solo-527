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
import dayjs from 'dayjs';

@Injectable()
export class OperationService {
  constructor(
    @InjectModel(PlatformAccount.name) private platformAccountModel: Model<PlatformAccountDocument>,
    @InjectModel(Material.name) private materialModel: Model<MaterialDocument>,
    @InjectModel(Schedule.name) private scheduleModel: Model<ScheduleDocument>,
  ) {}

  async createPlatformAccount(dto: CreatePlatformAccountDto): Promise<PlatformAccount> {
    const account = new this.platformAccountModel(dto);
    return account.save();
  }

  async findAllPlatformAccounts(query: QueryPlatformAccountDto): Promise<PaginatedResult<PlatformAccount>> {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const keyword = query.keyword;
    const { platform, operator, isActive } = query;
    const filter: any = { deletedAt: null };
    if (keyword) filter.name = { $regex: keyword, $options: 'i' };
    if (platform) filter.platform = platform;
    if (operator) filter.operator = operator;
    if (isActive !== undefined) filter.isActive = isActive;

    const [list, total] = await Promise.all([
      this.platformAccountModel.find(filter).sort({ createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize).lean().exec(),
      this.platformAccountModel.countDocuments(filter),
    ]);

    return { list: list as any, total, page, pageSize };
  }

  async findOnePlatformAccount(id: string): Promise<PlatformAccount> {
    const account: any = await this.platformAccountModel.findById(id).lean().exec();
    if (!account || account.deletedAt) throw new NotFoundException('平台账号不存在');
    return account;
  }

  async updatePlatformAccount(id: string, dto: UpdatePlatformAccountDto): Promise<PlatformAccount> {
    await this.findOnePlatformAccount(id);
    return this.platformAccountModel.findByIdAndUpdate(id, { ...dto, updatedAt: new Date() } as any, { new: true }).lean().exec() as any;
  }

  async removePlatformAccount(id: string): Promise<void> {
    await this.findOnePlatformAccount(id);
    await this.platformAccountModel.findByIdAndUpdate(id, { deletedAt: new Date() } as any);
  }

  async createMaterial(dto: CreateMaterialDto): Promise<Material> {
    const data: any = { ...dto };
    if (dto.interviewDate) data.interviewDate = new Date(dto.interviewDate);
    const material = new this.materialModel(data);
    return material.save();
  }

  async findAllMaterials(query: QueryMaterialDto): Promise<PaginatedResult<Material>> {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
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

    const [list, total] = await Promise.all([
      this.materialModel.find(filter).sort({ interviewDate: -1 }).skip((page - 1) * pageSize).limit(pageSize).lean().exec(),
      this.materialModel.countDocuments(filter),
    ]);

    return { list: list as any, total, page, pageSize };
  }

  async findOneMaterial(id: string): Promise<Material> {
    const material: any = await this.materialModel.findById(id).lean().exec();
    if (!material || material.deletedAt) throw new NotFoundException('素材不存在');
    return material;
  }

  async updateMaterial(id: string, dto: UpdateMaterialDto): Promise<Material> {
    await this.findOneMaterial(id);
    const updateData: any = { ...dto, updatedAt: new Date() };
    if (dto.interviewDate) updateData.interviewDate = new Date(dto.interviewDate);
    return this.materialModel.findByIdAndUpdate(id, updateData, { new: true }).lean().exec() as any;
  }

  async removeMaterial(id: string): Promise<void> {
    await this.findOneMaterial(id);
    await this.materialModel.findByIdAndUpdate(id, { deletedAt: new Date() } as any);
  }

  async createSchedule(dto: CreateScheduleDto): Promise<Schedule> {
    const schedule = new this.scheduleModel({
      ...dto,
      scheduledTime: dto.scheduledTime ? new Date(dto.scheduledTime) : undefined,
    });
    return schedule.save();
  }

  async findAllSchedules(query: QueryScheduleDto): Promise<PaginatedResult<Schedule>> {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
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
  }

  async findOneSchedule(id: string): Promise<Schedule> {
    const schedule: any = await this.scheduleModel.findById(id).populate('platformIds').lean().exec();
    if (!schedule || schedule.deletedAt) throw new NotFoundException('排期不存在');
    return schedule;
  }

  async updateSchedule(id: string, dto: UpdateScheduleDto): Promise<Schedule> {
    await this.findOneSchedule(id);
    const updateData: any = { ...dto, updatedAt: new Date() };
    if (dto.scheduledTime) updateData.scheduledTime = new Date(dto.scheduledTime);
    return this.scheduleModel.findByIdAndUpdate(id, updateData, { new: true }).populate('platformIds').lean().exec() as any;
  }

  async removeSchedule(id: string): Promise<void> {
    await this.findOneSchedule(id);
    await this.scheduleModel.findByIdAndUpdate(id, { deletedAt: new Date() } as any);
  }
}
