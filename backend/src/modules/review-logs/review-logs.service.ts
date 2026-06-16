import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ReviewLog } from './schemas/review-log.schema';
import { CreateReviewLogDto, QueryReviewLogDto } from './dto/review-log.dto';
import { PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class ReviewLogsService {
  constructor(
    @InjectModel(ReviewLog.name) private reviewLogModel: Model<ReviewLog>,
  ) {}

  async create(
    createReviewLogDto: CreateReviewLogDto,
    reviewerId: string,
    isDemo: boolean = false,
  ): Promise<ReviewLog> {
    const log = new this.reviewLogModel({
      ...createReviewLogDto,
      draftId: new Types.ObjectId(createReviewLogDto.draftId),
      reviewerId: new Types.ObjectId(reviewerId),
      isDemo,
    });
    return log.save();
  }

  async findAll(queryDto: QueryReviewLogDto): Promise<PaginatedResult<ReviewLog>> {
    const { page = 1, pageSize = 10, draftId, reviewerId, action, startDate, endDate, includeDemo } = queryDto;
    const query: any = {};

    if (!includeDemo) {
      query.isDemo = false;
    }

    if (draftId) {
      query.draftId = new Types.ObjectId(draftId);
    }
    if (reviewerId) {
      query.reviewerId = new Types.ObjectId(reviewerId);
    }
    if (action) {
      query.action = action;
    }
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    const total = await this.reviewLogModel.countDocuments(query);
    const list = await this.reviewLogModel
      .find(query)
      .populate('draftId', 'title status')
      .populate('reviewerId', 'username email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .exec();
    return { list, total, page, pageSize };
  }

  async findByDraftId(draftId: string): Promise<ReviewLog[]> {
    return this.reviewLogModel
      .find({ draftId: new Types.ObjectId(draftId) })
      .populate('reviewerId', 'username email')
      .sort({ createdAt: -1 })
      .exec();
  }
}
