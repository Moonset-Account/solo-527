import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog, AuditLogDocument } from './schemas/audit-log.schema';
import { CreateAuditLogDto, QueryAuditDto } from './dto/audit.dto';

@Injectable()
export class AuditService {
  constructor(@InjectModel(AuditLog.name) private auditModel: Model<AuditLogDocument>) {}

  async create(dto: CreateAuditLogDto): Promise<AuditLog> {
    const log = new this.auditModel(dto);
    return log.save();
  }

  async findAll(query: QueryAuditDto): Promise<{ list: AuditLog[]; total: number }> {
    const { module, action, targetId, operatorId, startTime, endTime, page, pageSize } = query;
    const filter: any = {};

    if (module) filter.module = module;
    if (action) filter.action = action;
    if (targetId) filter.targetId = targetId;
    if (operatorId) filter.operatorId = operatorId;
    if (startTime || endTime) {
      filter.createdAt = {};
      if (startTime) filter.createdAt.$gte = new Date(startTime);
      if (endTime) filter.createdAt.$lte = new Date(endTime);
    }

    const [list, total] = await Promise.all([
      this.auditModel
        .find(filter)
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .sort({ createdAt: -1 })
        .exec(),
      this.auditModel.countDocuments(filter),
    ]);

    return { list, total };
  }

  async findByTarget(targetId: string, module?: string): Promise<AuditLog[]> {
    const filter: any = { targetId };
    if (module) filter.module = module;
    return this.auditModel.find(filter).sort({ createdAt: -1 }).limit(100).exec();
  }
}
