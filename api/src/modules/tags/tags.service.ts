import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tag, TagDocument } from './tag.schema.js';
import { CreateTagDto } from './dto/create-tag.dto.js';
import { UpdateTagDto } from './dto/update-tag.dto.js';
import { BatchQueryTagDto } from './dto/batch-query-tag.dto.js';
import { Lead, LeadDocument } from '../leads/lead.schema.js';

@Injectable()
export class TagsService {
  constructor(
    @InjectModel(Tag.name) private tagModel: Model<TagDocument>,
    @InjectModel(Lead.name) private leadModel: Model<LeadDocument>,
  ) {}

  async findAll() {
    return this.tagModel.find().sort({ group: 1, name: 1 }).lean();
  }

  async create(createTagDto: CreateTagDto) {
    const created = new this.tagModel(createTagDto);
    return created.save();
  }

  async update(id: string, updateTagDto: UpdateTagDto) {
    const updated = await this.tagModel
      .findByIdAndUpdate(id, updateTagDto, { new: true })
      .lean();
    if (!updated) throw new NotFoundException('标签不存在');
    return updated;
  }

  async batchQuery(batchQueryDto: BatchQueryTagDto) {
    return this.tagModel.find({ name: { $in: batchQueryDto.names } }).lean();
  }

  async getProfile(name: string) {
    const tag = await this.tagModel.findOne({ name }).lean();
    if (!tag) throw new NotFoundException('标签不存在');

    const leads = await this.leadModel.find({ tags: name }).lean();
    const leadCount = leads.length;

    const statusLabels: Record<string, string> = {
      new: '新线索', contacted: '已联系', measured: '已量房',
      quoted: '已报价', contracted: '已签约', lost: '已流失',
    };
    const statusCounts: Record<string, number> = {};
    for (const lead of leads) {
      const label = statusLabels[lead.status] || '其他';
      statusCounts[label] = (statusCounts[label] || 0) + 1;
    }

    const radarAxes = Object.keys(statusLabels).map((s) => statusLabels[s]);
    const radar = radarAxes.map((axis) => ({
      axis,
      value: leadCount > 0
        ? Math.round(((statusCounts[axis] || 0) / leadCount) * 100)
        : 0,
    }));

    const sourceCounts: Record<string, number> = {};
    for (const lead of leads) {
      sourceCounts[lead.source] = (sourceCounts[lead.source] || 0) + 1;
    }
    const distribution = Object.entries(sourceCounts).map(([source, count]) => ({ source, count }));

    return { radar, distribution };
  }
}
