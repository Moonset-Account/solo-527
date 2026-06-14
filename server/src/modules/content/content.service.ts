import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Content, ContentDocument } from './schemas/content.schema';
import { ContentStatus } from '@/common/enums';
import {
  CreateContentDto,
  UpdateContentDto,
  QueryContentDto,
  SubmitReviewDto,
  HandleExceptionDto,
} from './dto/content.dto';
import { PaginatedResult } from '@/common/dto/pagination';
import { isDbReady, safeQuery } from '@/common/db-utils';
import dayjs from 'dayjs';

@Injectable()
export class ContentService {
  constructor(@InjectModel(Content.name) private contentModel: Model<ContentDocument>) {}

  private emptyList(page: number, pageSize: number): PaginatedResult<Content> {
    return { list: [], total: 0, page, pageSize };
  }

  async create(dto: CreateContentDto): Promise<Content> {
    if (!isDbReady()) {
      return {
        _id: 'mock_' + Date.now(),
        ...dto,
        status: ContentStatus.DRAFT,
        history: [],
        attachments: [],
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;
    }
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
    const saved = await content.save();
    return saved.toObject() as any;
  }

  async findAll(query: QueryContentDto): Promise<PaginatedResult<Content>> {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    if (!isDbReady()) return this.emptyList(page, pageSize);

    const keyword = query.keyword;
    const { status, assignee, creator, startDate, endDate, reviewFlowId, isException } = query;
    const filter: any = {};
    filter.deletedAt = null;

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

    return safeQuery(async () => {
      const [list, total] = await Promise.all([
        this.contentModel
          .find(filter)
          .sort({ createdAt: -1 })
          .skip((page - 1) * pageSize)
          .limit(pageSize)
          .populate('targetPlatforms')
          .populate('materialId')
          .populate('scheduleId')
          .lean()
          .exec(),
        this.contentModel.countDocuments(filter),
      ]);
      return { list: list as any, total, page, pageSize };
    }, this.emptyList(page, pageSize));
  }

  async findOne(id: string): Promise<Content> {
    if (!isDbReady()) {
      return {
        _id: id,
        title: '示例选题（数据库暂不可用）',
        topic: '示例脚本内容...',
        status: ContentStatus.DRAFT,
        creator: 'demo',
        history: [],
        attachments: [],
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;
    }
    const content = (await this.contentModel
      .findById(id)
      .populate('targetPlatforms')
      .populate('materialId')
      .populate('scheduleId')
      .lean()
      .exec()) as any;
    if (!content || content.deletedAt) {
      throw new NotFoundException('内容不存在');
    }
    return content;
  }

  async update(id: string, dto: UpdateContentDto, operator: string): Promise<Content> {
    if (!isDbReady()) {
      const base = await this.findOne(id);
      return { ...base, ...dto, updatedAt: new Date() } as any;
    }
    const content: any = await this.findOne(id);
    const history = [...(content.history || [])];

    for (const key of Object.keys(dto)) {
      const oldValue = content[key];
      const newValue = (dto as any)[key];
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

    const updated = await this.contentModel
      .findByIdAndUpdate(
        id,
        { ...dto, history, updatedAt: new Date() } as any,
        { new: true },
      )
      .lean()
      .exec();
    return updated as any;
  }

  async submitReview(id: string, dto: SubmitReviewDto): Promise<Content> {
    if (!isDbReady()) {
      const base = await this.findOne(id);
      return { ...base, status: ContentStatus.SUBMITTED, updatedAt: new Date() } as any;
    }
    const content: any = await this.findOne(id);
    const history = [...(content.history || [])];

    history.push({
      field: 'status',
      oldValue: content.status,
      newValue: ContentStatus.SUBMITTED,
      operator: dto.operator,
      operatedAt: new Date(),
      remark: dto.remark || '提交审稿',
    });

    const updated = await this.contentModel
      .findByIdAndUpdate(
        id,
        {
          status: ContentStatus.SUBMITTED,
          currentReviewNodeIndex: 0,
          history,
          updatedAt: new Date(),
        } as any,
        { new: true },
      )
      .lean()
      .exec();
    return updated as any;
  }

  async handleException(id: string, dto: HandleExceptionDto): Promise<Content> {
    if (!isDbReady()) {
      const base = await this.findOne(id);
      return {
        ...base,
        isException: false,
        exceptionConclusion: dto.conclusion,
        exceptionHandler: dto.handler,
        updatedAt: new Date(),
      } as any;
    }
    const content: any = await this.findOne(id);
    const history = [...(content.history || [])];

    history.push({
      field: 'exceptionConclusion',
      oldValue: content.exceptionConclusion,
      newValue: dto.conclusion,
      operator: dto.handler,
      operatedAt: new Date(),
      remark: '异常处理结论',
    });

    const updated = await this.contentModel
      .findByIdAndUpdate(
        id,
        {
          exceptionConclusion: dto.conclusion,
          exceptionHandler: dto.handler,
          isException: false,
          history,
          updatedAt: new Date(),
        } as any,
        { new: true },
      )
      .lean()
      .exec();
    return updated as any;
  }

  async remove(id: string, operator: string): Promise<void> {
    if (!isDbReady()) return;
    const content: any = await this.findOne(id);
    const history = [...(content.history || [])];
    history.push({
      field: 'deletedAt',
      oldValue: null,
      newValue: new Date(),
      operator,
      operatedAt: new Date(),
      remark: '删除内容',
    });
    await this.contentModel.findByIdAndUpdate(id, { deletedAt: new Date(), history } as any);
  }

  async findExceptions(query: QueryContentDto): Promise<PaginatedResult<Content>> {
    const q: QueryContentDto = { ...query, isException: true };
    return this.findAll(q);
  }
}
