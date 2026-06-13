import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ReviewFlow, ReviewFlowDocument } from './schemas/review-flow.schema';
import { ReviewRecord, ReviewRecordDocument, ReviewAction } from './schemas/review-record.schema';
import { Content, ContentDocument } from '../content/schemas/content.schema';
import { ContentStatus } from '../../common/enums';
import {
  CreateReviewFlowDto,
  UpdateReviewFlowDto,
  QueryReviewRecordDto,
  CreateReviewRecordDto,
} from './dto/review.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class ReviewService {
  constructor(
    @InjectModel(ReviewFlow.name) private reviewFlowModel: Model<ReviewFlowDocument>,
    @InjectModel(ReviewRecord.name) private reviewRecordModel: Model<ReviewRecordDocument>,
    @InjectModel(Content.name) private contentModel: Model<ContentDocument>,
  ) {}

  async createFlow(dto: CreateReviewFlowDto): Promise<ReviewFlow> {
    const flow = new this.reviewFlowModel(dto);
    return flow.save();
  }

  async findAllFlows(): Promise<ReviewFlow[]> {
    return this.reviewFlowModel.find({ deletedAt: null }).sort({ createdAt: -1 }).exec();
  }

  async findActiveFlows(): Promise<ReviewFlow[]> {
    return this.reviewFlowModel.find({ deletedAt: null, isActive: true }).sort({ createdAt: -1 }).exec();
  }

  async findOneFlow(id: string): Promise<ReviewFlow> {
    const flow = await this.reviewFlowModel.findById(id).exec();
    if (!flow || flow.deletedAt) {
      throw new NotFoundException('审稿流程不存在');
    }
    return flow;
  }

  async updateFlow(id: string, dto: UpdateReviewFlowDto): Promise<ReviewFlow> {
    await this.findOneFlow(id);
    return this.reviewFlowModel.findByIdAndUpdate(id, { ...dto, updatedAt: new Date() }, { new: true });
  }

  async removeFlow(id: string): Promise<void> {
    await this.findOneFlow(id);
    await this.reviewFlowModel.findByIdAndUpdate(id, { deletedAt: new Date() });
  }

  async createReviewRecord(dto: CreateReviewRecordDto): Promise<ReviewRecord> {
    const record = new this.reviewRecordModel(dto);
    await record.save();

    const content = await this.contentModel.findById(dto.contentId);
    if (content) {
      const history = [...content.history];
      history.push({
        field: 'review',
        oldValue: content.status,
        newValue: dto.action,
        operator: dto.reviewer,
        operatedAt: new Date(),
        remark: `${dto.nodeName}: ${dto.action === ReviewAction.APPROVE ? '通过' : dto.action === ReviewAction.REJECT ? '驳回' : '转交'}${dto.comment ? ' - ' + dto.comment : ''}`,
      });

      let newStatus = content.status;
      let nextNodeIndex = content.currentReviewNodeIndex;

      if (dto.action === ReviewAction.REJECT) {
        newStatus = ContentStatus.REJECTED;
      } else if (dto.action === ReviewAction.APPROVE) {
        const flow = await this.reviewFlowModel.findById(dto.flowId);
        if (flow && dto.nodeIndex >= flow.nodes.length - 1) {
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
      });
    }

    return record;
  }

  async findReviewRecords(query: QueryReviewRecordDto): Promise<PaginatedResult<ReviewRecord>> {
    const { page = 1, pageSize = 20, contentId, reviewer } = query;
    const filter: any = { deletedAt: null };
    if (contentId) filter.contentId = contentId;
    if (reviewer) filter.reviewer = reviewer;

    const [list, total] = await Promise.all([
      this.reviewRecordModel.find(filter).sort({ reviewedAt: -1 }).skip((page - 1) * pageSize).limit(pageSize).exec(),
      this.reviewRecordModel.countDocuments(filter),
    ]);

    return { list, total, page, pageSize };
  }
}
