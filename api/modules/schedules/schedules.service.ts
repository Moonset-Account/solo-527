import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Schedule } from '../../schemas/schedule.schema.js';
import { createPaginatedResult, type PaginatedResult } from '../../common/dto/pagination.dto.js';

interface FindAllParams {
  page?: number;
  pageSize?: number;
  dateFrom?: string;
  dateTo?: string;
  teamId?: string;
  status?: string;
}

@Injectable()
export class SchedulesService {
  constructor(@InjectModel(Schedule.name) private scheduleModel: Model<Schedule>) {}

  async findAll(params: FindAllParams, isSandbox = false): Promise<PaginatedResult<Schedule>> {
    const page = params.page || 1;
    const pageSize = params.pageSize || 10;
    const skip = (page - 1) * pageSize;

    const filter: Record<string, unknown> = { isSandbox };

    if (params.dateFrom) {
      filter.date = { ...(filter.date as object), $gte: params.dateFrom };
    }
    if (params.dateTo) {
      filter.date = { ...(filter.date as object), $lte: params.dateTo };
    }
    if (params.teamId) {
      filter.teamId = params.teamId;
    }
    if (params.status) {
      filter.status = params.status;
    }

    const [items, total] = await Promise.all([
      this.scheduleModel.find(filter).sort({ date: -1 }).skip(skip).limit(pageSize).exec(),
      this.scheduleModel.countDocuments(filter).exec(),
    ]);

    return createPaginatedResult(items, total, page, pageSize);
  }

  async findOne(id: string, isSandbox = false): Promise<Schedule | null> {
    return this.scheduleModel.findOne({ _id: id, isSandbox }).exec();
  }

  async findByDate(date: string, isSandbox = false): Promise<Schedule[]> {
    return this.scheduleModel.find({ date, isSandbox }).sort({ teamId: 1 }).exec();
  }

  async create(data: Partial<Schedule>, isSandbox = false): Promise<Schedule> {
    return this.scheduleModel.create({ ...data, isSandbox });
  }

  async update(id: string, data: Partial<Schedule>, isSandbox = false): Promise<Schedule | null> {
    return this.scheduleModel
      .findOneAndUpdate({ _id: id, isSandbox }, data, { new: true })
      .exec();
  }

  async remove(id: string, isSandbox = false): Promise<Schedule | null> {
    return this.scheduleModel.findOneAndDelete({ _id: id, isSandbox }).exec();
  }

  async addBatch(
    scheduleId: string,
    batchData: { batchId: string; batchNo: string; recipeName: string; plannedQty: number; unit: string },
    isSandbox = false,
  ): Promise<Schedule | null> {
    const schedule = await this.scheduleModel.findOne({ _id: scheduleId, isSandbox }).exec();
    if (!schedule) {
      throw new NotFoundException('排产计划不存在');
    }

    schedule.batches.push(batchData);
    await schedule.save();
    return schedule;
  }

  async removeBatch(scheduleId: string, batchId: string, isSandbox = false): Promise<Schedule | null> {
    const schedule = await this.scheduleModel.findOne({ _id: scheduleId, isSandbox }).exec();
    if (!schedule) {
      throw new NotFoundException('排产计划不存在');
    }

    schedule.batches = schedule.batches.filter((b) => b.batchId !== batchId);
    await schedule.save();
    return schedule;
  }

  async updateStatus(id: string, status: string, isSandbox = false): Promise<Schedule | null> {
    return this.scheduleModel
      .findOneAndUpdate({ _id: id, isSandbox }, { status }, { new: true })
      .exec();
  }
}
