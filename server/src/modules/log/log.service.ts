import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import type { ILog, LogType } from '../../common/types/index.js';

interface LogQueryDto {
  page?: number;
  pageSize?: number;
  type?: LogType;
  operator?: string;
  startDate?: string;
  endDate?: string;
}

@Injectable()
export class LogService {
  constructor(
    @InjectModel('Log') private readonly logModel: Model<ILog>,
  ) {}

  async create(
    type: LogType,
    operator: Types.ObjectId | string,
    targetId: Types.ObjectId | string,
    field: string,
    oldValue: any,
    newValue: any,
  ): Promise<ILog> {
    const log = new this.logModel({
      type,
      operator: new Types.ObjectId(operator),
      targetId: new Types.ObjectId(targetId),
      detail: {
        field,
        oldValue,
        newValue,
      },
    });
    return log.save();
  }

  async findAll(query: LogQueryDto) {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const filter: any = {};

    if (query.type) {
      filter.type = query.type;
    }

    if (query.operator) {
      filter.operator = query.operator;
    }

    if (query.startDate || query.endDate) {
      filter.createdAt = {};
      if (query.startDate) {
        filter.createdAt.$gte = new Date(query.startDate);
      }
      if (query.endDate) {
        filter.createdAt.$lte = new Date(query.endDate);
      }
    }

    const [list, total] = await Promise.all([
      this.logModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .populate('operator', 'name username'),
      this.logModel.countDocuments(filter),
    ]);

    return {
      list,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }
}
