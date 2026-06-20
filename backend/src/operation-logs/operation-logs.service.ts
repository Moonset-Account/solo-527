import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { OperationLog, OperationLogDocument } from './schemas/operation-log.schema';
import { CreateOperationLogDto } from './dto/create-operation-log.dto';
import { SearchDto } from '../common/dto/search.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';

@Injectable()
export class OperationLogsService {
  constructor(
    @InjectModel(OperationLog.name) private operationLogModel: Model<OperationLogDocument>,
  ) {}

  async create(dto: CreateOperationLogDto): Promise<OperationLog> {
    const log = new this.operationLogModel({
      ...dto,
      userId: new Types.ObjectId(dto.userId),
      targetId: dto.targetId ? new Types.ObjectId(dto.targetId) : undefined,
    });
    return log.save();
  }

  async findAll(searchDto: SearchDto): Promise<PaginatedResult<OperationLog>> {
    const {
      page = 1,
      pageSize = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      startDate,
      endDate,
      keyword,
      ownerId,
    } = searchDto;

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

    if (ownerId) {
      filter.userId = new Types.ObjectId(ownerId);
    }

    if (keyword) {
      filter.$or = [
        { module: { $regex: keyword, $options: 'i' } },
        { operationType: { $regex: keyword, $options: 'i' } },
        { 'details': { $regex: keyword, $options: 'i' } },
      ];
    }

    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const [data, total] = await Promise.all([
      this.operationLogModel
        .find(filter)
        .populate('userId', 'name role')
        .sort(sort)
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .exec(),
      this.operationLogModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findByUserId(userId: string, limit: number = 50): Promise<OperationLog[]> {
    return this.operationLogModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('userId', 'name role')
      .exec();
  }
}
