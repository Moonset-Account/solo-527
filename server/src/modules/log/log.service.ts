import { Injectable } from '@nestjs/common';
import { type Types } from 'mongoose';
import { LogModel } from '../../schemas/log.schema.js';
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
  async create(
    type: LogType,
    operator: Types.ObjectId,
    targetId: Types.ObjectId,
    field: string,
    oldValue: any,
    newValue: any,
  ): Promise<ILog> {
    const log = new LogModel({
      type,
      operator,
      targetId,
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
      LogModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .populate('operator', 'name username'),
      LogModel.countDocuments(filter),
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
