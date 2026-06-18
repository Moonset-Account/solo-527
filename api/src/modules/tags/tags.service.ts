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

  async findAll(group?: string) {
    const filter: any = {};
    if (group) filter.group = group;
    const data = await this.tagModel.find(filter).sort({ group: 1, name: 1 }).lean();
    return data.map((d: any) => ({ ...d, id: d._id }));
  }

  async create(createTagDto: CreateTagDto) {
    const created = new this.tagModel(createTagDto);
    const saved = await created.save();
    return { ...saved.toObject(), id: saved._id };
  }

  async update(id: string, updateTagDto: UpdateTagDto) {
    const updated = await this.tagModel
      .findByIdAndUpdate(id, updateTagDto, { new: true })
      .lean();
    if (!updated) throw new NotFoundException('标签不存在');
    const u: any = updated;
    return { ...u, id: u._id };
  }

  async batchQuery(batchQueryDto: BatchQueryTagDto) {
    const { tagIds, logic } = batchQueryDto;
    const tags = await this.tagModel.find({ _id: { $in: tagIds } }).lean();
    const tagNames = tags.map((t: any) => t.name);

    let filter: any;
    if (logic === 'AND') {
      filter = { tags: { $all: tagNames } };
    } else {
      filter = { tags: { $in: tagNames } };
    }

    const leads = await this.leadModel.find(filter).select('_id').lean();
    const leadIds = leads.map((l: any) => l._id.toString());

    return {
      count: leadIds.length,
      leadIds,
    };
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
