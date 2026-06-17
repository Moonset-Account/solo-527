import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Inspection, InspectionStatus } from './inspection.schema';
import { CreateInspectionDto, UpdateInspectionDto } from './dto/inspection.dto';
import { ConfigStatus } from '../common/decorators/config-status.enum';

function generateTaskNo(): string {
  const d = new Date();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `XJ${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}${rand}`;
}

@Injectable()
export class InspectionService {
  constructor(@InjectModel(Inspection.name) private model: Model<Inspection>) {}

  async create(dto: CreateInspectionDto, createdBy: Types.ObjectId): Promise<Inspection> {
    const doc = new this.model({
      ...dto,
      taskNo: generateTaskNo(),
      inspector: dto.inspector ? new Types.ObjectId(dto.inspector) : undefined,
      createdBy,
      updatedBy: createdBy,
    });
    return doc.save();
  }

  async findAll(q: any): Promise<{ data: Inspection[]; total: number }> {
    const page = q.page || 1, limit = q.limit || 20;
    const filter: any = {};
    if (q.status) filter.status = q.status;
    if (q.configStatus) filter.configStatus = q.configStatus;
    if (q.area) filter.area = { $regex: q.area, $options: 'i' };
    const [data, total] = await Promise.all([
      this.model.find(filter).skip((page - 1) * limit).limit(limit)
        .populate('inspector createdBy updatedBy', 'realName username')
        .sort({ scheduledAt: -1 }),
      this.model.countDocuments(filter),
    ]);
    return { data, total };
  }

  async findOne(id: string): Promise<Inspection> {
    const doc = await this.model.findById(id).populate('inspector createdBy updatedBy', 'realName username');
    if (!doc) throw new NotFoundException('巡检任务不存在');
    return doc;
  }

  async update(id: string, dto: UpdateInspectionDto, updatedBy: Types.ObjectId): Promise<Inspection> {
    const doc = await this.model.findById(id);
    if (!doc) throw new NotFoundException('巡检任务不存在');
    const updateData: any = { ...dto, updatedBy };
    if (dto.inspector) updateData.inspector = new Types.ObjectId(dto.inspector);
    if (dto.status === InspectionStatus.COMPLETED && !doc.completedAt) {
      updateData.completedAt = new Date();
    }
    if (dto.checkItems) {
      updateData.checkItems = dto.checkItems.map(item => ({ ...item, checkedAt: new Date() }));
    }
    Object.assign(doc, updateData);
    return doc.save();
  }

  async updateConfigStatus(id: string, status: ConfigStatus, updatedBy: Types.ObjectId): Promise<Inspection> {
    const doc = await this.model.findByIdAndUpdate(id, { configStatus: status, updatedBy }, { new: true });
    if (!doc) throw new NotFoundException('巡检任务不存在');
    return doc;
  }
}
