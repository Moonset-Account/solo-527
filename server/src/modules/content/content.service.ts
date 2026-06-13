import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Content, ContentDocument } from './schemas/content.schema';
import { ContentStatus } from '../../common/enums';
import {
  CreateContentDto,
  UpdateContentDto,
  QueryContentDto,
  SubmitReviewDto,
  HandleExceptionDto,
} from './dto/content.dto';
import { PaginatedResult } from '../../common/dto/pagination.dto';
import * as dayjs from 'dayjs';

@Injectable()
export class ContentService {
  constructor(@InjectModel(Content.name) private contentModel: Model<ContentDocument>) {}

  async create(dto: CreateContentDto): Promise<Content> {
    const content = new this.contentModel({
      ...dto,
      status: ContentStatus.DRAFT,
      history: [
        {
          field: 'status',
          oldValue: null,
          newValue: ContentStatus.DRAFT,
          operator: dto.creator,
          operatedAt: new Date(),
          remark: '创建草稿',
        },
      ],
    });
    return content.save();
  }

  async findAll(query: QueryContentDto): Promise<PaginatedResult<Content>> {
    const { page = 1, pageSize = 20, keyword, status, assignee, creator, startDate, endDate, reviewFlowId, isException } = query;
    const filter: any = { deletedAt: null };

    if (keyword) {
      filter.$or = [
        { title: { $regex: keyword, $options: 'i' } },
        { topic: { $regex: keyword, $options: 'i' } },
      ];
    }
    if (status) filter.status = status;
    if (assignee) filter.assignee = assignee;
    if (creator) filter.creator = creator;
    if (reviewFlowId) filter.reviewFlowId = reviewFlowId;
    if (isException !== undefined) filter.isException = isException;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = dayjs(startDate).startOf('day').toDate();
      if (endDate) filter.createdAt.$lte = dayjs(endDate).endOf('day').toDate();
    }

    const [list, total] = await Promise.all([
      this.contentModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .populate('targetPlatforms')
        .populate('materialId')
        .populate('scheduleId')
        .exec(),
      this.contentModel.countDocuments(filter),
    ]);

    return { list, total, page, pageSize };
  }

  async findOne(id: string): Promise<Content> {
    const content = await this.contentModel
      .findById(id)
      .populate('targetPlatforms')
      .populate('materialId')
      .populate('scheduleId')
      .exec();
    if (!content || content.deletedAt) {
      throw new NotFoundException('内容不存在');
    }
    return content;
  }

  async update(id: string, dto: UpdateContentDto, operator: string): Promise<Content> {
    const content = await this.findOne(id);
    const history = [...content.history];

    for (const key of Object.keys(dto)) {
      const oldValue = content[key];
      const newValue = dto[key];
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        history.push({
          field: key,
          oldValue,
          newValue,
          operator,
          operatedAt: new Date(),
        });
      }
    }

    return this.contentModel.findByIdAndUpdate(
      id,
      { ...dto, history, updatedAt: new Date() },
      { new: true },
    );
  }

  async submitReview(id: string, dto: SubmitReviewDto): Promise<Content> {
    const content = await this.findOne(id);
    const history = [...content.history];

    history.push({
      field: 'status',
      oldValue: content.status,
      newValue: ContentStatus.SUBMITTED,
      operator: dto.operator,
      operatedAt: new Date(),
      remark: dto.remark || '提交审稿',
    });

    return this.contentModel.findByIdAndUpdate(
      id,
      {
        status: ContentStatus.SUBMITTED,
        currentReviewNodeIndex: 0,
        history,
        updatedAt: new Date(),
      },
      { new: true },
    );
  }

  async handleException(id: string, dto: HandleExceptionDto): Promise<Content> {
    const content = await this.findOne(id);
    const history = [...content.history];

    history.push({
      field: 'exceptionConclusion',
      oldValue: content.exceptionConclusion,
      newValue: dto.conclusion,
      operator: dto.handler,
      operatedAt: new Date(),
      remark: '异常处理结论',
    });

    return this.contentModel.findByIdAndUpdate(
      id,
      {
        exceptionConclusion: dto.conclusion,
        exceptionHandler: dto.handler,
        isException: false,
        history,
        updatedAt: new Date(),
      },
      { new: true },
    );
  }

  async remove(id: string, operator: string): Promise<void> {
    const content = await this.findOne(id);
    await this.contentModel.findByIdAndUpdate(id, {
      deletedAt: new Date(),
      history: [
        ...content.history,
        {
          field: 'deletedAt',
          oldValue: null,
          newValue: new Date(),
          operator,
          operatedAt: new Date(),
          remark: '删除内容',
        },
      ],
    });
  }
}
