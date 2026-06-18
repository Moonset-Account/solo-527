import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Followup, FollowupDocument } from './followup.schema.js';
import { CreateFollowupDto } from './dto/create-followup.dto.js';
import { UpdateFollowupDto } from './dto/update-followup.dto.js';
import { QueryFollowupDto } from './dto/query-followup.dto.js';

@Injectable()
export class FollowupsService {
  constructor(
    @InjectModel(Followup.name) private followupModel: Model<FollowupDocument>,
  ) {}

  async create(createFollowupDto: CreateFollowupDto, userId: string) {
    const data: any = {
      ...createFollowupDto,
      leadId: new Types.ObjectId(createFollowupDto.leadId),
      createdBy: new Types.ObjectId(userId),
      scheduledAt: new Date(createFollowupDto.scheduledAt),
    };
    if (createFollowupDto.completedAt) {
      data.completedAt = new Date(createFollowupDto.completedAt);
    }
    if (createFollowupDto.nextFollowupAt) {
      data.nextFollowupAt = new Date(createFollowupDto.nextFollowupAt);
    }
    const created = new this.followupModel(data);
    return created.save();
  }

  async findAll(query: QueryFollowupDto) {
    const filter: any = {};
    if (query.leadId) filter.leadId = new Types.ObjectId(query.leadId);
    if (query.createdBy) filter.createdBy = new Types.ObjectId(query.createdBy);

    if (query.startDate || query.endDate) {
      filter.scheduledAt = {};
      if (query.startDate) filter.scheduledAt.$gte = new Date(query.startDate);
      if (query.endDate) filter.scheduledAt.$lte = new Date(query.endDate);
    }

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.followupModel
        .find(filter)
        .populate('leadId', 'customerName phone status')
        .populate('createdBy', 'name role')
        .sort({ scheduledAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.followupModel.countDocuments(filter),
    ]);

    return { list: items, total, page, pageSize: limit, totalPages: Math.ceil(total / limit) };
  }

  async update(id: string, updateFollowupDto: UpdateFollowupDto) {
    const data: any = { ...updateFollowupDto };
    if (updateFollowupDto.scheduledAt) data.scheduledAt = new Date(updateFollowupDto.scheduledAt);
    if (updateFollowupDto.completedAt) data.completedAt = new Date(updateFollowupDto.completedAt);
    if (updateFollowupDto.nextFollowupAt) data.nextFollowupAt = new Date(updateFollowupDto.nextFollowupAt);

    const updated = await this.followupModel
      .findByIdAndUpdate(id, data, { new: true })
      .lean();
    if (!updated) throw new NotFoundException('回访记录不存在');
    return updated;
  }

  async getCalendar(startDate: string, endDate: string) {
    const followups = await this.followupModel
      .find({
        scheduledAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      })
      .populate('leadId', 'customerName phone status')
      .populate('createdBy', 'name role')
      .sort({ scheduledAt: 1 })
      .lean();

    const calendar: Record<string, any[]> = {};
    for (const f of followups) {
      const dateKey = new Date(f.scheduledAt).toISOString().split('T')[0];
      if (!calendar[dateKey]) calendar[dateKey] = [];
      calendar[dateKey].push(f);
    }
    return calendar;
  }
}
