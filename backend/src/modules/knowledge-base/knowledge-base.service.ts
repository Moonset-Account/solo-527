import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { KnowledgeBase } from './schemas/knowledge-base.schema';
import { CreateKnowledgeBaseDto, UpdateKnowledgeBaseDto, QueryKnowledgeBaseDto } from './dto/knowledge-base.dto';
import { PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class KnowledgeBaseService {
  constructor(
    @InjectModel(KnowledgeBase.name) private knowledgeBaseModel: Model<KnowledgeBase>,
  ) {}

  async create(
    createKnowledgeBaseDto: CreateKnowledgeBaseDto,
    userId: string,
  ): Promise<KnowledgeBase> {
    const item = new this.knowledgeBaseModel({
      ...createKnowledgeBaseDto,
      createdBy: new Types.ObjectId(userId),
    });
    return item.save();
  }

  async findAll(queryDto: QueryKnowledgeBaseDto): Promise<PaginatedResult<KnowledgeBase>> {
    const { page = 1, pageSize = 10, category, isActive, keyword, tag } = queryDto;
    const query: any = {};
    if (category) {
      query.category = category;
    }
    if (isActive !== undefined) {
      query.isActive = isActive;
    }
    if (keyword) {
      query.$or = [
        { title: { $regex: keyword, $options: 'i' } },
        { content: { $regex: keyword, $options: 'i' } },
      ];
    }
    if (tag) {
      query.tags = { $in: [tag] };
    }
    const total = await this.knowledgeBaseModel.countDocuments(query);
    const list = await this.knowledgeBaseModel
      .find(query)
      .populate('createdBy', 'username email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .exec();
    return { list, total, page, pageSize };
  }

  async findOne(id: string): Promise<KnowledgeBase> {
    const item = await this.knowledgeBaseModel
      .findById(id)
      .populate('createdBy', 'username email')
      .exec();
    if (!item) {
      throw new NotFoundException('知识库条目不存在');
    }
    return item;
  }

  async update(
    id: string,
    updateKnowledgeBaseDto: UpdateKnowledgeBaseDto,
  ): Promise<KnowledgeBase> {
    const item = await this.knowledgeBaseModel
      .findByIdAndUpdate(id, updateKnowledgeBaseDto, { new: true })
      .populate('createdBy', 'username email')
      .exec();
    if (!item) {
      throw new NotFoundException('知识库条目不存在');
    }
    return item;
  }

  async remove(id: string): Promise<void> {
    const result = await this.knowledgeBaseModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('知识库条目不存在');
    }
  }
}
