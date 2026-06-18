import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Lead, LeadDocument } from './lead.schema.js';
import { CreateLeadDto } from './dto/create-lead.dto.js';
import { UpdateLeadDto } from './dto/update-lead.dto.js';
import { BatchTagDto } from './dto/batch-tag.dto.js';
import { QueryLeadDto } from './dto/query-lead.dto.js';

@Injectable()
export class LeadsService {
  constructor(@InjectModel(Lead.name) private leadModel: Model<LeadDocument>) {}

  async create(createLeadDto: CreateLeadDto): Promise<LeadDocument> {
    const data: any = { ...createLeadDto };
    if (createLeadDto.assignedTo) {
      data.assignedTo = new Types.ObjectId(createLeadDto.assignedTo);
    }
    const created = new this.leadModel(data);
    return created.save();
  }

  async findAll(query: QueryLeadDto) {
    const filter: any = {};

    if (query.status) filter.status = query.status;
    if (query.source) filter.source = query.source;
    if (query.assignedTo) filter.assignedTo = new Types.ObjectId(query.assignedTo);
    if (query.tag) filter.tags = query.tag;

    if (query.keyword) {
      filter.$or = [
        { customerName: { $regex: query.keyword, $options: 'i' } },
        { phone: { $regex: query.keyword, $options: 'i' } },
      ];
    }

    if (query.startDate || query.endDate) {
      filter.createdAt = {};
      if (query.startDate) filter.createdAt.$gte = new Date(query.startDate);
      if (query.endDate) filter.createdAt.$lte = new Date(query.endDate);
    }

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.leadModel
        .find(filter)
        .populate('assignedTo', 'name role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.leadModel.countDocuments(filter),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<LeadDocument> {
    const lead = await this.leadModel
      .findById(id)
      .populate('assignedTo', 'name role')
      .lean();
    if (!lead) throw new NotFoundException('线索不存在');
    return lead;
  }

  async update(id: string, updateLeadDto: UpdateLeadDto): Promise<LeadDocument> {
    const data: any = { ...updateLeadDto };
    if (updateLeadDto.assignedTo) {
      data.assignedTo = new Types.ObjectId(updateLeadDto.assignedTo);
    }
    const updated = await this.leadModel
      .findByIdAndUpdate(id, data, { new: true })
      .populate('assignedTo', 'name role')
      .lean();
    if (!updated) throw new NotFoundException('线索不存在');
    return updated;
  }

  async batchTag(batchTagDto: BatchTagDto) {
    const { leadIds, tags } = batchTagDto;
    const objectIds = leadIds.map((id) => new Types.ObjectId(id));
    await this.leadModel.updateMany(
      { _id: { $in: objectIds } },
      { $addToSet: { tags: { $each: tags } } },
    );
    return { message: '批量标记成功', count: leadIds.length };
  }
}
