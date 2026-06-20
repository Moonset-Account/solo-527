import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Interviewer, InterviewerDocument } from './schemas/interviewer.schema';
import { Schedule, ScheduleDocument, ScheduleStatus } from './schemas/schedule.schema';
import { CreateScheduleDto, CreateScheduleBatchDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { SearchDto } from '../common/dto/search.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import { OperationLogsService } from '../operation-logs/operation-logs.service';
import { OperationType } from '../common/enums/operation-type.enum';
import { User } from '../users/schemas/user.schema';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class InterviewersService {
  constructor(
    @InjectModel(Interviewer.name) private interviewerModel: Model<InterviewerDocument>,
    @InjectModel(Schedule.name) private scheduleModel: Model<ScheduleDocument>,
    @InjectModel(User.name) private userModel: Model<any>,
    private operationLogsService: OperationLogsService,
  ) {}

  async checkScheduleConflict(
    interviewerId: string,
    date: string,
    startTime: string,
    endTime: string,
    excludeId?: string,
  ): Promise<boolean> {
    const query: any = {
      interviewerId: new Types.ObjectId(interviewerId),
      date: new Date(date),
      $or: [
        {
          $and: [
            { startTime: { $lte: startTime } },
            { endTime: { $gt: startTime } },
          ],
        },
        {
          $and: [
            { startTime: { $lt: endTime } },
            { endTime: { $gte: endTime } },
          ],
        },
        {
          $and: [
            { startTime: { $gte: startTime } },
            { endTime: { $lte: endTime } },
          ],
        },
      ],
    };

    if (excludeId) {
      query._id = { $ne: new Types.ObjectId(excludeId) };
    }

    const conflict = await this.scheduleModel.findOne(query).exec();
    return !!conflict;
  }

  async createSchedule(createScheduleDto: CreateScheduleDto, operatorId: string): Promise<Schedule> {
    const { interviewerId, date, startTime, endTime } = createScheduleDto;

    const hasConflict = await this.checkScheduleConflict(interviewerId, date, startTime, endTime);
    if (hasConflict) {
      throw new ConflictException('该时间段已有档期安排');
    }

    const schedule = new this.scheduleModel({
      ...createScheduleDto,
      interviewerId: new Types.ObjectId(interviewerId),
      date: new Date(date),
    });

    const saved = await schedule.save();

    await this.operationLogsService.create({
      userId: operatorId,
      operationType: OperationType.CREATE,
      module: 'schedules',
      targetId: saved._id.toString(),
      details: { date, startTime, endTime, interviewerId },
      ip: 'localhost',
    });

    return saved;
  }

  async createScheduleBatch(dto: CreateScheduleBatchDto, operatorId: string): Promise<Schedule[]> {
    const { interviewerId, startDate, endDate, timeSlots, weekdays } = dto;
    const created: Schedule[] = [];

    const start = new Date(startDate);
    const end = new Date(endDate);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay();
      
      if (weekdays && weekdays.length > 0 && !weekdays.includes(dayOfWeek)) {
        continue;
      }

      for (const slot of timeSlots) {
        const [startTime, endTime] = slot.split('-');
        if (!startTime || !endTime) continue;

        const dateStr = d.toISOString().split('T')[0];
        const hasConflict = await this.checkScheduleConflict(interviewerId, dateStr, startTime, endTime);
        
        if (!hasConflict) {
          const schedule = new this.scheduleModel({
            interviewerId: new Types.ObjectId(interviewerId),
            date: new Date(d),
            startTime,
            endTime,
            status: ScheduleStatus.AVAILABLE,
          });
          created.push(await schedule.save());
        }
      }
    }

    await this.operationLogsService.create({
      userId: operatorId,
      operationType: OperationType.CREATE,
      module: 'schedules',
      details: { batch: true, count: created.length, interviewerId, startDate, endDate },
      ip: 'localhost',
    });

    return created;
  }

  async findSchedules(searchDto: SearchDto): Promise<PaginatedResult<Schedule>> {
    const {
      page = 1,
      pageSize = 20,
      sortBy = 'date',
      sortOrder = 'asc',
      startDate,
      endDate,
      status,
      ownerId,
      keyword,
    } = searchDto;

    const filter: any = {};

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        filter.date.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.date.$lte = new Date(endDate);
      }
    }

    if (status) {
      filter.status = status;
    }

    if (ownerId) {
      filter.interviewerId = new Types.ObjectId(ownerId);
    }

    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    sort.startTime = 1;

    const [data, total] = await Promise.all([
      this.scheduleModel
        .find(filter)
        .populate('interviewerId', 'name email')
        .populate('interviewId')
        .sort(sort)
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .exec(),
      this.scheduleModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findAvailableSchedules(interviewerId?: string, date?: string): Promise<Schedule[]> {
    const filter: any = {
      status: ScheduleStatus.AVAILABLE,
    };

    if (interviewerId) {
      filter.interviewerId = new Types.ObjectId(interviewerId);
    }

    if (date) {
      filter.date = new Date(date);
    } else {
      filter.date = { $gte: new Date() };
    }

    return this.scheduleModel
      .find(filter)
      .populate('interviewerId', 'name email')
      .sort({ date: 1, startTime: 1 })
      .exec();
  }

  async findScheduleById(id: string): Promise<Schedule | null> {
    return this.scheduleModel
      .findById(id)
      .populate('interviewerId', 'name email')
      .populate('interviewId')
      .exec();
  }

  async updateSchedule(id: string, updateScheduleDto: UpdateScheduleDto, operatorId: string): Promise<Schedule> {
    const schedule = await this.scheduleModel.findById(id).exec();
    if (!schedule) {
      throw new NotFoundException('档期不存在');
    }

    if (schedule.status === ScheduleStatus.BOOKED && schedule.interviewId) {
      throw new ConflictException('已预约的档期不能修改');
    }

    if (updateScheduleDto.date || updateScheduleDto.startTime || updateScheduleDto.endTime) {
      const date = updateScheduleDto.date || schedule.date.toISOString().split('T')[0];
      const startTime = updateScheduleDto.startTime || schedule.startTime;
      const endTime = updateScheduleDto.endTime || schedule.endTime;

      const hasConflict = await this.checkScheduleConflict(
        schedule.interviewerId.toString(),
        date,
        startTime,
        endTime,
        id,
      );
      if (hasConflict) {
        throw new ConflictException('该时间段已有档期安排');
      }
    }

    const updated = await this.scheduleModel
      .findByIdAndUpdate(id, updateScheduleDto, { new: true, runValidators: true })
      .exec();

    await this.operationLogsService.create({
      userId: operatorId,
      operationType: OperationType.UPDATE,
      module: 'schedules',
      targetId: id,
      details: updateScheduleDto,
      ip: 'localhost',
    });

    return updated;
  }

  async deleteSchedule(id: string, operatorId: string): Promise<Schedule> {
    const schedule = await this.scheduleModel.findById(id).exec();
    if (!schedule) {
      throw new NotFoundException('档期不存在');
    }

    if (schedule.status === ScheduleStatus.BOOKED && schedule.interviewId) {
      throw new ConflictException('已预约的档期不能删除');
    }

    await this.scheduleModel.findByIdAndDelete(id).exec();

    await this.operationLogsService.create({
      userId: operatorId,
      operationType: OperationType.DELETE,
      module: 'schedules',
      targetId: id,
      details: { date: schedule.date, startTime: schedule.startTime },
      ip: 'localhost',
    });

    return schedule;
  }

  async getInterviewerStats(interviewerId: string): Promise<any> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);

    const monthCount = await this.scheduleModel.countDocuments({
      interviewerId: new Types.ObjectId(interviewerId),
      status: ScheduleStatus.BOOKED,
      date: { $gte: startOfMonth, $lt: endOfMonth },
    }).exec();

    const totalCount = await this.scheduleModel.countDocuments({
      interviewerId: new Types.ObjectId(interviewerId),
      status: ScheduleStatus.BOOKED,
    }).exec();

    const upcomingCount = await this.scheduleModel.countDocuments({
      interviewerId: new Types.ObjectId(interviewerId),
      status: { $in: [ScheduleStatus.AVAILABLE, ScheduleStatus.BOOKED] },
      date: { $gte: new Date() },
    }).exec();

    return {
      monthlyScheduled: monthCount,
      totalScheduled: totalCount,
      upcomingScheduled: upcomingCount,
    };
  }

  async initDefaultSchedules() {
    const count = await this.scheduleModel.countDocuments().exec();
    if (count > 0) return;

    const interviewers = await this.userModel
      .find({ role: Role.INTERVIEWER, isActive: true })
      .exec();

    if (interviewers.length === 0) return;

    const timeSlots = [
      '09:00-10:00',
      '10:00-11:00',
      '11:00-12:00',
      '14:00-15:00',
      '15:00-16:00',
      '16:00-17:00',
      '17:00-18:00',
    ];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const interviewer of interviewers) {
      for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
        const date = new Date(today);
        date.setDate(date.getDate() + dayOffset);
        const dayOfWeek = date.getDay();
        
        if (dayOfWeek === 0 || dayOfWeek === 6) continue;

        for (const slot of timeSlots) {
          const [startTime, endTime] = slot.split('-');
          if (!startTime || !endTime) continue;

          const schedule = new this.scheduleModel({
            interviewerId: interviewer._id,
            date: new Date(date),
            startTime,
            endTime,
            status: ScheduleStatus.AVAILABLE,
            location: '会议室A',
            notes: dayOffset === 0 ? '当日可预约档期' : '',
          });
          await schedule.save();
        }
      }
    }

    console.log('默认档期已初始化');
  }
}
