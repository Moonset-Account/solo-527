import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ReviewFlow, ReviewFlowDocument } from './schemas/review-flow.schema';
import { ReviewRecord, ReviewRecordDocument, ReviewAction } from './schemas/review-record.schema';
import { Content, ContentDocument } from '../content/schemas/content.schema';
import { ContentStatus } from '@/common/enums';
import {
  CreateReviewFlowDto,
  UpdateReviewFlowDto,
  QueryReviewRecordDto,
  CreateReviewRecordDto,
} from './dto/review.dto';
import { PaginatedResult } from '@/common/dto/pagination';
import { isDbReady, safeQuery } from '@/common/db-utils';

@Injectable()
export class ReviewService {
  constructor(
    @InjectModel(ReviewFlow.name) private reviewFlowModel: Model<ReviewFlowDocument>,
    @InjectModel(ReviewRecord.name) private reviewRecordModel: Model<ReviewRecordDocument>,
    @InjectModel(Content.name) private contentModel: Model<ContentDocument>,
  ) {}

  async createFlow(dto: CreateReviewFlowDto): Promise<ReviewFlow> {
    if (!isDbReady()) {
      return {
        _id: 'mock_flow_' + Date.now(),
        ...dto,
        nodes: dto.nodes || [],
        isActive: true,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;
    }
    const flow = new this.reviewFlowModel(dto);
    const saved = await flow.save();
    return saved.toObject() as any;
  }

  async findAllFlows(): Promise<ReviewFlow[]> {
    return safeQuery(
      () =>
        this.reviewFlowModel
          .find({ deletedAt: null })
          .sort({ createdAt: -1 })
          .lean()
          .exec() as any,
      [],
    );
  }

  async findActiveFlows(): Promise<ReviewFlow[]> {
    return safeQuery(
      () =>
        this.reviewFlowModel
          .find({ deletedAt: null, isActive: true })
          .sort({ createdAt: -1 })
          .lean()
          .exec() as any,
      [],
    );
  }

  async findOneFlow(id: string): Promise<ReviewFlow> {
    if (!isDbReady()) {
      return {
        _id: id,
        name: '示例审稿流程（DB离线）',
        nodes: [
          { name: '初审', type: 'single', assignee: 'zhangsan' },
          { name: '复审', type: 'single', assignee: 'lisi' },
        ],
        isActive: true,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;
    }
    const flow: any = await this.reviewFlowModel.findById(id).lean().exec();
    if (!flow || flow.deletedAt) throw new NotFoundException('审稿流程不存在');
    return flow;
  }

  async updateFlow(id: string, dto: UpdateReviewFlowDto): Promise<ReviewFlow> {
    if (!isDbReady()) {
      const base = await this.findOneFlow(id);
      return { ...base, ...dto, updatedAt: new Date() } as any;
    }
    await this.findOneFlow(id);
    return this.reviewFlowModel
      .findByIdAndUpdate(id, { ...dto, updatedAt: new Date() } as any, { new: true })
      .lean()
      .exec() as any;
  }

  async removeFlow(id: string): Promise<void> {
    if (!isDbReady()) return;
    await this.findOneFlow(id);
    await this.reviewFlowModel.findByIdAndUpdate(id, { deletedAt: new Date() } as any);
  }

  async createReviewRecord(dto: CreateReviewRecordDto): Promise<ReviewRecord> {
    if (!isDbReady()) {
      return {
        _id: 'mock_record_' + Date.now(),
        ...dto,
        reviewedAt: new Date(),
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;
    }
    const record = new this.reviewRecordModel(dto);
    await record.save();

    const content: any = await this.contentModel.findById(dto.contentId).lean().exec();
    if (content) {
      const history = [...(content.history || [])];
      history.push({
        field: 'review',
        oldValue: content.status,
        newValue: dto.action,
        operator: dto.reviewer,
        operatedAt: new Date(),
        remark: `${dto.nodeName}: ${
          dto.action === ReviewAction.APPROVE
            ? '通过'
            : dto.action === ReviewAction.REJECT
              ? '驳回'
              : '转交'
        }${dto.comment ? ' - ' + dto.comment : ''}`,
      });

      let newStatus = content.status;
      let nextNodeIndex = content.currentReviewNodeIndex;

      if (dto.action === ReviewAction.REJECT) {
        newStatus = ContentStatus.REJECTED;
      } else if (dto.action === ReviewAction.APPROVE) {
        const flow: any = await this.reviewFlowModel.findById(dto.flowId).lean().exec();
        if (flow && dto.nodeIndex >= (flow.nodes?.length || 0) - 1) {
          newStatus = ContentStatus.APPROVED;
        } else {
          nextNodeIndex = dto.nodeIndex + 1;
          newStatus = ContentStatus.REVIEWING;
        }
      }

      await this.contentModel.findByIdAndUpdate(dto.contentId, {
        status: newStatus,
        currentReviewNodeIndex: nextNodeIndex,
        history,
        updatedAt: new Date(),
      } as any);
    }

    return record.toObject() as any;
  }

  async findReviewRecords(query: QueryReviewRecordDto): Promise<PaginatedResult<ReviewRecord>> {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const empty: PaginatedResult<ReviewRecord> = { list: [], total: 0, page, pageSize };
    if (!isDbReady()) return empty;

    const { contentId, reviewer } = query;
    const filter: any = { deletedAt: null };
    if (contentId) filter.contentId = contentId;
    if (reviewer) filter.reviewer = reviewer;

    return safeQuery(async () => {
      const [list, total] = await Promise.all([
        this.reviewRecordModel
          .find(filter)
          .sort({ reviewedAt: -1 })
          .skip((page - 1) * pageSize)
          .limit(pageSize)
          .lean()
          .exec(),
        this.reviewRecordModel.countDocuments(filter),
      ]);
      return { list: list as any, total, page, pageSize };
    }, empty);
  }
}
