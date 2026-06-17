import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Maintenance, MaintenanceStatus } from './maintenance.schema';
import { CreateMaintenanceDto, UpdateMaintenanceDto } from './dto/maintenance.dto';
import { ConfigStatus } from '../common/decorators/config-status.enum';

function generateOrderNo(): string {
  const d = new Date();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `BX${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}${rand}`;
}

@Injectable()
export class MaintenanceService {
  constructor(@InjectModel(Maintenance.name) private model: Model<Maintenance>) {}

  async create(dto: CreateMaintenanceDto, createdBy: Types.ObjectId): Promise<Maintenance> {
    const doc = new this.model({ ...dto, orderNo: generateOrderNo(), createdBy, updatedBy: createdBy });
    return doc.save();
  }

  async findAll(q: any): Promise<{ data: Maintenance[]; total: number }> {
    const page = q.page || 1, limit = q.limit || 20;
    const filter: any = {};
    if (q.status) filter.status = q.status;
    if (q.configStatus) filter.configStatus = q.configStatus;
    if (q.location) filter.location = { $regex: q.location, $options: 'i' };
    const [data, total] = await Promise.all([
      this.model.find(filter).skip((page - 1) * limit).limit(limit)
        .populate('createdBy updatedBy assignee handleLogs.operator', 'realName username')
        .sort({ createdAt: -1 }),
      this.model.countDocuments(filter),
    ]);
    return { data, total };
  }

  async findOne(id: string): Promise<Maintenance> {
    const doc = await this.model.findById(id).populate('createdBy updatedBy assignee handleLogs.operator', 'realName username');
    if (!doc) throw new NotFoundException('报修单不存在');
    return doc;
  }

  async update(id: string, dto: UpdateMaintenanceDto, updatedBy: Types.ObjectId): Promise<Maintenance> {
    const doc = await this.model.findById(id);
    if (!doc) throw new NotFoundException('报修单不存在');
    const { handleContent, ...rest } = dto;
    Object.assign(doc, { ...rest, updatedBy });
    if (handleContent) {
      doc.handleLogs.push({ date: new Date(), content: handleContent, operator: updatedBy });
    }
    if (dto.status === MaintenanceStatus.COMPLETED && !doc.completedAt) {
      doc.completedAt = new Date();
    }
    return doc.save();
  }

  async updateConfigStatus(id: string, status: ConfigStatus, updatedBy: Types.ObjectId): Promise<Maintenance> {
    const doc = await this.model.findByIdAndUpdate(id, { configStatus: status, updatedBy }, { new: true });
    if (!doc) throw new NotFoundException('报修单不存在');
    return doc;
  }
}
