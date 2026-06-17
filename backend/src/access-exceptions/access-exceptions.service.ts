import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AccessException, ExceptionStatus } from './access-exception.schema';
import { CreateAccessExceptionDto, UpdateAccessExceptionDto } from './dto/access-exception.dto';
import { ConfigStatus } from '../common/decorators/config-status.enum';

function generateRecordNo(): string {
  const d = new Date();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `YC${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}${rand}`;
}

@Injectable()
export class AccessExceptionsService {
  constructor(@InjectModel(AccessException.name) private model: Model<AccessException>) {}

  async create(dto: CreateAccessExceptionDto, createdBy: Types.ObjectId): Promise<AccessException> {
    const doc = new this.model({
      ...dto,
      recordNo: generateRecordNo(),
      currentOwner: dto.currentOwner ? new Types.ObjectId(dto.currentOwner) : undefined,
      createdBy,
      updatedBy: createdBy,
    });
    return doc.save();
  }

  async findAll(q: any): Promise<{ data: AccessException[]; total: number }> {
    const page = q.page || 1, limit = q.limit || 20;
    const filter: any = {};
    if (q.type) filter.type = q.type;
    if (q.status) filter.status = q.status;
    if (q.severity) filter.severity = q.severity;
    if (q.configStatus) filter.configStatus = q.configStatus;
    if (q.location) filter.location = { $regex: q.location, $options: 'i' };
    if (q.currentOwner) filter.currentOwner = new Types.ObjectId(q.currentOwner);
    const [data, total] = await Promise.all([
      this.model.find(filter).skip((page - 1) * limit).limit(limit)
        .populate('currentOwner createdBy updatedBy processLogs.handler', 'realName username')
        .sort({ occurrenceTime: -1 }),
      this.model.countDocuments(filter),
    ]);
    return { data, total };
  }

  async findOne(id: string): Promise<AccessException> {
    const doc = await this.model.findById(id)
      .populate('currentOwner createdBy updatedBy processLogs.handler', 'realName username');
    if (!doc) throw new NotFoundException('异常记录不存在');
    return doc;
  }

  async update(id: string, dto: UpdateAccessExceptionDto, updatedBy: Types.ObjectId): Promise<AccessException> {
    const doc = await this.model.findById(id);
    if (!doc) throw new NotFoundException('异常记录不存在');
    const { processContent, currentOwner, ...rest } = dto;
    Object.assign(doc, { ...rest, updatedBy });
    if (currentOwner) doc.currentOwner = new Types.ObjectId(currentOwner);
    if (processContent) {
      doc.processLogs.push({
        date: new Date(),
        content: processContent,
        handler: updatedBy,
        status: dto.status,
      });
    }
    if (dto.status === ExceptionStatus.RESOLVED && !doc.resolvedAt) {
      doc.resolvedAt = new Date();
    }
    return doc.save();
  }

  async updateConfigStatus(id: string, status: ConfigStatus, updatedBy: Types.ObjectId): Promise<AccessException> {
    const doc = await this.model.findByIdAndUpdate(id, { configStatus: status, updatedBy }, { new: true });
    if (!doc) throw new NotFoundException('异常记录不存在');
    return doc;
  }

  async statistics(): Promise<any> {
    const [byType, byStatus, bySeverity, byMonth] = await Promise.all([
      this.model.aggregate([{ $group: { _id: '$type', count: { $sum: 1 } } }]),
      this.model.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      this.model.aggregate([{ $group: { _id: '$severity', count: { $sum: 1 } } }]),
      this.model.aggregate([
        {
          $project: {
            yearMonth: {
              $dateToString: { format: '%Y-%m', date: '$occurrenceTime' },
            },
          },
        },
        { $group: { _id: '$yearMonth', count: { $sum: 1 } } },
        { $sort: { _id: -1 } },
        { $limit: 6 },
      ]),
    ]);
    return { byType, byStatus, bySeverity, byMonth };
  }
}
