import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as dayjs from 'dayjs';
import { Schedule, ScheduleDocument, ScheduleType } from './schedule.schema';

@Injectable()
export class ScheduleService {
  constructor(@InjectModel('Schedule') private scheduleModel: Model<ScheduleDocument>) {}

  async create(createScheduleDto: any, userId: string): Promise<Schedule> {
    const schedule = new this.scheduleModel({
      ...createScheduleDto,
      date: new Date(createScheduleDto.date),
      createdBy: userId,
      updatedBy: userId,
    });
    return schedule.save();
  }

  async findAll(query: any = {}): Promise<Schedule[]> {
    const filter: any = {};
    
    if (query.technicianId) {
      filter.technicianId = query.technicianId;
    }
    if (query.type) {
      filter.type = query.type;
    }
    if (query.startDate && query.endDate) {
      filter.date = {
        $gte: new Date(query.startDate),
        $lte: new Date(query.endDate),
      };
    }

    return this.scheduleModel.find(filter).sort({ date: 1 }).exec();
  }

  async findByTechnicianAndDateRange(
    technicianId: string,
    startDate: string,
    endDate: string,
  ): Promise<Schedule[]> {
    return this.scheduleModel
      .find({
        technicianId,
        date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      })
      .sort({ date: 1 })
      .exec();
  }

  async findById(id: string): Promise<Schedule | null> {
    return this.scheduleModel.findById(id).exec();
  }

  async update(id: string, updateScheduleDto: any, userId: string): Promise<Schedule | null> {
    if (updateScheduleDto.date) {
      updateScheduleDto.date = new Date(updateScheduleDto.date);
    }
    updateScheduleDto.updatedBy = userId;
    return this.scheduleModel
      .findByIdAndUpdate(id, updateScheduleDto, { new: true })
      .exec();
  }

  async remove(id: string): Promise<Schedule | null> {
    return this.scheduleModel.findByIdAndDelete(id).exec();
  }

  async batchCreate(schedules: any[], userId: string): Promise<Schedule[]> {
    const created = schedules.map(s => ({
      ...s,
      date: new Date(s.date),
      createdBy: userId,
      updatedBy: userId,
    }));
    return this.scheduleModel.create(created);
  }

  async isWorkingDay(technicianId: string, date: string): Promise<boolean> {
    const schedule = await this.scheduleModel.findOne({
      technicianId,
      date: new Date(date),
    }).exec();
    
    if (schedule) {
      return schedule.type === ScheduleType.WORK;
    }
    
    const dayOfWeek = dayjs(date).day();
    return dayOfWeek >= 1 && dayOfWeek <= 5;
  }

  async getWeekSchedule(technicianId: string, weekStart: string): Promise<Schedule[]> {
    const start = dayjs(weekStart).startOf('week').toDate();
    const end = dayjs(weekStart).endOf('week').toDate();
    
    return this.scheduleModel
      .find({
        technicianId,
        date: { $gte: start, $lte: end },
      })
      .sort({ date: 1 })
      .exec();
  }
}
