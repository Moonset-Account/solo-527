import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OperationLog, OperationLogDocument, OperationType } from './operation-log.schema';

@Injectable()
export class OperationLogsService {
  constructor(
    @InjectModel('OperationLog') private operationLogModel: Model<OperationLogDocument>,
  ) {}

  async create(log: Partial<OperationLog>): Promise<OperationLog> {
    const operationLog = new this.operationLogModel(log);
    return operationLog.save();
  }

  async logOperation(
    operatorId: string,
    operatorName: string,
    operatorRole: string,
    operationType: OperationType,
    module: string,
    description: string,
    options: {
      targetId?: string;
      targetName?: string;
      beforeData?: Record<string, any>;
      afterData?: Record<string, any>;
      ip?: string;
      userAgent?: string;
    } = {},
  ): Promise<OperationLog> {
    const log = new this.operationLogModel({
      operatorId,
      operatorName,
      operatorRole,
      operationType,
      module,
      description,
      ...options,
    });
    return log.save();
  }

  async findAll(query: any = {}): Promise<OperationLog[]> {
    const filter: any = {};
    
    if (query.operatorId) {
      filter.operatorId = query.operatorId;
    }
    if (query.module) {
      filter.module = query.module;
    }
    if (query.operationType) {
      filter.operationType = query.operationType;
    }
    if (query.startDate && query.endDate) {
      filter.createdAt = {
        $gte: new Date(query.startDate),
        $lte: new Date(query.endDate),
      };
    }

    return this.operationLogModel
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(query.limit ? parseInt(query.limit, 10) : 100)
      .exec();
  }

  async findById(id: string): Promise<OperationLog | null> {
    return this.operationLogModel.findById(id).exec();
  }

  async getRecentLogs(limit: number = 20): Promise<OperationLog[]> {
    return this.operationLogModel
      .find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  async getLogsByModule(module: string, limit: number = 50): Promise<OperationLog[]> {
    return this.operationLogModel
      .find({ module })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  async getStats(days: number = 7): Promise<{
    total: number;
    byType: Record<string, number>;
    byModule: Record<string, number>;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await this.operationLogModel.find({
      createdAt: { $gte: startDate },
    }).exec();

    const byType: Record<string, number> = {};
    const byModule: Record<string, number> = {};

    for (const log of logs) {
      byType[log.operationType] = (byType[log.operationType] || 0) + 1;
      byModule[log.module] = (byModule[log.module] || 0) + 1;
    }

    return {
      total: logs.length,
      byType,
      byModule,
    };
  }
}
