import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CallLog } from './schemas/call-log.schema';
import { CreateCallLogDto, QueryCallLogDto } from './dto/call-log.dto';
import { PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class CallLogsService {
  constructor(
    @InjectModel(CallLog.name) private callLogModel: Model<CallLog>,
  ) {}

  async create(
    createCallLogDto: CreateCallLogDto,
    userId: string,
    isDemo: boolean = false,
  ): Promise<CallLog> {
    const log = new this.callLogModel({
      ...createCallLogDto,
      userId: new Types.ObjectId(userId),
      isDemo,
    });
    return log.save();
  }

  async findAll(queryDto: QueryCallLogDto, userId?: string, userRole?: string): Promise<PaginatedResult<CallLog>> {
    const { page = 1, pageSize = 10, type, startDate, endDate, includeDemo } = queryDto;
    const query: any = {};

    if (!includeDemo) {
      query.isDemo = false;
    }

    if (userRole !== 'admin' && userId) {
      query.userId = new Types.ObjectId(userId);
    } else if (queryDto.userId) {
      query.userId = new Types.ObjectId(queryDto.userId);
    }

    if (type) {
      query.type = type;
    }
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    const total = await this.callLogModel.countDocuments(query);
    const list = await this.callLogModel
      .find(query)
      .populate('userId', 'username email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .exec();
    return { list, total, page, pageSize };
  }
}
