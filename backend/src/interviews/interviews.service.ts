import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Interview, InterviewDocument } from './schemas/interview.schema';
import { CreateInterviewDto, QuickCreateInterviewDto } from './dto/create-interview.dto';
import { UpdateInterviewDto, UpdateInterviewStatusDto } from './dto/update-interview.dto';
import { SearchDto } from '../common/dto/search.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import { InterviewStatus } from '../common/enums/interview-status.enum';
import { OperationLogsService } from '../operation-logs/operation-logs.service';
import { OperationType } from '../common/enums/operation-type.enum';
import { Schedule, ScheduleStatus } from '../interviewers/schemas/schedule.schema';

@Injectable()
export class InterviewsService {
  constructor(
    @InjectModel(Interview.name) private interviewModel: Model<InterviewDocument>,
    @InjectModel(Schedule.name) private scheduleModel: Model<any>,
    private operationLogsService: OperationLogsService,
  ) {}

  async create(createInterviewDto: CreateInterviewDto, operatorId: string): Promise<Interview> {
    const { scheduleId, interviewerId, interviewDate, startTime, endTime } = createInterviewDto;

    const schedule = await this.scheduleModel.findById(scheduleId).exec();
    if (!schedule) {
      throw new NotFoundException('档期不存在');
    }

    if (schedule.status === ScheduleStatus.BOOKED) {
      throw new ConflictException('该档期已被预约');
    }

    if (schedule.status === ScheduleStatus.UNAVAILABLE) {
      throw new ConflictException('该档期不可用');
    }

    const interview = new this.interviewModel({
      ...createInterviewDto,
      interviewerId: new Types.ObjectId(interviewerId),
      scheduleId: new Types.ObjectId(scheduleId),
      interviewDate: new Date(interviewDate),
      createdBy: new Types.ObjectId(operatorId),
      status: InterviewStatus.SCHEDULED,
    });

    const saved = await interview.save();

    schedule.status = ScheduleStatus.BOOKED;
    schedule.interviewId = saved._id;
    await schedule.save();

    await this.operationLogsService.create({
      userId: operatorId,
      operationType: OperationType.CREATE,
      module: 'interviews',
      targetId: saved._id.toString(),
      details: {
        candidateName: saved.candidateName,
        interviewDate,
        startTime,
        endTime,
      },
      ip: 'localhost',
    });

    return saved;
  }

  async quickCreate(dto: QuickCreateInterviewDto, operatorId: string): Promise<Interview> {
    let schedule: any;

    if (dto.scheduleId) {
      schedule = await this.scheduleModel.findById(dto.scheduleId).exec();
      if (!schedule) {
        throw new NotFoundException('指定的档期不存在');
      }
      if (schedule.status !== ScheduleStatus.AVAILABLE) {
        throw new ConflictException('该档期不可用或已被预约');
      }
    } else {
      const [startTime, endTime] = dto.timeSlot.split('-');
      if (!startTime || !endTime) {
        throw new BadRequestException('时间段格式不正确，应为 HH:mm-HH:mm');
      }

      schedule = await this.scheduleModel.findOne({
        interviewerId: new Types.ObjectId(dto.interviewerId),
        date: new Date(dto.interviewDate),
        startTime,
        endTime,
        status: ScheduleStatus.AVAILABLE,
      }).exec();

      if (!schedule) {
        throw new ConflictException('该时间段没有可用档期');
      }
    }

    return this.create(
      {
        ...dto,
        scheduleId: schedule._id.toString(),
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        interviewDate: dto.interviewDate,
      },
      operatorId,
    );
  }

  async findAll(searchDto: SearchDto, currentUser?: any): Promise<PaginatedResult<Interview>> {
    const {
      page = 1,
      pageSize = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      startDate,
      endDate,
      status,
      ownerId,
      keyword,
      statuses,
    } = searchDto;

    const filter: any = {};

    if (startDate || endDate) {
      filter.interviewDate = {};
      if (startDate) {
        filter.interviewDate.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.interviewDate.$lte = new Date(endDate);
      }
    }

    if (status) {
      filter.status = status;
    }

    if (statuses && statuses.length > 0) {
      filter.status = { $in: statuses };
    }

    if (ownerId) {
      filter.interviewerId = new Types.ObjectId(ownerId);
    } else if (currentUser && currentUser.role === 'interviewer') {
      filter.interviewerId = new Types.ObjectId(currentUser.id);
    }

    if (keyword) {
      filter.$or = [
        { candidateName: { $regex: keyword, $options: 'i' } },
        { candidatePhone: { $regex: keyword, $options: 'i' } },
        { position: { $regex: keyword, $options: 'i' } },
        { 'skills': { $regex: keyword, $options: 'i' } },
      ];
    }

    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const [data, total] = await Promise.all([
      this.interviewModel
        .find(filter)
        .populate('interviewerId', 'name email')
        .populate('scheduleId')
        .sort(sort)
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .exec(),
      this.interviewModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findById(id: string): Promise<Interview | null> {
    return this.interviewModel
      .findById(id)
      .populate('interviewerId', 'name email')
      .populate('scheduleId')
      .populate('createdBy', 'name')
      .exec();
  }

  async update(id: string, updateInterviewDto: UpdateInterviewDto, operatorId: string): Promise<Interview> {
    const interview = await this.interviewModel.findById(id).exec();
    if (!interview) {
      throw new NotFoundException('面试记录不存在');
    }

    const updated = await this.interviewModel
      .findByIdAndUpdate(id, updateInterviewDto, { new: true, runValidators: true })
      .exec();

    await this.operationLogsService.create({
      userId: operatorId,
      operationType: OperationType.UPDATE,
      module: 'interviews',
      targetId: id,
      details: updateInterviewDto,
      ip: 'localhost',
    });

    return updated;
  }

  async updateStatus(id: string, dto: UpdateInterviewStatusDto, operatorId: string): Promise<Interview> {
    const interview = await this.interviewModel.findById(id).exec();
    if (!interview) {
      throw new NotFoundException('面试记录不存在');
    }

    const updateData: any = { status: dto.status };

    if (dto.status === InterviewStatus.CHECKED_IN && !interview.checkInTime) {
      updateData.checkInTime = new Date();
    }
    if (dto.status === InterviewStatus.IN_PROGRESS && !interview.startInterviewTime) {
      updateData.startInterviewTime = new Date();
    }
    if (dto.status === InterviewStatus.COMPLETED && !interview.endInterviewTime) {
      updateData.endInterviewTime = new Date();
    }

    const updated = await this.interviewModel
      .findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
      .exec();

    const operationType = dto.status === InterviewStatus.CHECKED_IN 
      ? OperationType.CHECKIN 
      : OperationType.UPDATE;

    await this.operationLogsService.create({
      userId: operatorId,
      operationType,
      module: 'interviews',
      targetId: id,
      details: { status: dto.status, remark: dto.remark },
      ip: 'localhost',
    });

    return updated;
  }

  async checkIn(id: string, operatorId: string): Promise<Interview> {
    return this.updateStatus(id, { status: InterviewStatus.CHECKED_IN }, operatorId);
  }

  async cancel(id: string, operatorId: string, reason?: string): Promise<Interview> {
    const interview = await this.interviewModel.findById(id).exec();
    if (!interview) {
      throw new NotFoundException('面试记录不存在');
    }

    if (interview.status === InterviewStatus.COMPLETED) {
      throw new ConflictException('已完成的面试不能取消');
    }

    const updated = await this.interviewModel
      .findByIdAndUpdate(
        id,
        {
          status: InterviewStatus.CANCELLED,
          remark: reason,
        },
        { new: true, runValidators: true },
      )
      .exec();

    const schedule = await this.scheduleModel.findById(interview.scheduleId).exec();
    if (schedule) {
      schedule.status = ScheduleStatus.AVAILABLE;
      schedule.interviewId = undefined;
      await schedule.save();
    }

    await this.operationLogsService.create({
      userId: operatorId,
      operationType: OperationType.UPDATE,
      module: 'interviews',
      targetId: id,
      details: { status: InterviewStatus.CANCELLED, reason },
      ip: 'localhost',
    });

    return updated;
  }

  async getTodayInterviews(interviewerId?: string): Promise<Interview[]> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setHours(23, 59, 59, 999);

    const filter: any = {
      interviewDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $nin: [InterviewStatus.CANCELLED, InterviewStatus.NO_SHOW] },
    };

    if (interviewerId) {
      filter.interviewerId = new Types.ObjectId(interviewerId);
    }

    return this.interviewModel
      .find(filter)
      .populate('interviewerId', 'name')
      .sort({ startTime: 1 })
      .exec();
  }

  async getStatistics(startDate?: string, endDate?: string): Promise<any> {
    const filter: any = {};

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }

    const total = await this.interviewModel.countDocuments(filter).exec();
    const byStatus = await this.interviewModel.aggregate([
      { $match: filter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const byResult = await this.interviewModel.aggregate([
      { $match: { ...filter, hireResult: { $exists: true } } },
      { $group: { _id: '$hireResult', count: { $sum: 1 } } },
    ]);

    return {
      total,
      byStatus,
      byResult,
    };
  }
}
