import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Activity } from '../../schemas/activity.schema';
import { Registration } from '../../schemas/registration.schema';
import { CreateActivityDto, UpdateActivityDto, RegisterActivityDto, CancelRegistrationDto, QueryActivityDto } from './activity.dto';

@Injectable()
export class ActivityService {
  constructor(
    @InjectModel(Activity.name) private activityModel: Model<Activity>,
    @InjectModel(Registration.name) private registrationModel: Model<Registration>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(dto: CreateActivityDto): Promise<Activity> {
    const created = new this.activityModel(dto);
    const saved = await created.save();
    await this.invalidateCache();
    return saved;
  }

  async findAll(query: QueryActivityDto): Promise<{ data: any[]; total: number; page: number; limit: number }> {
    const { status, keyword, page = 1, limit = 10, userId } = query;
    const cacheKey = `activities:${status || ''}:${keyword || ''}:${page}:${limit}:${userId || ''}`;

    const cached = await this.cacheManager.get<{ data: any[]; total: number; page: number; limit: number }>(cacheKey);
    if (cached) return cached;

    const filter: any = {};
    if (status) filter.status = status;
    if (keyword) filter.title = { $regex: keyword, $options: 'i' };

    const [data, total] = await Promise.all([
      this.activityModel.find(filter).skip((page - 1) * limit).limit(limit).sort({ createdAt: -1 }).exec(),
      this.activityModel.countDocuments(filter).exec(),
    ]);

    let resultData: any[] = data.map((a) => a.toObject());

    if (userId) {
      const activityIds = data.map((a) => a._id);
      const registrations = await this.registrationModel
        .find({ activityId: { $in: activityIds }, userId, status: 'registered' })
        .exec();
      const registeredMap = new Set(registrations.map((r) => r.activityId));
      resultData = resultData.map((a) => ({ ...a, isRegistered: registeredMap.has(a._id.toString()) }));
    }

    const result = { data: resultData, total, page, limit };
    await this.cacheManager.set(cacheKey, result);
    return result;
  }

  async findOne(id: string, userId?: string): Promise<any> {
    const activity = await this.activityModel.findById(id).exec();
    if (!activity) throw new NotFoundException('Activity not found');

    const result: any = activity.toObject();
    if (userId) {
      const registration = await this.registrationModel
        .findOne({ activityId: id, userId, status: 'registered' })
        .exec();
      result.isRegistered = !!registration;
    }
    return result;
  }

  async update(id: string, dto: UpdateActivityDto): Promise<Activity> {
    const updated = await this.activityModel.findByIdAndUpdate(id, dto, { new: true }).exec();
    if (!updated) throw new NotFoundException('Activity not found');
    await this.invalidateCache();
    return updated;
  }

  async register(id: string, dto: RegisterActivityDto): Promise<Registration> {
    const activity = await this.activityModel.findById(id).exec();
    if (!activity) throw new NotFoundException('Activity not found');
    if (activity.status !== 'published') throw new BadRequestException('Activity is not open for registration');
    if (activity.currentParticipants >= activity.maxParticipants) throw new BadRequestException('Activity is full');

    const existing = await this.registrationModel.findOne({ activityId: id, userId: dto.userId, status: 'registered' }).exec();
    if (existing) throw new BadRequestException('Already registered');

    const registration = new this.registrationModel({
      activityId: id,
      userId: dto.userId,
      userName: dto.userName,
      status: 'registered',
      feePaid: activity.fee === 0,
      paidAt: activity.fee === 0 ? new Date() : undefined,
    });

    await this.activityModel.findByIdAndUpdate(id, { $inc: { currentParticipants: 1 } }).exec();
    await this.invalidateCache();
    return registration.save();
  }

  async cancel(id: string, dto: CancelRegistrationDto): Promise<Registration> {
    const registration = await this.registrationModel.findOne({ activityId: id, userId: dto.userId, status: 'registered' }).exec();
    if (!registration) throw new NotFoundException('Registration not found');

    registration.status = 'cancelled';
    const saved = await registration.save();
    await this.activityModel.findByIdAndUpdate(id, { $inc: { currentParticipants: -1 } }).exec();
    await this.invalidateCache();
    return saved;
  }

  private async invalidateCache(): Promise<void> {
    await this.cacheManager.clear();
  }
}
