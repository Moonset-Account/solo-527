import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PromptTemplate } from './schemas/prompt-template.schema';
import { CreatePromptTemplateDto, UpdatePromptTemplateDto, QueryPromptTemplateDto } from './dto/prompt-template.dto';
import { PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class PromptTemplatesService {
  constructor(
    @InjectModel(PromptTemplate.name) private promptTemplateModel: Model<PromptTemplate>,
  ) {}

  async create(
    createPromptTemplateDto: CreatePromptTemplateDto,
    userId: string,
  ): Promise<PromptTemplate> {
    const template = new this.promptTemplateModel({
      ...createPromptTemplateDto,
      createdBy: new Types.ObjectId(userId),
    });
    return template.save();
  }

  async findAll(queryDto: QueryPromptTemplateDto): Promise<PaginatedResult<PromptTemplate>> {
    const { page = 1, pageSize = 10, category, isActive, keyword } = queryDto;
    const query: any = {};
    if (category) {
      query.category = category;
    }
    if (isActive !== undefined) {
      query.isActive = isActive;
    }
    if (keyword) {
      query.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { content: { $regex: keyword, $options: 'i' } },
      ];
    }
    const total = await this.promptTemplateModel.countDocuments(query);
    const list = await this.promptTemplateModel
      .find(query)
      .populate('createdBy', 'username email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .exec();
    return { list, total, page, pageSize };
  }

  async findOne(id: string): Promise<PromptTemplate> {
    const template = await this.promptTemplateModel
      .findById(id)
      .populate('createdBy', 'username email')
      .exec();
    if (!template) {
      throw new NotFoundException('模板不存在');
    }
    return template;
  }

  async update(
    id: string,
    updatePromptTemplateDto: UpdatePromptTemplateDto,
  ): Promise<PromptTemplate> {
    const template = await this.promptTemplateModel
      .findByIdAndUpdate(id, updatePromptTemplateDto, { new: true })
      .populate('createdBy', 'username email')
      .exec();
    if (!template) {
      throw new NotFoundException('模板不存在');
    }
    return template;
  }

  async remove(id: string): Promise<void> {
    const result = await this.promptTemplateModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('模板不存在');
    }
  }
}
