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

    const leadCount = await this.leadModel.countDocuments({ tags: name });

    const leads = await this.leadModel
      .find({ tags: name })
      .select('customerName phone status source')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return {
      tag,
      leadCount,
      recentLeads: leads,
    };
  }
}
